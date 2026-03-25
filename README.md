# 🌐 WebsiteOrganiser - Your Digital Keywords, Reimagined

A professional, high-performance Progressive Web Application (PWA) designed to organize, manage, and synchronize your favorite websites, bookmarks, and search keywords. Built with a focus on modern UI/UX, real-time cloud sync, and offline reliability.

---

## 🚀 Key Features

### 🎨 Premium User Experience
- **Adaptive Theming**: Seamless transition between elegant dark and light modes.
- **Dynamic Visuals**: 
  - 3D-enhanced floating buttons and keyword cards.
  - Interactive hover states with icon glowing effects and saturation boosts.
  - Premium **3D Glass** aesthetic with 15px backdrop-blur overlays.
- **Custom Iconography**: Integrated professional PNG icons for key actions like editing comments, renaming, and deleting.
- **Responsive Mastery**: Tailored for all viewports, from 4K desktops to modern tall smartphones (19.5:9 aspect ratio).

### ⌨️ Keyboard Power User Tools
- **Type-to-Focus**: Modals automatically focus the primary input field as soon as you start typing—no clicking required.
- **Enter-to-Save**: Instantly save or submit forms across the entire site by pressing the `Enter` key.
- **Escape-to-Close**: Quickly dismiss any open modal with the `Escape` key.

### ☁️ Intelligent Synchronization
- **Real-time Firestore Sync**: Instant updates across all devices using Google Firebase.
- **Public Contributions**: Anyone can add or modify keyword **Comments**, fostering a collaborative environment.
- **Protected Management**: Structural changes (adding/renaming/deleting keywords and groups) are strictly reserved for **Admins**.
- **Offline-First Resilience**: Full functionality without internet access, powered by robust local storage caching and Service Workers.

### 📱 PWA Excellence
- **Fully Installable**: Experience it as a standalone app with no browser chrome.
- **Fast Performance**: Aggressive caching of assets (JS, CSS, images) for near-instant load times.
- **App Shortcuts**: Quick-access actions directly from your device's home screen.

---

## 🛠️ Technology Stacks

### 1. Main Project (Firebase Edition)
*Located in the root directory.*
- **Frontend Core**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Database**: Firebase Firestore (NoSQL Cloud Storage).
- **PWA Engine**: Service Workers, Web App Manifest.
- **Hosting**: Firebase Hosting with optimized cache headers.

### 2. MERN Edition (Full-Stack)
*Located in the `MERN-Project/` folder.*
- **Frontend**: React.js with Vite and Tailwind CSS for rapid, modern styling.
- **Backend**: Node.js and Express.js API.
- **Database**: MongoDB (Mongoose) for flexible data modeling.
- **Security**: JWT-based authentication and secure password hashing.

---

## 📂 Project Architecture (Main)

```text
WebsiteOrganiser/
├── index.html              # Main application shell
├── firebase-config.js      # (Local Only) Your Firebase credentials
├── script.js               # Core logic, Firebase integration, and UI handlers
├── sw.js                   # Service Worker for offline support
├── style.css               # Base styles and 3D glass theme
├── add-keyword-modal.css   # Specific styles for modal interactions
├── search-bar-update.css   # Styles for the enhanced search interface
├── manifest.json           # PWA configuration and metadata
├── firestore.rules         # Security rules for cloud data
├── media/                 # Custom PNG icons and branding assets
└── MERN-Project/          # Complete MERN stack alternative implementation
```

---

## ⚙️ Getting Started

### Prerequisites
- A Firebase project (for the main version).
- Node.js and npm (for the MERN version).

### Local Development (Main Version)
1. Clone the repository.
2. Create `firebase-config.js` and add your credentials.
3. Open `index.html` in a local development server.

### Running the MERN Version
1. Navigate to `MERN-Project/server` and run `npm install` then `npm start`.
2. Navigate to `MERN-Project/client` and run `npm install` then `npm run dev`.

---

## 🔐 Admin Access
Administrative actions are protected to maintain organization integrity.
- **Default Password**: `yashman911` (Base64 encoded in `script.js`).
- **Permissions**: 
  - **Everyone**: Read keywords, click keywords (counters), and **Edit Comments**.
  - **Admin Only**: Add keywords, Rename keywords, Delete keywords/groups, and Import/Export data.

---
*Created with ❤️ for a more organized and productive web experience.*
