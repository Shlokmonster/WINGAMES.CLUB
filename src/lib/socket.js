import { io } from 'socket.io-client';

const SOCKET_URL = 'https://ludo-new-production.up.railway.app';

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
}); 