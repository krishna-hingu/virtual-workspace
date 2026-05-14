import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";

console.log("SOCKET INSTANCE CREATED");
console.log("SOCKET URL:", SOCKET_URL);
console.log("ENV URL:", import.meta.env.VITE_SERVER_URL);

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export const connectSocket = () => {
  console.log("connectSocket CALLED");

  const token = localStorage.getItem("token");
  console.log("TOKEN:", token);

  console.log("Before connect:", {
    connected: socket.connected,
    active: socket.active,
    disconnected: socket.disconnected,
  });

  if (!token) {
    console.error("NO TOKEN FOUND");
    return;
  }

  // Guard: prevent duplicate socket.connect() calls
  if (socket._isConnecting) {
    console.log("Socket already connecting, skipping duplicate connect");
    return;
  }

  socket.auth = {
    token: token
  };

  if (!socket.connected) {
    socket._isConnecting = true;
    socket.connect();
    console.log("socket.connect() EXECUTED");

    // Clear connecting flag after connection attempt
    setTimeout(() => {
      socket._isConnecting = false;
    }, 1000);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

socket.on("connect", () => {
  console.log("SOCKET CONNECT SUCCESS:", socket.id);
  // user:join is now emitted from WorkspaceScene after listeners are registered
  // to prevent players:init from being sent before scene is ready
});

socket.on("disconnect", (reason) => {
  console.log("SOCKET DISCONNECTED:", reason);
});

socket.on("connect_error", (err) => {
  console.error("SOCKET CONNECT ERROR:");
  console.error(err);
});

socket.io.on("reconnect_attempt", () => {
  console.log("RECONNECT ATTEMPT");
});

export default socket;
