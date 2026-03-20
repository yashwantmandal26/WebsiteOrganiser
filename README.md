# 🌐 WebsiteOrganiser - Your Digital Keywords, Reimagined

A professional, high-performance Progressive Web Application (PWA) designed to organize, manage, and synchronize your favorite websites, bookmarks, and search keywords. Built with a focus on modern UI/UX, real-time cloud sync, and offline reliability.

---

## 🚀 Key Features

### 🎨 Premium User Experience
- **Adaptive Theming**: Seamless transition between elegant dark and light modes.
- **Dynamic Visuals**: 
  - 3D-enhanced floating buttons and keyword cards.
  - Interactive hover states with icon glowing effects and saturation boosts.
  - 15px backdrop-blur overlays for a modern, focused feel.
- **Smart Icons**:
  - Automatic high-quality favicon fetching via Google's API.
  - Hash-generated gradient letter icons (40 unique combinations) for search-based keywords.
- **Responsive Mastery**: Tailored for all viewports, from 4K desktops to smartphones, with touch-optimized targets (68px FAB, 52px inputs).

### ☁️ Intelligent Synchronization
- **Real-time Firestore Sync**: Instant updates across all devices using Google Firebase.
- **Offline-First Resilience**: Full functionality without internet access, powered by robust local storage caching and Service Workers.
- **Atomic Operations**: Reliable data updates with atomic increments for conflict-free multi-device usage.

### 📱 PWA Excellence
- **Fully Installable**: Experience it as a standalone app with no browser chrome.
- **Fast Performance**: Aggressive caching of assets (JS, CSS, images) for near-instant load times.
- **App Shortcuts**: Quick-access actions directly from your device's home screen.

### 🔐 Security & Content Integrity
- **Admin-Gated Actions**: Critical operations (Delete, Rename, Import/Export) require admin authentication.
- **Adult Content Shield**: Integrated filtering system to block inappropriate content and keywords.
- **Session Persistence**: Stays logged in securely even after browser refreshes.

### 🎯 Smart Organization
- **Dynamic Groups**: Create, reorder (drag-and-drop), and color-code categories.
- **Duplicate Shield**: Real-time detection of duplicate links or keywords across all groups.
- **Global Search**: Instantly find keywords or groups using the smart search bar.
- **Interactive Audio**: Custom-generated WAV feedback for clicks and hovers (can be toggled).

---

## 🛠️ Technology Stack

- **Frontend Core**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Database**: Firebase Firestore (NoSQL Cloud Storage).
- **PWA Engine**: Service Workers, Web App Manifest.
- **Hosting**: Firebase Hosting with optimized cache headers.
- **API Integrations**: Google Favicon API, Google Fonts (Inter).

---

## 📂 Project Architecture

```text
WebsiteOrganiser/
├── index.html              # Main application shell
├── firebase-config.js      # (Local Only) Your Firebase credentials
├── firebase-config.example.js # Template for your Firebase credentials
├── script.js               # Core logic, Firebase integration, and UI handlers
├── sw.js                   # Service Worker for offline support
├── style.css               # Base styles and theme variables
├── add-keyword-modal.css   # Specific styles for modal interactions
├── search-bar-update.css   # Styles for the enhanced search interface
├── manifest.json           # PWA configuration and metadata
├── firebase.json           # Deployment and caching configuration
├── firestore.rules         # Security rules for cloud data
└── media/                 # Static assets and UI icons
```

---

## ⚙️ Getting Started

### Prerequisites
- A Firebase project (for cloud sync and hosting).
- A modern web browser (Chrome, Safari, Edge, or Firefox).

### Local Development
1. Clone the repository.
2. Create a file named `firebase-config.js` in the root directory.
3. Copy the content from `firebase-config.example.js` and update it with your own Firebase project credentials (found in the Firebase Console).
4. Open `index.html` in a local development server (e.g., Live Server in VS Code).

### Firebase Deployment
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize project: `firebase init`
4. Deploy: `firebase deploy`

---

## 🔐 Admin Access
By default, administrative actions are protected. 
- **Default Password**: `yashman911` (Encoded as `eWFzaG1hbjkxMQ==` in `script.js`).
- To change the password, update the `_p` variable in `script.js` with your new Base64 encoded password.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Created with ❤️ for better web organization.*
