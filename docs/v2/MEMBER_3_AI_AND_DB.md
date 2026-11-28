# Member 3 — AI & Database Fixes

> **Scope:** MongoDB seed data, Gemini integration health, 2dsphere indexes, Match cache, and removal of mock data sources from `server/services/`.
>
> **Pre-requisites:** None. These fixes are the foundation that Members 1, 2 and 4 depend on.

---

## Audit Status of Services (Phase 0 Findings)

| Service    | Status     | Evidence |
|------------|-----------|----------|
| MongoDB    | **WIRED** | `server/config/db.js:5` connects via `MONGO_URI`. `server.js:63-77` calls `connectDB()` then `server.listen()`. Auto-seeds if zero listings. |
| Gemini     | **WIRED** | `server/services/geminiService.js:4` creates `GoogleGenAI` with `GEMINI_API_KEY`. `matchingEngine.js:66` calls `evaluateCompatibility()`, cached in Match collection. Falls back to heuristic on failure. |
| Cloudinary | **PARTIAL** | `server/config/cloudinary.js` + `server/middleware/uploadMiddleware.js` are configured, but the upload middleware is **never mounted** on any route (see `server/routes/listingRoutes.js:5` — `router.post("/", auth, c.createListing)` — no `upload` middleware). The client `AddListingModal` sends a hardcoded Unsplash URL string instead of a file. |

### Seed Script Status

A seed script exists at `server/scripts/seed.js`. It:
- Creates 5 demo users (Kartik, Rhea, Arjun, Aman, Neha) with `habitVector` and GeoJSON locations.
- Creates 8 demo listings with **Unsplash URLs** as images.
- Uses `Listing.deleteMany({})` (destructive — clears all listings before re-seeding).
- Auto-runs from `server.js:66-69` when `Listing.countDocuments() === 0`.

**Problems with the current seed script:**
1. Images are Unsplash URLs, not Cloudinary URLs — ok for demo, but should be documented.
2. `Listing.deleteMany({})` on line 295 is destructive for a production DB.
3. All demo users have role `HAS_ROOM` — no `SEARCHING_ROOM` users exist, so the matching engine's `findCandidates` (which queries for the *opposite* role) will return **zero** matches for any demo user.
4. The seed password `demo12345` is hashed but shared across all users.

---

## Fix 1: Add a `SEARCHING_ROOM` demo user so matching actually works (Critical, AUDIT ref: matchingEngine.js:33-34)

- **File:** `server/scripts/seed.js:7-103`
- **Why:** `findCandidates()` queries `role: oppositeRole`. All 5 demo users have `role: "HAS_ROOM"`, so when any demo user runs the matching pipeline, zero candidates are returned. At least one `SEARCHING_ROOM` user is needed.
- **Code:**

Before (line 102, end of `demoUsers` array):
```js
    listings: ['gnoida-listing-8'],
  },
];
```

After:
```js
    listings: ['gnoida-listing-8'],
  },
  {
    name: "Priya Mehra",
    email: "priya.mehra@example.com",
    role: "SEARCHING_ROOM",
    budget: 9000,
    onboardingComplete: true,
    habitVector: {
      sleepSchedule: 8,
      cleanliness: 9,
      smoking: 1,
      cooking: 7,
      guests: 3,
      noise: 2,
    },
    location: {
      type: "Point",
      coordinates: [77.500, 28.470],
    },
  },
];
```

- **Verify:** After seeding, in Mongo shell or Compass:
  ```
  db.users.find({ role: "SEARCHING_ROOM" }).count()
  // Should be >= 1
  ```
- **Depends on:** Nothing
- **Commit:**
  ```bash
  git add server/scripts/seed.js && git commit -m "fix(seed): add SEARCHING_ROOM demo user for matching engine"
  ```

---

## Fix 2: Replace Unsplash image URLs in seed script with Cloudinary placeholder URLs (Medium)

- **File:** `server/scripts/seed.js:121-258` (all `images:` arrays in `demoListingsData`)
- **Why:** Seed data should use Cloudinary-hosted images so the production app is not dependent on Unsplash's CDN. Also validates that the Cloudinary cloud name is correctly configured.
- **Code:**

Upload 8 room photos to your Cloudinary `flatmate` folder manually (Dashboard → Media Library → Upload). Then replace each Unsplash URL in `demoListingsData`. Example for the first listing:

Before:
```js
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    ],
```

After (use your actual Cloudinary cloud name — currently `flatmate`):
```js
    images: [
      "https://res.cloudinary.com/flatmate/image/upload/v1/flatmate/room-kp2-a.jpg",
      "https://res.cloudinary.com/flatmate/image/upload/v1/flatmate/room-kp2-b.jpg",
    ],
```

Repeat for all 8 listing entries. If you have no real room photos yet, keep the Unsplash URLs and note that as a follow-up task.

- **Verify:** Open the Cloudinary URL in a browser — it should return an image.
- **Depends on:** Cloudinary env vars correctly set (Member 4 Fix 3)
- **Commit:**
  ```bash
  git add server/scripts/seed.js && git commit -m "fix(seed): use Cloudinary URLs for listing images"
  ```

---

## Fix 3: Ensure 2dsphere indexes are created (Low, AUDIT ref: models)

- **File:** `server/models/User.js:65`, `server/models/Listing.js:58`
- **Why:** Both files already declare `schema.index({ location: "2dsphere" })`. Mongoose automatically creates these indexes on startup when `autoIndex` is true (default in dev). In production, you should explicitly ensure they exist.
- **Code:** No code change needed — the indexes are already defined. This is a **verification step**.
- **Verify:** After seeding, run in Mongo shell:
  ```
  db.users.getIndexes()
  db.listings.getIndexes()
  ```
  Both should show a `2dsphere` index on the `location` field.
- **Depends on:** MongoDB Atlas Network Access allowing your IP (Deployment Checklist)
- **Commit:** N/A (no change)

---

## Fix 4: Make seed script non-destructive for production (Medium)

- **File:** `server/scripts/seed.js:295`
- **Why:** `Listing.deleteMany({})` erases all real user listings when the seed runs. In production, the auto-seed in `server.js:66-69` only fires when `Listing.countDocuments() === 0`, but if the seed is ever run manually, it wipes everything.
- **Code:**

Before:
```js
    // Clear previous listings so only Greater Noida listings are present
    await Listing.deleteMany({});
    console.log("Cleared old listings.");
```

After:
```js
    // In manual mode, clear old demo listings only; skip if production data exists
    if (manageConnection) {
      const existingCount = await Listing.countDocuments();
      if (existingCount > 0) {
        console.log(`Found ${existingCount} existing listings. Skipping seed to preserve data.`);
        console.log("Use --force to clear and reseed: FORCE_SEED=1 node scripts/seed.js");
        if (!process.env.FORCE_SEED) {
          await mongoose.disconnect();
          return;
        }
      }
      await Listing.deleteMany({});
      console.log("Cleared old listings (FORCE_SEED enabled).");
    }
```

- **Verify:** Run `node scripts/seed.js` twice — second run should skip without deleting.
- **Depends on:** Nothing
- **Commit:**
  ```bash
  git add server/scripts/seed.js && git commit -m "fix(seed): make seed non-destructive unless FORCE_SEED=1"
  ```

---

## Fix 5: Verify Match TTL index is operational (Low, AUDIT ref: Match.js:42)

- **File:** `server/models/Match.js:42`
- **Why:** The 7-day TTL index is already defined: `matchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 })`. This is correct. Just verify it was created in Atlas.
- **Code:** No code change needed.
- **Verify:** In Mongo shell:
  ```
  db.matches.getIndexes()
  ```
  Should show `{ createdAt: 1 }` with `expireAfterSeconds: 604800`.
- **Depends on:** Nothing
- **Commit:** N/A (no change)

---

## Fix 6: Validate Gemini service returns correct shape (Low, AUDIT ref: geminiService.js:14-53)

- **File:** `server/services/geminiService.js`
- **Why:** The Gemini timeout (10s via `Promise.race`) and response validation are already implemented. The `isFallback` field is returned. The matching engine already falls back to the heuristic score on failure. No code change needed — just verify the API key works.
- **Code:** No code change needed.
- **Verify:** Start the server with a valid `GEMINI_API_KEY` and run:
  ```bash
  curl -H "Authorization: Bearer <token>" http://localhost:5000/api/matches
  ```
  Check server logs for `Gemini evaluation failed` (means fallback worked) or a successful JSON response.
- **Depends on:** Valid `GEMINI_API_KEY` in `.env`
- **Commit:** N/A (no change)

---

## Summary Checklist

| # | Fix | Severity | File(s) | Status |
|---|-----|----------|---------|--------|
| 1 | Add SEARCHING_ROOM demo user | Critical | `server/scripts/seed.js` | TODO |
| 2 | Replace Unsplash URLs with Cloudinary URLs in seed | Medium | `server/scripts/seed.js` | TODO |
| 3 | Verify 2dsphere indexes | Low | `server/models/User.js`, `Listing.js` | Verify only |
| 4 | Make seed non-destructive | Medium | `server/scripts/seed.js` | TODO |
| 5 | Verify Match TTL index | Low | `server/models/Match.js` | Verify only |
| 6 | Validate Gemini service | Low | `server/services/geminiService.js` | Verify only |

