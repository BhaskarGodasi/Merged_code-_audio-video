import { io } from 'socket.io-client';
import { API_BASE_URL } from '../utils/constants';

const socketEndpoint = API_BASE_URL.replace(/\/api$/, '');

let socketInstance;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(socketEndpoint, {
      autoConnect: true,
    });
  }
  return socketInstance;
};

export const closeSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
