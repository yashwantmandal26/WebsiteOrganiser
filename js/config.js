// =============================================================================
// js/config.js — All Constants & Pure Configuration
// =============================================================================
// This file contains ONLY static data — no functions, no DOM access.
// Safe to edit without touching any logic.

const WO = window.WO || {};
window.WO = WO;

// ─── Default Groups (shown on first install) ──────────────────────────────────
WO.DEFAULT_GROUPS = [
    {
        "keywords": ["HdMovies2", "Netmirror", "hhdmovies.beauty", "MultiMovies", "moonflix.in"],
        "name": "Streaming_MovieSites"
    },
    {
        "keywords": ["https://katworld.net/", "world4ufree", "https://hdhub4u.gs/", "VEGAMOVIES", "ExtraMoviez", "UHDMovies"],
        "name": "Download_MovieSites"
    },
    {
        "keywords": ["Deadshot.io", "https://skribbl.io/", "Slither.io", "Surviv.io", "https://neal.fun/", "https://www.crazygames.com/game/stunt-paradise", "https://slowroads.io/"],
        "name": "Browser_Games"
    },
    {
        "name": "Popular Sites",
        "keywords": ["www.youtube.com", "https://www.flipkart.com/", "https://www.amazon.in/", "https://www.whatsapp.com/", "https://www.reddit.com/", "https://www.linkedin.com/", "https://www.facebook.com/"]
    },
    {
        "name": "Life_Hacks",
        "keywords": ["https://temp-mail.org/en/", "https://10015.io/"]
    },
    {
        "keywords": ["https://steamrip.com/", "Dodi-repacks", "fitgirl-repacks.site", "https://www.apunkagames.com/", "https://oceansofgamess.com/", "https://steamgg.net/"],
        "name": "PC_Game_Websites"
    }
];

// ─── Adult Content Blocklist ──────────────────────────────────────────────────
WO.BLOCKED_WORDS = [
    'porn', 'xxx', 'sex', 'nude', 'naked', 'adult', 'nsfw', 'hentai',
    'xvideos', 'pornhub', 'xnxx', 'xhamster', 'redtube', 'youporn',
    'brazzers', 'onlyfans', 'chaturbate', 'livejasmin', 'stripchat',
    'cam4', 'bongacams', 'myfreecams', 'fapello', 'thothub',
    'erotic', 'fetish', 'bondage', 'bdsm', 'milf', 'teen',
    'anal', 'blowjob', 'handjob', 'creampie', 'gangbang',
    'lesbian', 'gay', 'tranny', 'shemale', 'escort', 'hooker',
    'prostitute', 'camgirl', 'camboy', 'onlyfan', 'fansly'
];

// ─── Group Color Palette (20 vibrant colors) ──────────────────────────────────
WO.GROUP_COLORS = [
    '#FFE066', '#66D9D9', '#FF99C2', '#66E066', '#FF66B8', '#B399E6', '#66E6B3', '#FFD966', '#FF9966', '#6699FF',
    '#FF8080', '#66F0F0', '#FFB366', '#66C9FF', '#FF66B8', '#B3FF66', '#5AA6FF', '#FF66A3', '#B8FF66', '#66FFAA'
];

// ─── Keyword Gradient Palette (40 gradients for letter icons) ────────────────
WO.KEYWORD_GRADIENTS = [
    ['#ff0000', '#cc0000'], ['#00ff00', '#00cc00'], ['#0000ff', '#0000cc'], ['#ffff00', '#cccc00'],
    ['#ff00ff', '#cc00cc'], ['#00ffff', '#00cccc'], ['#ff6600', '#cc5200'], ['#6600ff', '#5200cc'],
    ['#00ff66', '#00cc52'], ['#ff0066', '#cc0052'], ['#66ff00', '#52cc00'], ['#0066ff', '#0052cc'],
    ['#ff3300', '#cc2900'], ['#00ffcc', '#00cca3'], ['#cc00ff', '#a300cc'], ['#ffcc00', '#cca300'],
    ['#00ff99', '#00cc7a'], ['#ff0099', '#cc007a'], ['#88ff00', '#6ecc00'], ['#0088ff', '#006ecc'],
    ['#ff3366', '#cc2952'], ['#00ccff', '#00a3cc'], ['#9900ff', '#7a00cc'], ['#ffaa00', '#cc8800'],
    ['#00ff33', '#00cc29'], ['#ff00cc', '#cc00a3'], ['#aaff00', '#88cc00'], ['#3300ff', '#2900cc'],
    ['#ff9900', '#cc7a00'], ['#00aaff', '#0088cc'], ['#ff6699', '#cc527a'], ['#33ff00', '#29cc00'],
    ['#8800ff', '#6e00cc'], ['#ffdd00', '#ccb100'], ['#0044ff', '#0036cc'], ['#ff5500', '#cc4400'],
    ['#00ff88', '#00cc6e'], ['#ff1100', '#cc0e00'], ['#ccff00', '#a3cc00'], ['#ff0033', '#cc0029']
];

// ─── Domain Display Name Map ──────────────────────────────────────────────────
WO.DOMAIN_DISPLAY_MAP = {
    'youtube.com': 'YouTube', 'www.youtube.com': 'YouTube',
    'facebook.com': 'Facebook', 'www.facebook.com': 'Facebook',
    'twitter.com': 'Twitter', 'www.twitter.com': 'Twitter',
    'instagram.com': 'Instagram', 'www.instagram.com': 'Instagram',
    'linkedin.com': 'LinkedIn', 'www.linkedin.com': 'LinkedIn',
    'github.com': 'GitHub', 'www.github.com': 'GitHub',
    'amazon.com': 'Amazon', 'www.amazon.com': 'Amazon',
    'google.com': 'Google', 'www.google.com': 'Google',
    'reddit.com': 'Reddit', 'www.reddit.com': 'Reddit',
    'x.com': 'X', 'www.x.com': 'X'
};

// ─── LocalStorage Keys ────────────────────────────────────────────────────────
WO.LOCAL_BACKUP_KEY      = 'websiteorganiser_data_backup_v1';
WO.LOCAL_GROUP_ORDER_KEY = 'websiteorganiser_group_order';
WO.THEME_STORAGE_KEY     = 'wo-theme';
WO.SEARCH_MODE_KEY       = 'websiteOrganiserSearchMode';
WO.SEARCH_HISTORY_KEY    = 'googleSearchHistory';

// ─── App Constants ────────────────────────────────────────────────────────────
WO.NEW_BADGE_DURATION_MS = 15 * 24 * 60 * 60 * 1000; // 15 days
WO.SEARCH_MODE_GOOGLE    = 'google';
WO.SEARCH_MODE_KEYWORDS  = 'keywords';
WO.MAX_HISTORY           = 10;
WO.MAX_SEARCH_RESULTS    = 12;
