# Member 1 — Frontend Fixes

> **Scope:** Remove all mock/demo data imports and hardcoded photo URLs from the client. Wire every page to fetch data from the live API. Add loading, empty, and error states. Convert the listing creation flow to upload images via the API.
>
> **Pre-requisites:** Members 2, 3, and 4 should apply their fixes first so the API returns real data and accepts image uploads. You can work in parallel, but final testing requires the backend fixes.

---

## Audit Findings (Phase 0)

### Mock data files (to be deleted after all references are removed)
| File | What it contains |
|------|-----------------|
| `client/src/data/mockListings.js` | `MOCK_LISTINGS` — 8 hardcoded listings with Unsplash URLs, fake owner objects |
| `client/src/data/mockUsers.js` | `MOCK_USERS` — 5 hardcoded users, `findMockUser()` helper |

### Files that import mock data
| File | Lines | What it does |
|------|-------|-------------|
| `client/src/hooks/useListings.js` | 4, 37, 42 | Falls back to `MOCK_LISTINGS` when API returns empty or fails |
| `client/src/pages/HomePage.jsx` | 16, 90 | Imports `MOCK_LISTINGS`, slices first 3 for featured section |
| `client/src/pages/ProfilePage.jsx` | 24-25, 47-55, 78-98, 140-150 | Imports both mocks, uses `findMockUser()` as fallback for every field |
| `client/src/components/profile/ProfileDetail.jsx` | 22, 24-69, 87-132 | Imports `MOCK_LISTINGS`, hardcoded `DEFAULT_COMPATIBILITIES` object, falls back to mock on API error |
| `client/src/components/dashboard/AddListingModal.jsx` | 32-37, 54, 83, 92 | `SAMPLE_ROOM_IMAGES` array of 4 Unsplash URLs used as photo picker |

### Hardcoded Unsplash URLs (outside mock files)
| File | Lines | Count |
|------|-------|-------|
| `AddListingModal.jsx` | 33-36 | 4 URLs |
| `mockListings.js` | 25-26, 53-54, 81, 108, 135, 162, 189, 216 | 10 URLs |

---

## Fix 1: Remove mock fallback from useListings hook (Critical)

- **File:** `client/src/hooks/useListings.js:4, 36-42`
- **Why:** When the API returns an empty array or fails, the hook falls back to `MOCK_LISTINGS`. With a seeded database, this should show an empty state or error instead of fake data.
- **Code:**

Before:
```js
import api from '@services/api';
import { resolveApiError } from '@utils/authHelpers';
import { MOCK_LISTINGS } from '@data/mockListings';
```

After:
```js
import api from '@services/api';
import { resolveApiError } from '@utils/authHelpers';
```

Before (lines 33-42):
```js
      const serverListings = data?.listings ?? data;
      if (Array.isArray(serverListings) && serverListings.length > 0) {
        setBaseListings(serverListings);
      } else {
        setBaseListings(MOCK_LISTINGS);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(resolveApiError(err));
        setBaseListings(MOCK_LISTINGS);
      }
```

After:
```js
      const serverListings = data?.listings ?? data;
      setBaseListings(Array.isArray(serverListings) ? serverListings : []);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(resolveApiError(err));
        setBaseListings([]);
      }
```

- **Verify:** Stop the backend server → open the Dashboard page → should show an error message, not mock listings.
- **Depends on:** Member 3 (seed script run) so DB has data
- **Commit:**
  ```bash
  git add client/src/hooks/useListings.js && git commit -m "fix(listings): remove MOCK_LISTINGS fallback from useListings hook"
  ```

---

## Fix 2: Remove mock listings from HomePage (High)

- **File:** `client/src/pages/HomePage.jsx:16, 90`
- **Why:** The homepage imports `MOCK_LISTINGS` and shows the first 3 as "Featured Listings". It should fetch featured listings from the API instead.
- **Code:**

Before (imports, line 16):
```js
import { MOCK_LISTINGS } from '@data/mockListings';
```

After (add `useEffect`, `useState`):
```js
import { useState, useEffect } from 'react';
```
*(Note: `useState` is already imported on line 1. Add `useEffect` to the existing import.)*

Replace line 1:
```js
import { useState } from 'react';
```
With:
```js
import { useState, useEffect } from 'react';
```

And add an import for the API:
```js
import api from '@services/api';
```

Remove line 16:
```js
import { MOCK_LISTINGS } from '@data/mockListings';
```

Before (line 90, inside component body):
```js
  const featuredListings = MOCK_LISTINGS.slice(0, 3);
```

After (replace with API fetch):
```js
  const [featuredListings, setFeaturedListings] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/listings');
        const listings = data?.listings ?? data;
        if (!cancelled) setFeaturedListings(Array.isArray(listings) ? listings.slice(0, 3) : []);
      } catch {
        // Silently fail — featured section will just be empty
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
```

Also update the rendering section (around line 191) to handle loading/empty:

Before:
```jsx
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
```

After:
```jsx
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredLoading ? (
            <p className="text-sm text-text-muted col-span-full text-center py-8">Loading featured rooms...</p>
          ) : featuredListings.length === 0 ? (
            <p className="text-sm text-text-muted col-span-full text-center py-8">No listings available yet. Be the first to post!</p>
          ) : (
            featuredListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))
          )}
        </div>
```

- **Verify:** Open the homepage → featured listings section should show real DB listings (or a loading state, then data).
- **Depends on:** Member 3 (seed script), Member 2 (API returns data)
- **Commit:**
  ```bash
  git add client/src/pages/HomePage.jsx && git commit -m "fix(home): fetch featured listings from API instead of mock data"
  ```

---

## Fix 3: Remove all mock fallbacks from ProfilePage (Critical)

- **File:** `client/src/pages/ProfilePage.jsx:24-25, 47-55, 76-98, 140-150, 248, 253`
- **Why:** The entire ProfilePage is wrapped in mock fallbacks — every field (`displayName`, `displayEmail`, `displayBudget`, `institution`, `locationText`, `bio`, `habitVector`) falls back to `mockFallback` values. The listings section filters `MOCK_LISTINGS`. This means the page *never shows real API data failure* — it always looks correct with fake data.
- **Code:**

**Step 1:** Remove mock imports (lines 24-25):

Before:
```js
import { MOCK_LISTINGS } from '@data/mockListings';
import { MOCK_USERS, findMockUser } from '@data/mockUsers';
```

After:
```js
// (delete both lines entirely)
```

**Step 2:** Remove `findMockUser` call in fetch (lines 47-55):

Before:
```js
    const fetchUserProfile = async () => {
      const mock = findMockUser(id);
      try {
        const { data } = await api.get(`/users/${id}`);
        if (!cancelled) {
          setProfileUser(data || mock);
        }
      } catch {
        if (!cancelled) {
          setProfileUser(mock);
        }
      } finally {
```

After:
```js
    const fetchUserProfile = async () => {
      try {
        const { data } = await api.get(`/users/${id}`);
        if (!cancelled) {
          setProfileUser(data || null);
        }
      } catch {
        if (!cancelled) {
          setProfileUser(null);
        }
      } finally {
```

**Step 3:** Remove mock fallback block (lines 76-98). Replace with null-safe access:

Before:
```js
  // Active target user with resilient demo fallback
  const targetUser = isOwnProfile ? currentUser : profileUser;
  const mockFallback = findMockUser(id) || MOCK_USERS[0];

  const displayName = targetUser?.name || targetUser?.fullName || mockFallback.name;
  const displayEmail = targetUser?.email || mockFallback.email;
  const displayRole = (targetUser?.role || mockFallback.role) === 'HAS_ROOM' ? 'Offering a Room' : 'Looking for a Flatmate';
  const displayBudget = targetUser?.budget || mockFallback.budget || 8500;
  const isVerified = targetUser?.isVerified ?? true;
  const institution = targetUser?.institution || mockFallback.institution || 'GL Bajaj Institute of Technology';
  const locationText = targetUser?.location?.area
    ? `${targetUser.location.area}, Greater Noida`
    : mockFallback.location || 'Knowledge Park II, Greater Noida';
  const bio = targetUser?.bio || mockFallback.bio || 'Student / working professional based in Greater Noida.';

  const habitVector = targetUser?.habitVector || mockFallback.habitVector || {
    sleepSchedule: 8,
    cleanliness: 9,
    noise: 8,
    guests: 4,
    cooking: 7,
    smoking: 1,
  };
```

After:
```js
  const targetUser = isOwnProfile ? currentUser : profileUser;

  if (!targetUser) {
    return (
      <PageLayout centered>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-text-muted text-sm">User profile not found.</p>
          <Button size="sm" variant="secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </PageLayout>
    );
  }

  const displayName = targetUser.name || targetUser.fullName || 'Unknown User';
  const displayEmail = targetUser.email || '';
  const displayRole = targetUser.role === 'HAS_ROOM' ? 'Offering a Room' : 'Looking for a Flatmate';
  const displayBudget = targetUser.budget || 0;
  const isVerified = targetUser.isVerified ?? false;
  const institution = targetUser.institution || '';
  const locationText = targetUser.location?.area
    ? `${targetUser.location.area}, Greater Noida`
    : 'Greater Noida';
  const bio = targetUser.bio || '';

  const habitVector = targetUser.habitVector || {
    sleepSchedule: 5,
    cleanliness: 5,
    noise: 5,
    guests: 5,
    cooking: 5,
    smoking: 5,
  };
```

**Step 4:** Replace mock listings filter (lines 140-150):

Before:
```js
  const userListings = MOCK_LISTINGS.filter(
    (l) =>
      l.owner?._id === id ||
      l.owner?._id === targetUser?._id ||
      mockFallback.listings?.includes(l._id)
  );

  const displayListings = userListings.length > 0 ? userListings : MOCK_LISTINGS.slice(0, 2);
```

After (fetch from API):
```js
  const [userListings, setUserListings] = useState([]);

  useEffect(() => {
    if (!targetUser?._id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/listings');
        const all = data?.listings ?? data;
        if (!cancelled && Array.isArray(all)) {
          setUserListings(all.filter((l) => l.owner?._id === targetUser._id));
        }
      } catch {
        // silently fail
      }
    })();
    return () => { cancelled = true; };
  }, [targetUser?._id]);

  const displayListings = userListings;
```

**Step 5:** Replace remaining `mockFallback` references (lines 248, 253):

Before:
```jsx
<p className="text-sm font-semibold text-text mt-1">{mockFallback.roomPreference || 'Private Room'}</p>
```
After:
```jsx
<p className="text-sm font-semibold text-text mt-1">{targetUser.roomPreference || 'Private Room'}</p>
```

Before:
```jsx
<p className="text-sm font-semibold text-text mt-1">{mockFallback.moveInDate || 'Immediate'}</p>
```
After:
```jsx
<p className="text-sm font-semibold text-text mt-1">{targetUser.moveInDate || 'Immediate'}</p>
```

Before (line 150):
```jsx
    navigate('/chat', { state: { recipient: targetUser || mockFallback } });
```
After:
```jsx
    navigate('/chat', { state: { recipient: targetUser } });
```

- **Verify:** Navigate to `/user/<real-mongo-id>` → should show real data. Navigate to `/user/invalid-id` → should show "User profile not found." error.
- **Depends on:** Member 2 Fix 4 (auth returns user data), Member 3 (seed)
- **Commit:**
  ```bash
  git add client/src/pages/ProfilePage.jsx && git commit -m "fix(profile): remove all mock data fallbacks, use live API data"
  ```

---

## Fix 4: Remove mock fallbacks and hardcoded compatibility from ProfileDetail (Critical)

- **File:** `client/src/components/profile/ProfileDetail.jsx:22, 24-69, 87-132`
- **Why:** The component has a `DEFAULT_COMPATIBILITIES` object (lines 24-69) with hardcoded per-listing compatibility scores, pros, cons, and vibe summaries. It also falls back to `MOCK_LISTINGS` on API failure. The compatibility data should come from the `/matches/:id` API.
- **Code:**

**Step 1:** Remove mock import and hardcoded compatibilities:

Before (line 22):
```js
import { MOCK_LISTINGS } from '@data/mockListings';
```
Remove this line.

Before (lines 24-69, the entire `DEFAULT_COMPATIBILITIES` object):
```js
const DEFAULT_COMPATIBILITIES = {
  'gnoida-listing-1': {
    // ...
  },
  // ...
};
```
Remove this entire block.

**Step 2:** Rewrite the `fetchData` function (lines 86-138):

Before:
```js
    const fetchData = async () => {
      // Find fallback mock listing first
      const mockListing =
        MOCK_LISTINGS.find((l) => l._id === listingId) ||
        MOCK_LISTINGS.find((l) => l.title?.toLowerCase().includes(listingId.toLowerCase())) ||
        MOCK_LISTINGS[0];

      const fallbackCompat =
        DEFAULT_COMPATIBILITIES[listingId] || {
          score: mockListing?.compatibility || 91,
          vibeSummary: `High compatibility with ${mockListing?.owner?.name || 'the host'}...`,
          pros: [...],
          cons: [...],
        };

      try {
        const [listingRes, compatRes] = await Promise.allSettled([
          api.get(`/listings/${listingId}`),
          api.get(`/matches/${listingId}`),
        ]);

        if (cancelled) return;

        if (listingRes.status === 'fulfilled' && listingRes.value?.data) {
          const lData = listingRes.value.data.listing ?? listingRes.value.data;
          setListing(lData || mockListing);
        } else {
          setListing(mockListing);
        }

        if (compatRes.status === 'fulfilled' && compatRes.value?.data) {
          const cData = compatRes.value.data.compatibility ?? compatRes.value.data;
          setCompatibility(cData || fallbackCompat);
        } else {
          setCompatibility(fallbackCompat);
        }
      } catch {
        if (!cancelled) {
          setListing(mockListing);
          setCompatibility(fallbackCompat);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
```

After:
```js
    const fetchData = async () => {
      try {
        const [listingRes, compatRes] = await Promise.allSettled([
          api.get(`/listings/${listingId}`),
          api.get(`/matches/${listingId}`),
        ]);

        if (cancelled) return;

        if (listingRes.status === 'fulfilled' && listingRes.value?.data) {
          const lData = listingRes.value.data.listing ?? listingRes.value.data;
          setListing(lData || null);
        } else {
          setListing(null);
        }

        if (compatRes.status === 'fulfilled' && compatRes.value?.data) {
          const cData = compatRes.value.data.compatibility ?? compatRes.value.data;
          setCompatibility(cData || null);
        } else {
          setCompatibility(null);
        }
      } catch {
        if (!cancelled) {
          setListing(null);
          setCompatibility(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
```

- **Verify:** Navigate to a listing detail page with a real MongoDB `_id` → listing data and compatibility should load from the API. Navigate to a non-existent ID → should show "Listing profile not found."
- **Depends on:** Member 2 (API returns listings), Member 3 (matching engine works)
- **Commit:**
  ```bash
  git add client/src/components/profile/ProfileDetail.jsx && git commit -m "fix(profile-detail): remove hardcoded compatibilities and mock fallbacks"
  ```

---

## Fix 5: Replace Unsplash photo picker with file upload in AddListingModal (High)

- **File:** `client/src/components/dashboard/AddListingModal.jsx:32-37, 54, 83, 92, 273-295`
- **Why:** The modal has a `SAMPLE_ROOM_IMAGES` array of 4 Unsplash URLs and lets the user "pick" one. It then sends the URL string in the JSON body. With the upload middleware now mounted (Member 4 Fix 1), the modal should let users upload actual image files via `FormData`.
- **Code:**

**Step 1:** Remove the `SAMPLE_ROOM_IMAGES` array (lines 32-37):
```js
const SAMPLE_ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
];
```
Delete this entire block.

**Step 2:** Replace the state variables (line 54):

Before:
```js
  const [selectedImage, setSelectedImage] = useState(SAMPLE_ROOM_IMAGES[0]);
  const [customImageUrl, setCustomImageUrl] = useState('');
```

After:
```js
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
```

Add a handler for file selection:
```js
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5); // max 5 images
    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };
```

**Step 3:** Change `handleSubmit` to use `FormData` (lines 68-118):

Before (lines 82-110):
```js
    const sector = GREATER_NOIDA_SECTORS[sectorIndex];
    const imageUrl = customImageUrl.trim() || selectedImage;

    const payload = {
      title: title.trim(),
      rent: Number(rent),
      roomType,
      availableFrom: new Date(availableFrom),
      description: description.trim(),
      amenities: selectedAmenities,
      images: [imageUrl],
      compatibility: 95,
      location: {
        type: 'Point',
        coordinates: sector.coords,
        area: sector.area,
        city: 'Greater Noida',
        address: address.trim() || `${sector.area}, Greater Noida, Uttar Pradesh`,
      },
      owner: {
        _id: user?._id || 'user-current-session',
        name: user?.name || user?.fullName || 'You (Host)',
        role: 'HAS_ROOM',
        isVerified: true,
      },
    };

    try {
      const { data } = await api.post('/listings', payload);
```

After:
```js
    const sector = GREATER_NOIDA_SECTORS[sectorIndex];

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('rent', Number(rent));
    formData.append('roomType', roomType);
    formData.append('availableFrom', new Date(availableFrom).toISOString());
    formData.append('description', description.trim());
    formData.append('amenities', JSON.stringify(selectedAmenities));
    formData.append('location', JSON.stringify({
      type: 'Point',
      coordinates: sector.coords,
      area: sector.area,
      city: 'Greater Noida',
      address: address.trim() || `${sector.area}, Greater Noida, Uttar Pradesh`,
    }));

    // Attach image files
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const { data } = await api.post('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
```

**Step 4:** Replace the photo picker UI (lines 273-295):

Before (the grid of Unsplash thumbnails):
```jsx
          {/* Choose Room Preview Photo */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-medium text-text">Select Room Photo</label>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_ROOM_IMAGES.map((url) => {
                // ... thumbnail buttons
              })}
            </div>
          </div>
```

After:
```jsx
          {/* Upload Room Photos */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-medium text-text">Upload Room Photos (max 5)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              multiple
              onChange={handleFileChange}
              className="text-sm text-text file:mr-3 file:px-3 file:py-1.5 file:rounded file:border file:border-border file:bg-card file:text-xs file:font-medium file:text-text hover:file:bg-stone-50 file:cursor-pointer"
            />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {imagePreviews.map((url, i) => (
                  <div key={i} className="h-16 rounded overflow-hidden border-2 border-primary ring-2 ring-primary/20">
                    <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
```

- **Verify:** Open the "Post a Room" modal → select image files → submit → the created listing should have Cloudinary URLs in its `images` array (visible in the network response).
- **Depends on:** Member 4 Fix 1 (upload middleware), Member 2 Fix 1-2 (controller handles files + FormData)
- **Commit:**
  ```bash
  git add client/src/components/dashboard/AddListingModal.jsx && git commit -m "feat(listings): replace Unsplash picker with real file upload to Cloudinary"
  ```

---

## Fix 6: Remove the hardcoded "Kartik & You" sample match on HomePage (Low)

- **File:** `client/src/pages/HomePage.jsx:274`
- **Why:** The compatibility sample card (lines 270-327) shows "Kartik & You" with hardcoded 94% match. This is a static demo illustration, not fetched from mock data. It's acceptable as marketing copy on the landing page but should be noted.
- **Code:** No change needed — this is intentional UI copy for the landing page hero section. It does not use `MOCK_LISTINGS` or `MOCK_USERS`.
- **Verify:** N/A (cosmetic/marketing element)
- **Commit:** N/A

---

## Fix 7: Delete mock data files after all references are removed (Medium)

- **File:** `client/src/data/mockListings.js`, `client/src/data/mockUsers.js`
- **Why:** Once Fixes 1-5 are applied and no file imports these, the mock data files should be deleted to prevent accidental re-use.
- **Code:**

**Step 1:** Verify no remaining imports:
```bash
grep -rn "mockListings\|mockUsers\|MOCK_LISTINGS\|MOCK_USERS\|findMockUser" client/src/
```
This should return zero results.

**Step 2:** Delete the files:
```bash
rm client/src/data/mockListings.js
rm client/src/data/mockUsers.js
```

If the `client/src/data/` directory is now empty, delete it too:
```bash
rmdir client/src/data
```

- **Verify:** `npm run build` in the `client/` directory should succeed with no import errors.
- **Depends on:** Fixes 1-5 all applied
- **Commit:**
  ```bash
  git add -A client/src/data/ && git commit -m "chore(cleanup): delete mock data files after wiring to live API"
  ```

---

## Fix 8: Handle auth response to extract user object (Critical, AUDIT ref: authService.js)

- **File:** `client/src/services/authService.js`
- **Why:** The auth service returns the raw API response. After Member 2 Fix 4, the response will include `{ token, user, isNewUser }`. The `AuthContext` must extract and store the `user` object, not the entire response.

Read `authService.js` and confirm it stores `response.data`. Then check `AuthContext.jsx` to ensure it extracts `data.user` and stores the token separately.

If `authService.js` looks like:
```js
const response = await api.post('/auth/login', { email, password });
return response.data;
```

And `AuthContext.jsx` does:
```js
const data = await authService.login(email, password);
setUser(data); // ← this sets user to { token, user, isNewUser }
```

Then change `AuthContext.jsx` to:
```js
const data = await authService.login(email, password);
tokenManager.set(data.token);
setUser(data.user);
```

> **Note:** Read the actual `AuthContext.jsx` code carefully. The exact fix depends on how `login`, `register`, and `googleAuth` are called. The principle is: extract `data.user` from the response and `data.token` separately.

- **Verify:** Login → check that `user.name`, `user.role`, `user.email` are available throughout the app (visible in Navbar, ProfilePage, etc.)
- **Depends on:** Member 2 Fix 4 (backend returns user object)
- **Commit:**
  ```bash
  git add client/src/context/AuthContext.jsx client/src/services/authService.js && git commit -m "fix(auth): extract user object from auth response correctly"
  ```

---

## Summary Checklist

| # | Fix | Severity | File(s) | Status |
|---|-----|----------|---------|--------|
| 1 | Remove MOCK_LISTINGS fallback from useListings | Critical | `client/src/hooks/useListings.js` | TODO |
| 2 | Fetch featured listings from API on HomePage | High | `client/src/pages/HomePage.jsx` | TODO |
| 3 | Remove all mock fallbacks from ProfilePage | Critical | `client/src/pages/ProfilePage.jsx` | TODO |
| 4 | Remove hardcoded compatibilities from ProfileDetail | Critical | `client/src/components/profile/ProfileDetail.jsx` | TODO |
| 5 | Replace Unsplash picker with file upload | High | `client/src/components/dashboard/AddListingModal.jsx` | TODO |
| 6 | "Kartik & You" sample card (keep) | Low | `client/src/pages/HomePage.jsx` | No change |
| 7 | Delete mock data files | Medium | `client/src/data/mockListings.js`, `mockUsers.js` | TODO (last) |
| 8 | Fix auth response handling | Critical | `client/src/context/AuthContext.jsx`, `authService.js` | TODO |

