const { io } = require("socket.io-client");

const socket = io("http://localhost:5001", {
  auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZTlkYzQzYTQxN2JhMWViMjhjMDYyNiIsImlhdCI6MTc3NjkzNDIzNiwiZXhwIjoxNzc3NTM5MDM2fQ.mhSXHhvIbLRhpUqlcLJRBqYmbO_5Th1tHIC8ky4pnzg" }
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  // Send movement
  socket.emit("move", { x: Math.random() * 500, y: Math.random() * 500 });

  // Send chat
  socket.emit("chat:send", {
    content: "Hello testing!",
    position: { x: 100, y: 200 }
  });
});

// LISTENERS
socket.on("workspace:state", (data) => {
  console.log("👥 Users:", data.users);
});

socket.on("proximity:enter", (user) => {
  console.log("👤 Nearby:", user.name);
});

socket.on("chat:message", (data) => {
  console.log("💬", data.message.content);
});

// 🔥 KEEP CONNECTION ALIVE
setInterval(() => {
  socket.emit("move", {
    x: Math.random() * 500,
    y: Math.random() * 500
  });
}, 3000);