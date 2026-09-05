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
    },

    // ====== MOTOR DE VOZ NATIVO ULTRA-ROBUSTO (WEB SPEECH + RESUME HEARTBEAT) ======
    currentAudio: null,
    speechSessionId: 0,
    _activeUtterance: null,
    _resumeInterval: null,
    _speechTimeout: null,

    stopSpeech: () => {
        audio.speechSessionId++; // Invalida cualquier sesión previa o callback pendiente
        if (audio._speechTimeout) {
            clearTimeout(audio._speechTimeout);
            audio._speechTimeout = null;
        }
        if (audio._resumeInterval) {
            clearInterval(audio._resumeInterval);
            audio._resumeInterval = null;
        }
        if (audio.currentAudio) {
            try {
                audio.currentAudio.onended = null;
                audio.currentAudio.onerror = null;
                audio.currentAudio.pause();
                audio.currentAudio.currentTime = 0;
                audio.currentAudio.src = '';
            } catch(e){}
            audio.currentAudio = null;
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
            } catch(e){}
        }
        audio._activeUtterance = null;
    },

    speakNative: (text, langCode, onEnd, rateOverride) => {
        if (!text || !text.trim()) {
            if (onEnd) onEnd();
            return;
        }

        audio.stopSpeech();
        const sessionId = audio.speechSessionId;

        const cleanText = text.replace(/<[^>]*>/g, '').replace(/^[-–—•·\s]+/, '').trim();
        if (!cleanText) {
            if (onEnd) onEnd();
            return;
        }

        // Si el navegador soporta SpeechSynthesis (Chrome, Edge, Safari, Android, iOS)
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            audio.speakWebSpeech(cleanText, langCode, onEnd, rateOverride, sessionId);
            return;
        }

        // Fallback para navegadores sin SpeechSynthesis: Audio Google TTS
        audio.speakGoogleAudio(cleanText, langCode, onEnd, rateOverride, sessionId);
    },

    speakWebSpeech: (text, langCode, onEnd, rateOverride, sessionId) => {
        if (sessionId && sessionId !== audio.speechSessionId) return;

        const langInfo = (typeof LANGUAGES !== 'undefined' && LANGUAGES[langCode]) ? LANGUAGES[langCode] : { code: langCode || 'en', speechLang: 'en-US' };
        const sliderRate = parseFloat(document.getElementById('speech-speed-slider')?.value || 0.85);
        const rate = Math.max(0.5, Math.min(1.5, (rateOverride !== undefined ? rateOverride : sliderRate)));

        // Adaptación fonética para lenguas regionales si no tienen voz propia en el sistema
        let adaptedText = text;
        if (langCode === 'eu') {
            adaptedText = adaptedText
                .replace(/tz/gi, 'ts')
                .replace(/tx/gi, 'ch')
                .replace(/x/gi, 'sh')
                .replace(/z/gi, (m) => (m === 'Z' ? 'S' : 's'));
        } else if (langCode === 'gl') {
            adaptedText = adaptedText
                .replace(/x([aeiouáéíóú])/gi, 'sh$1')
                .replace(/nh/gi, 'ñ');
        } else if (langCode === 'ca') {
            adaptedText = adaptedText
                .replace(/ç/gi, 's')
                .replace(/ny/gi, 'ñ')
                .replace(/l·l/gi, 'll');
        }

        const proceedSpeak = () => {
            if (sessionId && sessionId !== audio.speechSessionId) return;

            // En Chromium, cancel() es asíncrono y llamar a speak() inmediatamente en el mismo tick
            // a menudo cancela la locución que acabamos de poner. Dejamos un margen de 50ms:
            window.speechSynthesis.cancel();

            setTimeout(() => {
                if (sessionId && sessionId !== audio.speechSessionId) return;

                // Despertar el sintetizador si quedó pausado en Chrome
                try {
                    if (window.speechSynthesis.paused) {
                        window.speechSynthesis.resume();
                    }
                } catch(e){}

                const voices = window.speechSynthesis.getVoices() || [];
                let matchedVoice = null;

                const langTags = {
                    eu: ['eu-es', 'basque', 'euskara', 'aritz', 'miren', 'amaia', 'google euskara'],
                    ca: ['ca-es', 'catalan', 'català', 'enric', 'montserrat', 'laia', 'valencian', 'google català'],
                    gl: ['gl-es', 'galego', 'galician', 'sabela', 'anxo', 'iria', 'google galego'],
                    es: ['es-es', 'spanish', 'castellano', 'helena', 'laura', 'pablo', 'monica', 'jorge'],
                    en: ['en-us', 'en-gb', 'samantha', 'zira', 'david', 'mark', 'google english', 'english'],
                    de: ['de-de', 'katja', 'hedda', 'marlene', 'vicki', 'google deutsch', 'german'],
                    fr: ['fr-fr', 'hortense', 'julie', 'celine', 'google français', 'french'],
                    it: ['it-it', 'elsa', 'cosimo', 'alice', 'federica', 'google italiano', 'italian'],
                    pt: ['pt-pt', 'pt-br', 'joana', 'inês', 'google português', 'portuguese'],
                    ru: ['ru-ru', 'irina', 'tatyana', 'google русский', 'russian']
                };

                const targetTags = langTags[langCode] || [langCode];
                if (voices.length > 0) {
                    matchedVoice = voices.find(v => {
                        const vName = (v.name || '').toLowerCase();
                        const vLang = (v.lang || '').toLowerCase().replace('_', '-');
                        return targetTags.some(tag => vLang.includes(tag) || vName.includes(tag));
                    });
                    if (!matchedVoice) {
                        matchedVoice = voices.find(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(langCode));
                    }
                }

                const u = new SpeechSynthesisUtterance(adaptedText);
                u.rate = rate;

                if (matchedVoice) {
                    u.voice = matchedVoice;
                    u.lang = matchedVoice.lang;
                } else if (langCode === 'eu' || langCode === 'ca' || langCode === 'gl') {
                    // Si no hay voz regional, usar voz en español con texto adaptado fonéticamente
                    const esVoice = voices.find(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith('es'));
                    if (esVoice) u.voice = esVoice;
                    u.lang = 'es-ES';
                } else {
                    u.lang = langInfo.speechLang || 'en-US';
                }

                // ANCLAJE CONTRA EL BUG DE GARBAGE COLLECTION DE CHROMIUM
                audio._activeUtterance = u;

                let finished = false;
                const done = () => {
                    if (sessionId && sessionId !== audio.speechSessionId) return;
                    if (finished) return;
                    finished = true;
                    if (audio._speechTimeout) {
                        clearTimeout(audio._speechTimeout);
                        audio._speechTimeout = null;
                    }
                    if (audio._resumeInterval) {
                        clearInterval(audio._resumeInterval);
                        audio._resumeInterval = null;
                    }
                    audio._activeUtterance = null;
                    if (onEnd) onEnd();
                };

                u.onend = done;
                u.onerror = (e) => {
                    if (e && e.error !== 'interrupted' && e.error !== 'canceled') {
                        console.warn("SpeechSynthesis error:", e.error || e);
                    }
                    done();
                };

                // Heartbeat para prevenir que Chrome congele speechSynthesis tras 15 segundos
                if (audio._resumeInterval) clearInterval(audio._resumeInterval);
                audio._resumeInterval = setInterval(() => {
                    if (window.speechSynthesis && window.speechSynthesis.speaking) {
                        window.speechSynthesis.resume();
                    }
                }, 4000);

                // Timeout de seguridad si el navegador no dispara onend
                if (audio._speechTimeout) clearTimeout(audio._speechTimeout);
                audio._speechTimeout = setTimeout(() => {
                    if (!finished) done();
                }, Math.max(4500, adaptedText.length * 120));

                try {
                    window.speechSynthesis.speak(u);
                } catch(speakErr) {
                    console.warn("SpeechSynthesis speak() failed:", speakErr);
                    done();
                }
            }, 60);
        };

        // Si no hay voces cargadas todavía (caso habitual al iniciar Chrome en Android), esperar a onvoiceschanged
        if (window.speechSynthesis.getVoices().length === 0) {
            let voicesLoaded = false;
            const onVoices = () => {
                if (voicesLoaded) return;
                voicesLoaded = true;
                window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
                proceedSpeak();
            };
            window.speechSynthesis.addEventListener('voiceschanged', onVoices);
            setTimeout(onVoices, 200);
        } else {
            proceedSpeak();
        }
    },

    // Fallback secundario de audio si no hay Web Speech API
    speakGoogleAudio: (cleanText, langCode, onEnd, rateOverride, sessionId) => {
        if (cleanText.length > 250) {
            if (onEnd) onEnd();
            return;
        }
        try {
            const langInfo = (typeof LANGUAGES !== 'undefined' && LANGUAGES[langCode]) ? LANGUAGES[langCode] : { code: langCode || 'en' };
            const ttsLang = langInfo.code || langCode || 'en';
            const encoded = encodeURIComponent(cleanText);
            const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&q=${encoded}`;

            const audioObj = new Audio();
            audio.currentAudio = audioObj;

            const sliderRate = parseFloat(document.getElementById('speech-speed-slider')?.value || 0.85);
            const rate = rateOverride !== undefined ? rateOverride : sliderRate;

            let finished = false;
            const done = () => {
                if (sessionId !== audio.speechSessionId) return;
                if (finished) return;
                finished = true;
                audio.currentAudio = null;
                if (onEnd) onEnd();
            };

            audioObj.onended = done;
            audioObj.onerror = done;
            audioObj.src = googleUrl;
            try { audioObj.playbackRate = Math.max(0.6, Math.min(1.4, rate)); } catch(e){}

            const p = audioObj.play();
            if (p !== undefined) {
                p.catch(() => done());
            }
        } catch(e) {
            if (onEnd) onEnd();
        }
    }
};

window.audio = audio;
