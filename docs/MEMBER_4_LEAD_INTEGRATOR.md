# MEMBER 4 — Lead Integrator, WebSockets & Media

## Fix Order

| # | Fix Title | Severity | File | Depends on |
|---|-----------|----------|------|------------|
| 1 | Socket sendMessage lacks sender validation | High | `server/sockets/chatSocket.js` | — |
| 2 | Missing env var validation at startup | High | `server/server.js` | — |
| 3 | Missing static file serving for production | Medium | `server/server.js` | — |
| 4 | Typing events not handled on server | Low | `server/sockets/chatSocket.js` | — |
| 5 | Missing request logging middleware | Low | `server/server.js` | — |
| 6 | Secrets committed to `server/.env` | High | `server/.env`, `.gitignore` | — |
| 7 | MongoDB connection has no timeout | High | `server/config/db.js` | — |

### Coordination Notes (cross-member findings)

| Finding | Root cause owner | Fix doc | Note |
|---------|-----------------|---------|------|
| Location optional but geo query needs it | Member 3 (User.js) | MEMBER_3_AI_AND_DB.md Fix 1+2 | Member 1 should also add a location collection step during onboarding. Coordinate with Member 3 on the GeoJSON shape. |
| Chat REST endpoint mismatch | Member 1 (useConversations.js, useMessages.js) | MEMBER_1_FRONTEND.md Fix 2+3 | Server endpoints `/api/chats` and `/api/chats/:chatId` are correct — no backend changes needed. |
| authService returns token not user | Member 1 (authService.js) | MEMBER_1_FRONTEND.md Fix 1 | No backend change needed — login/register API responses are correct. |
| Socket event name mismatch | Member 1 (useMessages.js) | MEMBER_1_FRONTEND.md Fix 4 | Server event names (`joinChat`, `sendMessage`, `receiveMessage`) are the source of truth. Client must align. |
| Google auth audience check | Member 2 (authController.js) | MEMBER_2_BACKEND.md Fix 2 | No integrator action needed. |
| Google account linking conflict | Member 2 (authController.js) | MEMBER_2_BACKEND.md Fix 3 | No integrator action needed. |
| Logout route missing | Member 2 (authRoutes.js) | MEMBER_2_BACKEND.md Fix 1 | Member 1's api.js interceptor fix (MEMBER_1_FRONTEND.md Fix 7) depends on this. |
| Match cache never expires | Member 3 (Match.js) | MEMBER_3_AI_AND_DB.md Fix 3 | No integrator action needed. |
| Gemini API no timeout | Member 3 (geminiService.js) | MEMBER_3_AI_AND_DB.md Fix 4 | No integrator action needed. |

---

## Fix 1: Socket sendMessage lacks sender validation (AUDIT ref: High)

- **File:** `server/sockets/chatSocket.js:24-32`
- **Why:** The `sendMessage` handler accepts `senderId` from the client payload without verifying it matches the authenticated `socket.userId`. A malicious client can impersonate another user. Additionally, there's no check that the user is a participant of the chat.
- **Change:**

```javascript
// BEFORE (lines 24-31)
    socket.on("sendMessage", async ({ chatId, senderId, text, participants }) => {
      try {
        if (!text?.trim()) return;
        const message = await Message.create({ chatId, senderId, text, participants });
        io.to(chatId).emit("receiveMessage", message);
      } catch (err) {
        socket.emit("errorMessage", { message: "Failed to send message." });
      }
    });

// AFTER
    socket.on("sendMessage", async ({ chatId, senderId, text, participants }) => {
      try {
        if (!text?.trim()) return;

        // Validate: senderId must match the authenticated socket user
        if (senderId && senderId !== socket.userId) {
          return socket.emit("errorMessage", { message: "Sender ID mismatch." });
        }

        // Use the authenticated userId as the sender (ignore client-supplied senderId)
        const message = await Message.create({
          chatId,
          senderId: socket.userId,
          text,
          participants,
        });
        io.to(chatId).emit("receiveMessage", message);
      } catch (err) {
        socket.emit("errorMessage", { message: "Failed to send message." });
      }
    });
```

- **Verify:** From a browser console, try `socket.emit('sendMessage', { chatId: '...', senderId: 'FAKE_ID', text: 'hi' })` → message should be saved with the real `socket.userId`, not `'FAKE_ID'`.
- **Commit:** `git add server/sockets/chatSocket.js && git commit -m "fix(socket): validate senderId matches authenticated user in sendMessage"`

---

## Fix 2: Missing env var validation at startup (AUDIT ref: High)

- **File:** `server/server.js:1-7`
- **Why:** If critical env vars like `MONGO_URI`, `JWT_SECRET`, or `CLIENT_URL` are missing, the server either crashes mid-request with a cryptic error or silently misconfigures CORS/auth.
- **Change:**

```javascript
// BEFORE (lines 1-7)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const errorMiddleware = require("./middleware/errorMiddleware");

// AFTER
require("dotenv").config();

// ── Validate required environment variables ──────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const errorMiddleware = require("./middleware/errorMiddleware");
```

- **Verify:** Remove `JWT_SECRET` from `.env`, start the server → should exit immediately with a clear error listing the missing var.
- **Commit:** `git add server/server.js && git commit -m "fix(server): validate required env vars at startup"`

---

## Fix 3: Missing static file serving for production (AUDIT ref: Medium)

- **File:** `server/server.js:27` (after `app.use(errorMiddleware)`)
- **Why:** In production, if the server is expected to serve the React build, there's no `express.static` middleware, so all client-side routes return 404.
- **Change:**

```javascript
// BEFORE (line 27)
app.use(errorMiddleware);

// AFTER — add static serving BEFORE the error middleware
const path = require("path");

// Serve React production build in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  });
}

app.use(errorMiddleware);
```

Also add `path` to the requires at the top of the file (or use `require("path")` inline as shown above).

- **Verify:** `NODE_ENV=production npm start` → navigate to `http://localhost:5000/login` → should serve the React app instead of a 404.
- **Commit:** `git add server/server.js && git commit -m "fix(server): serve React static build in production mode"`

---

## Fix 4: Typing events not handled on server (AUDIT ref: Low)

- **File:** `server/sockets/chatSocket.js:32` (after the `sendMessage` handler)
- **Why:** The client emits `user_typing` and `user_stop_typing` but the server has no handlers for them. Typing indicators never reach other participants.
- **Change:**

```javascript
// AFTER the sendMessage handler, add:

    socket.on("user_typing", (chatId) => {
      socket.to(chatId).emit("user_typing", { userId: socket.userId });
    });

    socket.on("user_stop_typing", (chatId) => {
      socket.to(chatId).emit("user_stop_typing", { userId: socket.userId });
    });
```

- **Depends on:** Member 1's Fix 4 (event name alignment) must be merged first so the client emits the correct event names.
- **Verify:** Open two browser tabs in the same chat → type in one → the other should receive a typing event (check via socket debug logs or UI).
- **Commit:** `git add server/sockets/chatSocket.js && git commit -m "fix(socket): broadcast typing/stop_typing events to chat participants"`

---

## Fix 5: Missing request logging middleware (AUDIT ref: Low)

- **File:** `server/server.js:19` (after `app.use(express.json())`)
- **Why:** No HTTP request logging makes it difficult to debug and monitor production traffic.
- **Change:**

First install morgan: `npm install morgan`

```javascript
// BEFORE (line 19)
app.use(express.json());

// AFTER
const morgan = require("morgan");

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
```

- **Verify:** Start the server, make any API call → should see a log line like `GET /api/users/me 200 12.345 ms`.
- **Commit:** `git add server/server.js server/package.json && git commit -m "fix(server): add morgan request logging middleware"`

---

## Fix 6: Secrets committed to `server/.env` in repo (AUDIT ref: Deployment/High)

- **File:** `server/.env`, `.gitignore`
- **Why:** MongoDB URI, JWT secret, Gemini API key, Google Client ID, and Cloudinary creds are committed in plain text. Anyone with repo access can see and use them.
- **Change:**

```bash
# Step 1: Remove the .env file from git tracking (keeps local copy)
git rm --cached server/.env

# Step 2: Ensure .gitignore has the entry
echo "server/.env" >> .gitignore
```

Then verify `server/.gitignore` or root `.gitignore` contains:

```
server/.env
```

- **Verify:** `git status` should not show `server/.env` as tracked. Run `git log --all --full-history -- server/.env` to confirm it was in history.
- **Post-fix:** **Rotate all secrets** — change the MongoDB password, generate a new JWT_SECRET, regenerate API keys on Google Cloud, Gemini, and Cloudinary dashboards. Update Render env vars with the new values.
- **Commit:** `git add .gitignore && git commit -m "fix(security): remove server/.env from tracking, add to .gitignore"`

---

## Fix 7: MongoDB connection has no timeout (AUDIT ref: Deployment/High)

- **File:** `server/config/db.js:5`
- **Why:** `mongoose.connect(process.env.MONGO_URI)` has no timeout option. If MongoDB Atlas rejects the connection (e.g., IP not whitelisted), the call hangs forever and `server.listen()` never executes — the server appears down on Render.
- **Change:**

```javascript
// BEFORE
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}

// AFTER
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast if MongoDB is unreachable
    });
    console.log("MongoDB connected.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}
```

Also ensure **MongoDB Atlas → Network Access** has `0.0.0.0/0` (Allow Access from Anywhere) so Render's dynamic IPs can connect.

- **Verify:** Temporarily set `MONGO_URI` to an invalid host → server should crash within 5 seconds with a clear error instead of hanging.
- **Commit:** `git add server/config/db.js && git commit -m "fix(db): add serverSelectionTimeoutMS to prevent indefinite connection hang"`

---

## 1. Setup Guide

```bash
mkdir -p server/sockets server/config server/middleware
cd server
npm init -y
npm install express mongoose dotenv cors socket.io cloudinary multer multer-storage-cloudinary
npm install -D nodemon
```

`server/.env` (root env, shared across team)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLIENT_URL=http://localhost:5173
```

`package.json` script: `"dev": "nodemon server.js"`

## 2. Folder Structure (Owned)

```
server/
├── server.js
├── config/
│   ├── db.js
│   └── cloudinary.js
├── middleware/
│   ├── authMiddleware.js
│   ├── uploadMiddleware.js
│   └── errorMiddleware.js
├── sockets/
│   └── chatSocket.js
├── controllers/
│   └── matchController.js   (wires Member 3's engine to routes)
```
**Forbidden:** editing Member 1's `client/` internals, Member 2's other controllers, Member 3's models/services internals (import only).

## 3. server.js — Central Bootstrap

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const errorMiddleware = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const listingRoutes = require("./routes/listingRoutes");
const chatRoutes = require("./routes/chatRoutes");
const matchRoutes = require("./routes/matchRoutes");

const registerChatSocket = require("./sockets/chatSocket");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/matches", matchRoutes);

app.use(errorMiddleware);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL } });
registerChatSocket(io);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });
```

## 4. config/db.js

```javascript
const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}

module.exports = connectDB;
```

## 5. config/cloudinary.js

```javascript
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

## 6. middleware/uploadMiddleware.js

```javascript
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "flatmate", allowed_formats: ["jpg", "png", "jpeg"] },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed."), false);
    }
    cb(null, true);
  },
});

module.exports = upload;
```

## 7. middleware/authMiddleware.js

```javascript
const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided." });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
```

## 8. middleware/errorMiddleware.js

```javascript
module.exports = function errorMiddleware(err, req, res, next) {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal server error.",
  });
};
```

## 9. sockets/chatSocket.js

```javascript
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");

module.exports = function registerChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error."));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid socket token."));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
    });

    socket.on("sendMessage", async ({ chatId, senderId, text, participants }) => {
      try {
        if (!text?.trim()) return;
        const message = await Message.create({ chatId, senderId, text, participants });
        io.to(chatId).emit("receiveMessage", message);
      } catch (err) {
        socket.emit("errorMessage", { message: "Failed to send message." });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err.message);
    });
  });
};
```

## 10. controllers/matchController.js (wires AI engine)

```javascript
const { runMatchingPipeline } = require("../services/matchingEngine");
const Match = require("../models/Match");

exports.getMatchesForUser = async (req, res) => {
  try {
    const results = await runMatchingPipeline(req.user.id);
    res.status(200).json({ matches: results });
  } catch (err) {
    res.status(500).json({ message: "Could not generate matches.", error: err.message });
  }
};

exports.getMatchDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [first, second] = [req.user.id, id].sort();
    const match = await Match.findOne({ userA: first, userB: second });
    if (!match) return res.status(404).json({ message: "Match not found." });
    res.status(200).json(match);
  } catch (err) {
    res.status(500).json({ message: "Error fetching match.", error: err.message });
  }
};
```

`server/routes/matchRoutes.js`
```javascript
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getMatchesForUser, getMatchDetail } = require("../controllers/matchController");

router.get("/", auth, getMatchesForUser);
router.get("/:id", auth, getMatchDetail);

module.exports = router;
```



**Rules to prevent conflicts:**
- Each member only commits inside their assigned folder boundaries.
- Shared `.env` variables are agreed upon in a kickoff message before coding starts.
- Model field names (Member 3) are frozen before Member 2/Member 4 write code against them.
- Member 4 merges in order: DB/AI → Backend → Frontend, testing after each merge.
