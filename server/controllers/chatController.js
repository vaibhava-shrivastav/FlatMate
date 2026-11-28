const mongoose = require("mongoose");
const Message = require("../models/Message");

exports.getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name avatar")
      .populate("participants", "name email avatar role");
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch chat history.", error: err.message });
  }
};

exports.getUserChats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const messages = await Message.find({
      $or: [{ participants: userId }, { senderId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("participants", "name email avatar role")
      .populate("senderId", "name email avatar role");

    const chatMap = new Map();

    for (const msg of messages) {
      if (chatMap.has(msg.chatId)) continue;

      const participants = [
        ...(msg.participants || []).filter(Boolean),
        ...(msg.senderId ? [msg.senderId] : []),
      ];
      const uniqueParticipants = participants.filter(
        (participant, index, list) =>
          participant._id &&
          list.findIndex((item) => item._id?.toString() === participant._id.toString()) === index
      );
      const otherParticipant = uniqueParticipants.find(
        (participant) => participant._id.toString() !== req.user.id
      );

      chatMap.set(msg.chatId, {
        _id: msg.chatId,
        participant: otherParticipant || {
          _id: "unknown",
          name: "Roommate Host",
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