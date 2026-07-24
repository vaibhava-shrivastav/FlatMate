# MEMBER 4 — Lead Integrator, WebSockets & Media

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
