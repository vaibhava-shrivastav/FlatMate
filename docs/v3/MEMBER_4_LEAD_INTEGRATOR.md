# Member 4 — Lead Integrator Implementation Plan (v3)

> **Goal:** Glue all frontend, backend, AI, and storage modules together. Mount file upload middleware, ensure cross-origin (CORS) compatibility for local and production demos, and run full-system smoke tests before the presentation.
>
> **Priority:** System stability and zero-failure deployment.

---

## Overview of Tasks

| # | Task | Priority | Files Touched |
|---|------|----------|---------------|
| 1 | Mount Multer-Cloudinary middleware on `listingRoutes.js` | 🔴 Critical | `server/routes/listingRoutes.js` |
| 2 | Enforce startup environment variable checks | 🟡 High Impact | `server/server.js` |
| 3 | Support multiple origins in CORS for dev/demo flexibility | 🟡 High Impact | `server/server.js` |
| 4 | Run integration smoke tests and build verification | 🟢 Polish | Full project |

---

## Fix 1: Mount Multer-Cloudinary on Listing Routes

- **File:** `server/routes/listingRoutes.js`
- **Why:** `uploadMiddleware.js` is fully configured with Cloudinary storage, but was never mounted on `POST /api/listings`. Adding `upload.array("images", 5)` enables processing real image uploads.
- **Code:**

Update `server/routes/listingRoutes.js`:
```js
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const c = require("../controllers/listingController");

// Mount multer-cloudinary middleware for up to 5 listing photos
router.post("/", auth, upload.array("images", 5), c.createListing);
router.get("/", auth, c.getListings);
router.get("/:id", auth, c.getListingById);
router.put("/:id", auth, c.updateListing);
router.delete("/:id", auth, c.deleteListing);

module.exports = router;
```

- **Verify:** Send a multipart POST request with an attached photo $\rightarrow$ verify the image appears in Cloudinary and the listing returns `res.cloudinary.com` URLs.
- **Commit:**
  ```bash
  git add server/routes/listingRoutes.js && git commit -m "feat(listings): mount multer upload middleware on POST /api/listings"
  ```

---

## Fix 2: Comprehensive Startup Environment Variable Validation

- **File:** `server/server.js`
- **Why:** Prevent silent failures during image upload or AI matching by verifying all essential credentials at server startup.
- **Code:**

Update the top of `server/server.js`:
```js
require("dotenv").config();

const REQUIRED_ENV = [
  "MONGO_URI",
  "JWT_SECRET",
  "GEMINI_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ FATAL: Missing required environment variables: ${missing.join(", ")}`);
  console.error("Please configure them in server/.env before launching.");
  process.exit(1);
}
```

- **Commit:**
  ```bash
  git add server/server.js && git commit -m "fix(server): enforce comprehensive environment variable check on boot"
  ```

---

## Fix 3: Flexible CORS Setup for Demo Displays

- **File:** `server/server.js`
- **Why:** During presentation setups, the frontend may run on `http://localhost:5173` (Vite dev), `http://localhost:3000`, or a deployed URL. Restricting CORS strictly to a single URL can block requests if you switch ports.
- **Code:**

Update CORS setup in `server/server.js`:
```js
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

const io = new Server(server, { cors: corsOptions });
```

- **Commit:**
  ```bash
  git add server/server.js && git commit -m "fix(cors): support standard dev ports and custom client URL"
  ```

---

## Fix 4: Full System Pre-Flight Smoke Test

Run these 4 verification steps before presentation day:

1. **Client Build Test:**
   ```bash
   cd client
   npm run build
   ```
   *Expected: Zero linting or Vite compilation errors.*

2. **Database Re-seed:**
   ```bash
   cd server
   node scripts/seed.js
   ```
   *Expected: Both hosts and seekers confirmed seeded.*

3. **Backend Health Check:**
   ```bash
   npm start
   ```
   *Expected:*
   ```
   Connected to MongoDB
   Socket server ready
   Server listening on port 5000
   ```

4. **Two-Window Live Test:**
   - Window 1: Chrome (Login as Host Kartik)
   - Window 2: Incognito / Edge (Login as Seeker Priya)
   - Send message from Priya to Kartik $\rightarrow$ instant delivery verified.
