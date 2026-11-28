# Member 2 — Backend Implementation Plan (v3)

> **Goal:** Secure, robust backend endpoints and real-time socket communication for the final presentation. Fix chat participant population, handle multipart listing creation, support dynamic match evaluations, and resolve socket event mismatches.
>
> **Priority:** Critical for seamless client-server integration.

---

## Overview of Tasks

| # | Task | Priority | Files Touched |
|---|------|----------|---------------|
| 1 | Populate `participant` in `getUserChats` aggregate query | 🔴 Critical | `server/controllers/chatController.js` |
| 2 | Handle flexible typing indicators in `chatSocket.js` | 🔴 Critical | `server/sockets/chatSocket.js` |
| 3 | Support multipart form data & Cloudinary files in `createListing` | 🟡 High Impact | `server/controllers/listingController.js` |
| 4 | Ensure `/api/matches/:id` generates on-demand match if missing | 🟡 High Impact | `server/controllers/matchController.js` |
| 5 | Add explicit `POST /api/auth/logout` endpoint | 🟢 Polish | `server/routes/authRoutes.js`, `server/controllers/authController.js` |

---

## Fix 1: Populate `participant` in `getUserChats`

- **File:** `server/controllers/chatController.js`
- **Why:** The client expects each chat in `getUserChats` to have a `participant` object (with `name`, `avatar`, `_id`) and a `lastMessage` object `{ text, createdAt }`. The current aggregate query groups by `$chatId` but drops the participant, causing `ConversationCard` to throw `Cannot destructure property 'name' of 'participant' as it is undefined`.
- **Code:**

Replace `exports.getUserChats` in `server/controllers/chatController.js`:
```js
exports.getUserChats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Find all messages involving this user
    const messages = await Message.find({ participants: userId })
      .sort({ createdAt: -1 })
      .populate("participants", "name email avatar role");

    // Group by chatId to get the latest message and the other participant
    const chatMap = new Map();

    for (const msg of messages) {
      if (!chatMap.has(msg.chatId)) {
        const otherParticipant = msg.participants.find(
          (p) => p._id.toString() !== req.user.id
        ) || msg.participants[0];

        chatMap.set(msg.chatId, {
          _id: msg.chatId,
          participant: otherParticipant || {
            _id: "unknown",
            name: "Roommate Host",
          },
          lastMessage: {
            text: msg.text,
            createdAt: msg.createdAt,
          },
          updatedAt: msg.createdAt,
          unreadCount: 0,
        });
      }
    }

    const chats = Array.from(chatMap.values());
    res.status(200).json({ chats });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch chats.", error: err.message });
  }
};
```

- **Verify:**
  ```bash
  curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/chats
  ```
  Response contains:
  ```json
  {
    "chats": [
      {
        "_id": "chat_user1_user2",
        "participant": { "_id": "...", "name": "Kartik Sharma" },
        "lastMessage": { "text": "Hi!", "createdAt": "..." }
      }
    ]
  }
  ```
- **Commit:**
  ```bash
  git add server/controllers/chatController.js && git commit -m "fix(chat): correctly populate participant and lastMessage in getUserChats"
  ```

---

## Fix 2: Flexible Typing Event Handler in `chatSocket.js`

- **File:** `server/sockets/chatSocket.js`
- **Why:** The client currently emits `socket.emit('user_typing', { chatId })` (passing an object), whereas the server previously wrote `socket.on('user_typing', (chatId) => socket.to(chatId)...)`. If `chatId` is passed as `{ chatId: "xyz" }`, `socket.to(...)` treats the entire object as the room name, preventing typing indicators from broadcasting.
- **Code:**

Update the typing handlers in `server/sockets/chatSocket.js`:
```js
socket.on("user_typing", (data) => {
  const targetRoom = typeof data === "object" ? data.chatId : data;
  if (targetRoom) {
    socket.to(targetRoom).emit("user_typing", { userId: socket.userId });
  }
});

socket.on("user_stop_typing", (data) => {
  const targetRoom = typeof data === "object" ? data.chatId : data;
  if (targetRoom) {
    socket.to(targetRoom).emit("user_stop_typing", { userId: socket.userId });
  }
});
```

Also ensure `sendMessage` saves `participants`:
```js
socket.on("sendMessage", async ({ chatId, text, recipientId }) => {
  try {
    if (!text?.trim()) return;

    let participants = [socket.userId];
    if (recipientId) participants.push(recipientId);

    const message = await Message.create({
      chatId,
      senderId: socket.userId,
      text: text.trim(),
      participants,
    });

    const populated = await Message.findById(message._id).populate(
      "senderId",
      "name avatar"
    );

    io.to(chatId).emit("receiveMessage", {
      ...message.toObject(),
      sender: populated.senderId,
    });
  } catch (err) {
    socket.emit("errorMessage", { message: "Failed to send message." });
  }
});
```

- **Verify:** Open two browser tabs $\rightarrow$ start typing $\rightarrow$ verify "typing..." bubble appears instantly without errors.
- **Commit:**
  ```bash
  git add server/sockets/chatSocket.js && git commit -m "fix(socket): accept both object and string payloads for typing events"
  ```

---

## Fix 3: Support Multipart Form Data & Cloudinary Files in `createListing`

- **File:** `server/controllers/listingController.js`
- **Why:** When Member 4 mounts Multer on `POST /api/listings`, `req.files` contains uploaded Cloudinary files. In multipart requests, stringified fields (e.g. `location`, `amenities`) must be parsed safely.
- **Code:**

Update `createListing` in `server/controllers/listingController.js`:
```js
exports.createListing = async (req, res) => {
  try {
    const data = { ...req.body, owner: req.user.id };

    // 1. Handle uploaded image files from Cloudinary via Multer
    if (req.files && req.files.length > 0) {
      data.images = req.files.map((file) => file.path);
    } else if (typeof data.images === "string") {
      try {
        data.images = JSON.parse(data.images);
      } catch {
        data.images = [data.images];
      }
    }

    // 2. Parse JSON strings if submitted via multipart FormData
    if (typeof data.location === "string") {
      try {
        data.location = JSON.parse(data.location);
      } catch {}
    }
    if (typeof data.amenities === "string") {
      try {
        data.amenities = JSON.parse(data.amenities);
      } catch {}
    }

    // 3. Fallback coordinates for Greater Noida
    const DEFAULT_GREATER_NOIDA = [77.503, 28.4744];
    if (!data.location || !Array.isArray(data.location.coordinates)) {
      data.location = {
        type: "Point",
        coordinates: DEFAULT_GREATER_NOIDA,
        city: "Greater Noida",
        area: "Knowledge Park II",
      };
    }

    const listing = await Listing.create(data);
    const populated = await Listing.findById(listing._id).populate(
      "owner",
      "name role avatar isVerified"
    );

    res.status(201).json({ listing: populated || listing });
  } catch (err) {
    res.status(400).json({ message: "Could not create listing.", error: err.message });
  }
};
```

- **Commit:**
  ```bash
  git add server/controllers/listingController.js && git commit -m "feat(listings): support multipart file uploads and json fields in createListing"
  ```

---

## Fix 4: Ensure `/api/matches/:id` Evaluates On-Demand

- **File:** `server/controllers/matchController.js`
- **Why:** If a user clicks "View Compatibility" on a host/roommate pair that hasn't been cached yet in the database, `Match.findOne()` returns 404. It should automatically evaluate compatibility using `getOrEvaluateMatch(currentUser, targetUser)` so the frontend never receives a 404 during the live demo.
- **Code:**

Update `exports.getMatchDetail` in `server/controllers/matchController.js`:
```js
const { getOrEvaluateMatch } = require("../services/matchingEngine");
const User = require("../models/User");

exports.getMatchDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({ message: "Candidate user not found." });
    }

    // Evaluates via Gemini or heuristic fallback & saves to Match collection
    const match = await getOrEvaluateMatch(currentUser, targetUser);
    res.status(200).json({ compatibility: match });
  } catch (err) {
    res.status(500).json({ message: "Error evaluating match.", error: err.message });
  }
};
```

- **Verify:**
  ```bash
  curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/matches/<TARGET_USER_ID>
  ```
  Returns `{ compatibility: { compatibilityScore: 92, pros: [...], cons: [...], vibeSummary: "..." } }`.
- **Commit:**
  ```bash
  git add server/controllers/matchController.js && git commit -m "feat(matches): evaluate compatibility on demand for requested user"
  ```

---

## Fix 5: Add Explicit Logout Endpoint

- **File:** `server/routes/authRoutes.js` & `server/controllers/authController.js`
- **Why:** Client calls `POST /api/auth/logout`. Providing this endpoint prevents 404 errors during demo logout/login cycles.
- **Code:**
```js
// In authController.js
exports.logout = (req, res) => {
  res.status(200).json({ message: "Logged out successfully." });
};

// In authRoutes.js
router.post("/logout", authController.logout);
```
- **Commit:**
  ```bash
  git add server/routes/authRoutes.js server/controllers/authController.js && git commit -m "feat(auth): add logout endpoint"
  ```
