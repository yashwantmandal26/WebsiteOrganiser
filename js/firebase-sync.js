// =============================================================================
// js/firebase-sync.js — All Firestore / Local Backup / Real-Time Sync Logic
// =============================================================================

(function (WO) {

    // ─── Firestore Setup ──────────────────────────────────────────────────────
    const cloudSyncEnabled = typeof db !== 'undefined' && db && typeof db.collection === 'function';
    WO.firestoreFieldValue = cloudSyncEnabled ? firebase.firestore.FieldValue : {
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

    WO.groupsRef        = cloudSyncEnabled ? db.collection('sharedData').doc('groups')             : _offline();
    WO.clickCountsRef   = cloudSyncEnabled ? db.collection('sharedData').doc('clickCounts')        : _offline();
    WO.descriptionsRef  = cloudSyncEnabled ? db.collection('sharedData').doc('keywordDescriptions'): _offline();
    WO.keywordAddedAtRef= cloudSyncEnabled ? db.collection('sharedData').doc('keywordAddedAt')     : _offline();

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
                version: 1,
                savedAt: Date.now(),
                groups:              cloneForStorage(WO.groups, []),
                globalClickCounts:   cloneForStorage(WO.globalClickCounts, {}),
                keywordDescriptions: cloneForStorage(WO.keywordDescriptions, {}),
                keywordAddedAt:      cloneForStorage(WO.keywordAddedAt, {})
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
        return WO.groups.length > 0;
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
        try {
            await WO.groupsRef.set({ data: WO.groups, updatedAt: WO.firestoreFieldValue.serverTimestamp() });
            console.log('Firestore save successful');
        } catch (error) {
            console.error('Firestore save failed:', error);
            if (typeof window.showToast === 'function') {
                window.showToast('Saved on this device. Cloud sync failed: ' + (error.message || error), 5000);
            }
        }
    };

    WO.syncAndSaveGroups = async function () {
        WO.isSavingGroups = true;
        try { await WO.saveGroups(); }
        finally { WO.isSavingGroups = false; }
    };

    WO.loadGroups = async function () {
        try {
            const [groupsDoc, clicksDoc, descriptionsDoc, addedAtDoc] = await Promise.all([
                WO.groupsRef.get(), WO.clickCountsRef.get(), WO.descriptionsRef.get(), WO.keywordAddedAtRef.get()
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
            if (groupsDoc.exists && Array.isArray(groupsDoc.data().data)) {
                const newGroups = groupsDoc.data().data;
                newGroups.forEach(g => { if (g.clickCounts) delete g.clickCounts; });
                if (JSON.stringify(newGroups) !== JSON.stringify(WO.groups)) { WO.groups = newGroups; changed = true; }
            } else {
                // groupsDoc NOT exist — transient failure or genuine first install.
                // NEVER call saveGroups() here — it would overwrite real data during a quota blip.
                const backup = WO.loadLocalDataBackup();
                const backupRestored = WO.applyLocalDataBackup(backup);
                if (!backupRestored) WO.groups = JSON.parse(JSON.stringify(WO.DEFAULT_GROUPS));
                const isFromCache = groupsDoc.metadata && groupsDoc.metadata.fromCache;
                if (!groupsDoc.exists && !isFromCache && !backupRestored) {
                    // Genuine fresh install — seed Firestore after short delay
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
            if (WO.groups.length === 0) WO.groups = JSON.parse(JSON.stringify(WO.DEFAULT_GROUPS));
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
                    // Safety: never replace existing data with empty snapshot (quota/network blip)
                    if (data.data.length === 0 && WO.groups.length > 0) {
                        console.warn('Snapshot returned empty groups but we have data — ignoring.');
                        return;
                    }
                    if (!document.body.classList.contains('is-zooming') && JSON.stringify(data.data) !== JSON.stringify(WO.groups)) {
                        WO.groups = data.data;
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
    };

    // ─── Keyword Metadata Helpers ─────────────────────────────────────────────
    WO.getKeywordAddedTimestamp = function (keyword) {
        if (!keyword) return null;
        const v = WO.keywordAddedAt[WO.getKeywordEncodedKey(keyword)];
        if (v == null) return null;
        const t = typeof v === 'string' ? Date.parse(v) : Number(v);
        return Number.isFinite(t) ? t : null;
    };

    WO.isKeywordNew = function (keyword) {
        const t = WO.getKeywordAddedTimestamp(keyword);
        return t !== null && (Date.now() - t) <= WO.NEW_BADGE_DURATION_MS;
    };

    WO.saveKeywordAddedAt = async function (keyword, timestamp = Date.now()) {
        if (!keyword) return;
        const ek = WO.getKeywordEncodedKey(keyword);
        WO.keywordAddedAt[ek] = timestamp;
        WO.saveLocalDataBackup();
        try { await WO.keywordAddedAtRef.set({ [ek]: timestamp }, { merge: true }); }
        catch (e) { console.error('Failed to save keyword timestamp:', e); }
    };

    WO.saveKeywordDescription = async function (keyword, description) {
        if (!keyword) return;
        const ek = WO.getKeywordEncodedKey(keyword);
        WO.keywordDescriptions[ek] = description;
        WO.saveLocalDataBackup();
        try { await WO.descriptionsRef.set({ [ek]: description }, { merge: true }); }
        catch (e) { console.error('Failed to save keyword description:', e); }
    };

    WO.incrementKeywordClick = async function (groupIndex, keyword) {
        if (!keyword) return;
        const ek = WO.getKeywordEncodedKey(keyword);
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
        if (WO.groups.length > 0 && WO.pendingSync) {
            WO.pendingSync = false;
            WO.syncAndSaveGroups();
        }
    });

})(window.WO);
