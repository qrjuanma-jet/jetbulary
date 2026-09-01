// ====== CONVERSATION & AI PRONUNCIATION ANALYZER ======
    const conversation = {
        history: [], turn: 0, recognition: null, autoMic: true, expectedText: '', expectedTrans: '', targetWords: [],
        convoType: 'lesson', currentLessonFailures: 0, bestScoreThisExercise: 0, bestPointsThisExercise: 0,

        repeat: () => { 
            if (conversation.expectedText) game.speakText(conversation.expectedText);
            else if (game.lastText) game.speakText(game.lastText); 
        },
        repeatSlow: () => { 
            if (conversation.expectedText) game.speakText(conversation.expectedText, 0.35);
            else if (game.lastText) game.speakText(game.lastText, 0.35); 
        },

        setAutoMic: (state) => {
            conversation.autoMic = state;
            const btnOn = document.getElementById('btn-convo-auto-on');
            const btnOff = document.getElementById('btn-convo-auto-off');
            if (btnOn && btnOff) { btnOn.className = state ? 'auto-mic-on' : 'secondary'; btnOff.className = state ? 'secondary' : 'auto-mic-on'; }
        },

        start: async (words, topicTitle = "Lesson Practice", lessonMode = 'standard') => {
            if (!words || words.length === 0) return alert("No words to practice.");
            conversation.targetWords = words;
            conversation.convoType = 'lesson';
            conversation.lessonMode = lessonMode;
            conversation.currentLessonFailures = 0;
            conversation.bestScoreThisExercise = 0;
            conversation.bestPointsThisExercise = 0;
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const wordsList = words.map(w => w.english.includes('(') ? w.english.split('(')[0].trim() : w.english).join(', ');

            app.switchView('view-conversation');
            game.updateAvatar();
            document.getElementById('conversation-topic-title').innerText = topicTitle;

            const historyEl = document.getElementById('conversation-history');
            const modeDesc = lessonMode === 'grammar' ? (langInfo.grammarBtnLabel || 'Gramática') : lessonMode === 'pronunciation' ? (langInfo.pronunciationBtnLabel || 'Pronunciación') : (langInfo.lessonBtnLabel || 'Lección');
            historyEl.innerHTML = `<p style="color: var(--cyber-warn);">🎓 ${langInfo.teacherName} está preparando tu lección de ${modeDesc} en ${langInfo.name}...</p>`;
            document.getElementById('convo-spoken-text').innerText = '...';

            conversation.history = [];
            conversation.turn = 0;
            conversation.autoMic = true;
            conversation.setAutoMic(true);

            const levelMap = ["Beginner (A0)", "Elementary (A1-A2)", "Intermediate (B1)", "Advanced (B2)", "Native (C1+)"];
            const currentLevelNum = db.academy_level || 0;
            const level = levelMap[currentLevelNum];
            const isAdvanced = currentLevelNum >= 3;

            let specificInstructions = '';
            if (lessonMode === 'grammar') {
                specificInstructions = `SPECIAL FOCUS: GRAMMAR LESSON (${langInfo.grammarBtnLabel || 'Grammar'}). Select a key grammatical pattern, connector, verb tense, or structural rule associated with these words for level ${level}. In 'focus_tip', provide a brief 1-sentence explanation of the grammar rule in Spanish.`;
            } else if (lessonMode === 'pronunciation') {
                specificInstructions = `SPECIAL FOCUS: PRONUNCIATION LESSON (${langInfo.pronunciationBtnLabel || 'Pronunciation'}). Select a key phonetic sound, IPA vowel distinction, linking trick, or word stress rule of these words for level ${level}. In 'focus_tip', provide a brief 1-sentence native articulation trick in Spanish.`;
            } else {
                specificInstructions = `SPECIAL FOCUS: GENERAL LESSON PRACTICE (${langInfo.lessonBtnLabel || 'Lesson'}). Create a natural, clear sentence using the vocabulary in everyday context.`;
            }

            const systemPrompt = `You are ${langInfo.teacherName}, a friendly and expert native ${langInfo.aiPromptLang} teacher.
The student is practicing these vocabulary words: ${wordsList}.
Their academic level is ${level}.
${specificInstructions}

YOUR TASK:
Create a SINGLE, VERY SHORT, and natural sentence in ${langInfo.aiPromptLang} (MAXIMUM 4 TO 7 WORDS TOTAL) practicing the target words under the specified focus.
The sentence MUST be extremely easy, clear, and quick for the student to pronounce in a single breath without feeling rushed.
Also provide its Spanish translation and focus tip if applicable.

CRITICAL: Respond ONLY with a valid JSON object:
{
  "speech": "Your short 4-7 word sentence in ${langInfo.aiPromptLang}",
  "speech_trans": "Traducción completa al español",
  "focus_tip": "Breve consejo o regla clave en español (opcional)"
}`;

            const userPrompt = `Create ONE very short practice sentence (4 to 7 words maximum) for: ${wordsList} (Focus: ${lessonMode}).`;

            await app.callAI_Conversation([{role: "system", content: systemPrompt}, {role: "user", content: userPrompt}], null, (data) => {
                conversation.expectedText = data.speech;
                conversation.expectedTrans = data.speech_trans || '';
                conversation.history.push({ role: 'teacher', content: data.speech, trans: data.speech_trans });

                const wordsChips = words.map(w => {
                    const clean = w.english.includes('(') ? w.english.split('(')[0].trim() : w.english;
                    return `<span class="tech" style="display:inline-block; margin:2px 4px; padding:3px 8px; font-size:0.75rem; border:1px solid var(--neon-cyan); color:var(--neon-cyan); border-radius:3px; background:rgba(0,243,255,0.08);">${clean}</span>`;
                }).join('');

                const teacherAudioMarkup = isAdvanced ? `
                    <div class="convo-msg convo-msg-teacher" id="convo-teacher-text-container">
                        <strong>🔊 ${langInfo.teacherName} (${langInfo.teacherTitle}):</strong><br>
                        <div id="convo-teacher-foreign-text" style="margin-top:8px; font-size: 1.15rem; color: #FFF; line-height: 1.6;">${data.speech}</div>
                        <div id="convo-teacher-hidden-hint" class="hidden" style="margin-top:6px; font-size: 0.9rem; color: #888; font-style: italic;">🎧 [En nivel B2+, el texto en ${langInfo.name} se oculta durante tu turno. Traduce el texto en castellano al ${langInfo.name}]</div>
                    </div>
                ` : `
                    <div class="convo-msg convo-msg-teacher">
                        <strong>🔊 ${langInfo.teacherName} (Escucha atentamente):</strong><br>
                        <div style="margin-top:8px; font-size: 1.15rem; color: #FFF; line-height: 1.6;">${data.speech}</div>
                    </div>
                `;

                const focusTipMarkup = data.focus_tip ? `
                    <div class="convo-msg convo-msg-system" style="border-left-color: ${lessonMode === 'grammar' ? 'var(--neon-cyan)' : lessonMode === 'pronunciation' ? 'var(--neon-pink)' : 'var(--cyber-ok)'};">
                        <strong>${lessonMode === 'grammar' ? '📚 Regla Gramatical:' : lessonMode === 'pronunciation' ? '🗣️ Truco de Pronunciación:' : '💡 Clave de la Lección:'}</strong><br>
                        <div style="margin-top: 5px; color: #FFF; font-size: 0.92rem; line-height: 1.4;">${data.focus_tip}</div>
                    </div>
                ` : '';

                historyEl.innerHTML = `
                    <div class="convo-msg convo-msg-system">
                        🎯 <strong>Palabras Objetivo:</strong><br>
                        <div style="margin-top:6px;">${wordsChips}</div>
                    </div>
                    ${focusTipMarkup}
                    ${teacherAudioMarkup}
                    <div class="convo-msg convo-msg-system" style="border-left-color: var(--neon-pink);">
                        <strong>📖 Texto en castellano${isAdvanced ? ` (Dilo en ${langInfo.name}):` : ':'}</strong><br>
                        <div style="margin-top: 6px; font-size: 1.05rem; color: var(--neon-pink); font-weight: ${isAdvanced ? '600' : 'normal'};">${data.speech_trans}</div>
                    </div>
                    <div class="convo-msg convo-msg-system">🎤 <strong>Tu turno:</strong> Pulsa el micrófono y di la frase en ${langInfo.name} como la profesora.</div>
                `;

                game.speakText(data.speech);

                // For B2+, hide foreign text once speech finishes
                if (isAdvanced) {
                    setTimeout(() => {
                        const foreignEl = document.getElementById('convo-teacher-foreign-text');
                        const hintEl = document.getElementById('convo-teacher-hidden-hint');
                        if (foreignEl) foreignEl.classList.add('hidden');
                        if (hintEl) hintEl.classList.remove('hidden');
                    }, Math.max(3000, data.speech.length * 90));
                }
            });
        },

        startFreeConversation: async () => {
            conversation.convoType = 'free';
            conversation.bestScoreThisExercise = 0;
            conversation.bestPointsThisExercise = 0;
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const learnedWords = db.words.filter(w => {
                const prog = db.progress.find(p => p.word_id === w.id);
                return prog && prog.successes >= 1;
            }).slice(-12);

            const wordsList = learnedWords.map(w => w.english.includes('(') ? w.english.split('(')[0].trim() : w.english).join(', ');

            app.switchView('view-conversation');
            game.updateAvatar();
            document.getElementById('conversation-topic-title').innerText = `Free Conversation (Level B2+) - ${langInfo.teacherName}`;

            const historyEl = document.getElementById('conversation-history');
            historyEl.innerHTML = `<p style="color: var(--cyber-warn);">🎙️ ${langInfo.teacherName} está iniciando una conversación en ${langInfo.name} contrastando conceptos con el castellano...</p>`;
            document.getElementById('convo-spoken-text').innerText = '...';

            conversation.history = [];
            conversation.turn = 0;
            conversation.autoMic = true;
            conversation.setAutoMic(true);

            const systemPrompt = `You are ${langInfo.teacherName}, an expert native ${langInfo.aiPromptLang} teacher conversing with an advanced B2/C1 Spanish speaker.
Your goal is to have a dynamic, engaging spoken dialogue.
Contrast interesting grammar/idiomatic structures between Spanish and ${langInfo.aiPromptLang}.
Occasionally prompt the student to use some recently learned terms: ${wordsList || 'modern topics'}.

CRITICAL:
Keep your spoken output to 2-3 sentences max.
Respond ONLY with a valid JSON object:
{
  "speech": "Your 2-3 sentences in ${langInfo.aiPromptLang}",
  "speech_trans": "Traducción al español",
  "grammar_contrast": "Nota breve sobre contraste gramatical con el castellano"
}`;

            await app.callAI_Conversation([{role: "system", content: systemPrompt}, {role: "user", content: "Start our conversational lesson."}], null, (data) => {
                conversation.expectedText = data.speech;
                conversation.expectedTrans = data.speech_trans || '';
                conversation.history.push({ role: 'teacher', content: data.speech, trans: data.speech_trans });

                historyEl.innerHTML = `
                    <div class="convo-msg convo-msg-teacher">
                        <strong>🔊 ${langInfo.teacherName}:</strong><br>
                        <div style="margin-top:8px; font-size: 1.15rem; color: #FFF; line-height: 1.6;">${data.speech}</div>
                        ${data.grammar_contrast ? `<div style="margin-top:6px; font-size:0.85rem; color:var(--cyber-warn);">💡 <strong>Gramática vs Español:</strong> ${data.grammar_contrast}</div>` : ''}
                    </div>
                    <div class="convo-msg convo-msg-system">🎤 <strong>Responde a ${langInfo.teacherName} en ${langInfo.name}:</strong></div>
                `;

                conversation.scrollThreeLineWindow();
                game.speakText(data.speech);
            });
        },

        startLevelAssessment: async () => {
            if (typeof game !== 'undefined' && game.primeAudio) game.primeAudio();
            conversation.convoType = 'assessment';
            conversation.assessmentTurn = 0;
            conversation.assessmentHistory = [];
            conversation.assessmentRemainingSeconds = 110;
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;

            app.switchView('view-conversation');
            game.updateAvatar();
            document.getElementById('conversation-topic-title').innerText = `🎯 Level Assessment (< 2 min) - ${langInfo.teacherName}`;

            const banner = document.getElementById('assessment-timer-banner');
            if (banner) banner.classList.remove('hidden');

            const countdownEl = document.getElementById('assessment-countdown-text');
            if (countdownEl) countdownEl.innerText = "01:50";

            if (conversation.assessmentTimerInterval) clearInterval(conversation.assessmentTimerInterval);
            conversation.assessmentTimerInterval = setInterval(() => {
                conversation.assessmentRemainingSeconds--;
                const mins = String(Math.floor(Math.max(0, conversation.assessmentRemainingSeconds) / 60)).padStart(2, '0');
                const secs = String(Math.max(0, conversation.assessmentRemainingSeconds) % 60).padStart(2, '0');
                const textEl = document.getElementById('assessment-countdown-text');
                if (textEl) textEl.innerText = `${mins}:${secs}`;
                if (conversation.assessmentRemainingSeconds <= 0) {
                    conversation.finishLevelAssessment();
                }
            }, 1000);

            const historyEl = document.getElementById('conversation-history');
            historyEl.innerHTML = `<p style="color: var(--cyber-warn);">🎙️ ${langInfo.teacherName} está preparando tu prueba de nivel de 2 minutos en ${langInfo.name}...</p>`;
            document.getElementById('convo-spoken-text').innerText = '...';

            conversation.history = [];
            conversation.turn = 0;
            conversation.autoMic = true;
            conversation.setAutoMic(true);

            const systemPrompt = `You are ${langInfo.teacherName}, a warm, friendly and expert ${langInfo.aiPromptLang} evaluator conducting a rapid 2-minute spoken CEFR placement interview.
Your goal is to test the student's speaking ability progressively.

FIRST QUESTION (Tier 1 - Elementary / Icebreaker):
1. Greet the student warmly in ${langInfo.aiPromptLang}.
2. Ask an introductory question (e.g. name, where they are from, or what they do/like).
3. Keep it under 2 short sentences.

Respond ONLY with a valid JSON object:
{
  "speech": "Your warm greeting and introductory question in ${langInfo.aiPromptLang}",
  "speech_trans": "Traducción completa al español"
}`;

            await app.callAI_Conversation([{role: "system", content: systemPrompt}, {role: "user", content: "Start the level assessment test."}], null, (data) => {
                conversation.expectedText = data.speech;
                conversation.expectedTrans = data.speech_trans || '';
                conversation.assessmentHistory.push({ role: 'teacher', content: data.speech });

                historyEl.innerHTML = `
                    <div class="convo-msg convo-msg-teacher">
                        <strong>🔊 ${langInfo.teacherName} (Pregunta 1/3 - Introducción):</strong><br>
                        <div style="margin-top:8px; font-size: 1.15rem; color: #FFF; line-height: 1.6;">${data.speech}</div>
                        <div style="margin-top:6px; font-size:0.85rem; color:var(--neon-pink);">📝 ${data.speech_trans}</div>
                    </div>
                    <div class="convo-msg convo-msg-system">🎤 <strong>Tu turno:</strong> Responde en ${langInfo.name} de la forma más completa y natural posible.</div>
                `;

                conversation.scrollThreeLineWindow();
                game.speakText(data.speech);
            });
        },

        nextAssessmentTurn: async (studentSpeech) => {
            conversation.assessmentHistory.push({ role: 'user', content: studentSpeech });
            conversation.assessmentTurn++;

            if (conversation.assessmentTurn >= 3 || conversation.assessmentRemainingSeconds <= 10) {
                conversation.finishLevelAssessment();
                return;
            }

            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const historyEl = document.getElementById('conversation-history');
            const turnNum = conversation.assessmentTurn + 1;
            const tierLabel = turnNum === 2 ? "Experiencias y Rutinas (B1)" : "Opiniones y Situaciones Hipotéticas (B2/C1)";

            historyEl.innerHTML += `<div id="convo-analyzing" class="convo-msg convo-msg-system" style="color:var(--cyber-warn);">🧠 ${langInfo.teacherName} está preparando la siguiente pregunta...</div>`;

            const systemPrompt = `You are ${langInfo.teacherName}, an expert ${langInfo.aiPromptLang} evaluator in a CEFR placement interview.
Previous conversation history:
${conversation.assessmentHistory.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')}

QUESTION ${turnNum}/3 (${tierLabel}):
${turnNum === 2 ? "Acknowledge the student's answer briefly, then ask a past/experiential question (e.g. past vacation, a memorable story, or why they learn languages) to test past tenses and connectors." : "Acknowledge briefly, then ask an opinion or hypothetical conditional question (e.g. 'What would you do if...', or views on technology/travel) to test complex structures."}

Keep output under 2 short sentences.
Respond ONLY with a valid JSON object:
{
  "speech": "Your brief acknowledgment and next question in ${langInfo.aiPromptLang}",
  "speech_trans": "Traducción completa al español"
}`;

            await app.callAI_Conversation([{role: "system", content: systemPrompt}, {role: "user", content: `Student said: "${studentSpeech}". Ask question ${turnNum}.`}], null, (data) => {
                const analyzingEl = document.getElementById('convo-analyzing');
                if (analyzingEl) analyzingEl.remove();

                conversation.expectedText = data.speech;
                conversation.expectedTrans = data.speech_trans || '';
                conversation.assessmentHistory.push({ role: 'teacher', content: data.speech });

                historyEl.innerHTML += `
                    <div class="convo-msg convo-msg-teacher">
                        <strong>🔊 ${langInfo.teacherName} (Pregunta ${turnNum}/3 - ${tierLabel}):</strong><br>
                        <div style="margin-top:8px; font-size: 1.15rem; color: #FFF; line-height: 1.6;">${data.speech}</div>
                        <div style="margin-top:6px; font-size:0.85rem; color:var(--neon-pink);">📝 ${data.speech_trans}</div>
                    </div>
                    <div class="convo-msg convo-msg-system">🎤 <strong>Tu turno:</strong> Responde a ${langInfo.teacherName} en ${langInfo.name}.</div>
                `;

                conversation.scrollThreeLineWindow();
                game.speakText(data.speech);
            });
        },

        finishLevelAssessment: async () => {
            if (conversation.assessmentTimerInterval) {
                clearInterval(conversation.assessmentTimerInterval);
                conversation.assessmentTimerInterval = null;
            }
            const banner = document.getElementById('assessment-timer-banner');
            if (banner) banner.classList.add('hidden');

            conversation.stopMic();
            window.speechSynthesis.cancel();

            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const historyEl = document.getElementById('conversation-history');
            historyEl.innerHTML += `<div id="convo-evaluating" class="convo-msg convo-msg-system" style="color:var(--cyber-warn); font-weight:bold; font-size:1.1rem; border-left-color:var(--cyber-warn);">🎓 ${langInfo.teacherName} está evaluando tu nivel académico según el MCER...</div>`;
            conversation.scrollThreeLineWindow();

            const transcriptHistory = conversation.assessmentHistory.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n');

            const systemPrompt = `You are ${langInfo.teacherName}, an official CEFR evaluator assessing a Spanish speaker's level in ${langInfo.aiPromptLang}.
Here is the complete interview transcript:
${transcriptHistory}

EVALUATION CRITERIA:
- 0 = A0 (Starter): Isolated single words, incomplete basic answers.
- 1 = A1-A2 (Basic): Simple sentences, basic present tense, limited vocabulary.
- 2 = B1 (Intermediate): Connected sentences, past tense, expressing reasons and personal experiences.
- 3 = B2 (Advanced): Fluency, good grammatical variety, idiomatic expressions, spontaneous discourse.
- 4 = C1+ (Native/Pro): High complexity, sophisticated vocabulary, natural native nuances, complex conditionals.

TASK:
1. Determine diagnosed_level (integer 0 to 4).
2. Write a warm spoken congratulation and diagnosis in ${langInfo.aiPromptLang}.
3. Provide Spanish translation.
4. Provide a brief actionable tip.

CRITICAL: Return ONLY a valid JSON object:
{
  "diagnosed_level": 2,
  "level_name": "B1 (Intermediate / Umbral)",
  "verdict": "¡Nivel B1 desbloqueado con éxito!",
  "feedback_speech": "Warm spoken evaluation in ${langInfo.aiPromptLang}",
  "feedback_trans": "Traducción completa al español de la evaluación",
  "tips": "Consejo específico para tu nivel"
}`;

            await app.callAI_Conversation([{role: "system", content: systemPrompt}, {role: "user", content: "Evaluate student level."}], null, (data) => {
                const evalEl = document.getElementById('convo-evaluating');
                if (evalEl) evalEl.remove();

                const assignedLevel = Math.min(4, Math.max(0, parseInt(data.diagnosed_level !== undefined ? data.diagnosed_level : 1)));
                const levelLabels = app.getLevelLabels();
                const levelTitle = levelLabels[assignedLevel] || "A1-A2 (Basic)";

                // Unlock all levels up to assignedLevel
                if (!db.level_points) db.level_points = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
                for (let l = 0; l <= assignedLevel; l++) {
                    db.level_points[l] = Math.max(db.level_points[l] || 0, 50);
                }
                db.academy_level = assignedLevel;
                app.saveDB();
                app.renderLevelBadges();
                app.updateAcademyLevelDisplay(assignedLevel);
                app.renderDashboardLists();
                app.updateLessonButtonsVisibility();

                audio.celebrate();

                historyEl.innerHTML += `
                    <div class="hud-card" style="border: 2px solid var(--cyber-ok); background: linear-gradient(135deg, rgba(0,255,149,0.15), rgba(0,243,255,0.08)); padding: 20px; margin: 20px 0; box-shadow: 0 0 25px rgba(0,255,149,0.35); text-align: center;">
                        <div style="font-size: 2.2rem; margin-bottom: 6px;">🎉 🏆 🎓</div>
                        <h2 style="color: var(--cyber-ok); margin: 0 0 8px; font-size: 1.4rem;">${data.verdict || '¡Evaluación Completada!'}</h2>
                        <div class="tech" style="display:inline-block; font-size: 1.25rem; font-weight: bold; color: #FFF; background: rgba(0,255,149,0.25); border: 1.5px solid var(--cyber-ok); padding: 8px 18px; border-radius: 8px; margin: 10px 0;">
                            Nivel Asignado: ${levelTitle}
                        </div>
                        <p style="color: #DDD; font-size: 0.95rem; margin: 12px 0 6px;">Se han desbloqueado todos los niveles y listas hasta <strong>${levelTitle}</strong> con 50 puntos.</p>
                        
                        <div style="text-align: left; background: rgba(0,0,0,0.5); padding: 14px; border-radius: 6px; border-left: 3px solid var(--neon-cyan); margin-top: 15px;">
                            <strong style="color: var(--neon-cyan);">🎓 Comentario de ${langInfo.teacherName}:</strong>
                            <div style="margin-top: 6px; color: #FFF; line-height: 1.5;">${data.feedback_speech}</div>
                            ${data.feedback_trans ? `<div style="margin-top: 6px; color: var(--neon-pink); font-size: 0.85rem;">📝 ${data.feedback_trans}</div>` : ''}
                            ${data.tips ? `<div style="margin-top: 6px; color: var(--cyber-warn); font-size: 0.85rem;">💡 <strong>Consejo:</strong> ${data.tips}</div>` : ''}
                        </div>

                        <div style="margin-top: 20px;">
                            <button onclick="app.showDashboard()" class="success" style="width: 100%; padding: 16px; font-weight: bold; font-size: 1.1rem; letter-spacing: 1px;">
                                🚀 IR AL DASHBOARD Y JUGAR
                            </button>
                        </div>
                    </div>
                `;

                conversation.scrollThreeLineWindow();
                game.speakText(data.feedback_speech);
            });
        },

        scrollThreeLineWindow: () => {
            const historyEl = document.getElementById('conversation-history');
            if (!historyEl) return;
            const messages = historyEl.querySelectorAll('.convo-msg, .hud-card');
            if (messages.length > 3) {
                const targetMsg = messages[messages.length - 3];
                targetMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                historyEl.scrollTop = historyEl.scrollHeight;
            }
        },

        toggleMic: () => {
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const micBtn = document.getElementById('mic-btn-convo');
            if (stt.isRecording) {
                stt.stop();
                return;
            }

            conversation.stopMic();
            window.speechSynthesis.cancel();
            scrollToMicArea('mic-btn-convo');

            stt.startRecording(
                'convo',
                langInfo.code,
                (transcript) => {
                    conversation.onResult(transcript);
                },
                (err) => {
                    console.log("Convo mic error:", err);
                }
            );
        },

        stopMic: () => {
            stt.stop();
        },

        onResult: async (transcript) => {
            conversation.stopMic();
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            document.getElementById('convo-spoken-text').innerText = `You said: "${transcript}"`;
            const historyEl = document.getElementById('conversation-history');
            historyEl.innerHTML += `<div class="convo-msg convo-msg-user"><strong>🎤 You said:</strong> "${transcript}"</div>`;
            conversation.scrollThreeLineWindow();

            // Handle Assessment Mode
            if (conversation.convoType === 'assessment') {
                conversation.nextAssessmentTurn(transcript);
                return;
            }

            historyEl.innerHTML += `<div id="convo-analyzing" class="convo-msg convo-msg-system" style="color:var(--cyber-warn);">🧠 Analyzing your pronunciation with AI...</div>`;

            conversation.history.push({ role: 'user', content: transcript });
            conversation.turn++;

            const levelMap = ["Beginner (A0)", "Elementary (A1-A2)", "Intermediate (B1)", "Advanced (B2)", "Native (C1+)"];
            const currentLevelNum = db.academy_level || 0;
            const level = levelMap[currentLevelNum];

            const systemPrompt = `You are ${langInfo.teacherName}, an encouraging and friendly AI pronunciation evaluator for a ${level} student.
Target phrase to repeat: "${conversation.expectedText}"
Student spoken input: "${transcript}"

GRADING POLICY (SIMPLE, ENCOURAGING & EASY TO EARN POINTS):
- Award a generous accuracy score (0-100%). Any genuine attempt gets between 75-98%.
- Keep advice very short, practical and in Spanish.
- Do NOT include long speeches.

Return ONLY a valid JSON object:
{
  "accuracy": 90,
  "verdict": "¡Excelente! / ¡Muy bien! / ¡Buen intento!",
  "tips": "Breve consejo de mejora en pronunciación"
}`;

            await app.callAI_Conversation([{role: "system", content: systemPrompt}, {role: "user", content: `Evaluate student speech.`}], null, (data) => {
                const analyzingEl = document.getElementById('convo-analyzing');
                if (analyzingEl) analyzingEl.remove();

                const score = data.accuracy || 85;
                const currentLvl = app.getLangLevel ? app.getLangLevel() : (db.academy_level || 0);
                const baseMultiplier = currentLvl >= 3 ? 3 : currentLvl >= 1 ? 2 : 1;
                const totalPtsForScore = score >= 85 ? (10 * baseMultiplier) : (score >= 70 ? (6 * baseMultiplier) : (3 * baseMultiplier));

                // Solo se consiguen puntos adicionales al repetir si se supera la puntuacion anterior
                let earnedPts = 0;
                if (score > conversation.bestScoreThisExercise) {
                    earnedPts = Math.max(0, totalPtsForScore - conversation.bestPointsThisExercise);
                    conversation.bestScoreThisExercise = score;
                    conversation.bestPointsThisExercise = Math.max(conversation.bestPointsThisExercise, totalPtsForScore);
                }

                if (earnedPts > 0) {
                    if (app.addLevelPoints) app.addLevelPoints(currentLvl, earnedPts);
                }
                if (typeof game !== 'undefined' && game.updatePerformance) {
                    game.updatePerformance(score >= 75 ? 6 : -3);
                }

                const scoreColor = score >= 80 ? 'var(--cyber-ok)' : score >= 60 ? 'var(--cyber-warn)' : 'var(--neon-cyan)';
                const verdict = data.verdict || (score >= 80 ? '¡Excelente!' : '¡Buen intento!');
                const ptsText = earnedPts > 0 ? `+${earnedPts} pts` : `0 pts`;

                if (score >= 75) {
                    audio.celebrate();
                } else {
                    audio.tap();
                }

                historyEl.innerHTML += `
                    <div class="hud-card" style="padding: 18px 20px; margin: 15px 0; border-left: 4px solid ${scoreColor}; border-top: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); text-align: left; box-shadow: 0 0 15px rgba(0,0,0,0.6);">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <span class="tech" style="color:${scoreColor}; font-size:1.15rem; font-weight:900;">
                                ${score}% · ${verdict}
                            </span>
                            <span class="tech" style="color:var(--cyber-ok); font-size:0.95rem; font-weight:bold; background:rgba(0,255,149,0.1); border:1px solid var(--cyber-ok); padding:3px 10px; border-radius:6px;">
                                ${ptsText}
                            </span>
                        </div>
                        ${data.tips ? `<div style="margin-top:10px; color:#DDD; font-size:0.92rem; line-height:1.4;"><span style="color:var(--cyber-warn); font-weight:bold;">💡</span> ${data.tips}</div>` : ''}
                        <div style="margin-top: 12px; font-size: 0.85rem; color: var(--neon-cyan); opacity: 0.9; text-align: right;">
                            ↩ Volviendo a la pantalla principal...
                        </div>
                    </div>
                `;

                conversation.scrollThreeLineWindow();

                // Volver solo y automáticamente a la pantalla principal tras recibir la evaluación
                if (conversation.convoType === 'lesson') {
                    if (typeof session !== 'undefined') {
                        session.lessonCompleted = true;
                        session.lastLessonData = {
                            phrase: conversation.expectedText,
                            spoken: transcript,
                            score: score,
                            verdict: verdict,
                            tips: data.tips || ''
                        };
                        session.updatePulsingState();
                    }
                    setTimeout(() => {
                        if (!document.getElementById('view-conversation').classList.contains('hidden')) {
                            app.showDashboard();
                            if (typeof session !== 'undefined') session.updatePulsingState();
                        }
                    }, 2400);
                }
            });
        }
    };
