const Listing = require("../models/Listing");

exports.createListing = async (req, res) => {
  try {
    const listing = await Listing.create({ ...req.body, owner: req.user.id });
    res.status(201).json(listing);
  } catch (err) {
    res.status(400).json({ message: "Could not create listing.", error: err.message });
  }
};

exports.getListings = async (req, res) => {
  try {
    const listings = await Listing.find({ isActive: true }).populate("owner", "name role");
    res.status(200).json({ listings });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch listings.", error: err.message });
  }
};

exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("owner", "name role");
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    res.status(200).json(listing);
  } catch (err) {
    res.status(500).json({ message: "Error fetching listing.", error: err.message });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id }, req.body, { new: true }
    );
    if (!listing) return res.status(404).json({ message: "Listing not found or unauthorized." });
    res.status(200).json(listing);
  } catch (err) {
    res.status(400).json({ message: "Update failed.", error: err.message });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!listing) return res.status(404).json({ message: "Listing not found or unauthorized." });
    res.status(200).json({ message: "Listing deleted." });
  } catch (err) {
    res.status(500).json({ message: "Delete failed.", error: err.message });
  }
};