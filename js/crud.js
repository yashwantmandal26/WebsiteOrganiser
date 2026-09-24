// =============================================================================
// js/crud.js — Add / Rename / Delete Groups & Keywords + Import/Export
// =============================================================================

(function (WO) {

    // ─── Group CRUD ───────────────────────────────────────────────────────────

    // ── Initialise palette swatches (once) ──────────────────────────────────
    let _swatchesBuilt = false;
    function _buildSwatches() {
        if (_swatchesBuilt) return;
        _swatchesBuilt = true;
        const container = document.getElementById('group-color-swatches');
        if (!container) return;
        WO.GROUP_COLORS.forEach(hex => {
            const btn = document.createElement('button');
            btn.type  = 'button';
            btn.className = 'group-color-swatch';
            btn.style.background = hex;
            btn.title = hex;
            btn.dataset.color = hex;
            btn.addEventListener('click', () => {
                const inp = document.getElementById('group-color-input');
                if (inp) { inp.value = hex; inp.dispatchEvent(new Event('input')); }
            });
            container.appendChild(btn);
        });
    }

    WO.openGroupModal = function (mode, index = null) {
        const groupModal      = document.getElementById('group-modal');
        const groupModalTitle = document.getElementById('group-modal-title');
        const groupNameInput  = document.getElementById('group-name-input');
        const colorRow        = document.getElementById('group-color-picker-row');
        const colorInput      = document.getElementById('group-color-input');
        if (mode === 'edit' && (index == null || !WO.groups[index])) { window.showToast('⚠️ Group not found.', 3000); return; }
        if (mode === 'edit' && !WO.adminLoggedIn) { alert('Admin access required to rename groups.'); return; }
        WO.groupModalMode    = mode;
        WO.currentGroupIndex = index;
        groupModalTitle.textContent = mode === 'add' ? 'Create New Group' : 'Rename Group';
        groupNameInput.value = mode === 'edit' ? WO.groups[index].name : '';

        // ── Colour picker ────────────────────────────────────────────────────
        if (mode === 'edit' && WO.adminLoggedIn && colorRow && colorInput) {
            _buildSwatches();
            colorRow.style.display = '';
            // Show custom colour, or fall back to the current auto-generated colour
            const group = WO.groups[index];
            const usedColors = new Set();
            const currentColor = group.color || WO.getGroupColor(group, usedColors, index);
            colorInput.value = currentColor.startsWith('#') ? currentColor : _rgbToHex(currentColor);
            _highlightSwatch(colorInput.value);
            // Keep swatch highlight in sync while user adjusts the native picker
            colorInput.addEventListener('input', _onColorInputChange);
        } else if (colorRow) {
            colorRow.style.display = 'none';
        }

        WO.toggleModal(groupModal, true);
        groupNameInput.focus();
    };

    // Live-update swatch highlight as native picker changes
    function _onColorInputChange() {
        _highlightSwatch(this.value);
    }

    function _highlightSwatch(hex) {
        document.querySelectorAll('.group-color-swatch').forEach(s => {
            s.classList.toggle('group-color-swatch--active', s.dataset.color.toLowerCase() === hex.toLowerCase());
        });
    }

    // Convert "rgb(r, g, b)" → "#rrggbb" for the native color input
    function _rgbToHex(rgb) {
        const m = rgb.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
        if (!m) return '#ffffff';
        return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    }

    // Reset to auto colour
    document.addEventListener('DOMContentLoaded', () => {
        const resetBtn = document.getElementById('group-color-reset-btn');
        const colorInput = document.getElementById('group-color-input');
        if (resetBtn && colorInput) {
            resetBtn.addEventListener('click', () => {
                // Compute auto colour for current group
                const idx = WO.currentGroupIndex;
                if (idx != null && WO.groups[idx]) {
                    const usedColors = new Set();
                    const auto = WO.getGroupColor(WO.groups[idx], usedColors, idx);
                    colorInput.value = auto.startsWith('#') ? auto : _rgbToHex(auto);
                    colorInput.dispatchEvent(new Event('input'));
                    // Mark as "no custom colour" via a special sentinel
                    colorInput.dataset.autoReset = 'true';
                }
            });
            colorInput.addEventListener('input', () => { delete colorInput.dataset.autoReset; });
        }
    });


    WO.saveGroup = async function () {
        const groupModal     = document.getElementById('group-modal');
        const groupNameInput = document.getElementById('group-name-input');
        const colorInput     = document.getElementById('group-color-input');
        if (WO.groupModalMode === 'edit' && !WO.adminLoggedIn) { alert('Admin access required to rename groups.'); return; }
        const newName = groupNameInput.value.trim();
        if (!newName) { alert('Group name cannot be empty.'); return; }
        if (WO.containsBlockedContent(newName)) return;
        const duplicate = WO.groups.some((g, i) =>
            g.name.trim().toLowerCase() === newName.toLowerCase() && (WO.groupModalMode === 'add' || i !== WO.currentGroupIndex)
        );
        if (duplicate) { alert('A group with this name already exists.'); return; }
        if (WO.groupModalMode === 'add') {
            WO.groups.push({ name: newName, keywords: [], keywordIds: [], keywordTags: {}, trash: [] });
            if (typeof WO.logActivity === 'function') {
                WO.logActivity('ADD_GROUP', { targetName: newName });
            }
        } else {
            const oldName = WO.groups[WO.currentGroupIndex].name;
            WO.groups[WO.currentGroupIndex].name = newName;
            WO.renameLocalGroupOrder(oldName, newName);

            // ── Save custom colour ────────────────────────────────────────
            if (colorInput) {
                if (colorInput.dataset.autoReset === 'true') {
                    // User clicked "Auto" — remove custom colour
                    delete WO.groups[WO.currentGroupIndex].color;
                } else {
                    WO.groups[WO.currentGroupIndex].color = colorInput.value;
                }
            }

            if (typeof WO.logActivity === 'function') {
                WO.logActivity('EDIT_GROUP', {
                    targetName: newName,
                    diff: { oldName: oldName, newName: newName }
                });
            }
        }
        WO.toggleModal(groupModal, false);
        groupNameInput.value = '';
        if (colorInput) delete colorInput.dataset.autoReset;
        await WO.syncAndSaveGroups().catch(() => {});
        WO.renderGroups();
    };
    window.saveGroup      = WO.saveGroup;
    window.closeGroupModal = () => WO.toggleModal(document.getElementById('group-modal'), false);

    WO.deleteGroup = async function (index) {
        if (!WO.adminLoggedIn) { alert('Admin access required to delete groups.'); return; }
        const group = WO.groups[index];
        if (!group) return;
        const name = group.name;

        // Rate limit check
        if (typeof WO.checkDeletionRateLimit === 'function') {
            const rateCheck = WO.checkDeletionRateLimit(name);
            if (!rateCheck.allowed) {
                alert(rateCheck.message);
                return;
            }
        }

        if (confirm(`Delete group "${name}"?`)) {
            const deletedGroupPayload = {
                groupName: name,
                keywords: Array.isArray(group.keywords) ? [...group.keywords] : [],
                keywordTags: group.keywordTags ? {...group.keywordTags} : {},
                keywordIds: group.keywordIds ? [...group.keywordIds] : []
            };

            WO.groups.splice(index, 1);
            WO.removeLocalGroupOrder(name);
            await WO.syncAndSaveGroups().catch(() => {});
            WO.renderGroups();

            if (typeof WO.logActivity === 'function') {
                WO.logActivity('DELETE_GROUP', {
                    targetName: name,
                    payload: deletedGroupPayload
                });
            }
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
            const bookmarkId = WO.createBookmarkId();
            const ek = bookmarkId;
            WO.lastAddedKeyword    = kw;
            WO.lastAddedGroupIndex = WO.addKeywordTargetGroupIndex;
            group.keywords.unshift(kw);
            group.keywordIds.unshift(bookmarkId);
            if (!WO.keywordAddedAt || typeof WO.keywordAddedAt !== 'object') WO.keywordAddedAt = {};
            WO.keywordAddedAt[ek] = addedAt;
            const legacyKey = WO.getKeywordEncodedKey(kw);
            if (legacyKey && legacyKey !== ek) {
                WO.keywordAddedAt[legacyKey] = addedAt;
            }

            if (typeof WO.logActivity === 'function') {
                WO.logActivity('ADD_KEYWORD', {
                    targetName: kw,
                    groupName: group.name,
                    groupIndex: WO.lastAddedGroupIndex
                });
            }

            WO.resetAddKeywordModalState();
            WO.toggleModal(document.getElementById('add-keyword-modal'), false);
            WO.renderGroups();

            try {
                await WO.syncAndSaveGroups();
            } catch (e) {
                console.error('Failed to save keyword:', e);
                // Keep the local change. The persistent sync indicator exposes retry.
            }

            const tasks = [WO.saveKeywordAddedAt(kw, addedAt, bookmarkId)];
            if (desc) {
                if (!WO.keywordDescriptions || typeof WO.keywordDescriptions !== 'object') WO.keywordDescriptions = {};
                tasks.push(WO.saveKeywordDescription(kw, desc, bookmarkId));
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
        const renameModal        = document.getElementById('rename-modal');
        const renameKeywordInput = document.getElementById('rename-keyword-input');
        const renameKeywordDescInput = document.getElementById('rename-keyword-desc-input');
        const modalTitle         = document.getElementById('rename-modal-title');

        WO.isCommentOnlyMode         = commentOnly;
        WO.renameTargetGroupIndex    = groupIndex;
        WO.renameTargetKeywordIndex  = keywordIndex;
        WO.renameTargetBookmarkId    = WO.getBookmarkId(groupIndex, keywordIndex);
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
        const ek = WO.renameTargetBookmarkId || encodeURIComponent(oldKeyword).replace(/\./g, '%2E');
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
        if (!newKeyword) { alert('Keyword name cannot be empty.'); return; }
        const located = WO.groups.map((g, gi) => ({ gi, ki: (g.keywordIds || []).indexOf(WO.renameTargetBookmarkId) })).find(x => x.ki >= 0);
        if (located) { WO.renameTargetGroupIndex = located.gi; WO.renameTargetKeywordIndex = located.ki; }
        if (WO.renameTargetGroupIndex == null || !WO.groups[WO.renameTargetGroupIndex] ||
            WO.renameTargetKeywordIndex == null || !WO.groups[WO.renameTargetGroupIndex].keywords[WO.renameTargetKeywordIndex]) {
            window.showToast('⚠️ Data changed while editing. Try again.', 3000);
            WO.toggleModal(renameModal, false);
            return;
        }
        const oldKeyword  = WO.groups[WO.renameTargetGroupIndex].keywords[WO.renameTargetKeywordIndex];

        if (newKeyword !== oldKeyword && !WO.adminLoggedIn) {
            alert('Admin access required to rename keywords.');
            return;
        }

        if (WO.containsBlockedContent(newKeyword)) { window.showToast('⛔ Inappropriate content', 3000); return; }

        if (newKeyword !== oldKeyword) {
            const normalize = s => {
                if (typeof s !== 'string') return '';
                let r = s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
                if (r.endsWith('/')) r = r.slice(0, -1);
                return r;
            };
            const nkw = normalize(newKeyword);
            const duplicate = WO.groups.some((g, gi) =>
                g.keywords && g.keywords.some((k, ki) =>
                    normalize(k) === nkw && !(gi === WO.renameTargetGroupIndex && ki === WO.renameTargetKeywordIndex)
                )
            );
            if (duplicate) { alert('A keyword with this name/link already exists.'); return; }
        }

        const metadataKey = WO.renameTargetBookmarkId || encodeURIComponent(oldKeyword).replace(/\./g, '%2E');

        if (newKeyword === oldKeyword) {
            await WO.saveKeywordDescription(newKeyword, newDescription, metadataKey);
            WO.toggleModal(renameModal, false);
            WO.renderGroups();
            return;
        }

        WO.groups[WO.renameTargetGroupIndex].keywords[WO.renameTargetKeywordIndex] = newKeyword;
        await WO.saveKeywordDescription(newKeyword, newDescription, metadataKey);
        await WO.syncAndSaveGroups().catch(() => {});
        WO.renderGroups();
        WO.toggleModal(renameModal, false);

        if (typeof WO.logActivity === 'function') {
            WO.logActivity('EDIT_KEYWORD', {
                targetName: newKeyword,
                groupName: WO.groups[WO.renameTargetGroupIndex] ? WO.groups[WO.renameTargetGroupIndex].name : '',
                groupIndex: WO.renameTargetGroupIndex,
                diff: { oldName: oldKeyword, newName: newKeyword }
            });
        }
    };

    // ─── Keyword Delete ───────────────────────────────────────────────────────
    WO.animateKeywordOut = async function(groupIndex, kw) {
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
    };

    WO.deleteKeyword = async function (groupIndex, keywordIndex) {
        if (!WO.groups[groupIndex] || !WO.groups[groupIndex].keywords[keywordIndex]) { window.showToast('⚠️ Data changed. Try again.', 3000); return; }
        const kw = WO.groups[groupIndex].keywords[keywordIndex];
        const group = WO.groups[groupIndex];

        // ── Security Check: Rate Limit Deletions ─────────────────────────────
        if (typeof WO.checkDeletionRateLimit === 'function') {
            const rateCheck = WO.checkDeletionRateLimit(kw);
            if (!rateCheck.allowed) {
                alert(rateCheck.message);
                return;
            }
        }

        const bookmarkId = WO.getBookmarkId(groupIndex, keywordIndex);
        const ek = bookmarkId || WO.getKeywordEncodedKey(kw);
        const isSoftDeleted = WO.keywordDeletedStatus && WO.keywordDeletedStatus[ek] === true;

        const deletePayload = {
            keyword: kw,
            description: WO.getBookmarkMetadata(WO.keywordDescriptions, groupIndex, keywordIndex, kw, ''),
            tags: (group.keywordTags && group.keywordTags[bookmarkId]) || [],
            groupName: group.name,
            groupIndex: groupIndex
        };

        if (!WO.adminLoggedIn) {
            if (!confirm('Delete this keyword?')) return;
            await WO.animateKeywordOut(groupIndex, kw);
            await WO.saveKeywordDeletedStatus(kw, true, ek);
            WO.renderGroups();

            if (typeof WO.logActivity === 'function') {
                WO.logActivity('DELETE_KEYWORD', {
                    targetName: kw,
                    groupName: group.name,
                    groupIndex: groupIndex,
                    payload: deletePayload
                });
            }
            return;
        }

        if (!confirm(isSoftDeleted ? 'Move this keyword to Trash?' : 'Move this keyword to Trash?')) return;
        
        await WO.animateKeywordOut(groupIndex, kw);

        const tags = (group.keywordTags && group.keywordTags[bookmarkId]) || [];
        const trashItem = { id: bookmarkId, keyword: kw, tags, deletedAt: Date.now(), originalIndex: keywordIndex };
        group.trash.push(trashItem);
        group.keywords.splice(keywordIndex, 1);
        group.keywordIds.splice(keywordIndex, 1);
        if (group.keywordTags) delete group.keywordTags[bookmarkId];
        await WO.syncAndSaveGroups().catch(() => {});
        WO.renderGroups();

        if (typeof WO.logActivity === 'function') {
            WO.logActivity('DELETE_KEYWORD', {
                targetName: kw,
                groupName: group.name,
                groupIndex: groupIndex,
                payload: deletePayload
            });
        }

        window.showToast('Moved to Trash.', 6000, 'Undo', async () => WO.restoreTrashItem(groupIndex, trashItem.id));
    };

    WO.restoreKeyword = async function (groupIndex, keywordIndex) {
        if (!WO.adminLoggedIn) return;
        const kw = WO.groups[groupIndex].keywords[keywordIndex];
        if (!kw) return;
        await WO.saveKeywordDeletedStatus(kw, false, WO.getBookmarkMetadataKey(groupIndex, keywordIndex, kw));
        WO.renderGroups();
    };

    // ─── Bulk actions and Trash ──────────────────────────────────────────────
    WO.updateBulkToolbar = function () {
        const toolbar = document.getElementById('bulk-toolbar');
        const count = document.getElementById('bulk-selection-count');
        if (toolbar) toolbar.hidden = !WO.bulkMode;
        if (count) count.textContent = String(WO.selectedBookmarkIds.size);
        const select = document.getElementById('bulk-target-group');
        if (select) {
            const current = select.value;
            select.textContent = '';
            WO.groups.forEach((g, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = g.name; select.appendChild(o); });
            if (current) select.value = current;
        }
    };

    WO.setBulkMode = function (enabled) {
        WO.bulkMode = !!enabled;
        if (!enabled) WO.selectedBookmarkIds.clear();
        WO.updateBulkToolbar();
        WO.renderGroups();
    };

    WO.toggleBulkSelection = function (bookmarkId) {
        if (!bookmarkId) return;
        if (WO.selectedBookmarkIds.has(bookmarkId)) WO.selectedBookmarkIds.delete(bookmarkId);
        else WO.selectedBookmarkIds.add(bookmarkId);
        WO.updateBulkToolbar();
        WO.renderGroups();
    };

    function selectedEntries() {
        const result = [];
        WO.groups.forEach((group, gi) => group.keywordIds.forEach((id, ki) => {
            if (WO.selectedBookmarkIds.has(id)) result.push({ group, gi, ki, id, keyword: group.keywords[ki] });
        }));
        return result;
    }

    WO.bulkMoveSelected = async function (targetGroupIndex) {
        const target = WO.groups[targetGroupIndex];
        const entries = selectedEntries();
        if (!target || !entries.length) return;
        const payload = entries.map(e => ({ id: e.id, keyword: e.keyword, tags: e.group.keywordTags[e.id] || [] }));
        entries.slice().sort((a, b) => b.ki - a.ki).forEach(e => {
            e.group.keywords.splice(e.ki, 1); e.group.keywordIds.splice(e.ki, 1); delete e.group.keywordTags[e.id];
        });
        payload.forEach(p => { target.keywords.push(p.keyword); target.keywordIds.push(p.id); if (p.tags.length) target.keywordTags[p.id] = p.tags; });
        await WO.syncAndSaveGroups().catch(() => {});
        WO.setBulkMode(false);
        window.showToast(`Moved ${payload.length} bookmark${payload.length === 1 ? '' : 's'}.`, 3000);
    };

    WO.bulkTagSelected = async function (tag) {
        tag = String(tag || '').trim().slice(0, 30);
        const entries = selectedEntries();
        if (!tag || !entries.length) return;
        entries.forEach(e => {
            const tags = Array.isArray(e.group.keywordTags[e.id]) ? e.group.keywordTags[e.id] : [];
            if (!tags.some(t => t.toLowerCase() === tag.toLowerCase())) e.group.keywordTags[e.id] = [...tags, tag].slice(0, 10);
        });
        await WO.syncAndSaveGroups().catch(() => {}); WO.renderGroups();
        window.showToast(`Tagged ${entries.length} bookmark${entries.length === 1 ? '' : 's'}.`, 3000);
    };

    WO.bulkTrashSelected = async function () {
        const entries = selectedEntries();
        if (!entries.length) return;

        // Rate limit check
        if (typeof WO.checkDeletionRateLimit === 'function') {
            const rateCheck = WO.checkDeletionRateLimit(`${entries.length} bulk items`);
            if (!rateCheck.allowed) {
                alert(rateCheck.message);
                return;
            }
        }

        const undoItems = [];
        entries.slice().sort((a, b) => b.ki - a.ki).forEach(e => {
            const item = { id: e.id, keyword: e.keyword, tags: (e.group.keywordTags && e.group.keywordTags[e.id]) || [], deletedAt: Date.now(), originalIndex: e.ki };
            e.group.trash.push(item); undoItems.push({ group: e.group, item });
            e.group.keywords.splice(e.ki, 1); e.group.keywordIds.splice(e.ki, 1);
            if (e.group.keywordTags) delete e.group.keywordTags[e.id];

            if (typeof WO.logActivity === 'function') {
                WO.logActivity('DELETE_KEYWORD', {
                    targetName: e.keyword,
                    groupName: e.group.name,
                    groupIndex: e.gi,
                    payload: {
                        keyword: e.keyword,
                        description: '',
                        tags: (e.group.keywordTags && e.group.keywordTags[e.id]) || [],
                        groupName: e.group.name,
                        groupIndex: e.gi
                    },
                    isSuspicious: entries.length >= 5
                });
            }
        });
        await WO.syncAndSaveGroups().catch(() => {}); WO.setBulkMode(false);
        window.showToast(`Moved ${entries.length} bookmark${entries.length === 1 ? '' : 's'} to Trash.`, 6000, 'Undo', async () => {
            undoItems.forEach(({ group, item }) => WO.restoreTrashItemInMemory(group, item.id));
            await WO.syncAndSaveGroups().catch(() => {}); WO.renderGroups();
        });
    };

    WO.restoreTrashItemInMemory = function (group, itemId) {
        const index = group && group.trash ? group.trash.findIndex(t => t.id === itemId) : -1;
        if (index < 0) return false;
        const item = group.trash[index];
        const originalIndex = Number(item.originalIndex);
        const at = Math.min(Number.isFinite(originalIndex) ? Math.max(0, originalIndex) : group.keywords.length, group.keywords.length);
        group.keywords.splice(at, 0, item.keyword); group.keywordIds.splice(at, 0, item.id);
        if (item.tags && item.tags.length) group.keywordTags[item.id] = item.tags;
        group.trash.splice(index, 1); return true;
    };

    WO.restoreTrashItem = async function (groupIndex, itemId) {
        const group = WO.groups[groupIndex];
        if (!WO.restoreTrashItemInMemory(group, itemId)) return;
        await WO.syncAndSaveGroups().catch(() => {}); WO.renderTrash(); WO.renderGroups();
    };

    WO.renderTrash = function () {
        const list = document.getElementById('trash-list'); if (!list) return;
        list.textContent = '';
        let count = 0;
        WO.groups.forEach((group, gi) => group.trash.forEach(item => {
            count++;
            const row = document.createElement('div'); row.className = 'trash-row';
            const label = document.createElement('span'); label.textContent = `${item.keyword} — ${group.name}`;
            const restore = document.createElement('button'); restore.type = 'button'; restore.className = 'btn'; restore.textContent = 'Restore';
            restore.onclick = () => WO.restoreTrashItem(gi, item.id);
            row.append(label, restore); list.appendChild(row);
        }));
        if (!count) { const empty = document.createElement('p'); empty.textContent = 'Trash is empty.'; list.appendChild(empty); }
    };

    // ─── Import / Export ──────────────────────────────────────────────────────
    WO.initImportExport = function () {
        const exportBtn       = document.getElementById('export-btn');
        const importBtn       = document.getElementById('import-btn');
        const importFileInput = document.getElementById('import-file-input');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = JSON.stringify({
                    exportDate: new Date().toISOString(), version: '5.0',
                    groups: WO.groups, keywordAddedAt: WO.keywordAddedAt,
                    globalClickCounts: WO.globalClickCounts, keywordDescriptions: WO.keywordDescriptions,
                    keywordDeletedStatus: WO.keywordDeletedStatus,
                    preferences: {
                        theme: document.documentElement.dataset.theme || 'light',
                        groupOrder: WO.localGroupOrder,
                        searchMode: WO.searchMode,
                        personalUsage: WO.localClickCounts
                    }
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
                    const raw = JSON.parse(await file.text());
                    const imported = WO.validateImportedBackup(raw);
                    const stats = WO.previewImport(imported);
                    const choice = await WO.askImportChoice(stats);
                    if (choice === 'cancel') { importFileInput.value = ''; return; }

                    if (choice === 'replace') {
                        localStorage.setItem('websiteorganiser_recovery_before_import_v1', JSON.stringify({
                            version: 2, savedAt: Date.now(), initialized: true, groups: WO.groups,
                            keywordAddedAt: WO.keywordAddedAt, globalClickCounts: WO.globalClickCounts,
                            keywordDescriptions: WO.keywordDescriptions, keywordDeletedStatus: WO.keywordDeletedStatus
                        }));
                        WO.groups              = imported.groups;
                        WO.keywordAddedAt      = imported.keywordAddedAt      || {};
                        WO.globalClickCounts   = imported.globalClickCounts   || {};
                        WO.keywordDescriptions = imported.keywordDescriptions || {};
                        WO.keywordDeletedStatus= imported.keywordDeletedStatus || {};
                    } else {
                        imported.groups.forEach(ig => {
                            const eg = WO.groups.find(g => g.name.toLowerCase() === ig.name.toLowerCase());
                            if (eg) {
                                ig.keywords.forEach((kw, importedIndex) => {
                                    if (!eg.keywords.some(k => k.toLowerCase() === kw.toLowerCase())) {
                                        eg.keywords.push(kw);
                                        const id = ig.keywordIds[importedIndex] || WO.createBookmarkId();
                                        eg.keywordIds.push(id);
                                        if (ig.keywordTags[id]) eg.keywordTags[id] = ig.keywordTags[id];
                                        WO.keywordAddedAt[id] = imported.keywordAddedAt[id] || Date.now();
                                    }
                                });
                            } else {
                                WO.groups.push(ig);
                                ig.keywords.forEach((kw, i) => { const id = ig.keywordIds[i]; if (WO.keywordAddedAt[id] === undefined) WO.keywordAddedAt[id] = imported.keywordAddedAt[id] || Date.now(); });
                            }
                        });
                        if (imported.globalClickCounts)   Object.assign(WO.globalClickCounts, imported.globalClickCounts);
                        if (imported.keywordDescriptions) Object.assign(WO.keywordDescriptions, imported.keywordDescriptions);
                        if (imported.keywordAddedAt)      Object.assign(WO.keywordAddedAt, imported.keywordAddedAt);
                        if (imported.keywordDeletedStatus) Object.assign(WO.keywordDeletedStatus, imported.keywordDeletedStatus);
                    }
                    WO.ensureStableBookmarkIds();
                    if (imported.preferences) {
                        if (Array.isArray(imported.preferences.groupOrder)) { WO.localGroupOrder = imported.preferences.groupOrder; WO.saveLocalGroupOrder(); }
                        if (imported.preferences.personalUsage) { WO.localClickCounts = imported.preferences.personalUsage; WO.saveLocalUsage(); }
                        if (['light','dark','solid-dark'].includes(imported.preferences.theme)) WO.setTheme(imported.preferences.theme);
                    }
                    await WO.syncAndSaveGroups();
                    try { await Promise.all([WO.clickCountsRef.set(WO.globalClickCounts), WO.descriptionsRef.set(WO.keywordDescriptions), WO.keywordAddedAtRef.set(WO.keywordAddedAt), WO.deletedStatusRef.set(WO.keywordDeletedStatus)]); }
                    catch (e) { console.error('Failed to sync metadata:', e); }
                    WO.saveLocalDataBackup();
                    WO.renderGroups();
                    if (choice === 'replace') {
                        window.showToast('Backup replaced successfully.', 10000, 'Undo replacement', WO.restoreImportRecovery);
                    } else {
                        window.showToast('Backup merged successfully.', 4000);
                    }
                } catch (err) { alert('Failed to import backup: ' + err.message); }
                importFileInput.value = '';
            });
        }

        const bulkModeBtn = document.getElementById('bulk-mode-btn');
        if (bulkModeBtn) bulkModeBtn.onclick = () => WO.setBulkMode(!WO.bulkMode);
        const bulkCancel = document.getElementById('bulk-cancel-btn');
        if (bulkCancel) bulkCancel.onclick = () => WO.setBulkMode(false);
        const bulkMove = document.getElementById('bulk-move-btn');
        if (bulkMove) bulkMove.onclick = () => WO.bulkMoveSelected(Number(document.getElementById('bulk-target-group').value));
        const bulkTag = document.getElementById('bulk-tag-btn');
        if (bulkTag) bulkTag.onclick = () => WO.bulkTagSelected(document.getElementById('bulk-tag-input').value);
        const bulkTrash = document.getElementById('bulk-trash-btn');
        if (bulkTrash) bulkTrash.onclick = () => WO.bulkTrashSelected();
        const trashBtn = document.getElementById('trash-btn');
        if (trashBtn) trashBtn.onclick = () => { WO.renderTrash(); WO.toggleModal(document.getElementById('trash-modal'), true); };
        const trashClose = document.getElementById('trash-close-btn');
        if (trashClose) trashClose.onclick = () => WO.toggleModal(document.getElementById('trash-modal'), false);
        WO.updateBulkToolbar();
    };

    function cleanMetadataMap(value, validator) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        const out = {};
        Object.entries(value).slice(0, 10000).forEach(([key, item]) => {
            if (typeof key === 'string' && key.length <= 300 && validator(item)) out[key] = item;
        });
        return out;
    }

    WO.validateImportedBackup = function (raw) {
        if (!raw || !Array.isArray(raw.groups)) throw new Error('Invalid backup: missing groups array.');
        if (raw.groups.length > 500) throw new Error('Invalid backup: too many groups.');
        const groups = raw.groups.map(group => {
            if (!group || typeof group.name !== 'string' || !group.name.trim() || group.name.length > 100 || !Array.isArray(group.keywords)) return null;
            if (group.keywords.length > 5000) return null;
            const clean = {
                name: group.name.trim(),
                keywords: group.keywords.filter(k => typeof k === 'string' && k.trim() && k.length <= 2048).map(k => k.trim()),
                keywordIds: Array.isArray(group.keywordIds) ? group.keywords.map((_, i) => {
                    const id = group.keywordIds[i]; return typeof id === 'string' && id.length <= 100 ? id : '';
                }) : [],
                keywordTags: cleanMetadataMap(group.keywordTags, v => Array.isArray(v) && v.every(t => typeof t === 'string' && t.length <= 30)),
                trash: Array.isArray(group.trash) ? group.trash.filter(t => t && typeof t.id === 'string' && typeof t.keyword === 'string' && t.keyword.length <= 2048).slice(0, 5000) : []
            };
            if (typeof group.color === 'string' && /^#[0-9a-f]{6}$/i.test(group.color)) clean.color = group.color;
            return clean;
        }).filter(Boolean);
        if (!groups.length && raw.groups.length) throw new Error('No valid groups were found in this backup.');
        const backup = {
            groups,
            globalClickCounts: cleanMetadataMap(raw.globalClickCounts, v => Number.isFinite(Number(v)) && Number(v) >= 0),
            keywordDescriptions: cleanMetadataMap(raw.keywordDescriptions, v => typeof v === 'string' && v.length <= 2000),
            keywordAddedAt: cleanMetadataMap(raw.keywordAddedAt, v => Number.isFinite(Number(v))),
            keywordDeletedStatus: cleanMetadataMap(raw.keywordDeletedStatus, v => v === true),
            preferences: raw.preferences && typeof raw.preferences === 'object' ? raw.preferences : null
        };
        WO.ensureStableBookmarkIds(backup.groups);
        return backup;
    };

    WO.previewImport = function (imported) {
        let added = 0, changed = 0, skipped = 0;
        const existingGroups = new Map(WO.groups.map(g => [g.name.trim().toLowerCase(), g]));
        imported.groups.forEach(group => {
            const existing = existingGroups.get(group.name.toLowerCase());
            if (!existing) { added += group.keywords.length; return; }
            const existingSet = new Set(existing.keywords.map(k => k.trim().toLowerCase()));
            group.keywords.forEach(k => existingSet.has(k.toLowerCase()) ? skipped++ : added++);
            if (group.color !== existing.color) changed++;
        });
        return { groups: imported.groups.length, bookmarks: imported.groups.reduce((n, g) => n + g.keywords.length, 0), added, changed, skipped };
    };

    WO.askImportChoice = function (stats) {
        return new Promise(resolve => {
            const modal = document.getElementById('import-preview-modal');
            const summary = document.getElementById('import-preview-summary');
            summary.textContent = `${stats.groups} groups and ${stats.bookmarks} bookmarks. Merge would add ${stats.added}, update ${stats.changed} group settings, and skip ${stats.skipped} duplicates.`;
            const finish = choice => { WO.toggleModal(modal, false); resolve(choice); };
            document.getElementById('import-merge-btn').onclick = () => finish('merge');
            document.getElementById('import-replace-btn').onclick = () => finish('replace');
            document.getElementById('import-cancel-btn').onclick = () => finish('cancel');
            WO.toggleModal(modal, true);
        });
    };

    WO.restoreImportRecovery = async function () {
        const raw = localStorage.getItem('websiteorganiser_recovery_before_import_v1');
        if (!raw) { window.showToast('No import recovery snapshot is available.', 3000); return; }
        const recovery = JSON.parse(raw);
        if (!WO.applyLocalDataBackup(recovery)) throw new Error('The import recovery snapshot is invalid.');
        await WO.syncAndSaveGroups().catch(() => {});
        await Promise.all([
            WO.clickCountsRef.set(WO.globalClickCounts), WO.descriptionsRef.set(WO.keywordDescriptions),
            WO.keywordAddedAtRef.set(WO.keywordAddedAt), WO.deletedStatusRef.set(WO.keywordDeletedStatus)
        ]).catch(e => console.error('Failed to restore recovery metadata:', e));
        WO.saveLocalDataBackupNow(); WO.renderGroups();
        window.showToast('Previous library restored.', 4000);
    };

})(window.WO);
