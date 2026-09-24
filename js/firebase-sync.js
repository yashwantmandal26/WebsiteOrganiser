// =============================================================================
// js/firebase-sync.js — All Firestore / Local Backup / Real-Time Sync Logic
// =============================================================================

(function (WO) {

    // ─── Firestore Setup ──────────────────────────────────────────────────────
    const cloudSyncEnabled = typeof window.firebaseModular !== 'undefined' && window.db;
    WO.firestoreFieldValue = cloudSyncEnabled ? {
        increment: (v) => window.firebaseModular.increment(v),
        delete:    () => window.firebaseModular.deleteField(),
        serverTimestamp: () => window.firebaseModular.serverTimestamp()
    } : {
        increment: (v) => v,
        delete:    () => undefined,
        serverTimestamp: () => null
    };

    const _offline = () => ({
        set: async () => {},
        update: async () => {},
        get: async () => ({ exists: false, metadata: { fromCache: false }, data: () => null }),
        onSnapshot: () => () => {}
    });

    const _wrapSnap = (snap) => ({
        exists: typeof snap.exists === 'function' ? snap.exists() : snap.exists,
        data: typeof snap.data === 'function' ? snap.data.bind(snap) : () => snap.data
    });

    const _makeRef = (col, docName) => {
        if (!cloudSyncEnabled) return _offline();
        const dRef = window.firebaseModular.doc(window.db, col, docName);
        return {
            set: async (data, opts) => window.firebaseModular.setDoc(dRef, data, opts),
            update: async (data) => window.firebaseModular.updateDoc(dRef, data),
            get: async () => {
                const snap = await window.firebaseModular.getDoc(dRef);
                return _wrapSnap(snap);
            },
            onSnapshot: (cb, onError) => window.firebaseModular.onSnapshot(dRef, (snap) => cb(_wrapSnap(snap)), onError)
        };
    };

    WO.groupsRef        = _makeRef('sharedData', 'groups');
    WO.clickCountsRef   = _makeRef('sharedData', 'clickCounts');
    WO.descriptionsRef  = _makeRef('sharedData', 'keywordDescriptions');
    WO.keywordAddedAtRef= _makeRef('sharedData', 'keywordAddedAt');
    WO.deletedStatusRef = _makeRef('sharedData', 'keywordDeletedStatus');

    // One-time cleanup of old localStorage cache keys
    ['websiteorganiser_groups_cache','websiteorganiser_clicks_cache','websiteorganiser_keyword_added_at_cache']
        .forEach(k => { try { localStorage.removeItem(k); } catch(e) {} });

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function shallowObjectChanged(oldObj, newObj) {
        if (oldObj === newObj) return false;
        const oldKeys = Object.keys(oldObj);
        const newKeys = Object.keys(newObj);
        if (oldKeys.length !== newKeys.length) return true;
        for (const k of newKeys) { if (oldObj[k] !== newObj[k]) return true; }
        return false;
    }

    function cloneForStorage(value, fallback) {
        try { return JSON.parse(JSON.stringify(value)); } catch { return fallback; }
    }
    WO.cloneForStorage = cloneForStorage;

    WO.createBookmarkId = function () {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
        return 'bm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    };

    function legacyBookmarkId(group, keyword, index) {
        const input = `${group.name || ''}\u0000${keyword || ''}\u0000${index}`;
        let hash = 2166136261;
        for (let i = 0; i < input.length; i++) { hash ^= input.charCodeAt(i); hash = Math.imul(hash, 16777619); }
        return 'legacy_' + (hash >>> 0).toString(36);
    }

    // Keep the public data shape backward-compatible while giving every bookmark
    // an identity that survives renames, moves, imports and reordering.
    WO.ensureStableBookmarkIds = function (groups = WO.groups) {
        let changed = false;
        const allSeen = new Set();
        (Array.isArray(groups) ? groups : []).forEach(group => {
            if (!Array.isArray(group.keywords)) group.keywords = [];
            if (!Array.isArray(group.keywordIds)) { group.keywordIds = []; changed = true; }
            while (group.keywordIds.length < group.keywords.length) {
                const i = group.keywordIds.length;
                group.keywordIds.push(legacyBookmarkId(group, group.keywords[i], i)); changed = true;
            }
            if (group.keywordIds.length > group.keywords.length) { group.keywordIds.length = group.keywords.length; changed = true; }
            group.keywordIds = group.keywordIds.map((id, index) => {
                if (typeof id !== 'string' || !id || allSeen.has(id)) {
                    changed = true; id = legacyBookmarkId(group, group.keywords[index], index);
                    while (allSeen.has(id)) id = WO.createBookmarkId();
                }
                allSeen.add(id); return id;
            });
            if (!Array.isArray(group.trash)) { group.trash = []; changed = true; }
            if (!group.keywordTags || typeof group.keywordTags !== 'object' || Array.isArray(group.keywordTags)) { group.keywordTags = {}; changed = true; }
        });
        return changed;
    };

    WO.getBookmarkId = function (groupOrIndex, keywordIndex) {
        const group = typeof groupOrIndex === 'number' ? WO.groups[groupOrIndex] : groupOrIndex;
        return group && Array.isArray(group.keywordIds) ? group.keywordIds[keywordIndex] : null;
    };

    WO.getBookmarkMetadataKey = function (groupIndex, keywordIndex, keyword) {
        return WO.getBookmarkId(groupIndex, keywordIndex) || WO.getKeywordEncodedKey(keyword);
    };
    WO.getBookmarkMetadata = function (store, groupIndex, keywordIndex, keyword, fallback) {
        const id = WO.getBookmarkMetadataKey(groupIndex, keywordIndex, keyword);
        if (store && store[id] !== undefined) return store[id];
        const legacy = WO.getKeywordEncodedKey(keyword);
        return store && store[legacy] !== undefined ? store[legacy] : fallback;
    };

    WO.migrateMetadataToStableIds = function () {
        WO.ensureStableBookmarkIds();
        WO.groups.forEach((group, gi) => group.keywords.forEach((keyword, ki) => {
            const id = WO.getBookmarkId(group, ki);
            const legacy = WO.getKeywordEncodedKey(keyword);
            [[WO.globalClickCounts, 0], [WO.keywordDescriptions, ''], [WO.keywordAddedAt, null], [WO.keywordDeletedStatus, false]].forEach(([store]) => {
                if (id && store[id] === undefined && store[legacy] !== undefined) store[id] = store[legacy];
            });
        }));
    };

    WO.loadLocalUsage = function () {
        try { const data = JSON.parse(localStorage.getItem(WO.LOCAL_USAGE_KEY) || '{}'); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; }
        catch { return {}; }
    };
    WO.saveLocalUsage = function () { try { localStorage.setItem(WO.LOCAL_USAGE_KEY, JSON.stringify(WO.localClickCounts)); } catch {} };
    WO.localClickCounts = WO.loadLocalUsage();

    WO.setSyncStatus = function (status, error) {
        WO.syncStatus = status;
        WO.lastSyncError = error || null;
        WO.pendingSync = status !== 'saved';
        const el = document.getElementById('sync-status');
        if (!el) return;
        const labels = { saved: 'Saved', pending: 'Pending sync', error: 'Sync failed — Retry' };
        el.className = 'sync-status sync-status--' + status;
        const label = labels[status] || labels.error;
        const text = el.querySelector('.sync-status-text');
        if (text) text.textContent = label;
        el.title = status === 'error' ? ((error && error.message) || 'Cloud sync failed. Click to retry.') : label;
        el.disabled = status === 'pending';
    };

    // ─── Keyword Encoding ─────────────────────────────────────────────────────
    // Memoize encoded keys — encodeURIComponent called many times per render for the same keyword
    const _encodedKeyCache = new Map();
    WO.getKeywordEncodedKey = function (keyword) {
        if (_encodedKeyCache.has(keyword)) return _encodedKeyCache.get(keyword);
        const encoded = encodeURIComponent(keyword).replace(/\./g, '%2E');
        if (_encodedKeyCache.size >= 500) _encodedKeyCache.clear(); // simple memory cap
        _encodedKeyCache.set(keyword, encoded);
        return encoded;
    };

    // ─── Local Backup ─────────────────────────────────────────────────────────
    WO.loadLocalDataBackup = function () {
        try {
            const raw = localStorage.getItem(WO.LOCAL_BACKUP_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.groups)) return null;
            return parsed;
        } catch { return null; }
    };

    // Debounced local backup — avoids repeated synchronous JSON.stringify on rapid events
    let _localBackupTimer = null;
    const _doSaveLocalDataBackup = function () {
        try {
            localStorage.setItem(WO.LOCAL_BACKUP_KEY, JSON.stringify({
                version: 2,
                savedAt: Date.now(),
                initialized: true,
                groups:              cloneForStorage(WO.groups, []),
                globalClickCounts:   cloneForStorage(WO.globalClickCounts, {}),
                keywordDescriptions: cloneForStorage(WO.keywordDescriptions, {}),
                keywordAddedAt:      cloneForStorage(WO.keywordAddedAt, {}),
                keywordDeletedStatus: cloneForStorage(WO.keywordDeletedStatus, {})
            }));
        } catch (e) { console.warn('Failed to save local backup:', e); }
    };
    WO.saveLocalDataBackup = function () {
        clearTimeout(_localBackupTimer);
        _localBackupTimer = setTimeout(_doSaveLocalDataBackup, 500);
    };
    WO.saveLocalDataBackupNow = _doSaveLocalDataBackup; // synchronous version for critical paths

    WO.applyLocalDataBackup = function (backup) {
        if (!backup || !Array.isArray(backup.groups)) return false;
        const backupGroups = cloneForStorage(backup.groups, []);
        backupGroups.forEach(g => { if (g.clickCounts) delete g.clickCounts; if (!Array.isArray(g.keywords)) g.keywords = []; });
        WO.groups = backupGroups.filter(g => g && typeof g.name === 'string' && Array.isArray(g.keywords));
        if (backup.globalClickCounts)   WO.globalClickCounts   = cloneForStorage(backup.globalClickCounts, {});
        if (backup.keywordDescriptions) WO.keywordDescriptions = cloneForStorage(backup.keywordDescriptions, {});
        if (backup.keywordAddedAt)      WO.keywordAddedAt      = cloneForStorage(backup.keywordAddedAt, {});
        if (backup.keywordDeletedStatus) WO.keywordDeletedStatus = cloneForStorage(backup.keywordDeletedStatus, {});
        WO.migrateMetadataToStableIds();
        return backup.initialized === true || Array.isArray(backup.groups);
    };

    // ─── Local Group Order ────────────────────────────────────────────────────
    function normalizeOrderKey(name) { return (name || '').trim().toLowerCase(); }
    WO.normalizeOrderKey = normalizeOrderKey;

    WO.loadLocalGroupOrder = function () {
        try {
            const s = localStorage.getItem(WO.LOCAL_GROUP_ORDER_KEY);
            if (!s) return [];
            const p = JSON.parse(s);
            return Array.isArray(p) ? p.filter(i => typeof i === 'string' && i.trim()) : [];
        } catch { return []; }
    };

    WO.saveLocalGroupOrder = function (order = WO.localGroupOrder) {
        try { localStorage.setItem(WO.LOCAL_GROUP_ORDER_KEY, JSON.stringify(order)); } catch {}
    };

    WO.getOrderedGroupEntries = function () {
        const entries = WO.groups.map((group, originalIndex) => ({
            group, originalIndex, orderKey: normalizeOrderKey(group.name)
        }));
        const byKey = new Map();
        entries.forEach(e => { if (!byKey.has(e.orderKey)) byKey.set(e.orderKey, e); });
        const ordered = [];
        const seen = new Set();
        WO.localGroupOrder.forEach(storedName => {
            const key = normalizeOrderKey(storedName);
            const e = byKey.get(key);
            if (e && !seen.has(key)) { ordered.push(e); seen.add(key); }
        });
        entries.forEach(e => { if (!seen.has(e.orderKey)) { ordered.push(e); seen.add(e.orderKey); } });
        const nextOrder = ordered.map(e => e.group.name);
        if (JSON.stringify(nextOrder) !== JSON.stringify(WO.localGroupOrder)) {
            WO.localGroupOrder = nextOrder;
            WO.saveLocalGroupOrder();
        }
        return ordered;
    };

    WO.renameLocalGroupOrder = function (oldName, newName) {
        const oldKey = normalizeOrderKey(oldName);
        const newKey = normalizeOrderKey(newName);
        if (!oldKey || !newKey) return;
        const next = [];
        let replaced = false;
        WO.localGroupOrder.forEach(storedName => {
            const k = normalizeOrderKey(storedName);
            if (k === oldKey) { if (!replaced) { next.push(newName); replaced = true; } }
            else if (k !== newKey) { next.push(storedName); }
        });
        if (!replaced) next.push(newName);
        WO.localGroupOrder = next;
        WO.saveLocalGroupOrder();
    };

    WO.removeLocalGroupOrder = function (groupName) {
        const key = normalizeOrderKey(groupName);
        if (!key) return;
        WO.localGroupOrder = WO.localGroupOrder.filter(n => normalizeOrderKey(n) !== key);
        WO.saveLocalGroupOrder();
    };

    WO.moveLocalGroupOrder = function (draggedName, targetName) {
        const dk = normalizeOrderKey(draggedName);
        const tk = normalizeOrderKey(targetName);
        if (!dk || !tk || dk === tk) return false;
        const names = WO.getOrderedGroupEntries().map(e => e.group.name);
        const di = names.findIndex(n => normalizeOrderKey(n) === dk);
        const ti = names.findIndex(n => normalizeOrderKey(n) === tk);
        if (di === -1 || ti === -1) return false;
        const [moved] = names.splice(di, 1);
        names.splice(di < ti ? ti - 1 : ti, 0, moved);
        WO.localGroupOrder = names;
        WO.saveLocalGroupOrder();
        return true;
    };

    // ─── Firestore Save / Load ────────────────────────────────────────────────
    WO.saveGroups = async function () {
        console.log('saveGroups called, groups count:', WO.groups.length);
        WO.saveLocalDataBackup();
        WO.ensureStableBookmarkIds();
        WO.setSyncStatus('pending');
        try {
            await WO.groupsRef.set({ data: WO.groups, updatedAt: WO.firestoreFieldValue.serverTimestamp() });
            console.log('Firestore save successful');
            WO.setSyncStatus('saved');
            return true;
        } catch (error) {
            console.error('Firestore save failed:', error);
            if (typeof window.showToast === 'function') {
                window.showToast('Saved on this device. Cloud sync failed: ' + (error.message || error), 5000);
            }
            WO.setSyncStatus('error', error);
            throw error;
        }
    };

    WO.syncAndSaveGroups = async function () {
        WO.isSavingGroups = true;
        try { await WO.saveGroups(); }
        finally { WO.isSavingGroups = false; }
    };

    WO.loadGroups = async function () {
        try {
            const [groupsDoc, clicksDoc, descriptionsDoc, addedAtDoc, deletedStatusDoc] = await Promise.all([
                WO.groupsRef.get(), WO.clickCountsRef.get(), WO.descriptionsRef.get(), WO.keywordAddedAtRef.get(), WO.deletedStatusRef.get()
            ]);
            let changed = false;
            if (clicksDoc.exists) {
                const n = clicksDoc.data() || {};
                if (shallowObjectChanged(WO.globalClickCounts, n)) { WO.globalClickCounts = n; changed = true; }
            }
            if (descriptionsDoc.exists) {
                const n = descriptionsDoc.data() || {};
                if (shallowObjectChanged(WO.keywordDescriptions, n)) { WO.keywordDescriptions = n; changed = true; }
            }
            if (addedAtDoc.exists) {
                const n = addedAtDoc.data() || {};
                if (shallowObjectChanged(WO.keywordAddedAt, n)) { WO.keywordAddedAt = n; changed = true; }
            }
            if (deletedStatusDoc.exists) {
                const n = deletedStatusDoc.data() || {};
                if (shallowObjectChanged(WO.keywordDeletedStatus, n)) { WO.keywordDeletedStatus = n; changed = true; }
            }
            if (groupsDoc.exists && Array.isArray(groupsDoc.data().data)) {
                const newGroups = groupsDoc.data().data;
                newGroups.forEach(g => { if (g.clickCounts) delete g.clickCounts; });
                if (JSON.stringify(newGroups) !== JSON.stringify(WO.groups)) { WO.groups = newGroups; changed = true; }
                WO.migrateMetadataToStableIds();
            } else {
                // groupsDoc NOT exist — transient failure, offline mode, or file:// protocol.
                // NEVER call saveGroups() here — it would overwrite real data during a quota blip.
                const backup = WO.loadLocalDataBackup();
                const backupRestored = WO.applyLocalDataBackup(backup);
                if (!backupRestored) {
                    WO.groups = JSON.parse(JSON.stringify(WO.DEFAULT_GROUPS || []));
                    if (WO.DEFAULT_CLICK_COUNTS && Object.keys(WO.globalClickCounts).length === 0) {
                        WO.globalClickCounts = JSON.parse(JSON.stringify(WO.DEFAULT_CLICK_COUNTS));
                    }
                    if (WO.DEFAULT_KEYWORD_DESCRIPTIONS && Object.keys(WO.keywordDescriptions).length === 0) {
                        WO.keywordDescriptions = JSON.parse(JSON.stringify(WO.DEFAULT_KEYWORD_DESCRIPTIONS));
                    }
                    if (WO.DEFAULT_KEYWORD_ADDED_AT && Object.keys(WO.keywordAddedAt).length === 0) {
                        WO.keywordAddedAt = JSON.parse(JSON.stringify(WO.DEFAULT_KEYWORD_ADDED_AT));
                    }
                }
                const isFromCache = groupsDoc.metadata && groupsDoc.metadata.fromCache;
                if (!groupsDoc.exists && !isFromCache && !backupRestored && typeof window.db !== 'undefined' && window.db) {
                    // Genuine fresh install with connected DB — seed Firestore after short delay
                    setTimeout(() => WO.saveGroups(), 2000);
                }
                changed = true;
            }
            WO.saveLocalDataBackup();
            return changed;
        } catch (error) {
            console.error('Error loading groups:', error);
            const backup = WO.loadLocalDataBackup();
            if (WO.applyLocalDataBackup(backup)) return true;
            if (WO.groups.length === 0) {
                WO.groups = JSON.parse(JSON.stringify(WO.DEFAULT_GROUPS || []));
                if (WO.DEFAULT_CLICK_COUNTS && Object.keys(WO.globalClickCounts).length === 0) {
                    WO.globalClickCounts = JSON.parse(JSON.stringify(WO.DEFAULT_CLICK_COUNTS));
                }
                if (WO.DEFAULT_KEYWORD_DESCRIPTIONS && Object.keys(WO.keywordDescriptions).length === 0) {
                    WO.keywordDescriptions = JSON.parse(JSON.stringify(WO.DEFAULT_KEYWORD_DESCRIPTIONS));
                }
                if (WO.DEFAULT_KEYWORD_ADDED_AT && Object.keys(WO.keywordAddedAt).length === 0) {
                    WO.keywordAddedAt = JSON.parse(JSON.stringify(WO.DEFAULT_KEYWORD_ADDED_AT));
                }
            }
            return false;
        }
    };

    // ─── Real-Time Snapshot Listeners ─────────────────────────────────────────
    let _snapshotRenderTimer = null;
    WO.debouncedSnapshotRender = function () {
        if (_snapshotRenderTimer) clearTimeout(_snapshotRenderTimer);
        _snapshotRenderTimer = setTimeout(() => {
            _snapshotRenderTimer = null;
            if (!WO.draggedKeywordData && WO.draggedItemIndex === null && !document.body.classList.contains('is-zooming')) {
                WO.renderGroups();
            }
        }, 100);
    };

    WO.setupRealtimeSync = function () {
        if (WO.realtimeSyncActive) return;
        WO.realtimeSyncActive = true;

        WO.groupsRef.onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data && Array.isArray(data.data)) {
                    if (WO.isSavingGroups) { console.log('Skipping snapshot — save in progress'); return; }
                    if (!document.body.classList.contains('is-zooming') && JSON.stringify(data.data) !== JSON.stringify(WO.groups)) {
                        WO.groups = data.data;
                        WO.migrateMetadataToStableIds();
                        WO.saveLocalDataBackup();
                        WO.debouncedSnapshotRender();
                    }
                }
            }
        }, (e) => console.warn('Groups snapshot error:', e));

        WO.clickCountsRef.onSnapshot((doc) => {
            if (doc.exists) {
                const n = doc.data() || {};
                if (shallowObjectChanged(WO.globalClickCounts, n)) { WO.globalClickCounts = n; WO.saveLocalDataBackup(); WO.debouncedSnapshotRender(); }
            }
        }, (e) => console.warn('Click counts snapshot error:', e));

        WO.descriptionsRef.onSnapshot((doc) => {
            if (doc.exists) {
                const n = doc.data() || {};
                if (shallowObjectChanged(WO.keywordDescriptions, n)) { WO.keywordDescriptions = n; WO.saveLocalDataBackup(); WO.debouncedSnapshotRender(); }
            }
        }, (e) => console.warn('Descriptions snapshot error:', e));

        WO.keywordAddedAtRef.onSnapshot((doc) => {
            if (doc.exists) {
                const n = doc.data() || {};
                if (shallowObjectChanged(WO.keywordAddedAt, n)) { WO.keywordAddedAt = n; WO.saveLocalDataBackup(); WO.debouncedSnapshotRender(); }
            }
        }, (e) => console.warn('AddedAt snapshot error:', e));

        WO.deletedStatusRef.onSnapshot((doc) => {
            if (doc.exists) {
                const n = doc.data() || {};
                if (shallowObjectChanged(WO.keywordDeletedStatus, n)) { WO.keywordDeletedStatus = n; WO.saveLocalDataBackup(); WO.debouncedSnapshotRender(); }
            }
        }, (e) => console.warn('DeletedStatus snapshot error:', e));
    };

    // ─── Keyword Metadata Helpers ─────────────────────────────────────────────
    WO.getKeywordAddedTimestamp = function (keyword, metadataKey) {
        if (!keyword) return null;
        let v = null;
        if (metadataKey && WO.keywordAddedAt) {
            v = WO.keywordAddedAt[metadataKey];
        }
        if (v == null && WO.keywordAddedAt) {
            v = WO.keywordAddedAt[WO.getKeywordEncodedKey(keyword)];
        }
        if (v == null) return null;
        const t = typeof v === 'string' ? Date.parse(v) : Number(v);
        return Number.isFinite(t) ? t : null;
    };

    WO.isKeywordNew = function (keyword, metadataKey) {
        const t = WO.getKeywordAddedTimestamp(keyword, metadataKey);
        return t !== null && (Date.now() - t) <= WO.NEW_BADGE_DURATION_MS;
    };

    WO.saveKeywordAddedAt = async function (keyword, timestamp = Date.now(), metadataKey) {
        if (!keyword) return;
        const ek = metadataKey || WO.getKeywordEncodedKey(keyword);
        const legacyKey = WO.getKeywordEncodedKey(keyword);
        WO.keywordAddedAt[ek] = timestamp;
        if (legacyKey && legacyKey !== ek) {
            WO.keywordAddedAt[legacyKey] = timestamp;
        }
        WO.saveLocalDataBackup();
        try {
            const payload = { [ek]: timestamp };
            if (legacyKey && legacyKey !== ek) payload[legacyKey] = timestamp;
            await WO.keywordAddedAtRef.set(payload, { merge: true });
        }
        catch (e) { console.error('Failed to save keyword timestamp:', e); }
    };

    WO.saveKeywordDescription = async function (keyword, description, metadataKey) {
        if (!keyword) return;
        const ek = metadataKey || WO.getKeywordEncodedKey(keyword);
        WO.keywordDescriptions[ek] = description;
        WO.saveLocalDataBackup();
        try { await WO.descriptionsRef.set({ [ek]: description }, { merge: true }); }
        catch (e) { console.error('Failed to save keyword description:', e); }
    };

    WO.saveKeywordDeletedStatus = async function (keyword, isDeleted, metadataKey) {
        if (!keyword) return;
        const ek = metadataKey || WO.getKeywordEncodedKey(keyword);
        if (isDeleted) {
            WO.keywordDeletedStatus[ek] = true;
        } else {
            delete WO.keywordDeletedStatus[ek];
        }
        WO.saveLocalDataBackup();
        try {
            if (isDeleted) {
                await WO.deletedStatusRef.set({ [ek]: true }, { merge: true });
            } else {
                await WO.deletedStatusRef.update({ [ek]: WO.firestoreFieldValue.delete() });
            }
        } catch (e) { console.error('Failed to sync deleted status:', e); }
    };

    WO.incrementKeywordClick = async function (groupIndex, keyword) {
        if (!keyword) return;
        const keywordIndex = WO.groups[groupIndex] && WO.groups[groupIndex].keywords.indexOf(keyword);
        const ek = WO.getBookmarkMetadataKey(groupIndex, keywordIndex, keyword);
        WO.localClickCounts[ek] = (Number(WO.localClickCounts[ek]) || 0) + 1;
        WO.saveLocalUsage();
        WO.globalClickCounts[ek] = (WO.globalClickCounts[ek] || 0) + 1;
        WO.saveLocalDataBackup();
        // The Firestore onSnapshot listener will re-render when the server confirms the count update.
        // No manual re-render needed here — avoids double-render on every keyword click.
        try { await WO.clickCountsRef.set({ [ek]: WO.firestoreFieldValue.increment(1) }, { merge: true }); }
        catch (e) { console.error('Failed to sync click count:', e); }
    };

    // ─── Network Online Recovery ──────────────────────────────────────────────
    // Only sync if a previous save failed (avoids unconditional write on reconnect)
    WO.pendingSync = false;
    window.addEventListener('online', () => {
        if (WO.pendingSync) {
            WO.syncAndSaveGroups().catch(() => {});
        }
    });

    document.addEventListener('click', e => {
        if (e.target.closest('#sync-status') && WO.syncStatus === 'error') WO.syncAndSaveGroups().catch(() => {});
    });

})(window.WO);
