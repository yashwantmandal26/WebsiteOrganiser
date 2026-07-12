const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const realErrors = [];

    page.on('pageerror', error => {
        const ignore = ['ServiceWorker', 'firebase', 'Firestore', 'ERR_ABORTED', 'googleapis'];
        if (!ignore.some(k => error.message.includes(k))) {
            realErrors.push(error.message);
        }
    });

    page.on('console', msg => {
        // Only flag actual JS errors, not 404 resource errors from 3rd party favicon fetches
        const text = msg.text();
        const ignore = ['favicon', 'gstatic', 'sw.js', 'Service Worker', 'serviceWorker', 'ERR_ABORTED',
                        'Firestore', 'firestore', 'Firebase', 'firebase', 'googleapis', 'manifest.json',
                        'dynamic-links', 'ERR_NETWORK', 'net::ERR', 'Failed to load resource'];
        if (msg.type() === 'error' && !ignore.some(k => text.includes(k))) {
            realErrors.push(text);
        }
    });

    console.log('🚀 Loading app via HTTP server...\n');
    await page.goto('http://localhost:9876/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));

    let allPassed = true;
    const check = (label, val) => {
        const ok = !!val;
        console.log(ok ? `  ✅ ${label}` : `  ❌ ${label}`);
        if (!ok) allPassed = false;
        return ok;
    };

    console.log('── Module Namespace ─────────────────────────────────────');
    await check('window.WO exists', await page.evaluate(() => typeof window.WO === 'object'));

    console.log('\n── Core Functions from each module ──────────────────────');
    const fns = {
        'config.js':        ['DEFAULT_GROUPS', 'BLOCKED_WORDS'],
        'state.js':         ['groups', 'adminLoggedIn', 'searchMode'],
        'utils.js':         ['escapeHtml', 'parseKeyword', 'normalizeSearchQuery', 'buildSearchSnippet'],
        'firebase-sync.js': ['loadGroups', 'saveGroups', 'syncAndSaveGroups', 'setupRealtimeSync'],
        'render.js':        ['renderGroups'],
        'crud.js':          ['addKeywordToGroup', 'deleteKeyword', 'saveNewKeyword', 'deleteGroup', 'openGroupModal'],
        'ui.js':            ['setTheme', 'toggleModal', 'openURLWithBrowser', 'updateAdminButton', 'initUI', 'playClickSound'],
        'search.js':        ['initSearch'],
        'app.js':           ['showLoading', 'hideLoading', 'resetKeywordStates'],
    };
    for (const [mod, keys] of Object.entries(fns)) {
        console.log(`\n  [${mod}]`);
        for (const k of keys) {
            const exists = await page.evaluate(k => window.WO[k] !== undefined, k);
            check(`  WO.${k}`, exists);
        }
    }

    console.log('\n── DOM Structure ────────────────────────────────────────');
    const domIds = ['groups-container', 'google-search-input', 'admin-btn', 'toast-container', 'loading-overlay'];
    for (const id of domIds) {
        await check(`#${id} in DOM`, await page.evaluate(id => !!document.getElementById(id), id));
    }

    console.log('\n── Runtime State ────────────────────────────────────────');
    await check('Theme applied to <html>', await page.evaluate(() => !!document.documentElement.dataset.theme));
    await check('WO.groups is an Array', await page.evaluate(() => Array.isArray(window.WO.groups)));
    await check('WO.DEFAULT_GROUPS.length > 0', await page.evaluate(() => window.WO.DEFAULT_GROUPS && window.WO.DEFAULT_GROUPS.length > 0));
    await check('searchMode is set', await page.evaluate(() => !!window.WO.searchMode));
    await check('adminLoggedIn is false (default)', await page.evaluate(() => window.WO.adminLoggedIn === false));

    console.log('\n── JS Errors ────────────────────────────────────────────');
    if (realErrors.length === 0) {
        console.log('  ✅ Zero JavaScript errors or exceptions');
    } else {
        allPassed = false;
        realErrors.forEach(e => console.log('  ❌ ' + e));
    }

    console.log('\n' + '─'.repeat(55));
    console.log(allPassed ? '🟢  ALL CHECKS PASSED — Module split is working correctly!' : '🔴  SOME CHECKS FAILED — See above.');

    await browser.close();
    process.exit(allPassed ? 0 : 1);
})();
