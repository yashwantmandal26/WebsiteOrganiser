// =============================================================================
// js/crud.js — Add / Rename / Delete Groups & Keywords + Import/Export
// =============================================================================

(function (WO) {

    // ─── Group CRUD ───────────────────────────────────────────────────────────
    WO.openGroupModal = function (mode, index = null) {
        const groupModal      = document.getElementById('group-modal');
        const groupModalTitle = document.getElementById('group-modal-title');
        const groupNameInput  = document.getElementById('group-name-input');
        if (mode === 'edit' && (index == null || !WO.groups[index])) { window.showToast('⚠️ Group not found.', 3000); return; }
        if (mode === 'edit' && !WO.adminLoggedIn) { alert('Admin access required to rename groups.'); return; }
        WO.groupModalMode    = mode;
        WO.currentGroupIndex = index;
        groupModalTitle.textContent = mode === 'add' ? 'Create New Group' : 'Rename Group';
        groupNameInput.value = mode === 'edit' ? WO.groups[index].name : '';
        WO.toggleModal(groupModal, true);
        groupNameInput.focus();
    };

    WO.saveGroup = async function () {
        const groupModal     = document.getElementById('group-modal');
        const groupNameInput = document.getElementById('group-name-input');
        if (WO.groupModalMode === 'edit' && !WO.adminLoggedIn) { alert('Admin access required to rename groups.'); return; }
        const newName = groupNameInput.value.trim();
        if (!newName) { alert('Group name cannot be empty.'); return; }
        if (WO.containsBlockedContent(newName)) return;
        const duplicate = WO.groups.some((g, i) =>
            g.name.trim().toLowerCase() === newName.toLowerCase() && (WO.groupModalMode === 'add' || i !== WO.currentGroupIndex)
        );
        if (duplicate) { alert('A group with this name already exists.'); return; }
        if (WO.groupModalMode === 'add') {
            WO.groups.push({ name: newName, keywords: [] });
        } else {
            const oldName = WO.groups[WO.currentGroupIndex].name;
            WO.groups[WO.currentGroupIndex].name = newName;
            WO.renameLocalGroupOrder(oldName, newName);
        }
        WO.toggleModal(groupModal, false);
        groupNameInput.value = '';
        await WO.syncAndSaveGroups();
        WO.renderGroups();
    };
    window.saveGroup      = WO.saveGroup;
    window.closeGroupModal = () => WO.toggleModal(document.getElementById('group-modal'), false);

    WO.deleteGroup = async function (index) {
        if (!WO.adminLoggedIn) { alert('Admin access required to delete groups.'); return; }
        if (confirm(`Delete group "${WO.groups[index].name}"?`)) {
            const name = WO.groups[index].name;
            WO.groups.splice(index, 1);
            WO.removeLocalGroupOrder(name);
            await WO.syncAndSaveGroups();
            WO.renderGroups();
        }
    };

    // ─── Keyword Add ──────────────────────────────────────────────────────────
    WO.resetAddKeywordModalState = function () {
        WO.addKeywordTargetGroupIndex = null;
        const inp  = document.getElementById('add-keyword-input');
        const desc = document.getElementById('add-keyword-desc-input');
        if (inp)  inp.value  = '';
        if (desc) desc.value = '';
    };

    WO.addKeywordToGroup = async function (index) {
        const group = WO.groups[index];
        if (!group) return;
        WO.resetAddKeywordModalState();
        WO.addKeywordTargetGroupIndex = index;
        WO.toggleModal(document.getElementById('add-keyword-modal'), true);
        setTimeout(() => { const el = document.getElementById('add-keyword-input'); if (el) el.focus(); }, 100);
    };
    window.addKeywordToGroup = WO.addKeywordToGroup;

    window.closeAddKeywordModal = function () {
        WO.resetAddKeywordModalState();
        WO.toggleModal(document.getElementById('add-keyword-modal'), false);
    };

    WO.saveNewKeyword = async function () {
        if (WO.isSavingKeyword) return;
        WO.isSavingKeyword = true;
        try {
            const kw   = (document.getElementById('add-keyword-input')  || {}).value?.trim() || '';
            const desc = (document.getElementById('add-keyword-desc-input') || {}).value?.trim() || '';
            if (!kw) { alert('Please enter a name or link.'); return; }

            const group = WO.groups[WO.addKeywordTargetGroupIndex];
            if (!group) { alert('Group not found.'); return; }

            const normalize = s => {
                if (typeof s !== 'string') return '';
                let r = s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
                if (r.endsWith('/')) r = r.slice(0, -1);
                return r;
            };
            const nkw = normalize(kw);
            if (!group.keywords) group.keywords = [];

            if (group.keywords.some(k => normalize(k) === nkw)) { alert('Keyword already exists in this group.'); return; }
            for (let i = 0; i < WO.groups.length; i++) {
                if (i === WO.addKeywordTargetGroupIndex) continue;
                if (!WO.groups[i].keywords) WO.groups[i].keywords = [];
                if (WO.groups[i].keywords.some(k => normalize(k) === nkw)) {
                    alert(`Keyword already exists in group "${WO.groups[i].name}".`); return;
                }
            }

            if (WO.containsBlockedContent(kw)) { alert('Content blocked.'); return; }

            const addedAt = Date.now();
            const ek = WO.getKeywordEncodedKey(kw);
            WO.lastAddedKeyword    = kw;
            WO.lastAddedGroupIndex = WO.addKeywordTargetGroupIndex;
            group.keywords.push(kw);
            if (!WO.keywordAddedAt || typeof WO.keywordAddedAt !== 'object') WO.keywordAddedAt = {};
            WO.keywordAddedAt[ek] = addedAt;

            WO.resetAddKeywordModalState();
            WO.toggleModal(document.getElementById('add-keyword-modal'), false);
            WO.renderGroups();

            try {
                await WO.syncAndSaveGroups();
            } catch (e) {
                console.error('Failed to save keyword:', e);
                alert('Failed to save to cloud: ' + e.message);
                group.keywords.pop();
                WO.renderGroups();
                return;
            }

            const tasks = [WO.saveKeywordAddedAt(kw, addedAt)];
            if (desc) {
                if (!WO.keywordDescriptions || typeof WO.keywordDescriptions !== 'object') WO.keywordDescriptions = {};
                tasks.push(WO.saveKeywordDescription(kw, desc));
            }
            Promise.all(tasks).catch(e => console.error('Failed to save keyword metadata:', e));
        } catch (e) {
            console.error('Unhandled error in saveNewKeyword:', e);
            alert('An unexpected error occurred: ' + e.message);
            WO.resetAddKeywordModalState();
            WO.toggleModal(document.getElementById('add-keyword-modal'), false);
            WO.renderGroups();
        } finally {
            WO.isSavingKeyword = false;
        }
    };
    window.saveNewKeyword = WO.saveNewKeyword;

    // ─── Keyword Rename ───────────────────────────────────────────────────────
    WO.renameKeyword = async function (groupIndex, keywordIndex, oldKeyword, commentOnly = false) {
        if (!commentOnly && !WO.adminLoggedIn) { window.showToast('Admin access required to rename keywords', 3000); return; }
        const renameModal        = document.getElementById('rename-modal');
        const renameKeywordInput = document.getElementById('rename-keyword-input');
        const renameKeywordDescInput = document.getElementById('rename-keyword-desc-input');
        const modalTitle         = document.getElementById('rename-modal-title');

        WO.isCommentOnlyMode         = commentOnly;
        WO.renameTargetGroupIndex    = groupIndex;
        WO.renameTargetKeywordIndex  = keywordIndex;
        renameKeywordInput.value     = oldKeyword;

        if (modalTitle) {
            modalTitle.innerHTML = commentOnly
                ? '<img src="media/comment.png" style="width:24px;height:24px;margin-right:10px;vertical-align:middle;">Edit Comment'
                : '<img src="media/rename.png" style="width:24px;height:24px;margin-right:10px;vertical-align:middle;">Edit Keyword';
        }
        if (commentOnly) {
            renameKeywordInput.setAttribute('readonly', 'true');
            renameKeywordInput.style.opacity = '0.7';
            renameKeywordInput.style.cursor  = 'not-allowed';
        } else {
            renameKeywordInput.removeAttribute('readonly');
            renameKeywordInput.style.opacity = '1';
            renameKeywordInput.style.cursor  = 'text';
        }
        const ek = encodeURIComponent(oldKeyword).replace(/\./g, '%2E');
        renameKeywordDescInput.value = WO.keywordDescriptions[ek] || '';
        WO.toggleModal(renameModal, true);
        if (commentOnly) renameKeywordDescInput.focus();
        else { renameKeywordInput.focus(); renameKeywordInput.select(); }
    };

    WO.saveRename = async function () {
        const renameModal        = document.getElementById('rename-modal');
        const renameKeywordInput = document.getElementById('rename-keyword-input');
        const renameKeywordDescInput = document.getElementById('rename-keyword-desc-input');

        const newKeyword    = renameKeywordInput.value.trim();
        const newDescription = renameKeywordDescInput.value.trim();
        if (!newKeyword) return;
        if (WO.renameTargetGroupIndex == null || !WO.groups[WO.renameTargetGroupIndex] ||
            WO.renameTargetKeywordIndex == null || !WO.groups[WO.renameTargetGroupIndex].keywords[WO.renameTargetKeywordIndex]) {
            window.showToast('⚠️ Data changed while editing. Try again.', 3000);
            WO.toggleModal(renameModal, false);
            return;
        }
        const oldKeyword  = WO.groups[WO.renameTargetGroupIndex].keywords[WO.renameTargetKeywordIndex];
        if (WO.containsBlockedContent(newKeyword)) { window.showToast('⛔ Inappropriate content', 3000); return; }

        const oldEncoded = encodeURIComponent(oldKeyword).replace(/\./g, '%2E');
        const newEncoded = encodeURIComponent(newKeyword).replace(/\./g, '%2E');

        if (newKeyword === oldKeyword) {
            await WO.saveKeywordDescription(newKeyword, newDescription);
            WO.toggleModal(renameModal, false);
            WO.renderGroups();
            return;
        }
        if (!WO.adminLoggedIn) { window.showToast('Admin access required to rename keywords', 3000); return; }

        WO.groups[WO.renameTargetGroupIndex].keywords[WO.renameTargetKeywordIndex] = newKeyword;
        if (WO.keywordAddedAt[oldEncoded] !== undefined) { WO.keywordAddedAt[newEncoded] = WO.keywordAddedAt[oldEncoded]; delete WO.keywordAddedAt[oldEncoded]; }

        const ops = [];
        if (WO.globalClickCounts[oldEncoded] !== undefined) {
            const oc = WO.globalClickCounts[oldEncoded];
            WO.globalClickCounts[newEncoded] = oc;
            delete WO.globalClickCounts[oldEncoded];
            ops.push(WO.clickCountsRef.update({ [newEncoded]: WO.firestoreFieldValue.increment(oc), [oldEncoded]: WO.firestoreFieldValue.delete() }));
        }
        WO.keywordDescriptions[newEncoded] = newDescription;
        if (newEncoded !== oldEncoded) delete WO.keywordDescriptions[oldEncoded];
        ops.push(WO.descriptionsRef.update({ [newEncoded]: newDescription || WO.firestoreFieldValue.delete(), [oldEncoded]: WO.firestoreFieldValue.delete() })
            .catch(() => WO.descriptionsRef.set({ [newEncoded]: newDescription }, { merge: true })));
        if (WO.keywordAddedAt[newEncoded] !== undefined) {
            ops.push(WO.keywordAddedAtRef.update({ [newEncoded]: WO.keywordAddedAt[newEncoded], [oldEncoded]: WO.firestoreFieldValue.delete() })
                .catch(() => WO.keywordAddedAtRef.set({ [newEncoded]: WO.keywordAddedAt[newEncoded] }, { merge: true })));
        }
        try { await Promise.all(ops); } catch (e) { console.error('Failed to transfer keyword data:', e); }
        await WO.syncAndSaveGroups();
        WO.renderGroups();
        WO.toggleModal(renameModal, false);
    };

    // ─── Keyword Delete ───────────────────────────────────────────────────────
    WO.deleteKeyword = async function (groupIndex, keywordIndex) {
        if (!WO.adminLoggedIn) { window.showToast('Admin access required to delete keywords', 3000); return; }
        if (!confirm('Delete this keyword?')) return;
        if (!WO.groups[groupIndex] || !WO.groups[groupIndex].keywords[keywordIndex]) { window.showToast('⚠️ Data changed. Try again.', 3000); return; }

        const kw = WO.groups[groupIndex].keywords[keywordIndex];

        // Animate out the deleted keyword first
        const groupsContainer = document.getElementById('groups-container');
        if (groupsContainer) {
            const groupCard = groupsContainer.querySelector(`.group-card[data-group-index="${groupIndex}"]`);
            if (groupCard) {
                const candidates = Array.from(groupCard.querySelectorAll('[data-keyword-value]'));
                const target = candidates.find(node => node.dataset.keywordValue === kw);
                if (target) {
                    target.classList.add('keyword-deleted');
                    await new Promise(resolve => setTimeout(resolve, 350));
                }
            }
        }

        WO.groups[groupIndex].keywords.splice(keywordIndex, 1);
        const existsElsewhere = WO.groups.some(g => g.keywords.includes(kw));
        if (!existsElsewhere) {
            const ek = encodeURIComponent(kw).replace(/\./g, '%2E');
            try {
                await Promise.all([
                    WO.clickCountsRef.update({ [ek]: WO.firestoreFieldValue.delete() }),
                    WO.descriptionsRef.update({ [ek]: WO.firestoreFieldValue.delete() }),
                    WO.keywordAddedAtRef.update({ [ek]: WO.firestoreFieldValue.delete() })
                ]);
                delete WO.keywordAddedAt[ek];
                delete WO.keywordDescriptions[ek];
                delete WO.globalClickCounts[ek];
            } catch (e) { console.error('Failed to delete keyword data:', e); }
        }
        await WO.syncAndSaveGroups();
        WO.renderGroups();
    };

    // ─── Import / Export ──────────────────────────────────────────────────────
    WO.initImportExport = function () {
        const exportBtn       = document.getElementById('export-btn');
        const importBtn       = document.getElementById('import-btn');
        const importFileInput = document.getElementById('import-file-input');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = JSON.stringify({
                    exportDate: new Date().toISOString(), version: '4.8',
                    groups: WO.groups, keywordAddedAt: WO.keywordAddedAt,
                    globalClickCounts: WO.globalClickCounts, keywordDescriptions: WO.keywordDescriptions
                }, null, 2);
                const a    = document.createElement('a');
                a.href     = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
                a.download = `websiteorganiser-backup-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            });
        }

        if (importBtn) importBtn.addEventListener('click', () => importFileInput && importFileInput.click());

        if (importFileInput) {
            importFileInput.addEventListener('change', async e => {
                const file = e.target.files[0]; if (!file) return;
                try {
                    const imported = JSON.parse(await file.text());
                    if (!imported.groups || !Array.isArray(imported.groups)) throw new Error('Invalid backup: missing groups array');
                    imported.groups = imported.groups
                        .filter(g => g && typeof g === 'object' && typeof g.name === 'string' && g.name.trim() && Array.isArray(g.keywords))
                        .map(g => ({ ...g, keywords: g.keywords.filter(k => typeof k === 'string' && k.trim()) }));
                    if (!imported.groups.length) throw new Error('No valid groups in backup');

                    const replace = confirm('OK = Replace all existing data\nCancel = Merge with existing data');
                    if (replace) {
                        WO.groups              = imported.groups;
                        WO.keywordAddedAt      = imported.keywordAddedAt      || {};
                        WO.globalClickCounts   = imported.globalClickCounts   || {};
                        WO.keywordDescriptions = imported.keywordDescriptions || {};
                    } else {
                        imported.groups.forEach(ig => {
                            const eg = WO.groups.find(g => g.name.toLowerCase() === ig.name.toLowerCase());
                            if (eg) {
                                ig.keywords.forEach(kw => {
                                    if (!eg.keywords.some(k => k.toLowerCase() === kw.toLowerCase())) {
                                        eg.keywords.push(kw);
                                        WO.keywordAddedAt[WO.getKeywordEncodedKey(kw)] = Date.now();
                                    }
                                });
                            } else {
                                WO.groups.push(ig);
                                ig.keywords.forEach(kw => { WO.keywordAddedAt[WO.getKeywordEncodedKey(kw)] = Date.now(); });
                            }
                        });
                        if (imported.globalClickCounts)   Object.assign(WO.globalClickCounts, imported.globalClickCounts);
                        if (imported.keywordDescriptions) Object.assign(WO.keywordDescriptions, imported.keywordDescriptions);
                        if (imported.keywordAddedAt)      Object.assign(WO.keywordAddedAt, imported.keywordAddedAt);
                    }
                    await WO.syncAndSaveGroups();
                    try { await Promise.all([WO.clickCountsRef.set(WO.globalClickCounts), WO.descriptionsRef.set(WO.keywordDescriptions), WO.keywordAddedAtRef.set(WO.keywordAddedAt)]); }
                    catch (e) { console.error('Failed to sync metadata:', e); }
                    WO.saveLocalDataBackup();
                    WO.renderGroups();
                } catch (err) { alert('Failed to import backup: ' + err.message); }
                importFileInput.value = '';
            });
        }
    };

})(window.WO);
