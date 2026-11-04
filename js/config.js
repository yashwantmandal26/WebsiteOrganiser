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
            "https://hicine.info/",
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
    "https%3A%2F%2Fhicine%2Einfo%2F": 8,
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
    "https%3A%2F%2Fnet52%2Ecc%2Fhome": "Free HD movies & web series streaming",
    "HdMovie2": "Stream Bollywood & Hollywood movies online",
    "cineby": "Clean streaming for movies & TV series",
    "https%3A%2F%2F4khdhub%2Efans%2F": "Ultra HD 4K & 1080p movies streaming",
    "Netmirror": "Netflix & OTT mirror streaming",
    "hhdmovies%2Ebeauty": "Hindi dubbed & dual audio streaming",
    "MultiMovies": "Multi-language movies & anime streaming",
    "moonflix": "Minimalist online movie streaming",
    "https%3A%2F%2Fwatchanimeworld%2Enet%2F": "Stream latest anime subbed & dubbed",
    "https%3A%2F%2Fmoviebox%2Eco%2F": "Trending movies & series streaming",
    "https%3A%2F%2Fstreamex%2Enet%2F": "Fast ad-free movies & series stream",
    "https%3A%2F%2Fcinema%2Ebz%2F": "Cinema movies & shows streaming",
    "https%3A%2F%2Fyarrlist%2Enet%2F": "Curated streaming sites & media directory",
    "https%3A%2F%2Fe%2Emkvking%2Edad%2F": "MKV quality movies & series stream",
    "https%3A%2F%2Fmegashare%2Ebio%2F": "Full-length movies & TV shows free",
    "https%3A%2F%2Fcinegram%2Etv%2Fhome": "Modern streaming for movies & TV",
    "https%3A%2F%2Fcinephile%2Elive%2F": "Curated movies & cinema streaming",
    "https%3A%2F%2Ftbcpl%2Elol%2F": "Stream latest movies & series",
    "https%3A%2F%2Fwww%2Ecinezo%2Enet%2F": "English movies & series streaming",
    "https%3A%2F%2Fwww%2Eflikhub%2Enet%2F": "HD movies & TV shows streaming",
    "https%3A%2F%2Farrowtv%2Enet%2F": "Watch popular TV shows & series",
    "https%3A%2F%2Fyenime%2Enet%2F": "Anime collection & streaming",
    "https%3A%2F%2Fstigstream%2Eru%2F": "Fast multi-server movie streaming",
    "https%3A%2F%2Fkartoons%2Eme%2Fhome": "Free Old & New Cartoons streaming",
    "https%3A%2F%2Fhdhub4u%2Emed%2F": "HD movies & web series downloads",
    "https%3A%2F%2Fkatworld%2Enet%2F": "Download Hindi dubbed & Dual Audio movies",
    "world4ufree": "Fast 300MB, 720p & 1080p movie downloads",
    "VEGAMOVIES": "Top dual audio & 4K movie downloads",
    "ExtraMovies": "Bollywood, Hollywood & dual audio downloads",
    "UHDMovies": "4K Ultra HD & 60fps movie downloads",
    "https%3A%2F%2Fhicine%2Einfo%2F": "Top rated HD movie downloads",
    "movies4u": "Latest Bollywood & Hollywood downloads",
    "https%3A%2F%2Fmkvcinemas%2Ead%2F": "MKV format movies & series downloads",
    "https%3A%2F%2Fmoviesrush%2Enet%2F": "Fast cloud links for movie downloads",
    "https%3A%2F%2Fmovieshb%2Ecom%2F": "Hindi movies & OTT series downloads",
    "https%3A%2F%2Fmoviesgum%2Ecom%2F": "Direct movie downloads & series",
    "https%3A%2F%2Fdownloadhub1%2Ecom%2F": "300MB & dual audio movie downloads",
    "Deadshot%2Eio": "Fast-paced online multiplayer FPS shooter",
    "https%3A%2F%2Fskribbl%2Eio%2F": "Multiplayer drawing & guessing game",
    "Slither%2Eio": "Multiplayer online snake battle arena",
    "Surviv%2Eio": "2D battle royale survival shooter",
    "https%3A%2F%2Fneal%2Efun%2F": "Fun creative games & web experiments",
    "https%3A%2F%2Fwww%2Ecrazygames%2Ecom%2Fgame%2Fstunt-paradise": "Extreme 3D car stunt driving game",
    "https%3A%2F%2Fslowroads%2Eio%2F": "Endless relaxing scenic driving game",
    "https%3A%2F%2Fdos%2Ezone%2F": "Play classic retro MS-DOS games online",
    "https%3A%2F%2Fbloob%2Eio": "Fun online board & party games",
    "https%3A%2F%2Fpoxel%2Eio%2F": "Voxel pixel 3D multiplayer shooter",
    "https%3A%2F%2Fpatatap%2Ecom%2F": "Visual sound & music synthesizer toy",
    "https%3A%2F%2Fankergames%2Enet%2F": "Play free instant browser games",
    "https%3A%2F%2Ftemp-mail%2Eorg%2Fen%2F": "Disposable temporary email for signups",
    "https%3A%2F%2Fwww%2Eguerrillamail%2Ecom%2F": "Instant disposable email inbox",
    "https%3A%2F%2F10015%2Eio%2F": "All-in-one free online tools suite",
    "https%3A%2F%2Fstealthwriter%2Eai%2F": "Humanize AI text & bypass detectors",
    "https%3A%2F%2Fapp%2Estealthwriter%2Eai%2Fdashboard": "StealthWriter AI text humanizer app",
    "https%3A%2F%2Fonlinesim%2Eio%2F": "Receive SMS online for virtual numbers",
    "https%3A%2F%2Fcobalt%2Etools%2F": "No-ad media downloader for YouTube & social",
    "https%3A%2F%2Fsobrief%2Ecom%2F": "10-minute book summaries audio & text",
    "https%3A%2F%2Fwww%2Edesidime%2Ecom%2F": "Best online shopping deals & coupons India",
    "https%3A%2F%2Fnextstep%2Etcsapps%2Ecom%2Findiacampus%2F%23%2Flogin": "TCS campus hiring & job portal",
    "https%3A%2F%2Fwww%2Etoolfk%2Ecom%2F": "Online developer tools & code converters",
    "https%3A%2F%2Fnullsto%2Eedu%2Epl%2F": "Web scripts, themes & dev resources",
    "https%3A%2F%2Ffcsnew%2Enet%2F": "Free paid courses & tutorials download",
    "https%3A%2F%2Fpostinbox%2Eorg%2F": "Temporary student & edu email generator",
    "https%3A%2F%2Fwww%2Eemailnator%2Ecom%2F": "Free temporary Gmail address service",
    "https%3A%2F%2Fwww%2Ecroxyproxy%2Ecom%2F": "Free reliable web proxy to unblock sites",
    "https%3A%2F%2Ffacecheck%2Eid%2F": "Facial recognition search engine to find people",
    "https%3A%2F%2Fgeminiwatermarkremover%2Eio%2F": "Remove watermarks from AI generated videos",
    "https%3A%2F%2Fchromewebstore%2Egoogle%2Ecom%2F": "Install useful Chromium browser extensions",
    "https%3A%2F%2Fsmailpro%2Ecom%2Ftemporary-email": "Temporary Gmail generator for OTP verification",
    "https%3A%2F%2Fsteamrip%2Ecom%2F": "Pre-installed direct download PC games",
    "Dodi-repacks": "Highly compressed PC game repacks",
    "fitgirl-repacks%2Esite": "Ultra-compressed repack PC games",
    "https%3A%2F%2Fwww%2Eapunkagames%2Ecom%2F": "Free PC games download highly compressed",
    "https%3A%2F%2Fsteamgg%2Enet%2F": "Direct link free Steam games download",
    "https%3A%2F%2Facid-play%2Ecom%2F": "Freeware & retro indie PC games",
    "https%3A%2F%2F7launcher%2Ecom%2Fgta-v%2F%3Flang%3Den": "GTA V free PC launcher & installer",
    "https%3A%2F%2Foceanofgames%2Ecom%2F": "Full version PC games download",
    "https%3A%2F%2Fdodi-repacks%2Esite%2F": "Official DODI PC game repacks site",
    "https%3A%2F%2Fromspure%2Ecc%2F": "Play & download classic console retro ROMs",
    "https%3A%2F%2Fwww%2Emoctale%2Ein%2Fexplore": "Movie & OTT recommendations discovery",
    "https%3A%2F%2Ffast%2Ecom%2F": "Instant internet speed test by Netflix",
    "https%3A%2F%2F4kwallpapers%2Ecom%2F": "Ultra HD 4K & 8K desktop wallpapers",
    "https%3A%2F%2Fwww%2Ecanva%2Ecom%2F": "Graphic design, posters & presentation tool",
    "https%3A%2F%2Fwww%2Efreepik%2Ecom%2Ffree-photos-vectors%2Fdesktop-wallpaper": "Free stock photos, vectors & wallpapers",
    "https%3A%2F%2Fhdqwalls%2Ecom%2F": "High definition 4K wallpapers collection",
    "https%3A%2F%2Fmoewalls%2Ecom%2F": "Free anime & live wallpapers for PC",
    "https%3A%2F%2Fwww%2Edesktophut%2Ecom%2F": "Free premium animated live wallpapers",
    "https%3A%2F%2Fwww%2Ecompressly%2Ein%2Fpinterest-image-downloader%2F": "Pinterest high quality image downloader",
    "www%2Eyoutube%2Ecom": "Watch videos, tutorials & live streams",
    "https%3A%2F%2Fwww%2Eflipkart%2Ecom%2F": "Online shopping for electronics, fashion & more",
    "https%3A%2F%2Fwww%2Eamazon%2Ein%2F": "Online shopping, fast delivery & deals",
    "https%3A%2F%2Fwww%2Ewhatsapp%2Ecom%2F": "Instant messaging & chat web app",
    "https%3A%2F%2Fwww%2Ereddit%2Ecom%2F": "Internet discussions, news & communities",
    "https%3A%2F%2Fwww%2Elinkedin%2Ecom%2F": "Professional networking & job search",
    "https%3A%2F%2Fwww%2Efacebook%2Ecom%2F": "Social networking & community connect",
    "https%3A%2F%2Fx%2Ecom%2Fhome": "Real-time news & microblogging platform",
    "https%3A%2F%2Fwww%2Einstagram%2Ecom%2F": "Photos, reels & video social network",
    "https%3A%2F%2Fweb%2Etelegram%2Eorg%2F": "Fast secure cloud messaging web app",
    "https%3A%2F%2Fdiscord%2Ecom%2Fchannels%2F%40me": "Voice, video & community chat for gamers",
    "https%3A%2F%2Fgithub%2Ecom%2F": "Developer code hosting & Git collaboration",
    "https%3A%2F%2Fmusic%2Eyoutube%2Ecom%2F": "Stream official songs, albums & playlists",
    "https%3A%2F%2Fwww%2Ehotstar%2Ecom%2Fin%2Fhome": "Live cricket, sports, movies & TV series",
    "https%3A%2F%2Fwww%2Ekaggle%2Ecom%2F": "Data science, ML datasets & competitions",
    "https%3A%2F%2Fwww%2Efigma%2Ecom%2F": "Collaborative UI/UX design & prototyping tool",
    "https%3A%2F%2Fsuno%2Ecom%2Fhome": "Generate full songs & music with AI",
    "https%3A%2F%2Fwww%2Ekimi%2Ecom%2F": "Long-context AI assistant & research",
    "https%3A%2F%2Fgemini%2Egoogle%2Ecom%2F": "Google's smart multimodal AI assistant",
    "https%3A%2F%2Fchatgpt%2Ecom%2F": "OpenAI's smart conversational AI assistant",
    "https%3A%2F%2Fgrok%2Ecom%2F": "xAI's conversational AI with real-time web info",
    "https%3A%2F%2Fchat%2Edeepseek%2Ecom%2F": "High-performance open-weight reasoning AI",
    "https%3A%2F%2Fperchance%2Eorg%2Fgenerators": "Free AI image, character & text generators",
    "https%3A%2F%2Fwww%2Etrae%2Eai%2F": "Adaptive AI code editor & coding assistant",
    "https%3A%2F%2Freplit%2Ecom%2F~": "Online coding IDE & AI app builder",
    "https%3A%2F%2Flovable%2Edev%2Fdashboard": "Build full-stack web apps with AI prompts",
    "https%3A%2F%2Farena%2Eai%2F": "Compare leading AI models head-to-head",
    "https%3A%2F%2Fchatgptfree%2Eai%2F": "Free ChatGPT access without login",
    "https%3A%2F%2Fnotegpt%2Eio%2F": "AI YouTube video summarizer & notes maker",
    "https%3A%2F%2Fapp%2Epixverse%2Eai%2Fhome": "Generate cinematic AI videos from text/image",
    "https%3A%2F%2Fgeminigen%2Eai%2Fapp%2Fvideo-gen%2Fgrok": "Fast AI video & animation generator",
    "https%3A%2F%2Fclaude%2Eai%2Fnew": "Anthropic's powerful reasoning & coding AI",
    "https%3A%2F%2Fwww%2Egenspark%2Eai%2F": "AI research search engine & summaries",
    "https%3A%2F%2Fhackerai%2Eco%2F": "AI cybersecurity & vulnerability scanner",
    "https%3A%2F%2Fapp%2Enotion%2Ecom%2Fai": "AI workspace notes, docs & task manager",
    "https%3A%2F%2Ffotoforensics%2Ecom%2F": "Detect digital image manipulation & edits",
    "https%3A%2F%2Fgroq%2Ecom%2F": "Ultra-fast LPU inference for AI models",
    "https%3A%2F%2Fgetintopc%2Ecom%2F": "Download PC software, 3D tools & operating systems",
    "https%3A%2F%2Ffilecr%2Ecom%2Fus-en%2F": "Direct downloads for PC software & tools",
    "https%3A%2F%2Fforum%2Emobilism%2Eme%2Fviewforum%2Ephp%3Ff%3D427%26sid%3Dd4c42799d9bd862a10e9696ab171117c": "Mobilism community PC software forum",
    "https%3A%2F%2Fwww%2Egta5-mods%2Ecom%2F": "Cars, scripts & graphics mods for GTA V",
    "https%3A%2F%2Fadescargar%2Enet%2F": "Cracked & modded apps direct download",
    "https%3A%2F%2Fwww%2Eoliveboard%2Ein%2F": "Banking, SSC & Govt exam test series",
    "https%3A%2F%2Ftestbook%2Ecom%2F": "Mock tests & courses for competitive exams",
    "https%3A%2F%2Fwww%2Epracticemock%2Ecom%2F": "Banking & regulatory exam practice mock tests",
    "https%3A%2F%2Fwww%2Esmartkeeda%2Ecom%2F": "Quality mock tests for Banking & SSC exams",
    "https%3A%2F%2Fguidely%2Ein%2F": "Bank PO, Clerk & SSC exam preparation portal",
    "https%3A%2F%2Fwww%2Eskills%2Egoogle%2F": "Free Google Cloud & digital skills courses",
    "www%2Eadda247%2Ecom": "Govt job preparation online classes & tests",
    "https%3A%2F%2Fveteranmocks%2Ein%2F": "Mock test series for competitive exams",
    "https%3A%2F%2Fwww%2Ehunyuanvideo%2Eorg%2Fen%2Fcreate": "Tencent's text-to-video AI generator",
    "https%3A%2F%2Fallgpt%2Ecom%2F": "Comprehensive directory of AI tools & GPTs",
    "https%3A%2F%2Fwww%2Eperplexity%2Eai%2F": "AI search engine with cited web sources",
    "https%3A%2F%2Fchat%2Eqwen%2Eai%2F": "Alibaba's advanced multilingual AI assistant",
    "https%3A%2F%2Fzty%2Epe%2F": "Space typing shooter game for typing speed",
    "https%3A%2F%2Fplay%2Etyperacer%2Ecom%2F": "Multiplayer competitive car racing typing game"
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

// ─── Card Color Palettes (Device-Only Custom Accent Palettes) ─────────────────
WO.CARD_PALETTES = {
    default: WO.GROUP_COLORS,
    vivid: [
        '#FF0055', '#00E5FF', '#FFE600', '#00FF66',
        '#AA00FF', '#FF6600', '#0066FF', '#FF00AA',
        '#00FFAA', '#FFB700', '#7700FF', '#00FF33'
    ],
    neon: [
        '#00F0FF', '#FF0077', '#39FF14', '#FFE600',
        '#BF00FF', '#FF3131', '#0FF0FC', '#FF5E00',
        '#7B00FF', '#00FFB2', '#FF00E6', '#CCFF00'
    ],
    pastel: [
        '#A8DADC', '#FFB4A2', '#B5E48C', '#E2ECE9',
        '#CDB4DB', '#FFC8DD', '#BDE0FE', '#A2D2FF',
        '#FDE2E4', '#D8E2DC', '#FFE5D9', '#D0F4DE'
    ],
    cyberpunk: [
        '#FFE600', '#FF0055', '#00F0FF', '#7600EC',
        '#00FF66', '#FF9900', '#D600FF', '#00FFFF',
        '#FF3366', '#33CCFF', '#99FF33', '#FF0033'
    ]
};

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

// ─── Direct Authentic Brand Icons ─────────────────────────────────────────────
// High-resolution local icons mapped by brand keyword or domain for authentic logo display
WO.BRAND_ICONS = {
    // Movies & Streaming
    'vegamovies': 'media/icons/vegamovies.png',
    'vegamovies.im': 'media/icons/vegamovies.png',
    'vegamovies.nl': 'media/icons/vegamovies.png',
    'vegamovies.yt': 'media/icons/vegamovies.png',

    'uhdmovies': 'media/icons/uhdmovies.png',
    'uhdmovies.org': 'media/icons/uhdmovies.png',
    'uhdmovies.vip': 'media/icons/uhdmovies.png',

    'hdhub4u': 'media/icons/hdhub4u.png',
    'hdhub4u.med': 'media/icons/hdhub4u.png',
    'hdhub4u.tv': 'media/icons/hdhub4u.png',

    'katworld': 'media/icons/katworld.png',
    'katworld.net': 'media/icons/katworld.png',

    'extramovies': 'media/icons/extramovies.png',
    'extramovies.shop': 'media/icons/extramovies.png',
    'extramovies.lat': 'media/icons/extramovies.png',

    'movies4u': 'media/icons/movies4u.png',
    'movies4u.vip': 'media/icons/movies4u.png',
    'movies4u.cc': 'media/icons/movies4u.png',

    'moviesgum': 'media/icons/moviesgum.png',
    'moviesgum.com': 'media/icons/moviesgum.png',

    'hicine': 'media/icons/hicine.png',
    'hicine.info': 'media/icons/hicine.png',

    'world4ufree': 'media/icons/world4ufree.png',
    'world4ufree.org': 'media/icons/world4ufree.png',

    'hdmovie2': 'media/icons/hdmovie2.png',
    'hdmovie2.rest': 'media/icons/hdmovie2.png',

    'cineby': 'media/icons/cineby.png',
    'cineby.app': 'media/icons/cineby.png',

    'netmirror': 'media/icons/netmirror.png',
    'netmirror.app': 'media/icons/netmirror.png',

    'multimovies': 'media/icons/multimovies.png',
    'multimovies.top': 'media/icons/multimovies.png',

    'moonflix': 'media/icons/moonflix.png',
    'moonflix.fun': 'media/icons/moonflix.png',

    // Gaming & Repacks
    'dodi-repacks': 'media/icons/dodi-repacks.png',
    'dodi': 'media/icons/dodi-repacks.png',
    'dodi-repacks.site': 'media/icons/dodi-repacks.png'
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
