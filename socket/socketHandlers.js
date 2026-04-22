const roomUsers = {};
const roomMessages = {};

export const socketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    // =========================
    // JOIN ROOM
    // =========================
    socket.on("join-room", (roomId) => {
      if (!roomId) return;

      socket.roomId = roomId;
      socket.join(roomId);

      console.log(`Socket ${socket.id} joined room ${roomId}`);

      if (!roomUsers[roomId]) {
        roomUsers[roomId] = new Set();
      }

      roomUsers[roomId].add(socket.id);

      if (!roomMessages[roomId]) {
        roomMessages[roomId] = [];
      }

      socket.emit("init-messages", roomMessages[roomId]);

      io.to(roomId).emit("user-count", roomUsers[roomId].size);
    });

    // =========================
    // ✏️ FREE DRAW
    // =========================
    socket.on("draw-start", (data) => {
      if (!socket.roomId) return;
      console.log("line start");
      
      socket.to(socket.roomId).emit("draw-start", {
        ...data,
        userId: socket.id,
      });
    });

    socket.on("draw-move", (data) => {
      if (!socket.roomId) return;

      socket.to(socket.roomId).emit("draw-move", {
        ...data,
        userId: socket.id,
      });
    });

    socket.on("draw-end", () => {
      if (!socket.roomId) return;

      socket.to(socket.roomId).emit("draw-end", {
        userId: socket.id,
      });
    });

    // =========================
    // 🔥 SHAPES (FIXED)
    // =========================
    socket.on("draw-shape", (shape) => {
      console.log("SERVER RECEIVED SHAPE:", shape);
      const roomId = shape?.roomId || socket.roomId;

      if (!roomId) {
        console.log("❌ draw-shape failed: no roomId", shape);
        return;
      }

      console.log("✅ Broadcasting shape to room:", roomId);

      socket.to(roomId).emit("draw-shape", {
        ...shape,
        userId: socket.id,
      });
    });

    // =========================
    // CLEAR
    // =========================
    socket.on("clear-canvas", () => {
      if (!socket.roomId) return;

      io.to(socket.roomId).emit("clear-canvas");
    });

    // =========================
    // CHAT
    // =========================
    socket.on("send-message", ({ message }) => {
      if (!socket.roomId) return;

      roomMessages[socket.roomId].push(message);
      io.to(socket.roomId).emit("receive-message", message);
    });

    // =========================
    // CURSOR
    // =========================
    socket.on("cursor-move", (data) => {
      if (!socket.roomId) return;

      socket.to(socket.roomId).emit("cursor-update", {
        ...data,
        userId: socket.id,
      });
    });

    // =========================
    // DISCONNECT
    // =========================
    socket.on("disconnect", () => {
      const { roomId } = socket;

      if (roomId && roomUsers[roomId]) {
        roomUsers[roomId].delete(socket.id);

        if (roomUsers[roomId].size === 0) {
          delete roomUsers[roomId];
          delete roomMessages[roomId];
        }

        io.to(roomId).emit("user-count", roomUsers[roomId]?.size || 0);
      }

      console.log("Disconnected:", socket.id);
    });
  });
};