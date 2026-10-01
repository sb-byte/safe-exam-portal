# SecureExam — AI-Powered Online Exam & Job Test Proctoring Portal

> **AIACS Capstone Mini-Project**  
> An autonomous, secure online examination portal designed to mitigate impersonation fraud, unmonitored cheating, and brute-force credential intrusion.

---

## 🌟 1. System Overview

SecureExam solves two critical security vulnerabilities in remote evaluation:
1. **Fake Identity & Impersonation:** Prevents proxy candidates via 128-dimensional facial biometric verification combined with **active random liveness challenges** (blinking, head turns) to defeat static photos, printed portraits, and screen replays.
2. **Unmonitored Cheating:** Continuously audits test-takers with **compulsory camera enforcement** (immediate blocking modal if camera disconnects), **head pose & gaze deviation tracking with Web Audio warning sirens**, **Page Visibility API tab switch logging**, and **clipboard tampering prevention**.
3. **Brute-Force & Credential Stuffing Defense:** Implements a strict 3-strike policy. More than 3 wrong password attempts triggers an **instant Nodemailer security alert email** to the registered account owner and broadcasts the attacker's **IP, approximate city/region, device hardware, and browser user-agent** live to the Admin Console.

---

## 🏗️ 2. Architecture & Technology Stack

| Component | Technology | Rationale & Purpose |
|---|---|---|
| **Frontend** | React 18 + Tailwind CSS + Lucide Icons | Cybernetic, responsive UI with glassmorphism and sub-second updates |
| **Backend API** | Node.js + Express (ES Modules) | High-throughput REST API for authentication, telemetry, and exams |
| **Real-Time Feed** | Socket.io | Instant push of proctoring events and brute force alerts to Admin |
| **Database** | Persistent JSON Document Store (`data/db.json`) | Atomic, zero-config local persistence (MongoDB Atlas URI compatible) |
| **Passwords** | `bcryptjs` (Salt Rounds = 10) | One-way cryptographic hashing; plain passwords never stored |
| **Sessions** | JWT (JSON Web Tokens) | Stateless, tamper-proof bearer authentication |
| **Face Biometrics** | HTML5 Canvas Vision + 128-D Embeddings | High-dimensional spatial moment vector with Euclidean distance match |
| **Liveness & Gaze** | Real-time Eye & Head Contour Analysis | Random dynamic challenges (blink, look left/right) defeating static spoofs |
| **Proctoring Siren**| HTML5 Web Audio API | Client-side acoustic frequency sweep synthesizer (no audio files needed) |
| **Email Alerts** | Nodemailer + Ethereal Mail / SMTP | Dispatches instant alerts on &gt;3 wrong passwords with live web preview |
| **Geolocation** | IP-API Geolocation Engine | Extracts City, State, Country, and ISP from client IP |
| **Device Profiling**| `ua-parser-js` | Identifies client hardware device, operating system, and browser engine |
| **ML Engine** | Python 3 + `scikit-learn` + `imbalanced-learn` | SMOTE imbalance resampling, Ensemble Voting Classifiers & FGSM attack/defense |

---

## 🚀 3. Quick Start & Execution

### Prerequisites
- Node.js (v18+)
- Python (v3.10+) with `venv`

### Step 1: Clone / Enter Directory
```bash
cd /Users/saibhadane/Everything./AIACS_Mini_Project
```

### Step 2: Running the Servers
The backend and frontend are already configured and running:
- **Frontend URL:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5001](http://localhost:5001)

To run manually at any time:
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client
```

### Step 3: Seed Credentials
- **Admin Controller:**
  - Username: `admin`
  - Password: `admin123`
- **Candidate Demo Account:**
  - Username: `student1`
  - Password: `student123`

---

## 🎬 4. Step-by-Step Viva Demo Walkthrough

Follow these 6 exact steps from Section 11 of the project specification:

### 1. Normal Registration & Login
1. Open [http://localhost:3000](http://localhost:3000) and click **"Sign In / Register"** in the top-right navbar.
2. Select the **"Sign Up"** tab, enter name, new username, email, and password.
3. Click **"Register & Auto Log In"**.
4. The system logs you in automatically and displays the optional prompt:  
   *"Do you want to add Face Login?"* (Meets Section 4.B requirement).

### 2. Real User Face Login
1. Click **"Enable Face Login Now"** to enroll your face biometric template.
2. Position your face in the oval reticle and complete the dynamic challenge.
3. Face data is encoded into a **128-dimensional mathematical vector** (no raw photos stored, preserving biometric privacy).
4. Sign out and switch to the **"Face Only Login"** tab.
5. Enter your username, complete the random challenge (e.g. *Blink* or *Turn Head*), and verify that face authentication succeeds!

### 3. Photo Spoof Attack Rejection (Anti-Spoofing)
1. On the Face Login or Camera screen, click the **"Simulate Static Photo Attack"** button.
2. The dynamic liveness engine verifies that static photos or phone screens fail 3D parallax motion checks.
3. The system displays:  
   `⚠️ [REJECTED] Static Photo / Screen Replay Detected! Anti-spoofing filter rejected static texture.`

### 4. 4 Wrong Passwords & Intrusion Alerts
1. In the top navbar, click **"⚡ Viva Demo Tools"** &rarr; **"Trigger 4 Wrong Passwords (Email Alert)"** (or manually type wrong passwords 4 times).
2. The account owner instantly receives a **Nodemailer security alert email**:  
   `🚨 [CRITICAL ALERT] Someone is trying to log in to your SecureExam account`
3. A red security intrusion banner pops up across the top of the portal.
4. Navigate to the **Admin Dashboard** &rarr; **"1. Authentication & Suspicious Logins"** tab.
5. Click on the flagged red attempt to view the complete forensic profile:
   - Attacker IP Address
   - City, Region, Country, and ISP
   - Hardware Device Model, OS, and Browser
   - Number of attempts (4) and exact timestamp.
6. Click **"📧 Security Alerts Inbox"** in the header to view the actual dispatched HTML email with the live Ethereal inspection link!

### 5. Compulsory Camera Enforcement in Exam
1. Click **"Candidate Exam"** &rarr; **"Launch Demo Candidate Exam"**.
2. Note the live floating **"AI PROCTOR LIVE"** webcam widget in the top-right corner.
3. In the widget, click **"Turn Cam Off (Demo)"** (or disable your webcam).
4. An immediate full-screen modal blocks the page:  
   `🚫 PROCTORING CAMERA IS COMPULSORY!`
5. Notice that you cannot select answers or submit the test until you click **"Enable Camera to Continue Exam"**.

### 6. Gaze Deviation Siren, Tab Switches & Live Cheating Score
1. While taking the test:
   - **Look away** to the left or right for &gt;3 seconds (or click **"Siren Demo"** in the widget).
   - An onscreen warning modal appears and an emergency **audio siren is synthesized in real time via the Web Audio API**!
   - Switch to another browser tab: The Page Visibility API immediately logs a `TAB_SWITCH` critical flag.
   - Try right-clicking or pressing `Ctrl+C` / `Cmd+C`: Text copying is blocked with `preventDefault()`.
2. Click **"Submit Exam"** to see your final score card and **AI Cheating Risk Score**.
3. In the **Admin Dashboard** &rarr; **"3. Exam Cheating & Integrity Monitor"** tab:
   - Watch the live chronological telemetry feed showing every violation.
   - Observe the candidate's real-time Cheating Risk Score: **Honest (0-25%)**, **Suspicious (26-60%)**, or **Likely Cheating (&gt;60%)**.

---

## 🔬 5. Academic Syllabus Coverage (Experiments 1 – 8)

| Exp # | Academic Experiment | Where It Appears in SecureExam |
|---|---|---|
| **1** | **Login Attempt Analysis** | 3-strike threshold, Nodemailer alerts, Geo-IP and user-agent attacker profiling |
| **2** | **Keystroke Dynamics** | Dwell/flight key interval tracking on password entry inputs |
| **3** | **Facial Recognition** | 128-dimensional Euclidean biometric embeddings with threshold $\le 0.45$ |
| **4** | **ML Fraud Detection** | Multi-sensor telemetry anomaly detection across tab, gaze, and camera |
| **5** | **Ensemble Classifiers** | Random Forest + Gradient Boosting Voting Ensemble for cheating scoring |
| **6** | **SMOTE Resampling** | Synthetic oversampling rebalancing 85:5 honest vs cheating data to 1:1:1 ratio |
| **7** | **GAN Synthetic Faces** | Manifold perturbation simulation testing biometric boundary limits |
| **8** | **Adversarial FGSM Attack & Defense**| Fast Gradient Sign Method noise $\eta = \epsilon \cdot \text{sign}(\nabla_x \text{Loss})$; defeated by active liveness and multi-layer thresholding |

Inspect the interactive visualizers for all experiments under the **Admin Dashboard &rarr; 4. AI / Syllabus Research Lab** tab!

---

## 💬 6. Viva Defense Cheat Sheet (Section 9 Limits)

When examiners ask about technical trade-offs during the project viva:

1. **Why is 100% facial recognition accuracy impossible?**
   - *Answer:* Lighting variations, camera angles, and low-resolution sensors introduce noise. SecureExam mitigates this using a strict Euclidean distance threshold ($\le 0.45$) paired with active dynamic liveness, and reports both False Acceptance Rate (FAR) and False Rejection Rate (FRR).
2. **How accurate is IP Geolocation?**
   - *Answer:* IP Geolocation is approximate at the ISP node level. It reliably identifies the city, region, and network carrier, but cannot pinpoint an exact room address without GPS coordinates.
3. **Does looking away guarantee cheating?**
   - *Answer:* No. Natural cognitive pauses or posture adjustments cause brief gaze shifts. That is why SecureExam warns first, applies a graded penalty through an ensemble model, and retains the human proctor for the final disciplinary decision.
4. **Where did you get the cheating dataset?**
   - *Answer:* Real cheating telemetry is difficult to source ethically due to privacy laws. We generate synthetic proctoring logs and use **SMOTE (Synthetic Minority Over-sampling Technique)** to balance the minority cheating instances.
5. **How is candidate biometric privacy protected?**
   - *Answer:* We strictly adhere to privacy standards: **no raw webcam photos are saved or uploaded**. Faces are translated on the client device into a 128-element mathematical vector of numbers.
