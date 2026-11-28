# FlatMate Final Presentation Script & Demo Runbook

> **Time Allotted:** 5–7 Minutes  
> **Audience:** Evaluators, Professors, Project Judges  
> **Key Message:** FlatMate isn't just a classifieds board—it is an **AI-driven lifestyle harmony platform** that prevents roommate friction before signing a lease.

---

## 1. The 60-Second Hook (Problem & Vision)

> *"Good morning/afternoon, professors and evaluators.  
> 
> When college students and young professionals relocate to education hubs like Greater Noida, finding a flat is only half the battle. The bigger gamble is **who you live with**. Clashing sleep schedules, cleanliness disagreements, and noise conflicts turn great apartments into nightmare living situations.
> 
> We built **FlatMate** to solve this. FlatMate combines **geospatial discovery** with a **Gemini-powered lifestyle compatibility engine** and **instant real-time messaging**, ensuring students match with compatible roommates and verified spaces."*

---

## 2. Live Demo Script (Step-by-Step)

### Setup Prior to Presentation:
- Open two browser windows side by side:
  - **Left Window:** Host View (Logged in as **Kartik Sharma** - Has Room)
  - **Right Window (Incognito):** Seeker View (Logged in as **Priya Mehra** - Looking for Room)

---

### Step 1: Geospatial Discovery & Map View (Seeker View)
1. **Show:** The Dashboard in the right window.
2. **Talk Track:**
   > *"Here on Priya's dashboard, we see available student listings centered around Knowledge Park and Alpha 1. Users can toggle seamlessly between our high-density Grid View and our interactive Leaflet Map View."*
3. **Action:** Click a marker on the map $\rightarrow$ show popup $\rightarrow$ click a filter (e.g. Budget $\le$ ₹10,000) $\rightarrow$ listings update dynamically.

---

### Step 2: AI Lifestyle Compatibility Engine (The "Wow" Moment)
1. **Action:** Click on **"Kartik's Knowledge Park Flat"** or switch to the **"Find Roommates"** tab.
2. **Talk Track:**
   > *"Notice the compatibility badge: **94% Match**. Rather than relying on simple keyword matching, FlatMate captures a multi-dimensional lifestyle habit vector during onboarding: sleep rhythm, hygiene expectations, noise tolerance, and guest preferences."*
3. **Action:** Click **"View AI Compatibility"** to open the Gemini Insight modal.
4. **Talk Track:**
   > *"Here, Google's **Gemini 2.0 Flash** analyzes the two lifestyle vectors semantically to generate this human-readable 'Vibe Summary', alongside explicit pros and potential friction points. If the AI service is ever unreachable, our mathematical Euclidean heuristic automatically takes over, guaranteeing zero system downtime."*

---

### Step 3: Real-Time WebSockets Chat (Split Screen Demo)
1. **Action:** In Priya's window, click **"Message Host"**.
2. **Talk Track:**
   > *"Priya decides to reach out to Kartik. FlatMate initiates an end-to-end real-time chat powered by Socket.IO."*
3. **Action:** Type *"Hi Kartik, is the private room near GL Bajaj still available?"* in Priya's window.
4. **Visual Highlight:** Point to the left window (Kartik's screen). Notice:
   - The message pops up instantaneously without refreshing.
   - When Kartik types back, Priya's screen displays the live typing indicator bubble.

---

### Step 4: Listing Creation & Cloudinary Integration
1. **Action:** In Kartik's window, click **"Post a Room"**.
2. **Talk Track:**
   > *"Hosts can list open rooms in under 60 seconds. Our backend mounts Multer with Cloudinary stream storage, uploading and optimizing property photos directly to the cloud while saving GeoJSON coordinates for proximity matching."*

---

## 3. Technical Architecture Summary (Slides / Verbal Defense)

| Layer | Technologies Used | Key Engineering Decisions |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Leaflet | Single-page application, responsive layout, fluid CSS transitions, zero mock fallbacks. |
| **Backend** | Node.js, Express.js, Socket.IO, JWT, Multer | RESTful API + event-driven bidirectional WebSocket communication, authenticated socket handshakes. |
| **Database** | MongoDB Atlas, Mongoose | `2dsphere` geospatial indexing for `$near` proximity queries, TTL caching on AI `Match` documents. |
| **AI Layer** | Google Gemini 2.0 Flash (`@google/genai`) | High-speed structured JSON generation, paired with automatic mathematical fallback. |
| **Media** | Cloudinary CDN | High-performance remote image hosting without bloating MongoDB documents. |

---

## 4. Anticipated Questions from Judges & Model Answers

### Q1: *"What happens if Gemini is down or runs out of free tier quota?"*
> **Answer:**  
> *"We engineered a zero-downtime fallback in `geminiService.js`. If Gemini times out after 6 seconds or returns an error, the engine immediately computes a normalized Euclidean difference across habit vectors (`heuristicFallbackScore`). The user gets an accurate score and the UI tags it as 'Heuristic Algorithm' without failing."*

### Q2: *"How do you protect users from spam or unauthorized socket messages?"*
> **Answer:**  
> *"Our Socket.IO server requires JWT verification during the connection handshake. In `chatSocket.js`, we enforce server-side validation ensuring that the sender's ID strictly matches `socket.userId` before saving or broadcasting any message."*

### Q3: *"How does the geospatial search perform at scale?"*
> **Answer:**  
> *"We utilize MongoDB's native `2dsphere` indexing on GeoJSON point coordinates (`[longitude, latitude]`). The matching pipeline executes an indexed `$near` query with a 25km radius cap, avoiding expensive in-memory distance calculations."*

---

## 5. Pre-Presentation Checklist (15 Minutes Before Going on Stage)

- [ ] Check internet connection is active.
- [ ] Run `cd server && node scripts/seed.js` to ensure clean demo data.
- [ ] Start backend (`npm start` in `server/`) and client (`npm run dev` in `client/`).
- [ ] Open Chrome (Left half of screen) $\rightarrow$ Login as Kartik.
- [ ] Open Edge / Incognito (Right half of screen) $\rightarrow$ Login as Priya.
- [ ] Zoom browser to 110% for easy projector readability.
