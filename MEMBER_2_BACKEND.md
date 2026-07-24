# MEMBER 2 — Core Backend & Route Controller Lead

## 1. Setup Guide

```bash
mkdir -p server/controllers server/routes
cd server
npm install express jsonwebtoken bcryptjs google-auth-library express-validator dotenv
```

`server/.env` (shared, coordinate with Member 4)
```
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
MONGO_URI=mongodb+srv://...
```

## 2. Folder Structure (Owned)

```
server/
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── listingController.js
│   └── chatController.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── listingRoutes.js
│   └── chatRoutes.js
```
**Forbidden:** `server/models/`, `server/services/` (Member 3), `server/sockets/`, `server/config/`, `server.js`, `server/middleware/uploadMiddleware.js` (Member 4). Import models/services read-only, never modify their contents.

## 3. authController.js

```javascript
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashed, role, authProvider: "local",
    });
    res.status(201).json({ token: signToken(user._id), isNewUser: true });
  } catch (err) {
    res.status(500).json({ message: "Registration failed.", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.authProvider !== "local") {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials." });

    res.status(200).json({ token: signToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ googleId: payload.sub });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        authProvider: "google",
      });
      isNewUser = true;
    }

    res.status(200).json({ token: signToken(user._id), isNewUser });
  } catch (err) {
    res.status(401).json({ message: "Google authentication failed.", error: err.message });
  }
};
```

## 4. authRoutes.js

```javascript
const router = require("express").Router();
const { register, login, googleAuth } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);

module.exports = router;
```

## 5. userController.js

```javascript
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
```

## 6. userRoutes.js

```javascript
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getProfile, updateProfile, submitOnboarding } = require("../controllers/userController");

router.get("/me", auth, getProfile);
router.put("/me", auth, updateProfile);
router.post("/onboarding", auth, submitOnboarding);

module.exports = router;
```

## 7. listingController.js

```javascript
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
```

## 8. listingRoutes.js

```javascript
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const c = require("../controllers/listingController");

router.post("/", auth, c.createListing);
router.get("/", auth, c.getListings);
router.get("/:id", auth, c.getListingById);
router.put("/:id", auth, c.updateListing);
router.delete("/:id", auth, c.deleteListing);

module.exports = router;
```

## 9. chatController.js

```javascript
const Message = require("../models/Message");

exports.getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch chat history.", error: err.message });
  }
};

exports.getUserChats = async (req, res) => {
  try {
    const chats = await Message.aggregate([
      { $match: { participants: req.user.id } },
      { $group: { _id: "$chatId", lastMessage: { $last: "$text" } } },
    ]);
    res.status(200).json({ chats });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch chats.", error: err.message });
  }
};
```

## 10. chatRoutes.js

```javascript
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getChatHistory, getUserChats } = require("../controllers/chatController");

router.get("/", auth, getUserChats);
router.get("/:chatId", auth, getChatHistory);

module.exports = router;
```

