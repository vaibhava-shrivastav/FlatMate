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

    const joinRoom = (data) => {
      const chatId =
        typeof data === "object" ? data.chatId || data.conversationId : data;
      if (chatId) socket.join(chatId);
    };
    const leaveRoom = (data) => {
      const chatId =
        typeof data === "object" ? data.chatId || data.conversationId : data;
      if (chatId) socket.leave(chatId);
    };

    socket.on("joinChat", joinRoom);
    socket.on("join_room", joinRoom);
    socket.on("leave_room", leaveRoom);

    socket.on("sendMessage", async (data) => {
      try {
        const chatId = data.chatId || data.conversationId;
        const text = data.text;
        const recipientId = data.recipientId;
        if (!chatId || !text?.trim()) return;

        const participants = [...new Set([
          socket.userId,
          ...(data.participants || []),
          ...(recipientId ? [recipientId] : []),
        ])];

        const message = await Message.create({
          chatId,
          senderId: socket.userId,
          text: text.trim(),
          participants,
        });

        const populated = await Message.findById(message._id).populate(
          "senderId",
          "name avatar"
        );
        const payload = {
          ...message.toObject(),
          sender: populated.senderId,
        };

        io.to(chatId).emit("receiveMessage", payload);
        io.to(chatId).emit("receive_message", payload);
      } catch (err) {
        socket.emit("errorMessage", { message: "Failed to send message." });
      }
    });

    socket.on("send_message", async (data) => {
      const chatId = data.conversationId || data.chatId;
      const message = data.message;
      if (!chatId || !message?.text?.trim()) return;
      const result = {
        ...message,
        sender: message.sender || message.senderId || { _id: socket.userId },
      };
      io.to(chatId).emit("receiveMessage", result);
      io.to(chatId).emit("receive_message", result);
    });

    const handleTyping = (eventName, data) => {
      const targetRoom =
        typeof data === "object"
          ? data.chatId || data.conversationId
          : data;
      if (targetRoom) {
        socket.to(targetRoom).emit(eventName, { userId: socket.userId });
      }
    };

    socket.on("user_typing", (data) => handleTyping("user_typing", data));
    socket.on("typing", (data) => handleTyping("user_typing", data));
    socket.on("user_stop_typing", (data) => handleTyping("user_stop_typing", data));
    socket.on("stop_typing", (data) => handleTyping("user_stop_typing", data));

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err.message);
    });
  });
};