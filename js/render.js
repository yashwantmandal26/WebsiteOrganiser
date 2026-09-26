// =============================================================================
// js/render.js — Group & Keyword Rendering
// =============================================================================

(function (WO) {

    // Cache container reference — avoids repeated getElementById on every render
    let _groupsContainerCache = null;

    // Single delegated click handler for collapsing expanded cards (prevents memory leak)
    let _outsideClickHandlerRegistered = false;
    function _handleOutsideClick(e) {
        const expandedCards = document.querySelectorAll('.group-card.expanded');
        expandedCards.forEach(card => {
            if (!card.contains(e.target)) {
                const indicator = card.querySelector('.group-expand-indicator');
                if (indicator) indicator.click();
            }
        });
    }

    WO.renderGroups = function () {
        if (!_groupsContainerCache) _groupsContainerCache = document.getElementById('groups-container');
        const groupsContainer = _groupsContainerCache;

        if (document.body.classList.contains('is-zooming')) {
            console.log('Skipping renderGroups — zoom in progress');
            return;
        }

        resetKeywordStates(false, true); // Global fn defined in app.js
        if (!WO.groups || WO.groups.length === 0) {
            const backup = WO.loadLocalDataBackup();
            if (!backup || !WO.applyLocalDataBackup(backup)) {
                if (WO.DEFAULT_GROUPS && WO.DEFAULT_GROUPS.length > 0) {
                    WO.groups = JSON.parse(JSON.stringify(WO.DEFAULT_GROUPS));
                }
            }
        }
        WO.ensureStableBookmarkIds();

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
                const bookmarkId  = WO.getBookmarkId(group, keywordIndex);
                const ek          = bookmarkId || WO.getKeywordEncodedKey(keyword);
                const description = WO.getBookmarkMetadata(WO.keywordDescriptions, originalIndex, keywordIndex, keyword, '');
                const isSoftDeleted = WO.getBookmarkMetadata(WO.keywordDeletedStatus, originalIndex, keywordIndex, keyword, false) === true;
                const addedAt     = WO.getBookmarkMetadata(WO.keywordAddedAt, originalIndex, keywordIndex, keyword, 0);
                const isNew       = WO.isKeywordNew(keyword, ek) || (Boolean(addedAt) && (Date.now() - Number(addedAt)) <= WO.NEW_BADGE_DURATION_MS);
                const tags        = Array.isArray(group.keywordTags[bookmarkId]) ? group.keywordTags[bookmarkId] : [];
                const searchText  = [keyword, displayText, targetUrl, description, tags.join(' '), group.name].join(' ').toLowerCase();
                return { keyword, keywordIndex, bookmarkId, displayText, targetUrl, description, tags, ek, isNew, addedAt, searchText, isSoftDeleted };
            }).sort((a, b) => {
                // 1. Newly added websites ALWAYS come at the top
                if (a.isNew !== b.isNew) {
                    return a.isNew ? -1 : 1;
                }
                if (a.isNew && b.isNew) {
                    // Both newly added: newest addedAt first
                    const diffTime = (Number(b.addedAt) || 0) - (Number(a.addedAt) || 0);
                    if (diffTime !== 0) return diffTime;
                    const ca = Number(WO.localClickCounts[a.ek]) || 0;
                    const cb = Number(WO.localClickCounts[b.ek]) || 0;
                    if (cb !== ca) return cb - ca;
                    return a.displayText.localeCompare(b.displayText, undefined, { sensitivity: 'base' });
                }

                // 2. Regular websites: sort by usage (clicks)
                const ca = Number(WO.localClickCounts[a.ek]) || 0;
                const cb = Number(WO.localClickCounts[b.ek]) || 0;
                // Keywords with clicks come before keywords with 0 clicks
                if (ca === 0 && cb === 0) {
                    if (a.addedAt && b.addedAt && a.addedAt !== b.addedAt) {
                        return a.addedAt - b.addedAt;
                    }
                    return a.keywordIndex - b.keywordIndex;
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
                const groupColor    = WO.getGroupColor(group, usedColors, originalIndex);
                const groupCard     = document.createElement('div');
                groupCard.className  = 'group-card';
                groupCard.dataset.groupIndex = originalIndex;

                // Read theme once before the loop instead of inside every iteration
                const theme = document.documentElement.dataset.theme;
                groupCard.style.background = (theme === 'dark') ? WO.darkenColor(groupColor, 0.6) : groupColor;
                groupCard.style.color = '#222';
                // Expose group color as CSS vars for header divider, border glow, tile tint, and accent strip
                groupCard.style.setProperty('--group-color', groupColor);
                groupCard.style.setProperty('--group-header-color', groupColor + 'aa');
                // Store raw hex color on dataset for CSS usage
                groupCard.dataset.groupColor = groupColor;

                // ── Header ──
                const header = document.createElement('div');
                header.className = 'group-card-header';
                const h3 = document.createElement('h3');
                // Presentation aliases keep stored group names and admin editing intact.
                const categoryKey = group.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const categoryHeaders = {
                    watchmovies: ['WATCH MOVIES', 'movies'], streamingmoviesites: ['WATCH MOVIES', 'movies'],
                    downloadmovies: ['DOWNLOAD MOVIES', 'download'], downloadmoviesites: ['DOWNLOAD MOVIES', 'download'],
                    instantbrowsergames: ['Instant BrowserGames', 'games'], browsergames: ['Instant BrowserGames', 'games']
                };
                const groupIcons = {
                    lifehacks: 'bulb', pcdwdgameswebsites: 'desktopGame', utilities: 'tools',
                    popularsites: 'globe', usefulai: 'sparkles', crackedpcsoftwaredwnd: 'software',
                    mocksandcourses: 'graduation', ai2: 'chip', skillsdevelopmentwithfun: 'rocket'
                };
                const category = categoryHeaders[categoryKey] || [group.name, groupIcons[categoryKey] || 'folder'];
                h3.textContent = category ? category[0] : group.name;
                if (category) {
                    const paths = {
                        bulb: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3ZM12 1v1M3 4l2 2m16-2-2 2M1 11h2m18 0h2"/>',
                        desktopGame: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4M7 8v4m-2-2h4"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="18" cy="11" r="1" fill="currentColor"/>',
                        tools: '<path d="m14 6 4 4 3-3a6 6 0 0 1-7 8l-6 6a3 3 0 0 1-4-4l6-6a6 6 0 0 1 8-7l-4 2Z"/>',
                        globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
                        sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" fill="currentColor"/><path d="M20 2v4m-2-2h4M3 18v4m-2-2h4"/>',
                        software: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20m-15 4-3 3 3 3m10-6 3 3-3 3m-4-6-2 6M5 5.5h.01M8 5.5h.01"/>',
                        graduation: '<path d="m2 8 10-5 10 5-10 5L2 8Zm4 3v7c4 3 8 3 12 0v-7m4-3v9"/>',
                        chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
                        rocket: '<path d="M9 15c-1-5 4-12 12-12 0 8-7 13-12 12ZM9 8H5l-3 6 7 1m7 0v4l-6 3-1-7M6 18l-3 3m0-4-1 3m5 1-3 1"/><circle cx="16" cy="8" r="2"/>',
                        folder: '<path d="M3 5h6l2 3h10v12H3V5Z"/><path d="M7 12h10m-10 4h6"/>',
                        movies: '<path d="M3 10h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" fill="currentColor"/><path d="m3 10-1-6 18-3 1 6Z"/><path d="m6 4 3 4m3-5 3 4m-9 7h2m3 0h2m-7 3h2"/>',
                        download: '<path d="M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5"/>',
                        games: '<path d="M7 6h10c3 0 4 4 5 11 .3 3-2 4-4 1l-2-2H8l-2 2c-2 3-4.3 2-4-1C3 10 4 6 7 6Z" fill="currentColor"/><path d="M7 9v5m-2.5-2.5h5" stroke="var(--group-color)"/><circle cx="16" cy="10" r="1" fill="var(--group-color)" stroke="none"/><circle cx="18" cy="13" r="1" fill="var(--group-color)" stroke="none"/>'
                    };
                    const icon = document.createElement('span');
                    icon.className = 'category-heading-icon';
                    icon.setAttribute('aria-hidden', 'true');
                    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths[category[1]] + '</svg>';
                    h3.prepend(icon);
                }
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
                else                         addBtnBg = '#ffffff';

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
                        const { keyword, keywordIndex, bookmarkId, displayText, targetUrl, description, tags, ek, isNew, isSoftDeleted, searchText } = entry;
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
                        item.dataset.bookmarkId    = bookmarkId;
                        item.draggable = true;
                        if (WO.bulkMode) item.classList.add('bulk-selectable');
                        if (WO.selectedBookmarkIds.has(bookmarkId)) item.classList.add('bulk-selected');

                        // Performance: Cache search string & display text on element for zero-cost search filtering
                        item._searchText  = searchText;
                        item._displayText = displayText;

                        const clickCount     = Number(WO.localClickCounts[ek]) || 0;
                        const keywordLabelHtml = isKeywordSearchActive
                            ? WO.highlightSearchHtml(displayText, normalizedSearchQuery)
                            : WO.escapeHtml(displayText);

                        // Store description for global tooltip portal (avoids contain:paint clipping)
                        if (description) item.dataset.description = description;

                        item.innerHTML = `
                            ${WO.bulkMode ? `<span class="bulk-check" aria-hidden="true">${WO.selectedBookmarkIds.has(bookmarkId) ? '✓' : ''}</span>` : ''}
                            ${isNew ? '<div class="keyword-new-badge">NEW</div>' : ''}
                            <div class="keyword-grid-icon">${WO.getFaviconOrEmoji(keyword)}</div>
                            <div class="keyword-grid-text">${keywordLabelHtml}</div>
                            ${tags.length ? `<div class="keyword-tags">${tags.map(t => `<span>${WO.escapeHtml(t)}</span>`).join('')}</div>` : ''}
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
                    const hiddenCount = keywords.length - 12;

                    // Build the indicator as a pill: [+N more  ∨]
                    const indicator = document.createElement('div');
                    indicator.className = 'group-expand-indicator';

                    const chip = document.createElement('div');
                    chip.className = 'group-expand-chip';

                    const countBadge = document.createElement('span');
                    countBadge.className = 'group-expand-count';
                    countBadge.textContent = `+${hiddenCount} more`;

                    const chevronSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    chevronSvg.setAttribute('viewBox', '0 0 24 24');
                    chevronSvg.setAttribute('width', '16');
                    chevronSvg.setAttribute('height', '16');
                    chevronSvg.setAttribute('aria-hidden', 'true');
                    const chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    chevronPath.setAttribute('fill', 'currentColor');
                    chevronPath.setAttribute('d', 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z');
                    chevronSvg.appendChild(chevronPath);

                    chip.appendChild(countBadge);
                    chip.appendChild(chevronSvg);
                    indicator.appendChild(chip);
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

                        // Reset chip label immediately on collapse (covers outside-click too)
                        countBadge.textContent = `+${hiddenCount} more`;
                        chip.classList.remove('group-expand-chip--expanded');

                        groupCard.classList.add('is-animating');
                        groupCard.style.overflow = 'hidden';

                        // Capture current expanded height before removing class
                        const currentHeight = groupCard.getBoundingClientRect().height;
                        groupCard.style.height = currentHeight + 'px';
                        groupCard.offsetHeight; // Force reflow

                        // Remove expanded class first (collapses grid items)
                        groupCard.classList.remove('expanded');
                        previewGrid.classList.remove('expanded');

                        // Animate height back to collapsed size
                        groupCard.style.transition = 'height 0.45s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.45s ease, border-color 0.45s ease';
                        groupCard.style.height = collapsedHeight + 'px';

                        expandTimeout = setTimeout(() => {
                            // Reset all inline styles after animation completes
                            groupCard.style.height = '';
                            groupCard.style.transition = '';
                            groupCard.style.overflow = 'visible';
                            groupCard.style.zIndex = '';
                            groupCard.style.position = '';
                            groupCard.style.top = '';
                            groupCard.style.left = '';
                            groupCard.style.width = '';
                            cardWrapper.style.height = '100%';
                            groupCard.classList.remove('is-animating');
                        }, 460);
                    }


                    // Hover expand removed — expand/collapse is button-click only

                    // --- Click/Tap indicator to toggle ---
                    indicator.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (groupCard.classList.contains('expanded')) {
                            doCollapse();
                            countBadge.textContent = `+${hiddenCount} more`;
                            chip.classList.remove('group-expand-chip--expanded');
                        } else {
                            doExpand();
                            countBadge.textContent = 'Show less';
                            chip.classList.add('group-expand-chip--expanded');
                        }
                    });


                    // Close expanded card when clicking outside — uses single delegated handler (no leak)
                    if (!_outsideClickHandlerRegistered) {
                        document.addEventListener('click', _handleOutsideClick);
                        _outsideClickHandlerRegistered = true;
                    }

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

        const activeGroupIndices = new Set();
        const items = container.querySelectorAll('.keyword-grid-preview-item');

        // Fast-path: single loop over pre-cached strings
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const searchText = item._searchText || (item._searchText = (item.dataset.keywordValue + ' ' + (item.dataset.description || '')).toLowerCase());
            const matches = !isActive || WO.matchesKeywordSearch(searchText, searchTokens);

            if (matches) {
                if (item.style.display !== '') item.style.display = '';
                activeGroupIndices.add(item.dataset.groupIndex);
                if (isActive) {
                    const textEl = item.querySelector('.keyword-grid-text');
                    if (textEl) textEl.innerHTML = WO.highlightSearchHtml(item._displayText || item.dataset.keywordValue, normalizedQuery);
                }
            } else {
                if (item.style.display !== 'none') item.style.display = 'none';
            }

            if (!isActive) {
                const textEl = item.querySelector('.keyword-grid-text');
                if (textEl && item._displayText) textEl.textContent = item._displayText;
            }
        }

        // Show/hide group cards without nested querySelectorAll
        const cards = container.querySelectorAll('.group-card');
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const gi = card.dataset.groupIndex;
            const hasVisible = !isActive || activeGroupIndices.has(gi);
            const wrapper = card.closest('.group-card-wrapper') || card;
            const targetDisplay = hasVisible ? '' : 'none';
            if (wrapper.style.display !== targetDisplay) {
                wrapper.style.display = targetDisplay;
            }
        }
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
            const groupColor = WO.getGroupColor(group, usedColors, parseInt(gi, 10));
            if (theme === 'dark') {
                card.style.background = WO.darkenColor(groupColor, 0.6);
            } else if (theme === 'solid-dark') {
                card.style.background = WO.darkenColor(groupColor, 0.75);
            } else {
                card.style.background = groupColor;
            }
            // Keep all color CSS vars in sync
            card.style.setProperty('--group-color', groupColor);
            card.style.setProperty('--group-header-color', groupColor + 'aa');
            card.dataset.groupColor = groupColor;

            // Sync add-keyword button background with theme
            const addBtn = card.querySelector('.icon-btn--add-keyword');
            if (addBtn) {
                let addBtnBg;
                if (theme === 'solid-dark')  addBtnBg = WO.darkenColor(groupColor, 0.75);
                else if (theme === 'dark')   addBtnBg = WO.darkenColor(groupColor, 0.45);
                else                         addBtnBg = '#ffffff';
                addBtn.style.setProperty('background', addBtnBg, 'important');
            }
        });
    };

})(window.WO);
