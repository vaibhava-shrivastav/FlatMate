# FlatMate Audit Report

This document contains audit findings for the FlatMate application, grouped by severity: Critical, High, Medium, Low.

Each finding includes:
- File and line number (if applicable)
- Symptom
- Root cause
- Proposed fix (one line)
- **Status** — Documented / Skipped + reason
- **Owner doc** — which member doc contains the fix

## Findings

### Critical
- **server/models/User.js:50-58** | Status: **Documented** | Owner: **MEMBER_3_AI_AND_DB.md** (Fix 1)
  - Symptom: Location field is not required, but matching engine relies on it for geo queries.
  - Root cause: The location field in the User schema is optional, but the matching engine uses $near query which requires a valid GeoJSON point.
  - Proposed fix: Keep location optional; add guard in findCandidates for missing or [0,0] coordinates; collect location during onboarding.
- **client/src/hooks/useMessages.js:15-36, 79-103** | Status: **Documented** | Owner: **MEMBER_1_FRONTEND.md** (Fix 3)
  - Symptom: Chat messages REST endpoints are non-existent, causing chat to fail to load/send messages.
  - Root cause: The useMessages hook calls `/api/conversations/:id/messages` for fetching and sending messages, but no such route exists; only `/api/chats/:id` (chat history) and socket.io are available.
  - Proposed fix: Change fetchMessages to use `/api/chats/:id` and remove REST call for sending messages, relying solely on socket.io.
- **client/src/services/authService.js:5-17** | Status: **Documented** | Owner: **MEMBER_1_FRONTEND.md** (Fix 1)
  - Symptom: Login and register functions return token object instead of user object, causing AuthContext user state to be the token object.
  - Root cause: The authService.login and authService.register return the raw API response (which includes token and isNewUser) rather than extracting the user data. This causes the AuthContext to set the user state to the token object, leading to undefined user properties (name, role, etc.) throughout the app.
  - Proposed fix: Modify authService.login and authService.register to return only the user data (by extracting from response or calling getCurrentUser after login).
- **server/routes/authRoutes.js:1-9** | Status: **Documented** | Owner: **MEMBER_2_BACKEND.md** (Fix 1)
  - Symptom: Logout endpoint missing, causing POST /api/auth/logout to return 404.
  - Root cause: The authRoutes.js does not define a POST /logout route, but the client calls api.post('/auth/logout').
  - Proposed fix: Add a logout route in authRoutes.js pointing to a logout controller method that clears server-side session (if any) and returns success.
- **client/src/hooks/useConversations.js:11-30** | Status: **Documented** | Owner: **MEMBER_1_FRONTEND.md** (Fix 2)
  - Symptom: Conversations endpoint non-existent, causing chat list to fail to load.
  - Root cause: useConversations hook calls `/api/conversations`; server only has `/api/chats` for user chats.
  - Proposed fix: Change endpoint to `/api/chats`; adjust response handling to match getUserChats shape.
- **client/src/hooks/useMessages.js:46, 93, 107, 112** | Status: **Documented** | Owner: **MEMBER_1_FRONTEND.md** (Fix 4)
  - Symptom: Chat messages are not sent or received via socket.io due to event name mismatches.
  - Root cause: The client emits socket events with different names (e.g., 'join_room', 'send_message', 'typing', 'stop_typing') than the server expects ('joinChat', 'sendMessage', 'user_typing', 'user_stop_typing').
  - Proposed fix: Align the event names between client and server (e.g., change client to emit 'joinChat', 'sendMessage', 'user_typing', 'user_stop_typing').

### High
- **server/sockets/chatSocket.js:24-32** | Status: **Documented** | Owner: **MEMBER_4_LEAD_INTEGRATOR.md** (Fix 1)
  - Symptom: Socket sendMessage handler lacks validation, allowing users to send messages as other users or to chats they are not part of.
  - Root cause: The handler does not verify that the senderId matches the authenticated socket userId, nor that the user is a participant of the chat.
  - Proposed fix: Add validation to ensure senderId matches socket.userId and that the user is a participant of the chat before saving and broadcasting the message.
- **server.js:1-45** | Status: **Documented** | Owner: **MEMBER_4_LEAD_INTEGRATOR.md** (Fix 2)
  - Symptom: Missing validation for essential environment variables, which could cause the server to fail to start or behave incorrectly if variables are missing or invalid.
  - Root cause: The server uses environment variables (MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, GEMINI_API_KEY, CLIENT_URL, etc.) without checking if they are defined or have valid values.
  - Proposed fix: Add validation at startup to check for required environment variables and exit with a clear error message if any are missing.

### Medium
- **server/controllers/authController.js:46-110** | Status: **Documented** | Owner: **MEMBER_2_BACKEND.md** (Fix 2)
  - Symptom: Google access token is not verified to be issued to our client ID (audience check).
  - Root cause: The googleAuth function uses the access token to fetch user info from Google's userinfo endpoint but does not verify that the token's audience (aud) matches our Google client ID.
  - Proposed fix: Verify the access token's aud claim matches process.env.GOOGLE_CLIENT_ID before proceeding.
- **server/controllers/authController.js:88-92** | Status: **Documented** | Owner: **MEMBER_2_BACKEND.md** (Fix 3)
  - Symptom: When a user signs in with Google and an existing email account is found, the Google account is linked to that email account without checking if the email account is already linked to a different Google account.
  - Root cause: The code assumes that if an email account exists, it is safe to link the Google account to it, but does not verify that the email account is not already linked to another Google account.
  - Proposed fix: Before linking, check if the existing user already has a googleId set and if it differs from the incoming Google ID; if so, prevent linking or prompt for account merging.
- **server/services/matchingEngine.js:25-41** | Status: **Documented** | Owner: **MEMBER_3_AI_AND_DB.md** (Fix 2)
  - Symptom: The findCandidates function does not guard against missing or invalid user.location, which may cause the matching pipeline to fail or return no matches.
  - Root cause: The function assumes user.location is a valid GeoJSON point, but the location field is optional and may be null or malformed.
  - Proposed fix: Add a check for user.location and return an empty array if location is missing or invalid.
- **server/services/matchingEngine.js:44-72** | Status: **Documented** | Owner: **MEMBER_3_AI_AND_DB.md** (Fix 3)
  - Symptom: Cached match results (Match documents) are never invalidated, leading to potentially stale compatibility scores if user data changes.
  - Root cause: The Match cache has no expiration or invalidation mechanism when users update their habit vectors, location, or other profile data.
  - Proposed fix: Add a TTL index on Match.createdAt to auto-expire old matches, or invalidate matches on user profile updates.
- **server.js:1-45** | Status: **Documented** | Owner: **MEMBER_4_LEAD_INTEGRATOR.md** (Fix 3)
  - Symptom: Missing static file serving middleware for production builds, which may cause 404 errors for client assets if the server is expected to serve the frontend.
  - Root cause: The server does not include any middleware to serve static files (e.g., from a 'client/build' or 'public' directory).
  - Proposed fix: Add express.static middleware to serve static files in production, conditional on NODE_ENV or a dedicated flag.

### Low
- **client/src/context/AuthContext.jsx:42-59** | Status: **Documented** | Owner: **MEMBER_1_FRONTEND.md** (Fix 5)
  - Symptom: Socket connection errors during login/register are not handled, potentially leaving the user authenticated but without real-time updates.
  - Root cause: The connectSocket function is called without error handling; if it fails, the error is not caught and the user is not notified.
  - Proposed fix: Wrap connectSocket in a try/catch or handle its promise rejection, and optionally show a warning or retry.
- **client/src/context/AuthContext.jsx:65-72** | Status: **Documented** | Owner: **MEMBER_1_FRONTEND.md** (Fix 6)
  - Symptom: refreshUser silently fails on error, providing no feedback if the profile refresh fails.
  - Root cause: The catch block is empty, so errors are not logged or handled.
  - Proposed fix: Log the error to the console for debugging purposes.
- **client/src/services/api.js:13-25** | Status: **Documented** | Owner: **MEMBER_1_FRONTEND.md** (Fix 7)
  - Symptom: The 401 interceptor's list of auth request URLs may not include all auth endpoints, causing unnecessary redirects to login on 401 for those endpoints.
  - Root cause: The isAuthRequest check only matches '/auth/login', '/auth/register', and '/auth/google'. If additional auth endpoints are added (e.g., '/auth/logout'), they will not be recognized as auth requests, causing a redirect to login on 401.
  - Proposed fix: Use a more robust method to identify auth requests, such as checking if the URL starts with '/auth/' or maintaining a list of auth endpoints.
- **server/services/geminiService.js:14-53** | Status: **Documented** | Owner: **MEMBER_3_AI_AND_DB.md** (Fix 4)
  - Symptom: The Gemini API call lacks a timeout, which could cause the request to hang indefinitely if the service is unresponsive.
  - Root cause: The evaluateCompatibility function does not set a timeout for the Gemini API request.
  - Proposed fix: Add a timeout parameter to the generateContent call or use Promise.race with a timeout.
- **server/models/Match.js:34-37** | Status: **Documented** | Owner: **MEMBER_3_AI_AND_DB.md** (Fix 5, combined with Fix 3)
  - Symptom: Match documents accumulate indefinitely in the database, wasting storage over time.
  - Root cause: The Match model has no TTL index or expiration mechanism to automatically remove old cached matches.
  - Proposed fix: Add a TTL index on the createdAt field to automatically expire matches after a configurable period (e.g., 30 days).
- **client/src/hooks/useMessages.js:105-113** | Status: **Documented** | Owner: **MEMBER_1_FRONTEND.md** (Fix 8) + **MEMBER_4_LEAD_INTEGRATOR.md** (Fix 4)
  - Symptom: Typing indicators are not implemented on the server, so typing notifications are not sent to other participants.
  - Root cause: The server does not emit typing events; the client listens for 'user_typing' and 'user_stop_typing' but these are never broadcasted.
  - Proposed fix: Implement typing event handling on the server to broadcast when users start/stop typing in a chat.
- **server.js:1-45** | Status: **Documented** | Owner: **MEMBER_4_LEAD_INTEGRATOR.md** (Fix 5)
  - Symptom: Missing request logging middleware, making it difficult to debug and monitor server requests.
  - Root cause: The server does not log incoming requests or responses.
  - Proposed fix: Add a request logging middleware (e.g., using morgan) to log HTTP requests.

### Deployment (discovered from live site inspection)
- **server/.env** | Status: **Documented** | Owner: **MEMBER_4_LEAD_INTEGRATOR.md** (Fix 6)
  - Symptom: Secrets (MongoDB URI, JWT secret, Gemini API key, Cloudinary creds) are committed in plain text in the repository.
  - Root cause: The `.env` file was committed to version control and is visible to anyone with repo access.
  - Proposed fix: Remove `server/.env` from git tracking, add to `.gitignore`, rotate all exposed secrets.
- **server/config/db.js:5** | Status: **Documented** | Owner: **MEMBER_4_LEAD_INTEGRATOR.md** (Fix 7)
  - Symptom: API server times out on Render — never responds to requests because MongoDB connection hangs indefinitely.
  - Root cause: `mongoose.connect()` has no `serverSelectionTimeoutMS` option. If MongoDB Atlas rejects the IP (whitelist) or is unreachable, the connection attempt never fails — it blocks `server.listen()` forever.
  - Proposed fix: Add `{ serverSelectionTimeoutMS: 5000 }` to `mongoose.connect()` and ensure MongoDB Atlas Network Access allows `0.0.0.0/0`.
- **client/index.html:5** | Status: **Documented** | Owner: **MEMBER_1_FRONTEND.md** (Fix 9)
  - Symptom: Browser tab shows "client" as the page title instead of the app name.
  - Root cause: The `<title>` tag was left as the Vite scaffold default.
  - Proposed fix: Change `<title>client</title>` to `<title>FlatMate</title>`.
