/* ==========================================================================
   PORTFOLIO ENGINE — Walkman × CRT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* --- STATE --- */
    let audioEnabled = false;
    let powerState = true;
    let brightLevel = 0;    // 0=100% 1=70% 2=40%
    let themeIndex = 0;    // 0=default 1=green 2=amber

    const THEMES = ["", "theme-green", "theme-amber"];

    /* --- DOM --- */
    const body = document.body;
    const screenRegion = document.querySelector(".crt-screen-region");
    const screenUI = document.getElementById("screen-ui");
    const uptimeEl = document.getElementById("wm-uptime");
    const dateEl = document.getElementById("wm-date");
    const txForm = document.getElementById("transmitter-form");
    const txLog = document.getElementById("tx-log");
    const txBtn = document.getElementById("tx-btn");

    /* --- AUDIO --- */
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
    }

    function tone(freq1, freq2, dur, vol = 0.02, type = "sine") {
        if (!audioEnabled) return;
        try {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(freq1, audioCtx.currentTime);
            if (freq2) osc.frequency.exponentialRampToValueAtTime(freq2, audioCtx.currentTime + dur);
            gain.gain.setValueAtTime(vol, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + dur + 0.01);
        } catch (e) { }
    }

    const playTick = () => tone(1400, 900, 0.03, 0.015);
    const playClick = () => tone(700, 150, 0.06, 0.03);
    const playDial = () => tone(350, 650, 0.08, 0.02);
    const playChime = () => {
        if (!audioEnabled) return;
        try {
            initAudio();
            const now = audioCtx.currentTime;
            [523.25, 659.25, 783.99].forEach((f, i) => {
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.connect(g); g.connect(audioCtx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(f, now + i * 0.06);
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.018, now + i * 0.06 + 0.01);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);
                osc.start(now + i * 0.06);
                osc.stop(now + i * 0.06 + 0.2);
            });
        } catch (e) { }
    };
    const playPower = () => {
        try {
            const prev = audioEnabled; audioEnabled = true; initAudio();
            const now = audioCtx.currentTime;
            const o1 = audioCtx.createOscillator();
            const o2 = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o1.connect(g); o2.connect(g); g.connect(audioCtx.destination);
            o1.type = "triangle"; o1.frequency.setValueAtTime(120, now); o1.frequency.exponentialRampToValueAtTime(25, now + 0.14);
            o2.type = "square"; o2.frequency.setValueAtTime(160, now); o2.frequency.exponentialRampToValueAtTime(18, now + 0.08);
            g.gain.setValueAtTime(0.07, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            o1.start(now); o2.start(now); o1.stop(now + 0.18); o2.stop(now + 0.18);
            audioEnabled = prev;
        } catch (e) { }
    };

    /* --- CLOCK / UPTIME --- */
    function updateClock() {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, "0");
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const h = String(now.getHours()).padStart(2, "0");
        const min = String(now.getMinutes()).padStart(2, "0");
        if (dateEl) dateEl.textContent = `DATE: ${m}/${d} // ${h}:${min}`;
    }
    updateClock(); setInterval(updateClock, 10000);

    const startTime = Date.now();
    setInterval(() => {
        const t = Math.floor((Date.now() - startTime) / 1000);
        const h = String(Math.floor(t / 3600)).padStart(2, "0");
        const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
        const s = String(t % 60).padStart(2, "0");
        if (uptimeEl) uptimeEl.textContent = `UPTIME: ${h}:${m}:${s}`;
    }, 1000);

    /* --- TAB SWITCHING --- */
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            const panel = document.getElementById("tab-" + target);
            if (panel) panel.classList.add("active");
            playClick();
        });
    });

    /* --- POWER BUTTON --- */
    const powerBtn = document.getElementById("power-btn");
    const powerLed = document.getElementById("power-led");

    powerBtn.addEventListener("click", () => {
        powerState = !powerState;
        playPower();
        if (powerState) {
            screenRegion.parentElement.classList.remove("screen-off");
            powerBtn.classList.add("active");
            powerLed.classList.add("active");
            setTimeout(triggerTypewriter, 600);
        } else {
            screenRegion.parentElement.classList.add("screen-off");
            powerBtn.classList.remove("active");
            powerLed.classList.remove("active");
        }
    });

    /* --- BRIGHTNESS DIAL --- */
    const dialBright = document.getElementById("dial-brightness");
    dialBright.addEventListener("click", () => {
        brightLevel = (brightLevel + 1) % 3;
        const knob = dialBright.querySelector(".dial-knob");
        knob.style.transform = `rotate(${brightLevel * 55}deg)`;
        const opacities = [1, 0.68, 0.42];
        screenUI.style.opacity = opacities[brightLevel];
        playDial();
    });

    /* --- THEME DIAL --- */
    const dialTheme = document.getElementById("dial-theme");
    dialTheme.addEventListener("click", () => {
        if (THEMES[themeIndex]) body.classList.remove(THEMES[themeIndex]);
        themeIndex = (themeIndex + 1) % THEMES.length;
        if (THEMES[themeIndex]) body.classList.add(THEMES[themeIndex]);
        const knob = dialTheme.querySelector(".dial-knob");
        knob.style.transform = `rotate(${themeIndex * 60}deg)`;
        playDial();
        setTimeout(playChime, 120);
    });

    /* --- AUDIO DIAL --- */
    const dialAudio = document.getElementById("dial-audio");
    dialAudio.addEventListener("click", () => {
        audioEnabled = !audioEnabled;
        const knob = dialAudio.querySelector(".dial-knob");
        knob.style.transform = audioEnabled ? "rotate(90deg)" : "rotate(0deg)";
        if (audioEnabled) { initAudio(); playClick(); setTimeout(playChime, 120); }
    });

    /* --- TYPEWRITER --- */
    const BIO_TEXT = "Hi, I'm a student developer designing interactive retro-futuristic digital spaces. Adjust the dials below or switch tabs to unlock achievements, skill matrices, and the signal transmitter. Feel free to leave a message!";
    let typeIdx = 0, typeTimer = null;

    function triggerTypewriter() {
        const el = document.getElementById("typewriter");
        if (!el) return;
        typeIdx = 0; el.textContent = ""; clearInterval(typeTimer);
        typeTimer = setInterval(() => {
            if (typeIdx < BIO_TEXT.length) {
                el.textContent += BIO_TEXT[typeIdx++];
                if (typeIdx % 3 === 0) playTick();
            } else {
                clearInterval(typeTimer);
            }
        }, 28);
    }
    triggerTypewriter();

    /* --- CONTACT TRANSMITTER --- */
    txBtn.addEventListener("click", () => {
        const sender = document.getElementById("tx-sender").value.trim();
        const address = document.getElementById("tx-return").value.trim();
        const msg = document.getElementById("tx-payload").value.trim();
        if (!sender || !msg) {
            txLog.style.color = "var(--iris-4)";
            txLog.textContent = "⚠ SENDER_ID AND MESSAGE REQUIRED.";
            return;
        }
        playClick();
        txLog.style.color = "var(--scr-txt)";
        txLog.textContent = "INITIALIZING SIGNAL PROTOCOL... [ 15% ]";
        setTimeout(() => { txLog.textContent = "ENCRYPTING PAYLOAD PACKETS... [ 60% ]"; playTick(); }, 900);
        setTimeout(() => {
            txLog.textContent = "TRANSMISSION SENT SUCCESSFULLY! ✓";
            txLog.style.color = "#48bb78";
            playChime();
            document.getElementById("tx-sender").value = "";
            document.getElementById("tx-return").value = "";
            document.getElementById("tx-payload").value = "";
        }, 2000);
    });

    /* --- HOVER AUDIO BINDINGS --- */
    function bindHoverAudio() {
        document.querySelectorAll("button, a, input, textarea, .dial, .data-table tbody tr").forEach(el => {
            if (el.dataset.audiobound) return;
            el.dataset.audiobound = "1";
            el.addEventListener("mouseenter", playTick);
        });
    }
    bindHoverAudio();
    setInterval(bindHoverAudio, 2500);

});