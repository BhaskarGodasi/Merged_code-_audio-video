// utils/socket.js
// Wrapper around services/socketService.js for backward compatibility
const socketService = require('../services/socketService');

const initIO = (httpServer, options = {}) => {
  // server.js calls socketService.init directly, so this might not be needed
  // but if used elsewhere, we can redirect
  if (!socketService.io) {
    socketService.init(httpServer);
  }
  return socketService.io;
};

const getIO = () => {
  return socketService.getIO();
};

module.exports = {
  initIO,
  getIO,
};
