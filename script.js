/* ==========================================================================
   PORTFOLIO ENGINE (CRT TERMINAL & TOUCH CONTROLS)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    
    // Core Settings State
    let audioEnabled = false;
    let powerState = true;
    let brightnessLevel = 0; // 0: 100%, 1: 70%, 2: 40%
    let themeIndex = 0; // 0: default(blue), 1: green, 2: amber
    
    const themes = ["theme-default", "theme-green", "theme-amber"];
    const themeLabels = ["CYBER", "GREEN", "AMBER"];

    // Dom References
    const body = document.body;
    const monitorScreen = document.getElementById("monitor-screen");
    const uptimeLabel = document.querySelector(".sys-uptime");
    const dateLabel = document.querySelector(".sys-time");
    
    // Physical Dials and Controls
    const dialBrightness = document.getElementById("dial-brightness");
    const dialTheme = document.getElementById("dial-theme");
    const dialAudio = document.getElementById("dial-audio");
    const btnPower = document.getElementById("power-btn");
    const ledPower = document.getElementById("power-indicator");
    
    // Form Elements
    const transmitterForm = document.getElementById("transmitter-form");
    const txStatusLog = document.getElementById("tx-status-log");

    // Audio Context Setup (lazy initialized)
    let audioCtx = null;

    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    /* ==========================================================================
       SYNTHESIZED SOUND WAVE GENERATORS (Web Audio API)
       ========================================================================== */

    // Retro mechanical tick (for hovers)
    function playTickSound() {
        if (!audioEnabled) return;
        try {
            initAudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.03);
            
            gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
            
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.04);
        } catch (e) {}
    }

    // Standard button select click
    function playClickSound() {
        if (!audioEnabled) return;
        try {
            initAudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(700, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.06);
            
            gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
            
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.07);
        } catch (e) {}
    }

    // Physical knob slide/turn blip
    function playDialTurnSound() {
        if (!audioEnabled) return;
        try {
            initAudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(350, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(650, audioCtx.currentTime + 0.08);
            
            gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.09);
        } catch (e) {}
    }

    // Heavy industrial switch pop (for monitor power toggle)
    function playPowerSwitchSound() {
        try {
            // Force play this sound since it was triggered by power toggle
            const prev = audioEnabled;
            audioEnabled = true;
            initAudioContext();
            
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc1.type = "triangle";
            osc1.frequency.setValueAtTime(120, audioCtx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15);
            
            osc2.type = "square";
            osc2.frequency.setValueAtTime(160, audioCtx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.09);
            
            gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            
            osc1.start(audioCtx.currentTime);
            osc2.start(audioCtx.currentTime);
            osc1.stop(audioCtx.currentTime + 0.18);
            osc2.stop(audioCtx.currentTime + 0.18);
            
            audioEnabled = prev;
        } catch (e) {}
    }

    // Dual pitch success synth chime
    function playSuccessChime() {
        if (!audioEnabled) return;
        try {
            initAudioContext();
            const now = audioCtx.currentTime;
            
            const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
            freqs.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + (idx * 0.06));
                
                gain.gain.setValueAtTime(0.0, now);
                gain.gain.linearRampToValueAtTime(0.02, now + (idx * 0.06) + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.06) + 0.15);
                
                osc.start(now + (idx * 0.06));
                osc.stop(now + (idx * 0.06) + 0.18);
            });
        } catch (e) {}
    }

    /* ==========================================================================
       DATE CLOCK & SESSION RUNTIME
       ========================================================================== */

    // Live clock on top status bar
    function updateClock() {
        const now = new Date();
        const dateStr = String(now.getDate()).padStart(2, "0");
        const monthStr = String(now.getMonth() + 1).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        
        dateLabel.textContent = `DATE: ${monthStr}/${dateStr} // ${hours}:${minutes}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Live uptime monitor session clock
    const startTime = Date.now();
    setInterval(() => {
        const elapsed = Date.now() - startTime;
        const totalSecs = Math.floor(elapsed / 1000);
        
        const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
        const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
        const secs = String(totalSecs % 60).padStart(2, "0");
        
        uptimeLabel.textContent = `UPTIME: ${hrs}:${mins}:${secs}`;
    }, 1000);

    /* ==========================================================================
       CRT POWER SWITCH & BEZEL DIALS
       ========================================================================== */

    // Toggle Monitor Screen display
    btnPower.addEventListener("click", () => {
        powerState = !powerState;
        
        playPowerSwitchSound();
        
        if (powerState) {
            monitorScreen.classList.remove("screen-off");
            btnPower.classList.add("active");
            ledPower.classList.add("active");
            
            // Re-boot typewriter display
            setTimeout(() => {
                triggerTypewriterEffect();
            }, 600);
        } else {
            monitorScreen.classList.add("screen-off");
            btnPower.classList.remove("active");
            ledPower.classList.remove("active");
        }
    });

    // Brightness Dial adjustment (knob rotates, screen opacity fades)
    dialBrightness.addEventListener("click", () => {
        brightnessLevel = (brightnessLevel + 1) % 3;
        
        // Rotate knob
        const knob = dialBrightness.querySelector(".dial-knob");
        const angles = [0, 50, 100];
        knob.style.transform = `rotate(${angles[brightnessLevel]}deg)`;
        
        // Shift screen brightness opacity
        const screenContent = monitorScreen.querySelector(".crt-screen-content");
        const opacityLevels = [1, 0.7, 0.45];
        screenContent.style.opacity = opacityLevels[brightnessLevel];
        
        playDialTurnSound();
    });

    // Color Theme Dial (knob rotates, body variables update)
    dialTheme.addEventListener("click", () => {
        body.classList.remove(themes[themeIndex]);
        themeIndex = (themeIndex + 1) % themes.length;
        body.classList.add(themes[themeIndex]);
        
        // Rotate knob
        const knob = dialTheme.querySelector(".dial-knob");
        const angles = [0, 60, 120];
        knob.style.transform = `rotate(${angles[themeIndex]}deg)`;
        
        playDialTurnSound();
        setTimeout(playSuccessChime, 150);
    });

    // Sound volume dial (knob rotates, audio toggles)
    dialAudio.addEventListener("click", () => {
        audioEnabled = !audioEnabled;
        
        // Rotate knob
        const knob = dialAudio.querySelector(".dial-knob");
        knob.style.transform = audioEnabled ? "rotate(90deg)" : "rotate(0deg)";
        
        if (audioEnabled) {
            initAudioContext();
            playClickSound();
            setTimeout(playSuccessChime, 150);
        }
    });

    /* ==========================================================================
       TYPEWRITER PROMPT TERMINAL LOG
       ========================================================================== */

    const fullBioText = "Hi, I'm a student developer designing interactive retro-futuristic digital spaces. Adjust my dials below or slide down to unlock database achievements, skills compiler matrices, and configure the transmission signal. Feel free to leave a message!";
    let textIndex = 0;
    let typewriterTimer = null;

    function triggerTypewriterEffect() {
        const textContainer = document.getElementById("typewriter-text");
        if (!textContainer) return;
        
        // Reset state
        textIndex = 0;
        textContainer.textContent = "";
        clearInterval(typewriterTimer);
        
        typewriterTimer = setInterval(() => {
            if (textIndex < fullBioText.length) {
                textContainer.textContent += fullBioText.charAt(textIndex);
                textIndex++;
                
                // Play tiny typing sound occasionally (every 3rd key) to prevent click storm
                if (textIndex % 3 === 0) {
                    playTickSound();
                }
            } else {
                clearInterval(typewriterTimer);
            }
        }, 30);
    }
    triggerTypewriterEffect();

    /* ==========================================================================
       DASHBOARD FORM TRANSMITTER (CONTACT LOG)
       ========================================================================== */

    transmitterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const sender = document.getElementById("tx-sender").value.trim();
        const address = document.getElementById("tx-return").value.trim();
        const payload = document.getElementById("tx-payload").value.trim();

        if (!sender || !payload) return;

        playClickSound();
        
        txStatusLog.textContent = "";
        txStatusLog.className = "tx-status-log";
        
        // Mocking terminal signal configuration logs
        setTimeout(() => {
            txStatusLog.textContent = "INITIALIZING SIGNAL PROTOCOL... [ 15% ]";
            txStatusLog.style.color = "var(--color-accent)";
            playTickSound();
        }, 400);

        setTimeout(() => {
            txStatusLog.textContent = "ENCRYPTING PAYLOAD PACKETS... [ 60% ]";
            playTickSound();
        }, 1100);

        setTimeout(() => {
            txStatusLog.textContent = "TRANSMISSION SENT SUCCESSFULLY! ✅";
            txStatusLog.className = "tx-status-log text-glow";
            txStatusLog.style.color = "#48bb78";
            
            // Success chime
            playSuccessChime();
            // Reset forms
            transmitterForm.reset();
        }, 2100);
    });

    /* ==========================================================================
       SOUND TRIGGER BINDINGS ON HOVERS/CLICKS
       ========================================================================== */

    function bindAudioTriggers() {
        const interactives = document.querySelectorAll(
            "button, a, input, textarea, .dial-container, .grid-table tbody tr"
        );
        
        interactives.forEach(item => {
            if (item.dataset.audioBound) return;
            item.dataset.audioBound = "true";
            
            item.addEventListener("mouseenter", () => {
                playTickSound();
            });
            
            item.addEventListener("click", () => {
                playClickSound();
            });
        });
    }

    bindAudioTriggers();
    setInterval(bindAudioTriggers, 2000); // Re-bind dynamic changes

});
