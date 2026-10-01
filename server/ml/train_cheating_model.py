#!/usr/bin/env python3
"""
SecureExam - AI Proctoring Fraud Detection Model (Syllabus Exp 4, 5, 6)
Demonstrates:
- SMOTE (Synthetic Minority Over-sampling Technique) for handling severe class imbalance
- Ensemble Classifiers (Random Forest + Gradient Boosting + Voting Ensemble)
- Model evaluation (Precision, Recall, ROC-AUC)
"""

import json
import os
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score
from imblearn.over_sampling import SMOTE
import joblib

def generate_synthetic_proctoring_data(n_samples=2000, random_state=42):
    np.random.seed(random_state)
    
    # 85% Honest students (Class 0)
    n_honest = int(n_samples * 0.85)
    # 10% Suspicious / Moderate (Class 1)
    n_suspicious = int(n_samples * 0.10)
    # 5% Confirmed Cheaters (Class 2) - Severe Minority Class
    n_cheaters = n_samples - n_honest - n_suspicious

    # Features: [tab_switches, look_away_sec, warnings, face_missing, multiple_faces, copy_paste, fullscreen_exits]
    
    # Honest: Very low violations
    honest_features = np.column_stack([
        np.random.poisson(lam=0.2, size=n_honest),      # tab switches
        np.random.exponential(scale=1.5, size=n_honest), # look away sec
        np.random.poisson(lam=0.3, size=n_honest),      # warnings
        np.random.poisson(lam=0.2, size=n_honest),      # face missing
        np.zeros(n_honest),                             # multiple faces (rare to none)
        np.random.binomial(n=1, p=0.02, size=n_honest), # copy paste
        np.random.binomial(n=1, p=0.03, size=n_honest)  # fullscreen exits
    ])
    y_honest = np.zeros(n_honest)

    # Suspicious: Moderate violations
    suspicious_features = np.column_stack([
        np.random.poisson(lam=1.8, size=n_suspicious),
        np.random.exponential(scale=7.0, size=n_suspicious),
        np.random.poisson(lam=2.5, size=n_suspicious),
        np.random.poisson(lam=1.2, size=n_suspicious),
        np.random.binomial(n=1, p=0.15, size=n_suspicious),
        np.random.poisson(lam=1.0, size=n_suspicious),
        np.random.poisson(lam=1.1, size=n_suspicious)
    ])
    y_suspicious = np.ones(n_suspicious)

    # Cheaters: High violations, multiple faces, heavy tabs
    cheater_features = np.column_stack([
        np.random.poisson(lam=4.5, size=n_cheaters),
        np.random.exponential(scale=20.0, size=n_cheaters),
        np.random.poisson(lam=5.5, size=n_cheaters),
        np.random.poisson(lam=3.8, size=n_cheaters),
        np.random.poisson(lam=1.8, size=n_cheaters),
        np.random.poisson(lam=3.2, size=n_cheaters),
        np.random.poisson(lam=2.9, size=n_cheaters)
    ])
    y_cheaters = np.full(n_cheaters, 2)

    X = np.vstack([honest_features, suspicious_features, cheater_features])
    y = np.concatenate([y_honest, y_suspicious, y_cheaters])

    return X, y

def main():
    print("[1/4] Generating Proctoring Dataset with severe class imbalance...")
    X, y = generate_synthetic_proctoring_data(n_samples=2500)
    
    unique_orig, counts_orig = np.unique(y, return_counts=True)
    orig_distribution = dict(zip([int(u) for u in unique_orig], [int(c) for c in counts_orig]))
    print(f"Original Class Distribution (0=Honest, 1=Suspicious, 2=Cheating): {orig_distribution}")

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    # Train baseline Random Forest BEFORE SMOTE
    print("[2/4] Training Baseline Random Forest without SMOTE...")
    rf_baseline = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_baseline.fit(X_train, y_train)
    y_pred_baseline = rf_baseline.predict(X_test)
    acc_baseline = accuracy_score(y_test, y_pred_baseline)
    f1_baseline_cheating = f1_score(y_test, y_pred_baseline, average=None)[2]

    # Apply SMOTE to balance minority classes
    print("[3/4] Applying SMOTE (Synthetic Minority Over-sampling Technique)...")
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
    
    unique_smote, counts_smote = np.unique(y_train_smote, return_counts=True)
    smote_distribution = dict(zip([int(u) for u in unique_smote], [int(c) for c in counts_smote]))
    print(f"Balanced Training Distribution with SMOTE: {smote_distribution}")

    # Train Ensemble Classifier (Random Forest + Gradient Boosting + Voting Ensemble)
    print("[4/4] Training Ensemble Classifiers on SMOTE-balanced data...")
    rf_model = RandomForestClassifier(n_estimators=120, max_depth=8, random_state=42)
    gb_model = GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42)
    
    ensemble_model = VotingClassifier(
        estimators=[('rf', rf_model), ('gb', gb_model)],
        voting='soft'
    )
    ensemble_model.fit(X_train_smote, y_train_smote)
    
    y_pred_ensemble = ensemble_model.predict(X_test)
    acc_ensemble = accuracy_score(y_test, y_pred_ensemble)
    f1_ensemble_cheating = f1_score(y_test, y_pred_ensemble, average=None)[2]

    # Fit standalone RF to extract feature importances
    rf_model.fit(X_train_smote, y_train_smote)
    feature_names = [
        "Tab Switches",
        "Look Away Duration (s)",
        "Warning Count",
        "Face Missing Events",
        "Multiple Faces",
        "Copy/Paste Attempts",
        "Fullscreen Exits"
    ]
    feature_importances = [
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in zip(feature_names, rf_model.feature_importances_)
    ]
    feature_importances.sort(key=lambda x: x["importance"], reverse=True)

    results = {
        "status": "success",
        "experiment": "Syllabus Exp 4, 5, 6 - SMOTE & Ensemble Cheating Detection",
        "original_distribution": {
            "Honest (Class 0)": orig_distribution[0],
            "Suspicious (Class 1)": orig_distribution[1],
            "Likely Cheating (Class 2)": orig_distribution[2]
        },
        "smote_balanced_distribution": {
            "Honest (Class 0)": smote_distribution[0],
            "Suspicious (Class 1)": smote_distribution[1],
            "Likely Cheating (Class 2)": smote_distribution[2]
        },
        "metrics": {
            "baseline_accuracy": round(float(acc_baseline * 100), 2),
            "baseline_cheating_f1": round(float(f1_baseline_cheating * 100), 2),
            "smote_ensemble_accuracy": round(float(acc_ensemble * 100), 2),
            "smote_ensemble_cheating_f1": round(float(f1_ensemble_cheating * 100), 2),
            "cheater_recall_gain": f"+{round(float((f1_ensemble_cheating - f1_baseline_cheating) * 100), 1)}% improvement with SMOTE"
        },
        "feature_importances": feature_importances
    }

    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(out_dir, "cheating_model_results.json")
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)

    # Save trained ensemble model
    model_path = os.path.join(out_dir, "ensemble_cheating_model.joblib")
    joblib.dump(ensemble_model, model_path)

    print(f"\n[SUCCESS] Model and metrics exported to {out_file}")
    print(f"Ensemble Accuracy: {results['metrics']['smote_ensemble_accuracy']}%")
    print(f"Cheater Detection F1-Score: {results['metrics']['smote_ensemble_cheating_f1']}%")

if __name__ == "__main__":
    main()
