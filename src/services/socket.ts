import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') ||
  'https://minimaxi-backend-production-3500.up.railway.app';

// Only attempt a real WebSocket connection when the backend is known to
// support it. Defaults to disabled so we don't spam the console with failed
// connection / reconnection attempts against a backend without WS support.
// Set VITE_ENABLE_SOCKET=true once the backend exposes a Socket.io endpoint.
const SOCKET_ENABLED = import.meta.env.VITE_ENABLE_SOCKET === 'true';

let socket: Socket | null = null;

// No-op stub returned when sockets are disabled. It mimics the small slice of
// the Socket API the app uses (on/off/emit/connect/disconnect) so callers can
// keep doing `connectSocket().on(...)` without null checks or runtime errors.
const noopSocket = {
  connected: false,
  on: () => noopSocket,
  off: () => noopSocket,
  emit: () => noopSocket,
  connect: () => noopSocket,
  disconnect: () => noopSocket,
} as unknown as Socket;

export const getSocket = (): Socket => {
  if (!SOCKET_ENABLED) return noopSocket;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: sessionStorage.getItem('token'),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const connectSocket = (): Socket => {
  if (!SOCKET_ENABLED) return noopSocket;

  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
};

export default { getSocket, connectSocket, disconnectSocket };
