const { runMatchingPipeline } = require("../services/matchingEngine");
const Match = require("../models/Match");

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
    const [first, second] = [req.user.id, id].sort();
    const match = await Match.findOne({ userA: first, userB: second });
    if (!match) return res.status(404).json({ message: "Match not found." });
    res.status(200).json(match);
  } catch (err) {
    res.status(500).json({ message: "Error fetching match.", error: err.message });
  }
};