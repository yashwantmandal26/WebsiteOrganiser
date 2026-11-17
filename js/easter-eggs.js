// =============================================================================
// js/easter-eggs.js — Easter Eggs for WebsiteOrganiser
// 1. Hacker Mode ("hack", "/hack")
//    - Cyberpunk terminal overlay with mechanical typing sounds & typewriter effect
//    - "ACCESS GRANTED: WELCOME CREATOR YASHWANT"
// 2. Floating Balloon Pop (Rare Random Event)
//    - Smooth floating balloon rising from bottom of viewport
//    - Click/tap to pop with pop sound, confetti explosion & secret toast
//    - Can also be triggered directly via "balloon" or "/balloon" in search
// =============================================================================

(function (WO) {
    'use strict';

    // ── Web Audio Synthesizer for Mechanical Keyboard & Pop Sound ─────────
    let _audioCtx = null;
    function getAudioCtx() {
        if (!_audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) _audioCtx = new AudioContextClass();
        }
        if (_audioCtx && _audioCtx.state === 'suspended') {
            _audioCtx.resume().catch(() => {});
        }
        return _audioCtx;
    }

    // Mechanical key-click sound synthesizer
    function playMechanicalKeySound() {
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const now = ctx.currentTime;

            // Primary click snap
            const snap = ctx.createOscillator();
            const snapGain = ctx.createGain();
            snap.type = 'triangle';
            snap.frequency.setValueAtTime(2400 + (Math.random() * 400 - 200), now);
            snap.frequency.exponentialRampToValueAtTime(300, now + 0.035);
            snapGain.gain.setValueAtTime(0.18, now);
            snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
            snap.connect(snapGain);
            snapGain.connect(ctx.destination);
            snap.start(now);
            snap.stop(now + 0.035);

            // Resonating mechanical clack body
            const clack = ctx.createOscillator();
            const clackGain = ctx.createGain();
            clack.type = 'sine';
            clack.frequency.setValueAtTime(450 + (Math.random() * 80 - 40), now);
            clack.frequency.exponentialRampToValueAtTime(120, now + 0.045);
            clackGain.gain.setValueAtTime(0.14, now);
            clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
            clack.connect(clackGain);
            clackGain.connect(ctx.destination);
            clack.start(now);
            clack.stop(now + 0.045);
        } catch (e) {}
    }

    // Success chime for Hacker Mode unlock
    function playAccessGrantedChime() {
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
            notes.forEach((freq, idx) => {
                const now = ctx.currentTime + idx * 0.09;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            });
        } catch (e) {}
    }

    // Balloon pop sound synthesizer
    function playPopSound() {
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) {}
    }

    // ── 1. HACKER MODE TERMINAL ───────────────────────────────────────────────
    let _terminalOverlay = null;
    let _typingTimers = [];

    const TERMINAL_LINES = [
        { text: '> INITIALIZING SYSTEM OVERRIDE...', speed: 28 },
        { text: '> SCANNING HOST MAINFRAME [127.0.0.1]... VERIFIED', speed: 20 },
        { text: '> BYPASSING SECURITY PROTOCOLS... [OK]', speed: 20 },
        { text: '> ACCESS GRANTED: WELCOME CREATOR YASHWANT 👑', speed: 32, highlight: true },
        { text: '> COFFEE LEVEL: 98% [████████████████░░]', speed: 18 },
        { text: '> ALL TILES & LINKS: FULLY CHARGED & OPERATIONAL 🚀', speed: 20 },
        { text: '> MASTER KEY: 0xYASHWANT_INFINITE_CREATOR_ACCESS', speed: 16 },
        { text: '> "In code we trust, by creativity we build."', speed: 24, italic: true },
        { text: '> [Press ESC or Click Anywhere to Exit]', speed: 10, prompt: true }
    ];

    function createTerminalDOM() {
        if (_terminalOverlay) return _terminalOverlay;
        const el = document.createElement('div');
        el.id = 'hacker-terminal-overlay';
        el.className = 'hacker-terminal-overlay';
        el.innerHTML = `
            <div class="hacker-terminal-scanlines"></div>
            <div class="hacker-terminal-window">
                <div class="hacker-terminal-header">
                    <div class="hacker-terminal-dots">
                        <span class="hacker-dot red"></span>
                        <span class="hacker-dot yellow"></span>
                        <span class="hacker-dot green"></span>
                    </div>
                    <div class="hacker-terminal-title">TERMINAL://root@websiteorganiser — OVERRIDE_v3.8</div>
                    <button type="button" class="hacker-terminal-close" aria-label="Close Terminal">[EXIT]</button>
                </div>
                <div class="hacker-terminal-body" id="hacker-terminal-body"></div>
            </div>
        `;
        document.body.appendChild(el);
        _terminalOverlay = el;

        const closeBtn = el.querySelector('.hacker-terminal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeHackerTerminal();
            });
        }

        el.addEventListener('click', (e) => {
            if (e.target.closest('.hacker-terminal-window') && !e.target.classList.contains('hacker-terminal-close')) {
                if (el.dataset.completed === 'true') closeHackerTerminal();
                return;
            }
            closeHackerTerminal();
        });

        return el;
    }

    function openHackerTerminal() {
        const overlay = createTerminalDOM();
        const body = overlay.querySelector('#hacker-terminal-body');
        if (!body) return;

        // Clear previous timers & content
        _typingTimers.forEach(t => clearTimeout(t));
        _typingTimers = [];
        body.innerHTML = '';
        overlay.dataset.completed = 'false';
        overlay.classList.add('is-active');
        document.body.classList.add('modal-open');

        let lineIndex = 0;

        function printNextLine() {
            if (lineIndex >= TERMINAL_LINES.length) {
                overlay.dataset.completed = 'true';
                playAccessGrantedChime();
                const cursor = document.createElement('span');
                cursor.className = 'hacker-terminal-cursor';
                cursor.textContent = '█';
                body.appendChild(cursor);
                return;
            }

            const lineData = TERMINAL_LINES[lineIndex];
            lineIndex++;

            const lineEl = document.createElement('div');
            lineEl.className = 'hacker-terminal-line' + 
                (lineData.highlight ? ' line-highlight' : '') + 
                (lineData.italic ? ' line-quote' : '') + 
                (lineData.prompt ? ' line-prompt' : '');
            body.appendChild(lineEl);

            let charIndex = 0;
            function typeChar() {
                if (charIndex < lineData.text.length) {
                    lineEl.textContent += lineData.text[charIndex];
                    charIndex++;
                    if (charIndex % 2 === 0) playMechanicalKeySound();
                    body.scrollTop = body.scrollHeight;
                    const timer = setTimeout(typeChar, lineData.speed || 20);
                    _typingTimers.push(timer);
                } else {
                    const lineDelayTimer = setTimeout(printNextLine, 180);
                    _typingTimers.push(lineDelayTimer);
                }
            }
            typeChar();
        }

        printNextLine();

        // Listen for ESC key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                document.removeEventListener('keydown', handleKeyDown);
                closeHackerTerminal();
            }
        };
        document.addEventListener('keydown', handleKeyDown, { once: true });
    }

    function closeHackerTerminal() {
        if (!_terminalOverlay) return;
        _typingTimers.forEach(t => clearTimeout(t));
        _typingTimers = [];
        _terminalOverlay.classList.remove('is-active');
        document.body.classList.remove('modal-open');
    }

    // ── 2. FLOATING BALLOON POP (RARE RANDOM EVENT) ──────────────────────────
    let _activeBalloon = null;

    function spawnBalloon() {
        if (_activeBalloon) return; // Only 1 active balloon at a time

        const balloon = document.createElement('div');
        balloon.id = 'easter-egg-balloon';
        balloon.className = 'easter-egg-balloon';
        balloon.setAttribute('role', 'button');
        balloon.setAttribute('tabindex', '0');
        balloon.setAttribute('title', '🎈 Pop me!');

        // Random horizontal position between 10% and 85%
        const leftPercent = Math.floor(Math.random() * 75) + 10;
        balloon.style.left = leftPercent + '%';

        // Vibrant color palettes for the balloon
        const palettes = [
            { main: '#ff2d55', light: '#ff758c', string: '#ffa8b8' },
            { main: '#7b2cbf', light: '#c77dff', string: '#e0aaff' },
            { main: '#00d2ff', light: '#70e1ff', string: '#a8f0ff' },
            { main: '#ff9f0a', light: '#ffd166', string: '#ffe5a3' },
            { main: '#30d158', light: '#80ed99', string: '#c7f9cc' }
        ];
        const chosen = palettes[Math.floor(Math.random() * palettes.length)];
        const gradId = 'balloon-grad-' + Math.floor(Math.random() * 100000);

        balloon.innerHTML = `
            <div class="balloon-wrapper">
                <svg viewBox="0 0 54 75" class="balloon-svg" width="54" height="75" aria-hidden="true">
                    <defs>
                        <radialGradient id="${gradId}" cx="35%" cy="30%" r="65%">
                            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
                            <stop offset="30%" stop-color="${chosen.light}" />
                            <stop offset="100%" stop-color="${chosen.main}" />
                        </radialGradient>
                    </defs>
                    <path d="M27 0 C12 0 0 13 0 28 C0 42 16 54 24 57 L23 60 L31 60 L30 57 C38 54 54 42 54 28 C54 13 42 0 27 0 Z" fill="url(#${gradId})" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.25))" />
                    <polygon points="27,57 23,61 31,61" fill="${chosen.main}" />
                    <path d="M27 61 Q23 67 29 71 T26 75" stroke="${chosen.string}" stroke-width="1.6" fill="none" stroke-linecap="round" />
                </svg>
                <div class="balloon-glare"></div>
            </div>
        `;

        document.body.appendChild(balloon);
        _activeBalloon = balloon;

        const pop = (e) => {
            e.stopPropagation();
            e.preventDefault();
            popBalloon(balloon, e);
        };

        balloon.addEventListener('click', pop);
        balloon.addEventListener('touchstart', pop, { passive: false });
        balloon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') pop(e);
        });

        // Auto remove when it finishes floating past the screen
        balloon.addEventListener('animationend', () => {
            if (balloon.parentNode) balloon.parentNode.removeChild(balloon);
            if (_activeBalloon === balloon) _activeBalloon = null;
        });
    }

    function popBalloon(balloon, event) {
        if (!balloon || balloon.dataset.popped === 'true') return;
        balloon.dataset.popped = 'true';

        playPopSound();
        if (navigator.vibrate) navigator.vibrate([30, 20, 60]);

        // Get coordinates for confetti burst
        const rect = balloon.getBoundingClientRect();
        const originX = event.clientX || (rect.left + rect.width / 2);
        const originY = event.clientY || (rect.top + rect.height / 2);

        // Pop visual animation
        balloon.classList.add('is-popped');

        // Confetti explosion
        triggerConfetti(originX, originY);

        // Secret Easter Egg Notification Toast
        const messages = [
            '🎈 Pop! +100 Secret Internet Points! ✨',
            '🎉 Yashwant\'s Secret Easter Egg Found! 🚀',
            '🎈 Pop! You found the hidden balloon! 🌟',
            '✨ Secret Unlocked: Sharp Reflexes Award! 🏆'
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];

        if (typeof window.showToast === 'function') {
            window.showToast(randomMsg, 3500);
        } else if (typeof WO.showToast === 'function') {
            WO.showToast(randomMsg, 'success');
        }

        setTimeout(() => {
            if (balloon.parentNode) balloon.parentNode.removeChild(balloon);
            if (_activeBalloon === balloon) _activeBalloon = null;
        }, 300);
    }

    // Lightweight Confetti Particles
    function triggerConfetti(x, y) {
        const colors = ['#ff2d55', '#4cd964', '#5ac8fa', '#007aff', '#ffcc00', '#ff9500', '#af52de'];
        const count = 36;
        const container = document.createElement('div');
        container.className = 'easter-egg-confetti-container';
        document.body.appendChild(container);

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'easter-egg-confetti-particle';
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
            const velocity = 80 + Math.random() * 120;
            const destX = Math.cos(angle) * velocity;
            const destY = Math.sin(angle) * velocity + 40; // slight gravity pull
            const rotation = Math.random() * 720 - 360;
            const size = 6 + Math.random() * 6;

            particle.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size * (Math.random() > 0.5 ? 1 : 1.6)}px;
                background-color: ${color};
                --dest-x: ${destX}px;
                --dest-y: ${destY}px;
                --dest-rot: ${rotation}deg;
            `;
            container.appendChild(particle);
        }

        setTimeout(() => {
            if (container.parentNode) container.parentNode.removeChild(container);
        }, 1200);
    }

    // ── Search Bar Easter Egg Interceptor & Suggestions ──────────────────────
    WO.getEasterEggSuggestion = function (query) {
        if (!query) return null;
        const q = query.trim().toLowerCase();

        if (q === '/hack' || q === 'hack' || q === '/matrix' || q === 'matrix') {
            return {
                isEasterEgg: true,
                command: '/hack',
                title: 'Hacker Terminal Override',
                description: 'Launch Cyberpunk CRT Terminal with Audio',
                icon: '💻'
            };
        }

        if (q === '/balloon' || q === 'balloon' || q === '/pop' || q === 'pop') {
            return {
                isEasterEgg: true,
                command: '/balloon',
                title: 'Floating Balloon Pop',
                description: 'Spawn a floating glowing balloon with confetti',
                icon: '🎈'
            };
        }

        return null;
    };

    WO.handleSearchEasterEgg = function (query) {
        if (!query) return false;
        const q = query.trim().toLowerCase();

        // 1. Hacker Mode
        if (q === 'hack' || q === '/hack' || q === 'matrix' || q === '/matrix') {
            openHackerTerminal();
            return true;
        }

        // 2. Balloon Pop trigger
        if (q === 'balloon' || q === '/balloon' || q === 'pop' || q === '/pop') {
            spawnBalloon();
            return true;
        }

        return false;
    };

    // ── Init & Auto-schedule Frequent Balloons ────────────────────────────────
    WO.initEasterEggs = function () {
        // Spawn first balloon quickly (2 seconds after load)
        setTimeout(() => {
            spawnBalloon();
        }, 2200);

        // Keep recurring frequently every 25 seconds
        setInterval(() => {
            if (!_activeBalloon && !document.getElementById('easter-egg-balloon')) {
                spawnBalloon();
            }
        }, 25000);
    };

    // Expose for testing
    WO.openHackerTerminal = openHackerTerminal;
    WO.spawnBalloon = spawnBalloon;

})(window.WO = window.WO || {});
