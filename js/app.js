// =============================================================================
// js/app.js — Application Bootstrap & Global Wiring
// =============================================================================

(function (WO) {

    // ─── Loading Screen ───────────────────────────────────────────────────────
    WO.showLoading = function () {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
        }
    };

    WO.hideLoading = function () {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;
        // Trigger the CSS fade+scale-out transition
        overlay.classList.add('hidden');
        // After transition completes, remove from layout entirely
        overlay.addEventListener('transitionend', () => {
            overlay.style.display = 'none';
        }, { once: true });
        // Fallback in case transitionend doesn't fire
        setTimeout(() => { overlay.style.display = 'none'; }, 600);
    };

    // ─── Keyword Zoom State Reset ─────────────────────────────────────────────
    WO.resetKeywordStates = function (preventScroll = false, isRendering = false) {
        document.body.classList.remove('is-zooming', 'modal-open');
        document.querySelectorAll('.keyword-grid-preview-item.expanded').forEach(item => {
            item.classList.remove('expanded');
        });
        if (!preventScroll) {
            document.documentElement.style.overflowY = 'auto';
            document.body.style.overflowY = 'auto';
        }
        if (!isRendering) {
            WO.renderGroups();
        }
    };
    window.resetKeywordStates = WO.resetKeywordStates;

    // Track expanded keyword state to avoid querySelector scan on every click
    WO._hasExpandedKeyword = false;

    // ─── Global Click Handler to Dismiss Expanded Keywords ────────────────────
    document.addEventListener('click', e => {
        if (!WO._hasExpandedKeyword) return; // fast-path: nothing to dismiss
        if (!e.target.closest('.keyword-grid-preview-item')) {
            const hasExpanded = document.querySelector('.keyword-grid-preview-item.expanded');
            if (hasExpanded) WO.resetKeywordStates();
        }
    });

    document.addEventListener('touchstart', e => {
        if (!WO._hasExpandedKeyword) return; // fast-path: nothing to dismiss
        if (!e.target.closest('.keyword-grid-preview-item')) {
            const hasExpanded = document.querySelector('.keyword-grid-preview-item.expanded');
            if (hasExpanded) WO.resetKeywordStates();
        }
    }, { passive: true }); // passive: prevents scroll-blocking warning

    // ─── Initial Data Load & Retry Logic ──────────────────────────────────────
    function scheduleRetryLoad() {
        if (WO.retryAttempt >= WO.MAX_RETRIES) return;
        WO.retryAttempt++;
        const delay = Math.min(2000 * Math.pow(2, WO.retryAttempt - 1), 15000);
        setTimeout(async () => {
            try {
                const changed = await WO.loadGroups();
                if (changed) {
                    WO.renderGroups();
                    WO.retryAttempt = WO.MAX_RETRIES;
                } else if (WO.retryAttempt < WO.MAX_RETRIES) {
                    scheduleRetryLoad();
                }
            } catch (e) {
                if (WO.retryAttempt < WO.MAX_RETRIES) scheduleRetryLoad();
            }
        }, delay);
    }

    async function loadDataFromServer() {
        // ── Step 1: Show cached data instantly (zero-delay first paint) ──────
        const backup = WO.loadLocalDataBackup();
        const hadCachedData = backup ? WO.applyLocalDataBackup(backup) : false;
        if (hadCachedData && WO.groups.length > 0) {
            WO.renderGroups();
            // Hide loading quickly — user sees their saved data instantly
            setTimeout(WO.hideLoading, 600);
        }

        // Remember how many groups we had before Firestore call
        const groupCountBefore = WO.groups.length;

        // ── Step 2: Fetch fresh data from Firestore in background ────────────
        try {
            const changed = await WO.loadGroups();
            // Safety: If Firestore returned empty but we had real data, keep our data
            if (WO.groups.length === 0 && groupCountBefore > 0) {
                // Restore the cached data — Firestore likely had a quota/network blip
                if (backup) WO.applyLocalDataBackup(backup);
                if (WO.groups.length === 0) {
                    WO.groups = JSON.parse(JSON.stringify(WO.DEFAULT_GROUPS));
                }
                console.warn('Firestore returned empty but we had cached data — preserved local copy.');
            }
            if (changed || !hadCachedData) {
                WO.renderGroups();
            }
            WO.hideLoading();
            WO.setupRealtimeSync();
        } catch (error) {
            console.error('Initial Firestore load failed:', error);
            // NEVER overwrite existing data — only use defaults if truly empty
            if (WO.groups.length === 0) {
                WO.groups = JSON.parse(JSON.stringify(WO.DEFAULT_GROUPS));
            }
            WO.hideLoading();
            WO.renderGroups();
            WO.setupRealtimeSync();
            scheduleRetryLoad();
        }
    }

    // ─── Dynamic Links Fetch ──────────────────────────────────────────────────
    fetch('./dynamic-links.json')
        .then(res => res.json())
        .then(data => { WO.dynamicLinkMap = data; })
        .catch(() => {});

    // ─── App Initialization ───────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        WO.resetKeywordStates();

        // Apply saved theme immediately
        const theme = document.documentElement.dataset.theme;
        WO.setTheme(theme, { persist: false });

        // Initialize all UI modules
        WO.updateAdminButton();
        WO.initUI();
        WO.initSearch();
        WO.initImportExport();

        // ─── Global Keyword Tooltip Portal ────────────────────────────────────
        // Tooltip lives at body level (outside all group cards) so it's never
        // clipped by content-visibility:auto / contain:paint on .group-card.
        // Uses event delegation — no per-tile listeners created or leaked.
        (function initTooltipPortal() {
            const tip = document.getElementById('kw-tooltip');
            if (!tip) return;

            let _hideTimer;

            function show(item) {
                clearTimeout(_hideTimer);
                const desc = item.dataset.description;
                if (!desc) return;

                tip.textContent = desc;
                tip.style.opacity = '0';
                tip.style.display = 'block';

                // Position after the browser has laid out the tip
                requestAnimationFrame(() => {
                    const rect = item.getBoundingClientRect();
                    const th   = tip.offsetHeight;
                    const tw   = tip.offsetWidth;
                    const gap  = 10;
                    const vw   = window.innerWidth;
                    const vh   = window.innerHeight;

                    // Prefer above; flip below if not enough room
                    let top = rect.top - th - gap;
                    if (top < 4) top = rect.bottom + gap;

                    // Clamp horizontally
                    let left = rect.left + rect.width / 2 - tw / 2;
                    left = Math.max(8, Math.min(left, vw - tw - 8));

                    // Clamp vertically (bottom edge)
                    top = Math.min(top, vh - th - 8);

                    tip.style.left = left + 'px';
                    tip.style.top  = top  + 'px';
                    tip.style.opacity = '1';
                });
            }

            function hide() {
                clearTimeout(_hideTimer);
                _hideTimer = setTimeout(() => { tip.style.opacity = '0'; }, 80);
            }

            document.addEventListener('mouseover', e => {
                const item = e.target.closest('.keyword-grid-preview-item');
                if (item && item.dataset.description) show(item);
            }, { passive: true });

            document.addEventListener('mouseout', e => {
                const item = e.target.closest('.keyword-grid-preview-item');
                if (item && !item.contains(e.relatedTarget)) hide();
            }, { passive: true });

            // Hide immediately on scroll to avoid stale positions
            document.addEventListener('scroll', hide, { passive: true, capture: true });
        })();

        // Kick off data loading (shows cache instantly, then syncs)
        loadDataFromServer();
    });

})(window.WO);
