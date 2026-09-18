import { io } from "socket.io-client";

let raceControlSocket;

export function connectRaceControl(accessKey) {
  raceControlSocket = io("http://localhost:3000/race-control", {
    auth: {
      accessKey,
    },
    timeout: 500,
  });

  return raceControlSocket;
}

export function getRaceControlSocket() {
  return raceControlSocket;
}

export function isRaceControlSocketConnected() {
  return raceControlSocket?.connected === true;
}

export function disconnectRaceControl() {
  raceControlSocket?.disconnect();
  raceControlSocket = null;
}
