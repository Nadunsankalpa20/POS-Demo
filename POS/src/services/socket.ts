import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getPosSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[POS Socket] Connected to backend server:', socket?.id);
      socket?.emit('join_terminal', 'TERM-01');
    });

    socket.on('disconnect', () => {
      console.warn('[POS Socket] Disconnected from backend server');
    });
  }

  return socket;
};
