# Frontend Restyle Guide — Light Neutral + Teal Accent

All changes are copy-paste-ready patches for **Member 1 (Frontend Lead)**.
No code files have been edited. Apply each patch in order, then run `npm run build` to verify.

---

## Patch Order

| # | File | Summary |
|---|------|---------|
| 1 | `client/tailwind.config.js` | Replace dark palette with light neutral + teal accent |
| 2 | `client/src/styles/globals.css` | Update CSS vars, scrollbar, leaflet popup to light theme |
| 3 | `client/src/components/layout/Navbar.jsx` | Remove backdrop-blur, fix text logo, fix copy |
| 4 | `client/src/components/common/Button.jsx` | Update variants to teal accent, neutral secondary |
| 5 | `client/src/components/common/Input.jsx` | Light bg, stone borders, teal focus ring |
| 6 | `client/src/components/common/ErrorBanner.jsx` | Left-border accent style |
| 7 | `client/src/components/common/Loading.jsx` | Neutral spinner |
| 8 | `client/src/components/common/CompatibilityBadge.jsx` | Plain color-coded text, no badge bg |
| 9 | `client/src/components/auth/Login.jsx` | Fix copy, max-w-sm |
| 10 | `client/src/components/auth/Register.jsx` | Fix copy |
| 11 | `client/src/components/auth/GoogleAuthButton.jsx` | Light theme button |
| 12 | `client/src/components/onboarding/OnboardingQuiz.jsx` | Teal progress bar and options |
| 13 | `client/src/components/dashboard/Dashboard.jsx` | Fix marketing copy |
| 14 | `client/src/components/dashboard/ListingCard.jsx` | Remove backdrop-blur, heavy shadow; flat card |
| 15 | `client/src/components/dashboard/ViewToggle.jsx` | Teal active state |
| 16 | `client/src/components/dashboard/FilterBar.jsx` | Teal active borders |
| 17 | `client/src/components/dashboard/SearchBar.jsx` | Light theme input |
| 18 | `client/src/components/chat/MessageBubble.jsx` | Teal own-message, stone-100 others |
| 19 | `client/src/components/chat/MessageInput.jsx` | Light theme textarea and send button |
| 20 | `client/src/components/chat/ChatHeader.jsx` | Teal match text |
| 21 | `client/src/components/chat/ConversationCard.jsx` | Teal active/unread |
| 22 | `client/src/components/chat/ChatWindow.jsx` | Remove emoji |
| 23 | `client/src/components/chat/EmptyChat.jsx` | Light empty state |
| 24 | `client/src/components/chat/TypingIndicator.jsx` | Light typing bubble |
| 25 | `client/src/components/profile/ProfileDetail.jsx` | Teal accents, flat cards |
| 26 | `client/src/pages/NotFoundPage.jsx` | Neutral 404 text |
| 27 | `client/src/components/ErrorBoundary.jsx` | Light bg |
| 28 | `client/src/components/common/Skeleton.jsx` | Light skeleton pulse |
| 29 | `client/src/components/common/Unauthorized.jsx` | Light bg |
| 30 | `client/src/components/dashboard/EmptyState.jsx` | Light empty state |
| 31 | `client/index.html` | Set title to FlatMate |

---

## Patch 1: `client/tailwind.config.js`

Replace entire `theme.extend` with a light neutral palette + teal accent.

```javascript
// BEFORE
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        card: '#111827',
        border: '#1F2937',
        primary: {
          DEFAULT: '#2563EB',
          hover: '#3B82F6',
        },
        text: {
          DEFAULT: '#FFFFFF',
          muted: '#9CA3AF',
        },
        success: '#22C55E',
        danger: '#EF4444',
      },
      borderRadius: {
        DEFAULT: '12px',
        card: '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },

// AFTER
  theme: {
    extend: {
      colors: {
        background: '#fafaf9',     // stone-50
        card: '#ffffff',            // white
        border: '#e7e5e4',         // stone-200
        primary: {
          DEFAULT: '#0f766e',      // teal-700
          hover: '#0d9488',        // teal-600
        },
        text: {
          DEFAULT: '#1c1917',      // stone-900
          muted: '#78716c',        // stone-500
        },
        success: '#15803d',        // green-700
        danger: '#b91c1c',         // red-700
        warning: '#b45309',        // amber-700
      },
      borderRadius: {
        DEFAULT: '6px',
        card: '8px',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
```

**Why:** Swaps dark background/blue accent for stone neutrals + teal-700. Reduces radius from 12px to 6px for a more professional look. Drops Inter in favor of system UI stack.

---

## Patch 2: `client/src/styles/globals.css`

```css
/* BEFORE — :root block (lines 5-16) */
:root {
  --color-background: #09090b;
  --color-card: #111827;
  --color-border: #1f2937;
  --color-primary: #2563eb;
  --color-primary-hover: #3b82f6;
  --color-text: #ffffff;
  --color-text-muted: #9ca3af;
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --radius: 12px;
}

/* AFTER */
:root {
  --color-background: #fafaf9;
  --color-card: #ffffff;
  --color-border: #e7e5e4;
  --color-primary: #0f766e;
  --color-primary-hover: #0d9488;
  --color-text: #1c1917;
  --color-text-muted: #78716c;
  --color-success: #15803d;
  --color-danger: #b91c1c;
  --radius: 6px;
}
```

```css
/* BEFORE — body (lines 31-38) */
body {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: 'Inter', system-ui, sans-serif;
  ...
}

/* AFTER */
body {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: system-ui, -apple-system, sans-serif;
  ...
}
```

```css
/* BEFORE — scrollbar (lines 68-83) */
::-webkit-scrollbar-track {
  background: var(--color-background);
}
::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

/* AFTER — same structure, colors now automatically pick up the new CSS vars. No code change needed. */
```

```css
/* BEFORE — leaflet popup (lines 86-93) */
.leaflet-popup-content-wrapper {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  ...
}

/* AFTER */
.leaflet-popup-content-wrapper {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  ...
}
```

```css
/* BEFORE — leaflet tip shadow (lines 105-107) */
.leaflet-popup-tip-container {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* AFTER */
.leaflet-popup-tip-container {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.06));
}
```

```css
/* BEFORE — leaflet font (lines 109-112) */
.leaflet-container {
  background: var(--color-background);
  font-family: 'Inter', system-ui, sans-serif;
}

/* AFTER */
.leaflet-container {
  background: var(--color-background);
  font-family: system-ui, -apple-system, sans-serif;
}
```

```css
/* BEFORE — leaflet popup content font (lines 95-99) */
.leaflet-popup-content {
  ...
  font-family: 'Inter', system-ui, sans-serif;
}

/* AFTER */
.leaflet-popup-content {
  ...
  font-family: system-ui, -apple-system, sans-serif;
}
```

---

## Patch 3: `client/src/components/layout/Navbar.jsx`

```jsx
// BEFORE (line 14)
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">

// AFTER
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
```

```jsx
// BEFORE (line 16-18)
        <Link to="/" className="text-lg font-semibold text-white tracking-tight">
          Find Your Perfect Roommate
        </Link>

// AFTER
        <Link to="/" className="text-lg font-semibold text-text tracking-tight">
          FlatMate
        </Link>
```

```jsx
// BEFORE (line 28)
                    isActive ? 'text-white font-medium' : 'text-text-muted hover:text-white'

// AFTER
                    isActive ? 'text-text font-medium border-b-2 border-primary' : 'text-text-muted hover:text-text'
```

**Why:** Removes backdrop-blur glass effect. Replaces marketing slogan with plain "FlatMate" brand. Active link shown with underline instead of color-only. Fixes `text-white` references to use `text-text` semantic token.

---

## Patch 4: `client/src/components/common/Button.jsx`

```javascript
// BEFORE (lines 3-8)
const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-card text-white border border-border hover:border-primary',
  ghost: 'bg-transparent text-text-muted hover:text-white hover:bg-card',
  danger: 'bg-danger text-white hover:opacity-90',
};

// AFTER
const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-card text-text border border-border hover:border-primary',
  ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-stone-100',
  danger: 'bg-danger text-white hover:opacity-90',
};
```

**Why:** Secondary and ghost variants referenced `text-white` and `hover:bg-card` (which was dark gray). Now secondary uses `text-text`, ghost hovers to `bg-stone-100`.

---

## Patch 5: `client/src/components/common/Input.jsx`

```jsx
// BEFORE (lines 23-28)
          'w-full bg-card border border-border rounded-[var(--radius)]',
          'px-4 py-2.5 text-sm text-text placeholder:text-text-muted',
          'transition-colors duration-200',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',

// AFTER — no change needed.
```

The Input component uses semantic tokens (`bg-card`, `border-border`, `text-text`, `focus:border-primary`), which now resolve to light values via the updated CSS vars. **No code change required.**

---

## Patch 6: `client/src/components/common/ErrorBanner.jsx`

```jsx
// BEFORE (line 9)
      className="flex items-start gap-3 px-4 py-3 rounded-[var(--radius)] bg-danger/10 border border-danger/20"

// AFTER
      className="flex items-start gap-3 px-4 py-3 rounded-[var(--radius)] bg-red-50 border-l-4 border-danger"
```

**Why:** Switches from all-around faint border to a left-border accent style per the spec.

---

## Patch 7: `client/src/components/common/Loading.jsx`

No change needed. The spinner uses `border-border border-t-primary` which already resolves correctly with the new token values.

---

## Patch 8: `client/src/components/common/CompatibilityBadge.jsx`

```jsx
// BEFORE (lines 4-7)
  const color =
    score >= 80 ? 'text-success bg-success/10 border-success/20' :
    score >= 60 ? 'text-primary bg-primary/10 border-primary/20' :
                  'text-text-muted bg-border/40 border-border';

// AFTER
  const color =
    score >= 80 ? 'text-success' :
    score >= 60 ? 'text-primary' :
                  'text-text-muted';
```

```jsx
// BEFORE (lines 11-14)
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',

// AFTER
        'inline-flex items-center text-xs font-medium',
```

**Why:** Removes colored badge bg and pill shape. Shows score as plain color-coded text per spec.

---

## Patch 9: `client/src/components/auth/Login.jsx`

```jsx
// BEFORE (line 73)
    <div className="w-full max-w-[400px] mx-auto">

// AFTER
    <div className="w-full max-w-sm mx-auto">
```

```jsx
// BEFORE (line 75)
        <h1 className="text-2xl font-semibold text-text tracking-tight">Welcome back</h1>

// AFTER
        <h1 className="text-2xl font-semibold text-text tracking-tight">Sign in</h1>
```

```jsx
// BEFORE (line 130)
          className="text-text font-medium hover:text-primary transition-colors duration-150"

// AFTER — no change, already correct.
```

**Why:** Narrows container to `max-w-sm` (384px). Replaces "Welcome back" with plain "Sign in".

---

## Patch 10: `client/src/components/auth/Register.jsx`

```jsx
// BEFORE (line 158)
    <div className="w-full max-w-[440px] mx-auto">

// AFTER
    <div className="w-full max-w-sm mx-auto">
```

```jsx
// BEFORE (line 160)
        <h1 className="text-2xl font-semibold text-text tracking-tight">Create your account</h1>

// AFTER
        <h1 className="text-2xl font-semibold text-text tracking-tight">Create account</h1>
```

```jsx
// BEFORE (line 161)
        <p className="mt-1.5 text-sm text-text-muted">Find your perfect roommate Here.</p>

// AFTER
        <p className="mt-1.5 text-sm text-text-muted">Set up your profile to get started.</p>
```

**Why:** Narrows to `max-w-sm`. Removes marketing copy and capitalize inconsistency.

---

## Patch 11: `client/src/components/auth/GoogleAuthButton.jsx`

```jsx
// BEFORE (lines 72-73)
          'hover:border-[#4285F4]/50 hover:bg-[#111827]/80',

// AFTER
          'hover:border-stone-300 hover:bg-stone-50',
```

**Why:** Removes hardcoded dark-theme hover colors.

---

## Patch 12: `client/src/components/onboarding/OnboardingQuiz.jsx`

No code changes needed. The component uses semantic tokens (`bg-card`, `border-border`, `bg-primary/10`, `border-primary`, `text-text`, `bg-primary`) which all resolve correctly with the new light palette. The progress bar and option buttons will automatically pick up teal-700 as the accent.

---

## Patch 13: `client/src/components/dashboard/Dashboard.jsx`

```jsx
// BEFORE (line 33)
    : 'Find your next home.';

// AFTER
    : 'Your listings';
```

```jsx
// BEFORE (lines 40-42)
        <p className="text-sm text-text-muted">
          Browse verified rooms and find your perfect roommate match.
        </p>

// AFTER
        <p className="text-sm text-text-muted">
          Browse available rooms near you.
        </p>
```

**Why:** Replaces marketing copy with plain descriptions.

---

## Patch 14: `client/src/components/dashboard/ListingCard.jsx`

```jsx
// BEFORE (line 66)
        'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]',

// AFTER
        'hover:border-stone-300',
```

```jsx
// BEFORE (lines 90-94)
          className={cn(
            'absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full',
            'bg-background/70 backdrop-blur-sm border border-border/50',
            'transition-all duration-200 cursor-pointer active:scale-[0.92]',
            'hover:border-border',

// AFTER
          className={cn(
            'absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full',
            'bg-white/90 border border-border',
            'transition-all duration-200 cursor-pointer active:scale-[0.92]',
            'hover:border-stone-300',
```

**Why:** Removes heavy box-shadow, floating translate effect, and backdrop-blur on favorite button. Uses simple border hover and solid white bg.

---

## Patch 15: `client/src/components/dashboard/ViewToggle.jsx`

No change needed. Uses `bg-primary text-white` for active state, which now resolves to teal-700.

---

## Patch 16: `client/src/components/dashboard/FilterBar.jsx`

No change needed. Uses `border-primary` and `text-text` semantic tokens.

---

## Patch 17: `client/src/components/dashboard/SearchBar.jsx`

No change needed. Uses semantic tokens that resolve correctly.

---

## Patch 18: `client/src/components/chat/MessageBubble.jsx`

```jsx
// BEFORE (lines 77-79)
              isOwn
                ? 'bg-primary text-white rounded-2xl rounded-br-sm'
                : 'bg-card border border-border text-text rounded-2xl rounded-bl-sm'

// AFTER
              isOwn
                ? 'bg-primary text-white rounded-lg rounded-br-sm'
                : 'bg-stone-100 text-text rounded-lg rounded-bl-sm'
```

**Why:** Own messages use teal bg (via `bg-primary`). Other messages use `bg-stone-100` instead of bordered card. Reduces bubble radius from 2xl to lg.

---

## Patch 19: `client/src/components/chat/MessageInput.jsx`

No change needed. Uses semantic tokens (`bg-card`, `border-border`, `focus:border-primary`, `bg-primary`).

---

## Patch 20: `client/src/components/chat/ChatHeader.jsx`

No change needed. Uses semantic tokens. Match percentage color `text-primary` now resolves to teal-700.

---

## Patch 21: `client/src/components/chat/ConversationCard.jsx`

No change needed. Uses semantic tokens. `border-r-primary` and `bg-primary` now resolve to teal.

---

## Patch 22: `client/src/components/chat/ChatWindow.jsx`

```jsx
// BEFORE (line 56)
              Say hello to {participant?.fullName?.split(' ')[0] ?? 'your match'} 👋

// AFTER
              No messages yet. Say hello to {participant?.fullName?.split(' ')[0] ?? 'your match'}.
```

**Why:** Removes emoji. Uses plain text.

---

## Patch 23: `client/src/components/chat/EmptyChat.jsx`

No change needed. Uses semantic tokens.

---

## Patch 24: `client/src/components/chat/TypingIndicator.jsx`

```jsx
// BEFORE (line 4)
      <div className="flex items-center gap-1.5 bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5">

// AFTER
      <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg rounded-bl-sm px-3.5 py-2.5">
```

**Why:** Matches the updated incoming message bubble style (stone-100, rounded-lg).

---

## Patch 25: `client/src/components/profile/ProfileDetail.jsx`

No change needed. Uses semantic tokens throughout (`bg-card`, `border-border`, `text-primary`, `text-danger`, `bg-primary`). All resolve correctly with the new light palette.

---

## Patch 26: `client/src/pages/NotFoundPage.jsx`

```jsx
// BEFORE (line 9)
        <h1 className="text-6xl font-bold text-primary">404</h1>

// AFTER
        <h1 className="text-6xl font-bold text-text">404</h1>
```

**Why:** Uses neutral text color instead of accent for the 404 number.

---

## Patch 27: `client/src/components/ErrorBoundary.jsx`

No change needed. Uses semantic tokens. The `bg-danger/10 border-danger/20` values work for both light and dark themes.

---

## Patch 28: `client/src/components/common/Skeleton.jsx`

```jsx
// BEFORE (line 6)
      className={cn('bg-border/60 rounded animate-pulse', className)}

// AFTER
      className={cn('bg-stone-200 rounded animate-pulse', className)}
```

**Why:** Uses a visible light-mode shimmer color instead of the border token.

---

## Patch 29: `client/src/components/common/Unauthorized.jsx`

No change needed. Uses semantic tokens.

---

## Patch 30: `client/src/components/dashboard/EmptyState.jsx`

No change needed. Uses semantic tokens.

---

## Patch 31: `client/index.html`

```html
<!-- BEFORE -->
<title>client</title>

<!-- AFTER -->
<title>FlatMate</title>
```

---

## Files left unchanged and why

| File | Reason |
|------|--------|
| `AuthDivider.jsx` | Already uses `bg-border` and `text-text-muted` — resolves correctly |
| `PasswordInput.jsx` | Wraps `Input` which already resolves correctly |
| `ProtectedRoute.jsx` | No styling |
| `GuestRoute.jsx` | No styling |
| `SessionLoader.jsx` | Uses semantic tokens |
| `ErrorMessage.jsx` | Uses semantic tokens |
| `MapView.jsx` | Container styling uses semantic tokens; Leaflet map unchanged |
| `MapPopup.jsx` | Uses semantic tokens; styled via `globals.css` leaflet overrides |
| `MapControls.jsx` | Uses semantic tokens |
| `MapLegend.jsx` | Uses semantic tokens |
| `MapSkeleton.jsx` | Uses semantic tokens |
| `EmptyMapState.jsx` | Uses semantic tokens |
| `CurrentLocationButton.jsx` | Uses semantic tokens |
| `ListingMarker.jsx` | Uses semantic tokens |
| `ConversationSkeleton.jsx` | Uses semantic tokens |
| `MessageSkeleton.jsx` | Uses semantic tokens |
| `Layout.jsx` | Thin wrapper, no styling |
| `PageLayout.jsx` | Uses semantic tokens |
| `App.jsx` | No styling |
| `main.jsx` | No styling |
| All hooks, services, context, utils | No styling |

## Verification checklist

After applying all patches:

```bash
cd client

# 1. Build
npm run build

# 2. Grep for banned patterns — all should return zero results
grep -rn "purple\|indigo\|violet\|fuchsia\|gradient-to\|from-\|via-\|to-" src/ --include="*.jsx" --include="*.css"
grep -rn "shadow-xl\|shadow-2xl\|backdrop-blur\|bg-opacity" src/ --include="*.jsx" --include="*.css"
grep -rn "rounded-3xl" src/ --include="*.jsx"
grep -rn "👋\|🎉\|🔥\|💡\|🚀\|✨" src/ --include="*.jsx"
grep -rn "Find your perfect\|Unlock\|Seamless\|Find Your Perfect" src/ --include="*.jsx"

# 3. Visual check at 375px and 1280px — open dev tools, toggle device toolbar
```
