let ioInstance = null;

export function initializeSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[SOCKET CONNECTED] Client ID: ${socket.id}`);

    socket.on('join_admin_room', () => {
      socket.join('admin_dashboard');
      console.log(`[SOCKET] Admin joined admin_dashboard room: ${socket.id}`);
    });

    socket.on('join_exam_room', (data) => {
      const room = `exam_${data.studentId}`;
      socket.join(room);
      console.log(`[SOCKET] Student ${data.studentId} joined ${room}`);
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return ioInstance;
}

export function broadcastSecurityAlert(payload) {
  if (ioInstance) {
    ioInstance.to('admin_dashboard').emit('SECURITY_ALERT', payload);
    ioInstance.emit('SECURITY_ALERT_GLOBAL', payload);
  }
}

export function broadcastProctoringEvent(payload) {
  if (ioInstance) {
    ioInstance.to('admin_dashboard').emit('PROCTORING_EVENT', payload);
  }
}

export function broadcastCheatingScoreUpdate(payload) {
  if (ioInstance) {
    ioInstance.to('admin_dashboard').emit('CHEATING_SCORE_UPDATE', payload);
  }
}

export function broadcastUserUpdate(payload) {
  if (ioInstance) {
    ioInstance.to('admin_dashboard').emit('USER_UPDATED', payload);
  }
}
