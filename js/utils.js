// =============================================================================
// js/utils.js — Pure Utility Functions (no DOM, no state)
// =============================================================================

(function (WO) {

    // ─── Content Filter ───────────────────────────────────────────────────────
    const _blockedPatterns = (WO.BLOCKED_PATTERNS || []).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const _blockedWordsSet = new Set((WO.BLOCKED_WORDS || []).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')));

    WO.containsBlockedContent = function (text) {
        if (!text) return false;
        const lower = String(text).toLowerCase();
        const cleanDense = lower.replace(/[^a-z0-9]/g, '');

        // 1. Check direct compound/domain patterns (e.g. "pornhub", "xvideos") in dense string
        if (_blockedPatterns.some(p => p && cleanDense.includes(p))) {
            return true;
        }

        // 2. Check whole words / tokens (prevents "analytics" matching "anal", "canteen" matching "teen")
        const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
        for (const token of tokens) {
            if (_blockedWordsSet.has(token)) return true;
        }

        return false;
    };

    // ─── String Escaping ──────────────────────────────────────────────────────
    // Pure string-replace — no DOM allocation (old approach created a <div> per call)
    WO.escapeHtml = function (text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    WO.escapeRegex = function (text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    WO.escapeCssAttributeValue = function (value) {
        if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
        return String(value).replace(/["\\[\]]/g, '\\$&');
    };

    // ─── URL / Keyword Parsing ────────────────────────────────────────────────
    WO.normaliseKeywordUrl = function (keyword) {
        let c = keyword.trim();
        if (!/^https?:\/\//i.test(c)) c = 'https://' + c;
        return c;
    };

    WO.parseKeyword = function (keyword) {
        const trimmed = keyword.trim();
        let displayText = trimmed;
        let targetUrl   = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
        let isUrl       = false;
        try {
            const normalised = WO.normaliseKeywordUrl(trimmed);
            const parsed = new URL(normalised);
            if (parsed.hostname && parsed.hostname.includes('.')) {
                isUrl = true;
                const host = parsed.hostname.replace(/^www\./, '');
                const mapped = WO.DOMAIN_DISPLAY_MAP[parsed.hostname] || WO.DOMAIN_DISPLAY_MAP[host];
                if (mapped) {
                    displayText = mapped;
                } else {
                    const parts = host.split('.');
                    const main  = parts.length ? parts[0] : host;
                    displayText = main.charAt(0).toUpperCase() + main.slice(1);
                }
                targetUrl = parsed.href;
            }
        } catch {}
        return { displayText, targetUrl, isUrl };
    };

    // ─── Hash Functions ───────────────────────────────────────────────────────
    WO.hashString = function (text) {
        let hash = 5381;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) + hash) + text.charCodeAt(i);
        }
        return Math.abs(hash);
    };

    // ─── Color Helpers ────────────────────────────────────────────────────────
    WO.hashGroupName = function (name) { return WO.hashString(name); };

    WO.getGroupColor = function (nameOrGroup, usedColors, preferredIndex) {
        // Accept either a group object {name, color?, _originalIndex?, ...} or a plain name string
        const group = (nameOrGroup && typeof nameOrGroup === 'object') ? nameOrGroup : null;
        const name  = group ? group.name : nameOrGroup;

        // If the admin set a custom colour, use it directly (no palette slot consumed)
        if (group && group.color) return group.color;

        let startIdx;
        if (typeof preferredIndex === 'number' && !isNaN(preferredIndex) && preferredIndex >= 0) {
            startIdx = preferredIndex % WO.GROUP_COLORS.length;
        } else if (group && typeof group._originalIndex === 'number' && group._originalIndex >= 0) {
            startIdx = group._originalIndex % WO.GROUP_COLORS.length;
        } else {
            startIdx = WO.hashGroupName(name || '') % WO.GROUP_COLORS.length;
        }

        if (!usedColors) return WO.GROUP_COLORS[startIdx];

        let idx = startIdx;
        let tries = 0;
        while (usedColors.has(idx) && tries < WO.GROUP_COLORS.length) {
            idx = (idx + 1) % WO.GROUP_COLORS.length;
            tries++;
        }
        usedColors.add(idx);
        return WO.GROUP_COLORS[idx];
    };

    WO.darkenColor = function (color, amount = 0.4) {
        if (color.startsWith('#')) {
            let r = parseInt(color.slice(1, 3), 16);
            let g = parseInt(color.slice(3, 5), 16);
            let b = parseInt(color.slice(5, 7), 16);
            r = Math.floor(r * (1 - amount));
            g = Math.floor(g * (1 - amount));
            b = Math.floor(b * (1 - amount));
            return `rgb(${r}, ${g}, ${b})`;
        }
        if (color.startsWith('hsl')) {
            const m = color.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
            if (m) return `hsl(${m[1]}, ${m[2]}%, ${Math.max(0, m[3] - 30)}%)`;
        }
        return color;
    };

    // ─── Emoji / Gradient Helpers ─────────────────────────────────────────────
    WO.getKeywordGradient = function (text) {
        const idx = WO.hashString(text) % WO.KEYWORD_GRADIENTS.length;
        return WO.KEYWORD_GRADIENTS[idx];
    };

    // Memoize favicon/emoji HTML — same keyword always produces same HTML string
    const _faviconCache = new Map();
    WO.getFaviconOrEmoji = function (keyword) {
        if (_faviconCache.has(keyword)) return _faviconCache.get(keyword);
        let isUrl = false, host = '';
        try {
            let test = keyword;
            if (!/^https?:\/\//i.test(test)) test = 'https://' + test;
            const parsed = new URL(test);
            if (parsed.hostname && parsed.hostname.includes('.')) {
                isUrl = true;
                host  = parsed.hostname.replace(/^www\./, '');
            }
        } catch {}
        let result;
        if (isUrl) {
            const fl = host.charAt(0).toUpperCase();
            const g  = WO.getKeywordGradient(host);
            const letterFallback = `<span class='keyword-letter' style='background: linear-gradient(135deg, ${g[0]}, ${g[1]}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;'>${fl}</span>`;
            const faviconUrl = `https://favicone.com/${host}?s=64`;
            const safeHost = host.replace(/'/g, "\\'");
            result = `<img src='${faviconUrl}' class='keyword-favicon' alt='' loading='lazy' decoding='async' `
                   + `onload="if(this.naturalWidth<=1){this.classList.add('favicon-failed');this.style.setProperty('display','none','important');if(this.nextElementSibling)this.nextElementSibling.style.setProperty('display','flex','important');}" `
                   + `onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='https://www.google.com/s2/favicons?domain=' + encodeURIComponent('${safeHost}') + '&sz=64';}else{this.classList.add('favicon-failed');this.style.setProperty('display','none','important');if(this.nextElementSibling)this.nextElementSibling.style.setProperty('display','flex','important');}">`
                   + `<div class='keyword-fallback-container' style='display:none;width:100%;height:100%;align-items:center;justify-content:center;'>${letterFallback}</div>`;
        } else {
            const fl = keyword.charAt(0).toUpperCase();
            const g  = WO.getKeywordGradient(keyword);
            result = `<span class='keyword-letter' style='background: linear-gradient(135deg, ${g[0]}, ${g[1]}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;'>${fl}</span>`;
        }
        if (_faviconCache.size >= 500) _faviconCache.clear(); // cap memory usage
        _faviconCache.set(keyword, result);
        return result;
    };
    // Allow external code to invalidate the cache when keywords change
    WO.clearFaviconCache = function () { _faviconCache.clear(); };

    // ─── Search Utilities ─────────────────────────────────────────────────────
    WO.normalizeSearchQuery = function (query) {
        return (query || '').trim().replace(/\s+/g, ' ');
    };

    WO.matchesKeywordSearch = function (searchText, tokens) {
        if (!tokens || tokens.length === 0) return true;
        return tokens.every(t => searchText.includes(t.toLowerCase()));
    };

    WO.highlightSearchHtml = function (text, query) {
        const safe = WO.escapeHtml(text);
        const nq   = WO.normalizeSearchQuery(query);
        if (!nq) return safe;
        const tokens = Array.from(new Set(nq.split(/\s+/).filter(Boolean)));
        if (!tokens.length) return safe;
        let out = safe;
        tokens.map(t => WO.escapeRegex(t)).sort((a, b) => b.length - a.length).forEach(t => {
            out = out.replace(new RegExp(`(${t})`, 'ig'), '<span class="keyword-search-highlight">$1</span>');
        });
        return out;
    };

    WO.buildSearchSnippet = function (text, query, maxLength = 110) {
        if (!text) return '';
        const nt = text.replace(/\s+/g, ' ').trim();
        if (!nt.length) return '';
        const nq = WO.normalizeSearchQuery(query).toLowerCase();
        if (!nq) return nt.length > maxLength ? `${nt.slice(0, maxLength).trimEnd()}…` : nt;
        const lt = nt.toLowerCase();
        const mi = lt.indexOf(nq);
        if (mi === -1) return nt.length > maxLength ? `${nt.slice(0, maxLength).trimEnd()}…` : nt;
        const start = Math.max(0, mi - 24);
        const end   = Math.min(nt.length, mi + nq.length + 56);
        let snippet = nt.slice(start, end).trim();
        if (start > 0) snippet = `…${snippet}`;
        if (end < nt.length) snippet += '…';
        return snippet;
    };

    WO.getDirectWebsiteUrl = function (query) {
        const tq = WO.normalizeSearchQuery(query);
        if (!tq || /\s/.test(tq)) return null;
        try {
            const parsed = new URL(WO.normaliseKeywordUrl(tq));
            const h = parsed.hostname.toLowerCase();
            if ((h === 'localhost' || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(h) || h.includes('.')) && /^https?:$/.test(parsed.protocol)) {
                return parsed.href;
            }
        } catch {}
        return null;
    };

    // ─── Search Scoring & Priority by Match Position ───────────────────────────
    WO.isWordBoundary = function (str, idx) {
        if (!str || idx <= 0) return true;
        const prev = str.charCodeAt(idx - 1);
        const isAlnum = (prev >= 48 && prev <= 57) || (prev >= 65 && prev <= 90) || (prev >= 97 && prev <= 122);
        return !isAlnum;
    };

    WO.getAcronym = function (str) {
        if (!str) return '';
        const words = str.split(/[^a-zA-Z0-9]+/).filter(Boolean);
        let init = '';
        words.forEach(w => {
            const parts = w.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
            parts.forEach(p => { if (p[0]) init += p[0].toLowerCase(); });
        });
        return init;
    };

    function calculateSingleTokenScore(item, token) {
        const t = (token || '').trim().toLowerCase();
        if (!t) return 300;

        const ld = (item.displayText || '').toLowerCase();
        const lk = (item.keyword || '').toLowerCase();
        const ldc = (item.description || '').toLowerCase();
        const tags = (item.tags || []).map(x => String(x).toLowerCase());
        const lurl = (item.targetUrl || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '');
        const lg = (item.groupName || '').toLowerCase();

        // 1. Exact title match (best possible)
        if (ld === t || lk === t) return 0;

        // 2. Exact comment or tag match (e.g. comment/tag is exactly "yt")
        if (ldc === t || tags.includes(t)) return 5;

        // 3. Title prefix match (query starts at 1st character / index 0 of title)
        if (ld.startsWith(t) || lk.startsWith(t)) return 10;

        // 4. Word initials/acronym match (e.g. "YouTube" -> "yt")
        const initials = WO.getAcronym(item.displayText || '');
        if (t.length >= 2 && initials.startsWith(t)) return 15;

        // 5. Comment / Tag prefix match (query starts at 1st character / index 0 of comment/tag)
        if (ldc.startsWith(t) || tags.some(x => x.startsWith(t))) return 20;

        // 6. Word-boundary match in title (starts at word beginning, e.g. "Free YT")
        const titleIdx = ld.indexOf(t) >= 0 ? ld.indexOf(t) : lk.indexOf(t);
        if (titleIdx > 0 && WO.isWordBoundary(ld, titleIdx)) {
            return 30 + Math.min(titleIdx, 20);
        }

        // 7. Word-boundary match in comment or tags (starts at word beginning)
        const descIdx = ldc.indexOf(t);
        if (descIdx > 0 && WO.isWordBoundary(ldc, descIdx)) {
            return 45 + Math.min(descIdx, 20);
        }
        const matchingTag = tags.find(x => x.indexOf(t) >= 0);
        if (matchingTag) {
            const ti = matchingTag.indexOf(t);
            if (ti === 0) return 20;
            if (WO.isWordBoundary(matchingTag, ti)) return 45 + Math.min(ti, 20);
        }

        // 8. Word-boundary match in clean URL
        const urlIdx = lurl.indexOf(t);
        if (urlIdx >= 0 && WO.isWordBoundary(lurl, urlIdx)) {
            return 70 + Math.min(urlIdx, 25);
        }

        // 9. Substring match inside a word in title (e.g. Monkeytype -> index 5)
        // Earlier character positions get lower scores (higher priority)!
        if (titleIdx >= 0) {
            return 100 + titleIdx;
        }

        // 10. Substring match inside a word in comment
        if (descIdx >= 0) {
            return 130 + descIdx;
        }

        // 11. Substring in tag
        if (matchingTag) {
            return 150 + matchingTag.indexOf(t);
        }

        // 12. Substring in URL
        if (urlIdx >= 0) {
            return 170 + urlIdx;
        }

        // 13. Group name match
        const gIdx = lg.indexOf(t);
        if (gIdx >= 0) return 200 + (WO.isWordBoundary(lg, gIdx) ? gIdx : 50 + gIdx);

        return 300;
    }

    WO.calculateSearchScore = function (item, query) {
        const lnq = (query || '').trim().toLowerCase();
        if (!lnq) return 300;
        const tokens = lnq.split(/\s+/).filter(Boolean);
        if (!tokens.length) return 300;

        const fullScore = calculateSingleTokenScore(item, lnq);
        if (tokens.length === 1 || fullScore < 100) {
            return fullScore;
        }

        const firstScore = calculateSingleTokenScore(item, tokens[0]);
        let otherSum = 0;
        for (let i = 1; i < tokens.length; i++) {
            otherSum += calculateSingleTokenScore(item, tokens[i]);
        }
        return firstScore + (otherSum / (tokens.length - 1)) * 0.1;
    };

    // ─── Counter Element Selector ─────────────────────────────────────────────
    WO.getKeywordCounterElements = function (keyword) {
        try { return document.querySelectorAll(`[data-keyword-value="${WO.escapeCssAttributeValue(keyword)}"] .keyword-click-counter`); }
        catch { return []; }
    };

    // ─── Event Key Helper ─────────────────────────────────────────────────────
    WO.getEventKey = function (e) { return typeof e.key === 'string' ? e.key : ''; };

})(window.WO);
