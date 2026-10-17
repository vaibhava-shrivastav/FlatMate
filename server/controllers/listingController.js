const Listing = require("../models/Listing");

const DEFAULT_GREATER_NOIDA_COORDS = [77.5030, 28.4744];

exports.createListing = async (req, res) => {
  try {
    const data = { ...req.body, owner: req.user.id };

    // Ensure valid GeoJSON location structure
    if (!data.location) {
      data.location = {
        type: "Point",
        coordinates: DEFAULT_GREATER_NOIDA_COORDS,
        city: "Greater Noida",
        area: "Greater Noida",
      };
    } else {
      if (!data.location.type) data.location.type = "Point";
      if (!Array.isArray(data.location.coordinates) || data.location.coordinates.length < 2) {
        data.location.coordinates = DEFAULT_GREATER_NOIDA_COORDS;
      }
      if (!data.location.city) data.location.city = "Greater Noida";
    }

    const listing = await Listing.create(data);
    const populated = await Listing.findById(listing._id).populate("owner", "name role isVerified");
    res.status(201).json(populated || listing);
  } catch (err) {
    res.status(400).json({ message: "Could not create listing.", error: err.message });
  }
};

exports.getListings = async (req, res) => {
  try {
    const { search, roomType, minBudget, maxBudget } = req.query;
    const filter = { isActive: true };

    if (roomType) {
      filter.roomType = roomType;
    }
    if (minBudget || maxBudget) {
      filter.rent = {};
      if (minBudget) filter.rent.$gte = Number(minBudget);
      if (maxBudget) filter.rent.$lte = Number(maxBudget);
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { "location.city": searchRegex },
        { "location.area": searchRegex },
        { "location.address": searchRegex },
      ];
    }

    const listings = await Listing.find(filter)
      .populate("owner", "name role isVerified")
      .sort({ createdAt: -1 });

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