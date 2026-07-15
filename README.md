# 🌐 WebsiteOrganiser — v1.0.2

A professional, high-performance Progressive Web Application (PWA) designed to organize, manage, and synchronize your favorite websites, bookmarks, and search keywords. Built with a focus on modern UI/UX, real-time cloud sync, and offline reliability.

---

## 🚀 Key Features

### 🎨 Premium User Experience
- **Adaptive Theming**: Seamless transition between elegant **Light**, **Dark**, and **Solid Dark** modes — with zero icon blink/flicker on theme change.
- **Dynamic Visuals**:
  - 3D-enhanced floating buttons and keyword cards.
  - Interactive hover states with icon glowing effects and saturation boosts.
  - Premium **3D Glass** aesthetic with 15px backdrop-blur overlays.
- **Custom Iconography**: Integrated professional PNG icons for key actions like editing comments, renaming, and deleting.
- **Responsive Mastery**: Tailored for all viewports, from 4K desktops to modern tall smartphones (19.5:9 aspect ratio).

### 🔍 Smart Search & Suggestions
- **Hybrid Search Engine**: Searches saved keywords first; falls back to Google if no match found.
- **Real Favicons in Suggestions**: Website suggestions show the actual favicon of each saved site fetched via Google's favicon service, with a graceful globe-icon fallback.
- **Highlighted Matches**: Matched text is highlighted in **red rose** (`#FA2A55`) bold — no extra spacing gaps around highlighted letters.
- **Trailing-Space Intent**: Typing `"you "` (with a space) hides keyword suggestions and forces a direct Google search on Enter — giving you full control.
- **Enter Opens First Result**: Pressing Enter when suggestions are visible opens the **first (best) match** automatically, even without using arrow keys.
- **Arrow Key Navigation**: Full keyboard navigation through suggestions with smooth **auto-scroll** — selected item always stays visible in the dropdown.
- **No Blink on Search**: Live card filtering uses in-place DOM patching — icons never reload or flicker while typing.

### 🗂️ Group Card Behavior
- **Click-to-Expand**: Group cards with >12 items expand **only on button click** (the ↓ arrow indicator) — no accidental hover-expand.
- **Click-Outside-to-Collapse**: Clicking anywhere outside an expanded group card collapses it instantly.

### ⌨️ Keyboard Power User Tools
- **`Alt`** → Cycle through themes (`Light → Dark → Solid Dark → Light`).
- **`Delete`** → Clear and reset the search bar (when not focused in a text field).
- **`Enter`** → Open the best keyword match or perform a Google search.
- **`Escape`** → Close suggestions / modals.
- **`↑` / `↓`** → Navigate suggestion list with auto-scroll.
- **Type-to-Focus**: Modals automatically focus the primary input field.

### ☁️ Intelligent Synchronization
- **Real-time Firestore Sync**: Instant updates across all devices using Google Firebase.
- **Public Contributions**: Anyone can add groups and keywords/links, and modify keyword **Comments**.
- **Protected Management**: Renaming and deleting keywords and groups are strictly reserved for **Admins**.
- **Offline-First Resilience**: Full functionality without internet access, powered by robust local storage caching and Service Workers.

### 📱 PWA Excellence
- **Fully Installable**: Experience it as a standalone app with no browser chrome.
- **Fast Performance**: Aggressive caching of assets (JS, CSS, images) for near-instant load times.
- **App Shortcuts**: Quick-access actions directly from your device's home screen.

---

## 🛠️ Technology Stack

### Main Project (Firebase Edition)
*Located in the root directory.*
- **Frontend Core**: Vanilla JavaScript (ES6+), HTML5, CSS3 — modular IIFE architecture.
- **Database**: Firebase Firestore (NoSQL Cloud Storage).
- **PWA Engine**: Service Workers (`wo-v1002`), Web App Manifest.
- **Hosting**: Firebase Hosting with optimized cache headers.

---

## 📂 Project Architecture

```text
WebsiteOrganiser/
├── index.html              # Main application shell (v1002)
├── style.css               # Base styles and 3D glass theme
├── add-keyword-modal.css   # Modal interaction styles
├── search-bar-update.css   # Enhanced search interface styles
├── sw.js                   # Service Worker (cache: wo-v1002)
├── manifest.json           # PWA configuration and metadata
├── firebase-config.js      # (Local Only) Firebase credentials
├── firestore.rules         # Security rules for cloud data
├── media/                  # Custom PNG icons and branding assets
└── js/
    ├── config.js           # App constants and configuration
    ├── state.js            # Shared application state
    ├── utils.js            # Utilities: colors, favicon, search helpers
    ├── render.js           # Group/keyword DOM rendering + in-place updaters
    ├── search.js           # Hybrid smart search engine
    ├── crud.js             # Create/Read/Update/Delete operations
    ├── ui.js               # UI init, theme, keyboard shortcuts, modals
    ├── firebase-sync.js    # Firestore real-time sync
    └── app.js              # App bootstrap and orchestration
```

---

## ⚙️ Getting Started

### Prerequisites
- A Firebase project (for the main version).
- Node.js and npm (for local tooling).

### Local Development
1. Clone the repository.
2. Create `firebase-config.js` and add your Firebase credentials (see `firebase-config.example.js`).
3. Open `index.html` in a local development server.

---

## 🔐 Admin Access
Administrative actions are protected to maintain organization integrity.
- **Permissions**:
  - **Everyone**: Read keywords, click keywords (counters), **Edit Comments**, and add groups/keywords/links.
  - **Admin Only**: Rename keywords/groups, Delete keywords/groups, and Import/Export data.

---

## 📋 Changelog

### v1.0.2 (2026-07-15)
- ✅ **Group expand on button-click only** — removed hover-expand; only the ↓ button expands/collapses a group card.
- ✅ **Click outside to collapse** — clicking anywhere outside an expanded card now collapses it on both desktop and mobile.
- ✅ **Enter opens first suggestion** — pressing Enter now opens the best keyword match without needing to arrow-key select it first.
- ✅ **Trailing-space = Google search** — typing a word followed by a space hides suggestions and forces a Google search on Enter.
- ✅ **Real favicons in suggestions** — website suggestions now display actual site favicons with fallback globe icon.
- ✅ **Highlight color & spacing fix** — matched text is now styled in red rose (`#FA2A55`), bold, with no extra side padding/gaps.
- ✅ **Suggestion scroll fix** — arrow key navigation auto-scrolls the dropdown so the selected item always stays visible.
- ✅ **Zero icon blink on search** — live card filtering now uses in-place DOM patching (`updateSearchHighlighting`) — favicon images never reload while typing.
- ✅ **Zero icon blink on theme change** — theme cycling now uses `updateThemeColors()` to patch only card backgrounds in-place, no full DOM rebuild.
- ✅ **Keyboard shortcuts** — `Alt` cycles themes, `Delete` resets the search bar.

### v1.0.1 (prior)
- Initial modular JS architecture (split into config, state, utils, render, search, crud, ui, firebase-sync, app).
- Smart hybrid search engine (keywords-first, Google fallback).
- Live group card filtering while typing.
- PWA caching with Service Worker `wo-v1001`.

---

*Created with ❤️ for a more organized and productive web experience.*
