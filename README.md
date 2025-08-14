# WebsiteOrganiser - Your Keywords, Organized

A lightweight, fast, and feature-rich Progressive Web App (PWA) for organizing and accessing your favorite websites and keywords with smart categorization and cloud sync.

## ✨ Features

### 🚀 Core Features
- **Smart Organization**: Group websites and keywords by categories
- **Instant Search**: Find anything quickly with real-time search
- **One-Click Access**: Open websites or search keywords instantly
- **Drag & Drop**: Reorder groups easily
- **Dark/Light Theme**: Beautiful themes with smooth transitions

### ☁️ Cloud & Sync
- **Google Authentication**: Secure login with Google
- **Firebase Sync**: Real-time cloud synchronization
- **Offline Support**: Works without internet connection
- **Cache Management**: Smart caching for instant loading

### 📱 PWA Features
- **Installable**: Add to home screen like a native app
- **Offline Ready**: Service Worker for offline functionality
- **Responsive**: Works perfectly on all devices
- **Fast Loading**: Optimized for performance

### 🎨 UI/UX
- **Modern Design**: Clean, intuitive interface
- **Smooth Animations**: Beautiful transitions and effects
- **Touch Friendly**: Optimized for mobile devices
- **Accessibility**: Screen reader friendly

## 🚀 Quick Start

### Local Development
1. Clone the repository
2. Open `index.html` in your browser
3. Start organizing your websites!

### Vercel Deployment (Recommended)

#### Option 1: Deploy with Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts and your app will be live!
```

#### Option 2: Deploy via GitHub
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy automatically!

### Database Setup

#### Firebase (Current - Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "WebsiteOrganiser"
3. Enable Authentication (Google)
4. Enable Firestore Database
5. Update Firebase config in `index.html`

#### Alternative Databases
- **Supabase**: PostgreSQL with real-time features
- **PlanetScale**: MySQL with serverless scaling

## 💾 Cache Management

The app includes intelligent caching for better performance:

### Cache Features
- **Cache-First Loading**: Loads data from cache first, then syncs with cloud
- **Automatic Expiry**: Cache expires after 7 days
- **Manual Control**: Clear cache or force sync when needed
- **Offline Support**: Works completely offline with cached data

### Cache Controls
Click the 💾 button in the header to access:
1. **Load from Cache**: Force load cached data
2. **Sync with Cloud**: Update cache from cloud
3. **Clear Cache**: Remove all cached data
4. **Cache Status**: View cache information

## 📊 Performance

### Lightweight Design
- **No Heavy Frameworks**: Pure vanilla JavaScript
- **Optimized Assets**: Compressed images and CSS
- **Efficient Caching**: Smart cache management
- **Lazy Loading**: Load resources on demand

### Size Breakdown
- **HTML**: ~166 lines (clean and semantic)
- **CSS**: ~2,385 lines (well-organized)
- **JavaScript**: ~1,274 lines (efficient)
- **Total**: ~3.8MB (mostly images and Firebase SDK)

## 🔧 Configuration

### Firebase Setup
Update the Firebase configuration in `index.html`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Customization
- **Colors**: Modify CSS variables in `style.css`
- **Icons**: Replace images in `media/` folder
- **Default Groups**: Edit `DEFAULT_GROUPS` in `script.js`

## 🌐 Browser Support

- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 📱 PWA Installation

### Desktop
1. Open the app in Chrome
2. Click the install icon in the address bar
3. Follow the prompts

### Mobile
1. Open the app in Safari/Chrome
2. Tap "Add to Home Screen"
3. The app will appear like a native app

## 🔒 Security

- **HTTPS Only**: Secure connections required
- **No Data Storage**: Data only stored in Firebase and local cache
- **Google Auth**: Secure authentication
- **CORS Protection**: Proper security headers

## 🐛 Troubleshooting

### Common Issues
1. **Cache Issues**: Use the cache management button to clear/reset
2. **Sync Problems**: Check internet connection and Firebase config
3. **Installation Fails**: Ensure HTTPS and valid manifest

### Debug Mode
Open browser console and run:
```javascript
window.debugWebsiteSaver()
```

## 📈 Future Features

- [ ] Multiple user accounts
- [ ] Advanced search filters
- [ ] Import from bookmarks
- [ ] Custom themes
- [ ] Keyboard shortcuts
- [ ] Data analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Firebase for cloud services
- Google Fonts for typography
- Inter font family
- PWA community for best practices

---

**Made with ❤️ for better web organization** 