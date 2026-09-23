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
        "keywords": [
            "https://net52.cc/home",
            "HdMovie2",
            "cineby",
            "https://4khdhub.fans/",
            "Netmirror",
            "hhdmovies.beauty",
            "MultiMovies",
            "moonflix",
            "https://watchanimeworld.net/",
            "https://moviebox.co/",
            "https://streamex.net/",
            "https://cinema.bz/",
            "https://yarrlist.net/",
            "https://e.mkvking.dad/",
            "https://megashare.bio/",
            "https://cinegram.tv/home",
            "https://cinephile.live/",
            "https://tbcpl.lol/",
            "https://www.cinezo.net/",
            "https://www.flikhub.net/",
            "https://arrowtv.net/",
            "https://yenime.net/",
            "https://stigstream.ru/",
            "https://kartoons.me/home"
        ],
        "name": "WATCH MOVIES"
    },
    {
        "keywords": [
            "https://hdhub4u.med/",
            "https://katworld.net/",
            "world4ufree",
            "VEGAMOVIES",
            "ExtraMovies",
            "UHDMovies",
            "https://hicine.info/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjQ3NzM5MTYsImlhdCI6MTc2NDY4NzUxNiwidXNlciI6InZlcmlmaWVkX3ByZW1pdW1fYWNjZXNzIiwidmVyaWZpZWQiOnRydWUsInZlcmlmaWNhdGlvbl90aW1lIjoiMjAyNS0xMi0wMlQxNDo1ODozNi43MDRaIiwidmVyaWZpY2F0aW9uX2NvbXBsZXRlIjp0cnVlfQ.u-iqQFyZ-_b2GJ8yuIF6nWQjkM5-hzgB_qpyuEqIvuM&from=hicine&verified=true&verification_complete=true",
            "movies4u",
            "https://mkvcinemas.ad/",
            "https://moviesrush.net/",
            "https://movieshb.com/",
            "https://moviesgum.com/",
            "https://downloadhub1.com/"
        ],
        "name": "DOWNLOAD MOVIES"
    },
    {
        "name": "Instant BrowserGames",
        "keywords": [
            "Deadshot.io",
            "https://skribbl.io/",
            "Slither.io",
            "Surviv.io",
            "https://neal.fun/",
            "https://www.crazygames.com/game/stunt-paradise",
            "https://slowroads.io/",
            "https://dos.zone/",
            "https://bloob.io",
            "https://poxel.io/",
            "https://patatap.com/",
            "https://ankergames.net/"
        ]
    },
    {
        "name": "Life Hacks",
        "keywords": [
            "https://temp-mail.org/en/",
            "https://www.guerrillamail.com/",
            "https://10015.io/",
            "https://stealthwriter.ai/",
            "https://app.stealthwriter.ai/dashboard",
            "https://onlinesim.io/",
            "https://cobalt.tools/",
            "https://sobrief.com/",
            "https://www.desidime.com/",
            "https://nextstep.tcsapps.com/indiacampus/#/login",
            "https://www.toolfk.com/",
            "https://nullsto.edu.pl/",
            "https://fcsnew.net/",
            "https://postinbox.org/",
            "https://www.emailnator.com/",
            "https://www.croxyproxy.com/",
            "https://facecheck.id/",
            "https://geminiwatermarkremover.io/",
            "https://chromewebstore.google.com/",
            "https://smailpro.com/temporary-email"
        ]
    },
    {
        "keywords": [
            "https://steamrip.com/",
            "Dodi-repacks",
            "fitgirl-repacks.site",
            "https://www.apunkagames.com/",
            "https://steamgg.net/",
            "https://acid-play.com/",
            "https://7launcher.com/gta-v/?lang=en",
            "https://oceanofgames.com/",
            "https://dodi-repacks.site/",
            "https://romspure.cc/"
        ],
        "name": "PC DwdGamesWebsites"
    },
    {
        "keywords": [
            "https://www.moctale.in/explore",
            "https://fast.com/",
            "https://4kwallpapers.com/",
            "https://www.canva.com/",
            "https://www.freepik.com/free-photos-vectors/desktop-wallpaper",
            "https://hdqwalls.com/",
            "https://moewalls.com/",
            "https://www.desktophut.com/",
            "https://www.compressly.in/pinterest-image-downloader/"
        ],
        "name": "Utilities"
    },
    {
        "name": "PopularSites",
        "keywords": [
            "www.youtube.com",
            "https://www.flipkart.com/",
            "https://www.amazon.in/",
            "https://www.whatsapp.com/",
            "https://www.reddit.com/",
            "https://www.linkedin.com/",
            "https://www.facebook.com/",
            "https://x.com/home",
            "https://www.instagram.com/",
            "https://web.telegram.org/",
            "https://discord.com/channels/@me",
            "https://github.com/",
            "https://music.youtube.com/",
            "https://www.hotstar.com/in/home",
            "https://www.kaggle.com/",
            "https://www.figma.com/"
        ]
    },
    {
        "name": "Useful Ai",
        "keywords": [
            "https://suno.com/home",
            "https://www.kimi.com/",
            "https://gemini.google.com/",
            "https://chatgpt.com/",
            "https://grok.com/",
            "https://chat.deepseek.com/",
            "https://perchance.org/generators",
            "https://www.trae.ai/",
            "https://replit.com/~",
            "https://lovable.dev/dashboard",
            "https://arena.ai/",
            "https://chatgptfree.ai/",
            "https://notegpt.io/",
            "https://app.pixverse.ai/home",
            "https://geminigen.ai/app/video-gen/grok",
            "https://claude.ai/new",
            "https://www.genspark.ai/",
            "https://hackerai.co/",
            "https://app.notion.com/ai",
            "https://fotoforensics.com/",
            "https://groq.com/"
        ]
    },
    {
        "name": "Cracked PCsoftwareDwnD",
        "keywords": [
            "https://getintopc.com/",
            "https://filecr.com/us-en/",
            "https://forum.mobilism.me/viewforum.php?f=427&sid=d4c42799d9bd862a10e9696ab171117c",
            "https://www.gta5-mods.com/",
            "https://adescargar.net/"
        ]
    },
    {
        "keywords": [
            "https://www.oliveboard.in/",
            "https://testbook.com/",
            "https://www.practicemock.com/",
            "https://www.smartkeeda.com/",
            "https://guidely.in/",
            "https://www.skills.google/",
            "www.adda247.com",
            "https://veteranmocks.in/"
        ],
        "name": "Mocks and courses"
    },
    {
        "name": "Ai 2",
        "keywords": [
            "https://www.hunyuanvideo.org/en/create",
            "https://allgpt.com/",
            "https://www.perplexity.ai/",
            "https://chat.qwen.ai/"
        ]
    },
    {
        "name": "Skills Development with Fun",
        "keywords": [
            "https://zty.pe/",
            "https://play.typeracer.com/"
        ]
    }
];

// ─── Default Click Counts ───────────────────────────────────────────────────
WO.DEFAULT_CLICK_COUNTS = {
    "https%3A%2F%2Fwww%2Einstagram%2Ecom%2F": 2,
    "https%3A%2F%2Fhdqwalls%2Ecom%2F": 3,
    "movies4u": 8,
    "https%3A%2F%2Fmusic%2Eyoutube%2Ecom%2F": 2,
    "https%3A%2F%2Ffast%2Ecom%2F": 1,
    "https%3A%2F%2Fwww%2Ehotstar%2Ecom%2Fin%2Fhome": 3,
    "Netmirror": 2,
    "https%3A%2F%2Fe%2Emkvking%2Edad%2F": 6,
    "https%3A%2F%2Fstealthwriter%2Eai%2F": 2,
    "Surviv%2Eio": 1,
    "https%3A%2F%2Fskribbl%2Eio%2F": 1,
    "https%3A%2F%2Ffilecr%2Ecom%2Fus-en%2F": 1,
    "https%3A%2F%2Fchat%2Eqwen%2Eai%2F": 1,
    "https%3A%2F%2Fwatchanimeworld%2Enet%2F": 2,
    "https%3A%2F%2Fwww%2Ekaggle%2Ecom%2F": 3,
    "https%3A%2F%2Fforum%2Emobilism%2Eme%2Fviewforum%2Ephp%3Ff%3D427%26sid%3Dd4c42799d9bd862a10e9696ab171117c": 1,
    "world4ufree": 3,
    "https%3A%2F%2Ffcsnew%2Enet%2F": 2,
    "https%3A%2F%2F7launcher%2Ecom%2Fgta-v%2F%3Flang%3Den": 2,
    "https%3A%2F%2Fchatgpt%2Ecom%2F": 3,
    "https%3A%2F%2Fmoviebox%2Eco%2F": 5,
    "Deadshot%2Eio": 4,
    "https%3A%2F%2Fkartoons%2Eme%2Fhome": 1,
    "https%3A%2F%2Fslowroads%2Eio%2F": 2,
    "hhdmovies%2Ebeauty": 4,
    "https%3A%2F%2Fyarrlist%2Enet%2F": 1,
    "https%3A%2F%2Fhdhub4u%2Emed%2F": 107,
    "https%3A%2F%2Fwww%2Emoctale%2Ein%2Fexplore": 1,
    "ExtraMovies": 4,
    "https%3A%2F%2Fwww%2Egta5-mods%2Ecom%2F": 1,
    "https%3A%2F%2Fcinegram%2Etv%2Fhome": 9,
    "cineby": 10,
    "https%3A%2F%2Fwww%2Ehunyuanvideo%2Eorg%2Fen%2Fcreate": 2,
    "VEGAMOVIES": 26,
    "https%3A%2F%2Fcinema%2Ebz%2F": 12,
    "https%3A%2F%2Fzty%2Epe%2F": 1,
    "https%3A%2F%2Fwww%2Efreepik%2Ecom%2Ffree-photos-vectors%2Fdesktop-wallpaper": 1,
    "https%3A%2F%2Fwww%2Eapunkagames%2Ecom%2F": 1,
    "MultiMovies": 14,
    "https%3A%2F%2Fkatworld%2Enet%2F": 56,
    "https%3A%2F%2Fpoxel%2Eio%2F": 1,
    "https%3A%2F%2Fmkvcinemas%2Ead%2F": 4,
    "https%3A%2F%2Ftbcpl%2Elol%2F": 2,
    "https%3A%2F%2Fapp%2Epixverse%2Eai%2Fhome": 2,
    "https%3A%2F%2Fpostinbox%2Eorg%2F": 1,
    "https%3A%2F%2Fhicine%2Einfo%2F%3Ftoken%3DeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9%2EeyJleHAiOjE3NjQ3NzM5MTYsImlhdCI6MTc2NDY4NzUxNiwidXNlciI6InZlcmlmaWVkX3ByZW1pdW1fYWNjZXNzIiwidmVyaWZpZWQiOnRydWUsInZlcmlmaWNhdGlvbl90aW1lIjoiMjAyNS0xMi0wMlQxNDo1ODozNi43MDRaIiwidmVyaWZpY2F0aW9uX2NvbXBsZXRlIjp0cnVlfQ%2Eu-iqQFyZ-_b2GJ8yuIF6nWQjkM5-hzgB_qpyuEqIvuM%26from%3Dhicine%26verified%3Dtrue%26verification_complete%3Dtrue": 8,
    "https%3A%2F%2F4khdhub%2Efans%2F": 7,
    "https%3A%2F%2Fwww%2Eguerrillamail%2Ecom%2F": 1,
    "https%3A%2F%2Fmoviesgum%2Ecom%2F": 5,
    "https%3A%2F%2Fbloob%2Eio": 3,
    "Dodi-repacks": 2,
    "HdMovie2": 30,
    "fitgirl-repacks%2Esite": 2,
    "www%2Eyoutube%2Ecom": 11,
    "UHDMovies": 30,
    "https%3A%2F%2Fapp%2Enotion%2Ecom%2Fai": 1,
    "https%3A%2F%2Fwww%2Eflikhub%2Enet%2F": 2,
    "https%3A%2F%2Farrowtv%2Enet%2F": 2,
    "https%3A%2F%2Fgetintopc%2Ecom%2F": 1,
    "https%3A%2F%2Fapp%2Estealthwriter%2Eai%2Fdashboard": 1,
    "Slither%2Eio": 1,
    "https%3A%2F%2Fdodi-repacks%2Esite%2F": 1,
    "https%3A%2F%2Foceanofgames%2Ecom%2F": 1,
    "https%3A%2F%2Fcinephile%2Elive%2F": 7,
    "https%3A%2F%2Fmoewalls%2Ecom%2F": 1,
    "https%3A%2F%2Fnet52%2Ecc%2Fhome": 19,
    "https%3A%2F%2Fmoviesrush%2Enet%2F": 3,
    "https%3A%2F%2Fwww%2Eskills%2Egoogle%2F": 1,
    "https%3A%2F%2Fwww%2Edesktophut%2Ecom%2F": 1,
    "https%3A%2F%2Fstreamex%2Enet%2F": 2,
    "https%3A%2F%2F4kwallpapers%2Ecom%2F": 3,
    "https%3A%2F%2Fwww%2Eflipkart%2Ecom%2F": 3,
    "https%3A%2F%2Ffotoforensics%2Ecom%2F": 1,
    "https%3A%2F%2Fmegashare%2Ebio%2F": 3,
    "chrome%3A%2F%2Fflags%2F": 5,
    "https%3A%2F%2Fgemini%2Egoogle%2Ecom%2F": 3,
    "https%3A%2F%2Fwww%2Eperplexity%2Eai%2F": 1,
    "https%3A%2F%2Fmovieshb%2Ecom%2F": 5,
    "https%3A%2F%2Fdownloadhub1%2Ecom%2F": 10,
    "moonflix": 1
};

// ─── Default Keyword Descriptions ───────────────────────────────────────────
WO.DEFAULT_KEYWORD_DESCRIPTIONS = {
    "https%3A%2F%2Fwww%2Ecompressly%2Ein%2Fpinterest-image-downloader%2F": "Pinterest high quality downloader",
    "https%3A%2F%2Fsmailpro%2Ecom%2Ftemporary-email": "Temporary Gmail generator for otp",
    "chrome%3A%2F%2Fflags%2F": "for broswe's extra features yyyy",
    "https%3A%2F%2Farrowtv%2Enet%2F": "Englishhh",
    "https%3A%2F%2Fkartoons%2Eme%2Fhome": "Free Old New Cartoons",
    "https%3A%2F%2Fwww%2Edesktophut%2Ecom%2F": "Free premium wallpaper for pc phone",
    "https%3A%2F%2Fwww%2Efigma%2Ecom%2F": "Design and develop websites",
    "https%3A%2F%2Fwww%2Ehunyuanvideo%2Eorg%2Fen%2Fcreate": "Generate text to video free and quickly",
    "https%3A%2F%2Fwww%2Ecinezo%2Enet%2F": "English language",
    "https%3A%2F%2Fromspure%2Ecc%2F": "Play old pc games",
    "https%3A%2F%2Fzty%2Epe%2F": "typing shooter game for improving typing speed",
    "https%3A%2F%2Fchat%2Edeepseek%2Ecom%2F": "deepseek",
    "https%3A%2F%2Fhdhub4u%2Emed%2F": "moviee",
    "https%3A%2F%2Fwww%2Ecroxyproxy%2Ecom%2F": "Access any websites",
    "https%3A%2F%2Ffacecheck%2Eid%2F": "Find people online",
    "https%3A%2F%2Ftbcpl%2Elol%2F": "Steam all movies",
    "www%2Eyoutube%2Ecom": "yt",
    "https%3A%2F%2Fpostinbox%2Eorg%2F": "any temp mail edu",
    "https%3A%2F%2Ffotoforensics%2Ecom%2F": "To detect Ai manipulated image",
    "https%3A%2F%2Fgroq%2Ecom%2F": "free tier Ai llm",
    "https%3A%2F%2Fyenime%2Enet%2F": "Anime collection",
    "https%3A%2F%2Fchromewebstore%2Egoogle%2Ecom%2F": "install useful chromium Extensions",
    "https%3A%2F%2Fhicine%2Einfo%2F%3Ftoken%3DeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9%2EeyJleHAiOjE3NjQ3NzM5MTYsImlhdCI6MTc2NDY4NzUxNiwidXNlciI6InZlcmlmaWVkX3ByZW1pdW1fYWNjZXNzIiwidmVyaWZpZWQiOnRydWUsInZlcmlmaWNhdGlvbl90aW1lIjoiMjAyNS0xMi0wMlQxNDo1ODozNi43MDRaIiwidmVyaWZpY2F0aW9uX2NvbXBsZXRlIjp0cnVlfQ%2Eu-iqQFyZ-_b2GJ8yuIF6nWQjkM5-hzgB_qpyuEqIvuM%26from%3Dhicine%26verified%3Dtrue%26verification_complete%3Dtrue": "THE BESST",
    "https%3A%2F%2Fplay%2Etyperacer%2Ecom%2F": "compete with friends typing Game",
    "https%3A%2F%2Fadescargar%2Enet%2F": "Any cracked modded apps to download",
    "https%3A%2F%2Fwww%2Eflikhub%2Enet%2F": "English",
    "https%3A%2F%2Fgeminiwatermarkremover%2Eio%2F": "Remove watermarks from gemini video"
};

// ─── Default Keyword Added Timestamps ───────────────────────────────────────
WO.DEFAULT_KEYWORD_ADDED_AT = {
    "https%3A%2F%2Fcinephile%2Elive%2F": 1783628536491,
    "chrome%3A%2F%2Fflags%2F": 1782835640512,
    "https%3A%2F%2Ffotoforensics%2Ecom%2F": 1783628579547,
    "https%3A%2F%2Fplay%2Etyperacer%2Ecom%2F": 1785328126842,
    "https%3A%2F%2Fwww%2Ehunyuanvideo%2Eorg%2Fen%2Fcreate": 1783628725153,
    "https%3A%2F%2Fromspure%2Ecc%2F": 1783744357574,
    "https%3A%2F%2Fankergames%2Enet%2F": 1783628640658,
    "https%3A%2F%2Farrowtv%2Enet%2F": 1784004583652,
    "https%3A%2F%2Fwww%2Ecompressly%2Ein%2Fpinterest-image-downloader%2F": 1786995689798,
    "https%3A%2F%2Fwww%2Eflikhub%2Enet%2F": 1784004512414,
    "https%3A%2F%2Fallgpt%2Ecom%2F": 1783700920828,
    "https%3A%2F%2Fwww%2Ekaggle%2Ecom%2F": 1783700982071,
    "https%3A%2F%2Fpostinbox%2Eorg%2F": 1783544305182,
    "https%3A%2F%2Fstigstream%2Eru%2F": 1785602326523,
    "https%3A%2F%2Fwww%2Ecinezo%2Enet%2F": 1784004375475,
    "uih4": 1784059112273,
    "https%3A%2F%2Fsmailpro%2Ecom%2Ftemporary-email": 1787131155425,
    "https%3A%2F%2Fcinegram%2Etv%2Fhome": 1783628429786,
    "https%3A%2F%2Fkartoons%2Eme%2Fhome": 1786901313441,
    "Yuy": 1784059139874,
    "https%3A%2F%2Fgeminiwatermarkremover%2Eio%2F": 1783744416995,
    "https%3A%2F%2Ffacecheck%2Eid%2F": 1783744305102,
    "https%3A%2F%2Fgroq%2Ecom%2F": 1784294465188,
    "https%3A%2F%2Fwww%2Ecroxyproxy%2Ecom%2F": 1783744251916,
    "jjjh": 1784059115446,
    "https%3A%2F%2Fwww%2Efigma%2Ecom%2F": 1784777875155,
    "https%3A%2F%2Fchromewebstore%2Egoogle%2Ecom%2F": 1785257834663,
    "https%3A%2F%2Fwww%2Eperplexity%2Eai%2F": 1785305718616,
    "https%3A%2F%2Fadescargar%2Enet%2F": 1783628624327,
    "https%3A%2F%2Ftbcpl%2Elol%2F": 1783628667788,
    "https%3A%2F%2Fzty%2Epe%2F": 1785327993874,
    "https%3A%2F%2Fapp%2Enotion%2Ecom%2Fai": 1782760903828,
    "https%3A%2F%2Fwww%2Eemailnator%2Ecom%2F": 1783701014459,
    "https%3A%2F%2Fwww%2Edesktophut%2Ecom%2F": 1783628476815,
    "https%3A%2F%2Fyenime%2Enet%2F": 1784004633253,
    "https%3A%2F%2Fchat%2Eqwen%2Eai%2F": 1788591199651
};

// ─── Authorized Admin Accounts ────────────────────────────────────────────────
WO.ADMIN_EMAILS = [
    'dashbot2001@gmail.com'
];

// ─── Adult Content Blocklist ──────────────────────────────────────────────────
// Distinct domain/compound patterns vs whole-word terms to avoid false positives (e.g. "analytics")
WO.BLOCKED_PATTERNS = [
    'xvideos', 'pornhub', 'xnxx', 'xhamster', 'redtube', 'youporn',
    'brazzers', 'onlyfans', 'chaturbate', 'livejasmin', 'stripchat',
    'cam4', 'bongacams', 'myfreecams', 'fapello', 'thothub',
    'onlyfan', 'fansly'
];

WO.BLOCKED_WORDS = [
    'porn', 'xxx', 'sex', 'nude', 'naked', 'nsfw', 'hentai',
    'erotic', 'fetish', 'bondage', 'bdsm', 'milf',
    'anal', 'blowjob', 'handjob', 'creampie', 'gangbang',
    'tranny', 'shemale', 'escort', 'hooker',
    'prostitute', 'camgirl', 'camboy'
];

// ─── Group Color Palette (24 maximally distinct, high-contrast colors) ────────
WO.GROUP_COLORS = [
    '#FFE642', //  0. Canary Yellow      (52°)
    '#47B5FF', //  1. Azure Sky Blue     (204°)
    '#FF5C67', //  2. Coral Red          (356°)
    '#A3FF3B', //  3. Electric Lime      (88°)
    '#BD6BFF', //  4. Vivid Purple       (273°)
    '#FF9E42', //  5. Tangerine Orange   (29°)
    '#3BFFFF', //  6. Electric Cyan      (180°)
    '#FF57B8', //  7. Hot Fuchsia Pink   (325°)
    '#3DFF94', //  8. Emerald Green      (147°)
    '#FFC43B', //  9. Golden Amber       (42°)
    '#7A7AFF', // 10. Royal Indigo       (240°)
    '#FA5CFA', // 11. Electric Magenta   (300°)
    '#D1FF3B', // 12. Bright Chartreuse  (74°)
    '#4293FF', // 13. Deep Sky Blue      (214°)
    '#FF578C', // 14. Crimson Rose       (341°)
    '#3DFFCE', // 15. Seafoam Mint       (164°)
    '#9B5CFF', // 16. Deep Violet        (263°)
    '#FF7D52', // 17. Bright Peach       (15°)
    '#3DDCFF', // 18. Aquamarine         (191°)
    '#FF5CDC', // 19. Neon Bubblegum     (312°)
    '#3DFF57', // 20. Spring Green       (128°)
    '#FFD43B', // 21. Sun Gold           (46°)
    '#6B82FF', // 22. Cobalt Blue        (231°)
    '#FF6152'  // 23. Ruby Scarlet       (5°)
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
WO.LOCAL_USAGE_KEY       = 'websiteorganiser_personal_usage_v1';
WO.THEME_STORAGE_KEY     = 'wo-theme';
WO.SEARCH_MODE_KEY       = 'websiteOrganiserSearchMode';
WO.SEARCH_HISTORY_KEY    = 'googleSearchHistory';

// ─── App Constants ────────────────────────────────────────────────────────────
WO.NEW_BADGE_DURATION_MS = 15 * 24 * 60 * 60 * 1000; // 15 days
WO.SEARCH_MODE_GOOGLE    = 'google';
WO.SEARCH_MODE_KEYWORDS  = 'keywords';
WO.MAX_HISTORY           = 10;
WO.MAX_SEARCH_RESULTS    = 12;
