require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Listing = require("../models/Listing");

const demoUsers = [
  {
    name: "Kartik Sharma",
    email: "kartik.sharma@example.com",
    role: "HAS_ROOM",
    budget: 8000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 8,
      cleanliness: 9,
      smoking: 1,
      cooking: 7,
      guests: 4,
      noise: 3,
    },
    location: {
      type: "Point",
      coordinates: [77.495, 28.46],
    },
  },
  {
    name: "Rhea Sen",
    email: "rhea.sen@example.com",
    role: "HAS_ROOM",
    budget: 10000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 7,
      cleanliness: 10,
      smoking: 1,
      cooking: 8,
      guests: 3,
      noise: 2,
    },
    location: {
      type: "Point",
      coordinates: [77.488, 28.472],
    },
  },
  {
    name: "Arjun Verma",
    email: "arjun.verma@example.com",
    role: "HAS_ROOM",
    budget: 12000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 7,
      cleanliness: 8,
      smoking: 1,
      cooking: 6,
      guests: 5,
      noise: 3,
    },
    location: {
      type: "Point",
      coordinates: [77.513, 28.471],
    },
  },
  {
    name: "Aman Srivastava",
    email: "aman.srivastava@example.com",
    role: "HAS_ROOM",
    budget: 6000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 6,
      cleanliness: 8,
      smoking: 2,
      cooking: 5,
      guests: 5,
      noise: 4,
    },
    location: {
      type: "Point",
      coordinates: [77.506, 28.477],
    },
  },
  {
    name: "Neha Gupta",
    email: "neha.gupta@example.com",
    role: "HAS_ROOM",
    budget: 13000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 8,
      cleanliness: 9,
      smoking: 1,
      cooking: 8,
      guests: 4,
      noise: 2,
    },
    location: {
      type: "Point",
      coordinates: [77.428, 28.605],
    },
  },
];

const demoListingsData = [
  {
    userIndex: 0,
    title: "Furnished Room near GL Bajaj & Galgotias (KP II)",
    rent: 7500,
    location: {
      type: "Point",
      coordinates: [77.495, 28.46],
      city: "Greater Noida",
      area: "Knowledge Park II",
      address: "Near GL Bajaj Institute, Knowledge Park II, Greater Noida, UP",
    },
    description: "Quiet, well-ventilated student room walking distance to Knowledge Park II colleges. High-speed 200 Mbps WiFi, RO drinking water, 24/7 power backup, study desk, and optional daily mess tiffin service.",
    roomType: "private",
    availableFrom: new Date(Date.now() + 86400000 * 2),
    amenities: ["High-speed WiFi", "Study Table", "RO Purifier", "Power Backup", "Mess Available"],
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 1,
    title: "Single AC Room near Sharda University (KP III)",
    rent: 8500,
    location: {
      type: "Point",
      coordinates: [77.488, 28.472],
      city: "Greater Noida",
      area: "Knowledge Park III",
      address: "Plot 32, Near Sharda University Gate, Knowledge Park III, Greater Noida",
    },
    description: "Private room with attached washroom just 400m from Sharda University campus. Includes air conditioner, geyser, study workstation, daily room cleaning, and gated security.",
    roomType: "private",
    availableFrom: new Date(),
    amenities: ["Air Conditioning", "Attached Bath", "Geyser", "Housekeeping", "Security"],
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 2,
    title: "Private Bedroom in 2BHK near Alpha 1 Metro",
    rent: 11000,
    location: {
      type: "Point",
      coordinates: [77.513, 28.471],
      city: "Greater Noida",
      area: "Sector Alpha 1",
      address: "Sector Alpha 1, Near Alpha 1 Metro Station, Greater Noida",
    },
    description: "Bright private room with personal balcony in a peaceful Alpha 1 society. 3 minutes walk to Aqua Line Metro. Fully functional kitchen, refrigerator, and washing machine provided.",
    roomType: "private",
    availableFrom: new Date(Date.now() + 86400000 * 4),
    amenities: ["Metro Walking Distance", "Balcony", "Kitchen Access", "Washing Machine", "WiFi"],
    images: [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 3,
    title: "Shared Room near Pari Chowk (Beta 1)",
    rent: 5500,
    location: {
      type: "Point",
      coordinates: [77.506, 28.477],
      city: "Greater Noida",
      area: "Sector Beta 1",
      address: "Near Beta 1 Main Market & Pari Chowk, Greater Noida",
    },
    description: "Affordable twin-sharing spot in a spacious 3BHK flat. 5 minutes from Pari Chowk. Fully air-conditioned, separate wardrobes, study tables, and high-speed fiber internet.",
    roomType: "shared",
    availableFrom: new Date(),
    amenities: ["AC", "WiFi", "Wardrobe", "Pari Chowk Nearby", "Inverter Backup"],
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 0,
    title: "Independent Studio Apartment in Delta 2",
    rent: 14000,
    location: {
      type: "Point",
      coordinates: [77.525, 28.486],
      city: "Greater Noida",
      area: "Sector Delta 2",
      address: "Sector Delta 2, Near Delta 1 Metro, Greater Noida",
    },
    description: "Self-contained studio flat with private kitchen, balcony, and reserved parking. Quiet green sector with parks. Ideal for software professionals or research scholars.",
    roomType: "studio",
    availableFrom: new Date(Date.now() + 86400000 * 5),
    amenities: ["Private Kitchen", "Balcony", "Covered Parking", "AC", "Power Backup"],
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 1,
    title: "Master Bedroom Suite in NRI City High-Rise",
    rent: 15500,
    location: {
      type: "Point",
      coordinates: [77.518, 28.455],
      city: "Greater Noida",
      area: "NRI City, Omega 1",
      address: "NRI City Township, Sector Omega 1, Greater Noida",
    },
    description: "Luxury master suite with attached washroom in gated NRI City society. Includes clubhouse access, swimming pool, gym, 24/7 multi-tier security, and park views. Non-smoker preferred.",
    roomType: "private",
    availableFrom: new Date(Date.now() + 86400000 * 3),
    amenities: ["Swimming Pool", "Gym Access", "Park View", "Clubhouse", "24/7 Security"],
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 2,
    title: "Cozy Private Room near Jagat Farm (Gamma 2)",
    rent: 9000,
    location: {
      type: "Point",
      coordinates: [77.502, 28.482],
      city: "Greater Noida",
      area: "Sector Gamma 2",
      address: "Behind Jagat Farm Commercial Market, Sector Gamma 2, Greater Noida",
    },
    description: "Well-ventilated private room right behind Jagat Farm market. Quick access to daily groceries, food street, and shared autos. Fully furnished with double bed, mattress, and wardrobe.",
    roomType: "private",
    availableFrom: new Date(),
    amenities: ["Market Walking Distance", "Furnished", "WiFi", "Geyser", "Auto Stand Nearby"],
    images: [
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 4,
    title: "Modern High-Rise Flatshare (Gaur City, G. Noida West)",
    rent: 12000,
    location: {
      type: "Point",
      coordinates: [77.428, 28.605],
      city: "Greater Noida",
      area: "Gaur City 1, Greater Noida West",
      address: "Gaur City 1, Sector 4, Greater Noida West, UP",
    },
    description: "Private bedroom in a 3BHK high-rise apartment in Gaur City. Direct connectivity to Sector 52 Noida Metro and Cyber City. High-speed WiFi, gym, swimming pool, and cook facility available.",
    roomType: "entire",
    availableFrom: new Date(Date.now() + 86400000 * 7),
    amenities: ["Gated Society", "Gym & Pool", "Cook Service", "Power Backup", "AC"],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    ],
  },
];

async function seed({ manageConnection = true } = {}) {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("No MONGO_URI provided in .env");
  }

  try {
    if (manageConnection) {
      await mongoose.connect(mongoUri);
      console.log("Connected to MongoDB for seeding Greater Noida dataset...");
    }

    const passwordHash = await bcrypt.hash("demo12345", 10);

    // Upsert demo users
    const createdUsers = [];
    for (const u of demoUsers) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create({
          ...u,
          password: passwordHash,
          isVerified: true,
        });
      } else {
        await User.updateOne({ email: u.email }, { ...u, isVerified: true });
      }
      createdUsers.push(user);
    }

    console.log(`Ensured ${createdUsers.length} Greater Noida demo hosts exist.`);

    // Clear previous listings so only Greater Noida listings are present
    await Listing.deleteMany({});
    console.log("Cleared old listings.");

    // Insert Greater Noida demo listings
    const listingsToInsert = demoListingsData.map((item) => {
      const owner = createdUsers[item.userIndex];
      return {
        owner: owner._id,
        title: item.title,
        rent: item.rent,
        location: item.location,
        description: item.description,
        roomType: item.roomType,
        availableFrom: item.availableFrom,
        amenities: item.amenities,
        images: item.images,
        isActive: true,
      };
    });

    await Listing.insertMany(listingsToInsert);
    console.log(`Successfully seeded ${listingsToInsert.length} Greater Noida listings!`);
  } catch (err) {
    console.error("Seeding failed:", err);
    throw err;
  } finally {
    if (manageConnection) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB.");
    }
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
