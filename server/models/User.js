const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: true, 
    },
    email: {
      type: String,
      required: true,
      unique: true, 
    },
    password: {
      type: String, 
    },
    googleId: {
      type: String, 
    },
    authProvider: {
      type: String,
      enum: ["local", "google"], 
      default: "local",
    },

    role: {
      type: String,
      enum: ["SEARCHING_ROOM", "HAS_ROOM"], 
    },
    budget: {
      type: Number, 
    },
    onboardingComplete: {
      type: Boolean,
      default: false, 
    },

    habitVector: {
      sleepSchedule: Number, 
      cleanliness: Number,
      smoking: Number,
      cooking: Number,
      guests: Number,
      noise: Number,
    },

   
    location: {
      type: {
        type: String,
        enum: ["Point"], 
      },
      coordinates: {
        type: [Number], 
        default: [0, 0],
      },
    },
  },
  {
    timestamps: true, 
  }
);

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);