require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Listing = require("../models/Listing");

const demoUsers = [
  {
    name: "Rohan Sharma",
    email: "rohan.sharma@example.com",
    role: "HAS_ROOM",
    budget: 15000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 8,
      cleanliness: 9,
      smoking: 1,
      cooking: 8,
      guests: 5,
      noise: 3,
    },
    location: {
      type: "Point",
      coordinates: [77.6271, 12.9352],
    },
  },
  {
    name: "Ananya Verma",
    email: "ananya.verma@example.com",
    role: "HAS_ROOM",
    budget: 20000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 7,
      cleanliness: 10,
      smoking: 1,
      cooking: 7,
      guests: 4,
      noise: 2,
    },
    location: {
      type: "Point",
      coordinates: [77.6412, 12.9784],
    },
  },
  {
    name: "Kabir Mehta",
    email: "kabir.mehta@example.com",
    role: "HAS_ROOM",
    budget: 10000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 6,
      cleanliness: 8,
      smoking: 2,
      cooking: 6,
      guests: 6,
      noise: 4,
    },
    location: {
      type: "Point",
      coordinates: [77.0878, 28.495],
    },
  },
  {
    name: "Priya Nair",
    email: "priya.nair@example.com",
    role: "HAS_ROOM",
    budget: 18000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 8,
      cleanliness: 9,
      smoking: 1,
      cooking: 9,
      guests: 5,
      noise: 3,
    },
    location: {
      type: "Point",
      coordinates: [72.9051, 19.1176],
    },
  },
  {
    name: "Aman Gupta",
    email: "aman.gupta@example.com",
    role: "HAS_ROOM",
    budget: 7000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 7,
      cleanliness: 8,
      smoking: 1,
      cooking: 5,
      guests: 4,
      noise: 3,
    },
    location: {
      type: "Point",
      coordinates: [77.595, 27.6057],
    },
  },
];

const demoListingsData = [
  {
    userIndex: 0,
    title: "Sunlit Private Room in 3BHK Flat",
    rent: 14500,
    location: {
      type: "Point",
      coordinates: [77.6271, 12.9352],
      city: "Bangalore",
      area: "Koramangala 4th Block",
      address: "14th Main Rd, Koramangala, Bengaluru, Karnataka",
    },
    description: "Spacious private bedroom with attached washroom in a fully-equipped 3BHK. High-speed 300 Mbps WiFi, modular kitchen, daily maid service, and 24/7 power backup. Looking for a neat working professional.",
    roomType: "private",
    availableFrom: new Date(Date.now() + 86400000 * 2),
    amenities: ["Attached Bath", "High-speed WiFi", "Power Backup", "Washing Machine", "Kitchen Access", "Cook Available"],
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 1,
    title: "Modern Studio Apartment with Balcony",
    rent: 22000,
    location: {
      type: "Point",
      coordinates: [77.6412, 12.9784],
      city: "Bangalore",
      area: "Indiranagar",
      address: "100ft Road, Defence Colony, Indiranagar, Bengaluru",
    },
    description: "Cozy independent studio apartment with private balcony garden. Walking distance to 100ft road cafes and metro station. Ideal for remote workers or designers who enjoy quiet, airy spaces.",
    roomType: "studio",
    availableFrom: new Date(),
    amenities: ["Private Balcony", "Air Conditioning", "Dedicated Desk", "Full Kitchen", "Lift", "Security"],
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 2,
    title: "Shared Master Bedroom near Cyber Hub",
    rent: 9000,
    location: {
      type: "Point",
      coordinates: [77.0878, 28.495],
      city: "Gurgaon",
      area: "DLF Phase 2",
      address: "Near Sikanderpur Metro, DLF Phase 2, Gurugram, Haryana",
    },
    description: "Twin sharing spot available in a large master bedroom. 5 minutes from Cyber City. Fully air-conditioned, separate wardrobes, study tables, and refrigerator provided.",
    roomType: "shared",
    availableFrom: new Date(),
    amenities: ["AC", "WiFi", "Geyser", "Housekeeping", "Gated Security", "Parking"],
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 3,
    title: "Furnished Shared Room with Lake View",
    rent: 12500,
    location: {
      type: "Point",
      coordinates: [72.9051, 19.1176],
      city: "Mumbai",
      area: "Powai",
      address: "Hiranandani Gardens, Powai, Mumbai, Maharashtra",
    },
    description: "Looking for a roommate to share a serene, well-ventilated bedroom in Hiranandani. Access to building clubhouse, swimming pool, and gym. Non-smoker preferred.",
    roomType: "shared",
    availableFrom: new Date(Date.now() + 86400000 * 5),
    amenities: ["Swimming Pool", "Gym", "Lake View", "AC", "Modular Kitchen", "Gas Pipeline"],
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 4,
    title: "Cozy Student Flat near GLA University",
    rent: 6500,
    location: {
      type: "Point",
      coordinates: [77.595, 27.6057],
      city: "Mathura",
      area: "GLA University Road",
      address: "NH-19, Near GLA University Campus, Chaumuhan, Mathura",
    },
    description: "Well-maintained student room located 400m from GLA campus gate. Peaceful study environment, RO drinking water, high-speed fiber internet, and home-style tiffin delivery option.",
    roomType: "private",
    availableFrom: new Date(),
    amenities: ["WiFi", "RO Purifier", "Study Table", "Power Backup", "Bicycle Parking"],
    images: [
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 0,
    title: "Private Room with Dedicated Workstation",
    rent: 16000,
    location: {
      type: "Point",
      coordinates: [77.6389, 12.9121],
      city: "Bangalore",
      area: "HSR Layout Sector 4",
      address: "Sector 4, HSR Layout, Bengaluru, Karnataka",
    },
    description: "Bright private room with ergonomic chair, standing desk setup, dual monitor mount, and private washroom. Ideal for software engineers or remote founders. Friendly, respectful flatmates.",
    roomType: "private",
    availableFrom: new Date(Date.now() + 86400000 * 7),
    amenities: ["Ergonomic Desk", "Attached Bath", "300 Mbps WiFi", "Cook Included", "Washing Machine"],
    images: [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 1,
    title: "Spacious 2BHK Entire Flatshare",
    rent: 18500,
    location: {
      type: "Point",
      coordinates: [77.2066, 28.5494],
      city: "New Delhi",
      area: "Hauz Khas Enclave",
      address: "Hauz Khas, New Delhi, Delhi",
    },
    description: "Private room in an upscale heritage Hauz Khas home. Walking distance to Hauz Khas deer park and metro station. Beautiful terrace access with sunset views.",
    roomType: "entire",
    availableFrom: new Date(),
    amenities: ["Terrace Access", "Heritage Building", "Park Adjacent", "WiFi", "AC", "Full Furnishing"],
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    userIndex: 3,
    title: "Peaceful Master Suite in Penthouse",
    rent: 28000,
    location: {
      type: "Point",
      coordinates: [72.8295, 19.0596],
      city: "Mumbai",
      area: "Bandra West",
      address: "Pali Hill, Bandra West, Mumbai, Maharashtra",
    },
    description: "Master bedroom suite with walk-in closet in a luxury Bandra apartment. Panoramic city skyline views, daily housekeeping, and premium appliances throughout.",
    roomType: "private",
    availableFrom: new Date(Date.now() + 86400000 * 3),
    amenities: ["Walk-in Closet", "Panoramic View", "Covered Parking", "AC", "Clubhouse", "24/7 Concierge"],
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
      console.log("Connected to MongoDB for seeding...");
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
      }
      createdUsers.push(user);
    }

    console.log(`Ensured ${createdUsers.length} demo users exist.`);

    // Check existing listings
    const existingCount = await Listing.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing listings. Clearing old demo listings...`);
      await Listing.deleteMany({ owner: { $in: createdUsers.map((u) => u._id) } });
    }

    // Insert demo listings
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
    console.log(`Successfully seeded ${listingsToInsert.length} demo listings!`);
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
