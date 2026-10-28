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
            tabAlive: document.getElementById('lh-tab-alive')
        };
    }

    function getAllBookmarkLinks() {
        const links = [];
        if (!Array.isArray(WO.groups)) return links;
        WO.groups.forEach((group, gi) => {
            if (!group || !Array.isArray(group.keywords)) return;
            group.keywords.forEach((keyword, ki) => {
                if (!keyword) return;
                const isSoftDeleted = typeof WO.getBookmarkMetadata === 'function' &&
                    WO.getBookmarkMetadata(WO.keywordDeletedStatus, gi, ki, keyword, false) === true;
                if (isSoftDeleted) return;

                const { displayText, targetUrl } = WO.parseKeyword(keyword);
                if (!targetUrl || targetUrl.startsWith('#') || targetUrl.startsWith('javascript:')) return;
                const fullUrl = WO.resolveDynamicURL(targetUrl);
                if (!fullUrl || !/^https?:\/\//i.test(fullUrl)) return;

                links.push({
                    gi,
                    ki,
                    keyword,
                    displayText,
                    targetUrl: fullUrl,
                    groupName: group.name || `Group ${gi + 1}`,
                    status: 'pending', // 'alive' | 'dead' | 'timeout'
                    latency: 0,
                    message: 'Pending scan...',
                    trashed: false
                });
            });
        });
        return links;
    }

    async function probeUrl(item, signal) {
        const start = performance.now();
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 6500);

        const onAbort = () => timeoutController.abort();
        if (signal) signal.addEventListener('abort', onAbort, { once: true });

        try {
            await fetch(item.targetUrl, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
                signal: timeoutController.signal
            });
            clearTimeout(timeoutId);
            if (signal) signal.removeEventListener('abort', onAbort);
            item.latency = Math.round(performance.now() - start);
            item.status = 'alive';
            item.message = `Reachable (${item.latency}ms)`;
        } catch (err) {
            clearTimeout(timeoutId);
            if (signal) signal.removeEventListener('abort', onAbort);
            if (err.name === 'AbortError') {
                if (signal && signal.aborted) {
                    item.status = 'aborted';
                    item.message = 'Scan Cancelled';
                } else {
                    item.status = 'timeout';
                    item.message = 'Connection Timeout (>6s)';
                }
            } else {
                // DNS failure, expired domain, connection refused, SSL error
                item.status = 'dead';
                item.message = 'Dead / Host Unreachable';
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
        if (els.tabDead) els.tabDead.textContent = String(dead + timeout);
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
            filtered = _scanResults.filter(it => it.status === 'dead' || it.status === 'timeout');
        } else if (_activeFilter === 'alive') {
            filtered = _scanResults.filter(it => it.status === 'alive');
        }

        if (filtered.length === 0) {
            els.resultsList.innerHTML = `<div class="link-health-empty-msg">No links matching the "${_activeFilter}" filter.</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        filtered.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = `link-health-item-card status-${item.status}${item.trashed ? ' is-trashed' : ''}`;

            let statusBadge = '';
            if (item.trashed) {
                statusBadge = '<span class="lh-badge badge-trashed">🗑️ Trashed</span>';
            } else if (item.status === 'alive') {
                statusBadge = `<span class="lh-badge badge-alive">✅ Active (${item.latency}ms)</span>`;
            } else if (item.status === 'dead') {
                statusBadge = '<span class="lh-badge badge-dead">❌ Dead Domain / Unreachable</span>';
            } else if (item.status === 'timeout') {
                statusBadge = '<span class="lh-badge badge-timeout">⚠️ Timed Out (>6s)</span>';
            } else if (item.status === 'scanning') {
                statusBadge = '<span class="lh-badge badge-scanning">⏳ Testing...</span>';
            } else {
                statusBadge = '<span class="lh-badge badge-pending">⚪ Pending</span>';
            }

            card.innerHTML = `
                <div class="lh-item-left">
                    <div class="lh-item-title-row">
                        <span class="lh-group-tag">📁 ${WO.escapeHtml(item.groupName)}</span>
                        <strong class="lh-item-name">${WO.escapeHtml(item.displayText)}</strong>
                        ${statusBadge}
                    </div>
                    <a href="${WO.escapeHtml(item.targetUrl)}" target="_blank" rel="noopener noreferrer" class="lh-item-url">${WO.escapeHtml(item.targetUrl)}</a>
                </div>
                <div class="lh-item-actions">
                    <a href="${WO.escapeHtml(item.targetUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm holo-btn" title="Visit website in new tab">🌐 Visit</a>
                    ${!item.trashed ? `<button type="button" class="btn btn-sm btn-danger lh-trash-single-btn" data-index="${index}" title="Move broken link to Trash">🗑️ Trash</button>` : '<span style="font-size:11px;color:#888;">Moved to Trash</span>'}
                </div>
            `;

            const trashBtn = card.querySelector('.lh-trash-single-btn');
            if (trashBtn) {
                trashBtn.addEventListener('click', async () => {
                    await moveLinkToTrash(item);
                });
            }

            fragment.appendChild(card);
        });

        els.resultsList.innerHTML = '';
        els.resultsList.appendChild(fragment);
    }

    async function moveLinkToTrash(item) {
        if (!confirm(`Move "${item.displayText}" to Recycle Bin?`)) return;
        try {
            await WO.deleteKeyword(item.gi, item.keyword, false);
            item.trashed = true;
            renderResultsList();
            if (typeof WO.showToast === 'function') {
                WO.showToast(`🗑️ Moved "${item.displayText}" to Trash`, 'info');
            }
        } catch (e) {
            alert('Failed to delete: ' + e.message);
        }
    }

    async function moveAllDeadToTrash() {
        const deadLinks = _scanResults.filter(it => (it.status === 'dead' || it.status === 'timeout') && !it.trashed);
        if (deadLinks.length === 0) {
            alert('No dead links found to move to Trash.');
            return;
        }
        if (!confirm(`Are you sure you want to move all ${deadLinks.length} dead/broken links to Trash? You can restore them anytime from the Recycle Bin.`)) {
            return;
        }

        let movedCount = 0;
        for (const it of deadLinks) {
            try {
                await WO.deleteKeyword(it.gi, it.keyword, false);
                it.trashed = true;
                movedCount++;
            } catch {}
        }
        renderResultsList();
        if (typeof WO.showToast === 'function') {
            WO.showToast(`🗑️ Moved ${movedCount} dead links to Trash`, 'success');
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

        const concurrency = 5;
        let index = 0;
        let completed = 0;

        async function worker() {
            while (index < links.length && _isScanning && !_abortController.signal.aborted) {
                const currentIndex = index++;
                const item = links[currentIndex];
                item.status = 'scanning';
                renderResultsList();

                await probeUrl(item, _abortController.signal);
                completed++;

                const pct = Math.round((completed / links.length) * 100);
                if (els.progressBar) els.progressBar.style.width = pct + '%';
                if (els.statusMsg) els.statusMsg.textContent = `Scanning ${completed} of ${links.length} URLs (${pct}%)... Testing ${item.displayText}`;
                renderResultsList();
            }
        }

        const workers = [];
        for (let i = 0; i < Math.min(concurrency, links.length); i++) {
            workers.push(worker());
        }

        await Promise.all(workers);
        _isScanning = false;

        if (els.startBtn) els.startBtn.style.display = 'inline-flex';
        if (els.startBtn) els.startBtn.textContent = '🔄 Re-scan All Links';
        if (els.stopBtn) els.stopBtn.style.display = 'none';

        const deadCount = _scanResults.filter(it => it.status === 'dead' || it.status === 'timeout').length;
        if (els.statusMsg) {
            els.statusMsg.textContent = deadCount > 0
                ? `✅ Scan complete! Found ${deadCount} dead/broken links that can be moved to Trash.`
                : '🎉 All saved links are healthy, reachable and responding!';
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

    WO.openLinkHealthModal = function () {
        const els = getModalElements();
        if (!els.modal) return;
        els.modal.classList.add('visible');
        document.body.classList.add('modal-open');

        // Initial setup
        const links = getAllBookmarkLinks();
        _scanResults = links;
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
                // Close admin hub dropdown if open
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

        // Filter tabs
        const tabContainer = document.querySelector('.link-health-filter-chips');
        if (tabContainer) {
            tabContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.lh-filter-btn');
                if (!btn) return;
                tabContainer.querySelectorAll('.lh-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                _activeFilter = btn.dataset.filter || 'all';
                renderResultsList();
            });
        }
    };

})(window.WO);
