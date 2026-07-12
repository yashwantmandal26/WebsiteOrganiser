// =============================================================================
// js/utils.js — Pure Utility Functions (no DOM, no state)
// =============================================================================

(function (WO) {

    // ─── Content Filter ───────────────────────────────────────────────────────
    // Pre-clean blocked words once — avoids repeated regex replace on every call
    const _cleanedBlockedWords = WO.BLOCKED_WORDS.map(w => w.replace(/[^a-z0-9]/g, ''));
    WO.containsBlockedContent = function (text) {
        if (!text) return false;
        const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        return _cleanedBlockedWords.some(w => clean.includes(w));
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

    WO.getGroupColor = function (name, usedColors) {
        let idx = WO.hashGroupName(name) % WO.GROUP_COLORS.length;
        let tries = 0;
        while (usedColors.has(idx) && tries < WO.GROUP_COLORS.length) { idx = (idx + 1) % WO.GROUP_COLORS.length; tries++; }
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
            const defAvatar = encodeURIComponent('https://upload.wikimedia.org/wikipedia/commons/4/47/Transparent.png');
            const faviconUrl = `https://favicon.im/${host}?larger=true&default-avatar=${defAvatar}`;
            result = `<img src='${faviconUrl}' class='keyword-favicon' loading='lazy' decoding='async' onload="if(this.naturalWidth===1){this.style.display='none';this.nextElementSibling.style.display='flex';}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
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

    // ─── Counter Element Selector ─────────────────────────────────────────────
    WO.getKeywordCounterElements = function (keyword) {
        try { return document.querySelectorAll(`[data-keyword-value="${WO.escapeCssAttributeValue(keyword)}"] .keyword-click-counter`); }
        catch { return []; }
    };

    // ─── Event Key Helper ─────────────────────────────────────────────────────
    WO.getEventKey = function (e) { return typeof e.key === 'string' ? e.key : ''; };

})(window.WO);
