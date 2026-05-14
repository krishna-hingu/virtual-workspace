import { useEffect, useRef } from "react";
import socket from "../socket/socket";

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = socket;

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, []);

  return socket;
};

export const useSocketEvent = (event, callback) => {
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    }
  }, [socket, event, callback]);
};

export const useSocketEmit = () => {
  const socket = useSocket();

  return (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  };
};
