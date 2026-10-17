# MEMBER 2 — Core Backend & Route Controller Lead

## Fix Order

| # | Fix Title | Severity | File | Depends on |
|---|-----------|----------|------|------------|
| 1 | Logout endpoint missing | Critical | `server/routes/authRoutes.js`, `server/controllers/authController.js` | — |
| 2 | Google access token audience not verified | Medium | `server/controllers/authController.js` | — |
| 3 | Google account linking conflict | Medium | `server/controllers/authController.js` | — |

---

## Fix 1: Logout endpoint missing (AUDIT ref: Critical)

- **File:** `server/controllers/authController.js` (add at end) + `server/routes/authRoutes.js:1-8`
- **Why:** The client calls `POST /api/auth/logout` but no such route exists, returning 404. While JWT is stateless, the server should acknowledge the request so the client can complete its logout flow cleanly.
- **Change:**

In `server/controllers/authController.js`, add at the end of the file:

```javascript
// AFTER the existing googleAuth export, add:
exports.logout = async (req, res) => {
  // JWT is stateless — nothing to invalidate server-side.
  // This endpoint exists so the client gets a 200 instead of a 404.
  res.status(200).json({ message: "Logged out successfully." });
};
```

In `server/routes/authRoutes.js`:

```diff
  const router = require("express").Router();
- const { register, login, googleAuth } = require("../controllers/authController");
+ const { register, login, googleAuth, logout } = require("../controllers/authController");

  router.post("/register", register);
  router.post("/login", login);
  router.post("/google", googleAuth);
+ router.post("/logout", logout);

  module.exports = router;
```

- **Verify:** `curl -X POST http://localhost:5000/api/auth/logout` → should return `{"message":"Logged out successfully."}` with status 200.
- **Commit:** `git add server/controllers/authController.js server/routes/authRoutes.js && git commit -m "fix(auth): add POST /auth/logout endpoint"`

---

## Fix 2: Google access token audience not verified & payload parameter support (AUDIT ref: Medium)

- **File:** `server/controllers/authController.js:46-85`
- **Why:** 
  1. The `googleAuth` function fetches user info from Google's userinfo endpoint using the access token but never verifies the token's audience (`aud`) matches our `GOOGLE_CLIENT_ID`. A token minted for a different app could be used to authenticate.
  2. **Frontend Compatibility:** The frontend client uses `@react-oauth/google`'s `useGoogleLogin` hook, which sends `{ access_token: "..." }`, while legacy scaffolds sent `{ credential: "..." }`. The backend must accept `const access_token = req.body.access_token || req.body.credential;` so Google login works reliably without breaking changes.
- **Change:**

```javascript
exports.googleAuth = async (req, res) => {
  try {
    // Support both access_token (sent by useGoogleLogin) and credential
    const access_token = req.body.access_token || req.body.credential;

    if (!access_token) {
      return res.status(400).json({ message: "No access token provided." });
    }

    const https = require('https');

    // 1. Fetch user info from Google's userinfo endpoint
    const userinfo = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.googleapis.com',
        path: `/oauth2/v3/userinfo?access_token=${access_token}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${access_token}` }
      };
      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(new Error('Failed to parse user info response'));
            }
          } else {
            reject(new Error(`Failed to fetch user info: ${response.statusCode}`));
          }
        });
      });
      request.on('error', reject);
      request.end();
    });

    const payload = userinfo;
    console.log("[GoogleAuth] Got user info for:", payload.email);

    // 2. Verify the access token audience matches GOOGLE_CLIENT_ID
    const tokenInfo = await new Promise((resolve, reject) => {
      const tiOptions = {
        hostname: 'oauth2.googleapis.com',
        path: `/tokeninfo?access_token=${access_token}`,
        method: 'GET',
      };
      const tiReq = https.request(tiOptions, (tiRes) => {
        let tiData = '';
        tiRes.on('data', (chunk) => tiData += chunk);
        tiRes.on('end', () => {
          if (tiRes.statusCode >= 200 && tiRes.statusCode < 300) {
            resolve(JSON.parse(tiData));
          } else {
            reject(new Error(`Token info error: ${tiRes.statusCode} ${tiData}`));
          }
        });
      });
      tiReq.on('error', reject);
      tiReq.end();
    });

    if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: "Token audience mismatch." });
    }

    let user = await User.findOne({ googleId: payload.sub });
    let isNewUser = false;
```

- **Verify:** Send a Google access token issued for a different client ID → should get 401 "Token audience mismatch." Test login via frontend `GoogleAuthButton` → should succeed without token missing errors.
- **Commit:** `git add server/controllers/authController.js && git commit -m "fix(auth): verify Google access token audience and accept access_token or credential"`

---

## Fix 3: Google account linking conflict (AUDIT ref: Medium)

- **File:** `server/controllers/authController.js:88-92`
- **Why:** When a Google login finds an existing user by email, it blindly overwrites `googleId`. If that email account is already linked to a *different* Google account, this silently breaks the original link.
- **Change:**

```javascript
// BEFORE (lines 87-92)
if (!user) {
  user = await User.findOne({ email: payload.email });
  if (user) {
    // Link Google account to existing email user
    user.googleId = payload.sub;
    await user.save();

// AFTER
if (!user) {
  user = await User.findOne({ email: payload.email });
  if (user) {
    // Check for conflicting Google link
    if (user.googleId && user.googleId !== payload.sub) {
      return res.status(409).json({
        message: "This email is already linked to a different Google account.",
      });
    }
    // Link Google account to existing email user
    user.googleId = payload.sub;
    await user.save();
```

- **Verify:** Create a local account, link it to Google account A, then try signing in with Google account B (same email) → should return 409.
- **Commit:** `git add server/controllers/authController.js && git commit -m "fix(auth): prevent overwriting existing Google account link on email collision"`

---

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
    const access_token = req.body.access_token || req.body.credential;

    if (!access_token) {
      return res.status(400).json({ message: "No access token provided." });
    }

    const https = require('https');

    // Fetch user info from Google's userinfo endpoint using the access token
    const userinfo = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.googleapis.com',
        path: `/oauth2/v3/userinfo?access_token=${access_token}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      };
      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(new Error('Failed to parse user info response'));
            }
          } else {
            reject(new Error(`Failed to fetch user info: ${response.statusCode}`));
          }
        });
      });
      request.on('error', reject);
      request.end();
    });

    const payload = userinfo;
    console.log("[GoogleAuth] Got user info for:", payload.email);

    // Verify the access token was issued for our client
    const tokenInfo = await new Promise((resolve, reject) => {
      const tiOptions = {
        hostname: 'oauth2.googleapis.com',
        path: `/tokeninfo?access_token=${access_token}`,
        method: 'GET',
      };
      const tiReq = https.request(tiOptions, (tiRes) => {
        let tiData = '';
        tiRes.on('data', (chunk) => tiData += chunk);
        tiRes.on('end', () => {
          if (tiRes.statusCode >= 200 && tiRes.statusCode < 300) {
            resolve(JSON.parse(tiData));
          } else {
            reject(new Error(`Token info error: ${tiRes.statusCode} ${tiData}`));
          }
        });
      });
      tiReq.on('error', reject);
      tiReq.end();
    });

    if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: "Token audience mismatch." });
    }

    let user = await User.findOne({ googleId: payload.sub });
    let isNewUser = false;

    if (!user) {
      // Check if user exists with this email (to link Google account)
      user = await User.findOne({ email: payload.email });
      if (user) {
        // Check for conflicting Google link (Fix 3)
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(409).json({
            message: "This email is already linked to a different Google account.",
          });
        }
        // Link Google account to existing email user
        user.googleId = payload.sub;
        await user.save();
      } else {
        // Create new user with Google account
        user = await User.create({
          name: payload.name,
          email: payload.email,
          googleId: payload.sub,
          authProvider: "google",
        });
        isNewUser = true;
      }
    }

    res.status(200).json({ token: signToken(user._id), isNewUser });
  } catch (err) {
    res.status(401).json({ message: "Google authentication failed.", error: err.message });
  }
};

// Logout endpoint (Fix 1)
exports.logout = async (req, res) => {
  // JWT is stateless — nothing to invalidate server-side.
  // This endpoint exists so the client gets a 200 instead of a 404.
  res.status(200).json({ message: "Logged out successfully." });
};
```

## 4. authRoutes.js

```javascript
const router = require("express").Router();
const { register, login, googleAuth, logout } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/logout", logout);

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
