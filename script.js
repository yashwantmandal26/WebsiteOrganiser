document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const groupsContainer = document.getElementById('groups-container');
    const addFab = document.getElementById('add-fab');
    const loginBtn = document.getElementById('login-btn');

    // Search Input (debounced for smoother typing on Android)
    const searchInput = document.getElementById('search-input');
    let searchDebounceTimer = null;

    // Keyword Add Trigger Button & Container
    const addKeywordModalFab = document.getElementById('add-keyword-modal-fab');
    const keywordAddInputContainer = document.querySelector('.keyword-input-container'); // Use querySelector for class

    // Theme Toggle Button
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // Export/Import Elements
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');
    const cacheBtn = document.getElementById('cache-btn');

    // Undo/Redo Buttons
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    // Group Modal Elements
    const groupModal = document.getElementById('group-modal');
    const groupModalTitle = document.getElementById('group-modal-title');
    const groupNameInput = document.getElementById('group-name-input');
    const saveGroupBtn = document.getElementById('save-group-btn');
    const cancelGroupBtn = document.getElementById('cancel-group-btn');

    // Keyword Modal Elements
    const keywordModal = document.getElementById('keyword-modal');
    const keywordModalTitle = document.getElementById('keyword-modal-title');
    const keywordInput = document.getElementById('keyword-input');
    const addKeywordBtn = document.getElementById('add-keyword-btn');
    const keywordList = document.getElementById('keyword-list');
    const closeKeywordModalBtn = document.getElementById('close-keyword-modal-btn');

    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    // Loading Overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    const headerSpinner = document.getElementById('header-spinner');
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }
    function showHeaderSpinner() { 
        if (headerSpinner) {
            headerSpinner.style.display = 'inline-block'; 
        }
    }
    function hideHeaderSpinner() { 
        if (headerSpinner) {
            headerSpinner.style.display = 'none'; 
        }
    }

    // --- App State ---
    let groups = []; // Initialize as empty, data will be loaded from localStorage
    let currentGroupIndex = null; // To track which group is being edited
    let groupModalMode = 'add'; // 'add' or 'edit'
    let draggedItemIndex = null; // To track the index of the dragged group

    // Context menu state
    let activeContextMenu = null;

    // Default groups for new users
    const DEFAULT_GROUPS = [
      {
        "keywords": [
          "Google.com",
          "www.youtube.com",
          "fb",
          "https://x.com/",
          "https://www.amazon.com/",
          "https://www.whatsapp.com/",
          "https://www.reddit.com/",
          "https://www.linkedin.com/"
        ],
        "name": "Popular Sites"
      },
      {
        "keywords": [
          "HdMovies2",
          "Netmirror",
          "hhdmovies.beauty",
          "MultiMovies",
          "https://hdhub4u.gs/"
        ],
        "name": "Streaming_MovieSites"
      },
      {
        "keywords": [
          "KatMovieHD",
          "world4ufree",
          "HDhub4u",
          "VEGAMOVIES"
        ],
        "name": "Download_MovieSites"
      }
    ];

    // --- Local Storage Functions (simple, fast) ---
    function saveGroups() {
        localStorage.setItem('websiteSaverGroups', JSON.stringify(groups));
    }
    function loadGroups() {
        console.log('Loading groups from localStorage...');
        const storedGroups = localStorage.getItem('websiteSaverGroups');
        if (storedGroups) {
            try {
                groups = JSON.parse(storedGroups);
                console.log('Loaded groups from localStorage:', groups.length);
            } catch (error) {
                console.error('Error parsing localStorage data:', error);
                groups = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
                localStorage.setItem('websiteSaverGroups', JSON.stringify(groups));
            }
        } else {
            console.log('No localStorage data, using default groups');
            groups = JSON.parse(JSON.stringify(DEFAULT_GROUPS)); // Deep copy
            localStorage.setItem('websiteSaverGroups', JSON.stringify(groups));
        }
    }

    // --- Firebase Auth & Firestore Setup ---
    const auth = firebase.auth();
    const db = firebase.firestore();
    let currentUser = null;

    function isLocalStorageAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, '1');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    function showLocalStorageWarning() {
        showToast('⚠️ Local storage is not available. Your data may not be saved on this device. Please log in for cloud sync.', 6000);
    }

    // --- Google Login/Logout ---
    const profilePic = document.getElementById('profile-pic');
    const loginText = document.getElementById('login-text');

    function updateLoginButton(user) {
        if (user) {
            // Show profile pic, hide text and Google icon
            if (user.photoURL) {
                profilePic.src = user.photoURL;
                profilePic.style.display = 'inline-block';
                loginText.style.display = 'none';
                document.getElementById('google-login-icon').style.display = 'none';
            } else {
                profilePic.style.display = 'none';
                loginText.style.display = 'inline';
                loginText.textContent = user.displayName || 'Account';
                document.getElementById('google-login-icon').style.display = 'none';
            }
            loginBtn.onclick = () => {
                if (confirm('Do you want to log out?')) {
                    console.log('User logging out...');
                    auth.signOut();
                }
            };
            // Make login button round after login
            loginBtn.style.borderRadius = '50%';
            loginBtn.style.width = '44px';
            loginBtn.style.height = '44px';
            loginBtn.style.padding = '0';
            loginBtn.style.display = 'flex';
            loginBtn.style.alignItems = 'center';
            loginBtn.style.justifyContent = 'center';
            loginBtn.style.minWidth = '44px';
            loginBtn.style.minHeight = '44px';
            loginBtn.style.maxWidth = '44px';
            loginBtn.style.maxHeight = '44px';
        } else {
            // Show Google icon only, hide profile pic and text
            profilePic.style.display = 'none';
            loginText.style.display = 'none';
            document.getElementById('google-login-icon').style.display = 'inline-block';
            loginBtn.onclick = () => {
                const provider = new firebase.auth.GoogleAuthProvider();
                // Add better error handling for login
                auth.signInWithPopup(provider).catch(error => {
                    console.error('Login error:', error);
                    if (error.code === 'auth/popup-blocked') {
                        // Try redirect method if popup is blocked
                        showToast('⚠️ Popup blocked! Trying redirect method...', 3000);
                        auth.signInWithRedirect(provider);
                    } else if (error.code === 'auth/popup-closed-by-user') {
                        showToast('Login cancelled by user.', 3000);
                    } else if (error.code === 'auth/network-request-failed') {
                        showToast('⚠️ Network error! Please check your internet connection.', 5000);
                    } else {
                        showToast('⚠️ Login failed: ' + error.message, 5000);
                    }
                });
            };
            // Keep login button round
            loginBtn.style.borderRadius = '50%';
            loginBtn.style.width = '44px';
            loginBtn.style.height = '44px';
            loginBtn.style.padding = '0';
            loginBtn.style.display = 'flex';
            loginBtn.style.alignItems = 'center';
            loginBtn.style.justifyContent = 'center';
            loginBtn.style.minWidth = '44px';
            loginBtn.style.minHeight = '44px';
            loginBtn.style.maxWidth = '44px';
            loginBtn.style.maxHeight = '44px';
        }
    }

    // Handle redirect result for login
    auth.getRedirectResult().then((result) => {
        if (result.user) {
            showToast('✅ Login successful!', 3000);
        }
    }).catch((error) => {
        console.error('Redirect error:', error);
        if (error.code === 'auth/account-exists-with-different-credential') {
            showToast('⚠️ Account exists with different login method.', 5000);
        }
    });

    auth.onAuthStateChanged(user => {
        console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
        currentUser = user;
        updateLoginButton(user);
        
        if (user) {
            // User logged in - load their saved data with cache-first approach
            console.log('Loading data for user:', user.uid);
            showHeaderSpinner();
            
            loadDataWithCache().then(() => {
                hideHeaderSpinner();
            }).catch((error) => {
                console.error('Failed to load data:', error);
                hideHeaderSpinner();
                // Fallback to default groups
                groups = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
                renderGroups();
                showToast('⚠️ Failed to load data, using defaults.', 5000);
            });
        } else {
            // User logged out - try to load from cache first
            console.log('User logged out, checking cache...');
            loadFromCache().then(cachedData => {
                if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                    groups = cachedData;
                    showToast('📱 Loaded from cache', 2000);
                } else {
                    groups = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
                    showToast('👋 Showing default groups.', 3000);
                }
                renderGroups();
            }).catch(() => {
                groups = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
                renderGroups();
                showToast('👋 Showing default groups.', 3000);
            });
        }
    });

    // --- Firestore Sync Functions ---
    function saveUserData(uid, groups) {
        console.log('Saving data for user:', uid, 'Groups:', groups.length);
        console.log('Groups data to save:', JSON.stringify(groups, null, 2));
        
        const userData = {
            groups: groups,
            lastUpdated: new Date().toISOString(),
            userId: uid,
            email: currentUser ? currentUser.email : null
        };
        
        return db.collection('users').doc(uid).set(userData, { merge: true }).then(() => {
            console.log('Data saved to Firestore successfully');
            console.log('Saved user data:', userData);
            showToast('💾 Data saved to cloud!', 2000);
        }).catch((error) => {
            console.error('Error saving to Firestore:', error);
            showToast('⚠️ Failed to save to cloud', 3000);
            throw error; // Re-throw for proper error handling
        });
    }

    function loadUserData(uid) {
        db.collection('users').doc(uid).get().then(doc => {
            if (doc.exists) {
                groups = doc.data().groups || [];
                saveGroups(); // Save to localStorage for offline use
                renderGroups();
            } else {
                // No data yet, use local or default
                loadGroups();
                renderGroups();
            }
        });
    }

    // --- Patch all group-modifying functions to sync with Firestore if logged in ---
    async function syncAndSaveGroups() {
        console.log('Syncing groups to cloud...', 'Current user:', currentUser ? currentUser.uid : 'None');
        saveGroups(); // Save to localStorage first
        await saveToCache(groups); // Save to cache
        
        if (currentUser) {
            try {
                await saveUserData(currentUser.uid, groups);
                console.log('Groups synced to cloud successfully');
            } catch (error) {
                console.error('Failed to sync to cloud:', error);
                showToast('⚠️ Failed to sync to cloud', 3000);
            }
        } else {
            console.log('No user logged in, skipping cloud sync');
        }
    }

    // --- Functions ---

    // RE-USABLE MODAL TOGGLE
    const toggleModal = (modal, show) => {
        if (show) {
            modal.classList.add('visible');
            document.body.classList.add('modal-open');
        } else {
            modal.classList.remove('visible');
            document.body.classList.remove('modal-open');
        }
    };

    // Close modal when clicking outside content
    groupModal.addEventListener('click', (e) => {
        if (e.target === groupModal) {
            toggleModal(groupModal, false);
        }
    });

    keywordModal.addEventListener('click', (e) => {
        if (e.target === keywordModal) {
            toggleModal(keywordModal, false);
        }
    });

    // TOAST NOTIFICATIONS
    const showToast = (message, duration = 3000) => {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toastContainer.appendChild(toast);

        // Trigger reflow to ensure animation plays
        void toast.offsetWidth;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, duration);
    };

    // EXPORT/IMPORT FUNCTIONALITY
    const exportGroups = () => {
        const dataStr = JSON.stringify(groups, null, 2); // Pretty print JSON
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileName = 'WebsiteOrganiser_groups.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click(); // Simulate click to trigger download
        linkElement.remove();
        showToast('Groups exported successfully!');
    };

    const importGroups = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Basic validation: Check if it's an array and has expected properties
                if (Array.isArray(importedData) && importedData.every(g => typeof g.name === 'string' && Array.isArray(g.keywords)) ) {
                    let updatedGroups = [...groups]; // Create a copy of existing groups

                    // Merge imported data with existing groups
                    importedData.forEach(importedGroup => {
                        const existingGroupIndex = updatedGroups.findIndex(g => g.name === importedGroup.name);
                        if (existingGroupIndex !== -1) {
                            // Group exists, merge keywords
                            importedGroup.keywords.forEach(importedKeyword => {
                                if (!updatedGroups[existingGroupIndex].keywords.includes(importedKeyword)) {
                                    updatedGroups[existingGroupIndex].keywords.push(importedKeyword);
                                }
                            });
                        } else {
                            // Group does not exist, add it
                            updatedGroups.push(importedGroup);
                        }
                    });
                    groups = updatedGroups; // Assign the merged array back
                    syncAndSaveGroups(); // Save to localStorage and Firestore
                    renderGroups(); // Update UI
                    showToast('Groups imported successfully!');
                } else {
                    alert('Invalid file format. Please import a valid WebsiteOrganiser JSON file.');
                    showToast('Import failed: Invalid format.');
                }
            } catch (error) {
                alert('Error parsing file. Please ensure it\'s a valid JSON.');
                showToast('Import failed: File error.');
            }
            importFileInput.value = ''; // Clear file input to allow re-importing same file
        };
        reader.readAsText(file);
    };

    // THEME TOGGLE FUNCTIONALITY
    const setTheme = (theme) => {
        document.body.dataset.theme = theme;
        localStorage.setItem('websiteSaverTheme', theme);
        // Remove any textContent/icon changes for themeToggleBtn
        // Only toggle a class or data attribute if needed
        renderGroups();
        // If modal is open, re-apply modal background
        const modalContent = document.querySelector('.modal-content');
        if (modalContent && typeof currentGroupIndex === 'number' && groups[currentGroupIndex]) {
            const usedColors = new Set();
            for (let i = 0; i < groups.length; i++) {
                if (i === currentGroupIndex) break;
                getGroupColor(groups[i].name, usedColors);
            }
            const groupColor = getGroupColor(groups[currentGroupIndex].name, usedColors);
            if (document.body.dataset.theme === 'dark') {
                modalContent.style.background = darkenColor(groupColor, 0.6);
                modalContent.style.backdropFilter = 'blur(16px)';
                modalContent.style.webkitBackdropFilter = 'blur(16px)';
            } else {
                modalContent.style.background = groupColor;
                modalContent.style.backdropFilter = '';
                modalContent.style.webkitBackdropFilter = '';
            }
            modalContent.style.color = '#222';
        }
    };

    // HELPER: Generate a random HSL color (unique per call)
    const getRandomColor = () => {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * (70 - 40) + 40); // Saturation between 40-70
        const l = Math.floor(Math.random() * (50 - 30) + 30); // Lightness between 30-50 for better contrast with dark background
        return `hsl(${h}, ${s}%, ${l}%)`;
    };

    // Helper to darken a hex or hsl color
    function darkenColor(color, amount = 0.4) {
        // If color is hex
        if (color.startsWith('#')) {
            let r = parseInt(color.slice(1, 3), 16);
            let g = parseInt(color.slice(3, 5), 16);
            let b = parseInt(color.slice(5, 7), 16);
            r = Math.floor(r * (1 - amount));
            g = Math.floor(g * (1 - amount));
            b = Math.floor(b * (1 - amount));
            return `rgb(${r}, ${g}, ${b})`;
        }
        // If color is hsl
        if (color.startsWith('hsl')) {
            const hsl = color.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
            if (hsl) {
                let h = hsl[1], s = hsl[2], l = hsl[3];
                l = Math.max(0, l - 30);
                return `hsl(${h}, ${s}%, ${l}%)`;
            }
        }
        return color;
    }

    // --- Color Palette for Groups (20 visually distinct light colors) ---
    const GROUP_COLORS = [
      '#FFEB99', '#B2F7EF', '#FFD6E0', '#D0F4DE', '#F6DFEB', '#E4C1F9', '#C1F9E4', '#F9F7C1', '#F9E4C1', '#C1D6F9',
      '#F9C1C1', '#C1F9F6', '#F6F9C1', '#C1F6F9', '#F9C1E4', '#E4F9C1', '#C1E4F9', '#F9C1D6', '#D6F9C1', '#C1F9D6'
    ];

    // --- Hash function to assign a unique color index to each group name ---
    function hashGroupName(name) {
      // Simple hash: djb2
      let hash = 5381;
      for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) + hash) + name.charCodeAt(i);
      }
      return Math.abs(hash);
    }

    // --- Get unique color for each group, ensuring no repeats on the page ---
    function getGroupColor(name, usedColors) {
      let idx = hashGroupName(name) % GROUP_COLORS.length;
      // If color is already used, find next available
      let tries = 0;
      while (usedColors.has(idx) && tries < GROUP_COLORS.length) {
        idx = (idx + 1) % GROUP_COLORS.length;
        tries++;
      }
      usedColors.add(idx);
      return GROUP_COLORS[idx];
    }

    // --- Emoji Palette for Keywords (30 visually distinct emojis) ---
    const KEYWORD_EMOJIS = [
      '🌟','🔥','💡','🎯','🚀','✨','🧠','📌','🔑','🎉','📝','📚','💎','🧩','🎵','🎬','🎮','📷','🌈','🍀','🍕','🍔','🍦','🍩','🍉','🍎','🍓','🍒','🍇','🍊'
    ];

    // --- Hash function to assign a unique emoji index to each keyword ---
    function hashKeywordText(text) {
      let hash = 5381;
      for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash) + text.charCodeAt(i);
      }
      return Math.abs(hash);
    }

    function getKeywordEmoji(text) {
      const index = hashKeywordText(text) % KEYWORD_EMOJIS.length;
      return KEYWORD_EMOJIS[index];
    }

    // Helper to get favicon img HTML or fallback emoji for a URL
    function getFaviconOrEmoji(keyword, emoji) {
        let isUrl = false;
        let url = '';
        let host = '';
        try {
            let testUrl = keyword;
            if (!/^https?:\/\//i.test(testUrl)) {
                testUrl = 'https://' + testUrl;
            }
            const parsed = new URL(testUrl);
            if (parsed.hostname && parsed.hostname.includes('.')) {
                isUrl = true;
                url = parsed.href;
                host = parsed.hostname.replace(/^www\./, '');
            }
        } catch (e) {}
        if (isUrl) {
            // Use Google's favicon service with sz=64 for high quality, fallback to 😎 on error
            return `<img src='https://www.google.com/s2/favicons?sz=64&domain=${host}' class='keyword-favicon' loading='lazy' decoding='async' onerror="this.style.display='none';this.nextElementSibling.style.display='inline';">` +
                   `<span class='keyword-fallback-emoji' style='display:none;'>😎</span>`;
        } else {
            return `<span class='keyword-emoji'>${emoji}</span>`;
        }
    }

    // GROUP CRUD
    const openGroupModal = (mode, index = null) => {
        groupModalMode = mode;
        currentGroupIndex = index;
        groupModalTitle.textContent = mode === 'add' ? 'Create New Group' : 'Rename Group';
        groupNameInput.value = mode === 'edit' ? groups[index].name : '';
        toggleModal(groupModal, true);
        groupNameInput.focus();
    };

    const saveGroup = () => {
        const newName = groupNameInput.value.trim();
        if (!newName) {
            alert('Group name cannot be empty.');
            return;
        }
        if (groupModalMode === 'add') {
            groups.push({ name: newName, keywords: [] });
            showToast('Group created!');
        } else {
            groups[currentGroupIndex].name = newName;
            showToast('Group renamed!');
        }
        
        // Save to cloud immediately
        if (currentUser) {
            saveUserData(currentUser.uid, groups).then(() => {
                console.log('Group saved to cloud successfully');
            }).catch(error => {
                console.error('Failed to save group to cloud:', error);
            });
        }
        
        renderGroups();
        toggleModal(groupModal, false);
    };

    // Add event listener for Enter key on groupNameInput
    groupNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveGroup();
        }
    });

    const deleteGroup = (index) => {
        if (confirm(`Are you sure you want to delete the group "${groups[index].name}"?`)) {
            groups.splice(index, 1);
            
            // Save to cloud immediately
            if (currentUser) {
                saveUserData(currentUser.uid, groups).then(() => {
                    console.log('Group deleted from cloud successfully');
                }).catch(error => {
                    console.error('Failed to delete group from cloud:', error);
                });
            }
            
            renderGroups();
            showToast('Group deleted!');
        }
    };

    // KEYWORD CRUD
    const openKeywordModal = (index) => {
        currentGroupIndex = index;
        keywordModalTitle.textContent = groups[index].name;
        // Set modal background to group color
        const usedColors = new Set();
        for (let i = 0; i < groups.length; i++) {
            if (i === index) break;
            getGroupColor(groups[i].name, usedColors);
        }
        const groupColor = getGroupColor(groups[index].name, usedColors);
        const modalContent = keywordModal.querySelector('.modal-content');
        if (document.body.dataset.theme === 'dark') {
            modalContent.style.background = darkenColor(groupColor, 0.6);
            modalContent.style.backdropFilter = 'blur(16px)';
            modalContent.style.webkitBackdropFilter = 'blur(16px)';
        } else {
            modalContent.style.background = groupColor;
            modalContent.style.backdropFilter = '';
            modalContent.style.webkitBackdropFilter = '';
        }
        modalContent.style.color = '#222';
        // Always hide the add keyword bar and clear input when opening the modal
        keywordAddInputContainer.classList.add('hidden');
        keywordInput.value = '';
        renderKeywords();
        toggleModal(keywordModal, true);
    };

    const addKeyword = () => {
        const newKeyword = keywordInput.value.trim();
        if (newKeyword) {
            groups[currentGroupIndex].keywords.push(newKeyword);
            keywordInput.value = '';
            
            // Save to cloud immediately
            if (currentUser) {
                saveUserData(currentUser.uid, groups).then(() => {
                    console.log('Keyword added to cloud successfully');
                }).catch(error => {
                    console.error('Failed to add keyword to cloud:', error);
                });
            }
            
            renderKeywords();
            renderGroups(); // Live update on the home screen
            showToast('Keyword added!');
            keywordAddInputContainer.classList.add('hidden'); // Hide input after adding
        }
    };

    const editKeyword = (keywordIndex) => {
        const currentKeyword = groups[currentGroupIndex].keywords[keywordIndex];
        const newKeyword = prompt('Enter the new keyword:', currentKeyword);
        if (newKeyword && newKeyword.trim() !== '') {
            groups[currentGroupIndex].keywords[keywordIndex] = newKeyword.trim();
            
            // Save to cloud immediately
            if (currentUser) {
                saveUserData(currentUser.uid, groups).then(() => {
                    console.log('Keyword updated in cloud successfully');
                }).catch(error => {
                    console.error('Failed to update keyword in cloud:', error);
                });
            }
            
            renderKeywords();
            renderGroups(); // Live update on the home screen
            showToast('Keyword updated!');
        }
    };

    const deleteKeyword = (keywordIndex) => {
        groups[currentGroupIndex].keywords.splice(keywordIndex, 1);
        
        // Save to cloud immediately
        if (currentUser) {
            saveUserData(currentUser.uid, groups).then(() => {
                console.log('Keyword deleted from cloud successfully');
            }).catch(error => {
                console.error('Failed to delete keyword from cloud:', error);
            });
        }
        
        renderKeywords();
        renderGroups(); // Live update on the home screen
        showToast('Keyword deleted!');
    };

    // --- Render Functions ---
    const renderKeywords = () => {
        keywordList.innerHTML = '';
        const keywords = groups[currentGroupIndex].keywords;
        if (keywords.length === 0) {
            keywordList.innerHTML = `<p style='color:#888; text-align:center;'>No keywords yet. Add one above.</p>`;
            return;
        }

        const ol = document.createElement('ol'); // Use ordered list
        keywords.forEach((keyword, index) => {
            // Check if keyword is a URL
            let isUrl = false;
            let url = '';
            let displayText = keyword;
            try {
                // Add protocol if missing for parsing
                let testUrl = keyword;
                if (!/^https?:\/\//i.test(testUrl)) {
                    testUrl = 'https://' + testUrl;
                }
                const parsed = new URL(testUrl);
                if (parsed.hostname && parsed.hostname.includes('.')) {
                    isUrl = true;
                    url = parsed.href;
                    // Use a mapping for common sites, else prettify domain
                    const domainMap = {
                        'youtube.com': 'YouTube',
                        'www.youtube.com': 'YouTube',
                        'facebook.com': 'Facebook',
                        'www.facebook.com': 'Facebook',
                        'twitter.com': 'Twitter',
                        'www.twitter.com': 'Twitter',
                        'instagram.com': 'Instagram',
                        'www.instagram.com': 'Instagram',
                        'linkedin.com': 'LinkedIn',
                        'www.linkedin.com': 'LinkedIn',
                        'github.com': 'GitHub',
                        'www.github.com': 'GitHub',
                    };
                    const host = parsed.hostname.replace(/^www\./, '');
                    displayText = domainMap[parsed.hostname] || domainMap[host];
                    if (!displayText) {
                        // Remove TLDs like .com, .net, .org, etc.
                        const mainPart = host.split('.')[0];
                        displayText = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
                    }
                }
            } catch (e) {}

            const li = document.createElement('li');
            li.className = 'keyword-item';
            const keywordUnderlineColor = getRandomColor(); // Get a unique random color for each keyword

            // Add emoji to keyword
            const emoji = getKeywordEmoji(keyword);

            li.innerHTML = `
                <span class="keyword-number">${index + 1}.</span>
                ${getFaviconOrEmoji(keyword, emoji)}
                <a href="${isUrl ? url : `https://www.google.com/search?q=${encodeURIComponent(keyword)}`}" target="_blank" rel="noopener" class="keyword-link">${displayText}</a>
                <div>
                    <button class="icon-btn more-options-btn" data-action="more-options" data-keyword-index="${index}">⋮</button>
                </div>
            `;
            // Add click event to li for full-box click
            li.addEventListener('click', (e) => {
                if (e.target.closest('.icon-btn')) return;
                openURLWithBrowser(isUrl ? url : `https://www.google.com/search?q=${encodeURIComponent(keyword)}`);
            });
            ol.appendChild(li);
        });
        keywordList.appendChild(ol); // Append the ordered list
    };

    // --- Render Functions ---
    const renderGroups = () => {
        console.log('Rendering groups...', 'Total groups:', groups.length);
        console.log('Groups data:', JSON.stringify(groups, null, 2));
        
        groupsContainer.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();
        // Store original index for each group before filtering
        const filteredGroups = groups.map((group, idx) => ({ ...group, _originalIndex: idx }))
            .filter(group =>
                group.name.toLowerCase().includes(searchTerm) ||
                group.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
            );
        
        console.log('Filtered groups:', filteredGroups.length);

        // Track used colors for this render
        const usedColors = new Set();

        if (filteredGroups.length === 0) {
            groupsContainer.innerHTML = `<p style="color: #ccc; grid-column: 1 / -1; text-align: center;">No groups found matching your search.</p>`;
        } else {
            filteredGroups.forEach((group) => {
                const originalIndex = group._originalIndex;
                const groupColor = getGroupColor(group.name, usedColors);
                const groupCard = document.createElement('div');
                groupCard.className = 'group-card';
                // Set background color, darken in dark mode only
                if (document.body.dataset.theme === 'dark') {
                    groupCard.style.background = darkenColor(groupColor, 0.6);
                } else {
                    groupCard.style.background = groupColor;
                }
                groupCard.style.color = '#222';

                // --- Group Card Header ---
                const header = document.createElement('div');
                header.className = 'group-card-header';
                const h3 = document.createElement('h3');
                h3.textContent = group.name;
                header.appendChild(h3);

                // --- Group Actions ---
                const actions = document.createElement('div');
                actions.className = 'group-actions';
                // Restore edit and delete buttons
                const editBtn = document.createElement('button');
                editBtn.className = 'icon-btn';
                editBtn.dataset.action = 'edit-group';
                editBtn.dataset.groupIndex = originalIndex;
                editBtn.innerHTML = '<img src="media/rename.png" alt="Edit" style="width:24px;height:24px;">';
                actions.appendChild(editBtn);
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'icon-btn';
                deleteBtn.dataset.action = 'delete-group';
                deleteBtn.dataset.groupIndex = originalIndex;
                deleteBtn.innerHTML = '<img src="media/delete.png" alt="Delete" style="width:24px;height:24px;">';
                actions.appendChild(deleteBtn);
                header.appendChild(actions);
                groupCard.appendChild(header);

                // --- Preview Keywords ---
                const ul = document.createElement('ul');
                const previewKeywords = group.keywords.slice(0, 6); // Show up to 6 keywords
                previewKeywords.forEach((keyword) => {
                    const li = document.createElement('li');
                    const emoji = getKeywordEmoji(keyword);
                    
                    // Check if keyword is a URL
                    let isUrl = false;
                    let url = '';
                    let displayText = keyword;
                    try {
                        let testUrl = keyword;
                        if (!/^https?:\/\//i.test(testUrl)) {
                            testUrl = 'https://' + testUrl;
                        }
                        const parsed = new URL(testUrl);
                        if (parsed.hostname && parsed.hostname.includes('.')) {
                            isUrl = true;
                            url = parsed.href;
                            const domainMap = {
                                'youtube.com': 'YouTube',
                                'www.youtube.com': 'YouTube',
                                'facebook.com': 'Facebook',
                                'www.facebook.com': 'Facebook',
                                'twitter.com': 'Twitter',
                                'www.twitter.com': 'Twitter',
                                'instagram.com': 'Instagram',
                                'www.instagram.com': 'Instagram',
                                'linkedin.com': 'LinkedIn',
                                'www.linkedin.com': 'LinkedIn',
                                'github.com': 'GitHub',
                                'www.github.com': 'GitHub',
                            };
                            const host = parsed.hostname.replace(/^www\./, '');
                            displayText = domainMap[parsed.hostname] || domainMap[host];
                            if (!displayText) {
                                const mainPart = host.split('.')[0];
                                displayText = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
                            }
                        }
                    } catch (e) {}
                    
                    li.innerHTML = getFaviconOrEmoji(keyword, emoji) + ' <span class="keyword-text">' + displayText + '</span>';
                    li.style.cursor = 'default';
                    
                    // Add click event for keyword search - only on text
                    li.addEventListener('click', (e) => {
                        if (e.target.classList.contains('keyword-text')) { // Only trigger if clicking on the keyword text
                            e.stopPropagation(); // Prevent group card click
                            
                            // Add animation class
                            li.classList.add('keyword-clicked');
                            
                            // Search the keyword
                            const searchUrl = isUrl ? url : `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
                            openURLWithBrowser(searchUrl);
                            
                            // Remove animation class after animation completes
                            setTimeout(() => {
                                li.classList.remove('keyword-clicked');
                            }, 500);
                        }
                    });
                    
                    ul.appendChild(li);
                });
                if (group.keywords.length > 6) {
                    const li = document.createElement('li');
                    li.textContent = `...and ${group.keywords.length - 6} more`;
                    ul.appendChild(li);
                }
                groupCard.appendChild(ul);

                // Set group index for event delegation
                groupCard.dataset.groupIndex = originalIndex;
                // Make group card draggable
                groupCard.draggable = true;

                // Add click event to open modal (ignore clicks on action buttons)
                groupCard.addEventListener('click', (e) => {
                    if (e.target.closest('.icon-btn')) return;
                    openKeywordModal(originalIndex);
                });

            groupsContainer.appendChild(groupCard);
        });
        }
    };

    // --- Event Listeners (Delegation) ---
    groupsContainer.addEventListener('click', (e) => {
        const groupCard = e.target.closest('.group-card');
        const actionButton = e.target.closest('.icon-btn');

        if (!groupCard) return; // Not clicking on a group card

        const groupIndex = parseInt(groupCard.dataset.groupIndex);

        if (actionButton) {
            const action = actionButton.dataset.action;
            if (action === 'edit-group') {
                openGroupModal('edit', groupIndex);
            } else if (action === 'delete-group') {
                deleteGroup(groupIndex);
            }
        } else {
            // If it's not an action button, and it's on the group card, open keyword modal
            openKeywordModal(groupIndex);
        }
    });

    keywordList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const keywordIndex = parseInt(button.dataset.keywordIndex); // Parse to integer
        if (action === 'edit-keyword') editKeyword(keywordIndex);
        if (action === 'delete-keyword') deleteKeyword(keywordIndex);
        if (action === 'more-options') {
            const button = e.target.closest('.more-options-btn');
            showKeywordContextMenu(button, keywordIndex);
        }
    });

    // Close context menu when clicking anywhere else
    document.addEventListener('click', (e) => {
        if (activeContextMenu && !activeContextMenu.contains(e.target) && !e.target.closest('.more-options-btn')) {
            activeContextMenu.remove();
            activeContextMenu = null;
        }
    });

    // Function to show keyword context menu
    const showKeywordContextMenu = (button, keywordIndex) => {
        // Close any existing menu
        if (activeContextMenu) {
            activeContextMenu.remove();
            activeContextMenu = null;
        }

        const menu = document.createElement('div');
        menu.className = 'keyword-context-menu';
        menu.dataset.keywordIndex = keywordIndex; // Store index on the menu itself

        const renameBtn = document.createElement('button');
        renameBtn.textContent = 'Rename';
        renameBtn.addEventListener('click', () => {
            editKeyword(keywordIndex);
            menu.remove();
            activeContextMenu = null;
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            deleteKeyword(keywordIndex);
            menu.remove();
            activeContextMenu = null;
        });

        menu.appendChild(renameBtn);
        menu.appendChild(deleteBtn);

        // Position the menu
        const rect = button.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;
        menu.style.zIndex = '301'; // Above modals

        document.body.appendChild(menu);
        activeContextMenu = menu;
    };

    // Drag and Drop Event Listeners
    groupsContainer.addEventListener('dragstart', (e) => {
        const draggedCard = e.target.closest('.group-card');
        if (draggedCard) {
            draggedItemIndex = parseInt(draggedCard.dataset.groupIndex);
            e.dataTransfer.effectAllowed = 'move';
            draggedCard.classList.add('dragging'); // Add class for visual feedback
        }
    });

    groupsContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
        const dropTarget = e.target.closest('.group-card');
        if (dropTarget && draggedItemIndex !== null && !document.body.classList.contains('is-touch')) {
            const dropTargetIndex = parseInt(dropTarget.dataset.groupIndex);
            if (dropTargetIndex !== draggedItemIndex) {
                // Add a class to indicate a potential drop target
                dropTarget.classList.add('drag-over');
            }
        }
    });

    groupsContainer.addEventListener('dragleave', (e) => {
        const dropTarget = e.target.closest('.group-card');
        if (dropTarget) {
            dropTarget.classList.remove('drag-over');
        }
    });

    groupsContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropTarget = e.target.closest('.group-card');
        if (dropTarget && draggedItemIndex !== null && !document.body.classList.contains('is-touch')) {
            const dropTargetIndex = parseInt(dropTarget.dataset.groupIndex);
            dropTarget.classList.remove('drag-over');

            if (draggedItemIndex !== dropTargetIndex) {
                const [draggedGroup] = groups.splice(draggedItemIndex, 1);
                groups.splice(dropTargetIndex, 0, draggedGroup);
                syncAndSaveGroups(); // Save the new order
                renderGroups(); // Re-render to reflect new order
            }
        }
        draggedItemIndex = null; // Reset dragged item index
    });

    groupsContainer.addEventListener('dragend', (e) => {
        const draggedCard = e.target.closest('.group-card');
        if (draggedCard && !document.body.classList.contains('is-touch')) {
            draggedCard.classList.remove('dragging');
        }
        draggedItemIndex = null; // Reset in case of cancelled drag
    });

    // --- Direct Event Listeners ---
    addFab.addEventListener('click', () => openGroupModal('add'));
    cancelGroupBtn.addEventListener('click', () => toggleModal(groupModal, false));
    saveGroupBtn.addEventListener('click', saveGroup);

    // New Keyword Add Trigger (Modal FAB)
    addKeywordModalFab.addEventListener('click', () => {
        keywordAddInputContainer.classList.remove('hidden');
        keywordInput.focus();
    });

    addKeywordBtn.addEventListener('click', addKeyword);
    keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addKeyword();
    });
    closeKeywordModalBtn.addEventListener('click', () => {
        toggleModal(keywordModal, false);
        keywordAddInputContainer.classList.add('hidden'); // Ensure input is hidden on modal close
    });

    // Theme Toggle Event Listener
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
    
    // Force perfect circle shape for theme toggle button
    themeToggleBtn.style.borderRadius = '50%';
    themeToggleBtn.style.webkitBorderRadius = '50%';
    themeToggleBtn.style.mozBorderRadius = '50%';
    themeToggleBtn.style.width = '44px';
    themeToggleBtn.style.height = '44px';
    themeToggleBtn.style.padding = '0';
    themeToggleBtn.style.display = 'flex';
    themeToggleBtn.style.alignItems = 'center';
    themeToggleBtn.style.justifyContent = 'center';
    themeToggleBtn.style.minWidth = '44px';
    themeToggleBtn.style.minHeight = '44px';
    themeToggleBtn.style.maxWidth = '44px';
    themeToggleBtn.style.maxHeight = '44px';

    // Export/Import Event Listeners
    exportBtn.addEventListener('click', exportGroups);
    importBtn.addEventListener('click', () => {
        try {
            importFileInput.value = '';
            importFileInput.click();
        } catch (e) {
            showToast('Import not supported on this device/browser.');
        }
    });
    importFileInput.addEventListener('change', (event) => {
        if (!event.target.files || !event.target.files[0]) {
            showToast('No file selected.');
            return;
        }
        importGroups(event);
    });
    
    // Cache Management Event Listener
    cacheBtn.addEventListener('click', () => {
        const options = [
            '📱 Load from Cache',
            '☁️ Sync with Cloud',
            '🗑️ Clear Cache',
            '📊 Cache Status'
        ];
        
        const choice = prompt(`Cache Management:\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nEnter number (1-4):`);
        
        switch(choice) {
            case '1':
                loadFromCache().then(cachedData => {
                    if (cachedData) {
                        groups = cachedData;
                        renderGroups();
                        showToast('📱 Loaded from cache!', 3000);
                    } else {
                        showToast('❌ No cache found', 3000);
                    }
                });
                break;
            case '2':
                if (currentUser) {
                    showToast('🔄 Syncing with cloud...', 2000);
                    loadDataWithCache().then(() => {
                        showToast('✅ Sync completed!', 3000);
                    });
                } else {
                    showToast('⚠️ Please login first', 3000);
                }
                break;
            case '3':
                if (confirm('Are you sure you want to clear cache?')) {
                    clearCache();
                    showToast('🗑️ Cache cleared!', 3000);
                }
                break;
            case '4':
                loadFromCache().then(cachedData => {
                    if (cachedData) {
                        const cacheInfo = JSON.parse(localStorage.getItem(CACHE_KEY));
                        const age = Math.floor((Date.now() - cacheInfo.timestamp) / (1000 * 60 * 60 * 24));
                        alert(`Cache Status:\n\n📊 Version: ${cacheInfo.version}\n📅 Age: ${age} days\n📝 Groups: ${cachedData.length}\n📱 Keywords: ${cachedData.reduce((sum, group) => sum + group.keywords.length, 0)}`);
                    } else {
                        alert('Cache Status:\n\n❌ No cache found');
                    }
                });
                break;
            default:
                showToast('❌ Invalid choice', 2000);
        }
    });

    // Search Event Listener
    searchInput.addEventListener('input', () => {
        if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            renderGroups();
        }, 120);
    });

    // --- Initial Render ---
    console.log('Initializing app...');
    
    // Show default groups initially
    groups = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
    renderGroups();
    
    // Set theme
    const savedTheme = localStorage.getItem('websiteSaverTheme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme('light'); // Default to light theme if no preference saved
    }

    // PWA Installation Variables
    let deferredPrompt;
    let selectedBrowser = localStorage.getItem('preferredBrowser') || 'default';

    // PWA Installation Logic
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button in header
        const installBtn = document.createElement('button');
        installBtn.id = 'install-pwa-btn';
        installBtn.className = 'btn holo-btn';
        installBtn.innerHTML = '📱 Install App';
        installBtn.style.display = 'inline-block';
        
        // Insert before login button
        const loginBtn = document.getElementById('login-btn');
        loginBtn.parentNode.insertBefore(installBtn, loginBtn);
        
        installBtn.addEventListener('click', () => {
            showPWAInstallPrompt();
        });
    });

    // PWA Installation Prompt
    function showPWAInstallPrompt() {
        const prompt = document.getElementById('pwa-install-prompt');
        prompt.style.display = 'flex';
        
        document.getElementById('pwa-install-btn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    showToast('WebsiteOrganiser installed successfully! 🎉');
                    hidePWAInstallPrompt();
                    deferredPrompt = null;
                }
            }
        });
        
        document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
            hidePWAInstallPrompt();
        });
    }

    function hidePWAInstallPrompt() {
        const prompt = document.getElementById('pwa-install-prompt');
        prompt.style.display = 'none';
    }

    // Enhanced URL opening with browser preference
    function openURLWithBrowser(url) {
        // Use noopener for security and performance
        const w = window.open(url, '_blank', 'noopener');
        if (w) { try { w.opener = null; } catch(e) {} }
    }

    // On touch devices, disable HTML5 drag-and-drop to prevent jank while scrolling
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('is-touch');
        groupsContainer.addEventListener('touchstart', () => {}, { passive: true });
    }

    // PWA Installation Status Check
    window.addEventListener('load', () => {
        // Check if app is installed
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            showPWAStatus('App is installed! 🎉', 'installed');
        }
    });

    function showPWAStatus(message, className = '') {
        const status = document.createElement('div');
        status.className = `pwa-status ${className}`;
        status.textContent = message;
        document.body.appendChild(status);
        
        setTimeout(() => {
            status.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            status.classList.remove('show');
            setTimeout(() => {
                status.remove();
            }, 300);
        }, 3000);
    }

    // Debug function to check current state
    window.debugWebsiteOrganiser = () => {
        console.log('=== WEBSITE ORGANISER DEBUG ===');
        console.log('Current user:', currentUser ? currentUser.uid : 'None');
        console.log('Groups in memory:', groups);
        console.log('Groups length:', groups.length);
        console.log('LocalStorage groups:', localStorage.getItem('websiteSaverGroups'));
        console.log('========================');
    };

    // --- Cache Management Functions ---
    const CACHE_KEY = 'websiteSaverCache';
    const CACHE_VERSION = 'v1.2';
    
    // Enhanced cache functions
    async function saveToCache(data) {
        try {
            const cacheData = {
                version: CACHE_VERSION,
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            console.log('Data saved to cache successfully');
        } catch (error) {
            console.error('Failed to save to cache:', error);
        }
    }
    
    async function loadFromCache() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;
            
            const cacheData = JSON.parse(cached);
            
            // Check if cache is valid (not older than 7 days)
            const cacheAge = Date.now() - cacheData.timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            if (cacheAge > maxAge) {
                console.log('Cache expired, clearing...');
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            
            console.log('Loading data from cache...');
            return cacheData.data;
        } catch (error) {
            console.error('Failed to load from cache:', error);
            return null;
        }
    }
    
    async function clearCache() {
        try {
            localStorage.removeItem(CACHE_KEY);
            console.log('Cache cleared successfully');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }
    
    // Enhanced data loading with cache-first approach
    async function loadDataWithCache() {
        console.log('Loading data with cache-first approach...');
        
        // First, try to load from cache
        const cachedData = await loadFromCache();
        if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
            groups = cachedData;
            renderGroups();
            showToast('📱 Loaded from cache', 2000);
        }
        
        // Then, if user is logged in, try to sync with cloud
        if (currentUser) {
            try {
                const doc = await db.collection('users').doc(currentUser.uid).get();
                if (doc.exists && doc.data().groups && Array.isArray(doc.data().groups)) {
                    const cloudData = doc.data().groups;
                    
                    // Compare cache with cloud data
                    if (JSON.stringify(cachedData) !== JSON.stringify(cloudData)) {
                        groups = cloudData;
                        await saveToCache(cloudData);
                        renderGroups();
                        showToast('☁️ Synced with cloud', 2000);
                    }
                }
            } catch (error) {
                console.error('Cloud sync failed:', error);
                showToast('⚠️ Cloud sync failed, using cache', 3000);
            }
        }
    }

});
