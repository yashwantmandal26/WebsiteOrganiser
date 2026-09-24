// =============================================================================
// js/activity-logger.js — Security, Device & Location Tracking, Audit Trail & Undo
// =============================================================================

(function (WO) {

    const DELETIONS_TRACKER_KEY = 'websiteorganiser_deletions_log';
    const LOCAL_LOGS_KEY        = 'websiteorganiser_local_activity_logs';
    const LOCATION_CACHE_KEY    = 'wo_user_location_cache';
    const MAX_LOCAL_LOGS        = 200;
    const RATE_LIMIT_WINDOW_MS  = 15 * 60 * 1000; // 15 minutes
    const RATE_LIMIT_MAX_DELETES = 5;

    // ─── 1. Exact Device & Model Detection ───────────────────────────────────
    WO.getDeviceDetails = async function () {
        let deviceName = 'Desktop PC';
        const ua = navigator.userAgent || '';

        // Try modern User-Agent Client Hints (Chromium / Android gives EXACT phone model!)
        if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
            try {
                const hints = await navigator.userAgentData.getHighEntropyValues([
                    'model', 'platform', 'platformVersion', 'architecture'
                ]);
                if (hints.model && hints.model.trim()) {
                    deviceName = hints.model.trim();
                } else if (hints.platform) {
                    deviceName = hints.platform;
                }
            } catch (e) {}
        }

        // Comprehensive User-Agent fallback parser
        if (deviceName === 'Desktop PC' || !deviceName) {
            // Android Phone Models (e.g. "Android 14; SM-S928B Build/...", "CPH2449", "Redmi Note 12")
            const androidMatch = ua.match(/Android[^;]+;\s*([^;)]+)\s*Build/i) || ua.match(/Android[^;]+;\s*([^;)]+)\)/i);
            if (androidMatch && androidMatch[1]) {
                deviceName = androidMatch[1].trim();
            } else if (/iPhone/i.test(ua)) {
                const iosMatch = ua.match(/OS (\d+[_\d]*)/i);
                deviceName = 'Apple iPhone' + (iosMatch ? ` (iOS ${iosMatch[1].replace(/_/g, '.')})` : '');
            } else if (/iPad/i.test(ua)) {
                deviceName = 'Apple iPad';
            } else if (/Macintosh|Mac OS X/i.test(ua)) {
                deviceName = 'MacBook / Mac';
            } else if (/Windows NT 10.0/i.test(ua)) {
                deviceName = 'Windows PC (Win 10/11)';
            } else if (/Windows NT/i.test(ua)) {
                deviceName = 'Windows PC';
            } else if (/Linux/i.test(ua)) {
                deviceName = 'Linux PC';
            }
        }

        // Browser identification
        let browser = 'Browser';
        if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
        else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) browser = 'Google Chrome';
        else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
        else if (/Firefox\//i.test(ua)) browser = 'Firefox';
        else if (/OPR\//i.test(ua)) browser = 'Opera';

        const screenRes = `${window.screen.width}x${window.screen.height}`;
        const isMobile = /Android|iPhone|iPad|Mobile/i.test(ua);

        return {
            deviceName: deviceName,
            browser: browser,
            screen: screenRes,
            isMobile: isMobile,
            fullLabel: `${deviceName} • ${browser} (${screenRes})`
        };
    };

    // ─── 2. Fast Location & Coordinates Detection (with session cache) ───────
    let _locationPromise = null;
    WO.getLocationDetails = async function () {
        try {
            const cached = sessionStorage.getItem(LOCATION_CACHE_KEY);
            if (cached) return JSON.parse(cached);
        } catch {}

        if (_locationPromise) return _locationPromise;

        _locationPromise = (async () => {
            let loc = {
                ip: 'Unknown IP',
                city: 'Unknown City',
                region: '',
                country: 'India',
                lat: null,
                lon: null,
                mapsUrl: null
            };

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        loc.ip      = data.ipAddress || loc.ip;
                        loc.city    = data.cityName || loc.city;
                        loc.region  = data.regionName || '';
                        loc.country = data.countryName || 'India';
                        if (data.latitude && data.longitude) {
                            loc.lat = Number(data.latitude);
                            loc.lon = Number(data.longitude);
                            loc.mapsUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lon}`;
                        }
                    }
                }
            } catch (err) {
                // Secondary fallback
                try {
                    const res2 = await fetch('https://ipapi.co/json/');
                    if (res2.ok) {
                        const d2 = await res2.json();
                        loc.ip      = d2.ip || loc.ip;
                        loc.city    = d2.city || loc.city;
                        loc.region  = d2.region || '';
                        loc.country = d2.country_name || loc.country;
                        if (d2.latitude && d2.longitude) {
                            loc.lat = Number(d2.latitude);
                            loc.lon = Number(d2.longitude);
                            loc.mapsUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lon}`;
                        }
                    }
                } catch {}
            }

            try {
                sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(loc));
            } catch {}
            return loc;
        })();

        return _locationPromise;
    };

    // ─── 3. Suspicious Activity Alert & Rate-Limiter ──────────────────────────
    function getRecentDeletions() {
        try {
            const raw = localStorage.getItem(DELETIONS_TRACKER_KEY);
            if (!raw) return [];
            const list = JSON.parse(raw);
            const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
            return Array.isArray(list) ? list.filter(item => item && item.time > cutoff) : [];
        } catch { return []; }
    }

    function recordDeletion(targetName) {
        try {
            const list = getRecentDeletions();
            list.push({ time: Date.now(), target: targetName });
            localStorage.setItem(DELETIONS_TRACKER_KEY, JSON.stringify(list));
            return list.length;
        } catch { return 1; }
    }

    WO.checkDeletionRateLimit = function (targetName) {
        const recent = getRecentDeletions();
        // If already reached limit
        if (recent.length >= RATE_LIMIT_MAX_DELETES) {
            // Trigger suspicious alert log
            WO.logActivity('SUSPICIOUS_ALERT', {
                targetName: targetName || 'Multiple Items',
                reason: `Locked: ${recent.length} deletions attempted within 15 minutes.`,
                isSuspicious: true
            });

            return {
                allowed: false,
                count: recent.length,
                message: '⚠️ Security Alert: 5 or more deletions detected in a short time. Further deletions have been locked for security. Please contact Admin to unlock.'
            };
        }

        const newCount = recordDeletion(targetName);
        const isSpike = newCount >= RATE_LIMIT_MAX_DELETES;
        return {
            allowed: true,
            count: newCount,
            isSuspicious: isSpike
        };
    };

    WO.resetDeletionLock = function () {
        try { localStorage.removeItem(DELETIONS_TRACKER_KEY); } catch {}
        if (typeof WO.showToast === 'function') {
            WO.showToast('🔓 Deletion lock reset successfully.', 'success');
        } else {
            alert('🔓 Deletion lock reset successfully.');
        }
        WO.renderActivityLogs();
    };

    WO.isDeletionLocked = function () {
        return getRecentDeletions().length >= RATE_LIMIT_MAX_DELETES;
    };

    // ─── 4. Activity Logger Core ──────────────────────────────────────────────
    WO.logActivity = async function (actionType, details = {}) {
        try {
            const device = await WO.getDeviceDetails();
            const location = await WO.getLocationDetails();
            
            const currentUser = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;
            const who = currentUser ? (currentUser.email || currentUser.displayName || 'Admin') : (WO.adminLoggedIn ? 'Admin (Local Session)' : 'Guest / Visitor');
            const isAdmin = Boolean(WO.adminLoggedIn || (currentUser && currentUser.email));

            const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const isSuspicious = Boolean(details.isSuspicious || details.reason);

            const logEntry = {
                id: logId,
                action: actionType, // ADD_KEYWORD, EDIT_KEYWORD, DELETE_KEYWORD, ADD_GROUP, EDIT_GROUP, DELETE_GROUP, RESTORE_KEYWORD, RESTORE_GROUP, SUSPICIOUS_ALERT
                targetName: details.targetName || '',
                groupName: details.groupName || '',
                groupIndex: details.groupIndex != null ? details.groupIndex : null,
                who: who,
                isAdmin: isAdmin,
                device: device.fullLabel,
                deviceName: device.deviceName,
                browser: device.browser,
                locationText: `${location.city}${location.region ? ', ' + location.region : ''}, ${location.country} (IP: ${location.ip})`,
                mapsUrl: location.mapsUrl,
                lat: location.lat,
                lon: location.lon,
                timestamp: Date.now(),
                isSuspicious: isSuspicious,
                alertBadge: isSuspicious ? (details.alertBadge || '🚨 Suspicious Activity') : null,
                diff: details.diff || null,         // { from: ..., to: ... }
                payload: details.payload || null,   // for undo restore
                restored: false
            };

            // 1. Save locally for instant view
            try {
                let localLogs = [];
                const raw = localStorage.getItem(LOCAL_LOGS_KEY);
                if (raw) localLogs = JSON.parse(raw);
                if (!Array.isArray(localLogs)) localLogs = [];
                localLogs.unshift(logEntry);
                if (localLogs.length > MAX_LOCAL_LOGS) localLogs = localLogs.slice(0, MAX_LOCAL_LOGS);
                localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(localLogs));
            } catch (e) {}

            // 2. Sync to Firestore in background
            if (window.firebaseModular && window.db) {
                try {
                    const docRef = window.firebaseModular.doc(window.db, 'activityLogs', logId);
                    await window.firebaseModular.setDoc(docRef, logEntry);
                } catch (err) {
                    console.warn('Firestore log save error:', err);
                }
            }

            return logEntry;
        } catch (e) {
            console.error('Failed to log activity:', e);
            return null;
        }
    };

    // ─── 5. Fetch Activity Logs ───────────────────────────────────────────────
    WO.fetchActivityLogs = async function () {
        let logs = [];

        // Try Firestore first
        if (window.firebaseModular && window.db) {
            try {
                const colRef = window.firebaseModular.collection(window.db, 'activityLogs');
                const snap = await window.firebaseModular.getDocs(colRef);
                snap.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data) logs.push(data);
                });
                logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            } catch (err) {
                console.warn('Could not fetch logs from Firestore, reading local cache:', err);
            }
        }

        // Fallback or merge with local cache
        if (logs.length === 0) {
            try {
                const raw = localStorage.getItem(LOCAL_LOGS_KEY);
                if (raw) logs = JSON.parse(raw) || [];
            } catch {}
        } else {
            // Keep local cache synced
            try {
                localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs.slice(0, MAX_LOCAL_LOGS)));
            } catch {}
        }

        return logs;
    };

    // ─── 6. Undo / Restore Engine ─────────────────────────────────────────────
    WO.restoreLoggedActivity = async function (logId) {
        if (!logId) return;
        const logs = await WO.fetchActivityLogs();
        const log = logs.find(l => l.id === logId);
        if (!log) {
            alert('Log entry not found.');
            return;
        }
        if (log.restored) {
            alert('This item has already been restored.');
            return;
        }

        try {
            if (log.action === 'DELETE_KEYWORD' && log.payload) {
                const { keyword, description, tags, groupName } = log.payload;
                if (!keyword) { alert('No keyword data available to restore.'); return; }

                // Find matching group or recreate
                let targetGroup = WO.groups.find(g => (g.name || '').trim().toLowerCase() === (groupName || '').trim().toLowerCase());
                if (!targetGroup) {
                    targetGroup = { name: groupName || 'Restored Links', keywords: [], keywordTags: {}, keywordIds: [] };
                    WO.groups.push(targetGroup);
                }

                if (!Array.isArray(targetGroup.keywords)) targetGroup.keywords = [];
                // Add keyword back at top
                targetGroup.keywords.unshift(keyword);
                WO.ensureStableBookmarkIds();

                const newBookmarkId = WO.getBookmarkId(targetGroup, 0);
                if (description && typeof WO.saveKeywordDescription === 'function') {
                    await WO.saveKeywordDescription(keyword, description, newBookmarkId);
                }
                if (tags && Array.isArray(tags)) {
                    if (!targetGroup.keywordTags) targetGroup.keywordTags = {};
                    targetGroup.keywordTags[newBookmarkId] = tags;
                }

                await WO.syncAndSaveGroups();
                WO.renderGroups();

                // Mark log as restored
                log.restored = true;
                if (window.firebaseModular && window.db) {
                    try {
                        const docRef = window.firebaseModular.doc(window.db, 'activityLogs', logId);
                        await window.firebaseModular.updateDoc(docRef, { restored: true });
                    } catch {}
                }

                await WO.logActivity('RESTORE_KEYWORD', {
                    targetName: log.targetName,
                    groupName: targetGroup.name,
                    diff: { restoredFromLogId: logId }
                });

                if (typeof WO.showToast === 'function') WO.showToast(`✅ Restored "${log.targetName}" into "${targetGroup.name}"!`, 'success');
                else alert(`✅ Restored "${log.targetName}" into "${targetGroup.name}"!`);

                WO.renderActivityLogs();
            } else if (log.action === 'DELETE_GROUP' && log.payload) {
                const { groupName, keywords, keywordTags, keywordIds } = log.payload;
                const newGroup = {
                    name: groupName || log.targetName || 'Restored Group',
                    keywords: Array.isArray(keywords) ? keywords : [],
                    keywordTags: keywordTags || {},
                    keywordIds: keywordIds || []
                };
                WO.groups.push(newGroup);
                WO.ensureStableBookmarkIds();
                await WO.syncAndSaveGroups();
                WO.renderGroups();

                log.restored = true;
                if (window.firebaseModular && window.db) {
                    try {
                        const docRef = window.firebaseModular.doc(window.db, 'activityLogs', logId);
                        await window.firebaseModular.updateDoc(docRef, { restored: true });
                    } catch {}
                }

                await WO.logActivity('RESTORE_GROUP', {
                    targetName: newGroup.name,
                    diff: { restoredFromLogId: logId }
                });

                if (typeof WO.showToast === 'function') WO.showToast(`✅ Restored group "${newGroup.name}"!`, 'success');
                else alert(`✅ Restored group "${newGroup.name}"!`);

                WO.renderActivityLogs();
            } else {
                alert('Only deleted items can be restored.');
            }
        } catch (err) {
            console.error('Failed to restore item:', err);
            alert('Failed to restore item: ' + (err.message || err));
        }
    };

    // ─── 7. Export Logs as CSV ────────────────────────────────────────────────
    WO.exportActivityLogsCSV = async function () {
        const logs = await WO.fetchActivityLogs();
        if (!logs.length) {
            alert('No activity logs found to export.');
            return;
        }

        const headers = ['Timestamp', 'Date & Time', 'Action', 'Target Name', 'Group', 'User / Email', 'Device Model', 'Full Device & Browser', 'Location', 'Google Maps Link', 'Suspicious Alert', 'Restored'];
        const rows = logs.map(l => {
            const dateStr = new Date(l.timestamp || Date.now()).toLocaleString();
            return [
                l.timestamp || '',
                `"${dateStr}"`,
                `"${l.action || ''}"`,
                `"${(l.targetName || '').replace(/"/g, '""')}"`,
                `"${(l.groupName || '').replace(/"/g, '""')}"`,
                `"${(l.who || '').replace(/"/g, '""')}"`,
                `"${(l.deviceName || '').replace(/"/g, '""')}"`,
                `"${(l.device || '').replace(/"/g, '""')}"`,
                `"${(l.locationText || '').replace(/"/g, '""')}"`,
                `"${l.mapsUrl || ''}"`,
                `"${l.isSuspicious ? 'YES' : 'NO'}"`,
                `"${l.restored ? 'YES' : 'NO'}"`
            ].join(',');
        });

        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WebsiteOrganiser_Security_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ─── 8. Activity Log Modal UI ─────────────────────────────────────────────
    let _currentLogFilter = 'all';
    let _currentLogSearch = '';

    WO.setLogFilter = function (filter) {
        _currentLogFilter = filter;
        WO.renderActivityLogs();
    };

    WO.renderActivityLogs = async function () {
        const container = document.getElementById('activity-log-list');
        const summaryEl = document.getElementById('activity-log-summary');
        const lockNotice = document.getElementById('activity-lock-notice');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:24px;color:#888;">Loading audit trail...</div>';

        // Check deletion lock state
        if (lockNotice) {
            if (WO.isDeletionLocked()) {
                lockNotice.style.display = 'flex';
            } else {
                lockNotice.style.display = 'none';
            }
        }

        const logs = await WO.fetchActivityLogs();
        if (!logs.length) {
            container.innerHTML = '<div style="text-align:center;padding:32px;color:#888;">No activity logged yet. Add or delete a link to see security audit records.</div>';
            if (summaryEl) summaryEl.textContent = '0 total actions recorded';
            return;
        }

        // Apply filter & search
        const q = _currentLogSearch.toLowerCase().trim();
        const filtered = logs.filter(l => {
            if (_currentLogFilter === 'alerts' && !l.isSuspicious) return false;
            if (_currentLogFilter === 'added' && !l.action.startsWith('ADD')) return false;
            if (_currentLogFilter === 'deleted' && !l.action.startsWith('DELETE')) return false;
            if (_currentLogFilter === 'edited' && !l.action.startsWith('EDIT')) return false;
            if (_currentLogFilter === 'restored' && !l.action.startsWith('RESTORE') && !l.restored) return false;

            if (q) {
                const hay = [l.targetName, l.groupName, l.who, l.deviceName, l.device, l.locationText, l.action].join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });

        if (summaryEl) {
            const alertCount = logs.filter(l => l.isSuspicious).length;
            summaryEl.innerHTML = `Showing <b>${filtered.length}</b> of <b>${logs.length}</b> actions ${alertCount > 0 ? `• <span style="color:#ff4d4f;font-weight:600;">🚨 ${alertCount} Security Alerts</span>` : ''}`;
        }

        if (!filtered.length) {
            container.innerHTML = '<div style="text-align:center;padding:32px;color:#888;">No actions match your filter or search.</div>';
            return;
        }

        container.innerHTML = '';
        const frag = document.createDocumentFragment();

        filtered.forEach(log => {
            const card = document.createElement('div');
            card.className = `audit-log-card ${log.isSuspicious ? 'is-suspicious' : ''}`;

            let actionBadgeClass = 'badge-info';
            let actionLabel = log.action;
            let icon = 'ℹ️';

            if (log.action === 'ADD_KEYWORD') { actionBadgeClass = 'badge-success'; actionLabel = 'ADDED LINK'; icon = '🟢'; }
            else if (log.action === 'DELETE_KEYWORD') { actionBadgeClass = 'badge-danger'; actionLabel = 'DELETED LINK'; icon = '🔴'; }
            else if (log.action === 'EDIT_KEYWORD') { actionBadgeClass = 'badge-warning'; actionLabel = 'EDITED LINK'; icon = '✏️'; }
            else if (log.action === 'ADD_GROUP') { actionBadgeClass = 'badge-success'; actionLabel = 'CREATED GROUP'; icon = '📁'; }
            else if (log.action === 'DELETE_GROUP') { actionBadgeClass = 'badge-danger'; actionLabel = 'DELETED GROUP'; icon = '🗑️'; }
            else if (log.action === 'EDIT_GROUP') { actionBadgeClass = 'badge-warning'; actionLabel = 'RENAMED GROUP'; icon = '🏷️'; }
            else if (log.action.startsWith('RESTORE')) { actionBadgeClass = 'badge-purple'; actionLabel = 'RESTORED'; icon = '↺'; }
            else if (log.action === 'SUSPICIOUS_ALERT') { actionBadgeClass = 'badge-alert'; actionLabel = 'SECURITY ALERT'; icon = '🚨'; }

            const dateStr = new Date(log.timestamp || Date.now()).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            });

            // Map link HTML
            const mapHtml = log.mapsUrl
                ? `<a href="${WO.escapeHtml(log.mapsUrl)}" target="_blank" rel="noopener" class="audit-map-btn" title="Open location in Google Maps">🗺️ Open in Google Maps</a>`
                : '';

            // Undo Button HTML (only for deletions)
            let undoBtnHtml = '';
            if (log.action === 'DELETE_KEYWORD' || log.action === 'DELETE_GROUP') {
                if (log.restored) {
                    undoBtnHtml = '<span class="audit-restored-tag">✓ Restored</span>';
                } else {
                    undoBtnHtml = `<button type="button" class="btn btn-sm holo-btn audit-restore-btn" onclick="window.WO.restoreLoggedActivity('${log.id}')">↺ Undo / Restore</button>`;
                }
            }

            // Diff HTML (if edit)
            let diffHtml = '';
            if (log.diff) {
                if (log.diff.oldName || log.diff.newName) {
                    diffHtml += `<div class="audit-diff">
                        <span class="diff-old"><s>${WO.escapeHtml(log.diff.oldName || '')}</s></span> → 
                        <span class="diff-new"><b>${WO.escapeHtml(log.diff.newName || '')}</b></span>
                    </div>`;
                }
                if (log.diff.oldUrl && log.diff.newUrl && log.diff.oldUrl !== log.diff.newUrl) {
                    diffHtml += `<div class="audit-diff" style="font-size:0.85em;color:#888;">
                        URL changed: <span class="diff-old">${WO.escapeHtml(log.diff.oldUrl)}</span> → <span class="diff-new">${WO.escapeHtml(log.diff.newUrl)}</span>
                    </div>`;
                }
            }

            // Suspicious Badge
            const suspiciousBanner = log.isSuspicious
                ? `<div class="audit-suspicious-banner">🚨 <b>SECURITY ALERT:</b> ${WO.escapeHtml(log.alertBadge || log.details?.reason || 'Excessive deletions flagged')}</div>`
                : '';

            card.innerHTML = `
                ${suspiciousBanner}
                <div class="audit-header">
                    <span class="audit-badge ${actionBadgeClass}">${icon} ${actionLabel}</span>
                    <span class="audit-target-title">${WO.escapeHtml(log.targetName || '')}</span>
                    ${log.groupName ? `<span class="audit-group-tag">in <b>${WO.escapeHtml(log.groupName)}</b></span>` : ''}
                    <span class="audit-time">${dateStr}</span>
                </div>
                ${diffHtml}
                <div class="audit-meta-grid">
                    <div class="audit-meta-item">
                        <span class="meta-label">👤 User:</span>
                        <span class="meta-val">${WO.escapeHtml(log.who || 'Guest')}</span>
                    </div>
                    <div class="audit-meta-item">
                        <span class="meta-label">📱 Device:</span>
                        <span class="meta-val" title="${WO.escapeHtml(log.device || '')}"><b>${WO.escapeHtml(log.deviceName || 'PC')}</b> <small>(${WO.escapeHtml(log.browser || '')})</small></span>
                    </div>
                    <div class="audit-meta-item full-width">
                        <span class="meta-label">📍 Location:</span>
                        <span class="meta-val">${WO.escapeHtml(log.locationText || 'Unknown')}</span>
                        ${mapHtml}
                    </div>
                </div>
                <div class="audit-card-footer">
                    <span class="audit-id">ID: ${log.id}</span>
                    ${undoBtnHtml}
                </div>
            `;

            frag.appendChild(card);
        });

        container.appendChild(frag);
    };

    WO.openActivityLogModal = function () {
        const modal = document.getElementById('activity-log-modal');
        if (!modal) return;
        _currentLogFilter = 'all';
        _currentLogSearch = '';
        const searchInput = document.getElementById('activity-search-input');
        if (searchInput) searchInput.value = '';
        
        // Reset active filter button UI
        document.querySelectorAll('.log-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'all');
        });

        WO.toggleModal(modal, true);
        WO.renderActivityLogs();
    };

    WO.initActivityLoggerUI = function () {
        const openBtn = document.getElementById('activity-log-btn');
        if (openBtn) {
            openBtn.onclick = (e) => {
                e.preventDefault();
                WO.openActivityLogModal();
            };
        }

        const closeBtn = document.getElementById('activity-log-close-btn');
        const modal = document.getElementById('activity-log-modal');
        if (closeBtn && modal) {
            closeBtn.onclick = () => WO.toggleModal(modal, false);
        }

        // Filter button listeners
        document.querySelectorAll('.log-filter-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                WO.setLogFilter(btn.dataset.filter || 'all');
            };
        });

        // Search input
        const searchInput = document.getElementById('activity-search-input');
        if (searchInput) {
            let timer = null;
            searchInput.oninput = (e) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    _currentLogSearch = e.target.value || '';
                    WO.renderActivityLogs();
                }, 100);
            };
        }

        // Export button
        const exportBtn = document.getElementById('export-logs-csv-btn');
        if (exportBtn) {
            exportBtn.onclick = () => WO.exportActivityLogsCSV();
        }

        // Reset lock button
        const unlockBtn = document.getElementById('unlock-deletions-btn');
        if (unlockBtn) {
            unlockBtn.onclick = () => WO.resetDeletionLock();
        }
    };

})(window.WO);
