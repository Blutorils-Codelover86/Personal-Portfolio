/* ═══════════════════════════════════════════════════════
   ZERO_CLOCK PORTFOLIO ENGINE — TOYOTA MR2 STYLE REDESIGN
   Controls: Web Audio Synthesizer, Typography Typewriter,
             Coupon forms, and Editorial Scroll Triggers.
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ── AUDIO SYSTEM STATE ── */
    let soundFXActive = true;
    let tapeHissActive = false;
    let typeIdx = 0;
    let typeTimer = null;

    /* ── ELEMENTS ── */
    const btnSynthToggle = document.getElementById('btn-synth-toggle');
    const btnSoundMute = document.getElementById('btn-sound-mute');
    const txSubmit = document.getElementById('tx-submit');
    const txStatus = document.getElementById('tx-status');
    const vcrTimeEl = document.getElementById('vcr-time');
    const themeToggle = document.getElementById('theme-toggle');

    // Target the theme switch element
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Check localStorage for an existing user theme preference
    const currentTheme = localStorage.getItem('theme');

    // If a preference exists in history, apply it immediately
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // Add click listener to perform the swap
    themeToggleBtn.addEventListener('click', () => {
        // Toggle the dark-theme class on the body tag
        document.body.classList.toggle('dark-theme');

        // Determine the current state to save it locally
        let theme = 'light';
        if (document.body.classList.contains('dark-theme')) {
            theme = 'dark';
        }

        // Save preference to localStorage so it stays on page reload
        localStorage.setItem('theme', theme);
    });

    /* ── WEB AUDIO SYNTH ENGINE ── */
    let ctx = null;
    let tapeHissSource = null;
    let tapeHissGain = null;

    function initAudio() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
    }

    // Hook user interactions to satisfy browser autoplay requirements
    const enableAudioContext = () => {
        initAudio();
        document.removeEventListener('click', enableAudioContext);
        document.removeEventListener('keydown', enableAudioContext);
    };
    document.addEventListener('click', enableAudioContext);
    document.addEventListener('keydown', enableAudioContext);

    // Play retro synth sound effects programmatically
    function synthBeep(freq1, freq2, duration, volume = 0.02, type = 'sine') {
        if (!soundFXActive) return;
        try {
            initAudio();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.type = type;
            osc.frequency.setValueAtTime(freq1, ctx.currentTime);
            if (freq2) {
                osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + duration);
            }

            gainNode.gain.setValueAtTime(volume, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.start();
            osc.stop(ctx.currentTime + duration + 0.01);
        } catch (e) {
            console.warn("Web Audio API not supported.", e);
        }
    }

    const playTick = () => synthBeep(1100, 500, 0.035, 0.012, 'triangle');
    const playClick = () => synthBeep(650, 120, 0.07, 0.022, 'sine');
    const playGlitchSound = () => synthBeep(180, 1400, 0.2, 0.012, 'sawtooth');

    function playCompletionChime() {
        if (!soundFXActive) return;
        try {
            initAudio();
            const now = ctx.currentTime;
            // Arpeggiated nostalgic digital chime chord
            [261.63, 329.63, 392.00, 493.88].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.02, now + idx * 0.06 + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.35);
            });
        } catch (e) { }
    }

    /* ── BACKGROUND TAPE HUM NOISE ── */
    function startTapeHiss() {
        try {
            initAudio();
            if (tapeHissSource) return;

            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const lowpass = ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 5500;

            const highpass = ctx.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 500;

            tapeHissSource = ctx.createBufferSource();
            tapeHissSource.buffer = noiseBuffer;
            tapeHissSource.loop = true;

            tapeHissGain = ctx.createGain();
            tapeHissGain.gain.value = 0.004; // low, subtle ambient noise

            tapeHissSource.connect(lowpass);
            lowpass.connect(highpass);
            highpass.connect(tapeHissGain);
            tapeHissGain.connect(ctx.destination);

            tapeHissSource.start(0);
        } catch (e) { }
    }

    function stopTapeHiss() {
        if (tapeHissSource) {
            try {
                tapeHissSource.stop();
                tapeHissSource.disconnect();
            } catch (e) { }
            tapeHissSource = null;
            tapeHissGain = null;
        }
    }

    /* ── AUDIO PANEL SWITCHES ── */
    if (btnSynthToggle) {
        btnSynthToggle.addEventListener('click', () => {
            initAudio();
            tapeHissActive = !tapeHissActive;
            if (tapeHissActive) {
                startTapeHiss();
                btnSynthToggle.classList.add('active');
                playCompletionChime();
            } else {
                stopTapeHiss();
                btnSynthToggle.classList.remove('active');
                playClick();
            }
        });
    }

    if (btnSoundMute) {
        btnSoundMute.addEventListener('click', () => {
            soundFXActive = !soundFXActive;
            if (soundFXActive) {
                btnSoundMute.classList.remove('active');
                playCompletionChime();
            } else {
                btnSoundMute.classList.add('active');
            }
        });
    }

    /* ── REAL-TIME CLOCK SYNC ── */
    function updateClock() {
        const now = new Date();
        const months = ["JAN.", "FEB.", "MAR.", "APR.", "MAY", "JUN.", "JUL.", "AUG.", "SEP.", "OCT.", "NOV.", "DEC."];
        const month = months[now.getMonth()];
        const day = String(now.getDate()).padStart(2, '0');
        const year = now.getFullYear();
        const hrs = now.getHours();
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        const displayHour = String(hrs % 12 || 12).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');

        if (vcrTimeEl) {
            vcrTimeEl.textContent = `${month} ${day} ${year} ${ampm} ${displayHour}:${mins}:${secs}`;
        }
    }
    updateClock();
    setInterval(updateClock, 1000);

    /* ── NAVIGATION ANCHOR HIGHLIGHT OVERRIDES ── */
    const navAnchors = document.querySelectorAll('.nav-anchor');
    const sections = document.querySelectorAll('.ad-section');

    navAnchors.forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href').replace('#', '');
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                // Highlight section
                sections.forEach(s => s.classList.remove('highlighted'));
                targetSection.classList.add('highlighted');
                setTimeout(() => targetSection.classList.remove('highlighted'), 1000);

                // Smooth scroll
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

                playGlitchSound();
            }
        });
    });

    /* ── TYPEWRITER TEXT ENGINE ── */
    const BIO_TEXT = "MEET THE NEW GENERATION! Zero_Clock is a creative software engineer building next-gen web applications, real-time interactive shaders, and custom high-fidelity digital systems. Scroll the interface and use the remote hotkeys above to navigate. Call in your request today!";

    function runTypewriter() {
        const typewriterEl = document.getElementById('typewriter');
        if (!typewriterEl) return;

        typewriterEl.textContent = '';
        typeIdx = 0;
        clearInterval(typeTimer);

        typeTimer = setInterval(() => {
            if (typeIdx < BIO_TEXT.length) {
                typewriterEl.textContent += BIO_TEXT[typeIdx++];
                if (typeIdx % 4 === 0) playTick();
            } else {
                clearInterval(typeTimer);
            }
        }, 20);
    }
    runTypewriter();

    /* ── CONTACT COUPON TRANSMITTER ── */
    if (txSubmit) {
        txSubmit.addEventListener('click', () => {
            const name = document.getElementById('tx-name').value.trim();
            const email = document.getElementById('tx-email').value.trim();
            const msg = document.getElementById('tx-msg').value.trim();

            if (!name || !msg) {
                playGlitchSound();
                txStatus.style.color = 'var(--c-sun-red)';
                txStatus.textContent = '⚠ ERROR: EMPTY FIELDS';
                return;
            }

            playClick();
            txStatus.style.color = 'var(--c-sun-orange)';
            txStatus.textContent = 'CONNECTING CYBER-NET DOWNLINK... [20%]';

            setTimeout(() => {
                txStatus.textContent = 'ENCRYPTING PACKET TRANSMISSION... [65%]';
                playTick();
            }, 700);

            setTimeout(() => {
                txStatus.textContent = 'TRANSMISSION COMPLETE! ✓ RECORDED IN SPECS';
                txStatus.style.color = 'var(--c-dark)';
                playCompletionChime();

                // Reset fields
                document.getElementById('tx-name').value = '';
                document.getElementById('tx-email').value = '';
                document.getElementById('tx-msg').value = '';
            }, 1700);
        });
    }

    /* ── HOVER FEEDBACK TRIGGER ── */
    function bindTactileSounds() {
        const targets = document.querySelectorAll('.nav-anchor, button, a, input, textarea, .achv-row, .ambition-card');
        targets.forEach(t => {
            if (t._beepBound) return;
            t._beepBound = true;
            t.addEventListener('mouseenter', () => {
                playTick();
            });
        });
    }

    bindTactileSounds();
    setInterval(bindTactileSounds, 3000);

});


