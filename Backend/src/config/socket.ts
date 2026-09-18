import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allows POS (port 3000) and BackOffice (port 3001)
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join_terminal', (terminalId: string) => {
      socket.join(`terminal_${terminalId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined terminal_${terminalId}`);
    });

    socket.on('join_backoffice', () => {
      socket.join('backoffice_room');
      console.log(`[Socket.IO] Socket ${socket.id} joined backoffice_room`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket first.');
  }
  return io;
};

export const broadcastEvent = (event: string, payload: any): void => {
  if (io) {
    io.emit(event, payload);
    console.log(`[Socket.IO] Broadcasted event '${event}':`, typeof payload === 'object' ? payload.type || payload.invoiceNumber || 'data' : payload);
  }
};
