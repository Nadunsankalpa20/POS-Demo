import { io, Socket } from 'socket.io-client';
import { useLiveStore } from '../store/liveStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getBackOfficeSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[BackOffice Socket] Connected to backend:', socket?.id);
      socket?.emit('join_backoffice');
    });

    socket.on('STOCK_UPDATED', (payload: any) => {
      console.log('[BackOffice Socket] STOCK_UPDATED:', payload);
      const { addNotification } = useLiveStore.getState();

      if (payload.newStock <= 0) {
        addNotification(
          'STOCK_OUT',
          '⚠ Out of Stock Alert',
          `${payload.productName} has reached 0 units!`
        );
      } else if (payload.change < 0 && payload.newStock <= 10) {
        addNotification(
          'STOCK_LOW',
          '⚠ Low Stock Warning',
          `${payload.productName} is running low (${payload.newStock} remaining)`
        );
      } else if (payload.movementType === 'STOCK_IN') {
        addNotification(
          'STOCK_IN',
          '✓ Stock In Recorded',
          `Added ${payload.change} units to ${payload.productName} (Now: ${payload.newStock})`
        );
      }
    });

    socket.on('SALE_COMPLETED', (payload: any) => {
      console.log('[BackOffice Socket] SALE_COMPLETED:', payload);
      const { addNotification } = useLiveStore.getState();
      const sale = payload.sale;
      addNotification(
        'SALE',
        '✓ New Sale Completed',
        `Invoice ${sale?.invoiceNumber || ''} • Rs. ${(sale?.total || 0).toFixed(2)} (${sale?.cashierName || 'Cashier'})`
      );
    });

    socket.on('SALE_VOIDED', (payload: any) => {
      console.log('[BackOffice Socket] SALE_VOIDED:', payload);
      const { addNotification } = useLiveStore.getState();
      addNotification(
        'VOID',
        'Invoice Voided',
        `Invoice ${payload.invoiceNumber} was voided and items were returned to inventory.`
      );
    });
  }

  return socket;
};
