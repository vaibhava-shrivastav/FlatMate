# Member 2 — Backend Fixes

> **Scope:** Server controllers, routes, and API responses. Ensure controllers query Mongoose models (no static arrays), listing create accepts Cloudinary image URLs, and all API responses have consistent shapes.
>
> **Pre-requisites:** Member 3 must have seeded the database first so there is data to query.

---

## Audit Findings (Phase 0)

**Controllers already use Mongoose models correctly:**
- `listingController.js`: Uses `Listing.create()`, `Listing.find()`, `Listing.findById()`, etc. ✅
- `matchController.js`: Uses `runMatchingPipeline()` and `Match.findOne()` ✅
- `userController.js`: Uses `User.findById()`, `User.findByIdAndUpdate()` ✅
- `authController.js`: Uses `User.findOne()`, `User.create()` ✅

**No static array responses found in controllers** — all controllers query MongoDB. ✅

**Key issues found:**
1. Listing `createListing` does **not** accept uploaded file URLs — it takes whatever `req.body.images` contains (Unsplash URLs from the client).
2. The response shape for `getListings` wraps data in `{ listings }` which is correct, but `createListing` returns the populated listing directly (not wrapped). The client handles both.

---

## Fix 1: Accept Cloudinary URLs from the upload middleware in createListing (High)

- **File:** `server/controllers/listingController.js:5-30`
- **Why:** When Member 4 adds the `upload.array('images')` multer middleware to the listing create route, `req.files` will contain Cloudinary URLs. The controller must merge those URLs into `data.images`. Currently `data.images` is only populated from `req.body.images` (which the client sends as a JSON string array).
- **Code:**

Before (`server/controllers/listingController.js:5-8`):
```js
exports.createListing = async (req, res) => {
  try {
    const data = { ...req.body, owner: req.user.id };
```

After:
```js
exports.createListing = async (req, res) => {
  try {
    const data = { ...req.body, owner: req.user.id };

    // If multer-cloudinary uploaded files, use their URLs
    if (req.files && req.files.length > 0) {
      data.images = req.files.map((f) => f.path);
    }
```

- **Verify:** After Member 4 mounts the upload middleware:
  ```bash
  curl -X POST http://localhost:5000/api/listings \
    -H "Authorization: Bearer <token>" \
    -F "title=Test Room" \
    -F "rent=8000" \
    -F "roomType=private" \
    -F 'location={"type":"Point","coordinates":[77.5,28.47],"city":"Greater Noida","area":"KP II"}' \
    -F "images=@/path/to/room.jpg"
  ```
  The response should contain an `images` array with Cloudinary `res.cloudinary.com` URLs.
- **Depends on:** Member 4 Fix 1 (upload middleware mounted on route)
- **Commit:**
  ```bash
  git add server/controllers/listingController.js && git commit -m "feat(listings): accept Cloudinary uploaded file URLs in createListing"
  ```

---

## Fix 2: Parse JSON string fields when receiving multipart/form-data (Medium)

- **File:** `server/controllers/listingController.js:5-30`
- **Why:** When the frontend sends a `FormData` (multipart) request, fields like `location` and `amenities` arrive as JSON strings, not parsed objects. The controller needs to handle this.
- **Code:**

Add after the `req.files` block from Fix 1:
```js
    // Parse JSON string fields from multipart form-data
    if (typeof data.location === "string") {
      try { data.location = JSON.parse(data.location); } catch {}
    }
    if (typeof data.amenities === "string") {
      try { data.amenities = JSON.parse(data.amenities); } catch {}
    }
```

- **Verify:** Submit a listing via the UI with images — `location` and `amenities` should be saved as objects/arrays in MongoDB, not as strings.
- **Depends on:** Fix 1 above
- **Commit:**
  ```bash
  git add server/controllers/listingController.js && git commit -m "fix(listings): parse JSON string fields from multipart form-data"
  ```

---

## Fix 3: Add a logout endpoint (Critical, AUDIT ref: authRoutes.js)

- **File:** `server/routes/authRoutes.js`, `server/controllers/authController.js`
- **Why:** The client calls `api.post('/auth/logout')` (see `client/src/services/authService.js`), but no such route exists. The client receives a 404, which triggers the 401 interceptor redirect. This is a no-op logout (JWT is stateless), but the endpoint must exist to avoid 404 errors.
- **Code:**

In `server/controllers/authController.js`, add at the bottom before the closing:
```js
exports.logout = (req, res) => {
  // JWT is stateless — nothing to invalidate server-side.
  // This endpoint exists so the client POST /auth/logout does not 404.
  res.status(200).json({ message: "Logged out successfully." });
};
```

In `server/routes/authRoutes.js`, add after the existing routes:

Before:
```js
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const c = require("../controllers/authController");
```

After (add the logout route — note: no `auth` middleware needed since we're not validating the token on logout):
```js
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const c = require("../controllers/authController");

// ... existing routes ...
router.post("/logout", c.logout);
```

- **Verify:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/logout
  # Should return: {"message":"Logged out successfully."}
  ```
- **Depends on:** Nothing
- **Commit:**
  ```bash
  git add server/controllers/authController.js server/routes/authRoutes.js && git commit -m "fix(auth): add logout endpoint to prevent 404"
  ```

---

## Fix 4: Return user data after login/register (Critical, AUDIT ref: authService.js:5-17)

- **File:** `server/controllers/authController.js`
- **Why:** The login and register endpoints return `{ token }` or `{ token, isNewUser }` but NOT the user object. The client's `AuthContext` stores whatever is returned as "the user", causing `user.name`, `user.role`, etc. to be `undefined`. The fix is to also return the user document.
- **Code:**

In `server/controllers/authController.js`, for the `register` function:

Before (approx line 22):
```js
    res.status(201).json({ token: signToken(user._id), isNewUser: true });
```

After:
```js
    const userResponse = await User.findById(user._id).select("-password");
    res.status(201).json({ token: signToken(user._id), user: userResponse, isNewUser: true });
```

For the `login` function:

Before (approx line 38):
```js
    res.status(200).json({ token: signToken(user._id) });
```

After:
```js
    const userResponse = await User.findById(user._id).select("-password");
    res.status(200).json({ token: signToken(user._id), user: userResponse });
```

For the `googleAuth` function:

Before (approx line 115):
```js
    res.status(200).json({ token: signToken(user._id), isNewUser });
```

After:
```js
    const userResponse = await User.findById(user._id).select("-password");
    res.status(200).json({ token: signToken(user._id), user: userResponse, isNewUser });
```

- **Verify:** Login via the UI → open browser DevTools Network tab → the `/auth/login` response body should include a `user` object with `name`, `email`, `role`, etc.
- **Depends on:** Nothing
- **Commit:**
  ```bash
  git add server/controllers/authController.js && git commit -m "fix(auth): return user object in login/register/google responses"
  ```

---

## Fix 5: Populate owner field in getListings to include isVerified (Low)

- **File:** `server/controllers/listingController.js:57-58`
- **Why:** `getListings` populates with `"name role isVerified"` — which is correct. No change needed. Just verify the client receives `owner.isVerified`.
- **Code:** No change needed.
- **Verify:** `GET /api/listings` → each listing should have `owner: { _id, name, role, isVerified }`.
- **Commit:** N/A

---

## Summary Checklist

| # | Fix | Severity | File(s) | Status |
|---|-----|----------|---------|--------|
| 1 | Accept Cloudinary URLs from upload middleware | High | `server/controllers/listingController.js` | TODO |
| 2 | Parse JSON string fields in multipart requests | Medium | `server/controllers/listingController.js` | TODO |
| 3 | Add logout endpoint | Critical | `server/controllers/authController.js`, `server/routes/authRoutes.js` | TODO |
| 4 | Return user data in auth responses | Critical | `server/controllers/authController.js` | TODO |
| 5 | Verify owner populate includes isVerified | Low | `server/controllers/listingController.js` | Verify only |

