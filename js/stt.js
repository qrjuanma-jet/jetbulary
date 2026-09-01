// ====== INTELLIGENT ADAPTIVE DUAL STT ENGINE (SMART SILENCE & LOW-LATENCY) ======
    const stt = {
        mediaRecorder: null,
        audioStream: null,
        audioChunks: [],
        speechRecognition: null,
        isRecording: false,
        maxTimer: null,
        silenceTimer: null,
        audioContext: null,
        analyser: null,
        activeTarget: null,

        normalizeWord: (w) => {
            if (!w) return '';
            return w.toLowerCase().replace(/^[¿¡"'(\[]+|[.,\/#!$%\^&*;:{}=\-_`~()\]?"']+$/g, '');
        },

        mergeOverlap: (finalText, interimText) => {
            if (!finalText) return (interimText || '').trim();
            if (!interimText) return (finalText || '').trim();

            const fWords = finalText.trim().split(/\s+/);
            const iWords = interimText.trim().split(/\s+/);

            const fNorm = fWords.map(stt.normalizeWord);
            const iNorm = iWords.map(stt.normalizeWord);

            const fJoined = fNorm.join(' ');
            const iJoined = iNorm.join(' ');

            // Si interim contiene a final por completo desde el inicio
            if (iJoined.startsWith(fJoined)) {
                return interimText.trim();
            }

            // Si final contiene a interim por completo al final
            if (fJoined.endsWith(iJoined)) {
                return finalText.trim();
            }

            // Comprobar sufijo más largo de final que coincida con prefijo de interim
            const maxOverlap = Math.min(fWords.length, iWords.length);
            for (let len = maxOverlap; len > 0; len--) {
                const fSuffix = fNorm.slice(fWords.length - len).join(' ');
                const iPrefix = iNorm.slice(0, len).join(' ');
                if (fSuffix === iPrefix) {
                    const remainingInterim = iWords.slice(len).join(' ');
                    return remainingInterim ? (finalText.trim() + ' ' + remainingInterim) : finalText.trim();
                }
            }

            return (finalText.trim() + ' ' + interimText.trim()).trim();
        },

        deduplicateStutter: (text) => {
            if (!text) return '';
            let clean = text.replace(/\s+/g, ' ').trim();
            let words = clean.split(' ');
            if (words.length <= 1) return clean;

            // 1. Eliminar palabras individuales consecutivas duplicadas (ignorando signos y mayúsculas)
            let deduped = [];
            for (let i = 0; i < words.length; i++) {
                const current = words[i];
                const prev = deduped.length > 0 ? deduped[deduped.length - 1] : null;
                if (prev && stt.normalizeWord(current) === stt.normalizeWord(prev) && stt.normalizeWord(current).length > 0) {
                    continue;
                }
                deduped.push(current);
            }

            // 2. Eliminar frases consecutivas duplicadas de 2 a 6 palabras (ej: "cómo estás cómo estás" -> "cómo estás")
            let phraseWords = deduped;
            for (let phraseLen = Math.min(6, Math.floor(phraseWords.length / 2)); phraseLen >= 2; phraseLen--) {
                let changed = false;
                let newWords = [];
                for (let i = 0; i < phraseWords.length; ) {
                    if (i + 2 * phraseLen <= phraseWords.length) {
                        const p1 = phraseWords.slice(i, i + phraseLen).map(stt.normalizeWord).join(' ');
                        const p2 = phraseWords.slice(i + phraseLen, i + 2 * phraseLen).map(stt.normalizeWord).join(' ');
                        if (p1 && p1 === p2) {
                            for (let k = 0; k < phraseLen; k++) newWords.push(phraseWords[i + k]);
                            i += 2 * phraseLen;
                            changed = true;
                            continue;
                        }
                    }
                    newWords.push(phraseWords[i]);
                    i++;
                }
                if (changed) phraseWords = newWords;
            }

            return phraseWords.join(' ').trim();
        },

        // Fix 2: Track the last processed final index to avoid reprocessing
        _lastFinalIndex: -1,

        // Helper: normalize an entire string for comparison (strip all punctuation, lowercase, collapse spaces)
        _normalizeFull: (s) => {
            if (!s) return '';
            return s.toLowerCase().replace(/[.,\/#!$%\^\&*;:{}=\-_`~()\[\]?"'¿¡]+/g, '').replace(/\s+/g, ' ').trim();
        },

        cleanSpeechTranscript: (e) => {
            if (!e || !e.results || e.results.length === 0) return '';

            let fullSentence = '';
            for (let i = 0; i < e.results.length; i++) {
                const item = e.results[i];
                if (item && item[0] && item[0].transcript) {
                    fullSentence += ' ' + item[0].transcript.trim();
                }
            }

            return stt.deduplicateStutter(fullSentence.trim());
        },

        _currentFinalizer: null,

        startRecording: async (target, langCode, onTranscriptCallback, onErrorCallback) => {
            stt.stop();
            window.speechSynthesis.cancel();
            stt.activeTarget = target;

            const btnId = target === 'game' ? 'mic-btn' : target === 'convo' ? 'mic-btn-convo' : null;
            const btn = btnId ? document.getElementById(btnId) : null;
            if (btn) btn.classList.add('listening');

            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            // 1. SMART ADAPTIVE NATIVE WEB SPEECH API (OPTIMIZED FOR MOBILE & DESKTOP)
            if (SR) {
                try {
                    const rec = new SR();
                    stt.speechRecognition = rec;
                    const langMap = { en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', pt: 'pt-PT', ru: 'ru-RU', ca: 'ca-ES', eu: 'eu-ES', gl: 'gl-ES' };
                    rec.lang = langMap[langCode] || (typeof LANGUAGES !== 'undefined' && LANGUAGES[langCode] && LANGUAGES[langCode].speechLang) || 'es-ES';
                    
                    const isTransMode = (target === 'trans');
                    const isSentenceMode = (target === 'convo' || isTransMode);
                    rec.continuous = isTransMode ? true : false; // Para traductor continuo durante la frase
                    rec.interimResults = true;
                    rec.maxAlternatives = 1;

                    let handled = false;
                    let accumulatedText = '';

                    const finalize = (text) => {
                        if (handled) return;
                        // Fix 3: Anti-bounce — reject finalize calls within 150ms of each other
                        const now = Date.now();
                        if (stt._lastFinalizeTime && now - stt._lastFinalizeTime < 150) return;
                        stt._lastFinalizeTime = now;
                        handled = true;
                        stt._currentFinalizer = null;
                        if (stt.silenceTimer) { clearTimeout(stt.silenceTimer); stt.silenceTimer = null; }
                        // Fix 4: Clear translator live bubbles immediately to prevent visual duplication
                        if (typeof translator !== 'undefined' && translator.clearLiveBubbles) {
                            translator.clearLiveBubbles();
                        }
                        stt.stop();
                        const cleanText = stt.deduplicateStutter(text || accumulatedText || '').trim();
                        if (cleanText) {
                            onTranscriptCallback(cleanText);
                        } else if (onErrorCallback) {
                            onErrorCallback("No se detectó voz");
                        }
                    };

                    stt._currentFinalizer = () => {
                        if (accumulatedText && accumulatedText.trim()) {
                            finalize(accumulatedText);
                        } else {
                            stt.stop();
                            if (onErrorCallback) onErrorCallback("Cancelado");
                        }
                    };

                    // Temporizador inicial de silencio para el traductor: 3 segundos
                    if (isTransMode) {
                        if (stt.silenceTimer) clearTimeout(stt.silenceTimer);
                        stt.silenceTimer = setTimeout(() => {
                            if (!handled) {
                                if (accumulatedText) finalize(accumulatedText);
                                else {
                                    stt.stop();
                                    if (onErrorCallback) onErrorCallback("No se detectó voz");
                                }
                            }
                        }, 3000);
                    }

                    rec.onresult = (e) => {
                        if (handled) return;

                        const cleanText = stt.cleanSpeechTranscript(e);
                        if (cleanText) accumulatedText = cleanText;

                        // A) SINGLE-WORD MODE (Flashcard exercise)
                        if (target === 'game') {
                            if (typeof game !== 'undefined' && game.data && game.data[game.index]) {
                                const targetWord = game.data[game.index].english;
                                for (let i = 0; i < e.results.length; i++) {
                                    for (let j = 0; j < e.results[i].length; j++) {
                                        const alt = (e.results[i][j].transcript || '').trim();
                                        if (alt && game.isCloseMatch(targetWord, alt)) {
                                            finalize(alt);
                                            return;
                                        }
                                    }
                                }
                            }
                            if (e.results[e.results.length - 1].isFinal) {
                                finalize(accumulatedText);
                                return;
                            }
                        }

                        // B) SENTENCE / LESSON / CONVERSATION / TRANSLATOR MODE
                        if (isSentenceMode) {
                            // Feedback en tiempo real para el traductor
                            if (target === 'trans' && typeof translator !== 'undefined' && translator.onLiveInterim) {
                                translator.onLiveInterim(accumulatedText);
                            }

                            // Comprobar si coincide con la frase esperada en lecciones
                            if (typeof conversation !== 'undefined' && conversation.expectedText && typeof game !== 'undefined' && game.isCloseMatch) {
                                if (game.isCloseMatch(conversation.expectedText, accumulatedText)) {
                                    finalize(accumulatedText);
                                    return;
                                }
                            }

                            // Temporizador de silencio: 2200ms para traductor (pausa natural y entonación de frases complejas), 500ms para conversación
                            const silenceDelay = isTransMode ? 2200 : 500;
                            if (stt.silenceTimer) clearTimeout(stt.silenceTimer);
                            stt.silenceTimer = setTimeout(() => {
                                finalize(accumulatedText);
                            }, silenceDelay);

                            // En modo lección/conversación normal cerramos con isFinal; en traductor dejamos descanso natural
                            if (!isTransMode && e.results[e.results.length - 1].isFinal) {
                                finalize(accumulatedText);
                                return;
                            }
                        }
                    };

                    rec.onerror = (e) => {
                        if (handled) return;
                        console.warn("SpeechRecognition error:", e.error);
                        if (e.error === 'no-speech') {
                            if (!accumulatedText) {
                                stt.stop();
                                if (onErrorCallback) onErrorCallback("No se detectó voz");
                            } else {
                                finalize(accumulatedText);
                            }
                        } else if (e.error === 'not-allowed' || e.error === 'permission-denied') {
                            stt.stop();
                            alert("⚠️ Por favor concede permiso de micrófono a Jetbulary para hablar.");
                        } else {
                            stt.stop();
                            stt.startMediaRecorder(target, langCode, onTranscriptCallback, onErrorCallback);
                        }
                    };

                    rec.onend = () => {
                        if (!handled) {
                            if (isTransMode) {
                                if (accumulatedText && accumulatedText.trim()) {
                                    if (stt.silenceTimer) return; // Esperar al temporizador de silencio para no cortar frases
                                    finalize(accumulatedText);
                                } else {
                                    stt.stop();
                                    if (onErrorCallback) onErrorCallback("No se detectó voz");
                                }
                            } else {
                                if (accumulatedText) {
                                    finalize(accumulatedText);
                                } else {
                                    stt.stop();
                                    if (onErrorCallback) onErrorCallback("No se detectó voz");
                                }
                            }
                        }
                    };

                    stt.isRecording = true;
                    rec.start();

                    // Max timeout: 6s para palabra única, 20s para oraciones de traductor
                    stt.maxTimer = setTimeout(() => {
                        if (stt.isRecording) {
                            if (accumulatedText) finalize(accumulatedText);
                            else stt.stop();
                        }
                    }, isTransMode ? 20000 : isSentenceMode ? 16000 : 6000);

                    return;
                } catch(srErr) {
                    console.warn("SpeechRecognition start failed, falling back to Whisper:", srErr);
                }
            }

            // 2. ULTRA-OPTIMIZED GROQ WHISPER ENGINE FALLBACK (Adaptive VAD)
            stt.startMediaRecorder(target, langCode, onTranscriptCallback, onErrorCallback);
        },

        startMediaRecorder: async (target, langCode, onTranscriptCallback, onErrorCallback) => {
            const btnId = target === 'game' ? 'mic-btn' : target === 'convo' ? 'mic-btn-convo' : null;
            const btn = btnId ? document.getElementById(btnId) : null;
            if (btn) btn.classList.add('listening');

            const isTransMode = (target === 'trans');
            const isSentenceMode = (target === 'convo' || isTransMode);

            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("No getUserMedia support");
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                stt.audioStream = stream;
                stt.audioChunks = [];

                let mimeType = '';
                if (typeof MediaRecorder !== 'undefined') {
                    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
                    else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
                    else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
                    else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
                }

                const options = mimeType ? { mimeType } : {};
                const recorder = new MediaRecorder(stream, options);
                stt.mediaRecorder = recorder;
                stt._currentFinalizer = () => {
                    if (stt.mediaRecorder && stt.mediaRecorder.state !== 'inactive') {
                        try { stt.mediaRecorder.stop(); } catch(e){}
                    } else {
                        stt.stop();
                    }
                };

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) stt.audioChunks.push(e.data);
                };

                stt.hasDetectedSpeechInSession = false;

                recorder.onstop = async () => {
                    if (btn) btn.classList.remove('listening');
                    if (stt.audioStream) {
                        stt.audioStream.getTracks().forEach(track => track.stop());
                        stt.audioStream = null;
                    }
                    if (stt.audioChunks.length === 0) return;

                    // Si no hubo energía de voz real durante la grabación, descartar sin llamar a Whisper
                    if (!stt.hasDetectedSpeechInSession) {
                        if (onErrorCallback) onErrorCallback("No se detectó voz");
                        return;
                    }

                    const finalMime = mimeType || 'audio/webm';
                    const audioBlob = new Blob(stt.audioChunks, { type: finalMime });
                    if (audioBlob.size < 300) return;

                    try {
                        const transcript = await app.transcribeAudioWithGroq(audioBlob, langCode);
                        if (transcript && transcript.trim()) {
                            onTranscriptCallback(transcript.trim());
                        } else {
                            if (onErrorCallback) onErrorCallback("No se detectó voz");
                        }
                    } catch(err) {
                        console.error("Whisper error:", err);
                        if (onErrorCallback) onErrorCallback(err.message);
                    }
                };

                recorder.start(40);
                stt.isRecording = true;

                // Smart Adaptive Voice Activity Detection (Auto stop when natural silence is detected)
                try {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (AudioCtx) {
                        const ctx = new AudioCtx();
                        stt.audioContext = ctx;
                        const source = ctx.createMediaStreamSource(stream);
                        const analyser = ctx.createAnalyser();
                        analyser.fftSize = 256;
                        source.connect(analyser);
                        stt.analyser = analyser;

                        let speechStarted = false;
                        let silenceStart = null;
                        // 500ms para palabra suelta, 1800ms para traductor, 1600ms para lección
                        const silenceThresholdMs = isTransMode ? 1800 : isSentenceMode ? 1600 : 500;
                        const buffer = new Uint8Array(analyser.frequencyBinCount);

                        const checkAudioLevel = () => {
                            if (!stt.isRecording || !stt.mediaRecorder) return;
                            analyser.getByteFrequencyData(buffer);
                            let sum = 0;
                            for (let i = 0; i < buffer.length; i++) sum += buffer[i];
                            const avg = sum / buffer.length;

                            if (avg > 14) {
                                speechStarted = true;
                                stt.hasDetectedSpeechInSession = true;
                                silenceStart = null;
                            } else if (speechStarted) {
                                if (!silenceStart) silenceStart = Date.now();
                                else if (Date.now() - silenceStart > silenceThresholdMs) {
                                    stt.stop();
                                    return;
                                }
                            }
                            requestAnimationFrame(checkAudioLevel);
                        };
                        requestAnimationFrame(checkAudioLevel);
                    }
                } catch(e) { console.log("VAD error:", e); }

                stt.maxTimer = setTimeout(() => {
                    if (stt.isRecording) stt.stop();
                }, isTransMode ? 20000 : isSentenceMode ? 16000 : 6000);

            } catch(err) {
                console.error("Audio recording error:", err);
                if (btn) btn.classList.remove('listening');
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    alert("⚠️ Por favor concede permiso de micrófono a Jetbulary para hablar.");
                } else if (onErrorCallback) {
                    onErrorCallback(err.message);
                }
            }
        },

        stop: () => {
            stt._currentFinalizer = null;
            if (stt.maxTimer) clearTimeout(stt.maxTimer);
            if (stt.silenceTimer) { clearTimeout(stt.silenceTimer); stt.silenceTimer = null; }
            if (stt.speechRecognition) {
                try { stt.speechRecognition.abort(); } catch(e){}
                stt.speechRecognition = null;
            }
            if (stt.mediaRecorder && stt.mediaRecorder.state !== 'inactive') {
                try { stt.mediaRecorder.stop(); } catch(e){}
            }
            stt.isRecording = false;
            stt._lastFinalIndex = -1; // Reset para la próxima sesión de grabación
            if (stt.audioStream) {
                try { stt.audioStream.getTracks().forEach(track => track.stop()); } catch(e){}
                stt.audioStream = null;
            }
            if (stt.audioContext) {
                try { stt.audioContext.close(); } catch(e){}
                stt.audioContext = null;
            }
            document.querySelectorAll('.listening').forEach(el => el.classList.remove('listening'));
        },

        finalizeCurrentSession: () => {
            if (typeof stt._currentFinalizer === 'function') {
                stt._currentFinalizer();
            } else {
                stt.stop();
            }
        }
    };
