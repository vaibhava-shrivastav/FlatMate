# Member 4 — Lead Integrator Fixes

> **Scope:** Wire the upload middleware onto the listing route, CORS configuration, PORT binding, DB-before-listen ordering, env var validation, socket security, and deployment infrastructure.
>
> **Pre-requisites:** Member 2 Fix 1 (controller accepts `req.files`) should be applied first, but can be done in any order as long as both are merged before testing.

---

## Audit Findings (Phase 0)

| Finding | Status |
|---------|--------|
| `uploadMiddleware.js` exists and is fully configured with `multer-storage-cloudinary` | ✅ Exists, but **never imported or used** in any route file |
| `server.js` connects to DB before `server.listen()` | ✅ Correct (`connectDB().then(... server.listen(...))`) |
| `server.js` binds to `0.0.0.0` | ✅ Correct (line 75: `server.listen(PORT, "0.0.0.0", ...)`) |
| CORS uses `process.env.CLIENT_URL` | ✅ Correct (line 28) |
| Env var validation exists for `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` | ✅ Correct (lines 4-8) |
| `server/.env` is committed to git | ⚠️ Root `.gitignore` has `server/.env` but `server/.env` still exists in repo |
| Socket `sendMessage` lacks sender validation | ⚠️ From AUDIT.md |

---

## Fix 1: Mount upload middleware on the listing create route (Critical)

- **File:** `server/routes/listingRoutes.js:5`
- **Why:** The `uploadMiddleware.js` file defines a fully configured multer-cloudinary storage engine, but it is **never imported or mounted** on any route. The `POST /api/listings` route currently only accepts JSON `req.body`. To support real image uploads, the upload middleware must be added to this route.
- **Code:**

Before (`server/routes/listingRoutes.js`):
```js
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

After:
```js
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const c = require("../controllers/listingController");

router.post("/", auth, upload.array("images", 5), c.createListing);
router.get("/", auth, c.getListings);
router.get("/:id", auth, c.getListingById);
router.put("/:id", auth, c.updateListing);
router.delete("/:id", auth, c.deleteListing);

module.exports = router;
```

- **Verify:** Use Postman or curl to POST a listing with an image file:
  ```bash
  curl -X POST http://localhost:5000/api/listings \
    -H "Authorization: Bearer <token>" \
    -F "title=Test Upload" \
    -F "rent=8000" \
    -F "roomType=private" \
    -F 'location={"type":"Point","coordinates":[77.5,28.47],"city":"Greater Noida","area":"KP II"}' \
    -F "images=@room_photo.jpg"
  ```
  The response should contain `images: ["https://res.cloudinary.com/flatmate/image/upload/..."]`.
- **Depends on:** Member 2 Fix 1 (controller reads `req.files`)
- **Commit:**
  ```bash
  git add server/routes/listingRoutes.js && git commit -m "feat(listings): mount multer-cloudinary upload middleware on POST /listings"
  ```

---

## Fix 2: Add missing Cloudinary/Gemini env vars to the required env check (Medium)

- **File:** `server/server.js:4`
- **Why:** The startup validation only checks `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`. If `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, or `GEMINI_API_KEY` are missing, the server starts but uploads and matching silently fail at runtime.
- **Code:**

Before:
```js
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
```

After:
```js
const REQUIRED_ENV = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLIENT_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "GEMINI_API_KEY",
];
```

- **Verify:** Remove `GEMINI_API_KEY` from `.env` temporarily, start the server. It should exit with:
  ```
  ❌ Missing required env vars: GEMINI_API_KEY
  ```
- **Depends on:** Nothing
- **Commit:**
  ```bash
  git add server/server.js && git commit -m "fix(server): validate all required env vars at startup"
  ```

---

## Fix 3: Rotate exposed secrets and verify .gitignore (Critical, AUDIT ref: server/.env)

- **File:** `.gitignore` (root), `server/.gitignore`
- **Why:** `server/.env` contains real credentials (MongoDB URI with password, JWT secret, Gemini API key, Cloudinary credentials, Google Client ID) and is committed to git. The root `.gitignore` has `server/.env` which should prevent future commits, but the file is already tracked.
- **Code:**

**Step 1:** Verify `.gitignore` entries:

Root `.gitignore` (line 1) already has:
```
server/.env
```

`server/.gitignore` (lines 5-11) already has:
```
.env
.env.local
.env.development
.env.test
.env.production
*.env
```

Both are correct. ✅

**Step 2:** Remove `server/.env` from git tracking (without deleting the file):
```bash
git rm --cached server/.env
git commit -m "security(env): remove server/.env from git tracking"
```

**Step 3:** Rotate ALL exposed secrets on the respective dashboards:
- **MongoDB Atlas:** Change the `vaibhavakumarshrivastav` user password → update `MONGO_URI`
- **Cloudinary:** Regenerate API key/secret from Cloudinary Dashboard → Settings → Security
- **Gemini:** Generate a new API key from Google AI Studio → update `GEMINI_API_KEY`
- **JWT_SECRET:** Generate a new random string (e.g. `openssl rand -base64 32`)
- **Google Client ID:** If the client secret was exposed, regenerate in Google Cloud Console

**Step 4:** Update the new secrets in:
- Render Dashboard → Environment Variables (for production)
- Local `server/.env` file (for development)

- **Verify:** `git status` should NOT show `server/.env` as tracked. `git log --diff-filter=D -- server/.env` should show it was removed.
- **Depends on:** Nothing (do this FIRST for security)
- **Commit:**
  ```bash
  git rm --cached server/.env && git commit -m "security(env): remove .env from git tracking, rotate all secrets"
  ```

---

## Fix 4: Add socket sendMessage validation (High, AUDIT ref: chatSocket.js:24-32)

- **File:** `server/sockets/chatSocket.js`
- **Why:** The `sendMessage` handler does not verify that `senderId` matches the authenticated socket user, allowing message spoofing.
- **Code:**

Read the current `chatSocket.js` file and find the `sendMessage` handler. Add validation:

```js
socket.on("sendMessage", async (data) => {
  // Validate sender matches authenticated user
  if (data.senderId !== socket.userId) {
    return socket.emit("error", { message: "Sender ID mismatch." });
  }
  // ... rest of existing handler
});
```

> **Note:** This requires the socket authentication to set `socket.userId`. Check if it's already set in the connection handler. If not, add JWT verification on socket connection.

- **Verify:** Try sending a message with a spoofed `senderId` via a socket client — it should be rejected.
- **Depends on:** Nothing
- **Commit:**
  ```bash
  git add server/sockets/chatSocket.js && git commit -m "fix(socket): validate senderId matches authenticated user"
  ```

---

## Fix 5: Set CLIENT_URL for production in render.yaml (Medium)

- **File:** `render.yaml:21-23`
- **Why:** The `render.yaml` backend service only sets `NODE_ENV=production`. The `CLIENT_URL` env var (used for CORS) must be set to the Render frontend URL so API calls from the deployed frontend are not blocked by CORS.
- **Code:**

Before:
```yaml
    envVars:
      - key: NODE_ENV
        value: production
```

After:
```yaml
    envVars:
      - key: NODE_ENV
        value: production
      - key: CLIENT_URL
        value: https://flatmate-frontend.onrender.com
```

> **Important:** Replace `flatmate-frontend.onrender.com` with the actual Render static site URL after deployment.

Also, the remaining env vars (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLOUDINARY_*`, `GOOGLE_CLIENT_ID`) must be set in the Render Dashboard → flatmate-backend → Environment, **not** in `render.yaml` (since they contain secrets).

- **Verify:** After deploy, open the frontend and check browser DevTools Console for CORS errors. There should be none.
- **Depends on:** Deployment
- **Commit:**
  ```bash
  git add render.yaml && git commit -m "fix(deploy): add CLIENT_URL to render.yaml for CORS"
  ```

---

## Fix 6: Set VITE_API_BASE_URL and VITE_SOCKET_URL for production build (High)

- **File:** `client/.env` (and Render environment)
- **Why:** `client/.env` has `VITE_API_BASE_URL=http://localhost:5000/api` and `VITE_SOCKET_URL=http://localhost:5000`. In production, these must point to the Render backend URL. Vite inlines env vars at build time, so they must be set as Render environment variables on the **static site** service before building.
- **Code:**

In Render Dashboard → flatmate-frontend → Environment Variables, set:
```
VITE_API_BASE_URL=https://flatmate-backend.onrender.com/api
VITE_SOCKET_URL=https://flatmate-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=354193558678-d709l59hme6g0fsftt3a48shgafa3tbd.apps.googleusercontent.com
```

Then trigger a rebuild of the frontend static site. The env vars are baked into the JavaScript bundle at build time.

- **Verify:** After deploy, open the browser DevTools → Network tab → API calls should go to `https://flatmate-backend.onrender.com/api/...`, not `localhost`.
- **Depends on:** Backend deployed first
- **Commit:** N/A (Render dashboard config, not code)

---

## Summary Checklist

| # | Fix | Severity | File(s) | Status |
|---|-----|----------|---------|--------|
| 1 | Mount upload middleware on POST /listings | Critical | `server/routes/listingRoutes.js` | TODO |
| 2 | Validate all required env vars at startup | Medium | `server/server.js` | TODO |
| 3 | Rotate exposed secrets, remove .env from git | Critical | `.gitignore`, `server/.env` | TODO |
| 4 | Socket sendMessage validation | High | `server/sockets/chatSocket.js` | TODO |
| 5 | Set CLIENT_URL in render.yaml | Medium | `render.yaml` | TODO |
| 6 | Set VITE_* env vars for production | High | Render Dashboard | TODO |

