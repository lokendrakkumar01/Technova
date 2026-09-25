import { io } from 'socket.io-client';

/**
 * Determine dynamic server URL based on runtime environment:
 * - If VITE_API_URL is configured and not localhost (e.g. deployed domain), use it.
 * - In local dev/LAN:
 *   If accessed on port 3000, connect to port 5000 on the same host (e.g. 192.168.x.x:5000)
 *   If accessed on port 5000 (production server), connect to window.location.origin
 */
const getSocketUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  const { protocol, hostname, port } = window.location;

  // If running on Vite dev server (port 3000 or similar), connect to server on port 5000
  if (port === '3000' || port === '5173') {
    return `${protocol}//${hostname}:5000`;
  }

  // Same origin (e.g. production served by Express on port 5000)
  return window.location.origin;
};

export const socket = io(getSocketUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  transports: ['websocket', 'polling'],
});

export const getSocket = () => socket;

export default socket;
