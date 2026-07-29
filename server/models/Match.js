const mongoose = require("mongoose");

// Blueprint for a "Match" document in MongoDB
// (this is a CACHE — stores the AI's compatibility result between 2 users,
// so we don't call the Gemini API again and again for the same pair)
const matchSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // links to first user
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // links to second user
      required: true,
    },

    compatibilityScore: {
      type: Number,
      required: true, // 0-100 score of how compatible userA & userB are
    },
    pros: [{ type: String }], // list of reasons they'd get along
    cons: [{ type: String }], // list of reasons they might not
    vibeSummary: {
      type: String, // short AI-generated summary of the match
    },

    isFallback: {
      type: Boolean,
      default: false, // true = Gemini API failed, so we used the heuristic score instead
    },
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt
  }
);

// Ensures only ONE match document can exist per (userA, userB) pair
// (prevents duplicate entries for the same 2 people)
matchSchema.index({ userA: 1, userB: 1 }, { unique: true });

module.exports = mongoose.model("Match", matchSchema);