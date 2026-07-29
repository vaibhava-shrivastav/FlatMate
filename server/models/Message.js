const mongoose = require("mongoose");

// Blueprint for a "Listing" document in MongoDB
// (a room/flat that someone with role "HAS_ROOM" is offering)
const listingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId, // links to a User document
      ref: "User", // tells mongoose this ID points to the "User" model
      required: true, // every listing must belong to someone
    },
    title: {
      type: String,
      required: true, // e.g. "2BHK near GLA University"
    },
    rent: {
      type: Number,
      required: true, // monthly rent amount
    },

    // ---- Location (same GeoJSON format as User.js) ----
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true, // listings must have a location (unlike User, no default)
      },
    },

    images: [{ type: String }], // array of image URLs

    isActive: {
      type: Boolean,
      default: true, // false = listing hidden/closed, without deleting it
    },
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt
  }
);

// Speeds up "find nearby listings" queries
listingSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Listing", listingSchema);