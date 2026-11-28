const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
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
    console.log(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Join personal user room so user receives direct notifications and chat list updates
    if (socket.userId) {
      socket.join(socket.userId.toString());
      socket.join(`user_${socket.userId.toString()}`);
    }

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
        const text = data.text || data.message?.text || "";
        const recipientId = data.recipientId;
        if (!chatId || !text?.trim()) return;

        let participantIds = [socket.userId.toString()];
        if (recipientId) participantIds.push(recipientId.toString());
        if (Array.isArray(data.participants)) {
          participantIds.push(...data.participants.map((p) => (p?._id || p).toString()));
        }

        // Auto-extract both user IDs if chatId is formatted as chat_USER1_USER2 or USER1_USER2
        if (chatId) {
          const clean = chatId.replace(/^chat_/, "");
          const parts = clean.split("_");
          if (parts.length === 2 && mongoose.Types.ObjectId.isValid(parts[0]) && mongoose.Types.ObjectId.isValid(parts[1])) {
            participantIds.push(parts[0], parts[1]);
          }
        }

        const uniqueParticipants = [...new Set(participantIds)]
          .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        const message = await Message.create({
          chatId,
          senderId: socket.userId,
          text: text.trim(),
          participants: uniqueParticipants,
        });

        const populated = await Message.findById(message._id).populate(
          "senderId",
          "name email avatar role"
        );
        const senderObj = populated?.senderId || { _id: socket.userId, name: "User" };
        const payload = {
          ...message.toObject(),
          sender: senderObj,
          senderId: senderObj,
        };

        io.to(chatId).emit("receiveMessage", payload);
        io.to(chatId).emit("receive_message", payload);

        // Notify both participants directly so their conversation lists update in real-time
        for (const p of uniqueParticipants) {
          const pid = p.toString();
          io.to(pid).emit("receiveMessage", payload);
          io.to(`user_${pid}`).emit("receiveMessage", payload);
          io.to(pid).emit("conversationUpdated", payload);
          io.to(`user_${pid}`).emit("conversationUpdated", payload);
        }
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