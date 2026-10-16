# MEMBER 3 — Gemini Integration & Database Architect

## Fix Order

| # | Fix Title | Severity | File | Depends on |
|---|-----------|----------|------|------------|
| 1 | Location field optional but geo query requires it | Critical | `server/models/User.js` | — |
| 2 | findCandidates crashes on missing location | Medium | `server/services/matchingEngine.js` | Fix 1 (same doc) |
| 3 | Match cache never expires | Medium | `server/services/matchingEngine.js`, `server/models/Match.js` | — |
| 4 | Gemini API call has no timeout | Low | `server/services/geminiService.js` | — |
| 5 | Match documents accumulate indefinitely | Low | `server/models/Match.js` | — |

---

## Fix 1: Location field optional but geo query requires it (AUDIT ref: Critical)

- **File:** `server/models/User.js:49-58`
- **Why:** The `location` field has no `default` or `required` constraint. When a user is created without location data, the coordinates are `undefined`, which causes the `$near` geo query in `findCandidates` to either throw a MongoDB error or silently return nothing.
- **Change:**

The location field should remain optional (users set it during onboarding), but we add a default that is explicitly `undefined` so it's clear there's no location, and the guard lives in `matchingEngine.js` (Fix 2). No schema change is strictly needed, but to improve clarity:

```javascript
// BEFORE (lines 49-58)
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },

// AFTER — no change needed here; the real fix is the guard in matchingEngine.js (Fix 2).
// However, remove any default: [0,0] if it exists in your local copy, because [0,0]
// is a valid GeoJSON point (Null Island) and would produce wrong $near results.
```

The onboarding flow (Member 1's `OnboardingQuiz.jsx` or a separate location step) should collect location. This is a coordination item — see **MEMBER_4_LEAD_INTEGRATOR.md** for the cross-member note.

- **Verify:** Create a user via `POST /api/auth/register` without setting location → `user.location` should be `undefined`, not `{ type: "Point", coordinates: [0, 0] }`.
- **Commit:** `git add server/models/User.js && git commit -m "fix(model): clarify location field is intentionally optional, remove misleading defaults"`

---

## Fix 2: findCandidates crashes on missing location (AUDIT ref: Medium)

- **File:** `server/services/matchingEngine.js:25-41`
- **Why:** `findCandidates` passes `user.location` directly to `$near.$geometry`. If the user has no location set, MongoDB throws `"$near requires a geojson point"`.
- **Change:**

```javascript
// BEFORE (lines 25-41)
async function findCandidates(user) {
  const oppositeRole =
    user.role === "SEARCHING_ROOM" ? "HAS_ROOM" : "SEARCHING_ROOM";

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

// AFTER
async function findCandidates(user) {
  // Guard: if user has no valid location, skip geo query entirely
  const hasValidLocation =
    user.location &&
    user.location.type === "Point" &&
    Array.isArray(user.location.coordinates) &&
    user.location.coordinates.length === 2 &&
    !(user.location.coordinates[0] === 0 && user.location.coordinates[1] === 0);

  const oppositeRole =
    user.role === "SEARCHING_ROOM" ? "HAS_ROOM" : "SEARCHING_ROOM";

  const query = {
    _id: { $ne: user._id },
    role: oppositeRole,
    onboardingComplete: true,
  };

  if (hasValidLocation) {
    query.location = {
      $near: {
        $geometry: user.location,
        $maxDistance: 15000,
      },
    };
  }
  // If no valid location, return candidates without distance filtering

  return User.find(query).limit(20);
}
```

- **Verify:** Create a user without location → call `GET /api/matches` → should return candidates (without geo filtering) instead of crashing.
- **Commit:** `git add server/services/matchingEngine.js && git commit -m "fix(matching): guard findCandidates against missing or invalid user location"`

---

## Fix 3: Match cache never expires (AUDIT ref: Medium)

- **File:** `server/models/Match.js:41` + `server/services/matchingEngine.js:44-72`
- **Why:** Once a Match document is created, it stays forever. If a user updates their habit vector, the cached score becomes stale and is never re-evaluated.
- **Change:**

In `server/models/Match.js`, add a TTL index:

```javascript
// BEFORE (line 41)
matchSchema.index({ userA: 1, userB: 1 }, { unique: true });

// AFTER (add a new index below the existing one)
matchSchema.index({ userA: 1, userB: 1 }, { unique: true });
matchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // 7-day TTL
```

No change needed in `matchingEngine.js` — `getOrEvaluateMatch` already re-creates the match if `findOne` returns null (cache miss), which is exactly what happens after the TTL deletes the old document.

- **Verify:** Check the MongoDB index: `db.matches.getIndexes()` → should show a TTL index on `createdAt` with `expireAfterSeconds: 604800`.
- **Commit:** `git add server/models/Match.js && git commit -m "fix(model): add 7-day TTL index on Match.createdAt to expire stale cache"`

---

## Fix 4: Gemini API call has no timeout (AUDIT ref: Low)

- **File:** `server/services/geminiService.js:22-25`
- **Why:** If Gemini is unresponsive, `evaluateCompatibility` hangs indefinitely, blocking the matching pipeline for the requesting user.
- **Change:**

```javascript
// BEFORE (lines 21-25)
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

// AFTER — wrap in Promise.race with a 10-second timeout
    const GEMINI_TIMEOUT_MS = 10000;

    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API timeout after 10s")), GEMINI_TIMEOUT_MS)
      ),
    ]);
```

- **Verify:** Temporarily set `GEMINI_TIMEOUT_MS` to 1 → the call should fail fast and fall back to heuristic scoring.
- **Commit:** `git add server/services/geminiService.js && git commit -m "fix(gemini): add 10s timeout to prevent indefinite hangs"`

---

## Fix 5: Match documents accumulate indefinitely (AUDIT ref: Low)

- **File:** `server/models/Match.js:34-37`
- **Why:** Without TTL, match documents grow unbounded, wasting storage.
- **Change:** Already addressed by **Fix 3** (the TTL index). No separate change needed.
- **Verify:** See Fix 3.
- **Commit:** Combined with Fix 3.

---

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


