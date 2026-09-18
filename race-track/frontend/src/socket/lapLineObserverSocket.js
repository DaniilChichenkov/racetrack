import { io } from "socket.io-client";

let lapLineObserverSocket;

export function connectLapLineObserver(accessKey) {
  lapLineObserverSocket = io("http://localhost:3000/lap-line-observer", {
    auth: {
      accessKey,
    },
    timeout: 500,
  });

  return lapLineObserverSocket;
}

export function getLapLineObserverSocket() {
  return lapLineObserverSocket;
}

export function isLapLineObserverConnected() {
  return lapLineObserverSocket?.connected === true;
}

export function disconnectLapLineObserver() {
  lapLineObserverSocket?.disconnect();
  lapLineObserverSocket = null;
}
