// =============================================================================
// js/ui.js — All Event Listeners, Modals, Audio, Context Menu, Drag-Drop
// =============================================================================

(function (WO) {

    // ── Audio Setup ─────────────────────────────────────────────────────
    let audioContext = null;
    let hoverSoundEnabled = true;
    let audioUnlocked = false;

    try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { hoverSoundEnabled = false; }

    const _buildWav = (freq, dur, decay, amp = 28000) => {
        try {
            const sr = 22050, n = Math.floor(sr * dur), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
            const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
            ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
            v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
            v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
            ws(36, 'data'); v.setUint32(40, n * 2, true);
            for (let i = 0; i < n; i++) {
                const t = i / sr;
                v.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.floor(Math.exp(-t * decay) * Math.sin(2 * Math.PI * freq * t) * amp))), true);
            }
            const bytes = new Uint8Array(buf); let bin = '';
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            return 'data:audio/wav;base64,' + btoa(bin);
        } catch { return null; }
    };

    const clickAudioURI = _buildWav(1200, 0.06, 70);
    const hoverAudioURI = _buildWav(400, 0.05, 80, 18000);
    const silentURI     = _buildWav(1, 0.01, 100);

    const hoverAudio  = hoverAudioURI  ? new Audio(hoverAudioURI)  : null;
    const clickAudio  = clickAudioURI  ? new Audio(clickAudioURI)  : null;
    const unlockAudio = silentURI      ? new Audio(silentURI)      : null;
    if (hoverAudio) hoverAudio.volume = 0.08;
    if (clickAudio) clickAudio.volume = 0.55;

    const tryUnlockAudio = async () => {
        if (audioUnlocked) return;
        try {
            if (audioContext && audioContext.state === 'suspended') await audioContext.resume();
            if (unlockAudio) await unlockAudio.play();
            audioUnlocked = true;
        } catch {}
    };

    WO.playHoverSound = () => { if (!hoverSoundEnabled || !hoverAudio) return; hoverAudio.currentTime = 0; hoverAudio.play().catch(() => tryUnlockAudio()); };
    WO.playClickSound = () => { if (!clickAudio) return; clickAudio.currentTime = 0; clickAudio.play().catch(() => tryUnlockAudio()); };

    // ── Theme ────────────────────────────────────────────────────────────
    WO.setTheme = function (theme, { persist = true } = {}) {
        document.documentElement.dataset.theme = theme;
        if (persist) { try { localStorage.setItem(WO.THEME_STORAGE_KEY, theme); } catch {} }
        // Use lightweight in-place color patcher — avoids full DOM rebuild and favicon blink
        if (typeof WO.updateThemeColors === 'function' && WO.groups && WO.groups.length > 0) WO.updateThemeColors();
    };

    // ── Modal Helpers ────────────────────────────────────────────────────
    const ensureScrollUnlocked = () => {
        if (!document.querySelector('.modal-container.visible')) {
            document.body.classList.remove('modal-open');
            document.documentElement.classList.remove('modal-open');
            document.documentElement.style.overflowY = 'auto';
            document.body.style.overflowY = 'auto';
        }
    };

    WO.toggleModal = function (modal, show) {
        if (!modal) return;
        if (show) {
            modal.classList.add('visible');
            document.body.classList.add('modal-open');
            document.documentElement.classList.add('modal-open');
        }
        else {
            modal.classList.remove('visible');
            ensureScrollUnlocked();
        }
        if (typeof WO.highlightRecentlyAddedKeyword === 'function') {
            requestAnimationFrame(WO.highlightRecentlyAddedKeyword);
        }
    };

    // ── Toast ────────────────────────────────────────────────────────────
    window.showToast = function (message, duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            background:var(--modal-bg,rgba(30,30,40,0.95));color:var(--text-color,#fff);
            padding:12px 20px;border-radius:12px;backdrop-filter:blur(10px);
            -webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);
            box-shadow:0 8px 32px rgba(0,0,0,0.3);font-size:0.95rem;
            opacity:0;transform:translateY(20px);
            transition:opacity 0.3s cubic-bezier(0.34,1.56,0.64,1),transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        `;
        container.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-20px)'; setTimeout(() => toast.remove(), 300); }, duration);
    };

    // ── Admin ─────────────────────────────────────────────────────────────
    WO.updateAdminButton = function () {
        const btn = document.getElementById('admin-btn');
        if (btn) {
            btn.textContent = WO.adminLoggedIn ? 'Admin Logout' : 'Admin Login';
        }
        document.querySelectorAll('.admin-only').forEach(el => { el.style.display = WO.adminLoggedIn ? 'inline-flex' : 'none'; });
        const fab = document.getElementById('add-fab');
        if (fab) fab.style.display = 'flex';
        // Visual hint on logo area when admin is logged in
        const headerLeft = document.querySelector('.header-left');
        if (headerLeft) headerLeft.style.textShadow = WO.adminLoggedIn ? '0 0 12px rgba(76,175,80,0.8)' : '';
        const clock = document.getElementById('live-clock');
        if (clock) clock.style.boxShadow = ''; // Ensure clock has no shadow
    };

    // ── URL Opening ───────────────────────────────────────────────────────
    function resetIOSZoom() {
        const vp = document.querySelector('meta[name="viewport"]');
        if (!vp) return;
        const orig = vp.content;
        vp.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        setTimeout(() => { vp.content = orig; }, 300);
    }

    WO.resolveDynamicURL = function (url) {
        if (!url) return '';
        let finalUrl = url;
        const base = url.replace(/\/$/, '');
        for (const [staticUrl, dynamicUrl] of Object.entries(WO.dynamicLinkMap || {})) {
            if (base.includes(staticUrl.replace(/^https?:\/\//, ''))) { finalUrl = dynamicUrl; break; }
        }
        if (WO.dynamicLinkMap && base.includes('hdhub4u.') && WO.dynamicLinkMap['https://hdhub4u.insure']) {
            finalUrl = WO.dynamicLinkMap['https://hdhub4u.insure'];
        }
        return finalUrl;
    };

    WO.openURLWithBrowser = function (url, inNewTab = false) {
        resetIOSZoom();
        const finalUrl = WO.resolveDynamicURL(url);
        const isPC = !('ontouchstart' in window) && !navigator.maxTouchPoints && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (inNewTab || isPC) { const w = window.open(finalUrl, '_blank', 'noopener'); if (w) { try { w.opener = null; } catch {} } }
        else { window.location.href = finalUrl; }
    };

    // ─── Initialization ───────────────────────────────────────────────────────
    WO.initUI = function () {
        const groupsContainer        = document.getElementById('groups-container');
        const addFab                 = document.getElementById('add-fab');
        const themeToggleBtn         = document.getElementById('theme-toggle-btn');
        const adminBtn               = document.getElementById('admin-btn');
        const adminModal             = document.getElementById('admin-modal');
        const adminIdInput           = document.getElementById('admin-id-input');
        const adminPasswordInput     = document.getElementById('admin-password-input');
        const adminErrorMsg          = document.getElementById('admin-error-msg');
        const adminLoginBtn          = document.getElementById('admin-login-btn');
        const adminCancelBtn         = document.getElementById('admin-cancel-btn');
        const adminGoogleLoginBtn    = document.getElementById('admin-google-login-btn');
        const renameModal            = document.getElementById('rename-modal');
        const renameKeywordInput     = document.getElementById('rename-keyword-input');
        const renameSaveBtn          = document.getElementById('rename-save-btn');
        const renameCancelBtn        = document.getElementById('rename-cancel-btn');
        const addKeywordModal        = document.getElementById('add-keyword-modal');
        const addKeywordInput        = document.getElementById('add-keyword-input');
        const addKeywordSaveBtn      = document.getElementById('add-keyword-save-btn');
        const addKeywordCancelBtn    = document.getElementById('add-keyword-cancel-btn');
        const groupModal             = document.getElementById('group-modal');
        const groupNameInput         = document.getElementById('group-name-input');
        const cancelGroupBtn         = document.getElementById('cancel-group-btn');

        // Audio Unlock Listeners
        ['click','touchstart','keydown','mousedown','wheel'].forEach(ev => document.addEventListener(ev, tryUnlockAudio, { once: true, passive: true }));
        const unlockOnMove = async () => { if (audioUnlocked) { document.removeEventListener('mousemove', unlockOnMove); return; } await tryUnlockAudio(); };
        document.addEventListener('mousemove', unlockOnMove, { passive: true });

        // Theme Init
        const savedTheme = (() => {
            try {
                const s = localStorage.getItem(WO.THEME_STORAGE_KEY);
                if (s === 'dark' || s === 'light' || s === 'solid-dark') return s;
            } catch {}
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        })();
        document.documentElement.dataset.theme = savedTheme;

        if (themeToggleBtn) {
            themeToggleBtn.style.cssText += ';border-radius:50%;width:44px;height:44px;padding:0;display:flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;max-width:44px;max-height:44px;';
            themeToggleBtn.addEventListener('click', () => {
                const t = document.documentElement.dataset.theme;
                WO.setTheme(t === 'light' ? 'dark' : t === 'dark' ? 'solid-dark' : 'light');
            });
        }

        // ── Global Keyboard Shortcuts ─────────────────────────────────────────
        document.addEventListener('keydown', (e) => {
            const active = document.activeElement;
            const inInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);

            // Alt → cycle theme (works everywhere)
            if (e.key === 'Alt') {
                e.preventDefault();
                const t = document.documentElement.dataset.theme;
                WO.setTheme(t === 'light' ? 'dark' : t === 'dark' ? 'solid-dark' : 'light');
                return;
            }

            // Delete → reset search bar (only when NOT typing in an input)
            if (e.key === 'Delete' && !inInput) {
                e.preventDefault();
                const si     = document.getElementById('google-search-input');
                const clrBtn = document.getElementById('clear-search-btn');
                if (!si) return;
                si.value = '';
                if (clrBtn) clrBtn.style.display = 'none';
                WO.activeKeywordSearchQuery = '';
                WO.renderGroups();
                if (typeof WO.hideSuggestions === 'function') WO.hideSuggestions();
                si.focus();
                return;
            }
        });



        // Modals Init
        ensureScrollUnlocked();
        window.addEventListener('load', ensureScrollUnlocked);
        if (groupModal) groupModal.addEventListener('click', e => { if (e.target === groupModal) WO.toggleModal(groupModal, false); });
        // Admin Auth (Firebase Auth Integration)
        // Track previous auth state to avoid re-rendering on token refresh without actual change
        let _prevAuthState = null;
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                const newState = !!user;
                WO.adminLoggedIn = newState;
                WO.updateAdminButton();
                // Only re-render if auth state actually changed AND data is loaded
                if (newState !== _prevAuthState && WO.groups && WO.groups.length > 0) {
                    WO.renderGroups();
                }
                _prevAuthState = newState;
            });
        }

        // Admin login/logout — triggered by clicking the logo / title (Requires TRIPLE CLICK / TAP)
        const headerLeft = document.querySelector('.header-left');
        if (headerLeft) {
            headerLeft.style.cursor = 'pointer';
            
            let clickCount = 0;
            let clickTimer = null;

            headerLeft.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent the <a> tag from refreshing the page
                
                clickCount++;
                if (clickCount === 1) {
                    clickTimer = setTimeout(() => {
                        clickCount = 0;
                    }, 800); // 800ms window to complete 3 taps
                }
                
                if (clickCount >= 3) {
                    clearTimeout(clickTimer);
                    clickCount = 0;

                    if (WO.adminLoggedIn) {
                        if (typeof firebase !== 'undefined' && firebase.auth) {
                            firebase.auth().signOut().catch(e => console.error('Signout failed:', e));
                        } else {
                            WO.adminLoggedIn = false;
                            WO.updateAdminButton();
                            WO.renderGroups();
                        }
                        return;
                    }
                    adminIdInput.value = ''; adminPasswordInput.value = '';
                    adminErrorMsg.textContent = 'Invalid credentials';
                    adminErrorMsg.style.display = 'none';
                    WO.toggleModal(adminModal, true); adminIdInput.focus();
                }
            });
        }
        
        // Remove pointer cursor from clock since it's no longer clickable
        const liveClock = document.getElementById('live-clock');
        if (liveClock) {
            liveClock.style.cursor = 'default';
        }
        
        // Keep adminBtn handler as fallback if element exists
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                if (headerLeft) headerLeft.click();
            });
        }
        const adminLoginForm = document.getElementById('admin-login-form');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = adminIdInput.value.trim();
                const password = adminPasswordInput.value;
                if (!email || !password) {
                    adminErrorMsg.textContent = 'Please enter email and password.';
                    adminErrorMsg.style.display = 'block';
                    return;
                }

                // Show loading state
                adminLoginBtn.disabled = true;
                adminLoginBtn.textContent = 'Logging in...';

                try {
                    if (typeof firebase !== 'undefined' && firebase.auth) {
                        try {
                            await firebase.auth().signInWithEmailAndPassword(email, password);
                        } catch (signInErr) {
                            const code = signInErr.code || '';
                            const _a = atob('ZGFzaGJvdDIwMDFAZ21haWwuY29t'); // dashbot2001@gmail.com
                            const _p = atob('ZGFzaEBib3Q='); // dash@bot
                            
                            // Only try creating the account on the fly if credentials are correct but user doesn't exist
                            if (email === _a && password === _p && 
                                (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials')) {
                                await firebase.auth().createUserWithEmailAndPassword(email, password);
                                console.log('Admin account created on first login.');
                            } else {
                                if (code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
                                    throw new Error('Invalid email or password.');
                                }
                                throw signInErr;
                            }
                        }
                        WO.toggleModal(adminModal, false);
                    } else {
                        // Fallback local auth if running offline
                        const _a = atob('ZGFzaGJvdDIwMDFAZ21haWwuY29t');
                        const _p = atob('ZGFzaEBib3Q=');
                        if (email === _a && password === _p) {
                            WO.adminLoggedIn = true;
                            WO.updateAdminButton();
                            WO.renderGroups();
                            WO.toggleModal(adminModal, false);
                        } else {
                            throw new Error('Invalid local credentials');
                        }
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    let displayMsg = error.message || 'Login failed.';
                    const code = error.code || '';
                    if (code === 'auth/email-already-in-use' && email === atob('ZGFzaGJvdDIwMDFAZ21haWwuY29t')) {
                        displayMsg = 'This admin email is registered via Google. Please log in using the Google button once to link your password.';
                    }
                    adminErrorMsg.textContent = displayMsg;
                    adminErrorMsg.style.display = 'block';
                    adminPasswordInput.value = '';
                    adminPasswordInput.focus();
                } finally {
                    adminLoginBtn.disabled = false;
                    adminLoginBtn.textContent = 'Login';
                }
            });
        }
        if (adminGoogleLoginBtn) {
            adminGoogleLoginBtn.addEventListener('click', async () => {
                adminGoogleLoginBtn.disabled = true;
                const originalContent = adminGoogleLoginBtn.innerHTML;
                adminGoogleLoginBtn.textContent = 'Connecting...';
                try {
                    if (typeof firebase !== 'undefined' && firebase.auth) {
                        const provider = new firebase.auth.GoogleAuthProvider();
                        const result = await firebase.auth().signInWithPopup(provider);
                        const user = result.user;
                        if (user && user.email !== 'dashbot2001@gmail.com') {
                            try {
                                await user.delete();
                            } catch (deleteError) {
                                console.error('Failed to delete unauthorized user account:', deleteError);
                            }
                            await firebase.auth().signOut();
                            throw new Error('Access denied: Unauthorized Google account.');
                        }
                        // Auto-link email/password credential to Google account on first login
                        if (user && user.email === 'dashbot2001@gmail.com') {
                            const hasPassword = user.providerData && user.providerData.some(p => p.providerId === 'password');
                            if (!hasPassword) {
                                try {
                                    const credential = firebase.auth.EmailAuthProvider.credential(user.email, 'dash@bot');
                                    await user.linkWithCredential(credential);
                                    console.log('Successfully linked password provider to admin Google account.');
                                } catch (linkErr) {
                                    console.error('Error linking password provider:', linkErr);
                                }
                            }
                        }
                        WO.toggleModal(adminModal, false);
                    } else {
                        throw new Error('Google Sign-In is not available offline.');
                    }
                } catch (error) {
                    console.error('Google Sign-In error:', error);
                    adminErrorMsg.textContent = error.message || 'Google Sign-In failed.';
                    adminErrorMsg.style.display = 'block';
                } finally {
                    adminGoogleLoginBtn.disabled = false;
                    adminGoogleLoginBtn.innerHTML = originalContent;
                }
            });
        }
        if (adminCancelBtn) adminCancelBtn.addEventListener('click', () => WO.toggleModal(adminModal, false));
        const passwordPeekBtn = document.getElementById('password-peek-btn');
        const peekEyeOpen    = document.getElementById('peek-eye-open');
        const peekEyeOff     = document.getElementById('peek-eye-off');
        if (passwordPeekBtn && adminPasswordInput) {
            passwordPeekBtn.addEventListener('click', () => {
                const isHidden = adminPasswordInput.type === 'password';
                adminPasswordInput.type = isHidden ? 'text' : 'password';
                if (peekEyeOpen)  peekEyeOpen.style.display  = isHidden ? 'none'  : '';
                if (peekEyeOff)   peekEyeOff.style.display   = isHidden ? ''      : 'none';
            });
        }
        if (adminModal) adminModal.addEventListener('pointerdown', e => { if (e.target === adminModal) WO.toggleModal(adminModal, false); });

        // Rename Modal
        if (renameSaveBtn)  renameSaveBtn.addEventListener('click', WO.saveRename);
        if (renameCancelBtn) renameCancelBtn.addEventListener('click', () => WO.toggleModal(renameModal, false));
        if (renameKeywordInput) renameKeywordInput.addEventListener('keydown', e => { if (e.key === 'Enter') WO.saveRename(); });
        if (renameModal) renameModal.addEventListener('pointerdown', e => { if (e.target === renameModal) WO.toggleModal(renameModal, false); });

        // Add Keyword Modal
        if (addKeywordSaveBtn) {
            addKeywordSaveBtn.onclick = e => { e.preventDefault(); e.stopPropagation(); WO.saveNewKeyword(); };
            addKeywordSaveBtn.removeAttribute('onclick');
        }
        if (addKeywordCancelBtn) { addKeywordCancelBtn.onclick = () => window.closeAddKeywordModal(); addKeywordCancelBtn.removeAttribute('onclick'); }
        if (addKeywordInput) { addKeywordInput.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); WO.saveNewKeyword(); } }; }
        if (addKeywordModal) addKeywordModal.addEventListener('pointerdown', e => { if (e.target === addKeywordModal) window.closeAddKeywordModal(); });

        // Group Modal
        if (addFab) addFab.addEventListener('click', () => WO.openGroupModal('add'));
        if (cancelGroupBtn) cancelGroupBtn.addEventListener('click', () => WO.toggleModal(groupModal, false));
        if (groupNameInput) groupNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') WO.saveGroup(); });
        window.closeGroupModal = () => WO.toggleModal(groupModal, false);

        // Logo
        const logoLink = document.querySelector('.site-logo-link');
        const logoRefreshDot = document.querySelector('.site-logo-refresh-dot');
        if (logoRefreshDot) logoRefreshDot.hidden = true;
        if (logoLink) logoLink.addEventListener('click', e => { e.preventDefault(); window.location.reload(); });

        // Header Resize — ResizeObserver covers all resize cases; window resize listener removed
        const headerEl = document.querySelector('header');
        if (headerEl) {
            const updatePadding = () => { document.body.style.paddingTop = headerEl.offsetHeight + 'px'; };
            if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updatePadding).observe(headerEl);
            window.addEventListener('load', updatePadding);
            updatePadding();
        }

        // Context Menu
        let contextMenu = null;
        function createContextMenu() {
            if (contextMenu) return contextMenu;
            contextMenu = document.createElement('div');
            contextMenu.className = 'context-menu';
            contextMenu.style.cssText = 'position:fixed;background:#232323;border:1px solid #444;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.35);padding:8px 0;z-index:10000;display:none;min-width:150px;';

            const mkItem = (cls, html, color) => {
                const el = document.createElement('div');
                el.className = `context-menu-item ${cls}`;
                el.innerHTML = html;
                el.style.cssText = `padding:10px 16px;cursor:pointer;transition:background 0.2s;color:${color};font-weight:500;display:flex;align-items:center;`;
                el.addEventListener('mouseenter', () => el.style.background = '#2d2d2d');
                el.addEventListener('mouseleave', () => el.style.background = 'transparent');
                return el;
            };

            contextMenu.appendChild(mkItem('edit-comment-option', '<img src="media/comment.png" style="width:20px;height:20px;margin-right:10px;vertical-align:middle;">Edit Comment', '#4a90e2'));
            contextMenu.appendChild(mkItem('rename-option', '<img src="media/rename.png" style="width:20px;height:20px;margin-right:10px;vertical-align:middle;">Rename', '#7b2cbf'));
            contextMenu.appendChild(mkItem('restore-option', '<svg viewBox="0 0 24 24" width="20" height="20" style="margin-right:10px;vertical-align:middle;" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>Restore', '#4CAF50'));
            contextMenu.appendChild(mkItem('delete-option', '<img src="media/delete.png" style="width:20px;height:20px;margin-right:10px;vertical-align:middle;"><span class="delete-text">Delete</span>', '#ff4d4f'));
            document.body.appendChild(contextMenu);
            return contextMenu;
        }

        function showContextMenu(x, y, groupIndex, keywordIndex, keyword) {
            const menu = createContextMenu();
            menu.style.display = 'block';
            const mr = menu.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
            let sx = x, sy = y;
            if (x + mr.width  > vw - 10) sx = vw - mr.width - 10;
            if (sx < 10) sx = 10;
            if (y + mr.height > vh - 10) sy = vh - mr.height - 10;
            if (sy < 10) sy = 10;
            menu.style.left = sx + 'px'; menu.style.top = sy + 'px';

            const editEl   = menu.querySelector('.edit-comment-option');
            const renameEl = menu.querySelector('.rename-option');
            const restoreEl = menu.querySelector('.restore-option');
            const deleteEl = menu.querySelector('.delete-option');
            const deleteText = deleteEl.querySelector('.delete-text');

            const ek = WO.getKeywordEncodedKey(keyword);
            const isSoftDeleted = WO.keywordDeletedStatus && WO.keywordDeletedStatus[ek] === true;

            editEl.style.display = 'block';
            editEl.onclick = () => { hideContextMenu(); WO.renameKeyword(groupIndex, keywordIndex, keyword, true); };
            
            renameEl.style.display = 'block';
            renameEl.onclick = () => { hideContextMenu(); WO.renameKeyword(groupIndex, keywordIndex, keyword, false); };

            if (isSoftDeleted) {
                if (WO.adminLoggedIn) {
                    restoreEl.style.display = 'block';
                    restoreEl.onclick = () => { hideContextMenu(); WO.restoreKeyword(groupIndex, keywordIndex); };
                    deleteEl.style.display = 'block';
                    deleteText.textContent = 'Delete Permanently';
                } else {
                    restoreEl.style.display = 'none';
                    deleteEl.style.display = 'none';
                }
            } else {
                restoreEl.style.display = 'none';
                deleteEl.style.display = 'block';
                deleteText.textContent = 'Delete';
            }
            
            deleteEl.onclick = () => { hideContextMenu(); WO.deleteKeyword(groupIndex, keywordIndex); };
        }

        function hideContextMenu() { if (contextMenu) contextMenu.style.display = 'none'; }
        document.addEventListener('click', hideContextMenu);
        document.addEventListener('scroll', hideContextMenu);

        // Touch Detection
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            document.body.classList.add('is-touch');
            groupsContainer.addEventListener('touchstart', () => {}, { passive: true });
        }

        // Groups Container — Click Delegation
        groupsContainer.addEventListener('click', e => {
            const previewItem = e.target.closest('.keyword-grid-preview-item');
            if (previewItem) {
                if (WO.adminLoggedIn && previewItem.classList.contains('dragging')) return;
                e.preventDefault(); e.stopPropagation();
                const url = previewItem.dataset.targetUrl;
                const kw  = previewItem.dataset.keywordValue;
                const gi  = parseInt(previewItem.dataset.groupIndex);
                if (navigator.vibrate) navigator.vibrate(10);
                WO.incrementKeywordClick(gi, kw);
                WO.openURLWithBrowser(url, true);
                return;
            }
            const groupCard   = e.target.closest('.group-card');
            const actionBtn   = e.target.closest('.icon-btn');
            if (!groupCard || !actionBtn) return;
            const groupIndex = parseInt(groupCard.dataset.groupIndex);
            const action     = actionBtn.dataset.action;
            if (action === 'add-keyword')  WO.addKeywordToGroup(groupIndex);
            else if (action === 'edit-group')   WO.openGroupModal('edit', groupIndex);
            else if (action === 'delete-group') WO.deleteGroup(groupIndex);
        });

        // Hover Sound (Desktop)
        if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
            groupsContainer.addEventListener('mouseenter', e => { if (e.target.closest('.keyword-grid-preview-item')) WO.playHoverSound(); }, true);
        }

        // Context Menu Delegation
        groupsContainer.addEventListener('contextmenu', e => {
            const item = e.target.closest('.keyword-grid-preview-item');
            if (!item) return;
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, parseInt(item.dataset.groupIndex), parseInt(item.dataset.keywordIndex), item.dataset.keywordValue);
        });

        // Long-Press Context Menu (Touch)
        let _lpTimer = null, _lpItem = null;
        groupsContainer.addEventListener('touchstart', e => {
            const item = e.target.closest('.keyword-grid-preview-item');
            if (!item) return;
            _lpItem = item;
            const t = e.touches[0];
            const tx = t ? t.clientX : 0, ty = t ? t.clientY : 0;
            _lpTimer = setTimeout(() => {
                if (_lpItem === item) showContextMenu(tx, ty, parseInt(item.dataset.groupIndex), parseInt(item.dataset.keywordIndex), item.dataset.keywordValue);
            }, 500);
        }, { passive: true });
        groupsContainer.addEventListener('touchend',  () => { clearTimeout(_lpTimer); _lpItem = null; }, { passive: true });
        groupsContainer.addEventListener('touchmove', () => { clearTimeout(_lpTimer); _lpItem = null; }, { passive: true });

        // Middle-Click to Open (Natively in background via <a> tag)
        groupsContainer.addEventListener('auxclick', e => {
            if (e.button !== 1) return;
            const item = e.target.closest('.keyword-grid-preview-item');
            if (!item || item.classList.contains('dragging')) return;
            const kw  = item.dataset.keywordValue;
            const gi  = parseInt(item.dataset.groupIndex);
            if (kw && !isNaN(gi)) {
                WO.incrementKeywordClick(gi, kw);
            }
            // Do not call preventDefault() so browser natively opens the <a> link in background
        }, true);

        // Group Drag & Drop
        groupsContainer.addEventListener('dragstart', e => {
            const card = e.target.closest('.group-card');
            const kwItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
            if (!card || kwItem) return;
            WO.draggedItemIndex = parseInt(card.dataset.groupIndex);
            e.dataTransfer.effectAllowed = 'move';
            card.classList.add('dragging');
        });
        groupsContainer.addEventListener('dragover', e => {
            e.preventDefault();
            const target = e.target.closest('.group-card');
            if (target && WO.draggedItemIndex !== null && !document.body.classList.contains('is-touch')) {
                if (parseInt(target.dataset.groupIndex) !== WO.draggedItemIndex) target.classList.add('drag-over');
            }
        });
        groupsContainer.addEventListener('dragleave', e => { const t = e.target.closest('.group-card'); if (t) t.classList.remove('drag-over'); });
        groupsContainer.addEventListener('drop', e => {
            e.preventDefault();
            const target = e.target.closest('.group-card');
            if (target && WO.draggedItemIndex !== null && !document.body.classList.contains('is-touch')) {
                const ti = parseInt(target.dataset.groupIndex);
                target.classList.remove('drag-over');
                if (WO.draggedItemIndex !== ti) {
                    const dg = WO.groups[WO.draggedItemIndex], tg = WO.groups[ti];
                    if (dg && tg && WO.moveLocalGroupOrder(dg.name, tg.name)) WO.renderGroups();
                }
            }
            WO.draggedItemIndex = null;
        });
        groupsContainer.addEventListener('dragend', e => {
            const c = e.target.closest('.group-card');
            if (c && !document.body.classList.contains('is-touch')) c.classList.remove('dragging');
            WO.draggedItemIndex = null;
        });

        // Keyword Drag & Drop
        groupsContainer.addEventListener('dragstart', e => {
            const kwItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
            if (!kwItem || kwItem.dataset.keywordIndex === undefined) return;
            const targetUrl = kwItem.dataset.targetUrl || WO.parseKeyword(kwItem.dataset.keywordValue || '').targetUrl;
            if (e.dataTransfer && targetUrl) {
                e.dataTransfer.setData('text/uri-list', targetUrl);
                e.dataTransfer.setData('text/plain', targetUrl);
                e.dataTransfer.effectAllowed = WO.adminLoggedIn ? 'copyMove' : 'copyLink';
            }
            if (!WO.adminLoggedIn) return;
            WO.draggedKeywordData = { groupIndex: parseInt(kwItem.dataset.groupIndex), keywordIndex: parseInt(kwItem.dataset.keywordIndex), keyword: kwItem.dataset.keywordValue };
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copyMove';
            kwItem.classList.add('dragging');
            e.stopPropagation();
        }, true);

        groupsContainer.addEventListener('dragover', e => {
            if (!WO.adminLoggedIn || !WO.draggedKeywordData) return;
            const kwItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
            const card   = e.target.closest('.group-card');
            if (kwItem || card) {
                e.preventDefault(); e.stopPropagation();
                if (kwItem) kwItem.classList.add('keyword-drag-over');
                else if (card) card.classList.add('keyword-drag-over-group');
            }
        }, true);

        groupsContainer.addEventListener('dragleave', e => {
            const kwItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
            const card   = e.target.closest('.group-card');
            if (kwItem) kwItem.classList.remove('keyword-drag-over');
            if (card)   card.classList.remove('keyword-drag-over-group');
        });

        groupsContainer.addEventListener('drop', e => {
            if (!WO.adminLoggedIn || !WO.draggedKeywordData) return;
            const kwItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
            const card   = e.target.closest('.group-card');
            if (kwItem || card) {
                e.preventDefault(); e.stopPropagation();
                document.querySelectorAll('.keyword-drag-over').forEach(el => el.classList.remove('keyword-drag-over'));
                document.querySelectorAll('.keyword-drag-over-group').forEach(el => el.classList.remove('keyword-drag-over-group'));
                const { groupIndex: si, keywordIndex: ski, keyword } = WO.draggedKeywordData;
                let tgi, tki;
                if (kwItem) { tgi = parseInt(kwItem.dataset.groupIndex); tki = parseInt(kwItem.dataset.keywordIndex); }
                else { tgi = parseInt(card.dataset.groupIndex); tki = WO.groups[tgi].keywords.length; }
                if (si === tgi) {
                    if (ski !== tki) {
                        const kws = WO.groups[si].keywords;
                        const [moved] = kws.splice(ski, 1);
                        kws.splice(ski < tki ? tki - 1 : tki, 0, moved);
                        (async () => { await WO.syncAndSaveGroups(); WO.renderGroups(); })();
                    }
                } else {
                    const [moved] = WO.groups[si].keywords.splice(ski, 1);
                    WO.groups[tgi].keywords.splice(tki, 0, moved);
                    (async () => { await WO.syncAndSaveGroups(); WO.renderGroups(); })();
                }
            }
            WO.draggedKeywordData = null;
        }, true);

        groupsContainer.addEventListener('dragend', e => {
            const kwItem = e.target.closest('.keyword-grid-preview-item, li[data-keyword-index]');
            if (kwItem) kwItem.classList.remove('dragging');
            document.querySelectorAll('.keyword-drag-over').forEach(el => el.classList.remove('keyword-drag-over'));
            document.querySelectorAll('.keyword-drag-over-group').forEach(el => el.classList.remove('keyword-drag-over-group'));
            WO.draggedKeywordData = null;
        }, true);

        // ── Merged keydown handler — single listener handles both modal shortcuts and search auto-focus
        document.addEventListener('keydown', e => {
            const key = WO.getEventKey(e);
            const activeModal = document.querySelector('.modal-container.visible');

            if (activeModal) {
                // Modal keyboard shortcuts
                if (key === 'Enter') {
                    const saveBtn = activeModal.querySelector('.btn:not(.btn-secondary), #admin-login-btn, #save-group-btn, #rename-save-btn, #add-keyword-save-btn');
                    if (saveBtn) { e.preventDefault(); saveBtn.click(); }
                    return;
                }
                if (key === 'Escape') { WO.toggleModal(activeModal, false); return; }

                const isCtrl = e.ctrlKey || e.metaKey || e.altKey;
                const isSpecial = key.length > 1;
                const inInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
                if (!isCtrl && !isSpecial && !inInput) {
                    let targetInput;
                    if (activeModal.id === 'rename-modal')           targetInput = WO.isCommentOnlyMode ? document.getElementById('rename-keyword-desc-input') : document.getElementById('rename-keyword-input');
                    else if (activeModal.id === 'admin-modal')       targetInput = (!adminIdInput.value) ? adminIdInput : adminPasswordInput;
                    else if (activeModal.id === 'add-keyword-modal') targetInput = document.getElementById('add-keyword-input');
                    else if (activeModal.id === 'group-modal')       targetInput = document.getElementById('group-name-input');
                    else targetInput = activeModal.querySelector('input:not([readonly]):not([type="hidden"])');
                    if (targetInput) targetInput.focus();
                }
                return; // stop — don't auto-focus search while a modal is open
            }

            // Auto-focus search bar on typing from home screen
            const tag = document.activeElement && document.activeElement.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const skip = ['Tab','Escape','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
                          'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
                          'Shift','CapsLock','Insert','Delete','Home','End','PageUp','PageDown'];
            if (skip.includes(e.key)) return;
            // searchInput is not in initUI scope — query it directly (same as original)
            const si = document.getElementById('google-search-input');
            if (si) si.focus();
        });

        // Also handle Ctrl+V paste — focus search and let the paste fire there
        document.addEventListener('paste', e => {
            if (document.querySelector('.modal-container.visible')) return;
            const tag = document.activeElement && document.activeElement.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            const si = document.getElementById('google-search-input');
            if (si) si.focus();
        });

    }; // end WO.initUI

})(window.WO);
