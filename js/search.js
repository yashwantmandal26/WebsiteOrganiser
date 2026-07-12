// =============================================================================
// js/search.js — Search Bar (Google + Keyword Mode), Suggestions, History
// =============================================================================

(function (WO) {

    WO.initSearch = function () {
        const searchInput         = document.getElementById('google-search-input');
        const searchModeToggle    = document.getElementById('search-mode-toggle-input');
        const searchSubmitBtn     = document.getElementById('search-submit-btn');
        const clearSearchBtn      = document.getElementById('clear-search-btn');
        const searchSuggestions   = document.getElementById('search-suggestions');

        if (!searchInput) return;

        // ── Mode Toggle ───────────────────────────────────────────────────────
        function updateModeUI() {
            if (!searchModeToggle) return;
            const isKW = WO.searchMode === WO.SEARCH_MODE_KEYWORDS;
            searchModeToggle.checked = isKW;
            const track = searchModeToggle.nextElementSibling;
            if (track) { track.dataset.mode = isKW ? WO.SEARCH_MODE_KEYWORDS : WO.SEARCH_MODE_GOOGLE; track.title = isKW ? 'Switch to Google search' : 'Switch to keyword search'; }
            searchInput.placeholder = isKW ? 'Search keywords and comments...' : 'Google Search...';
        }
        updateModeUI();

        function setSearchMode(mode) {
            if (mode !== WO.SEARCH_MODE_GOOGLE && mode !== WO.SEARCH_MODE_KEYWORDS) return;
            if (WO.searchMode === mode) return;
            WO.searchMode = mode;
            try { localStorage.setItem(WO.SEARCH_MODE_KEY, mode); } catch {}
            updateModeUI();
            WO.activeKeywordSearchQuery = mode === WO.SEARCH_MODE_KEYWORDS ? WO.normalizeSearchQuery(searchInput.value) : '';
            WO.renderGroups();
            showSuggestions(searchInput.value);
        }

        if (searchModeToggle) {
            searchModeToggle.addEventListener('change', () => {
                setSearchMode(searchModeToggle.checked ? WO.SEARCH_MODE_KEYWORDS : WO.SEARCH_MODE_GOOGLE);
            });
        }

        // ── History Helpers ───────────────────────────────────────────────────
        // Cache history in memory to avoid repeated localStorage reads
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

        // ── Suggestions ───────────────────────────────────────────────────────
        function hideSuggestions() {
            searchSuggestions.style.display = 'none';
            searchSuggestions.innerHTML = '';
            WO.selectedSuggestionIndex = -1;
            WO.selectedKeywordSuggestionIndex = -1;
            WO.currentSuggestions = [];
            WO.currentKeywordSuggestions = [];
        }

        function showSuggestions(query) {
            if (WO.searchMode === WO.SEARCH_MODE_KEYWORDS) { showKeywordSuggestions(query); return; }
            const history = loadHistory();
            WO.currentSuggestions = [];
            const tq = WO.normalizeSearchQuery(query);
            if (!tq) {
                if (history.length) { WO.currentSuggestions = history.slice(0, 5); renderSuggestions(WO.currentSuggestions, 'recent'); }
                else hideSuggestions();
                return;
            }
            const filtered = history.filter(i => i.toLowerCase().includes(tq.toLowerCase()));
            if (filtered.length) { WO.currentSuggestions = filtered.slice(0, 5); renderSuggestions(WO.currentSuggestions, 'filtered'); }
            else { WO.currentSuggestions = [tq]; renderSuggestions(WO.currentSuggestions, 'new'); }
        }

        function renderSuggestions(suggestions, type) {
            if (!suggestions || !suggestions.length) { hideSuggestions(); return; }
            WO.selectedSuggestionIndex = -1;
            const isHistory = type === 'recent' || type === 'filtered';
            let html = isHistory ? '<div class="suggestion-header"><span>Recent Searches</span></div>' : '';
            suggestions.forEach((s, i) => {
                const icon = isHistory
                    ? '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
                    : '<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
                const delBtn = isHistory ? `<button class="suggestion-delete-btn" data-action="delete-item" data-query="${WO.escapeHtml(s)}" title="Remove" aria-label="Remove from history"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : '';
                html += `<div class="suggestion-item" data-index="${i}" data-query="${WO.escapeHtml(s)}" data-suggestion-mode="google">${icon}<span class="suggestion-text">${WO.escapeHtml(s)}</span>${delBtn}</div>`;
            });
            if (isHistory) html += `<div class="suggestion-item suggestion-clear-all" data-action="clear-history" data-suggestion-mode="google"><svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg><span class="suggestion-text">Clear all history</span></div>`;
            searchSuggestions.innerHTML = html;
            searchSuggestions.style.display = 'block';
            // No per-item listeners — delegation handler set up once at init below
        }

        function showKeywordSuggestions(query) {
            const nq = WO.normalizeSearchQuery(query);
            WO.selectedKeywordSuggestionIndex = -1;
            if (!nq) { WO.currentKeywordSuggestions = []; hideSuggestions(); return; }
            WO.currentKeywordSuggestions = getKeywordSearchResults(nq);
            renderKeywordSuggestions(WO.currentKeywordSuggestions, nq);
        }

        function getKeywordSearchResults(query) {
            const nq     = WO.normalizeSearchQuery(query);
            const tokens = nq.toLowerCase().split(/\s+/).filter(Boolean);
            const results = [];
            WO.groups.forEach((group, gi) => {
                group.keywords.forEach((keyword, ki) => {
                    const { displayText, targetUrl } = WO.parseKeyword(keyword);
                    const ek = encodeURIComponent(keyword).replace(/\./g, '%2E');
                    const desc = WO.keywordDescriptions[ek] || '';
                    const st = [keyword, displayText, targetUrl, desc, group.name].join(' ').toLowerCase();
                    if (!WO.matchesKeywordSearch(st, tokens)) return;
                    let score = 2;
                    const ld = displayText.toLowerCase(), lk = keyword.toLowerCase(), ldc = desc.toLowerCase(), lnq = nq.toLowerCase();
                    if (ld.startsWith(lnq) || lk.startsWith(lnq)) score = 0;
                    else if (ld.includes(lnq) || lk.includes(lnq)) score = 1;
                    else if (ldc.includes(lnq)) score = 1.5;
                    results.push({ groupIndex: gi, keywordIndex: ki, keyword, displayText, targetUrl, description: desc, groupName: group.name, score });
                });
            });
            return results.sort((a, b) => a.score !== b.score ? a.score - b.score : a.displayText.localeCompare(b.displayText)).slice(0, WO.MAX_SEARCH_RESULTS);
        }

        function renderKeywordSuggestions(results, query) {
            if (!results || !results.length) {
                searchSuggestions.innerHTML = `<div class="suggestion-item keyword-suggestion-empty" data-suggestion-mode="keywords"><svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><span class="suggestion-text">No keywords or comments match "${WO.escapeHtml(query)}"</span></div>`;
                searchSuggestions.style.display = 'block';
                // No per-item listeners — delegation handler set up once at init below
                return;
            }
            let html = '<div class="suggestion-header"><span>Keyword matches</span></div>';
            results.forEach((r, i) => {
                const snippet = r.description ? WO.buildSearchSnippet(r.description, query) : '';
                const meta = [r.groupName && WO.escapeHtml(r.groupName), snippet && WO.highlightSearchHtml(snippet, query)].filter(Boolean).join(' &middot; ');
                html += `<div class="suggestion-item keyword-suggestion-item" data-index="${i}" data-suggestion-mode="keywords" data-group-index="${r.groupIndex}" data-keyword-index="${r.keywordIndex}" data-target-url="${WO.escapeHtml(r.targetUrl || '')}">
                    <svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <div class="keyword-suggestion-content">
                        <span class="suggestion-text">${WO.highlightSearchHtml(r.displayText, query)}</span>
                        ${meta ? `<div class="keyword-suggestion-meta">${meta}</div>` : ''}
                    </div>
                    <span class="keyword-suggestion-badge">Keyword</span>
                </div>`;
            });
            searchSuggestions.innerHTML = html;
            searchSuggestions.style.display = 'block';
            // No per-item listeners — delegation handler set up once at init below
        }

        function updateSelectedSuggestion() {
            const items = searchSuggestions.querySelectorAll('.suggestion-item');
            items.forEach((it, i) => { it.classList.toggle('selected', i === WO.selectedSuggestionIndex); if (i === WO.selectedSuggestionIndex) { searchInput.value = it.dataset.query || searchInput.value; } });
        }

        function updateSelectedKeywordSuggestion() {
            searchSuggestions.querySelectorAll('.suggestion-item').forEach((it, i) => it.classList.toggle('selected', i === WO.selectedKeywordSuggestionIndex));
        }

        // ── Suggestion Click Handlers (used by delegated listeners set up below) ───
        function handleSuggestionClick(item, e) {
            const mode = item.dataset.suggestionMode || WO.SEARCH_MODE_GOOGLE;
            if (mode === WO.SEARCH_MODE_KEYWORDS) {
                const r = WO.currentKeywordSuggestions[Number(item.dataset.index)];
                if (r) { e.preventDefault(); e.stopPropagation(); WO.openURLWithBrowser(r.targetUrl, e.ctrlKey || e.metaKey); hideSuggestions(); }
                return;
            }
            if (item.dataset.action === 'clear-history') { clearHistory(); hideSuggestions(); searchInput.value = ''; searchInput.focus(); return; }
            const q = item.dataset.query; if (q) performGoogleSearch(q);
        }

        function handleSuggestionAuxClick(item, e) {
            if (e.button !== 1) return;
            const mode = item.dataset.suggestionMode || WO.SEARCH_MODE_GOOGLE;
            if (mode === WO.SEARCH_MODE_KEYWORDS) {
                const r = WO.currentKeywordSuggestions[Number(item.dataset.index)];
                if (r) { e.preventDefault(); e.stopPropagation(); WO.openURLWithBrowser(r.targetUrl, true); }
                return;
            }
            const q = item.dataset.query; if (q) { e.preventDefault(); e.stopPropagation(); performGoogleSearch(q, true); }
        }

        // ── Google Search ─────────────────────────────────────────────────────
        function performGoogleSearch(query, inNewTab = false) {
            if (!query || !query.trim()) return;
            const tq = query.trim();
            const direct = WO.getDirectWebsiteUrl(tq);
            if (direct) { WO.openURLWithBrowser(direct, inNewTab); }
            else { saveHistory(tq); WO.openURLWithBrowser(`https://www.google.com/search?q=${encodeURIComponent(tq)}`, inNewTab); }
            searchInput.value = ''; hideSuggestions();
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        }

        function submitFromBar(inNewTab = false) {
            const tq = WO.normalizeSearchQuery(searchInput.value);
            if (!tq) { searchInput.focus(); return; }
            if (WO.searchMode === WO.SEARCH_MODE_KEYWORDS) {
                const direct = WO.getDirectWebsiteUrl(tq);
                if (direct) { WO.openURLWithBrowser(direct, inNewTab); searchInput.value = ''; hideSuggestions(); if (clearSearchBtn) clearSearchBtn.style.display = 'none'; return; }
                const idx = WO.selectedKeywordSuggestionIndex >= 0 && WO.selectedKeywordSuggestionIndex < WO.currentKeywordSuggestions.length ? WO.selectedKeywordSuggestionIndex : 0;
                const r = WO.currentKeywordSuggestions[idx];
                if (r) { WO.openURLWithBrowser(r.targetUrl, inNewTab); hideSuggestions(); }
                return;
            }
            performGoogleSearch(tq, inNewTab);
        }

        // ── Input Event Listeners ─────────────────────────────────────────────
        // Debounce timer for keyword-mode re-renders (avoids full DOM rebuild on every keystroke)
        let _searchRenderTimer = null;
        searchInput.addEventListener('input', e => {
            const q = e.target.value;
            const tq = WO.normalizeSearchQuery(q);
            if (clearSearchBtn) clearSearchBtn.style.display = tq.length > 0 ? 'block' : 'none';
            if (WO.searchMode === WO.SEARCH_MODE_KEYWORDS) {
                WO.activeKeywordSearchQuery = tq; // update state immediately
                clearTimeout(_searchRenderTimer);
                _searchRenderTimer = setTimeout(() => {
                    WO.renderGroups();
                    showSuggestions(q);
                }, 150); // 150ms debounce — renders only after user pauses typing
            } else {
                showSuggestions(q); // Google mode: suggestions only, no re-render needed
            }
        });

        searchInput.addEventListener('focus', () => {
            if (WO.searchMode === WO.SEARCH_MODE_KEYWORDS) {
                if (!WO.normalizeSearchQuery(searchInput.value).length) hideSuggestions();
                else showSuggestions(searchInput.value);
                return;
            }
            showSuggestions(searchInput.value.trim().length === 0 ? '' : searchInput.value);
        });

        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Tab') { e.preventDefault(); setSearchMode(WO.searchMode === WO.SEARCH_MODE_GOOGLE ? WO.SEARCH_MODE_KEYWORDS : WO.SEARCH_MODE_GOOGLE); return; }
            if (e.key === 'Enter') { e.preventDefault(); submitFromBar(e.ctrlKey || e.metaKey); return; }
            if (e.key === 'Escape') { hideSuggestions(); searchInput.blur(); return; }
            if (WO.searchMode === WO.SEARCH_MODE_KEYWORDS) {
                if (e.key === 'ArrowDown') { e.preventDefault(); if (WO.currentKeywordSuggestions.length) { WO.selectedKeywordSuggestionIndex = Math.min(WO.selectedKeywordSuggestionIndex + 1, WO.currentKeywordSuggestions.length - 1); updateSelectedKeywordSuggestion(); } }
                else if (e.key === 'ArrowUp') { e.preventDefault(); if (WO.currentKeywordSuggestions.length) { WO.selectedKeywordSuggestionIndex = Math.max(WO.selectedKeywordSuggestionIndex - 1, -1); updateSelectedKeywordSuggestion(); } }
                return;
            }
            if (e.key === 'ArrowDown') { e.preventDefault(); if (WO.currentSuggestions.length) { WO.selectedSuggestionIndex = Math.min(WO.selectedSuggestionIndex + 1, WO.currentSuggestions.length - 1); updateSelectedSuggestion(); } }
            else if (e.key === 'ArrowUp') { e.preventDefault(); if (WO.currentSuggestions.length) { WO.selectedSuggestionIndex = Math.max(WO.selectedSuggestionIndex - 1, -1); updateSelectedSuggestion(); } }
        });

        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = ''; clearSearchBtn.style.display = 'none'; hideSuggestions();
                if (WO.searchMode === WO.SEARCH_MODE_KEYWORDS) { WO.activeKeywordSearchQuery = ''; WO.renderGroups(); }
                searchInput.focus();
            });
        }

        if (searchSubmitBtn) searchSubmitBtn.addEventListener('click', () => submitFromBar(false));

        // ── Delegated suggestion events — set up ONCE at init, not per render ────
        // Cache the search bar wrapper reference for the outside-click handler
        const _searchBarWrapper = searchInput.closest('.search-bar-wrapper') || searchInput.parentElement;

        searchSuggestions.addEventListener('click', function(e) {
            // Handle delete button
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

        // Close suggestions on outside click — cached ref avoids querySelector on every click
        document.addEventListener('click', e => {
            if (_searchBarWrapper && !_searchBarWrapper.contains(e.target) && !searchSuggestions.contains(e.target)) hideSuggestions();
        });
    };

})(window.WO);
