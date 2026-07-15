// =============================================================================
// js/state.js — All Shared Application State
// =============================================================================
// All mutable state variables live here on window.WO.
// Other modules read/write via WO.xxx — no direct global variables.

(function (WO) {

    // ─── Data State ───────────────────────────────────────────────────────────
    WO.groups             = [];   // Main groups+keywords array (from Firestore)
    WO.globalClickCounts  = {};   // { encodedKeyword: count }
    WO.keywordDescriptions= {};   // { encodedKeyword: "description text" }
    WO.keywordAddedAt     = {};   // { encodedKeyword: unixTimestampMs }
    WO.keywordDeletedStatus= {};  // { encodedKeyword: true } (soft deleted by users)
    WO.localGroupOrder    = [];   // Per-browser group display order
    WO.dynamicLinkMap     = {};   // { staticUrl: dynamicUrl } from dynamic-links.json

    // ─── UI / Interaction State ───────────────────────────────────────────────
    WO.adminLoggedIn       = false;
    WO.currentGroupIndex   = null;   // Which group modal is editing
    WO.groupModalMode      = 'add';  // 'add' | 'edit'
    WO.draggedItemIndex    = null;   // Index of group being dragged
    WO.draggedKeywordData  = null;   // { groupIndex, keywordIndex, keyword }
    WO.lastAddedKeyword    = null;
    WO.lastAddedGroupIndex = null;
    WO.isCommentOnlyMode   = false;
    WO.addKeywordTargetGroupIndex = null;
    WO.renameTargetGroupIndex   = null;
    WO.renameTargetKeywordIndex = null;

    // ─── Save Guards ─────────────────────────────────────────────────────────
    WO.isSavingGroups  = false;  // Prevent snapshot overwriting during save
    WO.isSavingKeyword = false;  // Prevent double-save on add keyword
    WO.realtimeSyncActive = false;

    // ─── Search State ─────────────────────────────────────────────────────────
    WO.searchMode = (function () {
        try {
            const s = localStorage.getItem(WO.SEARCH_MODE_KEY);
            return s === WO.SEARCH_MODE_KEYWORDS ? WO.SEARCH_MODE_KEYWORDS : WO.SEARCH_MODE_GOOGLE;
        } catch (e) { return WO.SEARCH_MODE_GOOGLE; }
    })();
    WO.activeKeywordSearchQuery     = '';
    WO.selectedSuggestionIndex      = -1;
    WO.currentSuggestions           = [];
    WO.selectedKeywordSuggestionIndex = -1;
    WO.currentKeywordSuggestions    = [];

    // ─── Firestore Retry State ────────────────────────────────────────────────
    WO.retryAttempt = 0;
    WO.MAX_RETRIES  = 3;

})(window.WO);
