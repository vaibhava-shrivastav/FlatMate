# MEMBER 1 — Frontend Lead (`client/`)

## Fix Order

| # | Fix Title | Severity | File | Depends on |
|---|-----------|----------|------|------------|
| 1 | authService returns token instead of user | Critical | `client/src/services/authService.js` | — |
| 2 | useConversations calls non-existent endpoint | Critical | `client/src/hooks/useConversations.js` | — |
| 3 | useMessages REST endpoints non-existent | Critical | `client/src/hooks/useMessages.js` | — |
| 4 | Socket event name mismatches | Critical | `client/src/hooks/useMessages.js` | — |
| 5 | Socket error handling in AuthContext | Low | `client/src/context/AuthContext.jsx` | — |
| 6 | refreshUser silently swallows errors | Low | `client/src/context/AuthContext.jsx` | — |
| 7 | 401 interceptor auth URL list incomplete | Low | `client/src/services/api.js` | Member 2: logout route |
| 8 | Typing indicators not wired end-to-end | Low | `client/src/hooks/useMessages.js` | Member 4: server typing events |
| 9 | Page title is "client" instead of "FlatMate" | Medium | `client/index.html` | — |

---

## Fix 1: authService returns token instead of user (AUDIT ref: Critical)

- **File:** `client/src/services/authService.js:4-17`
- **Why:** `login()` and `register()` return `{ token, isNewUser }` — the raw API response — which AuthContext stores as the `user` object, leaving `user.name`, `user.role`, etc. undefined everywhere.
- **Change:**

```diff
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
-   return data;
+   localStorage.setItem('token', data.token);
+   const user = await this.getCurrentUser();
+   return { user, token: data.token };
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
-   return data;
+   localStorage.setItem('token', data.token);
+   const user = await this.getCurrentUser();
+   return { user, token: data.token, isNewUser: data.isNewUser };
  },

  async googleLogin(accessToken) {
    const { data } = await api.post('/auth/google', { access_token: accessToken });
-   return data;
+   localStorage.setItem('token', data.token);
+   const user = await this.getCurrentUser();
+   return { user, token: data.token, isNewUser: data.isNewUser };
  },
```

- **Verify:** Log in, then `console.log(user)` in any component using `useAuth()` — it should have `name`, `email`, `role` etc., not just `token`.
- **Commit:** `git add client/src/services/authService.js && git commit -m "fix(auth): return user object from authService instead of raw token response"`

---

## Fix 2: useConversations calls non-existent endpoint (AUDIT ref: Critical)

- **File:** `client/src/hooks/useConversations.js:19-22`
- **Why:** The hook calls `GET /api/conversations` but the server only exposes `GET /api/chats` (via `chatRoutes.js`). The response shape is `{ chats: [...] }`, not `{ conversations: [...] }`.
- **Change:**

```diff
      const { data } = await api.get('/conversations', {
        signal: abortRef.current.signal,
      });
-     setConversations(data.conversations ?? data);
+     // Server returns { chats: [...] } from getUserChats
```

Replace the full fetch block:

```javascript
// BEFORE
const { data } = await api.get('/conversations', {
  signal: abortRef.current.signal,
});
setConversations(data.conversations ?? data);

// AFTER
const { data } = await api.get('/chats', {
  signal: abortRef.current.signal,
});
setConversations(data.chats ?? data);
```

- **Verify:** Open the chat list page — it should load without a 404 in the network tab.
- **Commit:** `git add client/src/hooks/useConversations.js && git commit -m "fix(chat): point useConversations at /api/chats endpoint"`

---

## Fix 3: useMessages REST endpoints non-existent (AUDIT ref: Critical)

- **File:** `client/src/hooks/useMessages.js:25-27, 87-90`
- **Why:** `fetchMessages` calls `GET /api/conversations/:id/messages` (doesn't exist) and `sendMessage` calls `POST /api/conversations/:id/messages` (doesn't exist). The server has `GET /api/chats/:chatId` for history and socket.io `sendMessage` for sending.
- **Change:**

```javascript
// ── fetchMessages (line 25) ──
// BEFORE
const { data } = await api.get(`/conversations/${id}/messages`, {
  signal: abortRef.current.signal,
});
setMessages(data.messages ?? data);

// AFTER
const { data } = await api.get(`/chats/${id}`, {
  signal: abortRef.current.signal,
});
setMessages(data.messages ?? data);
```

```javascript
// ── sendMessage (lines 86-95) ──
// BEFORE
try {
  const { data } = await api.post(`/conversations/${conversationId}/messages`, {
    text: text.trim(),
  });
  setMessages((prev) => [...prev, data.message ?? data]);

  if (socket) {
    socket.emit('send_message', { conversationId, message: data.message ?? data });
    socket.emit('stop_typing', conversationId);
  }
}

// AFTER
try {
  if (socket) {
    socket.emit('sendMessage', {
      chatId: conversationId,
      senderId: socket.userId ?? socket.auth?.userId,
      text: text.trim(),
    });
    socket.emit('user_stop_typing', conversationId);
  }
  // Message will arrive back via the 'receiveMessage' listener
}
```

- **Verify:** Open a chat, send a message — it should appear in real-time without any 404 errors.
- **Commit:** `git add client/src/hooks/useMessages.js && git commit -m "fix(chat): use correct REST + socket endpoints for messages"`

---

## Fix 4: Socket event name mismatches (AUDIT ref: Critical)

- **File:** `client/src/hooks/useMessages.js:46, 65, 93, 94, 107, 112`
- **Why:** Client emits `join_room`, `send_message`, `typing`, `stop_typing` and listens for `receive_message`; server expects `joinChat`, `sendMessage` and emits `receiveMessage`.
- **Change:**

```javascript
// ── Line 46 ──
// BEFORE
socket.emit('join_room', conversationId);
// AFTER
socket.emit('joinChat', conversationId);

// ── Line 65 ──
// BEFORE
socket.on('receive_message', onMessage);
// AFTER
socket.on('receiveMessage', onMessage);

// ── Line 70-71 ──
// BEFORE
socket.emit('leave_room', conversationId);
socket.off('receive_message', onMessage);
// AFTER
// Note: server has no 'leaveChat' handler, but socket.io auto-leaves on disconnect
socket.off('receiveMessage', onMessage);

// ── Line 107 ──
// BEFORE
if (socket && conversationId) socket.emit('typing', conversationId);
// AFTER
if (socket && conversationId) socket.emit('user_typing', conversationId);

// ── Line 112 ──
// BEFORE
if (socket && conversationId) socket.emit('stop_typing', conversationId);
// AFTER
if (socket && conversationId) socket.emit('user_stop_typing', conversationId);
```

> **Note:** The server currently has no handler for `user_typing` / `user_stop_typing`. See **Member 4** fix for adding server-side typing event broadcast.

- **Verify:** Open two browser tabs in the same chat room — messages from one tab should appear in the other.
- **Commit:** `git add client/src/hooks/useMessages.js && git commit -m "fix(chat): align socket event names with server (joinChat, sendMessage, receiveMessage)"`

---

## Fix 5: Socket error handling in AuthContext (AUDIT ref: Low)

- **File:** `client/src/context/AuthContext.jsx:31, 45, 58`
- **Why:** `connectSocket()` is called without error handling — if it fails the user is authenticated but has no real-time updates and no notification.
- **Change:**

```javascript
// BEFORE (line 31)
connectSocket(token);

// AFTER
try {
  connectSocket(token);
} catch (err) {
  console.warn('Socket connection failed, retrying in background:', err.message);
}
```

Apply the same pattern at lines 45 and 58 (inside the `login` and `register` callbacks).

- **Verify:** Temporarily break `VITE_SOCKET_URL` → login should still succeed with a console warning.
- **Commit:** `git add client/src/context/AuthContext.jsx && git commit -m "fix(auth): handle socket connection errors gracefully in AuthContext"`

---

## Fix 6: refreshUser silently swallows errors (AUDIT ref: Low)

- **File:** `client/src/context/AuthContext.jsx:69-71`
- **Why:** The empty `catch` block swallows errors, making it impossible to debug profile refresh failures.
- **Change:**

```javascript
// BEFORE
} catch {
  // Silently fail — user stays as-is
}

// AFTER
} catch (err) {
  console.error('Failed to refresh user profile:', err.message);
}
```

- **Verify:** Force a 500 from `/users/me` — error should appear in DevTools console.
- **Commit:** `git add client/src/context/AuthContext.jsx && git commit -m "fix(auth): log refreshUser errors instead of swallowing"`

---

## Fix 7: 401 interceptor auth URL list incomplete (AUDIT ref: Low)

- **File:** `client/src/services/api.js:27`
- **Why:** The `isAuthRequest` check only matches three URLs. If `/auth/logout` (or any future auth endpoint) returns 401, the interceptor will redirect to login instead of letting the caller handle it.
- **Depends on:** Member 2 adding the `/auth/logout` route.
- **Change:**

```javascript
// BEFORE
const isAuthRequest = originalUrl.includes('/auth/login') || originalUrl.includes('/auth/register') || originalUrl.includes('/auth/google');

// AFTER
const isAuthRequest = originalUrl.startsWith('/auth/');
```

- **Verify:** Call `api.post('/auth/logout')` while unauthenticated — should NOT redirect to `/login`.
- **Commit:** `git add client/src/services/api.js && git commit -m "fix(api): broaden auth URL check to cover all /auth/ endpoints"`

---

## Fix 8: Typing indicators not wired end-to-end (AUDIT ref: Low)

- **File:** `client/src/hooks/useMessages.js:105-113`
- **Why:** Client emits typing events but the server has no handler to broadcast them, so typing indicators never appear for other users.
- **Depends on:** Member 4 adding `user_typing` / `user_stop_typing` handlers in `server/sockets/chatSocket.js`.
- **Change:** No client-side code change required beyond Fix 4 (event name alignment). Once the server broadcasts these events, the existing listeners at lines 66-67 will work.
- **Verify:** After Member 4's server fix is merged, type in a chat — the other participant should see a typing indicator.
- **Commit:** N/A (client-side already handled by Fix 4)

---

## Fix 9: Page title is "client" instead of "FlatMate" (AUDIT ref: Deployment/Medium)

- **File:** `client/index.html:5`
- **Why:** The `<title>` tag was left as the Vite scaffold default "client". The browser tab and search engines show "client" instead of the app name.
- **Change:**

```html
<!-- BEFORE -->
<title>client</title>

<!-- AFTER -->
<title>FlatMate</title>
```

- **Verify:** Open the app in a browser → tab should say "FlatMate".
- **Commit:** `git add client/index.html && git commit -m "fix(seo): set page title to FlatMate"`

---

## 1. Setup Guide

```bash
npm create vite@latest client -- --template react
cd client
npm install axios react-router-dom @react-oauth/google
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install leaflet react-leaflet lucide-react socket.io-client
```

`client/.env`
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_SOCKET_URL=http://localhost:5000
```

`tailwind.config.js` — set `content: ["./index.html","./src/**/*.{js,jsx}"]`.
Wrap `<App/>` in `main.jsx` with `<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>`.

## 2. Folder Structure (Owned)

```
client/
├── src/
│   ├── components/
│   │   ├── auth/ (Login.jsx, Register.jsx, GoogleAuthButton.jsx)
│   │   ├── onboarding/ (OnboardingQuiz.jsx)
│   │   ├── dashboard/ (Dashboard.jsx, ListingCard.jsx, MapView.jsx)
│   │   ├── profile/ (ProfileDetail.jsx)
│   │   ├── chat/ (Chat.jsx, ChatWindow.jsx)
│   │   └── common/ (LoadingSpinner.jsx, ErrorBanner.jsx, ProtectedRoute.jsx)
│   ├── services/ (api.js, socket.js)
│   ├── context/ (AuthContext.jsx)
│   ├── hooks/ (useAuth.js)
│   ├── pages/ (LoginPage.jsx, DashboardPage.jsx, ChatPage.jsx, OnboardingPage.jsx)
│   ├── App.jsx
│   └── main.jsx
```
**Forbidden:** `server/` entirely — no controllers, routes, models, or socket server code.

## 3. Axios Client — `src/services/api.js`

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 4. Login.jsx

```jsx
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      localStorage.setItem("token", data.token);
      navigate(data.isNewUser ? "/onboarding" : "/dashboard");
    } catch (err) {
      setError("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="mt-4 flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google login failed.")}
        />
      </div>
    </div>
  );
}
```

## 5. OnboardingQuiz.jsx (structural skeleton)

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const HABITS = ["sleepSchedule", "cleanliness", "smoking", "cooking", "guests", "noise"];

export default function OnboardingQuiz() {
  const [vector, setVector] = useState(Object.fromEntries(HABITS.map((h) => [h, 3])));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/users/onboarding", { habitVector: vector });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save onboarding data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg">
      <h1 className="text-xl font-bold mb-4">Lifestyle Habit Quiz</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}
      {HABITS.map((h) => (
        <div key={h} className="mb-3">
          <label className="capitalize text-sm">{h}</label>
          <input
            type="range"
            min="1"
            max="5"
            value={vector[h]}
            onChange={(e) => setVector({ ...vector, [h]: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      ))}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? "Saving..." : "Finish Setup"}
      </button>
    </div>
  );
}
```

## 6. Dashboard.jsx (feed + grid/map toggle skeleton)

```jsx
import { useEffect, useState } from "react";
import api from "../../services/api";
import ListingCard from "./ListingCard";
import MapView from "./MapView";

export default function Dashboard() {
  const [listings, setListings] = useState([]);
  const [view, setView] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const { data } = await api.get("/listings");
        setListings(data.listings);
      } catch (err) {
        setError(
          err.response?.status === 500
            ? "Server error. Please try later."
            : "Could not load listings."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading listings...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Find a Match</h1>
        <div className="space-x-2">
          <button onClick={() => setView("grid")} className="px-3 py-1 border rounded">Grid</button>
          <button onClick={() => setView("map")} className="px-3 py-1 border rounded">Map</button>
        </div>
      </div>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}
      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {listings.map((l) => (
            <ListingCard key={l._id} listing={l} />
          ))}
        </div>
      ) : (
        <MapView listings={listings} />
      )}
    </div>
  );
}
```

## 7. ProfileDetail.jsx (AI compatibility modal)

```jsx
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function ProfileDetail({ userId, onClose }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const { data } = await api.get(`/matches/${userId}`);
        setMatch(data);
      } catch (err) {
        setError("AI compatibility data unavailable right now.");
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <button onClick={onClose} className="float-right">✕</button>
        {loading && <p>Analyzing compatibility...</p>}
        {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>}
        {match && (
          <>
            <h2 className="text-lg font-bold">{match.compatibilityScore}% Match</h2>
            <p className="text-sm text-gray-600 my-2">{match.vibeSummary}</p>
            <div className="text-sm">
              <p className="font-semibold text-green-700">Pros</p>
              <ul className="list-disc pl-5">{match.pros?.map((p, i) => <li key={i}>{p}</li>)}</ul>
              <p className="font-semibold text-red-700 mt-2">Cons</p>
              <ul className="list-disc pl-5">{match.cons?.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

## 8. Chat.jsx (socket skeleton)

```jsx
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import api from "../../services/api";

export default function Chat({ chatId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: localStorage.getItem("token") },
    });

    socketRef.current.emit("joinChat", chatId);
    socketRef.current.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socketRef.current.on("connect_error", () => setError("Chat connection failed."));

    api.get(`/chats/${chatId}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => setError("Could not load chat history."));

    return () => socketRef.current.disconnect();
  }, [chatId]);

  const send = () => {
    if (!text.trim()) return;
    socketRef.current.emit("sendMessage", { chatId, senderId: currentUserId, text });
    setText("");
  };

  return (
    <div className="flex flex-col h-96 border rounded">
      {error && <div className="bg-red-100 text-red-700 p-2 text-sm">{error}</div>}
      <div className="flex-1 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={m.senderId === currentUserId ? "text-right" : "text-left"}>
            <span className="inline-block bg-gray-100 px-2 py-1 rounded my-1">{m.text}</span>
          </div>
        ))}
      </div>
      <div className="flex border-t">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 p-2"
          placeholder="Type a message..."
        />
        <button onClick={send} className="px-4 bg-blue-600 text-white">Send</button>
      </div>
    </div>
  );
}
```

## 9. Common Error/Loading Components

```jsx
// common/ErrorBanner.jsx
export default function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="bg-red-100 text-red-700 p-2 rounded text-sm mb-3">{message}</div>;
}

// common/LoadingSpinner.jsx
export default function LoadingSpinner() {
  return <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />;
}
```

## 10. Register.jsx

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SEARCHING_ROOM" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", form);
      localStorage.setItem("token", data.token);
      navigate("/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg">
      <h1 className="text-xl font-bold mb-4">Register</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          placeholder="Full Name"
          className="w-full border p-2 rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <select
          className="w-full border p-2 rounded"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="SEARCHING_ROOM">Searching for a Room</option>
          <option value="HAS_ROOM">Has a Room</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </div>
  );
}
```

## 11. GoogleAuthButton.jsx

```jsx
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../services/api";

export default function GoogleAuthButton() {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    setError("");
    try {
      const { data } = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      localStorage.setItem("token", data.token);
      navigate(data.isNewUser ? "/onboarding" : "/dashboard");
    } catch (err) {
      setError("Google sign-in failed. Try again.");
    }
  };

  return (
    <div>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">{error}</div>}
      <GoogleLogin onSuccess={handleSuccess} onError={() => setError("Google login failed.")} />
    </div>
  );
}
```

## 12. ListingCard.jsx

```jsx
import { useState } from "react";
import ProfileDetail from "../profile/ProfileDetail";

export default function ListingCard({ listing }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="border rounded-lg p-3 shadow-sm">
      <img
        src={listing.images?.[0] || "https://placehold.co/300x180"}
        alt={listing.title}
        className="w-full h-40 object-cover rounded mb-2"
      />
      <h3 className="font-semibold">{listing.title}</h3>
      <p className="text-sm text-gray-600">₹{listing.rent} / month</p>
      <button
        onClick={() => setShowDetail(true)}
        className="mt-2 w-full bg-blue-600 text-white py-1 rounded text-sm"
      >
        View Compatibility
      </button>
      {showDetail && (
        <ProfileDetail userId={listing.owner._id} onClose={() => setShowDetail(false)} />
      )}
    </div>
  );
}
```

## 13. MapView.jsx

```jsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ listings }) {
  if (!listings.length) {
    return <p className="text-center text-gray-500 mt-6">No listings to show on map.</p>;
  }

  const center = listings[0]?.location?.coordinates
    ? [listings[0].location.coordinates[1], listings[0].location.coordinates[0]]
    : [28.4744, 77.5040];

  return (
    <MapContainer center={center} zoom={13} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {listings.map((l) => {
        const coords = l.location?.coordinates;
        if (!coords) return null;
        return (
          <Marker key={l._id} position={[coords[1], coords[0]]}>
            <Popup>
              <strong>{l.title}</strong>
              <br />₹{l.rent}/month
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
```

## 14. context/AuthContext.jsx

```jsx
import { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/users/me")
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## 15. hooks/useAuth.js

```javascript
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

## 16. common/ProtectedRoute.jsx

```jsx
import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
```

## 17. services/socket.js

```javascript
import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: localStorage.getItem("token") },
      autoConnect: false,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

## 18. App.jsx

```jsx
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import OnboardingPage from "./pages/OnboardingPage";
import Register from "./components/auth/Register";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
```

## 19. main.jsx

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
```
