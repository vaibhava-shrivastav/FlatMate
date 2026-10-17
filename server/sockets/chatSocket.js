const jwt = require("jsonwebtoken");
const Message = require("../models/Message");

module.exports = function registerChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error."));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid socket token."));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
    });

    socket.on("sendMessage", async ({ chatId, senderId, text, participants }) => {
      try {
        if (!text?.trim()) return;

        // Validate: senderId must match the authenticated socket user
        if (senderId && senderId !== socket.userId) {
          return socket.emit("errorMessage", { message: "Sender ID mismatch." });
        }

        // Use the authenticated userId as the sender (ignore client-supplied senderId)
        const message = await Message.create({
          chatId,
          senderId: socket.userId,
          text,
          participants,
        });
        io.to(chatId).emit("receiveMessage", message);
      } catch (err) {
        socket.emit("errorMessage", { message: "Failed to send message." });
      }
    });

    socket.on("user_typing", (chatId) => {
      socket.to(chatId).emit("user_typing", { userId: socket.userId });
    });

    socket.on("user_stop_typing", (chatId) => {
      socket.to(chatId).emit("user_stop_typing", { userId: socket.userId });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err.message);
    });
  });
};