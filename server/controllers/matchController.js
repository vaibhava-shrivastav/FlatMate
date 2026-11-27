const { runMatchingPipeline, getOrEvaluateMatch } = require("../services/matchingEngine");
const User = require("../models/User");

exports.getMatchesForUser = async (req, res) => {
  try {
    const results = await runMatchingPipeline(req.user.id);
    res.status(200).json({ matches: results });
  } catch (err) {
    res.status(500).json({ message: "Could not generate matches.", error: err.message });
  }
};

exports.getMatchDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(id);

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }
    if (!targetUser) {
      return res.status(404).json({ message: "Candidate user not found." });
    }

    const match = await getOrEvaluateMatch(currentUser, targetUser);
    res.status(200).json({ compatibility: match });
  } catch (err) {
    res.status(500).json({ message: "Error fetching match.", error: err.message });
  }
};