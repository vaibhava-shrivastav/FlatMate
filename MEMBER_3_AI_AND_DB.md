# MEMBER 3 — Gemini Integration & Database Architect

## 1. Setup Guide

```bash
mkdir -p server/models server/services
cd server
npm install mongoose @google/genai dotenv
```

`server/.env`
```
GEMINI_API_KEY=your_gemini_api_key
MONGO_URI=mongodb+srv://...
```

## 2. Folder Structure (Owned)

```
server/
├── models/
│   ├── User.js
│   ├── Listing.js
│   ├── Match.js
│   └── Message.js
├── services/
│   ├── geminiService.js
│   └── matchingEngine.js
```
**Forbidden:** `server/controllers/`, `server/routes/`, `server/sockets/`, `server.js`. Export schemas/functions cleanly; do not write route handling logic here.

## 3. User.js

```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
  role: { type: String, enum: ["SEARCHING_ROOM", "HAS_ROOM"] },
  budget: { type: Number },
  onboardingComplete: { type: Boolean, default: false },
  habitVector: {
    sleepSchedule: Number,
    cleanliness: Number,
    smoking: Number,
    cooking: Number,
    guests: Number,
    noise: Number,
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
}, { timestamps: true });

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
```

## 4. Listing.js

```javascript
const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  rent: { type: Number, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

listingSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Listing", listingSchema);
```

## 5. Match.js (AI Cache)

```javascript
const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  userA: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userB: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  compatibilityScore: { type: Number, required: true },
  pros: [{ type: String }],
  cons: [{ type: String }],
  vibeSummary: { type: String },
  isFallback: { type: Boolean, default: false },
}, { timestamps: true });

matchSchema.index({ userA: 1, userB: 1 }, { unique: true });

module.exports = mongoose.model("Match", matchSchema);
```

## 6. Message.js

```javascript
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
```

## 7. geminiService.js

```javascript
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a roommate compatibility evaluator. Given two lifestyle habit
vectors (scale 1-5) for sleepSchedule, cleanliness, smoking, cooking, guests, noise, respond
ONLY with strict JSON, no markdown, in this exact shape:
{"compatibilityScore": number (0-100), "pros": string[], "cons": string[], "vibeSummary": string}`;

async function evaluateCompatibility(userA, userB) {
  try {
    const prompt = `${SYSTEM_PROMPT}\nUser A: ${JSON.stringify(userA.habitVector)}\nUser B: ${JSON.stringify(userB.habitVector)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const raw = response.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);

    if (
      typeof parsed.compatibilityScore !== "number" ||
      !Array.isArray(parsed.pros) ||
      !Array.isArray(parsed.cons)
    ) {
      throw new Error("Malformed Gemini response shape.");
    }
    return { ...parsed, isFallback: false };
  } catch (err) {
    const status = err?.status || err?.response?.status;
    console.error("Gemini evaluation failed:", status || err.message);
    throw err;
  }
}

module.exports = { evaluateCompatibility };
```

## 8. matchingEngine.js (Two-tier pipeline + fallback)

```javascript
const User = require("../models/User");
const Match = require("../models/Match");
const { evaluateCompatibility } = require("./geminiService");

function heuristicFallbackScore(userA, userB) {
  const keys = Object.keys(userA.habitVector || {});
  if (!keys.length) return 50;
  const diffSum = keys.reduce(
    (sum, k) => sum + Math.abs((userA.habitVector[k] || 3) - (userB.habitVector[k] || 3)), 0
  );
  const maxDiff = keys.length * 4;
  return Math.round(100 - (diffSum / maxDiff) * 100);
}

async function findCandidates(user) {
  const oppositeRole = user.role === "SEARCHING_ROOM" ? "HAS_ROOM" : "SEARCHING_ROOM";
  return User.find({
    _id: { $ne: user._id },
    role: oppositeRole,
    onboardingComplete: true,
    location: {
      $near: {
        $geometry: user.location,
        $maxDistance: 15000,
      },
    },
  }).limit(20);
}

async function getOrEvaluateMatch(userA, userB) {
  const [first, second] = [userA._id, userB._id].sort();
  let match = await Match.findOne({ userA: first, userB: second });
  if (match) return match;

  try {
    const result = await evaluateCompatibility(userA, userB);
    match = await Match.create({ userA: first, userB: second, ...result });
  } catch (err) {
    const fallbackScore = heuristicFallbackScore(userA, userB);
    match = await Match.create({
      userA: first,
      userB: second,
      compatibilityScore: fallbackScore,
      pros: [],
      cons: [],
      vibeSummary: "AI evaluation unavailable; using heuristic score.",
      isFallback: true,
    });
  }
  return match;
}

async function runMatchingPipeline(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found for matching.");

  const candidates = await findCandidates(user);
  const matches = [];
  for (const candidate of candidates) {
    const match = await getOrEvaluateMatch(user, candidate);
    matches.push({ candidate, match });
  }
  return matches.sort((a, b) => b.match.compatibilityScore - a.match.compatibilityScore);
}

module.exports = { runMatchingPipeline, getOrEvaluateMatch };
```


