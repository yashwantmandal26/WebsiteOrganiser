(function(WO) {
    const defaults = {
        hoverSound: true,
        clickSound: true,
        volume: 55,
        hoverTone: 'soft',
        clickTone: 'digital',
        hoverVolume: 15,
        clickVolume: 100,
        hoverCooldown: 90,
        showClock: true,
        showSeconds: true,
        secondsDefaulted: true,
        clockFormat: '12',
        glass: true,
        reducedMotion: false,
        showTagline: true,
        accent: 'violet',
        tileSize: 'default',
        tileSpacing: 'default',
        tileCorners: 'rounded',
        hoverEffect: 'default',
        showCategoryIcons: true,
        showWeather: true,
        showTopHits: true,
        wallpaper: 'none',
        wallpaperCustomUrl: '',
        wallpaperBlur: 6,
        wallpaperDim: 25
    };
    const choices = {
        hoverTone: ['soft','bell','pop','crystal','wood','digital'],
        clickTone: ['soft','bell','pop','crystal','wood','digital'],
        clockFormat: ['12','24'],
        accent: ['violet','indigo','blue','green','yellow','orange','red'],
        tileSize: ['compact','default','large'],
        tileSpacing: ['tight','default','airy'],
        tileCorners: ['rounded','soft','square'],
        hoverEffect: ['default','lift','glow','none'],
        wallpaper: ['none', 'mountain', 'galaxy', 'forest', 'sunset', 'neon', 'abstract', 'custom', 'upload']
    };
    const ranges = {
        volume: [0, 100],
        hoverVolume: [0, 100],
        clickVolume: [0, 100],
        hoverCooldown: [50, 500],
        wallpaperBlur: [0, 20],
        wallpaperDim: [0, 80]
    };
    const WALLPAPER_PRESETS = {
        mountain: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
        galaxy: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
        forest: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
        sunset: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1920&q=80',
        neon: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1920&q=80',
        abstract: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80'
    };
    const accents = {
        violet:  ['#7c3aed', '#c4b5fd', '#a855f7'],
        indigo:  ['#4f46e5', '#a5b4fc', '#6366f1'],
        blue:    ['#2563eb', '#93c5fd', '#3b82f6'],
        green:   ['#16a34a', '#86efac', '#22c55e'],
        yellow:  ['#d97706', '#fde047', '#f59e0b'],
        orange:  ['#ea580c', '#fdba74', '#f97316'],
        red:     ['#dc2626', '#fca5a5', '#ef4444'],
        purple:  ['#7c3aed', '#c4b5fd', '#a855f7'],
        pink:    ['#d23e90', '#ff9dcb', '#ec4899'],
        teal:    ['#087e80', '#6fe0d4', '#14b8a6']
    };
    const form = document.getElementById('preferences-form');
    const dialog = document.getElementById('preferences-dialog');
    const trigger = document.getElementById('preferences-button');
    const names = {
        soft: 'Soft tap',
        bell: 'Warm bell',
        pop: 'Bubble pop',
        crystal: 'Crystal chime',
        wood: 'Wood tap',
        digital: 'Digital beep',
        default: 'Original',
        compact: 'Compact',
        large: 'Large',
        tight: 'Tight',
        airy: 'Airy',
        rounded: 'Rounded',
        square: 'Square',
        lift: 'Lift',
        glow: 'Glow',
        none: 'None (Solid / Gradient theme)',
        violet: 'Violet',
        indigo: 'Indigo',
        blue: 'Blue',
        green: 'Green',
        yellow: 'Yellow',
        orange: 'Orange',
        red: 'Red',
        purple: 'Violet',
        pink: 'Pink',
        teal: 'Teal',
        '12': '12-hour',
        '24': '24-hour',
        mountain: 'Aesthetic Mountain (Unsplash)',
        galaxy: 'Cosmic Galaxy (Unsplash)',
        forest: 'Nordic Forest & Mist (Unsplash)',
        sunset: 'Sunset Horizon (Unsplash)',
        neon: 'Cyberpunk Neon (Unsplash)',
        abstract: 'Minimal Silk Flow (Unsplash)',
        custom: 'Custom Image URL',
        upload: 'Upload from Device'
    };
    function row(key, label, description = '') {
        let control;
        if (choices[key]) {
            const selectHtml = `<select name="${key}" id="pref-${key}">${choices[key].map(value=>{
                let text = key === 'tileCorners' && value === 'soft' ? 'Soft corners' : (names[value] || value);
                let extra = '';
                if (key === 'accent' && accents[value]) {
                    extra = ` style="color: ${accents[value][0]}; font-weight: 750;"`;
                    text = `● ${text}`;
                }
                return `<option value="${value}"${extra}>${text}</option>`;
            }).join('')}</select>`;
            if (key === 'clickTone' || key === 'hoverTone') {
                const soundKind = key === 'clickTone' ? 'click' : 'hover';
                control = `<div class="preference-select-preview-wrap">${selectHtml}<button type="button" class="preference-tone-replay-btn sound-preview" data-sound="${soundKind}" title="Replay ${soundKind} tone" aria-label="Replay ${soundKind} tone">▶ Play</button></div>`;
            } else {
                control = selectHtml;
            }
        }
        else if (ranges[key]) control = `<div class="preference-range"><input id="pref-${key}" name="${key}" type="range" min="${ranges[key][0]}" max="${ranges[key][1]}" step="${key === 'hoverCooldown' ? 10 : 1}"><output for="pref-${key}" data-output="${key}"></output></div>`;
        else control = `<input id="pref-${key}" name="${key}" type="checkbox" role="switch">`;
        return `<label class="preference-row" for="pref-${key}"><span>${label}${description ? `<small>${description}</small>` : ''}</span>${control}</label>`;
    }
    form.innerHTML = `<details class="preference-section" open><summary>Look & feel <span>Color, glass & movement</span></summary><fieldset><legend class="sr-only">Look and feel</legend>
        ${row('accent','Accent color','Brand, controls and focus highlights')}${row('glass','Glass header','Soft translucent gradient')}${row('reducedMotion','Reduced motion','Minimize animations; your system preference is also respected')}
    </fieldset></details>
    <details class="preference-section"><summary>Sound studio <span>Tones, volume & feedback</span></summary><fieldset><legend class="sr-only">Sound studio</legend>
        ${row('hoverSound','Hover sounds','Play a tone when you explore website tiles')}${row('hoverTone','Hover tone')}${row('hoverVolume','Hover volume')}
        ${row('clickSound','Click sounds','Feedback when you open a website')}${row('clickTone','Click tone')}${row('clickVolume','Click volume')}
        ${row('volume','Master volume','Scales both hover and click volume')}${row('hoverCooldown','Hover interval','Minimum time between tones while moving quickly')}
        <p class="preference-note">Previews play even when a sound toggle is off. Volume controls always apply.</p>
    </fieldset></details>
    <details class="preference-section"><summary>Wallpaper & Frosted Glass <span>Unsplash presets & custom backgrounds</span></summary><fieldset><legend class="sr-only">Wallpaper and frosted glass</legend>
        ${row('wallpaper','Wallpaper background','Choose an aesthetic preset, custom URL or device photo')}
        <div id="wallpaper-custom-url-row" style="display:none;margin:8px 0 12px;">
            <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:600;">
                <span>Custom Image URL:</span>
                <input type="url" id="pref-wallpaperCustomUrl" name="wallpaperCustomUrl" placeholder="https://images.unsplash.com/..." class="preference-input-text">
            </label>
        </div>
        <div id="wallpaper-upload-row" style="display:none;margin:8px 0 12px;">
            <label class="preference-file-btn">
                <span>📁 Choose photo from device</span>
                <input type="file" id="pref-wallpaper-file" accept="image/*" style="display:none;">
            </label>
            <span id="wallpaper-upload-name" style="font-size:12px;opacity:0.85;margin-left:10px;"></span>
        </div>
        ${row('wallpaperBlur','Background blur','Depth-of-field blur behind frosted glass cards')}
        ${row('wallpaperDim','Background dimming','Darkens wallpaper to ensure contrast and readability')}
    </fieldset></details>
    <details class="preference-section"><summary>Website tiles <span>Size, spacing & hover effects</span></summary><fieldset><legend class="sr-only">Website tiles</legend>
        ${row('tileSize','Tile size')}${row('tileSpacing','Tile spacing')}${row('tileCorners','Tile corners')}${row('hoverEffect','Hover effect')}${row('showCategoryIcons','Category icons')}
    </fieldset></details>
    <details class="preference-section"><summary>Header, Quick Bar & Clock <span>Weather, Frequently Used Sites & details</span></summary><fieldset><legend class="sr-only">Header and clock</legend>
        ${row('showWeather','Show weather widget','Subtle temperature & icon next to clock')}${row('showTopHits','Show Frequently Used Sites bar','Automatic 1-click access to most clicked websites')}${row('showClock','Show clock','Visible on wide screens')}${row('showSeconds','Show seconds')}${row('clockFormat','Time format')}${row('showTagline','Brand tagline')}
    </fieldset></details>
    <details class="preference-section" id="preference-shortcuts-section"><summary>Keyboard shortcuts <span>Customize keys & combinations</span></summary><fieldset><legend class="sr-only">Keyboard shortcuts</legend>
        <div id="shortcuts-list-container"></div>
        <div class="shortcut-section-footer">
            <button type="button" id="shortcuts-reset-all" class="preference-button shortcut-reset-all-btn">Reset all shortcuts</button>
            <p class="preference-note shortcut-hint">Click any key badge to record a new single key (e.g. F2, Delete, /) or combination (e.g. Ctrl+K, Alt+T). Press Esc while recording to cancel.</p>
        </div>
    </fieldset></details>
    <div class="preferences-footer"><span id="preferences-status" role="status">Saved on this device</span><button type="button" id="preferences-reset" class="preference-button">Reset defaults</button></div>`;

    function normalize(saved) {
        const result = {...defaults};
        if (!saved || typeof saved !== 'object') return result;
        if (saved.accent === 'purple') saved.accent = 'violet';
        const isExplicit = saved.secondsDefaulted === true;
        if (!isExplicit) {
            saved.showSeconds = true;
            saved.secondsDefaulted = true;
        }
        for (const key of Object.keys(defaults)) {
            if (choices[key]) { if (choices[key].includes(saved[key])) result[key] = saved[key]; }
            else if (ranges[key]) { if (Number.isFinite(saved[key])) result[key] = Math.max(ranges[key][0],Math.min(ranges[key][1],saved[key])); }
            else if (typeof saved[key] === 'boolean') result[key] = saved[key];
            else if (typeof saved[key] === 'string') result[key] = saved[key];
        }
        return result;
    }
    let saved;
    try { saved = JSON.parse(localStorage.getItem('wo-preferences')); } catch {}
    WO.preferences = normalize(saved);

    WO.syncWallpaperDim = function () {
        const root = document.documentElement;
        const theme = root.dataset.theme;
        const p = WO.preferences || {};
        const baseDim = Number(p.wallpaperDim != null ? p.wallpaperDim : 25) / 100;
        let effectiveDim = baseDim;
        if (theme === 'solid-dark') {
            effectiveDim = Math.min(0.92, Math.max(0.60, baseDim + 0.35));
        } else if (theme === 'dark') {
            effectiveDim = Math.min(0.85, Math.max(0.40, baseDim + 0.15));
        }
        root.style.setProperty('--wallpaper-dim', String(effectiveDim));
        const wpOverlay = document.getElementById('app-wallpaper-overlay');
        if (wpOverlay) {
            wpOverlay.style.backgroundColor = `rgba(0, 0, 0, ${effectiveDim})`;
        }
        const wpEl = document.getElementById('app-wallpaper');
        if (wpEl && root.dataset.wallpaperActive === 'true') {
            const blur = Number(p.wallpaperBlur || 0);
            const brightness = theme === 'solid-dark' ? ' brightness(0.92)' : theme === 'dark' ? ' brightness(0.96)' : '';
            wpEl.style.filter = `blur(${blur}px)${brightness}`;
        }
    };

    function apply() {
        const p = WO.preferences || normalize({}); root = document.documentElement;
        for (const key of ['showClock','showSeconds','clockFormat','glass','reducedMotion','showTagline','accent','tileSize','tileSpacing','tileCorners','hoverEffect','showCategoryIcons','showWeather','showTopHits']) root.dataset[key] = String(p[key]);
        const curAccent = accents[p.accent] || accents.violet;
        root.style.setProperty('--preference-accent', curAccent[0]);
        root.style.setProperty('--preference-accent-light', curAccent[1]);
        root.style.setProperty('--preference-accent-vivid', curAccent[2] || curAccent[0]);
        root.style.setProperty('--accent-color', curAccent[0]);
        root.style.setProperty('--fab-bg', curAccent[0]);
        root.style.setProperty('--fab-hover-bg', curAccent[1]);
        root.style.setProperty('--btn-glow-color', `color-mix(in srgb, ${curAccent[0]} 40%, transparent)`);
        root.style.setProperty('--btn-border-hover', curAccent[1]);
        root.style.setProperty('--search-focus-border', curAccent[1]);
        root.style.setProperty('--search-focus-shadow', `color-mix(in srgb, ${curAccent[1]} 55%, transparent)`);
        root.style.setProperty('--search-idle-shadow', `color-mix(in srgb, ${curAccent[0]} 18%, transparent)`);
        root.style.setProperty('--selection-bg', `color-mix(in srgb, ${curAccent[0]} 30%, transparent)`);

        const accentSelect = document.getElementById('pref-accent');
        if (accentSelect) {
            accentSelect.style.color = curAccent[0];
            accentSelect.style.fontWeight = '750';
        }

        // Apply Wallpaper
        const wpEl = document.getElementById('app-wallpaper');
        let activeWp = '';
        if (p.wallpaper !== 'none') {
            if (p.wallpaper === 'custom') {
                activeWp = p.wallpaperCustomUrl || '';
            } else if (p.wallpaper === 'upload') {
                try { activeWp = localStorage.getItem('wo-custom-wallpaper-data') || p.wallpaperCustomUrl || ''; } catch {}
            } else if (WALLPAPER_PRESETS[p.wallpaper]) {
                activeWp = WALLPAPER_PRESETS[p.wallpaper];
            }
        }
        if (activeWp) {
            root.dataset.wallpaperActive = 'true';
            if (wpEl) {
                wpEl.style.backgroundImage = `url("${activeWp}")`;
            }
            WO.syncWallpaperDim();
        } else {
            root.dataset.wallpaperActive = 'false';
            if (wpEl) wpEl.style.backgroundImage = 'none';
        }

        const customUrlRow = document.getElementById('wallpaper-custom-url-row');
        if (customUrlRow) customUrlRow.style.display = p.wallpaper === 'custom' ? 'block' : 'none';
        const uploadRow = document.getElementById('wallpaper-upload-row');
        if (uploadRow) uploadRow.style.display = p.wallpaper === 'upload' ? 'block' : 'none';

        // Weather widget visibility sync
        const weatherEl = document.getElementById('weather-widget');
        if (weatherEl) {
            if (p.showWeather === false) {
                weatherEl.style.display = 'none';
            } else if (weatherEl.dataset.hasLoaded === 'true') {
                weatherEl.style.display = 'inline-flex';
            }
        }

        // Top Hits Bar Display Sync
        const topHitsSec = document.getElementById('top-hits-section');
        if (topHitsSec) {
            if (p.showTopHits === false) {
                topHitsSec.style.display = 'none';
            } else if (typeof WO.renderTopHits === 'function') {
                WO.renderTopHits();
            }
        }

        for (const key of Object.keys(defaults)) {
            const input = form.elements.namedItem(key);
            if (input) {
                if (input.type === 'checkbox') input.checked = p[key];
                else input.value = p[key];
            }
        }
        const customUrlInput = document.getElementById('pref-wallpaperCustomUrl');
        if (customUrlInput && customUrlInput.value !== p.wallpaperCustomUrl) {
            customUrlInput.value = p.wallpaperCustomUrl || '';
        }
        form.querySelectorAll('[data-output]').forEach(output=>{
            const k = output.dataset.output;
            output.textContent = p[k] + (k === 'hoverCooldown' ? ' ms' : k === 'wallpaperBlur' ? ' px' : '%');
        });
        if (form.elements.showSeconds && form.elements.clockFormat) {
            form.elements.showSeconds.disabled = form.elements.clockFormat.disabled = !p.showClock;
        }
        document.dispatchEvent(new Event('wo-preferences-changed'));
    }

    function save() {
        apply();
        try {
            localStorage.setItem('wo-preferences', JSON.stringify(WO.preferences));
            document.getElementById('preferences-status').textContent = 'Saved on this device';
        } catch {
            document.getElementById('preferences-status').textContent = 'Applied for this session';
        }
    }

    function openPreferences() {
        if (typeof WO.lockScroll === 'function') WO.lockScroll();
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    }

    function closePreferences() {
        if (dialog.open) dialog.close();
        if (typeof WO.unlockScroll === 'function') WO.unlockScroll();
    }

    trigger.addEventListener('click', openPreferences);
    document.getElementById('preferences-close').addEventListener('click', closePreferences);
    dialog.addEventListener('click', e => {
        if (e.target === dialog) {
            const r = dialog.getBoundingClientRect();
            if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closePreferences();
        }
    });
    dialog.addEventListener('close', () => {
        if (typeof WO.unlockScroll === 'function') WO.unlockScroll();
        trigger.focus();
    });
    dialog.addEventListener('cancel', () => {
        if (typeof WO.unlockScroll === 'function') WO.unlockScroll();
    });
    dialog.addEventListener('touchmove', e => {
        if (e.target === dialog) {
            const r = dialog.getBoundingClientRect();
            if (e.touches && e.touches[0]) {
                const t = e.touches[0];
                if (t.clientX < r.left || t.clientX > r.right || t.clientY < r.top || t.clientY > r.bottom) {
                    e.preventDefault();
                }
            }
        }
    }, { passive: false });

    if (typeof MutationObserver !== 'undefined') {
        const dialogObserver = new MutationObserver(() => {
            if (dialog.open) {
                if (typeof WO.lockScroll === 'function') WO.lockScroll();
            } else {
                if (typeof WO.unlockScroll === 'function') WO.unlockScroll();
            }
        });
        dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }

    form.addEventListener('submit', e=>e.preventDefault());
    function handleToneSoundPreview(input) {
        if (!input || !input.name) return;
        if (input.name === 'clickTone' || input.name === 'hoverTone') {
            const kind = input.name === 'clickTone' ? 'click' : 'hover';
            if (typeof WO.playPreferenceSound === 'function') {
                WO.playPreferenceSound(kind, true, input.value);
            }
            const statusEl = document.getElementById('preferences-status');
            if (statusEl) statusEl.textContent = 'Previewing ' + (names[input.value] || input.value) + ' ' + kind + ' tone';
        }
    }

    form.addEventListener('input', e => {
        const input = e.target;
        if (!Object.hasOwn(defaults, input.name)) return;
        WO.preferences[input.name] = input.type === 'checkbox' ? input.checked : input.type === 'range' ? Number(input.value) : input.value;
        if (input.name === 'showSeconds') {
            WO.preferences.secondsDefaulted = true;
        }
        save();
        handleToneSoundPreview(input);
    });

    form.addEventListener('change', e => {
        handleToneSoundPreview(e.target);
    });

    // Custom Wallpaper URL input binding
    const customUrlInput = document.getElementById('pref-wallpaperCustomUrl');
    if (customUrlInput) {
        customUrlInput.value = WO.preferences.wallpaperCustomUrl || '';
        customUrlInput.addEventListener('input', () => {
            WO.preferences.wallpaperCustomUrl = customUrlInput.value.trim();
            save();
        });
    }

    // Device Wallpaper Upload handling
    const fileInput = document.getElementById('pref-wallpaper-file');
    if (fileInput) {
        fileInput.addEventListener('change', () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            const uploadNameEl = document.getElementById('wallpaper-upload-name');
            if (uploadNameEl) uploadNameEl.textContent = 'Optimizing image...';
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    const maxDim = 1920;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                        else { w = Math.round((w * maxDim) / h); h = maxDim; }
                    }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    try {
                        localStorage.setItem('wo-custom-wallpaper-data', optimizedDataUrl);
                        if (uploadNameEl) uploadNameEl.textContent = file.name;
                        save();
                    } catch (err) {
                        if (uploadNameEl) uploadNameEl.textContent = 'Saved for session (quota reached)';
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    document.getElementById('preferences-reset').addEventListener('click', () => {
        WO.preferences = {...defaults};
        try { localStorage.removeItem('wo-custom-wallpaper-data'); } catch {}
        const uploadNameEl = document.getElementById('wallpaper-upload-name');
        if (uploadNameEl) uploadNameEl.textContent = '';
        save();
    });

    form.querySelectorAll('[data-sound]').forEach(button => button.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const soundKind = button.dataset.sound;
        const currentTone = soundKind === 'click' ? form.elements.clickTone?.value : form.elements.hoverTone?.value;
        const played = typeof WO.playPreferenceSound === 'function' && WO.playPreferenceSound(soundKind, true, currentTone);
        const statusEl = document.getElementById('preferences-status');
        if (statusEl) statusEl.textContent = played ? 'Previewing ' + (names[currentTone] || currentTone || soundKind) + ' tone' : 'Increase master and tone volume to preview';
    }));

    window.addEventListener('storage', e => {
        if (e.key === 'wo-preferences') {
            try { WO.preferences = normalize(JSON.parse(e.newValue)); apply(); } catch {}
        }
    });

    function focusSearch() {
        const input = document.getElementById('google-search-input');
        if (input) { input.focus(); input.select(); }
    }

    // ── Cycle Accent Color function ──
    WO.cycleAccentColor = function () {
        const order = choices.accent;
        const cur = (WO.preferences && WO.preferences.accent) || 'violet';
        const idx = order.indexOf(cur);
        const nextAccent = order[(idx + 1) % order.length];
        if (!WO.preferences) WO.preferences = {};
        WO.preferences.accent = nextAccent;
        save();
        const accentSelect = document.getElementById('pref-accent');
        if (accentSelect) {
            accentSelect.value = nextAccent;
            accentSelect.style.color = accents[nextAccent] ? accents[nextAccent][0] : '';
        }
        if (typeof window.showToast === 'function') {
            const label = names[nextAccent] || nextAccent;
            window.showToast('🎨 Accent: ' + label, 1200);
        }
    };

    // ── Customizable Keyboard Shortcuts Manager ──
    const DEFAULT_SHORTCUTS = {
        focusSearch: 'Ctrl+K',
        cycleTheme: 'Alt',
        cycleAccent: 'Control',
        clearSearch: 'Delete',
        openSettings: 'Ctrl+,',
        adminLogin: 'Ctrl+Alt+A',
        closeModals: 'Escape'
    };

    const SHORTCUT_METADATA = [
        { id: 'focusSearch', name: 'Focus search bar', desc: 'Jump cursor to Google & bookmark search' },
        { id: 'cycleTheme', name: 'Cycle theme', desc: 'Switch Dark, Black, and Light modes' },
        { id: 'cycleAccent', name: 'Cycle accent color', desc: 'Single tap to cycle through accent colors' },
        { id: 'clearSearch', name: 'Clear search query', desc: 'Clear search bar and restore all websites' },
        { id: 'openSettings', name: 'Open Settings modal', desc: 'Open Look, Sound & Shortcuts preferences' },
        { id: 'adminLogin', name: 'Admin login modal', desc: 'Open administrator credentials modal' },
        { id: 'closeModals', name: 'Close modals / Escape', desc: 'Dismiss active dialogs, modals, and search suggestions' }
    ];

    let savedShortcuts = {};
    try { savedShortcuts = JSON.parse(localStorage.getItem('wo-shortcuts') || '{}'); } catch {}
    WO.shortcuts = { ...DEFAULT_SHORTCUTS, ...(savedShortcuts || {}) };
    WO.DEFAULT_SHORTCUTS = DEFAULT_SHORTCUTS;
    WO.SHORTCUT_METADATA = SHORTCUT_METADATA;

    WO.saveShortcuts = function () {
        try {
            localStorage.setItem('wo-shortcuts', JSON.stringify(WO.shortcuts));
        } catch {}
        renderShortcutsList();
    };

    function formatShortcutBadge(str) {
        if (!str) return '<span style="opacity:0.5;font-size:11px;">(None)</span>';
        if (str === 'Control') return '<kbd>Ctrl</kbd> <span style="opacity:0.65;font-size:10px;margin-left:2px;">(tap)</span>';
        if (str === 'Alt') return '<kbd>Alt</kbd> <span style="opacity:0.65;font-size:10px;margin-left:2px;">(tap)</span>';

        const parts = str.split('+');
        return parts.map(p => '<kbd>' + (p === 'Control' ? 'Ctrl' : WO.escapeHtml(p)) + '</kbd>').join(' <span style="opacity:0.5;font-size:10px;">+</span> ');
    }

    function renderShortcutsList() {
        const container = document.getElementById('shortcuts-list-container');
        if (!container) return;

        let html = '<div class="preference-shortcut-list">';
        for (const item of SHORTCUT_METADATA) {
            const currentSc = WO.shortcuts[item.id] || '';
            const defSc = DEFAULT_SHORTCUTS[item.id] || '';
            const isCustom = currentSc !== defSc;
            const displayHtml = formatShortcutBadge(currentSc);

            html += `
            <div class="preference-shortcut-row">
                <div class="preference-shortcut-info">
                    <span class="preference-shortcut-title">${WO.escapeHtml(item.name)}</span>
                    <span class="preference-shortcut-desc">${WO.escapeHtml(item.desc)}</span>
                </div>
                <div class="preference-shortcut-control">
                    <button type="button" class="shortcut-key-btn" data-shortcut-action="${item.id}" title="Click to record a new key or combo">
                        ${displayHtml}
                    </button>
                    ${isCustom ? `<button type="button" class="shortcut-reset-single-btn" data-reset-action="${item.id}" title="Reset to default (${defSc})">↺</button>` : ''}
                </div>
            </div>`;
        }
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.shortcut-key-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const actionId = btn.dataset.shortcutAction;
                if (actionId) startRecordingShortcut(actionId, btn);
            });
        });

        container.querySelectorAll('.shortcut-reset-single-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const actionId = btn.dataset.resetAction;
                if (actionId) resetSingleShortcut(actionId);
            });
        });
    }

    function getEventComboString(e) {
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return '';

        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        if (e.metaKey) parts.push('Meta');

        let keyName = e.key;
        if (keyName === ' ') keyName = 'Space';
        else if (keyName === 'Escape') keyName = 'Escape';
        else if (keyName === 'Delete') keyName = 'Delete';
        else if (keyName.length === 1) keyName = keyName.toUpperCase();

        parts.push(keyName);
        return parts.join('+');
    }

    function startRecordingShortcut(actionId, btnElement) {
        if (WO._isRecordingShortcut) return;
        WO._isRecordingShortcut = true;
        WO._recordingActionId = actionId;

        btnElement.classList.add('is-recording');
        btnElement.innerHTML = '<span class="recording-indicator">⏺</span> Press key or combo...';

        let recordedModifiers = new Set();
        let modifierDownTime = 0;
        let nonModifierPressed = false;

        function cleanup() {
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('keyup', onKeyUp, true);
            window.removeEventListener('mousedown', onMouseDown, true);
            WO._isRecordingShortcut = false;
            WO._recordingActionId = null;
            btnElement.classList.remove('is-recording');
            renderShortcutsList();
        }

        function onKeyDown(e) {
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Escape') {
                cleanup();
                if (typeof window.showToast === 'function') window.showToast('Recording cancelled', 1000);
                return;
            }

            const isMod = ['Control', 'Alt', 'Shift', 'Meta'].includes(e.key);
            if (isMod) {
                recordedModifiers.add(e.key === 'Control' ? 'Ctrl' : e.key);
                modifierDownTime = Date.now();
                btnElement.innerHTML = `<span class="recording-indicator">⏺</span> <kbd>${Array.from(recordedModifiers).join('</kbd> + <kbd>')}</kbd> + ...`;
                return;
            }

            nonModifierPressed = true;
            const combo = getEventComboString(e);
            if (combo) {
                saveNewShortcut(actionId, combo);
                cleanup();
            }
        }

        function onKeyUp(e) {
            e.preventDefault();
            e.stopPropagation();

            const isMod = ['Control', 'Alt', 'Shift', 'Meta'].includes(e.key);
            if (isMod && !nonModifierPressed) {
                const elapsed = Date.now() - modifierDownTime;
                if (elapsed < 1200) {
                    const singleMod = e.key === 'Control' ? 'Control' : e.key;
                    saveNewShortcut(actionId, singleMod);
                    cleanup();
                }
            }
        }

        function onMouseDown(e) {
            if (!btnElement.contains(e.target)) {
                cleanup();
            }
        }

        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('keyup', onKeyUp, true);
        window.addEventListener('mousedown', onMouseDown, true);
    }

    function saveNewShortcut(actionId, newShortcut) {
        if (!newShortcut) return;

        let conflictAction = null;
        for (const [id, sc] of Object.entries(WO.shortcuts)) {
            if (id !== actionId && sc.toLowerCase() === newShortcut.toLowerCase()) {
                conflictAction = id;
                break;
            }
        }

        WO.shortcuts[actionId] = newShortcut;
        if (conflictAction) {
            WO.shortcuts[conflictAction] = '';
        }

        WO.saveShortcuts();
        if (typeof WO.playClickSound === 'function') WO.playClickSound();

        const meta = SHORTCUT_METADATA.find(m => m.id === actionId);
        const label = meta ? meta.name : actionId;
        if (typeof window.showToast === 'function') {
            const msg = conflictAction
                ? `Shortcut set to ${newShortcut} (replaced from ${SHORTCUT_METADATA.find(m => m.id === conflictAction)?.name || conflictAction})`
                : `Shortcut for ${label} set to ${newShortcut}`;
            window.showToast(msg, 1800);
        }
    }

    function resetSingleShortcut(actionId) {
        WO.shortcuts[actionId] = DEFAULT_SHORTCUTS[actionId] || '';
        WO.saveShortcuts();
        if (typeof WO.playClickSound === 'function') WO.playClickSound();
        const meta = SHORTCUT_METADATA.find(m => m.id === actionId);
        if (typeof window.showToast === 'function') {
            window.showToast(`Reset ${meta?.name || actionId} to default (${DEFAULT_SHORTCUTS[actionId]})`, 1400);
        }
    }

    function resetAllShortcuts() {
        WO.shortcuts = { ...DEFAULT_SHORTCUTS };
        WO.saveShortcuts();
        if (typeof WO.playClickSound === 'function') WO.playClickSound();
        if (typeof window.showToast === 'function') {
            window.showToast('All shortcuts restored to defaults', 1500);
        }
    }

    function executeShortcutAction(actionId, e) {
        if (actionId === 'focusSearch') {
            if (e) e.preventDefault();
            focusSearch();
            return true;
        }
        if (actionId === 'cycleTheme') {
            if (e) e.preventDefault();
            const t = document.documentElement.dataset.theme;
            WO.setTheme(t === 'light' ? 'dark' : t === 'dark' ? 'solid-dark' : 'light');
            return true;
        }
        if (actionId === 'cycleAccent') {
            if (e) e.preventDefault();
            WO.cycleAccentColor();
            return true;
        }
        if (actionId === 'clearSearch') {
            if (e) e.preventDefault();
            const si = document.getElementById('google-search-input');
            const clrBtn = document.getElementById('clear-search-btn');
            if (si) {
                si.value = '';
                if (clrBtn) clrBtn.style.display = 'none';
                WO.activeKeywordSearchQuery = '';
                WO.renderGroups();
                if (typeof WO.hideSuggestions === 'function') WO.hideSuggestions();
                si.focus();
            }
            return true;
        }
        if (actionId === 'openSettings') {
            if (e) e.preventDefault();
            openPreferences();
            return true;
        }
        if (actionId === 'adminLogin') {
            if (e) e.preventDefault();
            const adminModal = document.getElementById('admin-modal');
            const adminIdInput = document.getElementById('admin-id');
            const adminPasswordInput = document.getElementById('admin-password');
            const adminErrorMsg = document.getElementById('admin-error-msg');
            if (!WO.adminLoggedIn && adminModal) {
                if (adminIdInput) adminIdInput.value = '';
                if (adminPasswordInput) adminPasswordInput.value = '';
                if (adminErrorMsg) adminErrorMsg.style.display = 'none';
                WO.toggleModal(adminModal, true);
                if (adminIdInput) adminIdInput.focus();
            }
            return true;
        }
        if (actionId === 'closeModals') {
            const activeModal = document.querySelector('.modal-container.visible');
            if (activeModal) {
                if (e) e.preventDefault();
                WO.toggleModal(activeModal, false);
                return true;
            }
            if (dialog && dialog.open) {
                if (e) e.preventDefault();
                closePreferences();
                return true;
            }
            const hubWrapper = document.getElementById('admin-hub-wrapper');
            if (hubWrapper && hubWrapper.classList.contains('is-open')) {
                if (e) e.preventDefault();
                hubWrapper.classList.remove('is-open');
                const hubBtn = document.getElementById('admin-hub-btn');
                if (hubBtn) hubBtn.setAttribute('aria-expanded', 'false');
                return true;
            }
            const si = document.getElementById('google-search-input');
            if (document.activeElement === si) {
                if (e) e.preventDefault();
                if (typeof WO.hideSuggestions === 'function') WO.hideSuggestions();
                si.blur();
                return true;
            }
        }
        return false;
    }

    // ── Global Keyboard Shortcuts Listeners ──
    let singleModifierDown = null;
    let singleModifierTime = 0;
    let singleModifierCombo = false;

    window.addEventListener('keydown', e => {
        if (WO._isRecordingShortcut) return;

        if (e.key === 'Control' || e.key === 'Alt') {
            if (!e.repeat) {
                singleModifierDown = e.key;
                singleModifierTime = Date.now();
                singleModifierCombo = false;
            }
            return;
        }
        singleModifierCombo = true;

        const active = document.activeElement;
        const inInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);

        const combo = getEventComboString(e);
        if (!combo) return;

        for (const [actionId, shortcut] of Object.entries(WO.shortcuts)) {
            if (!shortcut || shortcut.toLowerCase() !== combo.toLowerCase()) continue;

            const hasModifiers = e.ctrlKey || e.altKey || e.metaKey;
            if (inInput && !hasModifiers && shortcut !== 'Escape') {
                continue;
            }

            executeShortcutAction(actionId, e);
            break;
        }
    }, { capture: false });

    window.addEventListener('keyup', e => {
        if (WO._isRecordingShortcut) return;
        if ((e.key === 'Control' || e.key === 'Alt') && singleModifierDown === e.key) {
            const elapsed = Date.now() - singleModifierTime;
            const isSingleTap = !singleModifierCombo && elapsed > 0 && elapsed < 350;
            singleModifierDown = null;
            singleModifierCombo = false;

            if (isSingleTap) {
                for (const [actionId, shortcut] of Object.entries(WO.shortcuts)) {
                    if (shortcut === e.key || (e.key === 'Control' && shortcut === 'Ctrl')) {
                        executeShortcutAction(actionId, e);
                        break;
                    }
                }
            }
        }
    }, { capture: true });

    window.addEventListener('mousedown', () => {
        singleModifierCombo = true;
    }, { capture: true });

    window.addEventListener('blur', () => {
        singleModifierDown = null;
        singleModifierCombo = true;
    });

    // Render shortcuts list on initial load
    renderShortcutsList();
    const resetAllBtn = document.getElementById('shortcuts-reset-all');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', resetAllShortcuts);
    }

    apply();
})(window.WO);
