# Deployment Checklist

> **For the project owner only.** Run these steps after all four members have merged their fixes.
> Each step is manual — do not automate without verifying first.

---

## Pre-Deploy: Verify All Fixes Are Merged

- [ ] Member 3 commits merged (seed script updated, SEARCHING_ROOM user added)
- [ ] Member 2 commits merged (controller accepts files, auth returns user, logout endpoint)
- [ ] Member 4 commits merged (upload middleware mounted, env validation, .env removed from git)
- [ ] Member 1 commits merged (mock imports removed, file upload UI, auth context fixed)
- [ ] `npm run build` in `client/` succeeds with zero errors
- [ ] `npm start` in `server/` connects to MongoDB and starts on port 5000

---

## Step 1: Rotate Exposed Secrets (CRITICAL — do this first)

The file `server/.env` was committed to git with real credentials. Even after removing it from tracking, the history contains the secrets.

| Secret | Where to rotate |
|--------|----------------|
| MongoDB password (`vaibhavakumarshrivastav`) | [MongoDB Atlas](https://cloud.mongodb.com) → Database Access → Edit user → Change password |
| `JWT_SECRET` | Generate new: `openssl rand -base64 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Create new key → delete old key |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | [Cloudinary Dashboard](https://console.cloudinary.com) → Settings → Access Keys → Regenerate |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Edit OAuth client |

After rotating, update the new values in:
1. Your local `server/.env` file
2. Render Dashboard environment variables (see Step 4)

---

## Step 2: MongoDB Atlas — Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → Network Access
2. Add IP: `0.0.0.0/0` (allow access from anywhere)
   - This is required for Render's dynamic IPs
   - For production, consider using Render's static outbound IPs instead
3. Verify the database user has `readWrite` permissions on the `flatmate` database

---

## Step 3: Run the Seed Script Once Against Atlas

After Member 3's fixes are merged and secrets are rotated:

```bash
cd server
# Ensure MONGO_URI in .env points to the Atlas cluster with the NEW password
node scripts/seed.js
```

Expected output:
```
Connected to MongoDB for seeding Greater Noida dataset...
Ensured 6 Greater Noida demo hosts exist.
Cleared old listings (FORCE_SEED enabled).
Successfully seeded 8 Greater Noida listings!
Disconnected from MongoDB.
```

Verify in MongoDB Compass or Atlas Data Explorer:
- [ ] `users` collection has 6 documents (5 HAS_ROOM + 1 SEARCHING_ROOM)
- [ ] `listings` collection has 8 documents
- [ ] Each listing's `owner` field is a valid ObjectId referencing a user
- [ ] User documents have `habitVector` with 6 numeric fields
- [ ] User documents have `location` with valid GeoJSON `coordinates`
- [ ] 2dsphere indexes exist on both `users.location` and `listings.location`

---

## Step 4: Render — Backend Environment Variables

In [Render Dashboard](https://dashboard.render.com) → `flatmate-backend` → Environment:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Already in render.yaml |
| `MONGO_URI` | `mongodb+srv://...` | Use the NEW password from Step 1 |
| `JWT_SECRET` | `<new-random-string>` | From Step 1 |
| `GEMINI_API_KEY` | `<new-key>` | From Step 1 |
| `CLOUDINARY_CLOUD_NAME` | `flatmate` | Same as before |
| `CLOUDINARY_API_KEY` | `<new-key>` | From Step 1 |
| `CLOUDINARY_API_SECRET` | `<new-secret>` | From Step 1 |
| `GOOGLE_CLIENT_ID` | `354193558678-...` | Same unless rotated |
| `CLIENT_URL` | `https://flatmate-frontend.onrender.com` | Replace with actual frontend URL |
| `PORT` | `5000` | Optional — Render provides its own PORT |

---

## Step 5: Render — Frontend Environment Variables & Rebuild

In Render Dashboard → `flatmate-frontend` → Environment:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://flatmate-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://flatmate-backend.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | `354193558678-d709l59hme6g0fsftt3a48shgafa3tbd.apps.googleusercontent.com` |

**Important:** Vite inlines `VITE_*` variables at build time. After setting these, trigger a **manual deploy** (or push a commit) to rebuild the frontend with the new values.

Verify the `render.yaml` already has SPA rewrite:
```yaml
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```
✅ This is already present in the current `render.yaml`.

---

## Step 6: Google Cloud — Authorized JavaScript Origins

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Select the OAuth 2.0 Client ID (`354193558678-...`)
3. Under **Authorized JavaScript origins**, add:
   - `https://flatmate-frontend.onrender.com`
   - `http://localhost:3000` (for local development)
4. Under **Authorized redirect URIs**, add:
   - `https://flatmate-frontend.onrender.com`
   - `http://localhost:3000`
5. Save

---

## Step 7: Cloudinary — Verify Configuration

1. Go to [Cloudinary Dashboard](https://console.cloudinary.com)
2. Verify cloud name is `flatmate`
3. In **Settings → Upload**, ensure:
   - Unsigned uploads are disabled (we use signed uploads via the server)
   - The `flatmate` folder exists in Media Library
4. The API key and secret should ONLY be in the server `.env` / Render env vars
   - **Never expose Cloudinary secrets in client-side code**

---

## Step 8: Post-Deploy Smoke Test

After deployment, verify each service end-to-end:

### MongoDB
- [ ] Open `https://flatmate-backend.onrender.com/api/listings` (with auth token) → returns 8 seeded listings
- [ ] Each listing has an `owner` object with `name`, `role`, `isVerified`

### Gemini
- [ ] Open `https://flatmate-backend.onrender.com/api/matches` (with auth token for a SEARCHING_ROOM user) → returns compatibility results
- [ ] Server logs show successful Gemini API calls OR "heuristic fallback" (both are acceptable)
- [ ] Match documents are created in the `matches` collection

### Cloudinary
- [ ] Create a new listing with an image upload via the UI
- [ ] The listing response contains `images: ["https://res.cloudinary.com/flatmate/..."]`
- [ ] The image is visible in Cloudinary's Media Library under the `flatmate` folder

### Frontend
- [ ] Homepage loads and shows featured listings from the API (no Unsplash URLs)
- [ ] Dashboard shows all seeded listings with real data
- [ ] Profile page shows real user data (no "Kartik Sharma" hardcoded fallback)
- [ ] Listing detail page shows real compatibility data from Gemini/heuristic
- [ ] "Post a Room" modal allows file upload and creates a listing with Cloudinary images
- [ ] Login/Register works and stores user data correctly
- [ ] Chat works via Socket.io

### Security
- [ ] `server/.env` is NOT in the git repository (check with `git ls-files server/.env`)
- [ ] Browser DevTools → Network → no requests to `localhost` (all go to Render URLs)
- [ ] CORS: no CORS errors in browser console

---

## Step 9: Key Confirmation

Verify these keys/values are correct and active:

| Key | How to test |
|-----|-------------|
| `GEMINI_API_KEY` | Server logs show `Gemini evaluation` (success or timeout), not `PERMISSION_DENIED` |
| `GEMINI model` | Currently `gemini-2.0-flash` in `geminiService.js:26` — confirm this model is available |
| `MONGO_URI` | Server startup logs `MongoDB connected.` |
| `CLOUDINARY_*` | Image upload test (Step 8) succeeds |
| `GOOGLE_CLIENT_ID` | Google Sign-In button works on the frontend |

---

## Rollback Plan

If deployment fails:
1. Check Render logs for the backend service
2. Common issues:
   - `Missing required env vars` → verify all env vars are set in Render
   - `MongoDB connection error` → check Atlas Network Access allows `0.0.0.0/0`
   - `CORS error` → verify `CLIENT_URL` matches the frontend URL exactly (with `https://`)
   - `Gemini API timeout` → the matching engine falls back to heuristic; not a blocker
3. Frontend shows blank page → check browser console for errors; likely `VITE_API_BASE_URL` is wrong

