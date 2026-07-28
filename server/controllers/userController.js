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

exports.submitOnboarding = async (req, res) => {
  try {
    const { habitVector } = req.body;
    if (!habitVector) return res.status(400).json({ message: "habitVector is required." });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { habitVector, onboardingComplete: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ message: "Onboarding complete.", user });
  } catch (err) {
    res.status(500).json({ message: "Onboarding save failed.", error: err.message });
  }
};