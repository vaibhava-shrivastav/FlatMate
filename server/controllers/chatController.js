const Message = require("../models/Message");

exports.getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch chat history.", error: err.message });
  }
};

exports.getUserChats = async (req, res) => {
  try {
    const chats = await Message.aggregate([
      { $match: { participants: req.user.id } },
      { $group: { _id: "$chatId", lastMessage: { $last: "$text" } } },
    ]);
    res.status(200).json({ chats });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch chats.", error: err.message });
  }
};