const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");

exports.getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email avatar role")
      .populate("participants", "name email avatar role");

    const formatted = messages.map((m) => {
      const obj = m.toObject();
      const senderObj =
        obj.senderId && typeof obj.senderId === "object"
          ? obj.senderId
          : { _id: obj.senderId, name: "User" };
      return {
        ...obj,
        sender: senderObj,
        senderId: senderObj,
      };
    });

    res.status(200).json({ messages: formatted });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch chat history.", error: err.message });
  }
};

exports.getUserChats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const userIdStr = req.user.id.toString();

    // Query messages where user is a participant, sender, or chatId contains user's ID
    const messages = await Message.find({
      $or: [
        { participants: userId },
        { senderId: userId },
        { chatId: { $regex: userIdStr } },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("participants", "name email avatar role")
      .populate("senderId", "name email avatar role");

    const chatMap = new Map();

    for (const msg of messages) {
      if (chatMap.has(msg.chatId)) continue;

      const allParticipants = [
        ...(msg.participants || []).filter(Boolean),
        ...(msg.senderId && typeof msg.senderId === "object" ? [msg.senderId] : []),
      ];

      // Find the other user in this conversation
      let otherParticipant = allParticipants.find(
        (p) => p._id && p._id.toString() !== userIdStr
      );

      // If still missing, check if chatId has the other user's ID: e.g. chat_ID1_ID2
      if (!otherParticipant && msg.chatId) {
        const clean = msg.chatId.replace(/^chat_/, "");
        const parts = clean.split("_");
        const otherId = parts.find((p) => p !== userIdStr && mongoose.Types.ObjectId.isValid(p));
        if (otherId) {
          try {
            const found = await User.findById(otherId).select("name email avatar role");
            if (found) otherParticipant = found;
          } catch {}
        }
      }

      chatMap.set(msg.chatId, {
        _id: msg.chatId,
        participant: otherParticipant || {
          _id: "unknown",
          name: "Roommate",
        },
        lastMessage: {
          text: msg.text,
          createdAt: msg.createdAt,
        },
        updatedAt: msg.createdAt,
        unreadCount: 0,
      });
    }

    const chats = Array.from(chatMap.values());
    res.status(200).json({ chats });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch chats.", error: err.message });
  }
};