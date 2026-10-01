import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

// Read Client ID from .env or localStorage
const savedClientId = localStorage.getItem('secure_exam_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const GoogleConfigContext = React.createContext({
  clientId: savedClientId,
  setClientId: () => {},
});

function Root() {
  const [clientId, setClientIdState] = useState(savedClientId);

  const updateClientId = (newId) => {
    setClientIdState(newId);
    if (newId) {
      localStorage.setItem('secure_exam_google_client_id', newId);
    } else {
      localStorage.removeItem('secure_exam_google_client_id');
    }
  };

  const effectiveClientId = clientId || '1088265005952-demo.apps.googleusercontent.com';

  return (
    <GoogleConfigContext.Provider value={{ clientId, setClientId: updateClientId }}>
      <GoogleOAuthProvider clientId={effectiveClientId}>
        <App />
      </GoogleOAuthProvider>
    </GoogleConfigContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
