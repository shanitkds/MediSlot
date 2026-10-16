import { io } from "socket.io-client";
import { tokenManager } from "@/lib/auth/tokenManager";

let socketInstance = null;

export function getSocketUrl() {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_API_URL);
      return url.origin;
    } catch {
      // ignore
    }
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
}

/**
 * Returns a reusable singleton Socket.IO client connection.
 * Prevents multiple duplicate socket instances across the application.
 */
export function getSocket() {
  if (socketInstance) {
    return socketInstance;
  }

  const socketUrl = getSocketUrl();

  socketInstance = io(socketUrl, {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ["websocket", "polling"],
    auth: (cb) => {
      const token = tokenManager.getAccessToken();
      cb({ token });
    },
  });

  return socketInstance;
}

/**
 * Connect the socket instance if disconnected.
 */
export function connectSocket() {
  const socket = getSocket();
  if (socket && !socket.connected) {
    socket.connect();
  }
  return socket;
}

/**
 * Disconnect and tear down the socket instance (e.g. on user logout).
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Returns whether the socket is currently connected.
 */
export function isSocketConnected() {
  return Boolean(socketInstance && socketInstance.connected);
}
