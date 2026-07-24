# FlatMate — Find Your Stay Partner in Greater Noida

FlatMate is a MERN-stack roommate-matching platform for Greater Noida. It pairs users looking for a room with users who have one, using a two-tier matching pipeline: MongoDB geospatial/attribute filtering followed by Google Gemini-powered lifestyle compatibility scoring.

---

## Table of Contents

- [FlatMate — Find Your Stay Partner in Greater Noida](#flatmate--find-your-stay-partner-in-greater-noida)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Architecture](#architecture)
  - [Folder Structure](#folder-structure)
  - [Setup Guide](#setup-guide)
    - [Prerequisites](#prerequisites)
    - [1. Clone the repository](#1-clone-the-repository)
    - [2. Backend setup](#2-backend-setup)
    - [3. Frontend setup](#3-frontend-setup)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
  - [Team Ownership](#team-ownership)
  - [Git Workflow](#git-workflow)
  - [API Overview](#api-overview)
  - [License](#license)

---

## Features

- Dual user roles: `SEARCHING_ROOM` and `HAS_ROOM`
- JWT (email/password) and Google OAuth 2.0 authentication
- New Google users are routed through an onboarding lifestyle quiz
- Hybrid matching engine: MongoDB pre-filter (gender, budget, geo radius) → Gemini API compatibility scoring
- AI match results (`compatibilityScore`, `pros`, `cons`, `vibeSummary`) cached in MongoDB to avoid duplicate API calls
- Heuristic fallback scoring if Gemini quota/parsing fails, so the app never crashes
- Real-time chat via Socket.io
- Image uploads via Cloudinary
- Grid and map (Leaflet) views for browsing listings

---

## Tech Stack

| Layer          | Technology                                             |
|----------------|---------------------------------------------------------|
| Frontend       | React (Vite), Tailwind CSS, React Router, Leaflet       |
| Backend        | Node.js, Express.js                                     |
| Database       | MongoDB Atlas, Mongoose                                 |
| AI             | Google Gemini API (`@google/genai`)                     |
| Realtime       | Socket.io                                                |
| Media          | Cloudinary, Multer                                       |
| Auth           | JWT, Google OAuth 2.0 (`@react-oauth/google`, `google-auth-library`) |

---

## Architecture

```
┌─────────────┐        REST/JWT        ┌──────────────────┐
│   React     │ ─────────────────────▶ │   Express API     │
│  (client/)  │ ◀───────────────────── │   (server/)        │
└─────┬───────┘        Socket.io       └─────────┬─────────┘
      │                                            │
      │                                            ▼
      │                                   ┌──────────────────┐
      │                                   │  MongoDB Atlas    │
      │                                   │ User/Listing/     │
      │                                   │ Match/Message     │
      │                                   └────────┬──────────┘
      │                                            │
      │                                            ▼
      │                                   ┌──────────────────┐
      └─────────── media upload ─────────▶│   Cloudinary      │
                                           └──────────────────┘

Matching Pipeline:
  User request → MongoDB deterministic filter (role, budget, 2dsphere geo)
              → candidate pairs → Gemini API compatibility evaluation
              → cached in Match collection → returned to client
              → on Gemini failure (429/parse error) → heuristic fallback score
```

---

## Folder Structure

```
flatmate/
├── client/                          # React frontend (Member 1)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                # Login.jsx, Register.jsx, GoogleAuthButton.jsx
│   │   │   ├── onboarding/          # OnboardingQuiz.jsx
│   │   │   ├── dashboard/           # Dashboard.jsx, ListingCard.jsx, MapView.jsx
│   │   │   ├── profile/             # ProfileDetail.jsx
│   │   │   ├── chat/                # Chat.jsx, ChatWindow.jsx
│   │   │   └── common/              # LoadingSpinner.jsx, ErrorBanner.jsx, ProtectedRoute.jsx
│   │   ├── services/                # api.js, socket.js
│   │   ├── context/                 # AuthContext.jsx
│   │   ├── hooks/                   # useAuth.js
│   │   ├── pages/                   # LoginPage.jsx, DashboardPage.jsx, ChatPage.jsx, OnboardingPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
│
├── server/
│   ├── controllers/                 # Member 2
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── listingController.js
│   │   ├── chatController.js
│   │   └── matchController.js       # Member 4 — wires AI engine to routes
│   ├── routes/                      # Member 2
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── listingRoutes.js
│   │   ├── chatRoutes.js
│   │   └── matchRoutes.js
│   ├── models/                      # Member 3
│   │   ├── User.js
│   │   ├── Listing.js
│   │   ├── Match.js
│   │   └── Message.js
│   ├── services/                    # Member 3
│   │   ├── geminiService.js
│   │   └── matchingEngine.js
│   ├── sockets/                     # Member 4
│   │   └── chatSocket.js
│   ├── config/                      # Member 4
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── middleware/                  # Member 4
│   │   ├── authMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── errorMiddleware.js
│   ├── server.js                    # Member 4 — central bootstrap
│   ├── .env
│   └── package.json
│
├── docs/
│   ├── MEMBER_1_FRONTEND.md
│   ├── MEMBER_2_BACKEND.md
│   ├── MEMBER_3_AI_AND_DB.md
│   └── MEMBER_4_LEAD_INTEGRATOR.md
│
├── .gitignore
└── README.md
```

---

## Setup Guide

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas cluster (connection string)
- Google Cloud OAuth 2.0 Client ID
- Google Gemini API key
- Cloudinary account

### 1. Clone the repository

```bash
git clone <repo-url>
cd flatmate
```

### 2. Backend setup

```bash
cd server
npm init -y
npm install express mongoose dotenv cors socket.io cloudinary multer multer-storage-cloudinary
npm install jsonwebtoken bcryptjs google-auth-library express-validator @google/genai
npm install -D nodemon
```

Add to `server/package.json`:
```json
"scripts": { "dev": "nodemon server.js" }
```

### 3. Frontend setup

```bash
cd ../client
npm create vite@latest . -- --template react
npm install axios react-router-dom @react-oauth/google leaflet react-leaflet lucide-react socket.io-client
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Set `tailwind.config.js` → `content: ["./index.html", "./src/**/*.{js,jsx}"]`.

---

## Environment Variables

`server/.env`
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/flatmate
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLIENT_URL=http://localhost:5173
```

`client/.env`
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_SOCKET_URL=http://localhost:5000
```

> Never commit `.env` files. Both are listed in `.gitignore`.

---

## Running the App

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
cd client
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## Team Ownership

| Member | Domain                              | Owned Paths                                                  | Doc |
|--------|--------------------------------------|----------------------------------------------------------------|-----|
| 1      | Frontend (React)                    | `client/`                                                       | [MEMBER_1_FRONTEND.md](./docs/MEMBER_1_FRONTEND.md) |
| 2      | Backend Controllers & Routes        | `server/controllers/`, `server/routes/`                         | [MEMBER_2_BACKEND.md](./docs/MEMBER_2_BACKEND.md) |
| 3      | Gemini Integration & DB Architecture| `server/models/`, `server/services/`                             | [MEMBER_3_AI_AND_DB.md](./docs/MEMBER_3_AI_AND_DB.md) |
| 4      | System Integration, Sockets, Media  | `server/server.js`, `server/sockets/`, `server/config/`, `server/middleware/` | [MEMBER_4_LEAD_INTEGRATOR.md](./docs/MEMBER_4_LEAD_INTEGRATOR.md) |

---

## Git Workflow

```bash
main
 ├── feature/frontend-member1
 ├── feature/backend-member2
 ├── feature/ai-db-member3
 └── feature/integrator-member4 (integration branch, merges others in order)
```

**Merge order (owned by Member 4):** DB/AI → Backend → Frontend, with a smoke test after each merge.

**Rules:**
- Commit only within your assigned folder boundaries.
- Freeze Mongoose schema field names (Member 3) before Member 2/4 build against them.
- Open a PR into `main` per feature branch; require one reviewer before merge.

```bash
git checkout -b feature/<domain>-member<n>
git add <owned-path>
git commit -m "feat(<scope>): <description>"
git pull --rebase origin main
git push origin feature/<domain>-member<n>
```

---

## API Overview

| Method | Endpoint                | Description                          | Auth |
|--------|--------------------------|---------------------------------------|------|
| POST   | `/api/auth/register`     | Register with email/password          | No   |
| POST   | `/api/auth/login`        | Login with email/password             | No   |
| POST   | `/api/auth/google`       | Google OAuth login/signup             | No   |
| GET    | `/api/users/me`          | Get current user profile              | Yes  |
| PUT    | `/api/users/me`          | Update profile                        | Yes  |
| POST   | `/api/users/onboarding`  | Submit lifestyle habit vector         | Yes  |
| GET    | `/api/listings`          | Get all active listings               | Yes  |
| POST   | `/api/listings`          | Create a listing                      | Yes  |
| GET    | `/api/listings/:id`      | Get listing detail                    | Yes  |
| PUT    | `/api/listings/:id`      | Update own listing                    | Yes  |
| DELETE | `/api/listings/:id`      | Delete own listing                    | Yes  |
| GET    | `/api/matches`           | Run matching pipeline for user        | Yes  |
| GET    | `/api/matches/:id`       | Get cached match detail               | Yes  |
| GET    | `/api/chats`             | Get user's chat list                  | Yes  |
| GET    | `/api/chats/:chatId`     | Get chat history                      | Yes  |

**Socket.io events:** `joinChat`, `sendMessage`, `receiveMessage`, `errorMessage`, `connect_error`, `disconnect`.

---

## License

For academic/hackathon use. Add a license of your choice before public release.