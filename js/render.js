// =============================================================================
// js/render.js — Group & Keyword Rendering
// =============================================================================

(function (WO) {

    // Cache container reference — avoids repeated getElementById on every render
    let _groupsContainerCache = null;

    WO.renderGroups = function () {
        if (!_groupsContainerCache) _groupsContainerCache = document.getElementById('groups-container');
        const groupsContainer = _groupsContainerCache;

        if (document.body.classList.contains('is-zooming')) {
            console.log('Skipping renderGroups — zoom in progress');
            return;
        }

        resetKeywordStates(false, true); // Global fn defined in app.js

        const fragment = document.createDocumentFragment();
        const normalizedSearchQuery = WO.searchMode === WO.SEARCH_MODE_KEYWORDS
            ? WO.normalizeSearchQuery(WO.activeKeywordSearchQuery)
            : '';
        const searchTokens = normalizedSearchQuery ? normalizedSearchQuery.split(/\s+/).filter(Boolean) : [];
        const isKeywordSearchActive = WO.searchMode === WO.SEARCH_MODE_KEYWORDS && searchTokens.length > 0;

        const orderedGroups = WO.getOrderedGroupEntries();
        const filteredGroups = orderedGroups.map(({ group, originalIndex }) => {
            const previewKeywords = group.keywords.map((keyword, keywordIndex) => {
                const { displayText, targetUrl } = WO.parseKeyword(keyword);
                const ek          = WO.getKeywordEncodedKey(keyword);
                const description = WO.keywordDescriptions[ek] || '';
                const isSoftDeleted = WO.keywordDeletedStatus && WO.keywordDeletedStatus[ek] === true;
                const isNew       = WO.isKeywordNew(keyword);
                const addedAt     = WO.keywordAddedAt[ek] || 0;
                const searchText  = [keyword, displayText, targetUrl, description, group.name].join(' ').toLowerCase();
                return { keyword, keywordIndex, displayText, targetUrl, description, ek, isNew, addedAt, searchText, isSoftDeleted };
            }).sort((a, b) => {
                const ca = WO.globalClickCounts[a.ek] || 0;
                const cb = WO.globalClickCounts[b.ek] || 0;
                // Keywords with clicks come before keywords with 0 clicks
                if (ca === 0 && cb === 0) {
                    // Both unclicked: sort oldest first so newest appears last
                    return a.addedAt - b.addedAt;
                }
                if (ca === 0) return 1;  // a has no clicks → goes after b
                if (cb === 0) return -1; // b has no clicks → a goes first
                // Both have clicks: more clicks first, then alphabetical
                if (cb !== ca) return cb - ca;
                return a.displayText.localeCompare(b.displayText, undefined, { sensitivity: 'base' });
            }).filter(e => {
                if (e.isSoftDeleted && !WO.adminLoggedIn) return false;
                return !isKeywordSearchActive || WO.matchesKeywordSearch(e.searchText, searchTokens);
            });
            return { ...group, _originalIndex: originalIndex, _previewKeywords: previewKeywords };
        }).filter(g => !isKeywordSearchActive || g._previewKeywords.length > 0);

        const usedColors = new Set();

        if (filteredGroups.length === 0) {
            const msg = isKeywordSearchActive
                ? 'No keywords or comments match your search.'
                : 'No groups found matching your search.';
            const el = document.createElement('p');
            el.style.cssText = 'color: #ccc; grid-column: 1 / -1; text-align: center;';
            el.textContent = msg;
            fragment.appendChild(el);
        } else {
            filteredGroups.forEach(group => {
                const originalIndex = group._originalIndex;
                const groupColor    = WO.getGroupColor(group.name, usedColors);
                const groupCard     = document.createElement('div');
                groupCard.className  = 'group-card';
                groupCard.dataset.groupIndex = originalIndex;

                // Read theme once before the loop instead of inside every iteration
                const theme = document.documentElement.dataset.theme;
                groupCard.style.background = (theme === 'dark') ? WO.darkenColor(groupColor, 0.6) : groupColor;
                groupCard.style.color = '#222';

                // ── Header ──
                const header = document.createElement('div');
                header.className = 'group-card-header';
                const h3 = document.createElement('h3');
                h3.textContent = group.name;
                h3.dataset.groupIndex = originalIndex;
                h3.style.cursor = WO.adminLoggedIn ? 'pointer' : 'default';

                if (WO.adminLoggedIn) {
                    let lpt;
                    h3.addEventListener('click', e => { e.stopPropagation(); WO.openGroupModal('edit', originalIndex); });
                    h3.addEventListener('touchstart', e => { e.stopPropagation(); lpt = setTimeout(() => WO.openGroupModal('edit', originalIndex), 500); });
                    h3.addEventListener('touchend',   () => clearTimeout(lpt));
                    h3.addEventListener('touchmove',  () => clearTimeout(lpt));
                }
                header.appendChild(h3);

                // ── Actions ──
                const actions   = document.createElement('div');
                actions.className = 'group-actions';
                let addBtnBg;
                if (theme === 'solid-dark')  addBtnBg = WO.darkenColor(groupColor, 0.75);
                else if (theme === 'dark')   addBtnBg = WO.darkenColor(groupColor, 0.45);
                else                         addBtnBg = groupColor;

                // Create add-keyword button programmatically — avoids innerHTML+querySelector antipattern
                const addBtn = document.createElement('button');
                addBtn.type = 'button';
                addBtn.className = 'icon-btn icon-btn--add-keyword';
                addBtn.dataset.action = 'add-keyword';
                addBtn.dataset.groupIndex = String(originalIndex);
                addBtn.style.cssText = `cursor:pointer;z-index:10;pointer-events:auto;user-select:none;background:${addBtnBg} !important;`;
                addBtn.setAttribute('aria-label', `Add keyword to ${group.name}`);
                addBtn.title = `Add keyword to ${group.name}`;
                addBtn.innerHTML = '<span class="icon-plus">+</span>';
                addBtn.onclick = e => { e.stopPropagation(); e.preventDefault(); window.addKeywordToGroup(originalIndex); return false; };
                actions.appendChild(addBtn);

                if (WO.adminLoggedIn) {
                    const delBtn = document.createElement('button');
                    delBtn.className = 'icon-btn';
                    delBtn.dataset.action = 'delete-group';
                    delBtn.dataset.groupIndex = originalIndex;
                    delBtn.innerHTML = '<img src="media/delete.png" alt="Delete" style="width:24px;height:24px;">';
                    actions.appendChild(delBtn);
                }
                header.appendChild(actions);
                groupCard.appendChild(header);

                // ── Keywords Grid ──
                const keywords   = group._previewKeywords || [];
                const previewGrid = document.createElement('div');
                previewGrid.className = 'keyword-grid-preview';

                if (keywords.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'keyword-grid-empty';
                    empty.textContent = 'No keywords yet';
                    previewGrid.appendChild(empty);
                } else {
                    previewGrid.classList.add('is-scrollable');
                    if (keywords.length <= 3)      previewGrid.classList.add('size-small');
                    else if (keywords.length <= 9)  previewGrid.classList.add('size-medium');
                    else                            previewGrid.classList.add('size-large');

                    keywords.forEach(entry => {
                        const { keyword, keywordIndex, displayText, targetUrl, description, ek, isNew, isSoftDeleted } = entry;
                        const item = document.createElement('a');
                        item.className = 'keyword-grid-preview-item';
                        if (isSoftDeleted) item.classList.add('keyword-soft-deleted');
                        item.href = WO.resolveDynamicURL(targetUrl) || '#';
                        item.target = '_blank';
                        item.rel = 'noopener';
                        item.dataset.keywordValue  = keyword;
                        item.dataset.targetUrl     = targetUrl;
                        item.dataset.groupIndex    = originalIndex;
                        item.dataset.keywordIndex  = keywordIndex;
                        item.draggable = true;

                        const clickCount     = WO.globalClickCounts[ek] || 0;
                        const keywordLabelHtml = isKeywordSearchActive
                            ? WO.highlightSearchHtml(displayText, normalizedSearchQuery)
                            : WO.escapeHtml(displayText);

                        // Store description for global tooltip portal (avoids contain:paint clipping)
                        if (description) item.dataset.description = description;

                        item.innerHTML = `
                            ${isNew ? '<div class="keyword-new-badge">NEW</div>' : ''}
                            <div class="keyword-grid-icon">${WO.getFaviconOrEmoji(keyword)}</div>
                            <div class="keyword-grid-text">${keywordLabelHtml}</div>
                            <div class="keyword-click-counter">${clickCount}</div>
                        `;
                        item.setAttribute('aria-label', displayText);
                        previewGrid.appendChild(item);
                    });
                }

                groupCard.appendChild(previewGrid);
                groupCard.draggable = !document.body.classList.contains('is-touch');

                // Create a wrapper to isolate layout shifts during animation
                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'group-card-wrapper';
                cardWrapper.style.position = 'relative';
                cardWrapper.style.height = '100%';
                cardWrapper.style.width = '100%';
                cardWrapper.appendChild(groupCard);

                // Animated hover/tap to expand for >12 items
                if (keywords.length > 12) {
                    // Add a visual indicator
                    const indicator = document.createElement('div');
                    indicator.className = 'group-expand-indicator';
                    indicator.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>';
                    groupCard.appendChild(indicator);

                    let expandTimeout;
                    let collapsedHeight = 0;
                    let expandedHeight = 0;

                    // --- Shared expand/collapse helpers ---
                    groupCard._collapse = doCollapse;

                    function doExpand() {
                        // Auto-collapse any OTHER expanded cards (Accordion style)
                        document.querySelectorAll('.group-card.expanded').forEach(otherCard => {
                            if (otherCard !== groupCard && typeof otherCard._collapse === 'function') {
                                otherCard._collapse();
                            }
                        });

                        clearTimeout(expandTimeout);
                        if (!groupCard.classList.contains('is-animating') && !groupCard.classList.contains('expanded')) {
                            const wrapperRect = cardWrapper.getBoundingClientRect();
                            cardWrapper.style.height = wrapperRect.height + 'px';
                            collapsedHeight = wrapperRect.height;

                            previewGrid.classList.add('expanded');
                            expandedHeight = groupCard.getBoundingClientRect().height;

                            previewGrid.classList.remove('expanded');
                            groupCard.style.height = collapsedHeight + 'px';
                            groupCard.style.position = 'absolute';
                            groupCard.style.top = '0';
                            groupCard.style.left = '0';
                            groupCard.style.width = wrapperRect.width + 'px';
                        }

                        groupCard.classList.add('is-animating');
                        groupCard.classList.add('expanded');
                        previewGrid.classList.add('expanded');

                        groupCard.style.overflow = 'hidden';
                        groupCard.offsetHeight; // Force reflow

                        groupCard.style.transition = 'height 0.7s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.7s ease, border-color 0.7s ease';
                        groupCard.style.zIndex = '100';

                        groupCard.style.height = expandedHeight + 'px';

                        expandTimeout = setTimeout(() => {
                            if (groupCard.classList.contains('expanded')) {
                                groupCard.style.overflow = 'visible';
                            }
                            groupCard.classList.remove('is-animating');
                        }, 700);
                    }

                    function doCollapse() {
                        clearTimeout(expandTimeout);
                        if (!groupCard.classList.contains('expanded')) return;

                        groupCard.classList.add('is-animating');
                        groupCard.style.overflow = 'hidden';

                        groupCard.style.transition = 'none'; // Instant close
                        groupCard.style.height = collapsedHeight + 'px';

                        // Execute instantly for closing
                        groupCard.classList.remove('expanded');
                        previewGrid.classList.remove('expanded');
                        groupCard.style.height = '';
                        groupCard.style.transition = '';
                        groupCard.style.overflow = 'visible';
                        groupCard.style.zIndex = '';
                        groupCard.style.position = '';
                        groupCard.style.top = '';
                        groupCard.style.left = '';
                        groupCard.style.width = '';

                        // Unfreeze wrapper
                        cardWrapper.style.height = '100%';

                        groupCard.classList.remove('is-animating');
                    }

                    // Hover expand removed — expand/collapse is button-click only

                    // --- Click/Tap indicator to toggle ---
                    indicator.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (groupCard.classList.contains('expanded')) {
                            doCollapse();
                        } else {
                            doExpand();
                        }
                    });

                    // Close expanded card when clicking outside (desktop + mobile)
                    document.addEventListener('click', (e) => {
                        if (!groupCard.classList.contains('expanded')) return;
                        if (!groupCard.contains(e.target)) {
                            doCollapse();
                        }
                    });

                }

                fragment.appendChild(cardWrapper);
            });
        }

        groupsContainer.innerHTML = '';
        groupsContainer.appendChild(fragment);

        // Schedule highlight AFTER DOM is updated — rAF ensures it runs in the next paint
        if (WO.lastAddedKeyword !== null) {
            requestAnimationFrame(WO.highlightRecentlyAddedKeyword);
        }
    };

    WO.highlightRecentlyAddedKeyword = function () {
        if (WO.lastAddedKeyword === null || WO.lastAddedGroupIndex === null) return;
        const groupsContainer = document.getElementById('groups-container');
        if (!groupsContainer) return;
        const groupCard = groupsContainer.querySelector(`.group-card[data-group-index="${WO.lastAddedGroupIndex}"]`);
        if (!groupCard) { WO.lastAddedKeyword = null; WO.lastAddedGroupIndex = null; return; }

        // Single targeted query via CSS.escape — replaces querySelectorAll+loop
        if (groupCard) {
            let target = null;
            try {
                target = groupCard.querySelector(`[data-keyword-value="${CSS.escape(WO.lastAddedKeyword)}"]`);
            } catch {
                // Fallback for browsers without CSS.escape
                const candidates = Array.from(groupCard.querySelectorAll('[data-keyword-value]'));
                for (const node of candidates) {
                    if (node.dataset.keywordValue === WO.lastAddedKeyword) { target = node; break; }
                }
            }
            if (target) {
                const scrollParent = target.closest('.keyword-grid-preview.is-scrollable');
                if (scrollParent) {
                    const offset = Math.max(0, target.offsetTop - scrollParent.clientHeight + target.offsetHeight + 16);
                    if (typeof scrollParent.scrollTo === 'function') scrollParent.scrollTo({ top: offset, behavior: 'smooth' });
                    else scrollParent.scrollTop = offset;
                } else {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                }
                target.classList.add('keyword-new');
                setTimeout(() => target.classList.remove('keyword-new'), 1600);
            }
        }
        WO.lastAddedKeyword = null;
        WO.lastAddedGroupIndex = null;
    };


    // ── Lightweight in-place search highlight updater ──────────────────────────
    // Called on every keystroke INSTEAD of renderGroups() to avoid full DOM rebuild
    // which causes favicon <img> nodes to flicker/reload.
    WO.updateSearchHighlighting = function () {
        if (!_groupsContainerCache) _groupsContainerCache = document.getElementById('groups-container');
        const container = _groupsContainerCache;
        if (!container) return;

        const normalizedQuery = WO.searchMode === WO.SEARCH_MODE_KEYWORDS
            ? WO.normalizeSearchQuery(WO.activeKeywordSearchQuery)
            : '';
        const searchTokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];
        const isActive = WO.searchMode === WO.SEARCH_MODE_KEYWORDS && searchTokens.length > 0;

        // Update every keyword item in-place — no DOM destroy/rebuild
        container.querySelectorAll('.keyword-grid-preview-item').forEach(item => {
            const keyword   = item.dataset.keywordValue || '';
            const targetUrl = item.dataset.targetUrl   || '';
            const { displayText } = WO.parseKeyword(keyword);
            const ek          = WO.getKeywordEncodedKey(keyword);
            const description = WO.keywordDescriptions[ek] || '';
            const searchText  = [keyword, displayText, targetUrl, description].join(' ').toLowerCase();

            // Show/hide based on search match
            const matches = !isActive || WO.matchesKeywordSearch(searchText, searchTokens);
            item.style.display = matches ? '' : 'none';

            // Update label text only — leave icon DOM untouched (no flicker)
            const textEl = item.querySelector('.keyword-grid-text');
            if (textEl) {
                textEl.innerHTML = isActive
                    ? WO.highlightSearchHtml(displayText, normalizedQuery)
                    : WO.escapeHtml(displayText);
            }
        });

        // Show/hide entire group card wrappers based on whether any items remain visible
        container.querySelectorAll('.group-card').forEach(card => {
            const hasVisible = Array.from(card.querySelectorAll('.keyword-grid-preview-item'))
                .some(it => it.style.display !== 'none');
            const wrapper = card.closest('.group-card-wrapper') || card;
            wrapper.style.display = (!isActive || hasVisible) ? '' : 'none';
        });
    };

    // ── Lightweight in-place theme color updater ───────────────────────────────
    // Called by setTheme() INSTEAD of renderGroups() — only patches card backgrounds.
    // Icons (<img> nodes) are never touched, so no blink/reload occurs.
    WO.updateThemeColors = function () {
        if (!_groupsContainerCache) _groupsContainerCache = document.getElementById('groups-container');
        const container = _groupsContainerCache;
        if (!container) return;

        const theme = document.documentElement.dataset.theme;
        const usedColors = new Set();

        container.querySelectorAll('.group-card').forEach(card => {
            const gi = card.dataset.groupIndex;
            const group = WO.groups[gi];
            if (!group) return;
            const groupColor = WO.getGroupColor(group.name, usedColors);
            if (theme === 'dark') {
                card.style.background = WO.darkenColor(groupColor, 0.6);
            } else if (theme === 'solid-dark') {
                card.style.background = WO.darkenColor(groupColor, 0.75);
            } else {
                card.style.background = groupColor;
            }
        });
    };

})(window.WO);

