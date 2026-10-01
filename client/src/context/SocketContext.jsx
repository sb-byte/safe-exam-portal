import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [proctoringEvents, setProctoringEvents] = useState([]);
  const [latestScoreUpdate, setLatestScoreUpdate] = useState(null);

  useEffect(() => {
    const socketBase = import.meta.env.VITE_API_URL || window.location.origin;
    const socketInstance = io(socketBase, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket.io connected:', socketInstance.id);
      setIsConnected(true);
      socketInstance.emit('join_admin_room');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Brute force alert / security intrusion alert
    socketInstance.on('SECURITY_ALERT', (alert) => {
      setSecurityAlerts(prev => [alert, ...prev.slice(0, 19)]);
    });

    // Live proctoring violations during exam
    socketInstance.on('PROCTORING_EVENT', (data) => {
      setProctoringEvents(prev => [data.event, ...prev.slice(0, 49)]);
      if (data.studentScore) {
        setLatestScoreUpdate(data.studentScore);
      }
    });

    socketInstance.on('CHEATING_SCORE_UPDATE', (score) => {
      setLatestScoreUpdate(score);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearAlert = (index) => {
    setSecurityAlerts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        securityAlerts,
        proctoringEvents,
        latestScoreUpdate,
        clearAlert
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
}
