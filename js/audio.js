// ====== AUDIO SYNTHESIZER (WEB AUDIO API CHIMES & TONES) ======
const audio = {
    playTone: (freq, type, duration) => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch(e) {}
    },
    tap: () => {
        audio.playTone(440, 'sine', 0.08);
    },
    success: () => {
        audio.playTone(587.33, 'sine', 0.15);
        setTimeout(() => audio.playTone(880, 'sine', 0.25), 100);
    },
    fail: () => {
        audio.playTone(220, 'sawtooth', 0.25);
    },
    celebrate: () => {
        audio.playTone(523.25, 'triangle', 0.15);
        setTimeout(() => audio.playTone(659.25, 'triangle', 0.15), 120);
        setTimeout(() => audio.playTone(783.99, 'triangle', 0.2), 240);
        setTimeout(() => audio.playTone(1046.50, 'triangle', 0.35), 360);
    }
};
