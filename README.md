# 🌐 WebsiteOrganiser — v1.0.20

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
- **PWA Engine**: Service Workers (`wo-v1005`), Web App Manifest.
- **Hosting**: Firebase Hosting with optimized cache headers.

---

## 📂 Project Architecture

```text
WebsiteOrganiser/
├── index.html              # Main application shell (v1005)
├── style.css               # Base styles and 3D glass theme
├── add-keyword-modal.css   # Modal interaction styles
├── search-bar-update.css   # Enhanced search interface styles
├── sw.js                   # Service Worker (cache: wo-v1005)
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

### v1.0.20 (2026-09-24)
- ⏰ **PC Cardless Clock**: Removed the white background pill card, border, and shadow from the PC desktop clock for a clean, borderless floating digital readout.
- 📱 **Mobile Header Redesign**:
  - Removed time clock on mobile view (`.live-clock` hidden).
  - Enlarged mobile logo icon (46px) and title font (clamp 1.45rem - 1.75rem) for bold readability.
  - Repositioned Theme Toggle to the LEFT of the Search Bar on row 2, forming a sleek, space-efficient 2-row mobile header.
- ⚡ **Cache & Asset Sync**: Production bundles synced to `v1046` with Service Worker `wo-v1046`.

### v1.0.19 (2026-09-24)
- 🎨 **Professional Duotone Logo**: Removed the animated shifting rainbow gradient (pink/cyan tint artifact). Replaced with a crisp, corporate duotone design: **"Website"** in dark charcoal/white and **"Organiser"** in Royal Purple (`#7b2cbf`) with zero chromatic distortion or flicker.
- 🛡️ **Admin Tools Hub Dropdown**: Replaced the 5 sprawling header buttons (`Select`, `Activity`, `Trash`, `Export`, `Import`) with a single sleek, glowing **`[🛡️ Admin Tools ▾]`** trigger button. Clicking opens a glassmorphic command dropdown organizing Security Logs, Trash, Bulk Select, Backups, and Logout without ever overflowing the header viewport.
- ⚡ **Cache & Asset Sync**: Production bundles synced to `v1045` and Service Worker `wo-v1045`.

### v1.0.18 (2026-09-24)
- 🛰️ **Precision GPS & Reverse Geocoding (Hazaribag)**: Upgraded location engine from cellular ISP gateway (Ranchi) to high-precision GPS (`navigator.geolocation`) with reverse-geocoding via BigDataCloud to accurately pinpoint exact city (e.g. Hazaribagh) and district with direct Google Maps navigation. Added manual `[🛰️ Enable Precision GPS]` toolbar toggle.
- 📱 **Smart Device Model Decoder**: Auto-translates raw hardware codes (e.g. `SM-S921E` → **Samsung Galaxy S24**) with brand icons, browser names, and screen resolution.
- 📑 **Rankwise Nested Accordion Audit Trail**: Complete overhaul of the Activity Audit modal into a ranked, structured list (`#1`, `#2`, `#3`...). Each item displays action pill, prominent target and affected group (`📁 meow`), device model, and relative timestamp. Clicking an item smoothly expands a nested details card with full actor, device, GPS/IP trace, and one-click undo restore.
- ⚡ **Build & Cache Bump**: Asset bundles synced to `v1044` with Service Worker `wo-v1044`.

### v1.0.17 (2026-09-24)
- 🛡️ **Comprehensive Audit & Security Trail**: Added real-time action logging for all additions, deletions, edits, and restores in Firestore.
- 📱 **Hardware & Model Device Detection**: Full device model & OS identification (Client Hints API + UA parser for Android, iPhone, Windows, Mac).
- 📍 **Geolocation & Google Maps**: Location tracking with direct Google Maps link for tracing action origin.
- ⚠️ **Suspicious Activity Alert & Rate-Limiter**: Automatic red security lock and banner when 5+ links are deleted, blocking further destructive actions until Admin unlock.
- ↩️ **One-Click Undo / Restore**: Restores deleted keywords or groups directly from the audit log.
- 🔍 **Activity Search, Filter & CSV Export**: Real-time filtering by category/action and one-click audit trail CSV download.
- ⚡ **Performance & Bundle Sync**: Updated Service Worker caching (`wo-v1043`), minified CSS/JS bundle pipeline, and instant asset cache busting.

### v1.0.5 (2026-07-15)
- ✅ **Search History Auto-Collapse** — The search history / suggestions dropdown now automatically collapses and loses focus immediately after executing a search, preventing it from unexpectedly re-opening when switching tabs or returning to the page.

### v1.0.4 (2026-07-15)
- ✅ **Keyword Text Truncation** — Long keywords are now strictly contained to a single line with `..` instead of wrapping to a second line. On hover, the full text expands on a single line horizontally, preventing layout shifts.
- ✅ **Unselectable Logo** — Made the main WebsiteOrganiser logo text unselectable (`user-select: none`), preventing accidental text highlighting when executing the triple-click admin login.

### v1.0.3 (2026-07-15)
- ✅ **Dark Theme Refinement** — Darkened keyword tiles to a cohesive charcoal grey and propagated this balanced darkness to the search bar, clock, and header.
- ✅ **Triple-Click Admin Login** — Admin login/logout from the top-left logo now requires a deliberate triple-click or triple-tap to prevent accidental triggers.

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
