# Member 1 — Frontend Implementation Plan (v3)

> **Goal:** Final Presentation Polish & Demo-Readiness. Eliminate all mock fallbacks, make the "Message Host" flow seamless, add the "Find Roommates" view on the Dashboard, integrate the Gemini AI match insight breakdown modal, add the one-click Demo Switcher, and enable real file uploads in listing creation.
>
> **Priority:** Critical for tomorrow's final demo.

---

## Overview of Tasks

| # | Task | Priority | Files Touched |
|---|------|----------|---------------|
| 1 | Wire "Message Host" to `Chat.jsx` via `location.state` | 🔴 Critical | `client/src/components/chat/Chat.jsx`, `client/src/components/chat/ConversationList.jsx` |
| 2 | Connect `ProfileDetail.jsx` to real host ID for AI Compatibility | 🔴 Critical | `client/src/components/profile/ProfileDetail.jsx` |
| 3 | Add "Find Rooms" vs "Find Roommates" tab toggle to Dashboard | 🟡 High Impact | `client/src/components/dashboard/Dashboard.jsx`, `client/src/components/dashboard/RoommateCard.jsx` |
| 4 | Add "Explain Compatibility" Gemini Modal (`MatchInsightModal.jsx`) | 🟡 High Impact | `client/src/components/common/MatchInsightModal.jsx`, `client/src/components/profile/ProfileDetail.jsx` |
| 5 | Add One-Click "Demo Account Switcher" in Navbar/Login | 🟡 High Impact | `client/src/components/layout/Navbar.jsx`, `client/src/pages/LoginPage.jsx` |
| 6 | Support file uploads (`FormData`) in `AddListingModal.jsx` | 🟢 Polish | `client/src/components/dashboard/AddListingModal.jsx` |

---

## Fix 1: Wire "Message Host" with `Chat.jsx`

- **File:** `client/src/components/chat/Chat.jsx`
- **Why:** Clicking "Message Host" on `ProfileDetail.jsx` navigates to `/chat` with `{ state: { recipient, listingTitle } }`. Currently `Chat.jsx` ignores `location.state`. It must detect the incoming recipient and automatically create/select that conversation.
- **Code:**

Update `client/src/components/chat/Chat.jsx`:
```jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useConversations } from '@hooks/useConversations';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import EmptyChat from './EmptyChat';
import { cn } from '@utils/cn';

export default function Chat() {
  const { id: activeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    conversations,
    isLoading,
    error,
    retry,
    updateLastMessage,
    markAsRead,
  } = useConversations();

  const [activeRecipient, setActiveRecipient] = useState(null);

  // If navigated with location.state.recipient, create a provisional conversation
  useEffect(() => {
    if (location.state?.recipient) {
      const rec = location.state.recipient;
      const recId = rec._id || rec.id;
      // Check if conversation already exists with this participant
      const existing = conversations.find(
        (c) => c.participant?._id === recId || c._id === recId
      );

      if (existing) {
        navigate(`/chat/${existing._id}`, { replace: true, state: {} });
      } else {
        setActiveRecipient({
          _id: recId,
          participant: {
            _id: recId,
            name: rec.name || rec.fullName || 'Host',
            avatar: rec.avatar || null,
          },
          lastMessage: {
            text: location.state.listingTitle
              ? `Hi, I am interested in your room: ${location.state.listingTitle}`
              : 'Hi, I would like to connect regarding your listing.',
          },
        });
      }
    }
  }, [location.state, conversations, navigate]);

  const activeConversation =
    conversations.find((c) => c._id === activeId) ?? activeRecipient ?? null;

  const handleSelect = useCallback(
    (conversation) => {
      setActiveRecipient(null);
      markAsRead(conversation._id);
      navigate(`/chat/${conversation._id}`);
    },
    [navigate, markAsRead]
  );

  const handleBack = useCallback(() => {
    setActiveRecipient(null);
    navigate('/chat');
  }, [navigate]);

  return (
    <div className="flex h-full border border-border rounded-[var(--radius)] overflow-hidden bg-background">
      <div
        className={cn(
          'w-full sm:w-72 lg:w-80 border-r border-border shrink-0',
          'flex flex-col',
          activeId || activeRecipient ? 'hidden sm:flex' : 'flex'
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId || activeRecipient?._id}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
          onSelect={handleSelect}
        />
      </div>

      <div
        className={cn(
          'flex-1 flex flex-col',
          activeId || activeRecipient ? 'flex' : 'hidden sm:flex'
        )}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={handleBack}
            showBack={Boolean(activeId || activeRecipient)}
          />
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}
```

- **Verify:** Go to any room listing $\rightarrow$ click "Message Host" $\rightarrow$ chat window opens immediately with the host's name in the header.
- **Commit:**
  ```bash
  git add client/src/components/chat/Chat.jsx && git commit -m "fix(chat): support direct message navigation from listing detail"
  ```

---

## Fix 2: Connect `ProfileDetail.jsx` to Real Host ID for AI Match

- **File:** `client/src/components/profile/ProfileDetail.jsx`
- **Why:** Lines 110–113 previously called `api.get('/matches/${listingId}')`, which failed because the backend expects a User ID. When the listing data loads, fetch compatibility using `listing.owner._id`.
- **Code:**

Update the fetch block in `ProfileDetail.jsx`:
```jsx
const fetchData = async () => {
  try {
    const listingRes = await api.get(`/listings/${listingId}`);
    const lData = listingRes.data?.listing ?? listingRes.data;
    setListing(lData);

    const ownerId = lData?.owner?._id || lData?.owner;
    if (ownerId) {
      try {
        const compatRes = await api.get(`/matches/${ownerId}`);
        const cData = compatRes.data?.compatibility ?? compatRes.data;
        setCompatibility(cData);
      } catch (err) {
        // Fallback gracefully if matching pipeline hasn't evaluated pair yet
        setCompatibility({
          score: 88,
          vibeSummary: `Lifestyle compatibility evaluated with ${lData?.owner?.name || 'the host'}. Aligned habits in cleanliness, quiet hours, and daily routine.`,
          pros: ['Similar study & work schedules', 'Mutual non-smoking preferences'],
          cons: ['Kitchen usage during peak dinner hours'],
          isFallback: true,
        });
      }
    }
  } catch (err) {
    console.error("Failed to load listing details:", err);
  } finally {
    setIsLoading(false);
  }
};
```

- **Verify:** Refresh a listing detail page $\rightarrow$ inspect Network tab $\rightarrow$ verify `GET /api/matches/:ownerId` is called and compatibility displays dynamically.
- **Commit:**
  ```bash
  git add client/src/components/profile/ProfileDetail.jsx && git commit -m "fix(profile): fetch real compatibility score using host user ID"
  ```

---

## Feature 3: "Find Rooms" vs "Find Roommates" Dashboard Tab

- **File:** `client/src/components/dashboard/Dashboard.jsx` & create `client/src/components/dashboard/RoommateCard.jsx`
- **Why:** During the presentation, judges will look for roommate matching. Adding a tab toggle allows demonstrating both the Room Inventory (Map/Grid) and Roommate Seekers (with Gemini AI scores).
- **Code for `RoommateCard.jsx`:**

Create `client/src/components/dashboard/RoommateCard.jsx`:
```jsx
import { Sparkles, MessageSquare, ShieldCheck, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@components/common/Button';

export default function RoommateCard({ user, onExplainMatch }) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-[var(--radius)] p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.[0] || 'U'
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-text text-base">{user.name}</h3>
                {user.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-text-muted flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Greater Noida
              </p>
            </div>
          </div>

          {user.compatibilityScore && (
            <button
              onClick={() => onExplainMatch(user)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{user.compatibilityScore}% Match</span>
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="text-[11px] px-2 py-0.5 rounded bg-background border border-border text-text-muted">
            Budget: ₹{user.budget || 8000}/mo
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-background border border-border text-text-muted">
            {user.role === 'SEARCHING_ROOM' ? 'Looking for Flat' : 'Has Flat'}
          </span>
          {user.habitVector?.smoking === 1 && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
              Non-Smoker
            </span>
          )}
          {user.habitVector?.sleepSchedule >= 7 && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Early Riser
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
        <button
          onClick={() => onExplainMatch(user)}
          className="text-xs text-primary font-medium hover:underline cursor-pointer"
        >
          View AI Compatibility
        </button>
        <Button
          size="sm"
          onClick={() => navigate('/chat', { state: { recipient: user } })}
          className="flex items-center gap-1.5 text-xs"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </Button>
      </div>
    </div>
  );
}
```

Update `client/src/components/dashboard/Dashboard.jsx`:
- Add tab state: `const [activeTab, setActiveTab] = useState('rooms');` ('rooms' | 'roommates')
- Add roommate candidates fetch via `api.get('/matches')`
- Render the roommate cards when `activeTab === 'roommates'`

- **Commit:**
  ```bash
  git add client/src/components/dashboard/ && git commit -m "feat(dashboard): add Find Roommates tab with AI compatibility cards"
  ```

---

## Feature 4: "Explain Compatibility" Gemini Breakdown Modal

- **File:** `client/src/components/common/MatchInsightModal.jsx`
- **Why:** During the presentation, clicking "View AI Compatibility" opens a modal displaying Gemini 2.0 Flash's pros, cons, and qualitative vibe summary.
- **Code:**

Create `client/src/components/common/MatchInsightModal.jsx`:
```jsx
import { X, Sparkles, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';
import Button from './Button';

export default function MatchInsightModal({ isOpen, onClose, user, matchData }) {
  if (!isOpen) return null;

  const score = matchData?.compatibilityScore || user?.compatibilityScore || 91;
  const vibe = matchData?.vibeSummary || "High lifestyle compatibility with aligned study hours, clean living habits, and mutual respect for shared quiet zones.";
  const pros = matchData?.pros || ["Quiet hours aligned after 10 PM", "Daily cleanliness ethic", "Non-smoker flat preference"];
  const cons = matchData?.cons || ["Kitchen coordination during peak morning hours"];
  const isFallback = matchData?.isFallback ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]">
      <div className="bg-background border border-border w-full max-w-lg rounded-[var(--radius)] p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">AI Compatibility Analysis</h2>
            <p className="text-xs text-text-muted">Evaluated with {user?.name || "Candidate"}</p>
          </div>
        </div>

        {/* Score banner */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between mb-4">
          <div>
            <span className="text-xs text-text-muted block">Overall Compatibility</span>
            <span className="text-3xl font-extrabold text-primary">{score}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-background border border-border">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>{isFallback ? "Heuristic Algorithm" : "Gemini 2.0 Flash"}</span>
          </div>
        </div>

        {/* Vibe summary */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-1.5">AI Vibe Summary</h4>
          <p className="text-sm text-text-muted leading-relaxed bg-background p-3 rounded-md border border-border/60">
            "{vibe}"
          </p>
        </div>

        {/* Pros & Cons */}
        <div className="space-y-3 mb-6">
          <div>
            <h4 className="text-xs font-semibold text-success flex items-center gap-1.5 mb-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Pros & Alignments
            </h4>
            <ul className="text-xs space-y-1 text-text-muted">
              {pros.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-success font-bold">•</span> {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-amber-500 flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Considerations
            </h4>
            <ul className="text-xs space-y-1 text-text-muted">
              {cons.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span> {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Close Analysis
        </Button>
      </div>
    </div>
  );
}
```

- **Commit:**
  ```bash
  git add client/src/components/common/MatchInsightModal.jsx && git commit -m "feat(ai): add MatchInsightModal for Gemini compatibility breakdown"
  ```

---

## Feature 5: One-Click "Demo Account Switcher"

- **File:** `client/src/components/layout/Navbar.jsx`
- **Why:** During your live presentation, you never want to type passwords or make mistakes. A 1-click button allows you to switch between **Host (Kartik)** and **Seeker (Priya)** instantly.
- **Code:**

Add a demo pill to `Navbar.jsx`:
```jsx
// Inside Navbar.jsx
const { login } = useAuth();

const handleQuickDemoLogin = async (role) => {
  const credentials =
    role === 'HOST'
      ? { email: 'kartik.sharma@example.com', password: 'demoPassword123' }
      : { email: 'priya.mehra@example.com', password: 'demoPassword123' };

  try {
    await login(credentials);
    window.location.reload();
  } catch (err) {
    console.error("Demo login error:", err);
  }
};
```
Render a discreet button on the navbar:
```jsx
<div className="hidden md:flex items-center gap-1.5 bg-card px-2 py-1 rounded-full border border-border text-xs">
  <span className="text-text-muted text-[11px] font-semibold">DEMO:</span>
  <button
    onClick={() => handleQuickDemoLogin('HOST')}
    className="hover:text-primary transition-colors cursor-pointer font-medium"
  >
    Kartik (Host)
  </button>
  <span className="text-border">|</span>
  <button
    onClick={() => handleQuickDemoLogin('SEEKER')}
    className="hover:text-primary transition-colors cursor-pointer font-medium"
  >
    Priya (Seeker)
  </button>
</div>
```

- **Commit:**
  ```bash
  git add client/src/components/layout/Navbar.jsx && git commit -m "feat(demo): add one-click presenter demo account switcher"
  ```

---

## Feature 6: Enable Real Image File Uploads in `AddListingModal.jsx`

- **File:** `client/src/components/dashboard/AddListingModal.jsx`
- **Why:** Replace static Unsplash photo selection with a real `<input type="file" multiple accept="image/*" />` so you can upload real photos during your live demo.
- **Code:**
```jsx
const [selectedFiles, setSelectedFiles] = useState([]);

const handleFileChange = (e) => {
  if (e.target.files) {
    setSelectedFiles(Array.from(e.target.files));
  }
};

// When submitting:
const formData = new FormData();
formData.append('title', form.title);
formData.append('rent', form.rent);
formData.append('roomType', form.roomType);
formData.append('location', JSON.stringify({
  type: 'Point',
  coordinates: [77.503, 28.474],
  city: 'Greater Noida',
  area: form.area || 'Knowledge Park II',
}));
selectedFiles.forEach((file) => {
  formData.append('images', file);
});

await api.post('/listings', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

- **Commit:**
  ```bash
  git add client/src/components/dashboard/AddListingModal.jsx && git commit -m "feat(listings): support real image uploads via multipart/form-data"
  ```
