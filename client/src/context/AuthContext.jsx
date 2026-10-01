import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('secure_exam_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('secure_exam_token') || null);
  const [showFaceEnrollPrompt, setShowFaceEnrollPrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('secure_exam_user', JSON.stringify(res.user));
          }
        } catch (e) {
          // If token expired, clear session
          if (e.status === 401 || e.status === 403) {
            logout();
          }
        }
      }
      setLoading(false);
    }
    verifySession();
  }, [token]);

  const login = (userData, userToken, promptEnrollment = false) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('secure_exam_user', JSON.stringify(userData));
    localStorage.setItem('secure_exam_token', userToken);
    if (promptEnrollment && !userData.faceEnrolled && userData.role === 'student') {
      setShowFaceEnrollPrompt(true);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('secure_exam_user');
    localStorage.removeItem('secure_exam_token');
  };

  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('secure_exam_user', JSON.stringify(updated));
      return updated;
    });
  };

  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  const canAccessAdmin = isAdmin || isFaculty;
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isFaculty,
        canAccessAdmin,
        loading,
        login,
        logout,
        updateUser,
        showFaceEnrollPrompt,
        setShowFaceEnrollPrompt
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
