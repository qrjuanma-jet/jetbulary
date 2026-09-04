// ====== TRANSLATOR (DUAL INTERACTIVE REAL-TIME PUSH-TO-TALK ENGINE) ======
const translator = {
    activeMic: null,            // 'es' | 'target' | null
    isSpeaking: false,          // Bloqueo estricto durante locución TTS
    speakAloudEnabled: false,   // Lectura automática desactivada por defecto (se activa con botón VOZ o altavoces)
    wakeLock: null,
    spanishPhrases: [],
    foreignPhrases: [],
    selectedIndex: null,        // Índice de frase seleccionada (grande/activa). Si es null -> la última
    ctxTargetIndex: null,       // Índice seleccionado para el menú contextual
    langDropdownOpen: false,
    pendingVocabData: null,
    isVocabMicActive: false,

    // Edición interactiva de transcripciones
    editingIndex: null,         // Índice de la frase actualmente en edición
    editingSide: null,          // 'es' | 'target' | null
    currentTranslationId: 0,    // Contador para cancelar traducciones desactualizadas si se edita

    // Control táctil de pulsación prolongada (Long Press) y doble clic
    touchTimer: null,
    touchStartX: 0,
    touchStartY: 0,
    isLongPressTriggered: false,
    lastClickTime: 0,
    lastClickIdx: -1,

    escapeHtml: (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // Detiene de inmediato el micrófono, locución y traducciones en curso ("se para la traducción")
    pauseOngoingTranslationAndAudio: () => {
        stt.stop();
        if (translator.activeMic) {
            translator.activeMic = null;
            translator.updateCardStates(null);
            translator.clearLiveBubbles();
        }
        if (translator.isSpeaking) {
            window.speechSynthesis.cancel();
            translator.isSpeaking = false;
        }
        // Invalida peticiones de traducción previas que estuvieran pendientes
        translator.currentTranslationId++;
        translator.updateStatusBadge('editing');
    },

    // ====== MODO EDICIÓN INTERACTIVA DE TRANSCRIPCIÓN ======
    startEditing: (idx, side) => {
        const total = Math.max(translator.spanishPhrases.length, translator.foreignPhrases.length);
        if (idx < 0 || idx >= total) return;

        // 1. Pausar inmediatamente reconocimiento de voz, locución y traducción
        translator.pauseOngoingTranslationAndAudio();

        translator.editingIndex = idx;
        translator.editingSide = side;
        translator.selectedIndex = idx;

        translator.closeContextMenu();
        translator.renderConversationStreams();

        // 2. Auto-enfoque con selección del texto en el input
        requestAnimationFrame(() => {
            const input = document.getElementById('trans-edit-input');
            if (input) {
                input.focus();
                input.select();
                try { input.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e){}
            }
        });
    },

    finishEditing: async (save) => {
        if (translator.editingIndex === null) return;

        const idx = translator.editingIndex;
        const side = translator.editingSide;
        const input = document.getElementById('trans-edit-input');

        if (!input) {
            translator.editingIndex = null;
            translator.editingSide = null;
            translator.renderConversationStreams();
            translator.updateStatusBadge('ready');
            return;
        }

        const newText = (input.value || '').trim();
        const originalText = (side === 'es') ? (translator.spanishPhrases[idx] || '') : (translator.foreignPhrases[idx] || '');

        // Si se cancela o el texto está vacío
        if (!save || !newText) {
            translator.editingIndex = null;
            translator.editingSide = null;
            translator.renderConversationStreams();
            translator.updateStatusBadge('ready');
            return;
        }

        // Si el texto no cambió, cerramos el editor normalmente
        if (newText === originalText) {
            translator.editingIndex = null;
            translator.editingSide = null;
            translator.renderConversationStreams();
            translator.updateStatusBadge('ready');
            return;
        }

        // 1. Guardar la corrección realizada por el usuario
        const isFromSpanish = (side === 'es');
        if (isFromSpanish) {
            translator.spanishPhrases[idx] = newText;
            translator.foreignPhrases[idx] = "Re-traduciendo con IA...";
        } else {
            translator.foreignPhrases[idx] = newText;
            translator.spanishPhrases[idx] = "Re-traduciendo con IA...";
        }

        translator.editingIndex = null;
        translator.editingSide = null;
        translator.selectedIndex = idx;
        translator.renderConversationStreams();
        translator.updateStatusBadge('processing');

        // 2. Re-traducir con IA la frase corregida
        const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
        const sourceLang = isFromSpanish ? 'Spanish (Castellano)' : langInfo.name;
        const targetLangName = isFromSpanish ? langInfo.name : 'Spanish (Castellano)';
        const prompt = `You are a STRICT real-time simultaneous translator. Your ONLY job is to translate text from one language to another.

RULES:
1. The source language is: ${sourceLang}
2. The target language is: ${targetLangName}
3. Translate accurately and naturally into ${targetLangName}.
4. Do NOT respond conversationally. Do NOT answer questions. Do NOT add commentary.
5. Return ONLY valid JSON:
{
  "translation": "the translated text here"
}`;

        const thisTransId = ++translator.currentTranslationId;

        await app.callAI_Conversation(
            [
                { role: "system", content: prompt },
                { role: "user", content: `Translate accurately this ${sourceLang} text to ${targetLangName}: "${newText}"` }
            ],
            null,
            (data) => {
                // Verificar que no haya una edición o traducción posterior
                if (translator.currentTranslationId !== thisTransId) return;

                const transResult = (data && data.translation ? data.translation : '').trim() || newText;
                if (isFromSpanish) {
                    translator.foreignPhrases[idx] = transResult;
                } else {
                    translator.spanishPhrases[idx] = transResult;
                }
                translator.renderConversationStreams();

                if (translator.speakAloudEnabled) {
                    const speakLang = isFromSpanish ? currentLang : 'es';
                    translator.updateStatusBadge('speaking');
                    translator.speakWithNativeAccent(transResult, speakLang, () => {
                        if (translator.currentTranslationId === thisTransId) {
                            translator.updateStatusBadge('ready');
                        }
                    });
                } else {
                    translator.updateStatusBadge('ready');
                }
            }
        );
    },

    init: () => {
        const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;

        const targetFlagEl = document.getElementById('trans-target-flag');
        const targetNameEl = document.getElementById('trans-target-lang-name');
        if (targetFlagEl) targetFlagEl.src = langInfo.flag || 'flag_en.jpg';
        if (targetNameEl) targetNameEl.innerText = langInfo.name;

        const badgeFlag = document.getElementById('badge-foreign-flag');
        const badgeName = document.getElementById('badge-foreign-name');
        if (badgeFlag) badgeFlag.src = langInfo.flag || 'flag_en.jpg';
        if (badgeName) badgeName.innerText = `${langInfo.name.toUpperCase()} (Interlocutor)`;

        // Modo apaisado permanente para el traductor
        if (screen.orientation && screen.orientation.lock) {
            try { screen.orientation.lock('landscape').catch(() => {}); } catch(e){}
        }
        translator.checkOrientation();
        window.removeEventListener('resize', translator.checkOrientation);
        window.removeEventListener('orientationchange', translator.checkOrientation);
        window.addEventListener('resize', translator.checkOrientation);
        window.addEventListener('orientationchange', translator.checkOrientation);

        translator.renderConversationStreams();
        translator.updateStatusBadge('ready');
        translator.updateCardStates(null);
        translator.syncSpeakAloudUI();
    },

    syncSpeakAloudUI: () => {
        const icon = document.getElementById('trans-tts-icon');
        const label = document.getElementById('trans-tts-label');
        const btn = document.getElementById('btn-trans-tts-toggle');
        if (translator.speakAloudEnabled) {
            if (icon) icon.innerText = '🔊';
            if (label) label.innerText = 'VOZ: ON';
            if (btn) {
                btn.style.borderColor = 'var(--cyber-ok)';
                btn.style.color = 'var(--cyber-ok)';
                btn.style.background = 'rgba(0,255,149,0.15)';
            }
        } else {
            if (icon) icon.innerText = '🔇';
            if (label) label.innerText = 'VOZ: OFF';
            if (btn) {
                btn.style.borderColor = 'rgba(255,255,255,0.25)';
                btn.style.color = '#AAA';
                btn.style.background = 'rgba(0,0,0,0.5)';
            }
        }
    },

    checkOrientation: () => {
        const transView = document.getElementById('view-translator');
        if (!transView || transView.classList.contains('hidden')) return;

        // Si la pantalla es más alta que ancha (pantalla en vertical), forzar rotación a modo apaisado
        if (window.innerHeight > window.innerWidth) {
            transView.classList.add('apaisado-forced');
        } else {
            transView.classList.remove('apaisado-forced');
        }
    },

    // ====== SELECCIÓN INTERACTIVA DE FRASES (GRANDE / PEQUEÑA) ======
    selectPhrase: (idx) => {
        const total = Math.max(translator.spanishPhrases.length, translator.foreignPhrases.length);
        if (idx < 0 || idx >= total) return;
        translator.selectedIndex = idx;
        translator.renderConversationStreams();

        // Scroll suave para mantener centrada la frase seleccionada
        requestAnimationFrame(() => {
            const elEs = document.getElementById(`trans-item-es-${idx}`);
            const elForeign = document.getElementById(`trans-item-foreign-${idx}`);
            if (elEs) elEs.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            if (elForeign) elForeign.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    },

    onPhraseItemClick: (e, idx, side) => {
        if (translator.isLongPressTriggered) {
            translator.isLongPressTriggered = false;
            return;
        }

        // Si ya está editando este mismo elemento, no interferir con la escritura
        if (translator.editingIndex === idx && translator.editingSide === side) {
            return;
        }

        // Si estaba editando otro elemento, cerrar la edición previa
        if (translator.editingIndex !== null) {
            translator.finishEditing(false);
        }

        const now = Date.now();
        // Detección de doble clic / doble tap (en menos de 380ms)
        if (translator.lastClickIdx === idx && (now - translator.lastClickTime < 380)) {
            translator.lastClickTime = 0;
            translator.lastClickIdx = -1;
            translator.onPhraseDblClick(idx, side);
            return;
        }

        translator.lastClickTime = now;
        translator.lastClickIdx = idx;

        // Si ya estaba seleccionado, el clic entra directamente a editar la transcripción
        if (translator.selectedIndex === idx) {
            translator.startEditing(idx, side);
        } else {
            translator.selectPhrase(idx);
        }
    },

    onPhraseDblClick: (idx, side) => {
        translator.selectPhrase(idx);
        // Feedback sonoro inmediato según el lado pulsado
        if (side === 'es') {
            translator.speakSpanishStream();
        } else {
            translator.speakForeignStream();
        }
    },

    // ====== GESTIÓN DE PULSACIÓN PROLONGADA (LONG PRESS) ======
    handleTouchStart: (e, idx, side) => {
        translator.isLongPressTriggered = false;
        if (e.touches && e.touches.length > 0) {
            translator.touchStartX = e.touches[0].clientX;
            translator.touchStartY = e.touches[0].clientY;
        }
        clearTimeout(translator.touchTimer);
        translator.touchTimer = setTimeout(() => {
            translator.isLongPressTriggered = true;
            if (navigator.vibrate) {
                try { navigator.vibrate(45); } catch(err){}
            }
            translator.openContextMenu(e, idx, side);
        }, 450);
    },

    handleTouchMove: (e) => {
        if (e.touches && e.touches.length > 0) {
            const dx = Math.abs(e.touches[0].clientX - translator.touchStartX);
            const dy = Math.abs(e.touches[0].clientY - translator.touchStartY);
            if (dx > 12 || dy > 12) {
                clearTimeout(translator.touchTimer);
            }
        }
    },

    handleTouchEnd: () => {
        clearTimeout(translator.touchTimer);
    },

    // ====== MENÚ CONTEXTUAL / POPUP DE OPCIONES ======
    openContextMenu: (e, idx, side) => {
        if (e && e.preventDefault) e.preventDefault();
        clearTimeout(translator.touchTimer);

        const total = Math.max(translator.spanishPhrases.length, translator.foreignPhrases.length);
        if (idx < 0 || idx >= total) return;

        translator.ctxTargetIndex = idx;
        translator.selectPhrase(idx);

        const spanishText = translator.spanishPhrases[idx] || '';
        const foreignText = translator.foreignPhrases[idx] || '';
        const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;

        const modal = document.getElementById('modal-trans-context-menu');
        const previewEs = document.getElementById('ctx-preview-spanish');
        const previewForeign = document.getElementById('ctx-preview-foreign');
        const titleForeign = document.getElementById('ctx-preview-target-title');
        const lblSpeakForeign = document.getElementById('lbl-ctx-speak-foreign');
        const lblEditForeign = document.getElementById('lbl-ctx-edit-foreign');

        if (previewEs) previewEs.innerText = `"${spanishText}"`;
        if (previewForeign) previewForeign.innerText = `"${foreignText}"`;
        if (titleForeign) {
            const flagImg = document.getElementById('ctx-preview-target-flag');
            const nameSpan = document.getElementById('ctx-preview-target-name');
            if (flagImg) flagImg.src = langInfo.flag || 'flag_en.jpg';
            if (nameSpan) nameSpan.innerText = `${langInfo.name.toUpperCase()} (Interlocutor):`;
            else titleForeign.innerHTML = `<img src="${langInfo.flag || 'flag_en.jpg'}" style="width: 16px; height: 16px; border-radius: 3px; object-fit: cover;" alt="${langInfo.name}"> <span>${langInfo.name.toUpperCase()} (Interlocutor):</span>`;
        }
        if (lblSpeakForeign) lblSpeakForeign.innerText = `Escuchar en ${langInfo.name} (Nativo)`;
        if (lblEditForeign) lblEditForeign.innerText = `Editar ${langInfo.name}`;

        if (modal) modal.classList.remove('hidden');
        history.pushState({ modal: 'trans-context-menu' }, null, '#trans-context-menu');
    },

    closeContextMenu: (skipHistoryBack = false) => {
        const modal = document.getElementById('modal-trans-context-menu');
        if (modal) modal.classList.add('hidden');
        translator.ctxTargetIndex = null;
        if (!skipHistoryBack && history.state && history.state.modal === 'trans-context-menu') {
            history.back();
        }
    },

    onCtxEdit: (side) => {
        const idx = translator.ctxTargetIndex;
        if (idx === null || idx === undefined) return;
        translator.closeContextMenu();
        translator.startEditing(idx, side || 'es');
    },

    onCtxSendToVocab: () => {
        const idx = translator.ctxTargetIndex;
        if (idx === null || idx === undefined) return;
        const spanishText = translator.spanishPhrases[idx] || '';
        const foreignText = translator.foreignPhrases[idx] || '';

        translator.closeContextMenu();
        translator.openVocabModeModal();
        translator.processVocabPair(spanishText, foreignText);
    },

    onCtxSpeakForeign: () => {
        const idx = translator.ctxTargetIndex;
        if (idx === null || idx === undefined) return;
        const foreignText = translator.foreignPhrases[idx] || '';
        translator.closeContextMenu();
        translator.speakWithNativeAccent(foreignText, currentLang);
    },

    onCtxSpeakSpanish: () => {
        const idx = translator.ctxTargetIndex;
        if (idx === null || idx === undefined) return;
        const spanishText = translator.spanishPhrases[idx] || '';
        translator.closeContextMenu();
        translator.speakWithNativeAccent(spanishText, 'es');
    },

    onCtxRetranslate: async () => {
        const idx = translator.ctxTargetIndex;
        if (idx === null || idx === undefined) return;
        translator.closeContextMenu();

        const spanishText = translator.spanishPhrases[idx] || '';
        if (!spanishText) return;

        translator.foreignPhrases[idx] = "Re-traduciendo con IA...";
        translator.renderConversationStreams();
        translator.updateStatusBadge('processing');

        const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
        const prompt = `You are an elite bilingual translator. Translate the following text with maximum accuracy and natural phrasing from Spanish to ${langInfo.name}.
Return ONLY valid JSON:
{
  "translation": "translated text in ${langInfo.name}"
}`;

        await app.callAI_Conversation(
            [
                { role: "system", content: prompt },
                { role: "user", content: `Re-translate accurately: "${spanishText}"` }
            ],
            null,
            (data) => {
                const trans = (data && data.translation ? data.translation : '').trim() || spanishText;
                translator.foreignPhrases[idx] = trans;
                translator.renderConversationStreams();
                if (translator.speakAloudEnabled) {
                    translator.updateStatusBadge('speaking');
                    translator.speakWithNativeAccent(trans, currentLang, () => {
                        translator.updateStatusBadge('ready');
                    });
                } else {
                    translator.updateStatusBadge('ready');
                }
            }
        );
    },

    onCtxCopy: (side) => {
        const idx = translator.ctxTargetIndex;
        if (idx === null || idx === undefined) return;
        const text = (side === 'es') ? translator.spanishPhrases[idx] : translator.foreignPhrases[idx];
        if (text && navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert(`📋 Texto copiado al portapapeles:\n\n"${text}"`);
                translator.closeContextMenu();
            }).catch(() => {
                prompt("Copia el texto:", text);
                translator.closeContextMenu();
            });
        }
    },

    // ====== CONTROL DE MICRÓFONOS (PUSH-TO-TALK POR BOTÓN) ======
    toggleSpanishMic: () => {
        if (translator.editingIndex !== null) {
            translator.finishEditing(false);
        }
        if (translator.activeMic === 'es') {
            stt.finalizeCurrentSession();
            translator.activeMic = null;
            translator.updateCardStates(null);
            translator.updateStatusBadge('ready');
        } else {
            if (translator.activeMic) stt.finalizeCurrentSession();
            translator.startManualListening('es');
        }
    },

    toggleForeignMic: () => {
        if (translator.editingIndex !== null) {
            translator.finishEditing(false);
        }
        if (translator.activeMic === 'target') {
            stt.finalizeCurrentSession();
            translator.activeMic = null;
            translator.updateCardStates(null);
            translator.updateStatusBadge('ready');
        } else {
            if (translator.activeMic) stt.finalizeCurrentSession();
            translator.startManualListening('target');
        }
    },

    startManualListening: (mode) => {
        if (translator.editingIndex !== null) {
            translator.finishEditing(false);
        }

        translator.stopRecognitionOnly();

        if (translator.isSpeaking) {
            window.speechSynthesis.cancel();
            translator.isSpeaking = false;
        }

        translator.activeMic = mode;
        translator.requestWakeLock();
        translator.updateCardStates(mode);
        translator.updateStatusBadge(mode === 'es' ? 'listening_es' : 'listening_target');

        const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
        const targetLang = mode === 'es' ? 'es' : langInfo.code;

        stt.startRecording(
            'trans',
            targetLang,
            (transcript) => {
                translator.activeMic = null;
                translator.updateCardStates(null);
                translator.clearLiveBubbles();
                if (transcript && transcript.trim()) {
                    translator.handleManualSpokenInput(transcript.trim(), mode);
                } else {
                    translator.updateStatusBadge('ready');
                }
            },
            (err) => {
                console.log("Trans mic error:", err);
                translator.activeMic = null;
                translator.updateCardStates(null);
                translator.updateStatusBadge('ready');
                translator.clearLiveBubbles();
            }
        );
    },

    handleManualSpokenInput: async (spokenText, mode) => {
        if (!spokenText || !spokenText.trim()) {
            translator.updateStatusBadge('ready');
            return;
        }

        const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
        const isFromSpanish = mode === 'es';

        if (isFromSpanish) {
            translator.spanishPhrases.push(spokenText);
            translator.foreignPhrases.push("Traduciendo...");
        } else {
            translator.foreignPhrases.push(spokenText);
            translator.spanishPhrases.push("Traduciendo...");
        }

        // Seleccionar automáticamente la nueva frase recién creada
        translator.selectedIndex = translator.spanishPhrases.length - 1;
        translator.renderConversationStreams();
        translator.updateStatusBadge('processing');

        const sourceLang = isFromSpanish ? 'Spanish (Castellano)' : langInfo.name;
        const targetLangName = isFromSpanish ? langInfo.name : 'Spanish (Castellano)';
        const prompt = `You are a STRICT real-time simultaneous translator. Your ONLY job is to translate text from one language to another.

RULES:
1. The source language is: ${sourceLang}
2. The target language is: ${targetLangName}
3. Translate accurately and naturally into ${targetLangName}.
4. Do NOT respond conversationally. Do NOT answer questions. Do NOT add commentary.
5. Return ONLY valid JSON:
{
  "translation": "the translated text here"
}`;

        const thisTransId = ++translator.currentTranslationId;

        await app.callAI_Conversation(
            [
                { role: "system", content: prompt },
                { role: "user", content: `Translate this ${sourceLang} text to ${targetLangName}: "${spokenText}"` }
            ],
            null,
            (data) => {
                if (translator.currentTranslationId !== thisTransId) return;

                const transResult = (data && data.translation ? data.translation : '').trim() || spokenText;
                const lastIdx = translator.spanishPhrases.length - 1;
                if (lastIdx >= 0) {
                    if (isFromSpanish) {
                        translator.foreignPhrases[lastIdx] = transResult;
                    } else {
                        translator.spanishPhrases[lastIdx] = transResult;
                    }
                }
                translator.selectedIndex = lastIdx;
                translator.renderConversationStreams();

                if (translator.speakAloudEnabled) {
                    const speakLang = isFromSpanish ? currentLang : 'es';
                    translator.updateStatusBadge('speaking');
                    translator.speakWithNativeAccent(transResult, speakLang, () => {
                        if (translator.currentTranslationId === thisTransId) {
                            translator.updateStatusBadge('ready');
                        }
                    });
                } else {
                    translator.updateStatusBadge('ready');
                }
            }
        );
    },

    stopSpanishMic: () => {
        if (translator.activeMic === 'es') {
            stt.finalizeCurrentSession();
            translator.activeMic = null;
            translator.updateCardStates(null);
            translator.updateStatusBadge('ready');
            translator.clearLiveBubbles();
        }
    },

    stopForeignMic: () => {
        if (translator.activeMic === 'target') {
            stt.finalizeCurrentSession();
            translator.activeMic = null;
            translator.updateCardStates(null);
            translator.updateStatusBadge('ready');
            translator.clearLiveBubbles();
        }
    },

    // ====== ESTADOS VISUALES DEL BADGE Y TARJETAS ======
    updateStatusBadge: (status) => {
        const badge = document.getElementById('trans-indicator-badge');
        const dot = document.getElementById('trans-indicator-dot');
        const text = document.getElementById('trans-indicator-text');
        if (!badge || !dot || !text) return;

        const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;

        switch (status) {
            case 'listening_es':
                badge.style.borderColor = 'var(--neon-pink)';
                dot.style.background = 'var(--neon-pink)';
                dot.style.animation = 'pulse-mic 1s infinite alternate';
                text.innerText = '🔴 Escuchando en Castellano...';
                text.style.color = 'var(--neon-pink)';
                break;
            case 'listening_target':
                badge.style.borderColor = 'var(--neon-cyan)';
                dot.style.background = 'var(--neon-cyan)';
                dot.style.animation = 'pulse-mic 1s infinite alternate';
                text.innerText = `🔵 Escuchando en ${langInfo.name}...`;
                text.style.color = 'var(--neon-cyan)';
                break;
            case 'editing':
                badge.style.borderColor = 'var(--cyber-warn)';
                dot.style.background = 'var(--cyber-warn)';
                dot.style.animation = 'pulse-mic 0.8s infinite alternate';
                text.innerText = '✏️ Editando transcripción... (Pausa)';
                text.style.color = 'var(--cyber-warn)';
                break;
            case 'processing':
                badge.style.borderColor = 'var(--cyber-warn)';
                dot.style.background = 'var(--cyber-warn)';
                dot.style.animation = 'pulse-mic 0.5s infinite';
                text.innerText = '⚡ Traduciendo con IA...';
                text.style.color = 'var(--cyber-warn)';
                break;
            case 'speaking':
                badge.style.borderColor = 'var(--cyber-ok)';
                dot.style.background = 'var(--cyber-ok)';
                dot.style.animation = 'none';
                text.innerText = '🔊 Reproduciendo traducción...';
                text.style.color = 'var(--cyber-ok)';
                break;
            default: // ready / idle
                badge.style.borderColor = 'rgba(255,255,255,0.15)';
                dot.style.background = '#666';
                dot.style.animation = 'none';
                text.innerText = 'Listo (Pulsa 🎤)';
                text.style.color = '#AAA';
                break;
        }
    },

    updateCardStates: (mode) => {
        const cardEs = document.getElementById('card-spanish-speaker');
        const cardForeign = document.getElementById('card-native-speaker');
        const btnMicEs = document.getElementById('btn-mic-es');
        const btnMicForeign = document.getElementById('btn-mic-foreign');

        if (mode === 'es') {
            if (cardEs) cardEs.classList.add('card-listening-es');
            if (cardForeign) cardForeign.classList.remove('card-listening-foreign');
            if (btnMicEs) btnMicEs.classList.add('listening');
            if (btnMicForeign) btnMicForeign.classList.remove('listening');
        } else if (mode === 'target') {
            if (cardEs) cardEs.classList.remove('card-listening-es');
            if (cardForeign) cardForeign.classList.add('card-listening-foreign');
            if (btnMicEs) btnMicEs.classList.remove('listening');
            if (btnMicForeign) btnMicForeign.classList.add('listening');
        } else {
            if (cardEs) cardEs.classList.remove('card-listening-es');
            if (cardForeign) cardForeign.classList.remove('card-listening-foreign');
            if (btnMicEs) btnMicEs.classList.remove('listening');
            if (btnMicForeign) btnMicForeign.classList.remove('listening');
        }
    },

    // ====== RENDER DE CONVERSACIÓN CON SOPORTE INTERACTIVO ======
    renderConversationStreams: () => {
        const streamEs = document.getElementById('trans-stream-es');
        const streamForeign = document.getElementById('trans-stream-foreign');
        if (!streamEs || !streamForeign) return;

        const total = Math.max(translator.spanishPhrases.length, translator.foreignPhrases.length);
        if (total === 0) {
            streamEs.innerHTML = '<div style="text-align:center; color:#666; font-size:0.85rem; margin:auto;">Pulsa 🎤 abajo para hablar en Castellano...</div>';
            streamForeign.innerHTML = '<div style="text-align:center; color:#666; font-size:0.85rem; margin:auto;">Pulsa 🎤 abajo para que hable el interlocutor...</div>';
            return;
        }

        // Si no hay índice seleccionado explícito o está fuera de rango, activar la última frase
        let activeIdx = translator.selectedIndex;
        if (activeIdx === null || activeIdx === undefined || activeIdx < 0 || activeIdx >= total) {
            activeIdx = total - 1;
            translator.selectedIndex = activeIdx;
        }

        streamEs.innerHTML = translator.spanishPhrases.map((phrase, idx) => {
            const isEditing = (translator.editingIndex === idx && translator.editingSide === 'es');
            if (isEditing) {
                return `
                    <div class="trans-edit-container">
                        <div class="trans-edit-header">
                            <span>✏️ EDITAR TRANSCRIPCIÓN (CASTELLANO)</span>
                            <span class="trans-edit-hint">[Enter] Guardar | [Esc] Cancelar</span>
                        </div>
                        <input type="text" id="trans-edit-input" class="trans-edit-input"
                               value="${translator.escapeHtml(phrase)}"
                               placeholder="Escribe la corrección..."
                               onkeydown="if(event.key==='Enter'){event.preventDefault();translator.finishEditing(true);}else if(event.key==='Escape'){event.preventDefault();translator.finishEditing(false);}"
                               onclick="event.stopPropagation();" />
                        <div class="trans-edit-actions">
                            <span style="font-size:0.72rem; color:#AAA;">Al guardar se re-traducirá con IA</span>
                            <div style="display: flex; gap: 6px;">
                                <button type="button" class="trans-edit-btn-cancel" onclick="event.stopPropagation(); translator.finishEditing(false);" title="Cancelar edición">✕ Cancelar</button>
                                <button type="button" class="trans-edit-btn-save" onclick="event.stopPropagation(); translator.finishEditing(true);" title="Guardar y Re-traducir">✓ Guardar y Traducir</button>
                            </div>
                        </div>
                    </div>
                `;
            }

            const cleanPhrase = (phrase || '').replace(/^-\s*/, '');
            const isSelected = (idx === activeIdx);
            const classes = isSelected ? 'trans-msg-item active-selected-es' : 'trans-msg-item past';
            return `
                <div id="trans-item-es-${idx}" class="${classes}"
                     onclick="translator.onPhraseItemClick(event, ${idx}, 'es')"
                     oncontextmenu="event.preventDefault(); translator.openContextMenu(event, ${idx}, 'es');"
                     ontouchstart="translator.handleTouchStart(event, ${idx}, 'es')"
                     ontouchmove="translator.handleTouchMove(event)"
                     ontouchend="translator.handleTouchEnd(event)"
                     ontouchcancel="translator.handleTouchEnd(event)"
                     title="Clic: Seleccionar / Destacar | ✏️: Editar | Doble clic: Escuchar">
                    <span class="trans-phrase-text">- ${translator.escapeHtml(cleanPhrase)}</span>
                    <button type="button" class="trans-item-edit-btn" onclick="event.stopPropagation(); translator.startEditing(${idx}, 'es');" title="Clic para editar frase">✏️</button>
                </div>
            `;
        }).join('');

        streamForeign.innerHTML = translator.foreignPhrases.map((phrase, idx) => {
            const isEditing = (translator.editingIndex === idx && translator.editingSide === 'target');
            if (isEditing) {
                const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
                return `
                    <div class="trans-edit-container">
                        <div class="trans-edit-header" style="color: var(--neon-cyan);">
                            <span>✏️ EDITAR TRANSCRIPCIÓN (${langInfo.name.toUpperCase()})</span>
                            <span class="trans-edit-hint">[Enter] Guardar | [Esc] Cancelar</span>
                        </div>
                        <input type="text" id="trans-edit-input" class="trans-edit-input"
                               value="${translator.escapeHtml(phrase)}"
                               placeholder="Escribe la corrección..."
                               style="border-color: var(--neon-cyan);"
                               onkeydown="if(event.key==='Enter'){event.preventDefault();translator.finishEditing(true);}else if(event.key==='Escape'){event.preventDefault();translator.finishEditing(false);}"
                               onclick="event.stopPropagation();" />
                        <div class="trans-edit-actions">
                            <span style="font-size:0.72rem; color:#AAA;">Al guardar se re-traducirá al Español con IA</span>
                            <div style="display: flex; gap: 6px;">
                                <button type="button" class="trans-edit-btn-cancel" onclick="event.stopPropagation(); translator.finishEditing(false);" title="Cancelar edición">✕ Cancelar</button>
                                <button type="button" class="trans-edit-btn-save" style="background: rgba(0,243,255,0.22) !important; border-color: var(--neon-cyan) !important;" onclick="event.stopPropagation(); translator.finishEditing(true);" title="Guardar y Re-traducir">✓ Guardar y Traducir</button>
                            </div>
                        </div>
                    </div>
                `;
            }

            const cleanPhrase = (phrase || '').replace(/^-\s*/, '');
            const isSelected = (idx === activeIdx);
            const classes = isSelected ? 'trans-msg-item active-selected-foreign' : 'trans-msg-item past';
            return `
                <div id="trans-item-foreign-${idx}" class="${classes}"
                     onclick="translator.onPhraseItemClick(event, ${idx}, 'target')"
                     oncontextmenu="event.preventDefault(); translator.openContextMenu(event, ${idx}, 'target');"
                     ontouchstart="translator.handleTouchStart(event, ${idx}, 'target')"
                     ontouchmove="translator.handleTouchMove(event)"
                     ontouchend="translator.handleTouchEnd(event)"
                     ontouchcancel="translator.handleTouchEnd(event)"
                     title="Clic: Seleccionar / Destacar | ✏️: Editar | Doble clic: Escuchar">
                    <span class="trans-phrase-text">- ${translator.escapeHtml(cleanPhrase)}</span>
                    <button type="button" class="trans-item-edit-btn" onclick="event.stopPropagation(); translator.startEditing(${idx}, 'target');" title="Clic para editar frase">✏️</button>
                </div>
            `;
        }).join('');

        // Auto-scroll al final de ambas columnas para mantener visible la última frase
        requestAnimationFrame(() => {
            if (translator.editingIndex === null) {
                streamEs.scrollTop = streamEs.scrollHeight;
                streamForeign.scrollTop = streamForeign.scrollHeight;
            }
        });
    },

    onLiveInterim: (liveText) => {
        if (!liveText) return;
        const liveEsEl = document.getElementById('trans-live-es');
        const liveForeignEl = document.getElementById('trans-live-foreign');

        if (translator.activeMic === 'es') {
            if (liveEsEl) {
                liveEsEl.innerHTML = `<strong>- ${liveText}</strong> <span style="animation: pulse-mic 0.8s infinite;">▍</span>`;
                liveEsEl.classList.remove('hidden');
            }
            if (liveForeignEl) {
                liveForeignEl.innerHTML = `<span style="opacity: 0.65; color: var(--neon-cyan);">- Escuchando...</span>`;
                liveForeignEl.classList.remove('hidden');
            }
        } else if (translator.activeMic === 'target') {
            if (liveForeignEl) {
                liveForeignEl.innerHTML = `<strong>- ${liveText}</strong> <span style="animation: pulse-mic 0.8s infinite;">▍</span>`;
                liveForeignEl.classList.remove('hidden');
            }
            if (liveEsEl) {
                liveEsEl.innerHTML = `<span style="opacity: 0.65; color: var(--neon-pink);">- Escuchando...</span>`;
                liveEsEl.classList.remove('hidden');
            }
        }
    },

    clearLiveBubbles: () => {
        const liveEsEl = document.getElementById('trans-live-es');
        const liveForeignEl = document.getElementById('trans-live-foreign');
        if (liveEsEl) liveEsEl.classList.add('hidden');
        if (liveForeignEl) liveForeignEl.classList.add('hidden');
    },

    // Reproduce la frase actualmente seleccionada (o la última si no hay selección)
    speakSpanishStream: () => {
        const total = translator.spanishPhrases.length;
        if (total === 0) return;
        const activeIdx = (translator.selectedIndex !== null && translator.selectedIndex >= 0 && translator.selectedIndex < total)
            ? translator.selectedIndex
            : total - 1;
        const phrase = translator.spanishPhrases[activeIdx];
        if (!phrase || phrase === 'Traduciendo...') return;

        const btn = document.getElementById('btn-speaker-es');
        if (btn) {
            btn.style.transform = 'scale(1.15)';
            setTimeout(() => { if (btn) btn.style.transform = 'scale(1)'; }, 180);
        }

        translator.speakWithNativeAccent(phrase, 'es');
    },

    speakForeignStream: () => {
        const total = translator.foreignPhrases.length;
        if (total === 0) return;
        const activeIdx = (translator.selectedIndex !== null && translator.selectedIndex >= 0 && translator.selectedIndex < total)
            ? translator.selectedIndex
            : total - 1;
        const phrase = translator.foreignPhrases[activeIdx];
        if (!phrase || phrase === 'Traduciendo...') return;

        const btn = document.getElementById('btn-speaker-foreign');
        if (btn) {
            btn.style.transform = 'scale(1.15)';
            setTimeout(() => { if (btn) btn.style.transform = 'scale(1)'; }, 180);
        }

        translator.speakWithNativeAccent(phrase, currentLang);
    },

    // ====== TOGGLE DE VOZ ALTA (TTS) ======
    toggleSpeakAloud: () => {
        translator.speakAloudEnabled = !translator.speakAloudEnabled;
        translator.syncSpeakAloudUI();
        if (!translator.speakAloudEnabled) {
            if (typeof audio !== 'undefined' && audio.stopSpeech) audio.stopSpeech();
            else window.speechSynthesis.cancel();
            translator.isSpeaking = false;
        }
    },

    // ====== MOTOR DE VOZ NATIVO ULTRA-PRECISO ======
    speakWithNativeAccent: (text, langCode, onEnd) => {
        if (!text || !text.trim() || text === 'Traduciendo...') {
            if (onEnd) onEnd();
            return;
        }
        translator.stopRecognitionOnly();
        translator.isSpeaking = true;
        if (typeof audio !== 'undefined' && audio.stopSpeech) {
            audio.stopSpeech();
        } else {
            window.speechSynthesis.cancel();
        }

        const handleEnd = () => {
            translator.isSpeaking = false;
            if (onEnd) onEnd();
        };

        if (typeof audio !== 'undefined' && audio.speakNative) {
            audio.speakNative(text, langCode, handleEnd, translator.speed || 0.85);
        } else {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = langCode === 'es' ? 'es-ES' : (LANGUAGES[langCode]?.speechLang || 'en-US');
            u.onend = handleEnd;
            u.onerror = handleEnd;
            window.speechSynthesis.speak(u);
        }
    },

    // ====== SELECTOR DESPLEGABLE DE IDIOMAS (2 COLUMNAS PARA MODO APAISADO) ======
    toggleLanguageDropdown: () => {
        const dropdown = document.getElementById('trans-lang-dropdown');
        if (!dropdown) return;

        translator.langDropdownOpen = !translator.langDropdownOpen;

        if (translator.langDropdownOpen) {
            let html = '';
            for (const [code, info] of Object.entries(LANGUAGES)) {
                const isActive = code === currentLang;
                html += `
                    <div onclick="translator.switchTranslatorLang('${code}')" style="display: flex; align-items: center; gap: 8px; padding: 7px 8px; cursor: pointer; border-radius: 6px; background: ${isActive ? 'rgba(0,243,255,0.22)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isActive ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)'}; transition: all 0.15s; user-select: none;"
                        onmouseover="this.style.background='rgba(0,243,255,0.15)'; this.style.borderColor='var(--neon-cyan)';"
                        onmouseout="this.style.background='${isActive ? 'rgba(0,243,255,0.22)' : 'rgba(255,255,255,0.03)'}'; this.style.borderColor='${isActive ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)'}';">
                        <img src="${info.flag}" style="width: 22px; height: 22px; border-radius: 4px; object-fit: cover; flex-shrink: 0;" alt="${info.name}">
                        <span style="font-weight: ${isActive ? '900' : '600'}; color: ${isActive ? 'var(--neon-cyan)' : '#DDD'}; font-size: 0.83rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${info.name}</span>
                        ${isActive ? '<span style="color: var(--cyber-ok); font-weight: bold; margin-left: auto; font-size: 0.8rem;">✓</span>' : ''}
                    </div>
                `;
            }
            dropdown.innerHTML = html;
            dropdown.classList.remove('hidden');
            history.pushState({ modal: 'trans-lang-dropdown' }, null, '#trans-lang-dropdown');
        } else {
            dropdown.classList.add('hidden');
            if (history.state && history.state.modal === 'trans-lang-dropdown') {
                history.back();
            }
        }
    },

    switchTranslatorLang: (langCode) => {
        if (!LANGUAGES[langCode]) return;
        translator.stop();
        currentLang = langCode;
        localStorage.setItem('jetbulary_current_lang', langCode);

        translator.init();

        if (typeof game !== 'undefined' && game.updateAvatar) game.updateAvatar();
        if (typeof app !== 'undefined' && app.updateHeaderTranslatorBtn) app.updateHeaderTranslatorBtn();

        translator.langDropdownOpen = false;
        const dropdown = document.getElementById('trans-lang-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
        if (history.state && history.state.modal === 'trans-lang-dropdown') {
            history.back();
        }

        translator.spanishPhrases = [];
        translator.foreignPhrases = [];
        translator.selectedIndex = null;
        translator.editingIndex = null;
        translator.editingSide = null;
        translator.renderConversationStreams();
    },

    // ====== DETENCIÓN Y CONTROL GENERAL ======
    stopRecognitionOnly: () => {
        stt.stop();
        translator.activeMic = null;
        translator.clearLiveBubbles();
    },

    stop: () => {
        translator.stopRecognitionOnly();
        translator.isSpeaking = false;
        window.speechSynthesis.cancel();
        translator.clearLiveBubbles();
        translator.updateCardStates(null);
        translator.editingIndex = null;
        translator.editingSide = null;
    },

    requestWakeLock: async () => {
        if ('wakeLock' in navigator) {
            try { translator.wakeLock = await navigator.wakeLock.request('screen'); }
            catch(e) { console.log("WakeLock error:", e); }
        }
    },

    exitToDashboard: (fromPopstate = false) => {
        translator.stop();
        if (typeof audio !== 'undefined' && audio.stopSpeech) audio.stopSpeech();
        else window.speechSynthesis.cancel();

        window.removeEventListener('resize', translator.checkOrientation);
        window.removeEventListener('orientationchange', translator.checkOrientation);

        const transView = document.getElementById('view-translator');
        if (transView) {
            transView.classList.add('hidden');
            transView.classList.remove('apaisado-forced');
        }

        const dropdown = document.getElementById('trans-lang-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
        translator.langDropdownOpen = false;

        const ctxMenu = document.getElementById('modal-trans-context-menu');
        if (ctxMenu) ctxMenu.classList.add('hidden');

        const vocabModal = document.getElementById('modal-vocab-ai-mode');
        if (vocabModal) vocabModal.classList.add('hidden');

        if (screen.orientation && screen.orientation.unlock) {
            try { screen.orientation.unlock(); } catch(e){}
        }
        if (translator.wakeLock) {
            try { translator.wakeLock.release(); } catch(e){}
            translator.wakeLock = null;
        }
        translator.editingIndex = null;
        translator.editingSide = null;

        // Si venimos del botón CANCELAR en pantalla y la URL está en #translator, sincronizar hash
        if (!fromPopstate && window.location.hash === '#translator') {
            try {
                history.replaceState({ view: 'view-dashboard' }, null, '#dashboard');
            } catch(e) {}
        }

        app.showDashboard('none');
    },

    // ====== MODO VOCABULARIO ASISTIDO POR IA (DESDE MICRÓFONO O DESDE SELECCIÓN) ======
    openVocabModeModal: () => {
        translator.stop();
        const modal = document.getElementById('modal-vocab-ai-mode');
        if (modal) {
            modal.classList.remove('hidden');
            const resultBox = document.getElementById('vocab-ai-result-box');
            const successMsg = document.getElementById('vocab-ai-success-msg');
            if (resultBox) resultBox.classList.add('hidden');
            if (successMsg) successMsg.classList.add('hidden');
            translator.pendingVocabData = null;
            history.pushState({ modal: 'vocab-mode' }, null, '#vocab-mode');
        }
    },

    closeVocabModeModal: (skipHistoryBack = false) => {
        translator.stopVocabMic();
        const modal = document.getElementById('modal-vocab-ai-mode');
        if (modal) modal.classList.add('hidden');
        translator.pendingVocabData = null;
        if (!skipHistoryBack && history.state && history.state.modal === 'vocab-mode') {
            history.back();
        }
    },

    toggleVocabModeMic: () => {
        if (translator.isVocabMicActive) {
            translator.stopVocabMic();
        } else {
            translator.startVocabMic();
        }
    },

    startVocabMic: () => {
        translator.stop();
        translator.isVocabMicActive = true;
        const btn = document.getElementById('btn-vocab-ai-mic');
        const lbl = document.getElementById('lbl-vocab-ai-mic');
        if (btn) {
            btn.classList.add('listening');
            btn.style.borderColor = 'var(--cyber-warn)';
        }
        if (lbl) lbl.innerText = 'ESCUCHANDO PALABRA EN ESPAÑOL...';

        stt.startRecording(
            'trans',
            'es',
            (transcript) => {
                translator.isVocabMicActive = false;
                if (btn) { btn.classList.remove('listening'); btn.style.borderColor = 'var(--cyber-ok)'; }
                if (lbl) lbl.innerText = 'TOCAR PARA DECIR OTRA PALABRA';
                if (transcript && transcript.trim()) {
                    translator.processVocabWord(transcript.trim());
                }
            },
            (err) => {
                console.log("Vocab mic error:", err);
                translator.isVocabMicActive = false;
                if (btn) { btn.classList.remove('listening'); btn.style.borderColor = 'var(--cyber-ok)'; }
                if (lbl) lbl.innerText = 'TOCAR PARA DECIR PALABRA';
            }
        );
    },

    stopVocabMic: () => {
        stt.stop();
        translator.isVocabMicActive = false;
        const btn = document.getElementById('btn-vocab-ai-mic');
        const lbl = document.getElementById('lbl-vocab-ai-mic');
        if (btn) { btn.classList.remove('listening'); btn.style.borderColor = 'var(--cyber-ok)'; }
        if (lbl) lbl.innerText = 'TOCAR PARA DECIR PALABRA';
    },

    processVocabWord: async (spanishWord) => {
        if (!spanishWord) return;
        translator.processVocabPair(spanishWord, '');
    },

    // Procesa un par de palabras o una palabra y propone inteligentemente la lista
    processVocabPair: async (spanishText, foreignText) => {
        if (!spanishText && !foreignText) return;
        const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
        const existingTopics = db.topics.filter(t => (t.lang || 'en') === currentLang);
        const topicNames = existingTopics.map(t => t.name);

        const resultBox = document.getElementById('vocab-ai-result-box');
        const spanishEl = document.getElementById('vocab-ai-spanish-word');
        const targetEl = document.getElementById('vocab-ai-target-word');
        const ipaEl = document.getElementById('vocab-ai-ipa');
        const msgEl = document.getElementById('vocab-ai-message');
        const successMsg = document.getElementById('vocab-ai-success-msg');
        const actionBtns = document.getElementById('vocab-ai-action-buttons');

        if (resultBox) resultBox.classList.remove('hidden');
        if (successMsg) successMsg.classList.add('hidden');
        if (actionBtns) actionBtns.classList.remove('hidden');
        if (spanishEl) spanishEl.innerText = `"${spanishText || '...'}"`;
        if (targetEl) targetEl.innerText = foreignText ? `"${foreignText}"` : "Analizando con IA...";
        if (ipaEl) ipaEl.innerText = "";
        if (msgEl) msgEl.innerText = "Categorizando temática y buscando la mejor lista con IA...";

        const prompt = `You are an expert vocabulary curator and language teacher for ${langInfo.name}.
Input expression to categorize and add to vocabulary:
- Spanish: "${spanishText}"
- ${langInfo.name}: "${foreignText}"

Existing topic lists in the student's database for ${langInfo.name}: ${JSON.stringify(topicNames)}.

TASKS:
1. Provide the clean, precise dictionary/vocabulary form in ${langInfo.name} ("translated").
2. Provide the clean Spanish equivalent ("spanish").
3. Provide IPA phonetic transcription for the target word ("ipa").
4. Provide an inspiring example sentence in ${langInfo.name} ("sentence_target") and its Spanish translation ("sentence_es").
5. Intelligent Categorization:
   - Match with the most fitting existing topic from the provided list if appropriate.
   - If NONE is a great fit, create a concise, thematic, UPPERCASE new topic name in Spanish (e.g., "VIAJES", "EXPRESIONES COTIDIANAS", "REUNIONES Y NEGOCIOS").
6. Formulate a friendly question in Spanish asking confirmation to save.

Return ONLY valid JSON:
{
  "spanish": "word/phrase in Spanish",
  "translated": "word/phrase in ${langInfo.name}",
  "ipa": "/phonetics/",
  "sentence_target": "example sentence in ${langInfo.name}",
  "sentence_es": "example sentence in Spanish",
  "selectedTopic": "TOPIC NAME IN UPPERCASE",
  "isNewTopic": false,
  "aiQuestion": "question in Spanish"
}`;

        await app.callAI_Conversation(
            [
                { role: "system", content: prompt },
                { role: "user", content: `Process and categorize for vocabulary: Spanish: "${spanishText}", Target: "${foreignText}"` }
            ],
            null,
            (data) => {
                if (!data || !data.translated) return;
                translator.pendingVocabData = data;

                if (spanishEl) spanishEl.innerText = `"${data.spanish || spanishText}"`;
                if (targetEl) targetEl.innerText = `"${data.translated}"`;
                if (ipaEl) ipaEl.innerText = data.ipa || '';
                if (msgEl) msgEl.innerText = data.aiQuestion || `He seleccionado la lista temática "${data.selectedTopic}". ¿Deseas guardarla ahí?`;

                const confirmBtnLbl = document.getElementById('lbl-vocab-ai-confirm');
                if (confirmBtnLbl) confirmBtnLbl.innerText = `Sí, Guardar en "${data.selectedTopic}"`;

                translator.speakWithNativeAccent(data.aiQuestion || `He seleccionado la lista temática ${data.selectedTopic}`, 'es');
            }
        );
    },

    confirmAddVocabWord: () => {
        const data = translator.pendingVocabData;
        if (!data) return;

        const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
        let topicObj = db.topics.find(t => (t.lang || 'en') === currentLang && t.name.toLowerCase() === (data.selectedTopic || '').toLowerCase());
        if (!topicObj) {
            topicObj = { id: Date.now(), name: (data.selectedTopic || 'VOCABULARIO GENERAL').toUpperCase(), lang: currentLang };
            db.topics.push(topicObj);
        }

        let wordId = Date.now() + Math.floor(Math.random() * 1000);
        let existing = db.words.find(w => w.topic_id === topicObj.id && (w.english.toLowerCase() === data.translated.toLowerCase() || w.spanish.toLowerCase() === data.spanish.toLowerCase()));
        if (!existing) {
            db.words.push({
                id: wordId,
                topic_id: topicObj.id,
                english: data.translated,
                spanish: data.spanish,
                ipa: data.ipa || '',
                sentence_en: data.sentence_target || data.translated,
                sentence_es: data.sentence_es || data.spanish
            });
            app.saveDB();
            app.renderDashboardLists();
        } else {
            wordId = existing.id;
        }

        const successMsg = document.getElementById('vocab-ai-success-msg');
        const actionBtns = document.getElementById('vocab-ai-action-buttons');
        if (actionBtns) actionBtns.classList.add('hidden');
        if (successMsg) {
            successMsg.innerHTML = `⭐ ¡Expresión <strong>"${data.translated}"</strong> guardada con éxito en <strong>${topicObj.name}</strong>!<br><span style="font-size:0.82rem; color:#FFF;">Abriendo pantalla de vocabulario para practicar...</span>`;
            successMsg.classList.remove('hidden');
        }

        translator.speakWithNativeAccent(data.translated, currentLang, () => {
            setTimeout(() => {
                translator.closeVocabModeModal();
                if (screen.orientation && screen.orientation.unlock) {
                    try { screen.orientation.unlock(); } catch(e){}
                }
                if (translator.wakeLock) {
                    try { translator.wakeLock.release(); } catch(e){}
                    translator.wakeLock = null;
                }
                
                vocab.activeTopicId = topicObj.id;
                vocab.searchQuery = '';
                app.switchView('view-vocab');
                vocab.render();

                setTimeout(() => {
                    const targetWordText = data.translated.toLowerCase();
                    document.querySelectorAll('.vocab-item').forEach(el => {
                        if (el.textContent.toLowerCase().includes(targetWordText)) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.style.border = '2px solid var(--cyber-ok)';
                            el.style.boxShadow = '0 0 25px rgba(0,255,149,0.7)';
                        }
                    });
                }, 250);
            }, 800);
        });
    },

    confirmAddNewTopicVocabWord: () => {
        const data = translator.pendingVocabData;
        if (!data) return;

        const newTopicName = prompt("Escribe el nombre de la nueva lista temática:", data.selectedTopic || "NUEVA LISTA");
        if (!newTopicName || !newTopicName.trim()) return;

        data.selectedTopic = newTopicName.trim().toUpperCase();
        translator.confirmAddVocabWord();
    }
};

// Cerrar dropdown de idiomas al hacer clic fuera
document.addEventListener('click', (e) => {
    if (translator.langDropdownOpen) {
        const dropdown = document.getElementById('trans-lang-dropdown');
        const btn = document.getElementById('btn-trans-lang-select');
        if (dropdown && !dropdown.contains(e.target) && btn && !btn.contains(e.target)) {
            dropdown.classList.add('hidden');
            translator.langDropdownOpen = false;
        }
    }
});

window.translator = translator;
