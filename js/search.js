// =============================================================================
// js/search.js — Hybrid Smart Search (Keywords first, Google fallback)
// =============================================================================
// Behaviour:
//   • User types → run live keyword search against WO.groups
//   • Keywords found  → show suggestion cards (existing keyword UI)
//   • No keywords     → hide dropdown silently (no noise)
//   • Empty input     → show recent Google search history
//   • Enter           → if keyword suggestions exist → open first/selected
//                       else → Google search
//   • Live group card filtering still works (activeKeywordSearchQuery)
// =============================================================================

(function (WO) {

    // ── Fallback Search Engines (Device-Only Custom Fallback) ─────────────
    const SEARCH_ENGINES = {
        google:     { name: 'Google',        url: q => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
        youtube:    { name: 'YouTube',       url: q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
        duckduckgo: { name: 'DuckDuckGo',   url: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
        perplexity: { name: 'Perplexity AI', url: q => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}` },
        chatgpt:    { name: 'ChatGPT',       url: q => `https://chatgpt.com/?q=${encodeURIComponent(q)}` },
        bing:       { name: 'Microsoft Bing', url: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
        github:     { name: 'GitHub',        url: q => `https://github.com/search?q=${encodeURIComponent(q)}` }
    };
    WO.SEARCH_ENGINES = SEARCH_ENGINES;

    function getSearchFallbackEngine() {
        if (WO.preferences && WO.preferences.customSearchFallback && WO.preferences.searchEngine) {
            return SEARCH_ENGINES[WO.preferences.searchEngine] || SEARCH_ENGINES.google;
        }
        return SEARCH_ENGINES.google;
    }
    WO.getSearchFallbackEngine = getSearchFallbackEngine;

    WO.initSearch = function () {
        const searchInput       = document.getElementById('google-search-input');
        const searchSubmitBtn   = document.getElementById('search-submit-btn');
        const clearSearchBtn    = document.getElementById('clear-search-btn');
        const voiceSearchBtn    = document.getElementById('voice-search-btn');
        const searchSuggestions = document.getElementById('search-suggestions');
        const _searchBarWrapper = document.querySelector('.search-bar-wrapper') || (searchInput ? searchInput.closest('.search-bar-wrapper') : null);

        if (!searchInput) return;

        // ── Google Lens Image Search & Drag-Drop ───────────────────────────
        const pastedImageChip   = document.getElementById('pasted-image-chip');
        const pastedImageThumb  = document.getElementById('pasted-image-thumb');
        const pastedImageRemove = document.getElementById('pasted-image-remove');
        const lensSearchBtn     = document.getElementById('lens-search-btn');

        let _pastedImageDataUrl = null;
        let _pastedImageBlob = null;
        let _pastedImageIsDirectUrl = false;
        let _uploadedLensUrl = null;
        let _isUploadingLens = false;

        async function uploadImageForLens(blob) {
            if (!blob) return;
            _isUploadingLens = true;
            _uploadedLensUrl = null;
            try {
                const ext = (blob.type && blob.type.split('/')[1]) || 'png';
                const filename = 'search_' + Date.now() + '.' + ext;
                const fd = new FormData();
                fd.append('file', blob, filename);

                // Primary host: kappa.lol (CORS enabled, direct raw image file served, accepted by Google Lens)
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    const res = await fetch('https://kappa.lol/api/upload', {
                        method: 'POST',
                        body: fd,
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    if (res.ok) {
                        const json = await res.json();
                        if (json && json.link) {
                            _uploadedLensUrl = json.link;
                            console.log('[Google Lens] Direct image ready via kappa:', _uploadedLensUrl);
                            return;
                        }
                    }
                } catch (e1) {
                    console.warn('[Google Lens] kappa.lol upload failed, trying fallback:', e1);
                }

                // Fallback host: sxcu.net (CORS enabled, direct image at url.png)
                try {
                    const controller2 = new AbortController();
                    const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
                    const fd2 = new FormData();
                    fd2.append('file', blob, filename);
                    const res2 = await fetch('https://sxcu.net/api/files/create', {
                        method: 'POST',
                        body: fd2,
                        signal: controller2.signal
                    });
                    clearTimeout(timeoutId2);
                    if (res2.ok) {
                        const json2 = await res2.json();
                        if (json2 && json2.url) {
                            _uploadedLensUrl = json2.url + '.png';
                            console.log('[Google Lens] Direct image ready via sxcu:', _uploadedLensUrl);
                            return;
                        }
                    }
                } catch (e2) {
                    console.warn('[Google Lens] sxcu.net fallback failed:', e2);
                }
            } catch (err) {
                console.warn('[Google Lens] Upload error:', err);
            } finally {
                _isUploadingLens = false;
            }
        }

        const imagePreviewModal        = document.getElementById('image-preview-modal');
        const imagePreviewModalImg     = document.getElementById('image-preview-modal-img');
        const imagePreviewModalClose   = document.getElementById('image-preview-modal-close');
        const imagePreviewModalRemove  = document.getElementById('image-preview-modal-remove-btn');
        const imagePreviewModalSearch  = document.getElementById('image-preview-modal-search-btn');

        function openImagePreviewModal() {
            if (!_pastedImageDataUrl || !imagePreviewModal || !imagePreviewModalImg) return;
            imagePreviewModalImg.src = _pastedImageDataUrl;
            imagePreviewModal.style.display = 'flex';
            imagePreviewModal.setAttribute('aria-hidden', 'false');
        }

        function closeImagePreviewModal() {
            if (!imagePreviewModal) return;
            imagePreviewModal.style.display = 'none';
            imagePreviewModal.setAttribute('aria-hidden', 'true');
            if (searchInput) searchInput.focus();
        }

        function showPastedImageChip(src) {
            if (!pastedImageChip || !pastedImageThumb) return;
            pastedImageThumb.src = src;
            pastedImageChip.style.display = 'inline-flex';
            hideSuggestions();
            if (clearSearchBtn) clearSearchBtn.style.display = 'block';
            if (searchInput) {
                searchInput.placeholder = 'Search image with Google Lens ↵';
                searchInput.focus();
                // Re-trigger focus across multiple delays to guarantee focus even after Windows OS flyout (Win+V) finishes closing
                setTimeout(() => { if (_pastedImageDataUrl && searchInput) searchInput.focus(); }, 60);
                setTimeout(() => { if (_pastedImageDataUrl && searchInput) searchInput.focus(); }, 180);
                setTimeout(() => { if (_pastedImageDataUrl && searchInput) searchInput.focus(); }, 350);
            }
        }

        function clearPastedImage() {
            _pastedImageDataUrl = null;
            _pastedImageBlob = null;
            _pastedImageIsDirectUrl = false;
            _uploadedLensUrl = null;
            _isUploadingLens = false;
            closeImagePreviewModal();
            if (pastedImageChip) pastedImageChip.style.display = 'none';
            if (pastedImageThumb) pastedImageThumb.src = '';
            if (lensSearchBtn) {
                lensSearchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4"/></svg><span>Google Lens</span><span class="chip-badge-hint" id="lens-chip-hint">Enter ↵</span>';
            }
            updateSearchPlaceholder();
            if (clearSearchBtn && (!searchInput || !searchInput.value.trim())) {
                clearSearchBtn.style.display = 'none';
            }
        }
        WO.clearPastedImage = clearPastedImage;

        async function executeGoogleLensSearch(inNewTab = false) {
            if (!_pastedImageDataUrl) return;

            // 1. Direct public image link already available
            if (_pastedImageIsDirectUrl && _pastedImageDataUrl.startsWith('http')) {
                const lensUrl = 'https://lens.google.com/uploadbyurl?url=' + encodeURIComponent(_pastedImageDataUrl);
                WO.openURLWithBrowser(lensUrl, inNewTab);
                if (typeof window.showToast === 'function') {
                    window.showToast('🔍 Searching with Google Lens...', 3000);
                }
                clearPastedImage();
                if (searchInput) { searchInput.value = ''; searchInput.blur(); }
                hideSuggestions();
                return;
            }

            // 2. Wait up to 2.2s if background upload is still in flight
            if (_isUploadingLens && !_uploadedLensUrl) {
                if (lensSearchBtn) {
                    lensSearchBtn.innerHTML = '<span class="lens-spinner"></span> <span>Searching...</span>';
                }
                let waited = 0;
                while (_isUploadingLens && waited < 2200) {
                    await new Promise(r => setTimeout(r, 100));
                    waited += 100;
                }
            }

            // 3. Direct Google Lens Reverse Image Results via uploaded URL
            if (_uploadedLensUrl) {
                const lensUrl = 'https://lens.google.com/uploadbyurl?url=' + encodeURIComponent(_uploadedLensUrl);
                WO.openURLWithBrowser(lensUrl, inNewTab);
                if (typeof window.showToast === 'function') {
                    window.showToast('🔍 Opening Google Lens Visual Results...', 3000);
                }
                clearPastedImage();
                if (searchInput) { searchInput.value = ''; searchInput.blur(); }
                hideSuggestions();
                return;
            }

            // 4. Fallback if upload failed or offline: write to clipboard & open Google Lens
            if (_pastedImageBlob && navigator.clipboard && window.ClipboardItem) {
                try {
                    navigator.clipboard.write([
                        new ClipboardItem({ [_pastedImageBlob.type || 'image/png']: _pastedImageBlob })
                    ]).catch(() => {});
                } catch {}
            }
            WO.openURLWithBrowser('https://lens.google.com/', inNewTab);
            if (typeof window.showToast === 'function') {
                window.showToast('🔍 Google Lens opened! Press Ctrl+V in Google Lens to search your screenshot.', 4500);
            }

            clearPastedImage();
            if (searchInput) {
                searchInput.value = '';
                searchInput.blur();
            }
            hideSuggestions();
        }

        function processImageFile(file) {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                _pastedImageDataUrl = ev.target.result;
                _pastedImageBlob = file;
                _pastedImageIsDirectUrl = false;
                showPastedImageChip(_pastedImageDataUrl);
                // Immediately upload in background so Google Lens direct URL is ready
                uploadImageForLens(file);
            };
            reader.readAsDataURL(file);
        }

        function processDirectImageUrl(url) {
            if (!url) return;
            _pastedImageDataUrl = url;
            _pastedImageBlob = null;
            _pastedImageIsDirectUrl = !url.startsWith('data:');
            _uploadedLensUrl = _pastedImageIsDirectUrl ? url : null;
            showPastedImageChip(_pastedImageDataUrl);
        }

        function handleSearchPaste(e) {
            const clipboardData = e.clipboardData || window.clipboardData;
            if (!clipboardData) return;

            // 1. Check for image item in clipboardData.items (screenshots, copied files)
            let imageFile = null;
            if (clipboardData.items) {
                for (let i = 0; i < clipboardData.items.length; i++) {
                    const item = clipboardData.items[i];
                    if (item.type && item.type.startsWith('image/')) {
                        imageFile = item.getAsFile();
                        if (imageFile) break;
                    }
                }
            }

            // 2. Fallback to clipboardData.files
            if (!imageFile && clipboardData.files && clipboardData.files.length) {
                for (let i = 0; i < clipboardData.files.length; i++) {
                    const file = clipboardData.files[i];
                    const name = (file.name || '').toLowerCase();
                    if ((file.type && file.type.startsWith('image/')) || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.gif') || name.endsWith('.bmp') || name.endsWith('.svg') || name.endsWith('.avif')) {
                        imageFile = file;
                        break;
                    }
                }
            }

            if (imageFile) {
                e.preventDefault();
                processImageFile(imageFile);
                return;
            }

            // 3. Check for HTML containing an <img> tag (copied from web page)
            const html = clipboardData.getData('text/html');
            if (html && (!searchInput || !searchInput.value.trim())) {
                const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch && imgMatch[1]) {
                    const src = imgMatch[1].trim();
                    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/')) {
                        e.preventDefault();
                        processDirectImageUrl(src);
                        return;
                    }
                }
            }

            // 4. Check for direct image URL or base64 data URI in text
            const text = clipboardData.getData('text');
            if (text) {
                const trimmed = text.trim();
                if (trimmed.startsWith('data:image/')) {
                    e.preventDefault();
                    processDirectImageUrl(trimmed);
                    return;
                }
                const isImgUrl = (trimmed.startsWith('http://') || trimmed.startsWith('https://')) && (/\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(trimmed));
                if (isImgUrl && (!searchInput || !searchInput.value.trim())) {
                    e.preventDefault();
                    processDirectImageUrl(trimmed);
                    return;
                }
            }
        }

        function handleImageDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            if (_searchBarWrapper) _searchBarWrapper.classList.remove('drag-target-active');

            const dt = e.dataTransfer;
            if (!dt) return;

            // 1. Dropped files (desktop/folder/screenshots)
            if (dt.files && dt.files.length) {
                for (let i = 0; i < dt.files.length; i++) {
                    const file = dt.files[i];
                    const name = (file.name || '').toLowerCase();
                    if ((file.type && file.type.startsWith('image/')) || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.gif') || name.endsWith('.bmp') || name.endsWith('.svg') || name.endsWith('.avif')) {
                        processImageFile(file);
                        return;
                    }
                }
            }

            // 2. Dropped items (Snipping Tool, browser drag, etc.)
            if (dt.items && dt.items.length) {
                for (let i = 0; i < dt.items.length; i++) {
                    const item = dt.items[i];
                    if ((item.type && item.type.startsWith('image/')) || item.kind === 'file') {
                        const file = item.getAsFile();
                        if (file) {
                            const name = (file.name || '').toLowerCase();
                            if ((file.type && file.type.startsWith('image/')) || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.gif') || name.endsWith('.bmp') || name.endsWith('.svg') || name.endsWith('.avif')) {
                                processImageFile(file);
                                return;
                            }
                        }
                    }
                }
            }

            // 3. Dropped image from webpage (<img> tag or anchor)
            const html = dt.getData('text/html');
            if (html) {
                const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch && imgMatch[1]) {
                    const src = imgMatch[1].trim();
                    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/')) {
                        processDirectImageUrl(src);
                        return;
                    }
                }
            }

            // 4. Dropped image URL (text/uri-list or text)
            const uri = dt.getData('text/uri-list') || dt.getData('text');
            if (uri) {
                const trimmed = uri.trim();
                if (trimmed.startsWith('data:image/')) {
                    processDirectImageUrl(trimmed);
                    return;
                }
                const isImgUrl = (trimmed.startsWith('http://') || trimmed.startsWith('https://')) && (/\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(trimmed));
                if (isImgUrl) {
                    processDirectImageUrl(trimmed);
                    return;
                }
            }
        }

        function updateSuggestionsPosition() {
            if (!searchSuggestions) return;
            const wrapper = _searchBarWrapper || document.querySelector('.search-bar-wrapper');
            if (!wrapper) return;
            const rect = wrapper.getBoundingClientRect();
            searchSuggestions.style.top = Math.round(rect.bottom + 8) + 'px';
            searchSuggestions.style.left = Math.round(rect.left) + 'px';
            searchSuggestions.style.width = Math.round(rect.width) + 'px';
        }
        window.addEventListener('resize', updateSuggestionsPosition, { passive: true });
        window.addEventListener('scroll', updateSuggestionsPosition, { passive: true });

        // ── History Helpers ───────────────────────────────────────────────────
        let _historyCache = null;
        function loadHistory() {
            if (_historyCache) return _historyCache;
            try { const h = localStorage.getItem(WO.SEARCH_HISTORY_KEY); _historyCache = h ? JSON.parse(h) : []; } catch { _historyCache = []; }
            return _historyCache;
        }
        function saveHistory(query) {
            if (!query || !query.trim()) return;
            try {
                _historyCache = loadHistory().filter(i => i.toLowerCase() !== query.toLowerCase());
                _historyCache.unshift(query); _historyCache = _historyCache.slice(0, WO.MAX_HISTORY);
                localStorage.setItem(WO.SEARCH_HISTORY_KEY, JSON.stringify(_historyCache));
            } catch {}
        }
        function clearHistory() { _historyCache = []; try { localStorage.removeItem(WO.SEARCH_HISTORY_KEY); } catch {} }
        function deleteHistoryItem(query) {
            try {
                _historyCache = loadHistory().filter(i => i.toLowerCase() !== query.toLowerCase());
                localStorage.setItem(WO.SEARCH_HISTORY_KEY, JSON.stringify(_historyCache));
            } catch {}
        }

        // ── Suggestion visibility helpers ─────────────────────────────────────
        function hideSuggestions() {
            searchSuggestions.style.display = 'none';
            searchSuggestions.innerHTML = '';
            WO.selectedSuggestionIndex = -1;
            WO.selectedKeywordSuggestionIndex = -1;
            WO.currentSuggestions = [];
            WO.currentKeywordSuggestions = [];
        }
        WO.hideSuggestions = hideSuggestions; // expose for global keyboard shortcuts

        // ── Keyword search core ───────────────────────────────────────────────
        function getKeywordSearchResults(query) {
            const nq     = WO.normalizeSearchQuery(query);
            const tokens = nq.toLowerCase().split(/\s+/).filter(Boolean);
            const results = [];
            WO.groups.forEach((group, gi) => {
                group.keywords.forEach((keyword, ki) => {
                    const { displayText, targetUrl } = WO.parseKeyword(keyword);
                    const ek   = WO.getBookmarkMetadataKey(gi, ki, keyword);
                    const desc = WO.getBookmarkMetadata(WO.keywordDescriptions, gi, ki, keyword, '');
                    const tags = group.keywordTags && group.keywordTags[ek] || [];
                    const st   = [keyword, displayText, targetUrl, desc, tags.join(' '), group.name].join(' ').toLowerCase();
                    if (!WO.matchesKeywordSearch(st, tokens)) return;
                    const clickCount = WO.getBookmarkClickCount ? WO.getBookmarkClickCount(gi, ki, keyword) : 0;
                    const candidate = { groupIndex: gi, keywordIndex: ki, keyword, displayText, targetUrl, description: desc, tags, groupName: group.name, clickCount };
                    candidate.score = WO.calculateSearchScore ? WO.calculateSearchScore(candidate, nq) : 2;
                    results.push(candidate);
                });
            });
            return results.sort((a, b) => {
                if (a.score !== b.score) return a.score - b.score;
                const ca = a.clickCount || 0;
                const cb = b.clickCount || 0;
                if (cb !== ca) return cb - ca;
                if (a.displayText.length !== b.displayText.length) {
                    return a.displayText.length - b.displayText.length;
                }
                return a.displayText.localeCompare(b.displayText, undefined, { sensitivity: 'base' });
            }).slice(0, WO.MAX_SEARCH_RESULTS);
        }

        // ── Favicon helper ────────────────────────────────────────────────────
        function getFaviconUrl(targetUrl) {
            try {
                const url = targetUrl.startsWith('http') ? targetUrl : 'https://' + targetUrl;
                const hostname = new URL(url).hostname.replace(/^www\./, '');
                return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
            } catch { return null; }
        }

        function renderKeywordSuggestions(results, query) {
            if (!results || !results.length) { hideSuggestions(); return; }
            let html = '<div class="suggestion-header"><span>Website matches</span></div>';
            results.forEach((r, i) => {
                const snippet = r.description ? WO.buildSearchSnippet(r.description, query) : '';
                const meta = [r.groupName && WO.escapeHtml(r.groupName), snippet && WO.highlightSearchHtml(snippet, query)].filter(Boolean).join(' &middot; ');
                const faviconUrl = r.targetUrl ? getFaviconUrl(r.targetUrl) : null;
                const iconHtml = faviconUrl
                    ? `<img class="suggestion-favicon" src="${WO.escapeHtml(faviconUrl)}" alt="" loading="lazy"
                           onload="if(this.naturalWidth<=16){this.style.display='none';this.nextElementSibling.style.display='inline-block';}"
                           onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'"
                       /><svg class="suggestion-icon suggestion-icon-fallback" style="display:none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
                    : `<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
                html += `<div class="suggestion-item keyword-suggestion-item" data-index="${i}" data-suggestion-mode="keywords" data-group-index="${r.groupIndex}" data-keyword-index="${r.keywordIndex}" data-target-url="${WO.escapeHtml(r.targetUrl || '')}">
                    ${iconHtml}
                    <div class="keyword-suggestion-content">
                        <span class="suggestion-text">${WO.highlightSearchHtml(r.displayText, query)}</span>
                        ${meta ? `<div class="keyword-suggestion-meta">${meta}</div>` : ''}
                    </div>
                </div>`;
            });
            updateSuggestionsPosition();
            searchSuggestions.innerHTML = html;
            searchSuggestions.style.display = 'block';
        }

        // ── History suggestion (empty-input focus) ────────────────────────────
        function renderHistorySuggestions() {
            const history = loadHistory();
            if (!history.length) { hideSuggestions(); return; }
            WO.currentSuggestions = history.slice(0, 5);
            WO.selectedSuggestionIndex = -1;
            let html = '<div class="suggestion-header"><span>Recent Searches</span></div>';
            WO.currentSuggestions.forEach((s, i) => {
                const icon = '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
                const delBtn = `<button class="suggestion-delete-btn" data-action="delete-item" data-query="${WO.escapeHtml(s)}" title="Remove" aria-label="Remove from history"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
                html += `<div class="suggestion-item" data-index="${i}" data-query="${WO.escapeHtml(s)}" data-suggestion-mode="google">${icon}<span class="suggestion-text">${WO.escapeHtml(s)}</span>${delBtn}</div>`;
            });
            html += `<div class="suggestion-item suggestion-clear-all" data-action="clear-history" data-suggestion-mode="google"><svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg><span class="suggestion-text">Clear all history</span></div>`;
            updateSuggestionsPosition();
            searchSuggestions.innerHTML = html;
            searchSuggestions.style.display = 'block';
        }

        // ── Hybrid: main entry point for showing suggestions ──────────────────
        function showSuggestions(query) {
            if (_pastedImageDataUrl) { hideSuggestions(); return; }
            const nq = WO.normalizeSearchQuery(query);

            // Empty input → show history (or nothing)
            if (!nq) {
                WO.currentKeywordSuggestions = [];
                renderHistorySuggestions();
                return;
            }

            // Trailing space → user wants Google search, hide suggestions
            if (query !== query.trimEnd()) {
                WO.currentKeywordSuggestions = [];
                WO.selectedKeywordSuggestionIndex = -1;
                hideSuggestions();
                return;
            }

            // Try keyword search first
            const kwResults = getKeywordSearchResults(nq);
            WO.currentKeywordSuggestions = kwResults;
            WO.selectedKeywordSuggestionIndex = kwResults.length > 0 ? 0 : -1;

            if (kwResults.length > 0) {
                // ✅ Keyword matches → show them
                renderKeywordSuggestions(kwResults, nq);
                updateSelectedKeywordSuggestion();
            } else {
                // ❌ No matches → hide dropdown silently (Google on Enter)
                hideSuggestions();
            }
        }

        // ── Selection helpers ─────────────────────────────────────────────────
        function updateSelectedSuggestion() {
            const items = searchSuggestions.querySelectorAll('.suggestion-item');
            items.forEach((it, i) => {
                it.classList.toggle('selected', i === WO.selectedSuggestionIndex);
                if (i === WO.selectedSuggestionIndex) {
                    searchInput.value = it.dataset.query || searchInput.value;
                    it.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            });
        }
        function updateSelectedKeywordSuggestion() {
            searchSuggestions.querySelectorAll('.suggestion-item').forEach((it, i) => {
                it.classList.toggle('selected', i === WO.selectedKeywordSuggestionIndex);
                if (i === WO.selectedKeywordSuggestionIndex) {
                    it.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            });
        }

        // ── Search Placeholder & Fallback Setup ─────────────────────────────

        function updateSearchPlaceholder() {
            if (!searchInput) return;
            if (_pastedImageDataUrl) { searchInput.placeholder = "Press Enter to search with Google Lens..."; return; }
            const engine = getSearchFallbackEngine();
            if (WO.preferences && WO.preferences.customSearchFallback && engine.name !== 'Google') {
                searchInput.placeholder = `Search websites or fallback to ${engine.name}...`;
            } else {
                searchInput.placeholder = 'Search websites, games, tools...';
            }
        }
        document.addEventListener('wo-preferences-changed', updateSearchPlaceholder);
        updateSearchPlaceholder();

        // ── Google / Custom Engine Fallback Search ────────────────────────────
        function performGoogleSearch(query, inNewTab = false) {
            if (!query || !query.trim()) return;
            const tq = query.trim();
            const direct = WO.getDirectWebsiteUrl(tq);
            if (direct) {
                WO.openURLWithBrowser(direct, inNewTab);
            } else {
                saveHistory(tq);
                const engine = getSearchFallbackEngine();
                WO.openURLWithBrowser(engine.url(tq), inNewTab);
            }
            searchInput.value = '';
            searchInput.blur();
            hideSuggestions();
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        }

        // ── Submit (Enter / button click) ─────────────────────────────────────
        function submitFromBar(inNewTab = false) {
            _baseQueryPrefix = '';
            if (_pastedImageDataUrl) { executeGoogleLensSearch(inNewTab); return; }
            const rawValue = searchInput.value;
            const tq = WO.normalizeSearchQuery(rawValue);
            if (!tq) { searchInput.focus(); return; }

            // Trailing space → user explicitly wants Google search, skip keyword suggestions
            const hasTrailingSpace = rawValue !== rawValue.trimEnd();

            // Admin shortcut: typing /admin or !admin in search bar opens Admin Login
            if (tq === '/admin' || tq === '!admin' || tq === '#admin' || tq === 'admin') {
                searchInput.value = '';
                searchInput.blur();
                hideSuggestions();
                if (clearSearchBtn) clearSearchBtn.style.display = 'none';
                const adminModal = document.getElementById('admin-modal');
                const adminIdInput = document.getElementById('admin-id-input');
                if (adminModal) {
                    WO.toggleModal(adminModal, true);
                    if (adminIdInput) adminIdInput.focus();
                }
                return;
            }

            // Direct URL shortcut (e.g. "youtube") — only when no trailing space
            if (!hasTrailingSpace) {
                const direct = WO.getDirectWebsiteUrl(tq);
                if (direct) { WO.openURLWithBrowser(direct, inNewTab); searchInput.value = ''; searchInput.blur(); hideSuggestions(); if (clearSearchBtn) clearSearchBtn.style.display = 'none'; return; }
            }

            // Keyword suggestion selected via arrow keys → open it; otherwise open first suggestion
            // Skip entirely if user typed a trailing space (explicit Google search intent)
            if (!hasTrailingSpace && WO.currentKeywordSuggestions && WO.currentKeywordSuggestions.length) {
                const idx = WO.selectedKeywordSuggestionIndex >= 0 ? WO.selectedKeywordSuggestionIndex : 0;
                const r = WO.currentKeywordSuggestions[idx];
                if (r) {
                    if (r.keyword && r.groupIndex != null) WO.incrementKeywordClick(r.groupIndex, r.keyword);
                    WO.openURLWithBrowser(r.targetUrl, inNewTab);
                    searchInput.value = ''; searchInput.blur(); hideSuggestions();
                    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
                    return;
                }
            }

            // Fallback → Google search
            performGoogleSearch(tq, inNewTab);
        }

        // ── Suggestion click handlers ─────────────────────────────────────────
        function handleSuggestionClick(item, e) {
            const mode = item.dataset.suggestionMode || 'google';
            if (mode === 'keywords') {
                const r = WO.currentKeywordSuggestions[Number(item.dataset.index)];
                if (r) {
                    e.preventDefault(); e.stopPropagation();
                    if (r.keyword && r.groupIndex != null) WO.incrementKeywordClick(r.groupIndex, r.keyword);
                    WO.openURLWithBrowser(r.targetUrl, e.ctrlKey || e.metaKey);
                    searchInput.value = ''; searchInput.blur(); hideSuggestions();
                    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
                }
                return;
            }
            if (item.dataset.action === 'clear-history') { clearHistory(); hideSuggestions(); searchInput.value = ''; searchInput.focus(); return; }
            const q = item.dataset.query; if (q) performGoogleSearch(q);
        }
        function handleSuggestionAuxClick(item, e) {
            if (e.button !== 1) return;
            const mode = item.dataset.suggestionMode || 'google';
            if (mode === 'keywords') {
                const r = WO.currentKeywordSuggestions[Number(item.dataset.index)];
                if (r) {
                    e.preventDefault(); e.stopPropagation();
                    if (r.keyword && r.groupIndex != null) WO.incrementKeywordClick(r.groupIndex, r.keyword);
                    WO.openURLWithBrowser(r.targetUrl, true);
                }
                return;
            }
            const q = item.dataset.query; if (q) { e.preventDefault(); e.stopPropagation(); performGoogleSearch(q, true); }
        }

        // ── Input event (Snappy instant filtering) ───────────────────────────
        let _searchRenderRaf = null;
        let _suggestionsTimer = null;
        searchInput.addEventListener('input', e => {
            const q  = e.target.value;
            const nq = WO.normalizeSearchQuery(q);
            if (clearSearchBtn) clearSearchBtn.style.display = nq.length > 0 ? 'block' : 'none';

            // Update live card filtering immediately
            WO.activeKeywordSearchQuery = nq;

            // Instantly filter tiles in next animation frame (0-16ms)
            if (_searchRenderRaf) cancelAnimationFrame(_searchRenderRaf);
            _searchRenderRaf = requestAnimationFrame(() => {
                WO.updateSearchHighlighting();
            });

            // Smooth debounce for dropdown suggestions (35ms)
            clearTimeout(_suggestionsTimer);
            _suggestionsTimer = setTimeout(() => {
                showSuggestions(q);
            }, 35);
        });


        searchInput.addEventListener('focus', () => {
            showSuggestions(searchInput.value);
        });

        // ── Keyboard navigation ───────────────────────────────────────────────
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                if (_isVoiceListening) stopVoiceSearch(false);
                if (_pastedImageDataUrl) {
                    e.preventDefault();
                    executeGoogleLensSearch(e.ctrlKey || e.metaKey);
                    return;
                }
                e.preventDefault();
                submitFromBar(e.ctrlKey || e.metaKey);
                return;
            }
            if (e.key === 'Escape') {
                if (_isVoiceListening) {
                    e.preventDefault();
                    stopVoiceSearch(true);
                    return;
                }
                if (_pastedImageDataUrl) {
                    e.preventDefault();
                    clearPastedImage();
                    return;
                }
                hideSuggestions();
                searchInput.blur();
                return;
            }
            if ((e.key === 'Backspace' || e.key === 'Delete') && searchInput.value === '' && _pastedImageDataUrl) {
                clearPastedImage();
                return;
            }

            const hasKW = WO.currentKeywordSuggestions && WO.currentKeywordSuggestions.length > 0;
            const hasGoogle = WO.currentSuggestions && WO.currentSuggestions.length > 0;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (hasKW) { WO.selectedKeywordSuggestionIndex = Math.min(WO.selectedKeywordSuggestionIndex + 1, WO.currentKeywordSuggestions.length - 1); updateSelectedKeywordSuggestion(); }
                else if (hasGoogle) { WO.selectedSuggestionIndex = Math.min(WO.selectedSuggestionIndex + 1, WO.currentSuggestions.length - 1); updateSelectedSuggestion(); }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (hasKW) { WO.selectedKeywordSuggestionIndex = Math.max(WO.selectedKeywordSuggestionIndex - 1, 0); updateSelectedKeywordSuggestion(); }
                else if (hasGoogle) { WO.selectedSuggestionIndex = Math.max(WO.selectedSuggestionIndex - 1, -1); updateSelectedSuggestion(); }
            }
        });

        // ── Voice Search (Speech Recognition) ─────────────────────────────────
        let _voiceRecognition = null;
        let _isVoiceListening = false;
        let _speechOriginalPlaceholder = '';
        let _baseQueryPrefix = '';

        function stopVoiceSearch(restoreFocus = true) {
            if (_voiceRecognition) {
                try {
                    _voiceRecognition.stop();
                } catch (_) {}
            }
            _isVoiceListening = false;
            if (voiceSearchBtn) {
                voiceSearchBtn.classList.remove('is-listening');
                voiceSearchBtn.setAttribute('aria-pressed', 'false');
                voiceSearchBtn.title = 'Search with voice';
            }
            if (searchInput && _speechOriginalPlaceholder) {
                if (searchInput.placeholder === 'Listening... Speak now') {
                    searchInput.placeholder = _speechOriginalPlaceholder;
                }
            }
            if (restoreFocus && searchInput) {
                searchInput.focus();
                const len = searchInput.value.length;
                try { searchInput.setSelectionRange(len, len); } catch (_) {}
            }
        }
        WO.stopVoiceSearch = stopVoiceSearch;

        if (voiceSearchBtn) {
            voiceSearchBtn.addEventListener('click', e => {
                e.preventDefault();

                // Haptic feedback on mobile if supported
                if (navigator.vibrate) {
                    try { navigator.vibrate(20); } catch (_) {}
                }

                const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRec) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('Voice search is not supported in this browser.', 3500);
                    }
                    return;
                }

                // Toggle off if currently listening
                if (_isVoiceListening) {
                    stopVoiceSearch(true);
                    return;
                }

                try {
                    // Capture existing input text so repeated mic activations append rather than overwrite
                    const existingText = (searchInput.value || '').trim();
                    _baseQueryPrefix = existingText.length > 0 ? (existingText + ' ') : '';

                    _voiceRecognition = new SpeechRec();
                    _voiceRecognition.continuous = true;
                    _voiceRecognition.interimResults = true;
                    _voiceRecognition.maxAlternatives = 1;
                    _voiceRecognition.lang = navigator.language || 'en-US';

                    _speechOriginalPlaceholder = searchInput.placeholder || 'Search websites, games, tools...';

                    _voiceRecognition.onstart = function () {
                        _isVoiceListening = true;
                        voiceSearchBtn.classList.add('is-listening');
                        voiceSearchBtn.setAttribute('aria-pressed', 'true');
                        voiceSearchBtn.title = 'Listening... Tap to stop';
                        searchInput.placeholder = 'Listening... Speak now';
                    };

                    _voiceRecognition.onresult = function (event) {
                        let interimText = '';
                        let finalText = '';

                        // Accumulate all finalized chunks and interim speech in this session
                        for (let i = 0; i < event.results.length; ++i) {
                            const res = event.results[i];
                            if (res.isFinal) {
                                finalText += res[0].transcript + ' ';
                            } else {
                                interimText += res[0].transcript;
                            }
                        }

                        const sessionTranscript = (finalText + interimText).trim();
                        if (sessionTranscript) {
                            const combinedQuery = _baseQueryPrefix + sessionTranscript;
                            searchInput.value = combinedQuery;
                            if (clearSearchBtn) clearSearchBtn.style.display = 'block';
                            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    };

                    _voiceRecognition.onerror = function (event) {
                        console.warn('[Voice Search] Error:', event.error);
                        stopVoiceSearch(true);

                        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                            if (typeof window.showToast === 'function') {
                                window.showToast('Microphone access was denied. Please allow microphone permissions.', 4000);
                            }
                        } else if (event.error === 'network') {
                            if (typeof window.showToast === 'function') {
                                window.showToast('Voice recognition network error. Please check internet connection.', 3500);
                            }
                        } else if (event.error === 'no-speech') {
                            if (typeof window.showToast === 'function') {
                                window.showToast('No speech detected. Tap mic and try again.', 2500);
                            }
                        }
                    };

                    _voiceRecognition.onend = function () {
                        stopVoiceSearch(true);
                        // NOTE: Search will ONLY execute after user presses Enter or clicks Search submit button!
                    };

                    _voiceRecognition.start();
                } catch (err) {
                    console.error('[Voice Search] Failed to start:', err);
                    stopVoiceSearch(true);
                    if (typeof window.showToast === 'function') {
                        window.showToast('Could not start microphone: ' + (err.message || err), 3500);
                    }
                }
            });
        }

        // ── Clear button ──────────────────────────────────────────────────────
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
            clearSearchBtn.addEventListener('click', () => {
                stopVoiceSearch(false);
                clearPastedImage();
                _baseQueryPrefix = '';
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                hideSuggestions();
                WO.activeKeywordSearchQuery = '';
                WO.renderGroups();
                searchInput.focus();
            });
        }

        if (searchSubmitBtn) {
            searchSubmitBtn.addEventListener('click', () => {
                if (_isVoiceListening) stopVoiceSearch(false);
                submitFromBar(false);
            });
        }

        // ── Delegated suggestion events ───────────────────────────────────────
        searchSuggestions.addEventListener('mousedown', function(e) {
            // Prevent input blur so click event can fire before suggestions are hidden
            e.preventDefault();
        });

        searchSuggestions.addEventListener('click', function(e) {
            const delBtn = e.target.closest('.suggestion-delete-btn');
            if (delBtn) {
                e.stopPropagation();
                const q = delBtn.dataset.query;
                if (q) { deleteHistoryItem(q); showSuggestions(searchInput.value); }
                return;
            }
            const item = e.target.closest('.suggestion-item');
            if (item) handleSuggestionClick(item, e);
        });

        searchSuggestions.addEventListener('auxclick', function(e) {
            const item = e.target.closest('.suggestion-item');
            if (item) handleSuggestionAuxClick(item, e);
        });

        document.addEventListener('click', e => {
            if (_searchBarWrapper && !_searchBarWrapper.contains(e.target) && !searchSuggestions.contains(e.target)) hideSuggestions();
        });

        // ── Auto-collapse on mouse leave ──────────────────────────────────────
        // Jab mouse cursor searchbar ya suggestions dropdown se bahar jaye,
        // suggestions automatically collapse ho jaayen.
        const _searchContainer = searchInput.closest('.search-bar-container') || _searchBarWrapper;
        let _mouseLeaveTimer = null;

        function scheduleHide() {
            _mouseLeaveTimer = setTimeout(() => {
                // Only hide if input is not focused (keyboard users unaffected)
                if (document.activeElement !== searchInput) {
                    hideSuggestions();
                }
            }, 150);
        }

        function cancelScheduledHide() {
            clearTimeout(_mouseLeaveTimer);
        }

        if (_searchContainer) {
            _searchContainer.addEventListener('mouseleave', scheduleHide);
            _searchContainer.addEventListener('mouseenter', cancelScheduledHide);
        }
        if (searchSuggestions) {
            searchSuggestions.addEventListener('mouseenter', cancelScheduledHide);
            searchSuggestions.addEventListener('mouseleave', scheduleHide);
        }

        // Also hide on input blur when mouse is outside the container
        searchInput.addEventListener('blur', () => {
            _mouseLeaveTimer = setTimeout(() => {
                // If focus went somewhere outside the search area, hide suggestions
                if ((!_searchContainer || !_searchContainer.contains(document.activeElement)) &&
                    (!searchSuggestions || !searchSuggestions.contains(document.activeElement))) {
                    hideSuggestions();
                }
            }, 200);
        });

        // Hide history (but not keyword suggestions) when hovering over group cards
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.group-card')) {
                // If search input is empty, it means History is showing
                if (searchInput.value.trim() === '') {
                    hideSuggestions();
                    searchInput.blur();
                }
            }
        });

        // ── Global & Search Bar Image Listeners ──────────────────────
        searchInput.addEventListener('paste', handleSearchPaste);

        // Global Paste: Pressing Ctrl+V anywhere on page catches screenshots!
        document.addEventListener('paste', e => {
            const active = document.activeElement;
            const tag = (active && active.tagName || '').toLowerCase();
            // Don't intercept if user is typing text into another editable input/modal
            if (active && active !== searchInput && (tag === 'input' || tag === 'textarea' || active.isContentEditable)) {
                const cd = e.clipboardData;
                let hasImg = false;
                if (cd && cd.items) {
                    for (let i = 0; i < cd.items.length; i++) {
                        if (cd.items[i].type && cd.items[i].type.startsWith('image/')) {
                            hasImg = true;
                            break;
                        }
                    }
                }
                if (!hasImg) return;
            }
            handleSearchPaste(e);
        });

        // Global Drag Prevention: Stop browser from opening dropped files outside search bar
        window.addEventListener('dragover', e => {
            if (e.dataTransfer) {
                e.preventDefault();
            }
        }, false);

        window.addEventListener('drop', e => {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                const files = e.dataTransfer.files;
                let hasImg = false;
                for (let i = 0; i < files.length; i++) {
                    const f = files[i];
                    const name = (f.name || '').toLowerCase();
                    if ((f.type && f.type.startsWith('image/')) || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.gif') || name.endsWith('.bmp') || name.endsWith('.svg') || name.endsWith('.avif')) {
                        hasImg = true;
                        break;
                    }
                }
                if (hasImg) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleImageDrop(e);
                }
            }
        }, false);

        // Wrapper and Input Drag & Drop Handlers
        const dragTargets = [_searchBarWrapper, searchInput].filter(Boolean);
        dragTargets.forEach(elem => {
            elem.addEventListener('dragenter', e => {
                e.preventDefault();
                e.stopPropagation();
                if (_searchBarWrapper) _searchBarWrapper.classList.add('drag-target-active');
            });

            elem.addEventListener('dragover', e => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
                if (_searchBarWrapper) _searchBarWrapper.classList.add('drag-target-active');
            });

            elem.addEventListener('dragleave', e => {
                if (_searchBarWrapper && !elem.contains(e.relatedTarget) && !_searchBarWrapper.contains(e.relatedTarget)) {
                    _searchBarWrapper.classList.remove('drag-target-active');
                }
            });

            elem.addEventListener('drop', handleImageDrop);
        });

        if (lensSearchBtn) {
            lensSearchBtn.addEventListener('click', e => {
                e.preventDefault();
                executeGoogleLensSearch(e.ctrlKey || e.metaKey);
            });
        }

        if (pastedImageRemove) {
            pastedImageRemove.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                clearPastedImage();
                searchInput.focus();
            });
        }

        // Single tap / click on pasted thumbnail opens large lightbox preview
        if (pastedImageThumb) {
            pastedImageThumb.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                openImagePreviewModal();
            });
        }

        if (imagePreviewModalClose) {
            imagePreviewModalClose.addEventListener('click', e => {
                e.preventDefault();
                closeImagePreviewModal();
            });
        }

        if (imagePreviewModalRemove) {
            imagePreviewModalRemove.addEventListener('click', e => {
                e.preventDefault();
                closeImagePreviewModal();
                clearPastedImage();
                if (searchInput) searchInput.focus();
            });
        }

        if (imagePreviewModalSearch) {
            imagePreviewModalSearch.addEventListener('click', e => {
                e.preventDefault();
                closeImagePreviewModal();
                executeGoogleLensSearch(e.ctrlKey || e.metaKey);
            });
        }

        if (imagePreviewModal) {
            imagePreviewModal.addEventListener('click', e => {
                if (e.target === imagePreviewModal) {
                    closeImagePreviewModal();
                }
            });
        }

        // Global Keydown: Enter anywhere immediately searches image; Escape closes modal
        document.addEventListener('keydown', e => {
            // 1. Escape key closes preview modal
            if (e.key === 'Escape' && imagePreviewModal && imagePreviewModal.style.display !== 'none') {
                e.preventDefault();
                closeImagePreviewModal();
                return;
            }

            // 2. Enter key anywhere searches with Google Lens when image is attached!
            if (e.key === 'Enter' && _pastedImageDataUrl) {
                const active = document.activeElement;
                const tag = (active && active.tagName || '').toLowerCase();
                // Only skip if user is actively typing in another input/textarea (like rename modal)
                if (active && active !== searchInput && (tag === 'input' || tag === 'textarea' || active.isContentEditable)) {
                    return;
                }
                e.preventDefault();
                if (imagePreviewModal && imagePreviewModal.style.display !== 'none') {
                    closeImagePreviewModal();
                }
                executeGoogleLensSearch(e.ctrlKey || e.metaKey);
            }
        });

        WO.searchMode = WO.SEARCH_MODE_GOOGLE; // keep state compat, but UI is always hybrid
        WO.activeKeywordSearchQuery = '';
    };

})(window.WO);
