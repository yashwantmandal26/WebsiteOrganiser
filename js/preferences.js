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
        showSeconds: false,
        clockFormat: '12',
        glass: true,
        reducedMotion: false,
        showTagline: true,
        accent: 'purple',
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
        accent: ['purple','blue','pink','teal','orange'],
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
        purple: 'Purple',
        blue: 'Blue',
        pink: 'Pink',
        teal: 'Teal',
        orange: 'Orange',
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
        if (choices[key]) control = `<select name="${key}" id="pref-${key}">${choices[key].map(value=>`<option value="${value}">${key === 'tileCorners' && value === 'soft' ? 'Soft corners' : (names[value] || value)}</option>`).join('')}</select>`;
        else if (ranges[key]) control = `<div class="preference-range"><input id="pref-${key}" name="${key}" type="range" min="${ranges[key][0]}" max="${ranges[key][1]}" step="${key === 'hoverCooldown' ? 10 : 1}"><output for="pref-${key}" data-output="${key}"></output></div>`;
        else control = `<input id="pref-${key}" name="${key}" type="checkbox" role="switch">`;
        return `<label class="preference-row" for="pref-${key}"><span>${label}${description ? `<small>${description}</small>` : ''}</span>${control}</label>`;
    }
    form.innerHTML = `<details class="preference-section" open><summary>Sound studio <span>Tones, volume & feedback</span></summary><fieldset><legend class="sr-only">Sound studio</legend>
        ${row('hoverSound','Hover sounds','Play a tone when you explore website tiles')}${row('hoverTone','Hover tone')}${row('hoverVolume','Hover volume')}
        <button type="button" class="preference-button sound-preview" data-sound="hover">▶ Preview hover tone</button>
        ${row('clickSound','Click sounds','Feedback when you open a website')}${row('clickTone','Click tone')}${row('clickVolume','Click volume')}
        <button type="button" class="preference-button sound-preview" data-sound="click">▶ Preview click tone</button>
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
    <details class="preference-section"><summary>Look & feel <span>Color, glass & movement</span></summary><fieldset><legend class="sr-only">Look and feel</legend>
        ${row('accent','Accent color','Brand, controls and focus highlights')}${row('glass','Glass header','Soft translucent gradient')}${row('reducedMotion','Reduced motion','Minimize animations; your system preference is also respected')}
    </fieldset></details>
    <details class="preference-section"><summary>Website tiles <span>Size, spacing & hover effects</span></summary><fieldset><legend class="sr-only">Website tiles</legend>
        ${row('tileSize','Tile size')}${row('tileSpacing','Tile spacing')}${row('tileCorners','Tile corners')}${row('hoverEffect','Hover effect')}${row('showCategoryIcons','Category icons')}
    </fieldset></details>
    <details class="preference-section"><summary>Header, Quick Bar & Clock <span>Weather, Top Hits & details</span></summary><fieldset><legend class="sr-only">Header and clock</legend>
        ${row('showWeather','Show weather widget','Subtle temperature & icon next to clock')}${row('showTopHits','Show Top Hits bar','Automatic 1-click access to most clicked websites')}${row('showClock','Show clock','Visible on wide screens')}${row('showSeconds','Show seconds')}${row('clockFormat','Time format')}${row('showTagline','Brand tagline')}
    </fieldset></details>
    <div class="preferences-footer"><span id="preferences-status" role="status">Saved on this device</span><button type="button" id="preferences-reset" class="preference-button">Reset defaults</button></div>`;

    function normalize(saved) {
        const result = {...defaults};
        if (!saved || typeof saved !== 'object') return result;
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

    function apply() {
        const p = WO.preferences, root = document.documentElement;
        for (const key of ['showClock','showSeconds','clockFormat','glass','reducedMotion','showTagline','accent','tileSize','tileSpacing','tileCorners','hoverEffect','showCategoryIcons','showWeather','showTopHits']) root.dataset[key] = String(p[key]);
        const accents = {purple:['#9750e9','#ca9aff'],blue:['#2876d7','#82baff'],pink:['#d23e90','#ff9dcb'],teal:['#087e80','#6fe0d4'],orange:['#b96313','#ffc17e']};
        if (accents[p.accent]) {
            root.style.setProperty('--preference-accent', accents[p.accent][0]);
            root.style.setProperty('--preference-accent-light', accents[p.accent][1]);
        }

        // Apply Wallpaper
        const wpEl = document.getElementById('app-wallpaper');
        const wpOverlay = document.getElementById('app-wallpaper-overlay');
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
                wpEl.style.filter = `blur(${p.wallpaperBlur || 0}px)`;
            }
            if (wpOverlay) {
                wpOverlay.style.backgroundColor = `rgba(0, 0, 0, ${(p.wallpaperDim || 25) / 100})`;
            }
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
    form.addEventListener('input', e => {
        const input = e.target;
        if (!Object.hasOwn(defaults, input.name)) return;
        WO.preferences[input.name] = input.type === 'checkbox' ? input.checked : input.type === 'range' ? Number(input.value) : input.value;
        save();
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

    form.querySelectorAll('[data-sound]').forEach(button => button.addEventListener('click', () => {
        const played = WO.playPreferenceSound(button.dataset.sound, true);
        document.getElementById('preferences-status').textContent = played ? 'Previewing ' + button.dataset.sound + ' tone' : 'Increase master and tone volume to preview';
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
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !dialog.open) {
            e.preventDefault();
            focusSearch();
        }
    });

    apply();
})(window.WO);
