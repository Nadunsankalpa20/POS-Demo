import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');

let socket: Socket | null = null;

export const getPosSocket = (): Socket => {
  if (!socket) {
    if (SOCKET_URL) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      socket.on('connect', () => {
        console.log('[POS Socket] Connected to backend server:', socket?.id);
        socket?.emit('join_terminal', 'TERM-01');
      });

      socket.on('disconnect', () => {
        console.warn('[POS Socket] Disconnected from backend server');
      });
    } else {
      socket = {
        on: () => socket,
        off: () => socket,
        emit: () => socket,
      } as unknown as Socket;
    }
  }

  return socket;
};
