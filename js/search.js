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

    WO.initSearch = function () {
        const searchInput       = document.getElementById('google-search-input');
        const searchSubmitBtn   = document.getElementById('search-submit-btn');
        const clearSearchBtn    = document.getElementById('clear-search-btn');
        const searchSuggestions = document.getElementById('search-suggestions');

        if (!searchInput) return;

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

        // ── Keyword search core ───────────────────────────────────────────────
        function getKeywordSearchResults(query) {
            const nq     = WO.normalizeSearchQuery(query);
            const tokens = nq.toLowerCase().split(/\s+/).filter(Boolean);
            const results = [];
            WO.groups.forEach((group, gi) => {
                group.keywords.forEach((keyword, ki) => {
                    const { displayText, targetUrl } = WO.parseKeyword(keyword);
                    const ek   = encodeURIComponent(keyword).replace(/\./g, '%2E');
                    const desc = WO.keywordDescriptions[ek] || '';
                    const st   = [keyword, displayText, targetUrl, desc, group.name].join(' ').toLowerCase();
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
            if (!results || !results.length) { hideSuggestions(); return; }
            let html = '<div class="suggestion-header"><span>Website matches</span></div>';
            results.forEach((r, i) => {
                const snippet = r.description ? WO.buildSearchSnippet(r.description, query) : '';
                const meta = [r.groupName && WO.escapeHtml(r.groupName), snippet && WO.highlightSearchHtml(snippet, query)].filter(Boolean).join(' &middot; ');
                html += `<div class="suggestion-item keyword-suggestion-item" data-index="${i}" data-suggestion-mode="keywords" data-group-index="${r.groupIndex}" data-keyword-index="${r.keywordIndex}" data-target-url="${WO.escapeHtml(r.targetUrl || '')}">
                    <svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <div class="keyword-suggestion-content">
                        <span class="suggestion-text">${WO.highlightSearchHtml(r.displayText, query)}</span>
                        ${meta ? `<div class="keyword-suggestion-meta">${meta}</div>` : ''}
                    </div>
                    <span class="keyword-suggestion-badge">Open</span>
                </div>`;
            });
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
            searchSuggestions.innerHTML = html;
            searchSuggestions.style.display = 'block';
        }

        // ── Hybrid: main entry point for showing suggestions ──────────────────
        function showSuggestions(query) {
            const nq = WO.normalizeSearchQuery(query);

            // Empty input → show history (or nothing)
            if (!nq) {
                WO.currentKeywordSuggestions = [];
                renderHistorySuggestions();
                return;
            }

            // Try keyword search first
            const kwResults = getKeywordSearchResults(nq);
            WO.currentKeywordSuggestions = kwResults;
            WO.selectedKeywordSuggestionIndex = -1;

            if (kwResults.length > 0) {
                // ✅ Keyword matches → show them
                renderKeywordSuggestions(kwResults, nq);
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
                if (i === WO.selectedSuggestionIndex) searchInput.value = it.dataset.query || searchInput.value;
            });
        }
        function updateSelectedKeywordSuggestion() {
            searchSuggestions.querySelectorAll('.suggestion-item').forEach((it, i) =>
                it.classList.toggle('selected', i === WO.selectedKeywordSuggestionIndex));
        }

        // ── Google Search ─────────────────────────────────────────────────────
        function performGoogleSearch(query, inNewTab = false) {
            if (!query || !query.trim()) return;
            const tq = query.trim();
            const direct = WO.getDirectWebsiteUrl(tq);
            if (direct) { WO.openURLWithBrowser(direct, inNewTab); }
            else { saveHistory(tq); WO.openURLWithBrowser(`https://www.google.com/search?q=${encodeURIComponent(tq)}`, inNewTab); }
            searchInput.value = '';
            hideSuggestions();
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        }

        // ── Submit (Enter / button click) ─────────────────────────────────────
        function submitFromBar(inNewTab = false) {
            const tq = WO.normalizeSearchQuery(searchInput.value);
            if (!tq) { searchInput.focus(); return; }

            // Direct URL shortcut (e.g. "youtube")
            const direct = WO.getDirectWebsiteUrl(tq);
            if (direct) { WO.openURLWithBrowser(direct, inNewTab); searchInput.value = ''; hideSuggestions(); if (clearSearchBtn) clearSearchBtn.style.display = 'none'; return; }

            // Keyword suggestion explicitly selected via arrow keys → open it
            if (WO.selectedKeywordSuggestionIndex >= 0 && WO.currentKeywordSuggestions && WO.currentKeywordSuggestions.length) {
                const r = WO.currentKeywordSuggestions[WO.selectedKeywordSuggestionIndex];
                if (r) { WO.openURLWithBrowser(r.targetUrl, inNewTab); searchInput.value = ''; hideSuggestions(); if (clearSearchBtn) clearSearchBtn.style.display = 'none'; return; }
            }

            // Fallback → Google search
            performGoogleSearch(tq, inNewTab);
        }

        // ── Suggestion click handlers ─────────────────────────────────────────
        function handleSuggestionClick(item, e) {
            const mode = item.dataset.suggestionMode || 'google';
            if (mode === 'keywords') {
                const r = WO.currentKeywordSuggestions[Number(item.dataset.index)];
                if (r) { e.preventDefault(); e.stopPropagation(); WO.openURLWithBrowser(r.targetUrl, e.ctrlKey || e.metaKey); searchInput.value = ''; hideSuggestions(); if (clearSearchBtn) clearSearchBtn.style.display = 'none'; }
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
                if (r) { e.preventDefault(); e.stopPropagation(); WO.openURLWithBrowser(r.targetUrl, true); }
                return;
            }
            const q = item.dataset.query; if (q) { e.preventDefault(); e.stopPropagation(); performGoogleSearch(q, true); }
        }

        // ── Input event ───────────────────────────────────────────────────────
        let _searchRenderTimer = null;
        searchInput.addEventListener('input', e => {
            const q  = e.target.value;
            const nq = WO.normalizeSearchQuery(q);
            if (clearSearchBtn) clearSearchBtn.style.display = nq.length > 0 ? 'block' : 'none';

            // Update live card filtering immediately
            WO.activeKeywordSearchQuery = nq;

            clearTimeout(_searchRenderTimer);
            _searchRenderTimer = setTimeout(() => {
                WO.renderGroups();   // live group card highlighting
                showSuggestions(q); // hybrid dropdown
            }, 120);
        });

        searchInput.addEventListener('focus', () => {
            showSuggestions(searchInput.value);
        });

        // ── Keyboard navigation ───────────────────────────────────────────────
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); submitFromBar(e.ctrlKey || e.metaKey); return; }
            if (e.key === 'Escape') { hideSuggestions(); searchInput.blur(); return; }

            const hasKW = WO.currentKeywordSuggestions && WO.currentKeywordSuggestions.length > 0;
            const hasGoogle = WO.currentSuggestions && WO.currentSuggestions.length > 0;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (hasKW) { WO.selectedKeywordSuggestionIndex = Math.min(WO.selectedKeywordSuggestionIndex + 1, WO.currentKeywordSuggestions.length - 1); updateSelectedKeywordSuggestion(); }
                else if (hasGoogle) { WO.selectedSuggestionIndex = Math.min(WO.selectedSuggestionIndex + 1, WO.currentSuggestions.length - 1); updateSelectedSuggestion(); }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (hasKW) { WO.selectedKeywordSuggestionIndex = Math.max(WO.selectedKeywordSuggestionIndex - 1, -1); updateSelectedKeywordSuggestion(); }
                else if (hasGoogle) { WO.selectedSuggestionIndex = Math.max(WO.selectedSuggestionIndex - 1, -1); updateSelectedSuggestion(); }
            }
        });

        // ── Clear button ──────────────────────────────────────────────────────
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                hideSuggestions();
                WO.activeKeywordSearchQuery = '';
                WO.renderGroups();
                searchInput.focus();
            });
        }

        if (searchSubmitBtn) searchSubmitBtn.addEventListener('click', () => submitFromBar(false));

        // ── Delegated suggestion events ───────────────────────────────────────
        const _searchBarWrapper = searchInput.closest('.search-bar-wrapper') || searchInput.parentElement;

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

        // Initialise — force hybrid mode always
        WO.searchMode = WO.SEARCH_MODE_GOOGLE; // keep state compat, but UI is always hybrid
        WO.activeKeywordSearchQuery = '';
    };

})(window.WO);
