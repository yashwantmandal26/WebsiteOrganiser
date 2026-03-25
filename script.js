// Global error handler for debugging
window.onerror = function (msg, url, lineNo, columnNo, error) {
    const string = msg.toLowerCase();
    const substring = "script error";
    if (string.indexOf(substring) > -1) {
        showToast('Script Error: See Console for Details', 5000);
    } else {
        const message = [
            'Message: ' + msg,
            'Line: ' + lineNo,
            'Column: ' + columnNo,
            'Error object: ' + JSON.stringify(error)
        ].join(' - ');
        // Ensure showToast exists or fallback
        if (typeof showToast === 'function') {
            showToast('⚠️ Error: ' + msg, 5000);
        } else {
            console.error(message);
        }
    }
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Dynamic Header Height Adjustment ---
    // Automatically adjust body padding to prevent content from hiding behind the fixed header
    const headerEl = document.querySelector('header');
    if (headerEl) {
        const updateBodyPadding = () => {
            const headerHeight = headerEl.offsetHeight;
            document.body.style.paddingTop = headerHeight + 'px';
        };
        // Use ResizeObserver for real-time header size changes
        if (typeof ResizeObserver !== 'undefined') {
            const headerObserver = new ResizeObserver(updateBodyPadding);
            headerObserver.observe(headerEl);
        }
        // Also update on window resize and load
        window.addEventListener('resize', updateBodyPadding);
        window.addEventListener('load', updateBodyPadding);
        // Initial call
        updateBodyPadding();
    }

    // --- Audio Feedback System (V2) ---
    let audioContext = null;
    let hoverSoundEnabled = true;
    let audioUnlocked = false;

    // Create audio context
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        hoverSoundEnabled = false;
    }

    // Pre-generate sounds as WAV data URIs
    const _buildWavURI = (frequency, duration, decay) => {
        try {
            const sampleRate = 22050;
            const numSamples = Math.floor(sampleRate * duration);
            const buf = new ArrayBuffer(44 + numSamples * 2);
            const v = new DataView(buf);
            const ws = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
            ws(0, 'RIFF'); v.setUint32(4, 36 + numSamples * 2, true);
            ws(8, 'WAVE'); ws(12, 'fmt ');
            v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
            v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
            v.setUint16(32, 2, true); v.setUint16(34, 16, true);
            ws(36, 'data'); v.setUint32(40, numSamples * 2, true);
            for (let i = 0; i < numSamples; i++) {
                const t = i / sampleRate;
                const env = Math.exp(-t * decay);
                const sample = env * Math.sin(2 * Math.PI * frequency * t);
                v.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.floor(sample * 28000))), true);
            }
            const bytes = new Uint8Array(buf);
            let bin = '';
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            return 'data:audio/wav;base64,' + btoa(bin);
        } catch (e) { return null; }
    };

    const _clickSoundURI = _buildWavURI(1200, 0.06, 70);
    const _hoverSoundURI = _buildWavURI(800, 0.08, 60);
    const _silentSoundURI = _buildWavURI(1, 0.01, 100); // Silent 1Hz tone for unlocking

    // Reusable Audio objects
    const hoverAudio = _hoverSoundURI ? new Audio(_hoverSoundURI) : null;
    const clickAudio = _clickSoundURI ? new Audio(_clickSoundURI) : null;
    const unlockAudioObj = _silentSoundURI ? new Audio(_silentSoundURI) : null;

    if (hoverAudio) hoverAudio.volume = 0.35;
    if (clickAudio) clickAudio.volume = 0.55;

    // Aggressive Audio Unlock Function
    const unlockAudio = async () => {
        if (audioUnlocked) return true;

        try {
            // Try to resume AudioContext
            if (audioContext && audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Try to play a silent sound (HTML5 Audio)
            if (unlockAudioObj) {
                await unlockAudioObj.play();
            }

            audioUnlocked = true;
            console.log('Audio system unlocked successfully');
            return true;
        } catch (e) {
            // Still blocked by browser policy
            return false;
        }
    };

    // Unlock on any major interaction
    ['click', 'touchstart', 'keydown', 'mousedown', 'wheel'].forEach(event => {
        document.addEventListener(event, unlockAudio, { once: true, passive: true });
    });

    // Also try to unlock on every mouse movement until successful
    const unlockOnMove = async () => {
        if (audioUnlocked) {
            document.removeEventListener('mousemove', unlockOnMove);
            return;
        }
        await unlockAudio();
    };
    document.addEventListener('mousemove', unlockOnMove, { passive: true });

    // Play hover sound
    const playHoverSound = () => {
        if (!hoverSoundEnabled || !hoverAudio) return;

        // Try to play directly
        hoverAudio.currentTime = 0;
        hoverAudio.play().catch(() => {
            // If failed, try to unlock again
            unlockAudio();
        });
    };

    // Play click sound
    const playClickSound = () => {
        if (!clickAudio) return;
        clickAudio.currentTime = 0;
        clickAudio.play().catch(() => {
            unlockAudio();
        });
    };

    // Detect if device is desktop
    const isDesktop = () => {
        return window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches;
    };

    // Add hover sound to keyword elements
    const addKeywordHoverSound = (element) => {
        if (!isDesktop()) return;

        element.addEventListener('mouseenter', () => {
            playHoverSound();
            // Also try to unlock on hover (some browsers consider hover a weak interaction)
            if (!audioUnlocked) unlockAudio();
        }, { passive: true });
    };

    // Logo click clears cache and triggers hard reload from server
    const logoLink = document.querySelector('.site-logo-link');
    if (logoLink) {
        logoLink.addEventListener('click', async function (e) {
            e.preventDefault();

            // Clear all caches
            if ('caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                    console.log('All caches cleared');
                } catch (err) {
                    console.error('Error clearing caches:', err);
                }
            }

            // Clear service worker cache and reload from server
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                    });
                });
            }

            // Force reload from server (bypass cache)
            window.location.href = window.location.href + '?nocache=' + Date.now();
        });
    }
    // --- DOM Elements ---
    const groupsContainer = document.getElementById('groups-container');
    const addFab = document.getElementById('add-fab');

    // Theme Toggle Button
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const adminBtn = document.getElementById('admin-btn');
    const viewToggleBtn = document.getElementById('view-toggle-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');

    // Admin Login Modal Elements
    const adminModal = document.getElementById('admin-modal');
    const adminIdInput = document.getElementById('admin-id-input');
    const adminPasswordInput = document.getElementById('admin-password-input');
    const adminErrorMsg = document.getElementById('admin-error-msg');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminCancelBtn = document.getElementById('admin-cancel-btn');

    // Rename Keyword Modal Elements
    const renameModal = document.getElementById('rename-modal');
    const renameKeywordInput = document.getElementById('rename-keyword-input');
    const renameKeywordDescInput = document.getElementById('rename-keyword-desc-input');
    const renameSaveBtn = document.getElementById('rename-save-btn');
    const renameCancelBtn = document.getElementById('rename-cancel-btn');
    let renameTargetGroupIndex = null;
    let renameTargetKeywordIndex = null;

    // Add Keyword Modal Elements
    const addKeywordModal = document.getElementById('add-keyword-modal');
    const addKeywordInput = document.getElementById('add-keyword-input');
    const addKeywordDescInput = document.getElementById('add-keyword-desc-input');
    const addKeywordSaveBtn = document.getElementById('add-keyword-save-btn');
    const addKeywordCancelBtn = document.getElementById('add-keyword-cancel-btn');
    let addKeywordTargetGroupIndex = null;

    // Group Modal Elements
    const groupModal = document.getElementById('group-modal');
    const groupModalTitle = document.getElementById('group-modal-title');
    const groupNameInput = document.getElementById('group-name-input');
    const saveGroupBtn = document.getElementById('save-group-btn');
    const cancelGroupBtn = document.getElementById('cancel-group-btn');

    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    // Loading Overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    const headerSpinner = document.getElementById('header-spinner');

    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
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
    let globalClickCounts = {}; // Global keyword click counts
    let keywordDescriptions = {}; // Global keyword descriptions
    let currentGroupIndex = null; // To track which group is being edited
    let groupModalMode = 'add'; // 'add' or 'edit'
    let draggedItemIndex = null; // To track the index of the dragged group
    let adminLoggedIn = false;
    let viewMode = 'grid';
    let lastAddedKeyword = null;
    let lastAddedGroupIndex = null;

    // Keyword drag-and-drop state
    let draggedKeywordData = null; // { groupIndex, keywordIndex, keyword }

    // --- Adult Content Filter ---
    const BLOCKED_WORDS = [
        'porn', 'xxx', 'sex', 'nude', 'naked', 'adult', 'nsfw', 'hentai',
        'xvideos', 'pornhub', 'xnxx', 'xhamster', 'redtube', 'youporn',
        'brazzers', 'onlyfans', 'chaturbate', 'livejasmin', 'stripchat',
        'cam4', 'bongacams', 'myfreecams', 'fapello', 'thothub',
        'erotic', 'fetish', 'bondage', 'bdsm', 'milf', 'teen',
        'anal', 'blowjob', 'handjob', 'creampie', 'gangbang',
        'lesbian', 'gay', 'tranny', 'shemale', 'escort', 'hooker',
        'prostitute', 'camgirl', 'camboy', 'onlyfan', 'fansly'
    ];

    function containsBlockedContent(text) {
        if (!text) return false;
        const lowerText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        return BLOCKED_WORDS.some(word => lowerText.includes(word.replace(/[^a-z0-9]/g, '')));
    }

    function updateAdminButton() {
        if (!adminBtn) return;
        adminBtn.textContent = adminLoggedIn ? 'Admin Logout' : 'Admin Login';

        // Show/hide admin-only buttons (Import/Export)
        const adminOnlyButtons = document.querySelectorAll('.admin-only');
        adminOnlyButtons.forEach(btn => {
            btn.style.display = adminLoggedIn ? 'inline-flex' : 'none';
        });
    }

    function updateViewToggleButton() {
        if (!viewToggleBtn) return;
        viewToggleBtn.textContent = viewMode === 'grid' ? 'List View' : 'Grid View';
    }

    function setViewMode(mode) {
        const previousMode = viewMode;
        viewMode = mode;
        document.body.dataset.keywordView = mode;
        updateViewToggleButton();
        if (previousMode === mode) {
            return;
        }
        renderGroups();
    }

    // Default groups for new users
    const DEFAULT_GROUPS = [
        {
            "keywords": [
                "HdMovies2",
                "Netmirror",
                "hhdmovies.beauty",
                "MultiMovies",
                "moonflix.in"
            ],
            "name": "Streaming_MovieSites"
        },
        {
            "keywords": [
                "https://katworld.net/",
                "world4ufree",
                "https://hdhub4u.gs/",
                "VEGAMOVIES",
                "ExtraMoviez",
                "UHDMovies"
            ],
            "name": "Download_MovieSites"
        },
        {
            "keywords": [
                "Deadshot.io",
                "https://skribbl.io/",
                "Slither.io",
                "Surviv.io",
                "https://neal.fun/",
                "https://www.crazygames.com/game/stunt-paradise",
                "https://slowroads.io/"
            ],
            "name": "Browser_Games"
        },
        {
            "name": "Popular Sites",
            "keywords": [
                "www.youtube.com",
                "https://www.flipkart.com/",
                "https://www.amazon.in/",
                "https://www.whatsapp.com/",
                "https://www.reddit.com/",
                "https://www.linkedin.com/",
                "https://www.facebook.com/"
            ]
        },
        {
            "name": "Life_Hacks",
            "keywords": [
                "https://temp-mail.org/en/",
                "https://10015.io/"
            ]
        },
        {
            "keywords": [
                "https://steamrip.com/",
                "Dodi-repacks",
                "fitgirl-repacks.site",
                "https://www.apunkagames.com/",
                "https://oceansofgamess.com/",
                "https://steamgg.net/"
            ],
            "name": "PC_Game_Websites"
        }
    ];

    // --- Firestore Cloud Sync Functions ---
    const groupsRef = db.collection('sharedData').doc('groups');
    const clickCountsRef = db.collection('sharedData').doc('clickCounts');
    const descriptionsRef = db.collection('sharedData').doc('keywordDescriptions');
    const LOCAL_STORAGE_KEY = 'websiteorganiser_groups_cache';
    const CLICK_COUNTS_STORAGE_KEY = 'websiteorganiser_clicks_cache';

    // Save to localStorage for offline access
    function saveToLocalStorage() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(groups));
            localStorage.setItem(CLICK_COUNTS_STORAGE_KEY, JSON.stringify(globalClickCounts));
        } catch (e) {
            // localStorage might be full or unavailable
        }
    }

    // Load from localStorage (offline fallback)
    function loadFromLocalStorage() {
        try {
            const cachedGroups = localStorage.getItem(LOCAL_STORAGE_KEY);
            const cachedClicks = localStorage.getItem(CLICK_COUNTS_STORAGE_KEY);
            
            if (cachedClicks) {
                globalClickCounts = JSON.parse(cachedClicks);
            }
            
            if (cachedGroups) {
                return JSON.parse(cachedGroups);
            }
        } catch (e) {
            // localStorage unavailable
        }
        return null;
    }

    async function saveGroups() {
        console.log('saveGroups called, groups count:', groups.length);
        try {
            console.log('Attempting Firestore save...');
            await groupsRef.set({
                data: groups,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Firestore save successful');
            saveToLocalStorage(); // Cache locally for offline
        } catch (error) {
            console.error('Firestore save failed:', error);
            saveToLocalStorage(); // Still save locally even if cloud fails
            // Toast removed
        }
    }

    async function loadGroups() {
        try {
            // Load groups, click counts and descriptions in parallel
            const [groupsDoc, clicksDoc, descriptionsDoc] = await Promise.all([
                groupsRef.get(),
                clickCountsRef.get(),
                descriptionsRef.get()
            ]);

            if (clicksDoc.exists) {
                globalClickCounts = clicksDoc.data() || {};
            }

            if (descriptionsDoc.exists) {
                keywordDescriptions = descriptionsDoc.data() || {};
            }

            if (groupsDoc.exists && groupsDoc.data().data) {
                groups = groupsDoc.data().data;
                
                // Cleanup: remove nested clickCounts from groups array (now handled globally)
                let needsCleanup = false;
                groups.forEach(group => {
                    if (group.clickCounts) {
                        delete group.clickCounts;
                        needsCleanup = true;
                    }
                });
                
                if (needsCleanup && adminLoggedIn) {
                    await saveGroups();
                }

                saveToLocalStorage(); // Cache for offline
            } else {
                groups = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
                await saveGroups();
            }
        } catch (error) {
            // Try to load from localStorage (offline mode)
            const cached = loadFromLocalStorage();
            if (cached && cached.length > 0) {
                groups = cached;
                // Toast removed
            } else {
                groups = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
            }
        }
    }

    // Real-time sync listener
    function setupRealtimeSync() {
        // Listen for groups
        groupsRef.onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data && data.data) {
                    const newGroups = data.data;

                    // Only update if data actually changed (avoid infinite loops)
                    if (JSON.stringify(newGroups) !== JSON.stringify(groups)) {
                        groups = newGroups;
                        renderGroups();
                    }
                }
            }
        }, (error) => {
            // Toast removed
        });

        // Listen for global click counts
        clickCountsRef.onSnapshot((doc) => {
            if (doc.exists) {
                const newClicks = doc.data() || {};
                if (JSON.stringify(newClicks) !== JSON.stringify(globalClickCounts)) {
                    globalClickCounts = newClicks;
                    // Only re-render if we're not currently dragging something
                    if (!draggedKeywordData && draggedItemIndex === null) {
                        renderGroups();
                    }
                }
            }
        });

        // Listen for keyword descriptions
        descriptionsRef.onSnapshot((doc) => {
            if (doc.exists) {
                const newDescriptions = doc.data() || {};
                if (JSON.stringify(newDescriptions) !== JSON.stringify(keywordDescriptions)) {
                    keywordDescriptions = newDescriptions;
                    if (!draggedKeywordData && draggedItemIndex === null) {
                        renderGroups();
                    }
                }
            }
        });
    }

    // --- Data Persistence ---
    // Persist to Firestore cloud
    async function syncAndSaveGroups() {
        await saveGroups();
    }

    // --- Context Menu for Keywords ---
    let contextMenu = null;

    function createContextMenu() {
        if (contextMenu) return contextMenu;

        contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.cssText = `
            position: fixed;
            background: #232323;
            border: 1px solid #444;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.35);
            padding: 8px 0;
            z-index: 10000;
            display: none;
            min-width: 150px;
        `;

        const renameOption = document.createElement('div');
        renameOption.className = 'context-menu-item';
        renameOption.textContent = '✏️ Rename';
        renameOption.style.cssText = `
            padding: 10px 16px;
            cursor: pointer;
            transition: background 0.2s;
            color: #7b2cbf;
            font-weight: 500;
        `;
        renameOption.addEventListener('mouseenter', () => renameOption.style.background = '#2d2d2d');
        renameOption.addEventListener('mouseleave', () => renameOption.style.background = 'transparent');

        const deleteOption = document.createElement('div');
        deleteOption.className = 'context-menu-item';
        deleteOption.textContent = '🗑️ Delete';
        deleteOption.style.cssText = `
            padding: 10px 16px;
            cursor: pointer;
            transition: background 0.2s;
            color: #ff4d4f;
            font-weight: 500;
        `;
        deleteOption.addEventListener('mouseenter', () => deleteOption.style.background = '#2d2d2d');
        deleteOption.addEventListener('mouseleave', () => deleteOption.style.background = 'transparent');

        contextMenu.appendChild(renameOption);
        contextMenu.appendChild(deleteOption);
        document.body.appendChild(contextMenu);

        return contextMenu;
    }

    function showContextMenu(x, y, groupIndex, keywordIndex, keyword) {
        const menu = createContextMenu();
        menu.style.display = 'block';

        // Get menu dimensions after showing
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate safe position (keep menu within viewport)
        let safeX = x;
        let safeY = y;

        // Prevent menu from going off right edge
        if (x + menuRect.width > viewportWidth - 10) {
            safeX = viewportWidth - menuRect.width - 10;
        }
        // Prevent menu from going off left edge
        if (safeX < 10) {
            safeX = 10;
        }
        // Prevent menu from going off bottom edge
        if (y + menuRect.height > viewportHeight - 10) {
            safeY = viewportHeight - menuRect.height - 10;
        }
        // Prevent menu from going off top edge
        if (safeY < 10) {
            safeY = 10;
        }

        menu.style.left = safeX + 'px';
        menu.style.top = safeY + 'px';

        const renameOption = menu.querySelector('.context-menu-item:first-child');
        const deleteOption = menu.querySelector('.context-menu-item:last-child');

        renameOption.onclick = () => {
            hideContextMenu();
            renameKeyword(groupIndex, keywordIndex, keyword);
        };

        deleteOption.onclick = () => {
            hideContextMenu();
            deleteKeyword(groupIndex, keywordIndex);
        };
    }

    function hideContextMenu() {
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }

    // Hide context menu on click anywhere
    document.addEventListener('click', hideContextMenu);
    document.addEventListener('scroll', hideContextMenu);

    async function renameKeyword(groupIndex, keywordIndex, oldKeyword) {
        // Admin check
        if (!adminLoggedIn) {
            alert('Admin access is required to rename keywords.');
            return;
        }
        // Show rename modal instead of prompt
        renameTargetGroupIndex = groupIndex;
        renameTargetKeywordIndex = keywordIndex;
        renameKeywordInput.value = oldKeyword;
        
        // Pre-fill description
        const encodedKeyword = encodeURIComponent(oldKeyword).replace(/\./g, '%2E');
        renameKeywordDescInput.value = keywordDescriptions[encodedKeyword] || '';
        
        toggleModal(renameModal, true);
        renameKeywordInput.focus();
        renameKeywordInput.select();
    }

    // Rename modal save handler (will be connected after toggleModal is defined)
    async function saveRename() {
        // Double-check admin (in case session changed)
        if (!adminLoggedIn) {
            alert('Admin access is required to rename keywords.');
            toggleModal(renameModal, false);
            return;
        }
        const newKeyword = renameKeywordInput.value.trim();
        const newDescription = renameKeywordDescInput.value.trim();
        if (!newKeyword) return;

        // Adult content filter
        if (containsBlockedContent(newKeyword)) {
            showToast('⛔ Inappropriate content not allowed', 3000);
            return;
        }

        const oldKeyword = groups[renameTargetGroupIndex].keywords[renameTargetKeywordIndex];
        const oldEncoded = encodeURIComponent(oldKeyword).replace(/\./g, '%2E');
        const newEncoded = encodeURIComponent(newKeyword).replace(/\./g, '%2E');

        // Handle description update
        if (newKeyword === oldKeyword) {
            // Only update description if name hasn't changed
            await saveKeywordDescription(newKeyword, newDescription);
            toggleModal(renameModal, false);
            renderGroups();
            return;
        }

        groups[renameTargetGroupIndex].keywords[renameTargetKeywordIndex] = newKeyword;

        // Update global click counts and descriptions on rename
        const updateOps = [];
        
        if (globalClickCounts[oldEncoded] !== undefined) {
            const oldCount = globalClickCounts[oldEncoded];
            globalClickCounts[newEncoded] = oldCount;
            delete globalClickCounts[oldEncoded];
            updateOps.push(clickCountsRef.update({
                [newEncoded]: firebase.firestore.FieldValue.increment(oldCount),
                [oldEncoded]: firebase.firestore.FieldValue.delete()
            }));
        }

        // Move/Update description
        keywordDescriptions[newEncoded] = newDescription;
        if (newEncoded !== oldEncoded) {
            delete keywordDescriptions[oldEncoded];
        }
        
        updateOps.push(descriptionsRef.update({
            [newEncoded]: newDescription || firebase.firestore.FieldValue.delete(),
            [oldEncoded]: firebase.firestore.FieldValue.delete()
        }).catch(() => {
            // If newEncoded doesn't exist yet, use set
            return descriptionsRef.set({
                [newEncoded]: newDescription
            }, { merge: true });
        }));

        try {
            await Promise.all(updateOps);
        } catch (error) {
            console.error('Failed to transfer keyword data:', error);
        }

        await syncAndSaveGroups();
        renderGroups();
        toggleModal(renameModal, false);
    }

    async function deleteKeyword(groupIndex, keywordIndex) {
        // Admin check
        if (!adminLoggedIn) {
            alert('Admin access is required to delete keywords.');
            return;
        }
        if (!confirm('Delete this keyword?')) return;

        const keywordToDelete = groups[groupIndex].keywords[keywordIndex];
        groups[groupIndex].keywords.splice(keywordIndex, 1);

        // Check if this keyword exists in any other group before deleting global count
        let existsElsewhere = false;
        for (const group of groups) {
            if (group.keywords.includes(keywordToDelete)) {
                existsElsewhere = true;
                break;
            }
        }

        if (!existsElsewhere) {
            const encodedKeyword = encodeURIComponent(keywordToDelete).replace(/\./g, '%2E');
            try {
                await Promise.all([
                    clickCountsRef.update({
                        [encodedKeyword]: firebase.firestore.FieldValue.delete()
                    }),
                    descriptionsRef.update({
                        [encodedKeyword]: firebase.firestore.FieldValue.delete()
                    })
                ]);
            } catch (error) {
                console.error('Failed to delete global click count or description:', error);
            }
        }

        await syncAndSaveGroups();
        renderGroups();
    }

    async function incrementKeywordClick(groupIndex, keyword) {
        if (!keyword) return;

        // Encode keyword to use as a valid Firestore field name (replaces dots, etc.)
        const encodedKeyword = encodeURIComponent(keyword).replace(/\./g, '%2E');

        // Optimistically update local state for instant feedback
        globalClickCounts[encodedKeyword] = (globalClickCounts[encodedKeyword] || 0) + 1;
        
        // Update specific counter in UI immediately
        const counterEls = document.querySelectorAll(`[data-keyword-value="${keyword.replace(/"/g, '\\"')}"] .keyword-click-counter`);
        counterEls.forEach(el => {
            el.textContent = globalClickCounts[encodedKeyword];
        });

        // Sync to Firestore using atomic increment
        try {
            await clickCountsRef.set({
                [encodedKeyword]: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });
        } catch (error) {
            console.error('Failed to sync global click count:', error);
        }
    }

    async function saveKeywordDescription(keyword, description) {
        if (!keyword) return;
        const encodedKeyword = encodeURIComponent(keyword).replace(/\./g, '%2E');
        
        // Optimistic update
        keywordDescriptions[encodedKeyword] = description;

        try {
            await descriptionsRef.set({
                [encodedKeyword]: description
            }, { merge: true });
        } catch (error) {
            console.error('Failed to save keyword description:', error);
        }
    }

    // --- Functions ---

    const ensureScrollUnlocked = () => {
        const anyModalOpen = document.querySelector('.modal-container.visible');
        if (!anyModalOpen) {
            document.body.classList.remove('modal-open');
            document.documentElement.style.overflowY = 'auto';
            document.body.style.overflowY = 'auto';
        }
    };

    // RE-USABLE MODAL TOGGLE
    const toggleModal = (modal, show) => {
        if (!modal) return;

        if (show) {
            modal.classList.add('visible');
            document.body.classList.add('modal-open');
        } else {
            modal.classList.remove('visible');
            ensureScrollUnlocked();
        }

        requestAnimationFrame(highlightRecentlyAddedKeyword);
    };

    ensureScrollUnlocked();
    window.addEventListener('load', ensureScrollUnlocked);

    // Close modal when clicking outside content
    groupModal.addEventListener('click', (e) => {
        if (e.target === groupModal) {
            toggleModal(groupModal, false);
        }
    });

    // TOAST NOTIFICATIONS
    const showToast = (message, duration = 3000) => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            background: var(--modal-bg, rgba(30, 30, 40, 0.95));
            color: var(--text-color, #fff);
            padding: 12px 20px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            font-size: 0.95rem;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;
        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    // Make showToast globally accessible
    window.showToast = showToast;

    // THEME TOGGLE FUNCTIONALITY
    const THEME_STORAGE_KEY = 'wo-theme';

    const getSavedTheme = () => {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            if (stored === 'dark' || stored === 'light') return stored;
        } catch (e) {
            /* localStorage unavailable */
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    };

    const persistTheme = (theme) => {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (e) {
            /* ignore */
        }
    };

    const setTheme = (theme, { persist = true } = {}) => {
        document.body.dataset.theme = theme;
        if (persist) {
            persistTheme(theme);
        }
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
        const s = Math.floor(Math.random() * (95 - 70) + 70); // Saturation between 70-95 for more vibrant colors
        const l = Math.floor(Math.random() * (55 - 35) + 35); // Lightness between 35-55 for better contrast with dark background
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

    // --- Color Palette for Groups (20 visually distinct vibrant colors) ---
    const GROUP_COLORS = [
        '#FFE066', '#66D9D9', '#FF99C2', '#66E066', '#FF66B8', '#B399E6', '#66E6B3', '#FFD966', '#FF9966', '#6699FF',
        '#FF8080', '#66F0F0', '#FFB366', '#66C9FF', '#FF66B8', '#B3FF66', '#5AA6FF', '#FF66A3', '#B8FF66', '#66FFAA'
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

    // --- Emoji Palette for Keywords (all emojis except face emojis) ---
    const KEYWORD_EMOJIS = [
        // Nature & Animals
        '🌟', '🌈', '🌙', '⭐', '✨', '💫', '☄️', '🌍', '🌎', '🌏', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔',
        '☀️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '☁️', '💨', '❄️', '⚡',
        '🔥', '💧', '💦', '☔', '🌊', '🍀', '🌱', '🌿', '🍃', '🌾', '🌵', '🎋', '🎍', '🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '💐',
        '🦋', '🐛', '🐝', '🐞', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔',
        // Food & Drink
        '🍕', '🍔', '🍟', '🌭', '🍿', '🧈', '🥐', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍤', '🍱', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜',
        '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🧋', '🥤', '🧊', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉',
        '🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🫒', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰',
        // Activities & Sports
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩',
        // Travel & Places  
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🪂', '💺', '🚁', '🛩️', '🛸', '🚀', '🛰️', '🚢', '🛥️', '🛳️', '⛴️', '🚤', '⛵', '⚓', '🪝', '⛽', '🚧', '🚦', '🚥', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩️',
        // Objects
        '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪒', '🧽', '🪣', '🧴', '🧷', '🧶', '🪡', '🧵', '🪢', '🧹', '🎁', '🎀', '🎏', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '📇', '🗂️', '📅', '📆', '🗒️', '🗓️', '📁', '📂', '🗳️', '🗄️', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🪃', '🏹', '🛡️', '🪚', '🔧', '🪛', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧰', '🧲', '🪜',
        // Symbols
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '🟰', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁️‍🗨️', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'
    ];

    const DOMAIN_DISPLAY_MAP = {
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
        'amazon.com': 'Amazon',
        'www.amazon.com': 'Amazon',
        'google.com': 'Google',
        'www.google.com': 'Google',
        'reddit.com': 'Reddit',
        'www.reddit.com': 'Reddit',
        'x.com': 'X',
        'www.x.com': 'X'
    };

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

    // Get all emojis currently in use across all groups
    function getAllUsedEmojis() {
        const usedEmojis = new Set();
        groups.forEach(group => {
            group.keywords.forEach(keyword => {
                const parsed = parseKeyword(keyword);
                // Only check for emojis in display text (non-URL keywords)
                if (!parsed.isUrl) {
                    // Check if the keyword starts with an emoji
                    const emojiMatch = keyword.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
                    if (emojiMatch) {
                        usedEmojis.add(emojiMatch[1]);
                    }
                }
            });
        });
        return usedEmojis;
    }

    // Get available emojis (not currently in use)
    function getAvailableEmojis() {
        const usedEmojis = getAllUsedEmojis();
        return KEYWORD_EMOJIS.filter(emoji => !usedEmojis.has(emoji));
    }

    // Generate unique gradient for keyword based on its hash
    function getKeywordGradient(text) {
        const hash = hashKeywordText(text);

        // Array of 40 unique gradients - high contrast vibrant colors
        const gradients = [
            ['#ff0000', '#cc0000'], // Red
            ['#00ff00', '#00cc00'], // Green
            ['#0000ff', '#0000cc'], // Blue
            ['#ffff00', '#cccc00'], // Yellow
            ['#ff00ff', '#cc00cc'], // Magenta
            ['#00ffff', '#00cccc'], // Cyan
            ['#ff6600', '#cc5200'], // Orange
            ['#6600ff', '#5200cc'], // Purple
            ['#00ff66', '#00cc52'], // Spring Green
            ['#ff0066', '#cc0052'], // Rose
            ['#66ff00', '#52cc00'], // Lime
            ['#0066ff', '#0052cc'], // Blue
            ['#ff3300', '#cc2900'], // Red-Orange
            ['#00ffcc', '#00cca3'], // Turquoise
            ['#cc00ff', '#a300cc'], // Violet
            ['#ffcc00', '#cca300'], // Gold
            ['#00ff99', '#00cc7a'], // Sea Green
            ['#ff0099', '#cc007a'], // Deep Pink
            ['#88ff00', '#6ecc00'], // Chartreuse
            ['#0088ff', '#006ecc'], // Azure
            ['#ff3366', '#cc2952'], // Coral
            ['#00ccff', '#00a3cc'], // Sky Blue
            ['#9900ff', '#7a00cc'], // Purple-Violet
            ['#ffaa00', '#cc8800'], // Amber
            ['#00ff33', '#00cc29'], // Mint
            ['#ff00cc', '#cc00a3'], // Hot Pink
            ['#aaff00', '#88cc00'], // Yellow-Green
            ['#3300ff', '#2900cc'], // Indigo
            ['#ff9900', '#cc7a00'], // Light Orange
            ['#00aaff', '#0088cc'], // Light Blue
            ['#ff6699', '#cc527a'], // Pink
            ['#33ff00', '#29cc00'], // Bright Lime
            ['#8800ff', '#6e00cc'], // Violet-Purple
            ['#ffdd00', '#ccb100'], // Golden Yellow
            ['#0044ff', '#0036cc'], // Royal Blue
            ['#ff5500', '#cc4400'], // Dark Orange
            ['#00ff88', '#00cc6e'], // Aqua Green
            ['#ff1100', '#cc0e00'], // Red-Orange Dark
            ['#ccff00', '#a3cc00'], // Lime-Yellow
            ['#ff0033', '#cc0029'], // Red-Pink
        ];

        const index = hash % gradients.length;
        return gradients[index];
    }

    function normaliseKeywordUrl(keyword) {
        let candidate = keyword.trim();
        if (!/^https?:\/\//i.test(candidate)) {
            candidate = 'https://' + candidate;
        }
        return candidate;
    }

    function parseKeyword(keyword) {
        const trimmed = keyword.trim();
        let displayText = trimmed;
        let targetUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
        let isUrl = false;

        try {
            const normalised = normaliseKeywordUrl(trimmed);
            const parsed = new URL(normalised);
            if (parsed.hostname && parsed.hostname.includes('.')) {
                isUrl = true;
                const host = parsed.hostname.replace(/^www\./, '');
                const mappedName = DOMAIN_DISPLAY_MAP[parsed.hostname] || DOMAIN_DISPLAY_MAP[host];
                if (mappedName) {
                    displayText = mappedName;
                } else {
                    const hostParts = host.split('.');
                    const mainPart = hostParts.length ? hostParts[0] : host;
                    displayText = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
                }
                targetUrl = parsed.href;
            }
        } catch (error) {
            // Keep defaults for non-URL keywords
        }

        return { displayText, targetUrl, isUrl };
    }

    function attachKeywordActivation(triggerElement, url, groupIndex, keyword, highlightTarget = triggerElement) {
        if (!triggerElement) return;

        const activate = (inNewTab = false) => {
            // Click sound feedback
            playClickSound();

            // Vibration feedback for mobile devices
            if (navigator.vibrate) {
                navigator.vibrate(20);
            }

            // Increment click count
            if (keyword) {
                incrementKeywordClick(groupIndex, keyword);
            }

            highlightTarget.classList.add('keyword-clicked');
            openURLWithBrowser(url, inNewTab);
            
            // Force remove focus to prevent sticky hover/zoom on mobile
            if (document.activeElement) {
                document.activeElement.blur();
            }
            if (triggerElement) {
                triggerElement.blur();
            }

            setTimeout(() => {
                highlightTarget.classList.remove('keyword-clicked');
            }, 800);
        };

        triggerElement.setAttribute('role', 'link');
        triggerElement.setAttribute('tabindex', '0');

        triggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            // Check for Ctrl/Meta key to open in new tab
            const inNewTab = event.ctrlKey || event.metaKey;
            activate(inNewTab);
        });

        triggerElement.addEventListener('auxclick', (event) => {
            if (event.button === 1) { // Middle click
                event.preventDefault();
                event.stopPropagation();
                openURLWithBrowser(url, true); // Open in new tab
            }
        });

        triggerElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                activate();
            }
        });
    }

    function attachKeywordContextMenu(element, groupIndex, keywordIndex, keyword, targetUrl) {
        if (!element) return;

        let longPressTimer;
        let touchStartX, touchStartY;
        let isLongPressing = false;

        // Desktop: Right-click
        element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            event.stopPropagation();
            showContextMenu(event.clientX, event.clientY, groupIndex, keywordIndex, keyword);
        });

        // Touch: Long-press with visual feedback
        element.addEventListener('touchstart', (event) => {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
            isLongPressing = false;

            // Add visual feedback class after short delay
            longPressTimer = setTimeout(() => {
                isLongPressing = true;
                element.classList.add('long-press-active');
                // Vibrate on devices that support it
                if (navigator.vibrate) {
                    navigator.vibrate(20);
                }
                showContextMenu(touchStartX, touchStartY, groupIndex, keywordIndex, keyword);
            }, 500);
        }, { passive: true });

        element.addEventListener('touchend', (event) => {
            clearTimeout(longPressTimer);
            element.classList.remove('long-press-active');

            // If we were in long-press mode, prevent the click action
            if (isLongPressing) {
                event.preventDefault();
                isLongPressing = false;
            }
        });

        element.addEventListener('touchmove', (event) => {
            const moveX = Math.abs(event.touches[0].clientX - touchStartX);
            const moveY = Math.abs(event.touches[0].clientY - touchStartY);

            if (moveX > 10 || moveY > 10) {
                clearTimeout(longPressTimer);
                element.classList.remove('long-press-active');
                isLongPressing = false;
            }
        }, { passive: true });

        // Also remove class on touchcancel
        element.addEventListener('touchcancel', () => {
            clearTimeout(longPressTimer);
            element.classList.remove('long-press-active');
            isLongPressing = false;
        });
    }

    function highlightRecentlyAddedKeyword() {
        if (lastAddedKeyword === null || lastAddedGroupIndex === null) {
            return;
        }

        const groupCard = groupsContainer.querySelector(`.group-card[data-group-index="${lastAddedGroupIndex}"]`);
        if (!groupCard) {
            lastAddedKeyword = null;
            lastAddedGroupIndex = null;
            return;
        }

        const candidates = Array.from(groupCard.querySelectorAll('[data-keyword-value]'));
        let targetElement = null;

        for (const node of candidates) {
            if (node.dataset.keywordValue === lastAddedKeyword) {
                targetElement = node.classList.contains('keyword-text') ? node.closest('li') || node : node;
                break;
            }
        }

        if (targetElement) {
            const scrollParent = targetElement.closest('.keyword-grid-preview.is-scrollable, .keyword-list-preview');
            if (scrollParent) {
                const offset = targetElement.offsetTop - scrollParent.clientHeight + targetElement.offsetHeight + 16;
                const finalOffset = Math.max(0, offset);
                if (typeof scrollParent.scrollTo === 'function') {
                    scrollParent.scrollTo({ top: finalOffset, behavior: 'smooth' });
                } else {
                    scrollParent.scrollTop = finalOffset;
                }
            } else {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }

            targetElement.classList.add('keyword-new');
            setTimeout(() => {
                targetElement.classList.remove('keyword-new');
            }, 1600);
        }

        lastAddedKeyword = null;
        lastAddedGroupIndex = null;
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
        } catch (e) { }
        if (isUrl) {
            // Use Google's favicon service with sz=64 for high quality, fallback to 😎 on error
            return `<img src='https://www.google.com/s2/favicons?sz=64&domain=${host}' class='keyword-favicon' loading='lazy' decoding='async' onerror="this.style.display='none';this.nextElementSibling.style.display='inline';">` +
                `<span class='keyword-fallback-emoji' style='display:none;'>😎</span>`;
        } else {
            // Generate gradient letter for non-URL keywords (same color, high to low contrast)
            const firstLetter = keyword.charAt(0).toUpperCase();
            const gradient = getKeywordGradient(keyword);
            return `<span class='keyword-letter' style='background: linear-gradient(135deg, ${gradient[0]}, ${gradient[1]}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;'>${firstLetter}</span>`;
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

    const saveGroup = async () => {
        const newName = groupNameInput.value.trim();
        if (!newName) {
            alert('Group name cannot be empty.');
            return;
        }
        // Adult content filter
        if (containsBlockedContent(newName)) {
            // Toast removed
            return;
        }
        // Prevent duplicate group names
        const duplicate = groups.some((g, idx) => g.name.trim().toLowerCase() === newName.toLowerCase() && (groupModalMode === 'add' || idx !== currentGroupIndex));
        if (duplicate) {
            alert('A group with this name already exists.');
            return;
        }
        if (groupModalMode === 'add') {
            groups.push({ name: newName, keywords: [] });
        } else {
            groups[currentGroupIndex].name = newName;
        }

        toggleModal(groupModal, false);
        groupNameInput.value = '';
        await syncAndSaveGroups();
        renderGroups();
    };

    // Expose functions to window for inline onclick handlers
    window.saveGroup = saveGroup;
    window.closeGroupModal = () => toggleModal(groupModal, false);
    window.closeAddKeywordModal = () => toggleModal(addKeywordModal, false);

    // Add event listener for Enter key on groupNameInput
    groupNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveGroup();
        }
    });

    const deleteGroup = async (index) => {
        if (!adminLoggedIn) {
            alert('Admin access is required to delete groups.');
            return;
        }
        if (confirm(`Are you sure you want to delete the group "${groups[index].name}"?`)) {
            groups.splice(index, 1);
            await syncAndSaveGroups();
            renderGroups();
        }
    };

    async function addKeywordToGroup(index) {
        const group = groups[index];
        if (!group) {
            // Toast removed
            return;
        }

        // Show add keyword modal instead of prompt
        addKeywordTargetGroupIndex = index;
        addKeywordInput.value = '';
        toggleModal(addKeywordModal, true);
        // Delay focus until modal transition completes for reliable auto-focus
        setTimeout(() => {
            addKeywordInput.focus();
        }, 100);
    }

    // Expose to window for inline onclick
    window.addKeywordToGroup = addKeywordToGroup;

    // Save new keyword from modal
    async function saveNewKeyword() {
        const keyword = addKeywordInput.value.trim();
        const description = addKeywordDescInput.value.trim();
        if (!keyword) {
            alert('Please enter a name or link.');
            return;
        }

        const group = groups[addKeywordTargetGroupIndex];
        if (!group) {
            alert('Group not found.');
            return;
        }

        // Check if keyword already exists in the current group
        const exists = group.keywords.some((kw) => kw.trim().toLowerCase() === keyword.toLowerCase());
        if (exists) {
            alert('This keyword already exists in the group.');
            return;
        }

        // Check if keyword/link already exists in ANY group
        for (let i = 0; i < groups.length; i++) {
            if (i === addKeywordTargetGroupIndex) continue; // Skip current group (already checked)
            const duplicateExists = groups[i].keywords.some((kw) => kw.trim().toLowerCase() === keyword.toLowerCase());
            if (duplicateExists) {
                alert(`This keyword/link already exists in the group "${groups[i].name}".`);
                return;
            }
        }

        // Check if keyword is a URL or just a name
        const parsed = parseKeyword(keyword);
        if (!parsed.isUrl) {
            // For non-URL keywords, check if it starts with an emoji
            const emojiMatch = keyword.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
            if (emojiMatch) {
                const emoji = emojiMatch[1];
                const usedEmojis = getAllUsedEmojis();
                if (usedEmojis.has(emoji)) {
                    alert('This emoji is already in use. Please choose a different emoji.');
                    return;
                }
            }
        }

        // Adult content filter
        if (containsBlockedContent(keyword)) {
            alert('Content blocked.');
            return;
        }

        lastAddedKeyword = keyword;
        lastAddedGroupIndex = addKeywordTargetGroupIndex;
        group.keywords.push(keyword);

        // Save description if provided
        if (description) {
            await saveKeywordDescription(keyword, description);
        }

        // Optimistic UI update: Render and close immediately
        renderGroups();
        toggleModal(addKeywordModal, false);

        try {
            await syncAndSaveGroups();
        } catch (error) {
            alert('Failed to save keyword.');
            // Revert on error
            group.keywords.pop();
            renderGroups();
        }
    }

    // Expose saveNewKeyword to window for inline onclick handler
    window.saveNewKeyword = saveNewKeyword;

    // --- Render Functions ---
    const renderGroups = () => {
        groupsContainer.innerHTML = '';
        // Store original index for each group so UI actions hit the right item
        const filteredGroups = groups.map((group, idx) => ({ ...group, _originalIndex: idx }));

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
                groupCard.dataset.groupIndex = originalIndex; // Required for click handlers
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
                h3.dataset.groupIndex = originalIndex;
                h3.style.cursor = adminLoggedIn ? 'pointer' : 'default';

                // Add click/long-press for group name rename (admin only)
                if (adminLoggedIn) {
                    let longPressTimer;

                    // Desktop: Click to rename
                    h3.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openGroupModal('edit', originalIndex);
                    });

                    // Touch: Long press to rename
                    h3.addEventListener('touchstart', (e) => {
                        e.stopPropagation();
                        longPressTimer = setTimeout(() => {
                            openGroupModal('edit', originalIndex);
                        }, 500);
                    });

                    h3.addEventListener('touchend', () => {
                        clearTimeout(longPressTimer);
                    });

                    h3.addEventListener('touchmove', () => {
                        clearTimeout(longPressTimer);
                    });
                }

                header.appendChild(h3);

                // --- Group Actions ---
                const actions = document.createElement('div');
                actions.className = 'group-actions';

                // Determine button background (darker shade of group color)
                const addKeywordBtnBg = darkenColor(groupColor, 0.45);

                // Create button using innerHTML for maximum reliability
                const addKeywordBtnHTML = `
                    <button 
                        type="button"
                        class="icon-btn icon-btn--add-keyword"
                        data-action="add-keyword"
                        data-group-index="${originalIndex}"
                        style="cursor:pointer; z-index:10; pointer-events:auto; user-select:none; background: ${addKeywordBtnBg} !important;"
                        aria-label="Add keyword to ${group.name}"
                        onclick="event.stopPropagation(); window.addKeywordToGroup(${originalIndex}); return false;">
                        <span class="icon-plus">＋</span>
                    </button>
                `;

                actions.innerHTML = addKeywordBtnHTML;

                // Also attach listeners to the button after it's in the DOM
                const addKeywordBtn = actions.querySelector('.icon-btn--add-keyword');
                if (addKeywordBtn) {
                    addKeywordBtn.onclick = function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        window.addKeywordToGroup(originalIndex);
                        return false;
                    };
                }

                if (adminLoggedIn) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'icon-btn';
                    deleteBtn.dataset.action = 'delete-group';
                    deleteBtn.dataset.groupIndex = originalIndex;
                    deleteBtn.innerHTML = '<img src="media/delete.png" alt="Delete" style="width:24px;height:24px;">';
                    actions.appendChild(deleteBtn);
                }
                header.appendChild(actions);
                groupCard.appendChild(header);

                // --- Preview Keywords ---
                if (viewMode === 'grid') {
                    const keywords = group.keywords;
                    const previewGrid = document.createElement('div');
                    previewGrid.className = 'keyword-grid-preview';

                    if (keywords.length === 0) {
                        const emptyItem = document.createElement('div');
                        emptyItem.className = 'keyword-grid-empty';
                        emptyItem.textContent = 'No keywords yet';
                        previewGrid.appendChild(emptyItem);
                    } else {
                        previewGrid.classList.add('is-scrollable');

                        // Add size class based on keyword count for mobile
                        if (keywords.length <= 3) {
                            previewGrid.classList.add('size-small');
                        } else if (keywords.length <= 9) {
                            previewGrid.classList.add('size-medium');
                        } else {
                            previewGrid.classList.add('size-large');
                        }

                        keywords.forEach((keyword, keywordIndex) => {
                            const { displayText, targetUrl } = parseKeyword(keyword);
                            const emoji = getKeywordEmoji(keyword);
                            const previewItem = document.createElement('div');
                            previewItem.className = 'keyword-grid-preview-item';
                            previewItem.dataset.keywordValue = keyword;
                            previewItem.dataset.groupIndex = originalIndex;
                            previewItem.dataset.keywordIndex = keywordIndex;
                            previewItem.draggable = adminLoggedIn;
                            
                            const encodedKeyword = encodeURIComponent(keyword).replace(/\./g, '%2E');
                            const clickCount = globalClickCounts[encodedKeyword] || 0;
                            const description = keywordDescriptions[encodedKeyword];
                            
                            previewItem.innerHTML = `
                                <div class="keyword-grid-icon">${getFaviconOrEmoji(keyword, emoji)}</div>
                                <div class="keyword-grid-text">${displayText}</div>
                                <div class="keyword-click-counter">${clickCount}</div>
                                ${description ? `<div class="keyword-tooltip">${description}</div>` : ''}
                            `;
                            previewItem.setAttribute('aria-label', displayText);

                            // Single click/tap opens URL (only if not admin or not dragging)
                            previewItem.addEventListener('click', (event) => {
                                if (adminLoggedIn && previewItem.classList.contains('dragging')) {
                                    return; // Don't open URL when dragging in admin mode
                                }
                                event.preventDefault();
                                event.stopPropagation();

                                // Vibration feedback for mobile devices
                                if (navigator.vibrate) {
                                    navigator.vibrate(20);
                                }

                                // Increment click count
                                incrementKeywordClick(originalIndex, keyword);

                                previewItem.classList.add('keyword-clicked');
                                // Check for Ctrl/Meta key to open in new tab
                                const inNewTab = event.ctrlKey || event.metaKey;
                                openURLWithBrowser(targetUrl, inNewTab);

                                // Force remove focus to prevent sticky hover/zoom on mobile
                                if (document.activeElement) {
                                    document.activeElement.blur();
                                }
                                previewItem.blur();

                                setTimeout(() => {
                                    previewItem.classList.remove('keyword-clicked');
                                }, 800);
                            });

                            // Middle-click support
                            previewItem.addEventListener('auxclick', (event) => {
                                if (event.button === 1) { // Middle click
                                    event.preventDefault();
                                    event.stopPropagation();
                                    openURLWithBrowser(targetUrl, true); // Open in new tab
                                }
                            });

                            // Add context menu support (right-click/long-press)
                            attachKeywordContextMenu(previewItem, originalIndex, keywordIndex, keyword, targetUrl);

                            // Add hover sound effect for desktop
                            addKeywordHoverSound(previewItem);

                            previewGrid.appendChild(previewItem);
                        });
                    }

                    groupCard.appendChild(previewGrid);
                } else {
                    const keywords = group.keywords;

                    if (keywords.length === 0) {
                        const emptyItem = document.createElement('div');
                        emptyItem.className = 'keyword-list-empty';
                        emptyItem.textContent = 'No keywords yet';
                        groupCard.appendChild(emptyItem);
                    } else {
                        const listWrapper = document.createElement('div');
                        listWrapper.className = 'keyword-list-preview';
                        const ul = document.createElement('ul');

                        keywords.forEach((keyword, keywordIndex) => {
                            const li = document.createElement('li');
                            const emoji = getKeywordEmoji(keyword);
                            const { displayText, targetUrl } = parseKeyword(keyword);

                            const encodedKeyword = encodeURIComponent(keyword).replace(/\./g, '%2E');
                            const clickCount = globalClickCounts[encodedKeyword] || 0;
                            const description = keywordDescriptions[encodedKeyword];
                            li.innerHTML = `
                                ${getFaviconOrEmoji(keyword, emoji)}
                                <span class="keyword-text">${displayText}</span>
                                <div class="keyword-click-counter">${clickCount}</div>
                                ${description ? `<div class="keyword-tooltip">${description}</div>` : ''}
                            `;
                            li.style.cursor = 'default';
                            li.dataset.keywordValue = keyword;
                            li.dataset.groupIndex = originalIndex;
                            li.dataset.keywordIndex = keywordIndex;
                            li.draggable = adminLoggedIn;

                            const textElement = li.querySelector('.keyword-text');
                            if (textElement) {
                                textElement.setAttribute('aria-label', displayText);
                                textElement.dataset.keywordValue = keyword;
                                attachKeywordActivation(textElement, targetUrl, originalIndex, keyword, li);
                            }

                            // Add context menu support
                            attachKeywordContextMenu(li, originalIndex, keywordIndex, keyword, targetUrl);

                            // Add hover sound effect for desktop
                            addKeywordHoverSound(li);

                            ul.appendChild(li);
                        });

                        listWrapper.appendChild(ul);
                        groupCard.appendChild(listWrapper);
                    }
                }

                // Set group index for event delegation
                groupCard.dataset.groupIndex = originalIndex;
                // Make group card draggable only for admins
                groupCard.draggable = adminLoggedIn;

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

        if (!actionButton) {
            return;
        }

        const action = actionButton.dataset.action;
        if (action === 'add-keyword') {
            addKeywordToGroup(groupIndex);
        } else if (action === 'edit-group') {
            openGroupModal('edit', groupIndex);
        } else if (action === 'delete-group') {
            deleteGroup(groupIndex);
        }
    });

    // Drag and Drop Event Listeners
    groupsContainer.addEventListener('dragstart', (e) => {
        if (!adminLoggedIn) {
            e.preventDefault();
            return;
        }
        const draggedCard = e.target.closest('.group-card');
        if (draggedCard) {
            draggedItemIndex = parseInt(draggedCard.dataset.groupIndex);
            e.dataTransfer.effectAllowed = 'move';
            draggedCard.classList.add('dragging'); // Add class for visual feedback
        }
    });

    groupsContainer.addEventListener('dragover', (e) => {
        if (!adminLoggedIn) return;
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
        if (!adminLoggedIn) return;
        e.preventDefault();
        const dropTarget = e.target.closest('.group-card');
        if (dropTarget && draggedItemIndex !== null && !document.body.classList.contains('is-touch')) {
            const dropTargetIndex = parseInt(dropTarget.dataset.groupIndex);
            dropTarget.classList.remove('drag-over');

            if (draggedItemIndex !== dropTargetIndex) {
                const [draggedGroup] = groups.splice(draggedItemIndex, 1);
                groups.splice(dropTargetIndex, 0, draggedGroup);
                (async () => {
                    await syncAndSaveGroups(); // Save the new order
                    renderGroups(); // Re-render to reflect new order
                })();
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

    // === Keyword Drag and Drop Event Listeners ===
    groupsContainer.addEventListener('dragstart', (e) => {
        if (!adminLoggedIn) {
            e.preventDefault();
            return;
        }

        // Check if it's a keyword item being dragged
        const keywordItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
        if (keywordItem && keywordItem.dataset.keywordIndex !== undefined) {
            const groupIndex = parseInt(keywordItem.dataset.groupIndex);
            const keywordIndex = parseInt(keywordItem.dataset.keywordIndex);
            const keyword = keywordItem.dataset.keywordValue;

            draggedKeywordData = { groupIndex, keywordIndex, keyword };
            e.dataTransfer.effectAllowed = 'move';
            keywordItem.classList.add('dragging');
            e.stopPropagation(); // Prevent group card drag
        }
    }, true); // Use capture phase to catch keyword drags before group drags

    groupsContainer.addEventListener('dragover', (e) => {
        if (!adminLoggedIn || !draggedKeywordData) return;

        // Allow drop on keyword items and group cards
        const keywordItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
        const groupCard = e.target.closest('.group-card');

        if (keywordItem || groupCard) {
            e.preventDefault();
            e.stopPropagation();

            if (keywordItem) {
                keywordItem.classList.add('keyword-drag-over');
            } else if (groupCard) {
                groupCard.classList.add('keyword-drag-over-group');
            }
        }
    }, true);

    groupsContainer.addEventListener('dragleave', (e) => {
        const keywordItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
        const groupCard = e.target.closest('.group-card');

        if (keywordItem) {
            keywordItem.classList.remove('keyword-drag-over');
        }
        if (groupCard) {
            groupCard.classList.remove('keyword-drag-over-group');
        }
    });

    groupsContainer.addEventListener('drop', (e) => {
        if (!adminLoggedIn || !draggedKeywordData) return;

        const keywordItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
        const groupCard = e.target.closest('.group-card');

        if (keywordItem || groupCard) {
            e.preventDefault();
            e.stopPropagation();

            // Remove drag-over classes
            document.querySelectorAll('.keyword-drag-over').forEach(el => el.classList.remove('keyword-drag-over'));
            document.querySelectorAll('.keyword-drag-over-group').forEach(el => el.classList.remove('keyword-drag-over-group'));

            const sourceGroupIndex = draggedKeywordData.groupIndex;
            const sourceKeywordIndex = draggedKeywordData.keywordIndex;
            const keyword = draggedKeywordData.keyword;

            let targetGroupIndex, targetKeywordIndex;

            if (keywordItem) {
                // Dropping on another keyword
                targetGroupIndex = parseInt(keywordItem.dataset.groupIndex);
                targetKeywordIndex = parseInt(keywordItem.dataset.keywordIndex);
            } else if (groupCard) {
                // Dropping on a group card (add to end)
                targetGroupIndex = parseInt(groupCard.dataset.groupIndex);
                targetKeywordIndex = groups[targetGroupIndex].keywords.length;
            }

            // Perform the move
            if (sourceGroupIndex === targetGroupIndex) {
                // Moving within same group
                if (sourceKeywordIndex !== targetKeywordIndex) {
                    const keywords = groups[sourceGroupIndex].keywords;
                    const [movedKeyword] = keywords.splice(sourceKeywordIndex, 1);

                    // Adjust target index if moving down in the same array
                    const insertIndex = sourceKeywordIndex < targetKeywordIndex ? targetKeywordIndex - 1 : targetKeywordIndex;
                    keywords.splice(insertIndex, 0, movedKeyword);

                    (async () => {
                        await syncAndSaveGroups();
                        renderGroups();
                    })();
                }
            } else {
                // Moving between groups
                const [movedKeyword] = groups[sourceGroupIndex].keywords.splice(sourceKeywordIndex, 1);
                groups[targetGroupIndex].keywords.splice(targetKeywordIndex, 0, movedKeyword);

                (async () => {
                    await syncAndSaveGroups();
                    renderGroups();
                })();
            }
        }

        draggedKeywordData = null;
    }, true);

    groupsContainer.addEventListener('dragend', (e) => {
        const keywordItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
        if (keywordItem) {
            keywordItem.classList.remove('dragging');
        }

        // Clean up any drag-over classes
        document.querySelectorAll('.keyword-drag-over').forEach(el => el.classList.remove('keyword-drag-over'));
        document.querySelectorAll('.keyword-drag-over-group').forEach(el => el.classList.remove('keyword-drag-over-group'));

        draggedKeywordData = null;
    }, true);

    // --- Direct Event Listeners ---
    addFab.addEventListener('click', () => openGroupModal('add'));
    cancelGroupBtn.addEventListener('click', () => toggleModal(groupModal, false));
    // saveGroupBtn.addEventListener('click', saveGroup); // Removed: onclick handler already exists in HTML

    // New Keyword Add Trigger (Modal FAB)
    // Theme Toggle Event Listener
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // Obfuscated admin credentials (not truly secure, but prevents casual viewing)
    const _a = atob('eWFzaG1hbg=='); // admin ID
    const _p = atob('eWFzaG1hbjkxMQ=='); // admin password

    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            if (adminLoggedIn) {
                adminLoggedIn = false;
                updateAdminButton();
                renderGroups();
                return;
            }

            // Show admin login modal
            adminIdInput.value = '';
            adminPasswordInput.value = '';
            adminErrorMsg.style.display = 'none';
            toggleModal(adminModal, true);
            adminIdInput.focus();
        });
    }

    // Admin login modal handlers
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            const enteredId = adminIdInput.value.trim();
            const enteredPassword = adminPasswordInput.value;

            if (enteredId === _a && enteredPassword === _p) {
                adminLoggedIn = true;
                updateAdminButton();
                renderGroups();
                toggleModal(adminModal, false);
                // Toast removed
            } else {
                adminErrorMsg.style.display = 'block';
                adminPasswordInput.value = '';
                adminPasswordInput.focus();
            }
        });
    }

    if (adminCancelBtn) {
        adminCancelBtn.addEventListener('click', () => {
            toggleModal(adminModal, false);
        });
    }

    // Allow Enter key to submit login
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                adminLoginBtn.click();
            }
        });
    }

    // Close admin modal on outside click
    if (adminModal) {
        adminModal.addEventListener('click', (e) => {
            if (e.target === adminModal) {
                toggleModal(adminModal, false);
            }
        });
    }

    // Rename modal handlers
    if (renameSaveBtn) {
        renameSaveBtn.addEventListener('click', saveRename);
    }

    if (renameCancelBtn) {
        renameCancelBtn.addEventListener('click', () => {
            toggleModal(renameModal, false);
        });
    }

    // Allow Enter key in rename modal
    if (renameKeywordInput) {
        renameKeywordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveRename();
            }
        });
    }

    // Close rename modal on outside click
    if (renameModal) {
        renameModal.addEventListener('click', (e) => {
            if (e.target === renameModal) {
                toggleModal(renameModal, false);
            }
        });
    }

    // Add Keyword modal handlers
    // Add Keyword modal handlers
    if (addKeywordSaveBtn) {
        // Remove old listeners to be safe (though cloning is better, we'll just add)
        addKeywordSaveBtn.onclick = saveNewKeyword; // Force direct assignment to be sure

        // Also add touchstart for better mobile response
        addKeywordSaveBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent double-fire
            saveNewKeyword();
        });
    }

    if (addKeywordCancelBtn) {
        addKeywordCancelBtn.onclick = () => toggleModal(addKeywordModal, false);
    }

    // Allow Enter key in add keyword modal
    if (addKeywordInput) {
        addKeywordInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                saveNewKeyword();
            }
        };
    }

    // Close add keyword modal on outside click
    if (addKeywordModal) {
        addKeywordModal.addEventListener('click', (e) => {
            if (e.target === addKeywordModal) {
                toggleModal(addKeywordModal, false);
            }
        });
    }

    if (viewToggleBtn) {
        viewToggleBtn.addEventListener('click', () => {
            const nextMode = viewMode === 'grid' ? 'list' : 'grid';
            setViewMode(nextMode);
        });
    }

    // Export button - download groups as JSON file
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataToExport = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                groups: groups
            };
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `websiteorganiser-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            // Toast removed
        });
    }

    // Import button - trigger file input
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            importFileInput.click();
        });
    }

    // Handle file selection for import
    if (importFileInput) {
        importFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importedData = JSON.parse(text);

                // Validate the imported data
                if (!importedData.groups || !Array.isArray(importedData.groups)) {
                    throw new Error('Invalid backup file format');
                }

                // Ask user how to handle import
                const choice = confirm(
                    'How do you want to import?\n\n' +
                    'OK = Replace all existing data\n' +
                    'Cancel = Merge with existing data'
                );

                if (choice) {
                    // Replace mode
                    groups = importedData.groups;
                } else {
                    // Merge mode - add new groups and merge keywords
                    importedData.groups.forEach(importedGroup => {
                        const existingGroup = groups.find(g => g.name.toLowerCase() === importedGroup.name.toLowerCase());
                        if (existingGroup) {
                            // Merge keywords
                            importedGroup.keywords.forEach(kw => {
                                if (!existingGroup.keywords.some(k => k.toLowerCase() === kw.toLowerCase())) {
                                    existingGroup.keywords.push(kw);
                                }
                            });
                        } else {
                            // Add new group
                            groups.push(importedGroup);
                        }
                    });
                }

                await syncAndSaveGroups();
                renderGroups();
                // Toast removed
            } catch (error) {
                alert('Failed to import backup: ' + error.message);
            }

            // Reset file input
            importFileInput.value = '';
        });
    }

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

    // --- Initial Render ---

    // Set view mode (default to grid)
    viewMode = 'grid';
    document.body.dataset.keywordView = viewMode;

    // Apply persisted theme (or system preference) before first render
    const initialTheme = getSavedTheme();
    setTheme(initialTheme, { persist: false });

    updateAdminButton();
    updateViewToggleButton();

    // Show loading message
    groupsContainer.innerHTML = '<p style="color: #ccc; text-align: center; padding: 40px;">Loading data from cloud...</p>';

    // Load data from Firestore and setup real-time sync (DON'T set defaults before this!)
    loadDataWithCache();

    // PWA Installation Logic removed

    // Reset iOS viewport zoom (called after keyword tap to undo any auto-zoom)
    function resetIOSZoom() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) return;
        const original = viewport.content;
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        setTimeout(() => { viewport.content = original; }, 300);
    }

    // Enhanced URL opening with browser preference
    function openURLWithBrowser(url, inNewTab = false) {
        resetIOSZoom();
        if (inNewTab) {
            // Use noopener for security and performance
            const w = window.open(url, '_blank', 'noopener');
            if (w) { try { w.opener = null; } catch (e) { } }
        } else {
            // Open in same tab
            window.location.href = url;
        }
    }

    // On touch devices, disable HTML5 drag-and-drop to prevent jank while scrolling
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('is-touch');
        groupsContainer.addEventListener('touchstart', () => { }, { passive: true });
    }

    // PWA Installation Status removed

    // --- Load Data from Firestore ---
    async function loadDataWithCache() {
        // Try local cache first for instant render
        const cached = loadFromLocalStorage();
        if (cached && cached.length > 0) {
            groups = cached;
            renderGroups();
            hideLoading();
            // Setup real-time sync immediately
            setupRealtimeSync();
            // Refresh from cloud in background
            loadGroups()
                .then(() => {
                    renderGroups();
                    // Toast removed
                })
                .catch(() => {
                    // Stay on cached data if network fails
                    // Toast removed
                });
            return;
        }

        // No cache: show loader and fetch from cloud
        showLoading();
        try {
            await loadGroups();
            renderGroups();
            hideLoading();
            setupRealtimeSync();
            // Toast removed
        } catch (error) {
            hideLoading();
            renderGroups(); // Render defaults if present
            // Toast removed
        }
    }

    // Register service worker for offline caching
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(error => {
                console.error('SW registration failed:', error);
            });
        });
    }

    // Network status monitoring
    window.addEventListener('online', () => {
        // Toast removed
        // Try to sync any local changes
        if (groups.length > 0) {
            syncAndSaveGroups();
        }
    });

    window.addEventListener('offline', () => {
        // Toast removed
    });

    // Reset UI states when returning to the tab (fixes mobile zoom/highlight issues)
    function resetKeywordStates() {
        document.querySelectorAll('.keyword-clicked').forEach(el => {
            el.classList.remove('keyword-clicked');
        });
        // Force blur anything that might be focused/hovered
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            resetKeywordStates();
        }
    });

    window.addEventListener('pageshow', (event) => {
        // pageshow fires when navigating back from another page
        resetKeywordStates();
    });

    // ===================================
    // Google Search Bar Functionality
    // ===================================

    const searchInput = document.getElementById('google-search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const searchSuggestions = document.getElementById('search-suggestions');
    const SEARCH_HISTORY_KEY = 'googleSearchHistory';
    const MAX_HISTORY = 10;
    let selectedSuggestionIndex = -1;
    let currentSuggestions = [];

    // Load search history from localStorage
    function loadSearchHistory() {
        try {
            const history = localStorage.getItem(SEARCH_HISTORY_KEY);
            return history ? JSON.parse(history) : [];
        } catch (e) {
            return [];
        }
    }

    // Save search to history
    function saveSearchToHistory(query) {
        if (!query || query.trim().length === 0) return;

        try {
            let history = loadSearchHistory();

            // Remove if already exists (to move to top)
            history = history.filter(item => item.toLowerCase() !== query.toLowerCase());

            // Add to beginning
            history.unshift(query);

            // Keep only MAX_HISTORY items
            history = history.slice(0, MAX_HISTORY);

            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Error saving search history:', e);
        }
    }

    // Clear search history
    function clearSearchHistory() {
        try {
            localStorage.removeItem(SEARCH_HISTORY_KEY);
        } catch (e) {
            console.error('Error clearing history:', e);
        }
    }

    // Delete a single search history item
    function deleteSearchHistoryItem(query) {
        try {
            let history = loadSearchHistory();
            history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Error deleting history item:', e);
        }
    }

    // Show suggestions
    function showSuggestions(query) {
        const history = loadSearchHistory();
        currentSuggestions = [];

        if (!query || query.trim().length === 0) {
            // Show recent searches
            if (history.length > 0) {
                currentSuggestions = history.slice(0, 5);
                renderSuggestions(currentSuggestions, 'recent');
            } else {
                hideSuggestions();
            }
            return;
        }

        // Filter history by query
        const filtered = history.filter(item =>
            item.toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length > 0) {
            currentSuggestions = filtered.slice(0, 5);
            renderSuggestions(currentSuggestions, 'filtered');
        } else {
            // Show "Search for..." suggestion
            currentSuggestions = [query];
            renderSuggestions(currentSuggestions, 'new');
        }
    }

    // Render suggestions
    function renderSuggestions(suggestions, type) {
        if (!suggestions || suggestions.length === 0) {
            hideSuggestions();
            return;
        }

        selectedSuggestionIndex = -1;
        const isHistoryType = type === 'recent' || type === 'filtered';
        let html = '';

        if (isHistoryType) {
            html += `<div class="suggestion-header"><span>Recent Searches</span></div>`;
        }

        suggestions.forEach((suggestion, index) => {
            const icon = isHistoryType
                ? '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
                : '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>';

            const deleteBtn = isHistoryType
                ? `<button class="suggestion-delete-btn" data-action="delete-item" data-query="${escapeHtml(suggestion)}" title="Remove" aria-label="Remove from history">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                   </button>`
                : '';

            html += `
                <div class="suggestion-item" data-index="${index}" data-query="${escapeHtml(suggestion)}">
                    ${icon}
                    <span class="suggestion-text">${escapeHtml(suggestion)}</span>
                    ${deleteBtn}
                </div>
            `;
        });

        // Add "Clear all history" footer for history types
        if (isHistoryType) {
            html += `
                <div class="suggestion-item suggestion-clear-all" data-action="clear-history">
                    <svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span class="suggestion-text">Clear all history</span>
                </div>
            `;
        }

        searchSuggestions.innerHTML = html;
        searchSuggestions.style.display = 'block';

        // Add click handlers to rows (search action)
        searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', handleSuggestionClick);
        });

        // Add click handlers to individual delete buttons (prevent row click)
        searchSuggestions.querySelectorAll('.suggestion-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const query = btn.dataset.query;
                if (query) {
                    deleteSearchHistoryItem(query);
                    // Re-render with current input
                    showSuggestions(searchInput.value);
                }
            });
        });
    }

    // Hide suggestions
    function hideSuggestions() {
        searchSuggestions.style.display = 'none';
        searchSuggestions.innerHTML = '';
        selectedSuggestionIndex = -1;
    }

    // Handle suggestion click
    function handleSuggestionClick(e) {
        // Ignore clicks that originated from the delete button
        if (e.target.closest('.suggestion-delete-btn')) return;

        const item = e.currentTarget;

        // Check if it's clear history action
        if (item.dataset.action === 'clear-history') {
            clearSearchHistory();
            hideSuggestions();
            searchInput.value = '';
            searchInput.focus();
            return;
        }

        const query = item.dataset.query;
        if (query) {
            performGoogleSearch(query);
        }
    }

    // Perform Google search
    function performGoogleSearch(query, inNewTab = false) {
        if (!query || query.trim().length === 0) return;

        const trimmedQuery = query.trim();

        // Save to history
        saveSearchToHistory(trimmedQuery);

        // Open Google search
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}`;
        openURLWithBrowser(searchUrl, inNewTab);

        // Clear input and hide suggestions
        searchInput.value = '';
        hideSuggestions();
        clearSearchBtn.style.display = 'none';

        // Toast removed
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Search input event listeners
    if (searchInput) {
        // Input event - show suggestions
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;

            // Show/hide clear button
            clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';

            // Show suggestions
            showSuggestions(query);
        });

        // Focus event - show recent searches
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length === 0) {
                showSuggestions('');
            } else {
                showSuggestions(searchInput.value);
            }
        });

        // Keydown event - handle Enter and arrow keys
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Check for Ctrl/Meta key to open in new tab
                const inNewTab = e.ctrlKey || e.metaKey;

                if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < currentSuggestions.length) {
                    // Use selected suggestion
                    performGoogleSearch(currentSuggestions[selectedSuggestionIndex], inNewTab);
                } else {
                    // Use current input
                    performGoogleSearch(searchInput.value, inNewTab);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();

                if (currentSuggestions.length > 0) {
                    selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, currentSuggestions.length - 1);
                    updateSelectedSuggestion();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();

                if (currentSuggestions.length > 0) {
                    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
                    updateSelectedSuggestion();
                }
            } else if (e.key === 'Escape') {
                hideSuggestions();
                searchInput.blur();
            }
        });

        // Clear button click
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                hideSuggestions();
                searchInput.focus();
            });
        }
    }

    // Update selected suggestion highlight
    function updateSelectedSuggestion() {
        const items = searchSuggestions.querySelectorAll('.suggestion-item');
        items.forEach((item, index) => {
            if (index === selectedSuggestionIndex) {
                item.classList.add('selected');

                // Update input with selected suggestion
                if (currentSuggestions[index]) {
                    searchInput.value = currentSuggestions[index];
                }
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            hideSuggestions();
        }
    });

    // Collapse search history when scrolling on mobile
    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 768 && searchSuggestions.style.display === 'block') {
            hideSuggestions();
            // Also blur the search input to hide keyboard on mobile
            if (document.activeElement === searchInput) {
                searchInput.blur();
            }
        }
    }, { passive: true });

    // Keyboard shortcuts and global typing capture
    document.addEventListener('keydown', (e) => {
        // Handle Ctrl+K / Cmd+K to focus and select search
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
            return;
        }

        // Global typing: capture character input and focus search bar
        // Don't trigger if any modal is open
        const anyModalOpen = document.querySelector('.modal-container.visible');
        if (anyModalOpen) return;

        // Don't trigger if user is already in an input/textarea/contenteditable
        const activeElement = document.activeElement;
        const isInput = activeElement.tagName === 'INPUT' || 
                        activeElement.tagName === 'TEXTAREA' || 
                        activeElement.isContentEditable;
        if (isInput) return;

        // Ignore modifier keys and non-character keys
        // e.key.length === 1 typically identifies character keys (a, b, 1, !, etc.)
        if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) {
            return;
        }

        // Focus search input - the browser will naturally type the character into it
        searchInput.focus();
    });

    // End of Google Search Bar Functionality

});
