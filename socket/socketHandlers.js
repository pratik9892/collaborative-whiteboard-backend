const roomUsers = {};       // Track users per room
const roomMessages = {};    // Track messages per room

export const socketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    // =========================
    // JOIN ROOM
    // =========================
    socket.on("join-room", (roomId) => {
      if (!roomId) return;

      // Prevent duplicate join
      if (socket.roomId === roomId) {
        console.log(`Socket ${socket.id} already in room ${roomId}`);
        return;
      }

      socket.roomId = roomId;
      socket.join(roomId);

      // Init room users
      if (!roomUsers[roomId]) {
        roomUsers[roomId] = new Set();
      }

      roomUsers[roomId].add(socket.id);

      // Init messages if not exist
      if (!roomMessages[roomId]) {
        roomMessages[roomId] = [];
      }

      // 🔥 Send chat history to new user
      socket.emit("init-messages", roomMessages[roomId]);

      const count = roomUsers[roomId].size;

      console.log(`User ${socket.id} joined room ${roomId}`);
      console.log(`Room ${roomId} size:`, count);

      io.to(roomId).emit("user-count", count);
    });

    // =========================
    // DRAW EVENTS (SECURED)
    // =========================
    socket.on("draw-start", (data) => {
      const roomId = socket.roomId;
      if (!roomId) return;

      socket.to(roomId).emit("draw-start", data);
    });

    socket.on("draw-move", (data) => {
      const roomId = socket.roomId;
      if (!roomId) return;

      socket.to(roomId).emit("draw-move", data);
    });

    socket.on("draw-end", (data) => {
      const roomId = socket.roomId;
      if (!roomId) return;

      socket.to(roomId).emit("draw-end", data);
    });

    socket.on("clear-canvas", () => {
      const roomId = socket.roomId;
      if (!roomId) return;

      io.to(roomId).emit("clear-canvas");
    });

    // =========================
    // CHAT EVENTS (SECURED)
    // =========================
    socket.on("send-message", ({ message }) => {
      const roomId = socket.roomId;
      if (!roomId) return;

      // Save message
      roomMessages[roomId].push(message);

      // Send to all in room (including sender)
      io.to(roomId).emit("receive-message", message);
    });

    // =========================
    // CURSOR SYNC
    // =========================
    socket.on("cursor-move", (data) => {
      const roomId = socket.roomId;
      if (!roomId) return;

      socket.to(roomId).emit("cursor-update", data);
    });

    // =========================
    // DISCONNECT
    // =========================
    socket.on("disconnect", () => {
      const { roomId } = socket;

      if (roomId && roomUsers[roomId]) {
        roomUsers[roomId].delete(socket.id);

        // If room empty → cleanup
        if (roomUsers[roomId].size === 0) {
          delete roomUsers[roomId];
          delete roomMessages[roomId]; // 🔥 cleanup messages
        }

        const count = roomUsers[roomId]?.size || 0;
        io.to(roomId).emit("user-count", count);
      }

      console.log("Disconnected:", socket.id);
    });
  });
};