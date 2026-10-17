const mongoose = require("mongoose");

// Blueprint for a "Message" document in MongoDB
// (a single chat message between two matched users)
const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true, // speeds up "get all messages for this chat" queries
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // links to who sent this message
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // both users involved in this chat
      },
    ],
    text: {
      type: String,
      required: true, // the actual message content
    },
  },
  {
    timestamps: true, // auto-adds createdAt (useful for message order) and updatedAt
  }
);

module.exports = mongoose.model("Message", messageSchema);