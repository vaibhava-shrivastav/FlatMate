const User = require("../models/User");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile.", error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user.", error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true, runValidators: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ message: "Update failed.", error: err.message });
  }
};

const STRING_TO_SCORE = {
  early_bird: 1, flexible: 3, night_owl: 5,
  very_clean: 5, average: 3, relaxed: 1,
  no: 1, outside_only: 3, yes: 5,
  daily: 5, sometimes: 3, rarely: 1,
  occasionally: 3, frequently: 5,
  quiet: 1, moderate: 3, lively: 5,
};

exports.submitOnboarding = async (req, res) => {
  try {
    const { habitVector } = req.body;
    if (!habitVector) return res.status(400).json({ message: "habitVector is required." });

    const normalizedVector = {};
    for (const [key, val] of Object.entries(habitVector)) {
      if (typeof val === "number") {
        normalizedVector[key] = val;
      } else if (typeof val === "string") {
        normalizedVector[key] = STRING_TO_SCORE[val] ?? (Number(val) || 3);
      } else {
        normalizedVector[key] = 3;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { habitVector: normalizedVector, onboardingComplete: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ message: "Onboarding complete.", user });
  } catch (err) {
    res.status(500).json({ message: "Onboarding save failed.", error: err.message });
  }
};