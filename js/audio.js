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

    // ====== MOTOR DE VOZ NATIVO CON MÁXIMO REALISMO Y ACENTO AUTÉNTICO ======
    currentAudio: null,
    speechSessionId: 0,

    stopSpeech: () => {
        audio.speechSessionId++; // Invalida cualquier sesión previa o callback pendiente
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
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch(e){}
        }
    },

    speakNative: (text, langCode, onEnd, rateOverride) => {
        if (!text || !text.trim()) {
            if (onEnd) onEnd();
            return;
        }

        audio.stopSpeech();
        const sessionId = audio.speechSessionId;

        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        const langInfo = (typeof LANGUAGES !== 'undefined' && LANGUAGES[langCode]) ? LANGUAGES[langCode] : { code: langCode || 'en', speechLang: 'en-US' };
        const ttsLang = langInfo.code || langCode || 'en';

        let fallbackTriggered = false;
        const triggerFallback = () => {
            if (sessionId !== audio.speechSessionId) return;
            if (fallbackTriggered) return;
            fallbackTriggered = true;
            if (audio.currentAudio) {
                audio.currentAudio.onended = null;
                audio.currentAudio.onerror = null;
                audio.currentAudio = null;
            }
            audio.speakWebSpeech(cleanText, langCode, onEnd, rateOverride, sessionId);
        };

        // 1. MOTOR PRIMARIO: Google Neural Native TTS (Audio nativo de alta fidelidad)
        // Auténticos hablantes nativos para Euskera (eu), Català (ca), Galego (gl), Alemán (de), etc.
        if (cleanText.length <= 250) {
            try {
                const encoded = encodeURIComponent(cleanText);
                const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&q=${encoded}`;
                const audioObj = new Audio();
                audioObj.referrerPolicy = 'no-referrer';
                audio.currentAudio = audioObj;

                const sliderRate = parseFloat(document.getElementById('speech-speed-slider')?.value || 0.85);
                const rate = rateOverride !== undefined ? rateOverride : sliderRate;
                audioObj.playbackRate = Math.max(0.6, Math.min(1.4, rate));

                let finished = false;
                audioObj.onended = () => {
                    if (sessionId !== audio.speechSessionId) return;
                    if (finished) return;
                    finished = true;
                    audio.currentAudio = null;
                    if (onEnd) onEnd();
                };

                audioObj.onerror = () => {
                    if (sessionId !== audio.speechSessionId) return;
                    triggerFallback();
                };

                audioObj.src = googleUrl;
                const playPromise = audioObj.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        if (sessionId !== audio.speechSessionId) return;
                        triggerFallback();
                    });
                }
                return;
            } catch(e) {
                triggerFallback();
                return;
            }
        }

        // Para textos más largos, recurrir a Web Speech API
        audio.speakWebSpeech(cleanText, langCode, onEnd, rateOverride, sessionId);
    },

    speakWebSpeech: (text, langCode, onEnd, rateOverride, sessionId) => {
        if (sessionId && sessionId !== audio.speechSessionId) return;
        if (!('speechSynthesis' in window)) {
            if (onEnd) onEnd();
            return;
        }

        // Cancelar estrictamente cualquier locución pendiente para no encolar frases
        window.speechSynthesis.cancel();

        const langInfo = (typeof LANGUAGES !== 'undefined' && LANGUAGES[langCode]) ? LANGUAGES[langCode] : { code: langCode || 'en', speechLang: 'en-US' };
        const u = new SpeechSynthesisUtterance();
        const sliderRate = parseFloat(document.getElementById('speech-speed-slider')?.value || 0.85);
        u.rate = rateOverride !== undefined ? rateOverride : sliderRate;

        const voices = window.speechSynthesis.getVoices() || [];
        let matchedVoice = null;

        // Búsqueda de voz nativa por etiquetas especializadas
        const langTags = {
            eu: ['eu-es', 'basque', 'euskara', 'aritz', 'miren', 'amaia', 'google euskara'],
            ca: ['ca-es', 'catalan', 'català', 'enric', 'montserrat', 'laia', 'valencian', 'google català'],
            gl: ['gl-es', 'galego', 'galician', 'sabela', 'anxo', 'iria', 'google galego'],
            es: ['es-es', 'spanish', 'castellano', 'helena', 'laura', 'pablo', 'monica', 'jorge'],
            en: ['en-us', 'en-gb', 'samantha', 'zira', 'david', 'mark', 'google english'],
            de: ['de-de', 'katja', 'hedda', 'marlene', 'vicki', 'google deutsch'],
            fr: ['fr-fr', 'hortense', 'julie', 'celine', 'google français'],
            it: ['it-it', 'elsa', 'cosimo', 'alice', 'federica', 'google italiano'],
            pt: ['pt-pt', 'pt-br', 'joana', 'inês', 'google português'],
            ru: ['ru-ru', 'irina', 'tatyana', 'google русский']
        };

        const targetTags = langTags[langCode] || [langCode];
        if (voices.length > 0) {
            matchedVoice = voices.find(v => {
                const vName = v.name.toLowerCase();
                const vLang = v.lang.toLowerCase().replace('_', '-');
                return targetTags.some(tag => vLang.includes(tag) || vName.includes(tag));
            });
        }

        let adaptedText = text;
        // Si NO hay voz nativa instalada para idiomas regionales en el sistema y se recurre a voz en español:
        if (!matchedVoice && (langCode === 'eu' || langCode === 'ca' || langCode === 'gl')) {
            matchedVoice = voices.find(v => {
                const vLang = v.lang.toLowerCase().replace('_', '-');
                return vLang.startsWith('es-') || vLang.startsWith('es');
            });
            u.lang = 'es-ES';

            // ADAPTACIÓN FONÉTICA ESTRICTA:
            // En Euskera la 'z' se pronuncia como 's' (/s/), 'tz' como 'ts', 'tx' como 'ch', 'x' como 'sh'
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
        } else if (matchedVoice) {
            u.voice = matchedVoice;
            u.lang = matchedVoice.lang;
        } else {
            u.lang = langInfo.speechLang || 'es-ES';
        }

        u.text = adaptedText;

        let finished = false;
        const done = () => {
            if (sessionId && sessionId !== audio.speechSessionId) return;
            if (finished) return;
            finished = true;
            if (onEnd) onEnd();
        };

        u.onend = done;
        u.onerror = (e) => {
            console.warn("WebSpeech error:", e);
            done();
        };

        setTimeout(() => {
            if (!finished) done();
        }, Math.max(3000, adaptedText.length * 100));

        window.speechSynthesis.speak(u);
    }
};

window.audio = audio;
