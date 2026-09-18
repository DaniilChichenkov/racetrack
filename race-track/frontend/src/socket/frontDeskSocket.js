import { io } from "socket.io-client";

let frontDeskSocket;

export function connectFrontDesk(accessKey) {
  frontDeskSocket = io("http://localhost:3000/front-desk", {
    auth: {
      accessKey,
    },
    timeout: 500,
  });

  return frontDeskSocket;
}

export function getFrontDeskSocket() {
  return frontDeskSocket;
}

export function isFrontDesSocketConnected() {
  return frontDeskSocket?.connected === true;
}

export function disconnectFrontDesk() {
  frontDeskSocket?.disconnect();
  frontDeskSocket = null;
}
