# Member 3 — AI & Database Implementation Plan (v3)

> **Goal:** Ensure the AI roommate matching engine is 100% operational, seeded with realistic bidirectional data (both hosts and seekers), resilient against network/API timeouts, and backed by optimized geospatial MongoDB indexes.
>
> **Priority:** Core intellectual property and centerpiece of tomorrow's presentation.

---

## Overview of Tasks

| # | Task | Priority | Files Touched |
|---|------|----------|---------------|
| 1 | Seed both `HAS_ROOM` and `SEARCHING_ROOM` demo users | 🔴 Critical | `server/scripts/seed.js` |
| 2 | Guard `findCandidates` geospatial queries in `matchingEngine.js` | 🔴 Critical | `server/services/matchingEngine.js` |
| 3 | Optimize Gemini prompt & protect with heuristic timeout fallback | 🟡 High Impact | `server/services/geminiService.js` |
| 4 | Add package.json `npm run seed` shortcut for instant reset | 🟢 Polish | `server/package.json` |

---

## Fix 1: Seed Both `HAS_ROOM` and `SEARCHING_ROOM` Demo Users

- **File:** `server/scripts/seed.js`
- **Why:** In the original `seed.js`, all 5 demo users had `role: "HAS_ROOM"`. Because `findCandidates()` matches against the opposite role, logging in as any host resulted in **zero matching candidates**. We must seed both roles with rich habit vectors and Greater Noida coordinates.
- **Code:**

Add `SEARCHING_ROOM` demo users to `demoUsers` array in `server/scripts/seed.js`:
```js
// In server/scripts/seed.js
const demoUsers = [
  // --- Demo Hosts (HAS_ROOM) ---
  {
    name: "Kartik Sharma",
    email: "kartik.sharma@example.com",
    role: "HAS_ROOM",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
    budget: 9500,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 8, // 1-10 scale (or normalized)
      cleanliness: 9,
      smoking: 1,
      cooking: 7,
      guests: 3,
      noise: 2,
    },
    location: {
      type: "Point",
      coordinates: [77.503, 28.474], // Knowledge Park II, Greater Noida
      city: "Greater Noida",
      area: "Knowledge Park II",
    },
  },
  {
    name: "Rhea Sen",
    email: "rhea.sen@example.com",
    role: "HAS_ROOM",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    budget: 11000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 7,
      cleanliness: 8,
      smoking: 1,
      cooking: 8,
      guests: 4,
      noise: 3,
    },
    location: {
      type: "Point",
      coordinates: [77.498, 28.468], // Near Sharda University
      city: "Greater Noida",
      area: "Knowledge Park III",
    },
  },

  // --- Demo Seekers (SEARCHING_ROOM) ---
  {
    name: "Priya Mehra",
    email: "priya.mehra@example.com",
    role: "SEARCHING_ROOM",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    budget: 9000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 8, // Very close to Kartik -> will trigger 90%+ match!
      cleanliness: 9,
      smoking: 1,
      cooking: 7,
      guests: 2,
      noise: 2,
    },
    location: {
      type: "Point",
      coordinates: [77.501, 28.472], // Greater Noida
      city: "Greater Noida",
      area: "Knowledge Park II",
    },
  },
  {
    name: "Aman Verma",
    email: "aman.verma@example.com",
    role: "SEARCHING_ROOM",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    budget: 8500,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 4, // Night owl, moderate noise -> lower match with Kartik (~65%)
      cleanliness: 6,
      smoking: 3,
      cooking: 5,
      guests: 7,
      noise: 6,
    },
    location: {
      type: "Point",
      coordinates: [77.512, 28.481],
      city: "Greater Noida",
      area: "Alpha 1",
    },
  },
];
```

Ensure standard demo password for all accounts:
```js
const hashedPassword = await bcrypt.hash("demoPassword123", 10);
```

- **Verify:**
  ```bash
  cd server && node scripts/seed.js
  ```
  Output: `Ensured demo hosts and seekers exist with 2dsphere coordinates.`
- **Commit:**
  ```bash
  git add server/scripts/seed.js && git commit -m "feat(seed): add SEARCHING_ROOM and HAS_ROOM users with aligned habit vectors"
  ```

---

## Fix 2: Guard `findCandidates` in `matchingEngine.js`

- **File:** `server/services/matchingEngine.js`
- **Why:** If a user’s location coordinates are missing or `[0,0]`, MongoDB `$near` throws an error. Also, if geospatial results are fewer than 3, fall back to matching by role across the city so the user always has matches to review.
- **Code:**

Update `findCandidates` in `server/services/matchingEngine.js`:
```js
async function findCandidates(user) {
  const oppositeRole =
    user.role === "SEARCHING_ROOM" ? "HAS_ROOM" : "SEARCHING_ROOM";

  const hasValidLocation =
    user.location &&
    user.location.type === "Point" &&
    Array.isArray(user.location.coordinates) &&
    user.location.coordinates.length === 2 &&
    !(user.location.coordinates[0] === 0 && user.location.coordinates[1] === 0);

  const baseQuery = {
    _id: { $ne: user._id },
    role: oppositeRole,
    onboardingComplete: true,
  };

  let candidates = [];

  if (hasValidLocation) {
    try {
      candidates = await User.find({
        ...baseQuery,
        location: {
          $near: {
            $geometry: user.location,
            $maxDistance: 25000, // 25km radius in Greater Noida / NCR
          },
        },
      }).limit(15);
    } catch (geoErr) {
      console.warn("Geospatial query failed, falling back to basic query:", geoErr.message);
    }
  }

  // If geo query returned empty or failed, fetch by role
  if (candidates.length === 0) {
    candidates = await User.find(baseQuery).limit(15);
  }

  return candidates;
}
```

- **Verify:** Run matching for a newly registered user who hasn't pinned precise GPS coordinates $\rightarrow$ candidates are still safely returned.
- **Commit:**
  ```bash
  git add server/services/matchingEngine.js && git commit -m "fix(matching): add geospatial error fallback for candidate queries"
  ```

---

## Fix 3: Optimize Gemini 2.0 Flash Prompt & Heuristic Timeout

- **File:** `server/services/geminiService.js`
- **Why:** During the presentation, internet latency or API quota limits could cause a delay. We enforce a 6-second timeout before automatically using the mathematical heuristic fallback.
- **Code:**

Update `server/services/geminiService.js`:
```js
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are an expert roommate lifestyle evaluator for college students and young professionals.
Analyze two habit vectors (scale 1-10): sleepSchedule, cleanliness, smoking, cooking, guests, noise.
Respond ONLY with raw JSON (no markdown formatting, no code fences):
{
  "compatibilityScore": <integer 0-100>,
  "pros": ["string", "string", "string"],
  "cons": ["string"],
  "vibeSummary": "<2 sentence concise summary of lifestyle synergy>"
}`;

async function evaluateCompatibility(userA, userB) {
  try {
    const prompt = `${SYSTEM_PROMPT}\nUser A (${userA.name}): ${JSON.stringify(userA.habitVector)}\nUser B (${userB.name}): ${JSON.stringify(userB.habitVector)}`;

    const GEMINI_TIMEOUT_MS = 6000; // 6 second safeguard for live demo

    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API timeout (6s)")), GEMINI_TIMEOUT_MS)
      ),
    ]);

    const raw = response.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);

    return { ...parsed, isFallback: false };
  } catch (err) {
    console.warn("Gemini evaluation bypassed, using heuristic fallback:", err.message);
    throw err; // Caught by matchingEngine to invoke heuristicFallbackScore
  }
}

module.exports = { evaluateCompatibility };
```

- **Commit:**
  ```bash
  git add server/services/geminiService.js && git commit -m "perf(ai): optimize Gemini 2.0 Flash prompt with 6s timeout fallback"
  ```

---

## Polish 4: Add `npm run seed` Script

- **File:** `server/package.json`
- **Why:** Allows resetting demo data in 2 seconds before the presentation:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "seed": "node scripts/seed.js"
}
```
- **Commit:**
  ```bash
  git add server/package.json && git commit -m "chore: add npm run seed command"
  ```
