(function (WO) {
    'use strict';

    let _isScanning = false;
    let _abortController = null;
    let _scanResults = [];
    let _activeFilter = 'all';

    function getModalElements() {
        return {
            modal: document.getElementById('link-health-modal'),
            closeBtn: document.getElementById('link-health-close-btn'),
            triggerBtn: document.getElementById('link-health-btn'),
            startBtn: document.getElementById('lh-start-btn'),
            stopBtn: document.getElementById('lh-stop-btn'),
            cleanAllBtn: document.getElementById('lh-clean-all-btn'),
            progressWrap: document.getElementById('lh-progress-wrap'),
            progressBar: document.getElementById('lh-progress-bar'),
            statusMsg: document.getElementById('lh-status-msg'),
            resultsList: document.getElementById('lh-results-list'),
            totalCount: document.getElementById('lh-total-count'),
            aliveCount: document.getElementById('lh-alive-count'),
            deadCount: document.getElementById('lh-dead-count'),
            timeoutCount: document.getElementById('lh-timeout-count'),
            tabAll: document.getElementById('lh-tab-all'),
            tabDead: document.getElementById('lh-tab-dead'),
            tabTimeout: document.getElementById('lh-tab-timeout'),
            tabAlive: document.getElementById('lh-tab-alive')
        };
    }

    function getAllBookmarkLinks() {
        const links = [];
        if (!Array.isArray(WO.groups)) return links;

        WO.groups.forEach((group, gi) => {
            if (!group || !Array.isArray(group.keywords)) return;

            group.keywords.forEach((keyword, ki) => {
                if (!keyword || typeof keyword !== 'string') return;
                const trimmed = keyword.trim();
                if (!trimmed) return;

                const isSoftDeleted = typeof WO.getBookmarkMetadata === 'function' &&
                    WO.getBookmarkMetadata(WO.keywordDeletedStatus, gi, ki, trimmed, false) === true;
                if (isSoftDeleted) return;

                const parsed = (typeof WO.parseKeyword === 'function')
                    ? WO.parseKeyword(trimmed)
                    : { displayText: trimmed, targetUrl: trimmed, isUrl: /^https?:\/\//i.test(trimmed) };

                // Only inspect bookmarks that represent actual URLs or domain names
                const isWebsite = Boolean(parsed.isUrl || /^https?:\/\//i.test(trimmed) || (trimmed.includes('.') && !trimmed.includes(' ')));
                if (!isWebsite) return;

                let targetUrl = parsed.targetUrl || trimmed;
                if (typeof WO.resolveDynamicURL === 'function') {
                    targetUrl = WO.resolveDynamicURL(targetUrl);
                }
                if (!targetUrl || targetUrl.startsWith('#') || targetUrl.startsWith('javascript:')) return;

                // Ensure valid HTTP/HTTPS URL
                if (!/^https?:\/\//i.test(targetUrl)) {
                    targetUrl = 'https://' + targetUrl;
                }

                links.push({
                    gi,
                    ki,
                    keyword: trimmed,
                    displayText: parsed.displayText || trimmed,
                    targetUrl,
                    groupName: group.name || `Group ${gi + 1}`,
                    status: 'pending', // 'alive' | 'dead' | 'timeout' | 'scanning' | 'pending'
                    latency: 0,
                    message: 'Pending scan...',
                    trashed: false
                });
            });
        });

        return links;
    }

    async function checkDomainDns(hostname, signal) {
        if (!hostname) return null;
        const cleanHost = hostname.replace(/^www\./i, '');

        // 1. Google DoH
        try {
            const url = `https://dns.google/resolve?name=${encodeURIComponent(cleanHost)}&type=A`;
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 3500);
            if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });

            const res = await fetch(url, { signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) {
                const data = await res.json();
                if (data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0) {
                    return true;
                }
                if (data.Status === 3) {
                    return false; // NXDOMAIN (Domain does not exist)
                }
            }
        } catch {}

        // 2. Cloudflare DoH fallback
        try {
            const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanHost)}&type=A`;
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 3500);
            if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });

            const res = await fetch(url, {
                headers: { 'accept': 'application/dns-json' },
                signal: ctrl.signal
            });
            clearTimeout(tid);
            if (res.ok) {
                const data = await res.json();
                if (data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0) {
                    return true;
                }
                if (data.Status === 3) {
                    return false; // NXDOMAIN
                }
            }
        } catch {}

        return null; // Inconclusive
    }

    async function probeUrl(item, signal) {
        const start = performance.now();
        const timeoutMs = 6500;
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), timeoutMs);

        const onParentAbort = () => ctrl.abort();
        if (signal) signal.addEventListener('abort', onParentAbort, { once: true });

        const cleanUp = () => {
            clearTimeout(tid);
            if (signal) signal.removeEventListener('abort', onParentAbort);
        };

        // Phase 1: Direct CORS fetch to check genuine HTTP status code (200, 404, 500, etc.)
        try {
            const res = await fetch(item.targetUrl, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                signal: ctrl.signal
            });
            cleanUp();
            const latency = Math.round(performance.now() - start);

            if (res.status === 404) {
                return { status: 'dead', latency, message: '404 Not Found' };
            }
            if (res.status === 410) {
                return { status: 'dead', latency, message: '410 Gone / Expired' };
            }
            if (res.status >= 500) {
                return { status: 'dead', latency, message: `HTTP ${res.status} Server Error` };
            }
            if (res.status === 401 || res.status === 403) {
                return { status: 'alive', latency, message: `Active (Protected ${res.status})` };
            }
            if (res.ok || (res.status >= 200 && res.status < 400)) {
                return { status: 'alive', latency, message: `Active (${latency}ms)` };
            }
            return { status: 'alive', latency, message: `Active (HTTP ${res.status})` };
        } catch (corsErr) {
            if (signal && signal.aborted) {
                cleanUp();
                return { status: 'aborted', latency: 0, message: 'Scan Cancelled' };
            }
            if (ctrl.signal.aborted) {
                cleanUp();
                return { status: 'timeout', latency: timeoutMs, message: 'Connection Timeout (>6s)' };
            }

            // Phase 2: CORS blocked (common for standard websites without open CORS headers).
            // Test reachability via mode: 'no-cors' GET. If server responds, it resolves with opaque response.
            try {
                const noCorsCtrl = new AbortController();
                const noCorsTid = setTimeout(() => noCorsCtrl.abort(), 4500);
                if (signal) signal.addEventListener('abort', () => noCorsCtrl.abort(), { once: true });

                await fetch(item.targetUrl, {
                    method: 'GET',
                    mode: 'no-cors',
                    cache: 'no-store',
                    signal: noCorsCtrl.signal
                });
                clearTimeout(noCorsTid);
                cleanUp();
                const latency = Math.round(performance.now() - start);
                return { status: 'alive', latency, message: `Active (${latency}ms)` };
            } catch (noCorsErr) {
                cleanUp();
                if (signal && signal.aborted) {
                    return { status: 'aborted', latency: 0, message: 'Scan Cancelled' };
                }
                if (noCorsErr.name === 'AbortError') {
                    return { status: 'timeout', latency: timeoutMs, message: 'Connection Timeout (>6s)' };
                }

                // Phase 3: Protocol upgrade check if running on HTTPS page and target is http://
                if (item.targetUrl.startsWith('http://') && window.location.protocol === 'https:') {
                    try {
                        const httpsUrl = item.targetUrl.replace(/^http:\/\//i, 'https://');
                        await fetch(httpsUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(3500) });
                        const latency = Math.round(performance.now() - start);
                        return { status: 'alive', latency, message: `Active via HTTPS (${latency}ms)` };
                    } catch {}
                }

                // Phase 4: Distinguish dead domain vs alive domain using DNS-over-HTTPS
                try {
                    const parsedUrl = new URL(item.targetUrl);
                    const dnsResolved = await checkDomainDns(parsedUrl.hostname, signal);

                    if (dnsResolved === true) {
                        // Domain is 100% active and registered with live DNS records!
                        const latency = Math.round(performance.now() - start);
                        return { status: 'alive', latency, message: 'Active (Online)' };
                    }
                    if (dnsResolved === false) {
                        // NXDOMAIN — domain is genuinely expired, suspended, or nonexistent
                        const latency = Math.round(performance.now() - start);
                        return { status: 'dead', latency, message: 'Dead Domain (NXDOMAIN)' };
                    }
                } catch {}

                // Host is completely unreachable
                const latency = Math.round(performance.now() - start);
                return { status: 'dead', latency, message: 'Dead / Host Unreachable' };
            }
        }
    }

    function updateStats() {
        const els = getModalElements();
        const total = _scanResults.length;
        const alive = _scanResults.filter(it => it.status === 'alive').length;
        const dead = _scanResults.filter(it => it.status === 'dead').length;
        const timeout = _scanResults.filter(it => it.status === 'timeout').length;

        if (els.totalCount) els.totalCount.textContent = String(total);
        if (els.aliveCount) els.aliveCount.textContent = String(alive);
        if (els.deadCount) els.deadCount.textContent = String(dead);
        if (els.timeoutCount) els.timeoutCount.textContent = String(timeout);

        if (els.tabAll) els.tabAll.textContent = String(total);
        if (els.tabDead) els.tabDead.textContent = String(dead);
        if (els.tabTimeout) els.tabTimeout.textContent = String(timeout);
        if (els.tabAlive) els.tabAlive.textContent = String(alive);

        const actionableDead = _scanResults.filter(it => (it.status === 'dead' || it.status === 'timeout') && !it.trashed);
        if (els.cleanAllBtn) {
            els.cleanAllBtn.style.display = actionableDead.length > 0 ? 'inline-flex' : 'none';
            els.cleanAllBtn.textContent = `🗑️ Move All Dead Links (${actionableDead.length}) to Trash`;
        }
    }

    function renderResultsList() {
        const els = getModalElements();
        if (!els.resultsList) return;

        updateStats();

        let filtered = _scanResults;
        if (_activeFilter === 'dead') {
            filtered = _scanResults.filter(it => it.status === 'dead');
        } else if (_activeFilter === 'timeout') {
            filtered = _scanResults.filter(it => it.status === 'timeout');
        } else if (_activeFilter === 'alive') {
            filtered = _scanResults.filter(it => it.status === 'alive');
        }

        if (filtered.length === 0) {
            els.resultsList.innerHTML = `<div class="link-health-empty-msg">No links matching the "${_activeFilter}" filter.</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        filtered.forEach((item) => {
            const card = document.createElement('div');
            card.className = `link-health-item-card status-${item.status}${item.trashed ? ' is-trashed' : ''}`;

            let statusBadge = '';
            if (item.trashed) {
                statusBadge = '<span class="lh-badge badge-trashed">🗑️ Trashed</span>';
            } else if (item.status === 'alive') {
                statusBadge = `<span class="lh-badge badge-alive">✅ ${WO.escapeHtml(item.message)}</span>`;
            } else if (item.status === 'dead') {
                statusBadge = `<span class="lh-badge badge-dead">❌ ${WO.escapeHtml(item.message)}</span>`;
            } else if (item.status === 'timeout') {
                statusBadge = `<span class="lh-badge badge-timeout">⚠️ ${WO.escapeHtml(item.message)}</span>`;
            } else if (item.status === 'scanning') {
                statusBadge = '<span class="lh-badge badge-scanning">⏳ Testing...</span>';
            } else {
                statusBadge = '<span class="lh-badge badge-pending">⚪ Pending</span>';
            }

            const canAct = !item.trashed;
            const canRetest = canAct && item.status !== 'pending' && item.status !== 'scanning' && !_isScanning;
            const canEdit = canAct && (item.status === 'dead' || item.status === 'timeout');

            card.innerHTML = `
                <div class="lh-item-left">
                    <div class="lh-item-title-row">
                        <span class="lh-group-tag">📁 ${WO.escapeHtml(item.groupName)}</span>
                        <strong class="lh-item-name">${WO.escapeHtml(item.displayText)}</strong>
                        ${statusBadge}
                    </div>
                    <a href="${WO.escapeHtml(item.targetUrl)}" target="_blank" rel="noopener noreferrer" class="lh-item-url" title="${WO.escapeHtml(item.targetUrl)}">${WO.escapeHtml(item.targetUrl)}</a>
                </div>
                <div class="lh-item-actions">
                    <a href="${WO.escapeHtml(item.targetUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm holo-btn" title="Open website in new tab">🌐 Visit</a>
                    ${canRetest ? `<button type="button" class="btn btn-sm btn-secondary lh-retest-btn" title="Re-test this link">🔄 Check</button>` : ''}
                    ${canEdit ? `<button type="button" class="btn btn-sm btn-secondary lh-edit-btn" title="Edit this URL">✏️ Edit</button>` : ''}
                    ${canAct ? `<button type="button" class="btn btn-sm btn-danger lh-trash-single-btn" title="Move link to Recycle Bin">🗑️ Trash</button>` : '<span style="font-size:11px;color:#888;">🗑️ In Recycle Bin</span>'}
                </div>
            `;

            // Action Listeners
            const retestBtn = card.querySelector('.lh-retest-btn');
            if (retestBtn) {
                retestBtn.addEventListener('click', () => retestSingleLink(item));
            }

            const editBtn = card.querySelector('.lh-edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => editLink(item));
            }

            const trashBtn = card.querySelector('.lh-trash-single-btn');
            if (trashBtn) {
                trashBtn.addEventListener('click', () => moveLinkToTrash(item));
            }

            fragment.appendChild(card);
        });

        els.resultsList.innerHTML = '';
        els.resultsList.appendChild(fragment);
    }

    async function retestSingleLink(item) {
        if (_isScanning) return;
        item.status = 'scanning';
        item.message = 'Re-checking...';
        renderResultsList();

        const result = await probeUrl(item, null);
        item.status = result.status;
        item.latency = result.latency;
        item.message = result.message;
        renderResultsList();
    }

    function editLink(item) {
        const group = WO.groups[item.gi];
        if (!group || !Array.isArray(group.keywords)) return;
        const ki = group.keywords.indexOf(item.keyword);
        if (ki === -1) {
            alert('Link not found or data changed.');
            return;
        }

        WO.closeLinkHealthModal();
        if (typeof WO.renameKeyword === 'function') {
            WO.renameKeyword(item.gi, ki, item.keyword, false);
        }
    }

    async function moveLinkToTrash(item) {
        if (!WO.adminLoggedIn) {
            alert('Admin session required to move links to Trash.');
            return;
        }
        if (!confirm(`Move "${item.displayText}" to Recycle Bin?`)) return;

        const group = WO.groups[item.gi];
        if (!group || !Array.isArray(group.keywords)) {
            alert('Group not found or data changed.');
            return;
        }

        const ki = group.keywords.indexOf(item.keyword);
        if (ki === -1) {
            item.trashed = true;
            renderResultsList();
            return;
        }

        if (!Array.isArray(group.trash)) group.trash = [];
        const bookmarkId = (typeof WO.getBookmarkId === 'function') ? WO.getBookmarkId(item.gi, ki) : item.keyword;
        const tags = (group.keywordTags && group.keywordTags[bookmarkId]) || [];

        const trashItem = {
            id: bookmarkId,
            keyword: item.keyword,
            tags: tags,
            deletedAt: Date.now(),
            originalIndex: ki
        };

        group.trash.push(trashItem);
        group.keywords.splice(ki, 1);
        if (Array.isArray(group.keywordIds)) group.keywordIds.splice(ki, 1);
        if (group.keywordTags) delete group.keywordTags[bookmarkId];

        item.trashed = true;

        try {
            await WO.syncAndSaveGroups();
        } catch (e) {
            console.warn('Sync warning:', e);
        }

        if (typeof WO.renderGroups === 'function') {
            WO.renderGroups();
        }

        if (typeof WO.logActivity === 'function') {
            WO.logActivity('DELETE_KEYWORD', {
                targetName: item.keyword,
                groupName: group.name,
                groupIndex: item.gi,
                payload: { displayText: item.displayText }
            });
        }

        renderResultsList();

        if (typeof WO.showToast === 'function') {
            WO.showToast(`🗑️ Moved "${item.displayText}" to Trash`, 'info');
        }
    }

    async function moveAllDeadToTrash() {
        if (!WO.adminLoggedIn) {
            alert('Admin session required to move links to Trash.');
            return;
        }

        const actionable = _scanResults.filter(it => (it.status === 'dead' || it.status === 'timeout') && !it.trashed);
        if (actionable.length === 0) {
            const msg = 'No dead or broken links found to move to Trash.';
            if (typeof WO.showToast === 'function') {
                WO.showToast(msg, 'info');
            } else {
                alert(msg);
            }
            return;
        }

        const count = actionable.length;
        if (!confirm(`Move all ${count} dead/broken links to the Recycle Bin?\n\nYou can restore any of them anytime from Admin Tools > Recycle Bin.`)) {
            return;
        }

        let movedCount = 0;
        const trashedDetails = [];

        // Group by groupIndex for safe batch removal
        const byGroup = new Map();
        for (const item of actionable) {
            if (!byGroup.has(item.gi)) byGroup.set(item.gi, []);
            byGroup.get(item.gi).push(item);
        }

        byGroup.forEach((items, gi) => {
            const group = WO.groups[gi];
            if (!group || !Array.isArray(group.keywords)) return;
            if (!Array.isArray(group.trash)) group.trash = [];

            // Match all items to their current index in this group
            const itemsToRemove = [];
            items.forEach(item => {
                const ki = group.keywords.indexOf(item.keyword);
                if (ki !== -1) {
                    itemsToRemove.push({ item, ki });
                }
            });

            // Sort descending by index so splicing preserves indices of earlier items
            itemsToRemove.sort((a, b) => b.ki - a.ki);

            itemsToRemove.forEach(({ item, ki }) => {
                const kw = group.keywords[ki];
                const bookmarkId = (typeof WO.getBookmarkId === 'function') ? WO.getBookmarkId(gi, ki) : kw;
                const tags = (group.keywordTags && group.keywordTags[bookmarkId]) || [];

                const trashItem = {
                    id: bookmarkId,
                    keyword: kw,
                    tags: tags,
                    deletedAt: Date.now(),
                    originalIndex: ki
                };

                group.trash.push(trashItem);
                group.keywords.splice(ki, 1);
                if (Array.isArray(group.keywordIds)) group.keywordIds.splice(ki, 1);
                if (group.keywordTags) delete group.keywordTags[bookmarkId];

                item.trashed = true;
                movedCount++;
                trashedDetails.push({ displayText: item.displayText, groupName: group.name });
            });
        });

        // Atomic save and render
        try {
            await WO.syncAndSaveGroups();
        } catch (e) {
            console.warn('Sync warning:', e);
        }

        if (typeof WO.renderGroups === 'function') {
            WO.renderGroups();
        }

        if (typeof WO.logActivity === 'function') {
            WO.logActivity('BULK_DELETE_DEAD_LINKS', {
                count: movedCount,
                items: trashedDetails
            });
        }

        renderResultsList();

        const toastMsg = `🗑️ Successfully moved ${movedCount} dead links to Recycle Bin`;
        if (typeof WO.showToast === 'function') {
            WO.showToast(toastMsg, 'success');
        } else {
            alert(toastMsg);
        }
    }

    async function runScan() {
        const els = getModalElements();
        const links = getAllBookmarkLinks();
        if (links.length === 0) {
            if (els.statusMsg) els.statusMsg.textContent = 'No website URLs found in your groups.';
            return;
        }

        _isScanning = true;
        _abortController = new AbortController();
        _scanResults = links;

        if (els.startBtn) els.startBtn.style.display = 'none';
        if (els.stopBtn) els.stopBtn.style.display = 'inline-flex';
        if (els.progressWrap) els.progressWrap.style.display = 'block';

        renderResultsList();

        const concurrency = 6;
        let nextIndex = 0;
        let completed = 0;

        async function worker() {
            while (nextIndex < links.length && _isScanning && !_abortController.signal.aborted) {
                const currentIndex = nextIndex++;
                const item = links[currentIndex];
                item.status = 'scanning';
                renderResultsList();

                const probeResult = await probeUrl(item, _abortController.signal);
                item.status = probeResult.status;
                item.latency = probeResult.latency;
                item.message = probeResult.message;
                completed++;

                const pct = Math.round((completed / links.length) * 100);
                if (els.progressBar) els.progressBar.style.width = pct + '%';
                if (els.statusMsg) els.statusMsg.textContent = `Scanning ${completed} of ${links.length} URLs (${pct}%)... ${item.displayText}`;
                renderResultsList();
            }
        }

        const workers = [];
        for (let i = 0; i < Math.min(concurrency, links.length); i++) {
            workers.push(worker());
        }

        await Promise.all(workers);
        _isScanning = false;

        if (els.startBtn) {
            els.startBtn.style.display = 'inline-flex';
            els.startBtn.textContent = '🔄 Re-scan All Links';
        }
        if (els.stopBtn) els.stopBtn.style.display = 'none';

        const deadCount = _scanResults.filter(it => it.status === 'dead' || it.status === 'timeout').length;
        if (els.statusMsg) {
            if (deadCount > 0) {
                els.statusMsg.textContent = `Scan complete! Found ${deadCount} dead/broken links that can be cleaned up or moved to Trash.`;
            } else {
                els.statusMsg.textContent = '🎉 All website links are healthy, reachable and responding!';
            }
        }
        renderResultsList();
    }

    function stopScan() {
        if (_abortController) {
            _abortController.abort();
        }
        _isScanning = false;
        const els = getModalElements();
        if (els.startBtn) els.startBtn.style.display = 'inline-flex';
        if (els.stopBtn) els.stopBtn.style.display = 'none';
        if (els.statusMsg) els.statusMsg.textContent = 'Scan stopped by user.';
        renderResultsList();
    }

    function setFilter(filterName) {
        _activeFilter = filterName || 'all';

        // Update button states
        const tabContainer = document.querySelector('.link-health-filter-chips');
        if (tabContainer) {
            tabContainer.querySelectorAll('.lh-filter-btn').forEach(btn => {
                if (btn.dataset.filter === _activeFilter) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        renderResultsList();
    }

    WO.openLinkHealthModal = function () {
        const els = getModalElements();
        if (!els.modal) return;
        els.modal.classList.add('visible');
        document.body.classList.add('modal-open');

        // Initial setup
        const links = getAllBookmarkLinks();
        _scanResults = links;
        setFilter('all');
        updateStats();
        renderResultsList();
    };

    WO.closeLinkHealthModal = function () {
        if (_isScanning) stopScan();
        const els = getModalElements();
        if (!els.modal) return;
        els.modal.classList.remove('visible');
        document.body.classList.remove('modal-open');
    };

    WO.initLinkHealth = function () {
        const els = getModalElements();

        if (els.triggerBtn) {
            els.triggerBtn.addEventListener('click', () => {
                const hubMenu = document.getElementById('admin-hub-dropdown');
                if (hubMenu) hubMenu.classList.remove('show');
                WO.openLinkHealthModal();
            });
        }

        if (els.closeBtn) {
            els.closeBtn.addEventListener('click', WO.closeLinkHealthModal);
        }

        if (els.modal) {
            els.modal.addEventListener('click', (e) => {
                if (e.target === els.modal) WO.closeLinkHealthModal();
            });
        }

        if (els.startBtn) {
            els.startBtn.addEventListener('click', runScan);
        }

        if (els.stopBtn) {
            els.stopBtn.addEventListener('click', stopScan);
        }

        if (els.cleanAllBtn) {
            els.cleanAllBtn.addEventListener('click', moveAllDeadToTrash);
        }

        // Filter chips (All, Dead, Timeout, Alive)
        const tabContainer = document.querySelector('.link-health-filter-chips');
        if (tabContainer) {
            tabContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.lh-filter-btn');
                if (!btn) return;
                setFilter(btn.dataset.filter || 'all');
            });
        }

        // Make top stat chips clickable to easily filter by category
        const statsRow = document.querySelector('.link-health-stats-row');
        if (statsRow) {
            statsRow.addEventListener('click', (e) => {
                const chip = e.target.closest('.link-health-stat-chip');
                if (!chip || !chip.dataset.filter) return;
                setFilter(chip.dataset.filter);
            });
        }
    };

})(window.WO);
