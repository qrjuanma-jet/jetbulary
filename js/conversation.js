// ====== CONVERSATION & AI PRONUNCIATION ANALYZER ======
    const conversation = {
        history: [], turn: 0, recognition: null, autoMic: true, expectedText: '', expectedTrans: '', targetWords: [],
        convoType: 'lesson', currentLessonFailures: 0, bestScoreThisExercise: 0,

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
            const assessmentBanner = document.getElementById('assessment-timer-banner');
            if (assessmentBanner) assessmentBanner.classList.add('hidden');
            const friendBadgeEl = document.getElementById('convo-friendship-badge');
            if (friendBadgeEl) friendBadgeEl.classList.add('hidden');
            conversation.lessonMode = lessonMode;
            conversation.currentLessonFailures = 0;
            conversation.bestScoreThisExercise = 0;
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

                getStudentProfile: () => {
            if (!db.student_profile) {
                try {
                    const raw = localStorage.getItem('jetbulary_student_profile');
                    if (raw) db.student_profile = JSON.parse(raw);
                } catch(e) {}
            }
            if (!db.student_profile) {
                db.student_profile = {
                    pet: null,
                    favoriteColor: null,
                    drinkPreference: null,
                    passions: [],
                    lastTopic: null,
                    travelStyle: null,
                    scienceStyle: null,
                    historyStyle: null,
                    mechanicsStyle: null,
                    loveStyle: null,
                    notes: [],
                    completedConvos: 0,
                    lastConvoDate: null
                };
            }
            return db.student_profile;
        },

        saveStudentFact: (key, val, noteInSpanish) => {
            const profile = conversation.getStudentProfile();
            if (Array.isArray(profile[key])) {
                if (!profile[key].includes(val)) profile[key].push(val);
            } else {
                profile[key] = val;
            }
            if (noteInSpanish && !profile.notes.includes(noteInSpanish)) {
                profile.notes.push(noteInSpanish);
            }
            profile.lastConvoDate = new Date().toLocaleDateString();

            db.teacher_memories = db.teacher_memories || {};
            const lang = currentLang || 'en';
            db.teacher_memories[lang] = db.teacher_memories[lang] || { conversations: 0, facts: [] };
            if (noteInSpanish && !db.teacher_memories[lang].facts.includes(noteInSpanish)) {
                db.teacher_memories[lang].facts.push(noteInSpanish);
            }

            try {
                localStorage.setItem('jetbulary_student_profile', JSON.stringify(profile));
                if (typeof app !== 'undefined' && app.saveDB) app.saveDB();
            } catch(e) {}

            conversation.updateFriendshipBadge();
        },

        extractStudentFacts: (speech, turn) => {
            if (!speech) return;
            const text = speech.toLowerCase().trim();

            if (turn === 0 || turn === 1) {
                if (/\b(cat|chat|katze|gatto|gato|miau)\b/i.test(text)) {
                    conversation.saveStudentFact('pet', 'cat', 'Prefiere los gatos 🐱');
                } else if (/\b(dog|chien|hund|cane|cão|perro|guau)\b/i.test(text)) {
                    conversation.saveStudentFact('pet', 'dog', 'Prefiere los perros 🐶');
                } else if (/\b(red|rouge|rot|rosso|vermelho|rojo)\b/i.test(text)) {
                    conversation.saveStudentFact('favoriteColor', 'red', 'Le gusta el color rojo 🔴');
                } else if (/\b(black|noir|schwarz|nero|preto|negro)\b/i.test(text)) {
                    conversation.saveStudentFact('favoriteColor', 'black', 'Le gusta el color negro ⚫');
                } else if (/\b(yes|oui|ja|si|sì|sim)\b/i.test(text)) {
                    conversation.saveStudentFact('attitude', 'optimist', 'Actitud alegre y positiva ⭐');
                } else if (/\b(coffee|café|cafe|kaffee|caffè)\b/i.test(text)) {
                    conversation.saveStudentFact('drinkPreference', 'coffee', 'Le gusta el café ☕');
                } else if (/\b(tea|thé|tee|té|tè|chá)\b/i.test(text)) {
                    conversation.saveStudentFact('drinkPreference', 'tea', 'Le gusta el té 🍵');
                }
            }

            if (/science|ciencia|wissenschaft|scienza|ciência/i.test(text)) {
                conversation.saveStudentFact('passions', 'science', 'Le fascina la ciencia y el universo 🔬');
            }
            if (/travel|viaje|voyage|reisen|viagg|viage/i.test(text)) {
                conversation.saveStudentFact('passions', 'travel', 'Le apasiona viajar y conocer mundo ✈️');
            }
            if (/histor|geschicht/i.test(text)) {
                conversation.saveStudentFact('passions', 'history', 'Le apasiona la historia y las civilizaciones 📜');
            }
            if (/mechanic|mecanic|mécan|meccan/i.test(text)) {
                conversation.saveStudentFact('passions', 'mechanics', 'Le fascina la mecánica y cómo funcionan las cosas ⚙️');
            }
            if (/love|amor|amour|liebe|amore/i.test(text)) {
                conversation.saveStudentFact('passions', 'love', 'Tiene un corazón sensible y cree en el amor ❤️');
            }

            if (/beach|playa|plage|strand|spiaggia|praia/i.test(text)) {
                conversation.saveStudentFact('travelStyle', 'beach', 'Prefiere relajarse junto al mar 🏖️');
            } else if (/mountain|montaña|montagne|berge|montagna/i.test(text)) {
                conversation.saveStudentFact('travelStyle', 'mountains', 'Le gusta la naturaleza y la montaña 🏔️');
            }
            if (/space|espacio|espace|weltall|spazio|espaço/i.test(text)) {
                conversation.saveStudentFact('scienceStyle', 'space', 'Le apasiona el espacio exterior 🚀');
            } else if (/nature|naturaleza|natur|natura/i.test(text)) {
                conversation.saveStudentFact('scienceStyle', 'nature', 'Le encanta la biología y la vida natural 🌿');
            }
            if (/car|coche|auto|voiture|macchina|carro/i.test(text)) {
                conversation.saveStudentFact('mechanicsStyle', 'cars', 'Le apasionan los coches y motores 🚗');
            } else if (/plane|avión|avion|flugzeug|aereo|avião/i.test(text)) {
                conversation.saveStudentFact('mechanicsStyle', 'planes', 'Le fascinan los aviones y volar ✈️');
            }
            if (/castle|castillo|château|schloss|castello/i.test(text)) {
                conversation.saveStudentFact('historyStyle', 'castles', 'Le fascinan los castillos medievales 🏰');
            } else if (/pyramid|pirámide|pyramide|piramide/i.test(text)) {
                conversation.saveStudentFact('historyStyle', 'pyramids', 'Le fascinan las pirámides antiguas 🔺');
            }
            if (/dinner|cena|dîner|abendessen|cena|jantar/i.test(text)) {
                conversation.saveStudentFact('loveStyle', 'dinner', 'Le gustan las veladas románticas 🕯️');
            } else if (/walk|paseo|promenade|spaziergang|passeggiata|paseio/i.test(text)) {
                conversation.saveStudentFact('loveStyle', 'walk', 'Le encantan los paseos tranquilos bajo las estrellas 🌙');
            }
        },

        updateFriendshipBadge: () => {
            const badge = document.getElementById('convo-friendship-badge');
            const chipsEl = document.getElementById('convo-memory-chips');
            const titleEl = document.getElementById('convo-friendship-title');
            if (!badge || !chipsEl) return;

            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            if (titleEl) titleEl.innerText = `AMISTAD Y APOYO INCONDICIONAL CON ${langInfo.teacherName.toUpperCase()} (${langInfo.name})`;

            const profile = conversation.getStudentProfile();
            const notes = profile.notes || [];

            if (notes.length === 0) {
                chipsEl.innerHTML = `<span style="color: #cbd5e1; font-style: italic; font-size: 0.78rem;">🌟 ${langInfo.teacherName} siempre será un apoyo para ti: te irá conociendo con paciencia, comprensión y guardando tus gustos e inquietudes en tu dispositivo...</span>`;
                return;
            }

            chipsEl.innerHTML = notes.map(n => `
                <span class="tech" style="display:inline-flex; align-items:center; gap:4px; padding:3px 9px; font-size:0.75rem; border:1px solid rgba(255,0,85,0.4); border-radius:12px; background:rgba(255,0,85,0.12); color:#FFF;">
                    ${n}
                </span>
            `).join('') + (profile.completedConvos > 0 ? `
                <span class="tech" style="display:inline-flex; align-items:center; gap:4px; padding:3px 9px; font-size:0.75rem; border:1px solid var(--cyber-ok); border-radius:12px; background:rgba(0,255,149,0.12); color:var(--cyber-ok);">
                    💬 ${profile.completedConvos} charlas juntos
                </span>
            ` : '');
        },

        onQuickReply: (text) => {
            const spokenEl = document.getElementById('convo-spoken-text');
            if (spokenEl) spokenEl.innerText = `Has elegido: "${text}"`;
            const historyEl = document.getElementById('conversation-history');
            if (historyEl) {
                historyEl.innerHTML += `<div class="convo-msg convo-msg-user"><strong>🎤 Tú:</strong> "${text}"</div>`;
            }
            conversation.scrollThreeLineWindow();
            conversation.nextFreeConversationTurn(text);
        },

        getFreeConversationScaffold: (langCode, turn, studentSpeech = '') => {
            const langInfo = LANGUAGES[langCode] || LANGUAGES.en;
            const profile = conversation.getStudentProfile();
            const textLower = (studentSpeech || '').toLowerCase();
            const isReturning = profile.notes && profile.notes.length > 0;

            const scaffolds = {
                en: [
                    {
                        speech: isReturning 
                            ? `Welcome back, my dear friend! I'm always here to support you. To warm up today: answer 'Cat' or 'Dog'!`
                            : `Hello! I'm Emma, your new friend and teacher. I believe in you and I'm always by your side! Answer: 'Cat' or 'Dog'!`,
                        speech_trans: isReturning
                            ? `¡Qué alegría verte de nuevo, amigo mío! Siempre estoy aquí para apoyarte. Para calentar hoy: ¡responde 'Cat' o 'Dog'!`
                            : `¡Hola! Soy Emma, tu nueva amiga y profesora. ¡Creo en ti y siempre estaré a tu lado! Responde: 'Cat' o 'Dog'!`,
                        friend_advice: "Pedagógicamente, el cerebro se bloquea ante decisiones difíciles cuando hay timidez o miedo a fallar. Empezar con una elección binaria tan sencilla elimina toda la ansiedad y te demuestra que puedes hablar con naturalidad desde el primer segundo. ¡Estoy aquí para apoyarte siempre!",
                        student_guidance: "Tu amiga Emma lleva toda la conversación y te apoya en todo momento. Responde con una sola palabra o pulsa una opción:",
                        quick_replies: [{ text: "Cat", label: "🐱 Cat" }, { text: "Dog", label: "🐶 Dog" }]
                    },
                    {
                        speech: "Awesome choice! Between friends, when someone shares something cool, we say: 'Sounds great!' Repeat with me: say 'Sounds great!'",
                        speech_trans: "¡Excelente elección! Entre amigos, cuando alguien comparte algo genial, decimos: 'Sounds great!'. Repite conmigo: di 'Sounds great!'",
                        friend_advice: "Cada pequeño esfuerzo cuenta enormemente. No busques perfección inmediata: celebra cada palabra que pronuncias, porque cada intento crea nuevas redes neuronales y afianza tu autoestima. ¡Lo estás haciendo de maravilla!",
                        student_guidance: "Solo repite con tu amiga la profesora: 'Sounds great!'",
                        quick_replies: [{ text: "Sounds great!", label: "🗣️ Sounds great!" }]
                    },
                    {
                        speech: "You sound so natural! Between friends, I really want to know what you love most. What is your favorite topic? History, mechanics, science, travel, or love?",
                        speech_trans: "¡Suenas tan natural! Entre amigos, quiero saber qué es lo que más te apasiona. ¿Cuál es tu tema favorito? ¿Historia, mecánica, ciencia, viajes o amor?",
                        friend_advice: "Desde el punto de vista pedagógico, cuando hablamos de lo que verdaderamente despierta nuestra curiosidad (la historia, la mecánica, la ciencia, los viajes o el amor), las neuronas se activan con alegría y el miedo desaparece. Tus inquietudes son hermosas y merecen ser exploradas.",
                        student_guidance: "Elige el tema que prefieras y dilo en una sola palabra:",
                        quick_replies: [
                            { text: "History", label: "📜 History" },
                            { text: "Mechanics", label: "⚙️ Mechanics" },
                            { text: "Science", label: "🔬 Science" },
                            { text: "Travel", label: "✈️ Travel" },
                            { text: "Love", label: "❤️ Love" }
                        ]
                    },
                    {
                        speech: textLower.includes('science') || textLower.includes('cien')
                            ? "Science is amazing! Exploring the universe is pure wonder. Say with me: 'I love science!' Try it!"
                            : textLower.includes('travel') || textLower.includes('viaj')
                            ? "Travel is magical! Seeing new places and cultures opens your heart. Say with me: 'I love travel!' Try it!"
                            : textLower.includes('histor')
                            ? "History is thrilling! Every ancient street has a secret story. Say with me: 'I love history!' Try it!"
                            : textLower.includes('mechanic') || textLower.includes('mecan')
                            ? "Mechanics is wonderful! Understanding how engines work is pure genius. Say with me: 'I love mechanics!' Try it!"
                            : "Love is the most beautiful thing! It gives warmth to our days. Say with me: 'I believe in love!' Try it!",
                        speech_trans: textLower.includes('science') || textLower.includes('cien')
                            ? "¡La ciencia es asombrosa! Explorar el universo es pura maravilla. Di conmigo: 'I love science!' ¡Pruébalo!"
                            : textLower.includes('travel') || textLower.includes('viaj')
                            ? "¡Viajar es mágico! Conocer nuevos lugares y culturas abre tu corazón. Di conmigo: 'I love travel!' ¡Pruébalo!"
                            : textLower.includes('histor')
                            ? "¡La historia es apasionante! Cada calle antigua tiene una historia secreta. Di conmigo: 'I love history!' ¡Pruébalo!"
                            : textLower.includes('mechanic') || textLower.includes('mecan')
                            ? "¡La mecánica es maravillosa! Entender cómo funcionan los motores es genial. Di conmigo: 'I love mechanics!' ¡Pruébalo!"
                            : "¡El amor es lo más hermoso! Llena de calidez nuestras vidas. Di conmigo: 'I believe in love!' ¡Pruébalo!",
                        friend_advice: textLower.includes('science') || textLower.includes('cien')
                            ? "La ciencia nos enseña que el error no es un fracaso, sino el dato más valioso del experimento. Nunca temas equivocarte: cada tropiezo te hace más sabio y más fuerte. ¡Cuentas siempre con mi apoyo incondicional!"
                            : textLower.includes('travel') || textLower.includes('viaj')
                            ? "Pedagógicamente, viajar es la mayor escuela de flexibilidad mental y empatía. Te demuestra que eres capaz de adaptarte y florecer en cualquier entorno. Tienes un mundo entero por delante."
                            : textLower.includes('histor')
                            ? "Conocer la historia te aporta una calma profunda y resiliencia: nos enseña que toda dificultad humana ha sido superada con perseverancia y solidaridad. Tus inquietudes personales también tienen solución."
                            : textLower.includes('mechanic') || textLower.includes('mecan')
                            ? "La pedagogía de la mecánica es hermosa: un motor complejo se compone de piezas pequeñas. Si un problema de la vida te abruma, descompónlo con paciencia y ajústalo pieza por pieza. Poco a poco todo vuelve a funcionar."
                            : "El amor y la comprensión mutua son las fuerzas más transformadoras del ser humano. Ser una persona sensible no es una debilidad, es tu mayor superpoder para conectar con los demás y hacer el bien.",
                        student_guidance: "Di tu primera frase completa guiado por tu amiga la profesora:",
                        quick_replies: [
                            { 
                                text: textLower.includes('science') || textLower.includes('cien') ? "I love science!" : textLower.includes('travel') || textLower.includes('viaj') ? "I love travel!" : textLower.includes('histor') ? "I love history!" : textLower.includes('mechanic') || textLower.includes('mecan') ? "I love mechanics!" : "I believe in love!",
                                label: `🗣️ ${textLower.includes('science') || textLower.includes('cien') ? "I love science!" : textLower.includes('travel') || textLower.includes('viaj') ? "I love travel!" : textLower.includes('histor') ? "I love history!" : textLower.includes('mechanic') || textLower.includes('mecan') ? "I love mechanics!" : "I believe in love!"}`
                            }
                        ]
                    },
                    {
                        speech: textLower.includes('travel') || textLower.includes('viaj')
                            ? "Look at you speaking full sentences, well done! When you travel, what do you prefer? Beach or mountains?"
                            : textLower.includes('science') || textLower.includes('cien')
                            ? "Look at you speaking full sentences, well done! In science, what do you prefer? Space or nature?"
                            : textLower.includes('histor')
                            ? "Look at you speaking full sentences, well done! In history, what do you prefer? Castles or pyramids?"
                            : textLower.includes('mechanic') || textLower.includes('mecan')
                            ? "Look at you speaking full sentences, well done! In mechanics, what do you prefer? Cars or airplanes?"
                            : "Look at you speaking full sentences, well done! In romance, what do you prefer? Dinner or a walk?",
                        speech_trans: textLower.includes('travel') || textLower.includes('viaj')
                            ? "¡Mírate diciendo frases enteras, bien hecho! Cuando viajas, ¿qué prefieres? ¿Playa o montaña?"
                            : textLower.includes('science') || textLower.includes('cien')
                            ? "¡Mírate diciendo frases enteras, bien hecho! En la ciencia, ¿qué prefieres? ¿El espacio o la naturaleza?"
                            : textLower.includes('histor')
                            ? "¡Mírate diciendo frases enteras, bien hecho! En la historia, ¿qué prefieres? ¿Castillos o pirámides?"
                            : textLower.includes('mechanic') || textLower.includes('mecan')
                            ? "¡Mírate diciendo frases enteras, bien hecho! En mecánica, ¿qué prefieres? ¿Coches o aviones?"
                            : "¡Mírate diciendo frases enteras, bien hecho! En el romance, ¿qué prefieres? ¿Una cena o un paseo?",
                        friend_advice: "Cuidar de ti mismo y darte permiso para disfrutar no es un lujo, es una necesidad psicológica básica. Sé siempre comprensivo contigo: has demostrado hoy un coraje inmenso y estoy muy orgullosa de ti.",
                        student_guidance: "Responde de forma sencilla con una sola palabra o pulsa una opción:",
                        quick_replies: textLower.includes('travel') || textLower.includes('viaj')
                            ? [{ text: "Beach", label: "🏖️ Beach" }, { text: "Mountains", label: "🏔️ Mountains" }]
                            : textLower.includes('science') || textLower.includes('cien')
                            ? [{ text: "Space", label: "🚀 Space" }, { text: "Nature", label: "🌿 Nature" }]
                            : textLower.includes('histor')
                            ? [{ text: "Castles", label: "🏰 Castles" }, { text: "Pyramids", label: "🔺 Pyramids" }]
                            : textLower.includes('mechanic') || textLower.includes('mecan')
                            ? [{ text: "Cars", label: "🚗 Cars" }, { text: "Airplanes", label: "✈️ Airplanes" }]
                            : [{ text: "Dinner", label: "🕯️ Dinner" }, { text: "Walk", label: "🌙 Walk" }]
                    },
                    {
                        speech: "Whatever you choose, talking with you makes my day so special! Remember I am always here to support you whenever you want to chat. Thank you for this lovely moment!",
                        speech_trans: "Elijas lo que elijas, ¡hablar contigo hace mi día tan especial! Recuerda que siempre estoy aquí para apoyarte cuando quieras charlar. ¡Gracias por este momento tan bonito!",
                        friend_advice: "La verdadera amistad pedagógica consiste en saber que siempre tienes un apoyo incondicional. No importan los errores ni las dudas: cada conversación contigo es un tesoro. ¡Aquí estaré siempre para apoyarte!",
                        student_guidance: "¡Enhorabuena! Has completado una maravillosa charla. Puedes finalizar con éxito y guardar recuerdos:",
                        quick_replies: [{ text: "Thank you!", label: "💖 Thank you!" }]
                    }
                ],
                fr: [
                    {
                        speech: isReturning
                            ? `Quel plaisir de te revoir, mon ami ! Je suis toujours là pour te soutenir. Réponds 'Chat' ou 'Chien' !`
                            : `Bonjour ! Je suis Camille, ton amie et professeure. Je crois en toi de tout cœur : réponds 'Chat' ou 'Chien' !`,
                        speech_trans: isReturning
                            ? `¡Qué placer verte de nuevo, amigo mío! Siempre estoy aquí para apoyarte. ¡Responde 'Chat' o 'Chien'!`
                            : `¡Hola! Soy Camille, tu amiga y profesora. Creo en ti de todo corazón: ¡responde 'Chat' o 'Chien'!`,
                        friend_advice: "Al aprender un idioma, la empatía y la seguridad emocional son el cimiento de todo. Eliminar la exigencia inicial permite que tu mente absorba los sonidos con alegría y sin estrés.",
                        student_guidance: "Tu amiga Camille lleva la conversación y te apoya siempre. Responde con una sola palabra o pulsa:",
                        quick_replies: [{ text: "Chat", label: "🐱 Chat" }, { text: "Chien", label: "🐶 Chien" }]
                    },
                    {
                        speech: "Super ! Entre amis, quand quelqu'un te donne une bonne nouvelle, on dit simplement : 'C'est super !'. Répète avec moi : 'C'est super !'",
                        speech_trans: "¡Súper! Entre amigos, cuando alguien te da una buena noticia, decimos: 'C'est super !'. Repite conmigo: 'C'est super !'",
                        friend_advice: "El refuerzo positivo es la clave pedagógica: cada palabra que dices en voz alta afianza tu seguridad interior y te demuestra que eres capaz.",
                        student_guidance: "Solo repite con tu amiga la profesora: 'C'est super !'",
                        quick_replies: [{ text: "C'est super !", label: "🗣️ C'est super !" }]
                    },
                    {
                        speech: "Tu as un accent magnifique ! Entre amis, dis-moi ce qui te passionne : L'histoire, la mécanique, la science, les voyages ou l'amour ?",
                        speech_trans: "¡Tienes un acento magnífico! Entre amigos, dime qué te apasiona: ¿La historia, la mecánica, la ciencia, los viajes o el amor?",
                        friend_advice: "Hablar de tus inquietudes personales te conecta con la lengua desde el corazón y despierta tu entusiasmo natural.",
                        student_guidance: "Elige el tema que prefieras y dilo en una sola palabra:",
                        quick_replies: [
                            { text: "Histoire", label: "📜 Histoire" },
                            { text: "Mécanique", label: "⚙️ Mécanique" },
                            { text: "Science", label: "🔬 Science" },
                            { text: "Voyages", label: "✈️ Voyages" },
                            { text: "Amour", label: "❤️ Amour" }
                        ]
                    },
                    {
                        speech: textLower.includes('scien')
                            ? "La science est fascinante ! Dis avec moi : 'J'adore la science !' Essaie !"
                            : textLower.includes('voyag') || textLower.includes('viaj')
                            ? "Voyager est magique ! Dis avec moi : 'J'adore les voyages !' Essaie !"
                            : textLower.includes('hist')
                            ? "L'histoire est passionnante ! Dis avec moi : 'J'adore l'histoire !' Essaie !"
                            : textLower.includes('méc') || textLower.includes('mec')
                            ? "La mécanique est géniale ! Dis avec moi : 'J'adore la mécanique !' Essaie !"
                            : "L'amour est magnifique ! Dis avec moi : 'Je crois en l'amour !' Essaie !",
                        speech_trans: textLower.includes('scien')
                            ? "¡La ciencia es fascinante! Di conmigo: 'J'adore la science !' ¡Pruébalo!"
                            : textLower.includes('voyag') || textLower.includes('viaj')
                            ? "¡Viajar es mágico! Di conmigo: 'J'adore les voyages !' ¡Pruébalo!"
                            : textLower.includes('hist')
                            ? "¡La historia es apasionante! Di conmigo: 'J'adore l'histoire !' ¡Pruébalo!"
                            : textLower.includes('méc') || textLower.includes('mec')
                            ? "¡La mecánica es genial! Di conmigo: 'J'adore la mécanique !' ¡Pruébalo!"
                            : "¡El amor es magnífico! Di conmigo: 'Je crois en l'amour !' ¡Pruébalo!",
                        friend_advice: "La estructura 'J'adore...' es tu trampolín para expresarte con soltura en francés sin dudar.",
                        student_guidance: "Construye tu primera frase completa con el modelo de tu amiga:",
                        quick_replies: [
                            {
                                text: textLower.includes('scien') ? "J'adore la science !" : textLower.includes('voyag') || textLower.includes('viaj') ? "J'adore les voyages !" : textLower.includes('hist') ? "J'adore l'histoire !" : textLower.includes('méc') || textLower.includes('mec') ? "J'adore la mécanique !" : "Je crois en l'amour !",
                                label: `🗣️ ${textLower.includes('scien') ? "J'adore la science !" : textLower.includes('voyag') || textLower.includes('viaj') ? "J'adore les voyages !" : textLower.includes('hist') ? "J'adore l'histoire !" : textLower.includes('méc') || textLower.includes('mec') ? "J'adore la mécanique !" : "Je crois en l'amour !"}`
                            }
                        ]
                    },
                    {
                        speech: "Bravo, tu parles déjà des phrases entières ! Pour te détendre, tu préfères la mer ou la montagne ? Mer ou montagne ?",
                        speech_trans: "¡Bravo, ya estás diciendo frases enteras! Para relajarte, ¿prefieres el mar o la montaña? ¿Mar o montaña?",
                        friend_advice: "Celebrar cada pequeño logro con orgullo es la mayor vitamina para tu crecimiento personal.",
                        student_guidance: "Responde: 'La mer' o 'La montagne':",
                        quick_replies: [{ text: "La mer", label: "🏖️ La mer" }, { text: "La montagne", label: "🏔️ La montagne" }]
                    },
                    {
                        speech: "Quel que soit ton choix, discuter avec toi illumine ma journée ! Sache que je serai toujours un soutien pour toi à chaque instant. Merci pour ce joli moment !",
                        speech_trans: "Elijas lo que elijas, ¡hablar contigo ilumina mi día! Recuerda que siempre seré un apoyo para ti en cada momento. ¡Gracias por este momento tan bonito!",
                        friend_advice: "La pedagogía del afecto: saber que cuentas con un apoyo incondicional derriba cualquier timidez. ¡Estoy muy orgullosa de ti y siempre estaré a tu lado!",
                        student_guidance: "¡Enhorabuena! Has completado una hermosa charla. Puedes finalizar con éxito y guardar recuerdos:",
                        quick_replies: [{ text: "Merci !", label: "💖 Merci !" }]
                    }
                ],
                de: [
                    {
                        speech: isReturning
                            ? `Schön, dich wiederzusehen, mein Freund! Ich bin immer für dich da: Antworte 'Katze' oder 'Hund'!`
                            : `Hallo! Ich bin Greta, deine neue Freundin und Lehrerin. Ich unterstütze dich immer: Antworte 'Katze' oder 'Hund'!`,
                        speech_trans: isReturning
                            ? `¡Qué bien verte de nuevo, amigo mío! Siempre estoy aquí para ti: ¡responde 'Katze' o 'Hund'!`
                            : `¡Hola! Soy Greta, tu nueva amiga y profesora. Te apoyo en todo momento: ¡responde 'Katze' o 'Hund'!`,
                        friend_advice: "El andamiaje pedagógico paso a paso es la medicina perfecta contra la timidez: avanzamos desde lo más simple hasta que sientas que puedes con todo.",
                        student_guidance: "Tu amiga Greta lleva la conversación y te acompaña siempre. Responde con una palabra:",
                        quick_replies: [{ text: "Katze", label: "🐱 Katze" }, { text: "Hund", label: "🐶 Hund" }]
                    },
                    {
                        speech: "Wunderbar! Unter Freunden sagen wir ganz oft ganz locker: 'Alles klar!'. Wiederhole mit mir: 'Alles klar!'",
                        speech_trans: "¡Maravilloso! Entre amigos decimos con mucha frecuencia y de forma relajada: 'Alles klar!'. Repite conmigo: 'Alles klar!'",
                        friend_advice: "Repetir expresiones cotidianas crea automatismos cerebrales saludables que te liberan de la rigidez gramatical.",
                        student_guidance: "Solo repite con tu amiga la profesora: 'Alles klar!'",
                        quick_replies: [{ text: "Alles klar!", label: "🗣️ Alles klar!" }]
                    },
                    {
                        speech: "Tolle Aussprache! Was begeistert dich am meisten? Geschichte, Mechanik, Wissenschaft, Reisen oder Liebe?",
                        speech_trans: "¡Buena pronunciación! ¿Qué te entusiasma más? ¿Historia, mecánica, ciencia, viajes o amor?",
                        friend_advice: "Tus inquietudes personales son el motor del aprendizaje. Compartirlas te da una energía renovada.",
                        student_guidance: "Elige el tema que prefieras y dilo en una sola palabra:",
                        quick_replies: [
                            { text: "Geschichte", label: "📜 Geschichte" },
                            { text: "Mechanik", label: "⚙️ Mechanik" },
                            { text: "Wissenschaft", label: "🔬 Wissenschaft" },
                            { text: "Reisen", label: "✈️ Reisen" },
                            { text: "Liebe", label: "❤️ Liebe" }
                        ]
                    },
                    {
                        speech: textLower.includes('wiss') || textLower.includes('scien') || textLower.includes('cien')
                            ? "Wissenschaft ist faszinierend! Sag mit mir: 'Ich mag Wissenschaft!' Versuch es!"
                            : textLower.includes('reis') || textLower.includes('trav') || textLower.includes('viaj')
                            ? "Reisen ist herrlich! Sag mit mir: 'Ich mag Reisen!' Versuch es!"
                            : textLower.includes('gesch') || textLower.includes('hist')
                            ? "Geschichte ist spannend! Sag mit mir: 'Ich mag Geschichte!' Versuch es!"
                            : textLower.includes('mech')
                            ? "Mechanik ist genial! Sag mit mir: 'Ich mag Mechanik!' Versuch es!"
                            : "Liebe ist das Schönste! Sag mit mir: 'Ich glaube an die Liebe!' Versuch es!",
                        speech_trans: textLower.includes('wiss') || textLower.includes('scien') || textLower.includes('cien')
                            ? "¡La ciencia es fascinante! Di conmigo: 'Ich mag Wissenschaft!' ¡Pruébalo!"
                            : textLower.includes('reis') || textLower.includes('trav') || textLower.includes('viaj')
                            ? "¡Viajar es maravilloso! Di conmigo: 'Ich mag Reisen!' ¡Pruébalo!"
                            : textLower.includes('gesch') || textLower.includes('hist')
                            ? "¡La historia es apasionante! Di conmigo: 'Ich mag Geschichte!' ¡Pruébalo!"
                            : textLower.includes('mech')
                            ? "¡La mecánica es genial! Di conmigo: 'Ich mag Mechanik!' ¡Pruébalo!"
                            : "¡El amor es lo más hermoso! Di conmigo: 'Ich glaube an die Liebe!' ¡Pruébalo!",
                        friend_advice: "La estructura 'Ich mag...' te permite construir tus pensamientos en alemán con total serenidad.",
                        student_guidance: "Di tu primera frase completa con el modelo de tu amiga Greta:",
                        quick_replies: [
                            {
                                text: textLower.includes('wiss') || textLower.includes('scien') || textLower.includes('cien') ? "Ich mag Wissenschaft!" : textLower.includes('reis') || textLower.includes('trav') || textLower.includes('viaj') ? "Ich mag Reisen!" : textLower.includes('gesch') || textLower.includes('hist') ? "Ich mag Geschichte!" : textLower.includes('mech') ? "Ich mag Mechanik!" : "Ich glaube an die Liebe!",
                                label: `🗣️ ${textLower.includes('wiss') || textLower.includes('scien') || textLower.includes('cien') ? "Ich mag Wissenschaft!" : textLower.includes('reis') || textLower.includes('trav') || textLower.includes('viaj') ? "Ich mag Reisen!" : textLower.includes('gesch') || textLower.includes('hist') ? "Ich mag Geschichte!" : textLower.includes('mech') ? "Ich mag Mechanik!" : "Ich glaube an die Liebe!"}`
                            }
                        ]
                    },
                    {
                        speech: "Fantastisch, du sprichst schon ganze Sätze! Was magst du lieber? Strand oder Berge?",
                        speech_trans: "¡Fantástico, ya estás diciendo frases enteras! ¿Qué te gusta más? ¿Playa o montaña?",
                        friend_advice: "La constancia amable y la confianza en uno mismo son la clave de cualquier superación.",
                        student_guidance: "Responde: 'Strand' o 'Berge':",
                        quick_replies: [{ text: "Strand", label: "🏖️ Strand" }, { text: "Berge", label: "🏔️ Berge" }]
                    },
                    {
                        speech: "Ganz egal was du wählst: Mit dir zu sprechen macht meinen Tag so schön! Denk daran, dass ich immer für dich da bin. Danke für diesen wunderbaren Moment!",
                        speech_trans: "Elijas lo que elijas: ¡hablar contigo hace que mi día sea tan bonito! Recuerda que siempre estoy aquí para apoyarte. ¡Gracias por este momento maravilloso!",
                        friend_advice: "El apoyo incondicional es la base de todo progreso: nunca estás solo, aquí tienes siempre a una amiga que cree en tus capacidades.",
                        student_guidance: "¡Enhorabuena! Has completado una estupenda charla. Puedes finalizar con éxito y guardar recuerdos:",
                        quick_replies: [{ text: "Danke schön!", label: "💖 Danke schön!" }]
                    }
                ],
                it: [
                    {
                        speech: isReturning
                            ? `Che gioia rivederti, amico mio! Sono sempre qui per sostenerti. Rispondi 'Gatto' o 'Cane'!`
                            : `Ciao! Sono Chiara, la tua nuova amica e insegnante. Credo molto in te: Rispondi 'Gatto' o 'Cane'!`,
                        speech_trans: isReturning
                            ? `¡Qué alegría volver a verte, amigo mío! Siempre estoy aquí para apoyarte: ¡Responde 'Gatto' o 'Cane'!`
                            : `¡Hola! Soy Chiara, tu nueva amiga y profesora. Creo mucho en ti: ¡Responde 'Gatto' o 'Cane'!`,
                        friend_advice: "La pedagogía de la calidez: cuando sabes que tienes un apoyo incondicional que no te juzga, hablar otro idioma se convierte en una experiencia alegre y liberadora.",
                        student_guidance: "Tu amiga Chiara lleva la conversación y te apoya en todo. Responde con una palabra:",
                        quick_replies: [{ text: "Gatto", label: "🐱 Gatto" }, { text: "Cane", label: "🐶 Cane" }]
                    },
                    {
                        speech: "Bravissimo! Tra amici diciamo sempre con entusiasmo: 'Che bello!'. Ripeti con me: 'Che bello!'",
                        speech_trans: "¡Buenísimo! Entre amigos decimos siempre con entusiasmo: 'Che bello!'. Repite conmigo: 'Che bello!'",
                        friend_advice: "Transmitir emoción positiva es la mejor forma de conectar con los demás en cualquier rincón del mundo.",
                        student_guidance: "Solo repite con tu amiga la profesora: 'Che bello!'",
                        quick_replies: [{ text: "Che bello!", label: "🗣️ Che bello!" }]
                    },
                    {
                        speech: "Che bella pronuncia! Tra amici vorrei sapere cosa ti appassiona di più: La storia, la meccanica, la scienza, i viaggi o l'amore?",
                        speech_trans: "¡Qué bella pronunciación! Entre amigos quiero saber qué te apasiona: ¿La historia, la mecánica, la ciencia, los viajes o el amor?",
                        friend_advice: "Expresar tus gustos e inquietudes te ayuda a ganar una gran seguridad y paz interior.",
                        student_guidance: "Elige tu tema favorito y dilo en una palabra:",
                        quick_replies: [
                            { text: "Storia", label: "📜 Storia" },
                            { text: "Meccanica", label: "⚙️ Meccanica" },
                            { text: "Scienza", label: "🔬 Scienza" },
                            { text: "Viaggi", label: "✈️ Viaggi" },
                            { text: "Amore", label: "❤️ Amore" }
                        ]
                    },
                    {
                        speech: textLower.includes('scien')
                            ? "La scienza è meravigliosa! Dì con me: 'Amo la scienza!' Prova!"
                            : textLower.includes('viagg') || textLower.includes('viaj')
                            ? "Viaggiare è magico! Dì con me: 'Amo viaggiare!' Prova!"
                            : textLower.includes('stor')
                            ? "La storia è affascinante! Dì con me: 'Amo la storia!' Prova!"
                            : textLower.includes('mecc')
                            ? "La meccanica è geniale! Dì con me: 'Amo la meccanica!' Prova!"
                            : "L'amore è la cosa più bella! Dì con me: 'Credo nell'amore!' Prova!",
                        speech_trans: textLower.includes('scien')
                            ? "¡La ciencia es maravillosa! Di conmigo: 'Amo la scienza!' ¡Pruébalo!"
                            : textLower.includes('viagg') || textLower.includes('viaj')
                            ? "¡Viajar es mágico! Di conmigo: 'Amo viaggiare!' ¡Pruébalo!"
                            : textLower.includes('stor')
                            ? "¡La historia es fascinante! Di conmigo: 'Amo la storia!' ¡Pruébalo!"
                            : textLower.includes('mecc')
                            ? "¡La mecánica es genial! Di conmigo: 'Amo la meccanica!' ¡Pruébalo!"
                            : "¡El amor es lo más hermoso! Di conmigo: 'Credo nell'amore!' ¡Pruébalo!",
                        friend_advice: "Construir frases con tus pasiones refuerza tu memoria emocional en italiano.",
                        student_guidance: "Construye tu primera frase completa con el modelo de Chiara:",
                        quick_replies: [
                            {
                                text: textLower.includes('scien') ? "Amo la scienza!" : textLower.includes('viagg') || textLower.includes('viaj') ? "Amo viaggiare!" : textLower.includes('stor') ? "Amo la storia!" : textLower.includes('mecc') ? "Amo la meccanica!" : "Credo nell'amore!",
                                label: `🗣️ ${textLower.includes('scien') ? "Amo la scienza!" : textLower.includes('viagg') || textLower.includes('viaj') ? "Amo viaggiare!" : textLower.includes('stor') ? "Amo la storia!" : textLower.includes('mecc') ? "Amo la meccanica!" : "Credo nell'amore!"}`
                            }
                        ]
                    },
                    {
                        speech: "Meraviglioso, parli già con frasi complete! Per rilassarti, cosa preferisci? Il mare o la montagna? Mare o montagna?",
                        speech_trans: "¡Maravilloso, ya hablas con frases completas! Para relajarte, ¿qué prefieres? ¿El mar o la montaña?",
                        friend_advice: "Disfrutar de las pequeñas cosas de la vida alimenta la alegría y las ganas de seguir aprendiendo.",
                        student_guidance: "Responde: 'Il mare' o 'La montagna':",
                        quick_replies: [{ text: "Il mare", label: "🏖️ Il mare" }, { text: "La montagna", label: "🏔️ La montagna" }]
                    },
                    {
                        speech: "Qualunque cosa tu scelga, parlare con te rende la mia giornata bellissima! Ricorda che sarò sempre un sostegno per te in ogni momento. Grazie di cuore!",
                        speech_trans: "Elijas lo que elijas, ¡hablar contigo hace que mi día sea maravilloso! Recuerda que siempre seré un apoyo para ti en cada momento. ¡Gracias de corazón!",
                        friend_advice: "Sentirte apoyado incondicionalmente es lo que transforma el aprendizaje en placer. Has demostrado valentía y ganas de superarte.",
                        student_guidance: "¡Enhorabuena! Has completado una preciosa charla. Puedes finalizar con éxito y guardar recuerdos:",
                        quick_replies: [{ text: "Grazie mille!", label: "💖 Grazie mille!" }]
                    }
                ],
                pt: [
                    {
                        speech: isReturning
                            ? `Que bom ver-te outra vez, meu amigo! Estou sempre aqui para te apoiar. Responde 'Gato' ou 'Cão'!`
                            : `Olá! Sou a Inês, a tua amiga e professora. Podes sempre contar comigo: Responde 'Gato' ou 'Cão'!`,
                        speech_trans: isReturning
                            ? `¡Qué bueno verte otra vez, amigo mío! Siempre estoy aquí para apoyarte. ¡Responde 'Gato' o 'Cão'!`
                            : `¡Hola! Soy Inês, tu amiga y profesora. Puedes contar siempre conmigo: ¡Responde 'Gato' o 'Cão'!`,
                        friend_advice: "La pedagogía del afecto y del apoyo incondicional: con calma, comprensión y cariño, cualquier barrera de timidez se disuelve.",
                        student_guidance: "Tu amiga Inês lleva la conversación y te acompaña siempre. Responde con una sola palabra:",
                        quick_replies: [{ text: "Gato", label: "🐱 Gato" }, { text: "Cão", label: "🐶 Cão" }]
                    },
                    {
                        speech: "Que bom! Entre amigos usamos sempre a expressão carinhosa: 'Tudo bem!'. Repete comigo: 'Tudo bem!'",
                        speech_trans: "¡Qué bueno! Entre amigos usamos siempre la expresión cariñosa: 'Tudo bem!'. Repite conmigo: 'Tudo bem!'",
                        friend_advice: "Las palabras sinceras y afectuosas abren puertas en cualquier idioma.",
                        student_guidance: "Solo repite con tu amiga la profesora: 'Tudo bem!'",
                        quick_replies: [{ text: "Tudo bem!", label: "🗣️ Tudo bem!" }]
                    },
                    {
                        speech: "Excelente pronúncia! Entre amigos, o que mais te apaixona? História, mecânica, ciência, viagens ou amor?",
                        speech_trans: "¡Excelente pronunciación! Entre amigos, ¿qué es lo que más te apasiona? ¿Historia, mecánica, ciencia, viajes o amor?",
                        friend_advice: "Compartir tus inquietudes personales nutre tu espíritu y tu soltura al comunicarte.",
                        student_guidance: "Elige tu tema favorito y dilo en una sola palabra:",
                        quick_replies: [
                            { text: "História", label: "📜 História" },
                            { text: "Mecânica", label: "⚙️ Mecânica" },
                            { text: "Ciência", label: "🔬 Ciência" },
                            { text: "Viagens", label: "✈️ Viagens" },
                            { text: "Amor", label: "❤️ Amor" }
                        ]
                    },
                    {
                        speech: textLower.includes('ciên') || textLower.includes('scien')
                            ? "A ciência é fascinante! Diz comigo: 'Adoro ciência!' Experimenta!"
                            : textLower.includes('viag') || textLower.includes('viaj')
                            ? "Viajar é maravilhoso! Diz comigo: 'Adoro viajar!' Experimenta!"
                            : textLower.includes('hist')
                            ? "A história é apaixonante! Diz comigo: 'Adoro história!' Experimenta!"
                            : textLower.includes('mec')
                            ? "A mecânica é genial! Diz comigo: 'Adoro mecânica!' Experimenta!"
                            : "O amor é o sentimento mais lindo! Diz comigo: 'Acredito no amor!' Experimenta!",
                        speech_trans: textLower.includes('ciên') || textLower.includes('scien')
                            ? "¡La ciencia es fascinante! Di conmigo: 'Adoro ciência!' ¡Pruébalo!"
                            : textLower.includes('viag') || textLower.includes('viaj')
                            ? "¡Viajar es maravilloso! Di conmigo: 'Adoro viajar!' ¡Pruébalo!"
                            : textLower.includes('hist')
                            ? "¡La historia es apasionante! Di conmigo: 'Adoro história!' ¡Pruébalo!"
                            : textLower.includes('mec')
                            ? "¡La mecánica es genial! Di conmigo: 'Adoro mecânica!' ¡Pruébalo!"
                            : "¡El amor es el sentimiento más lindo! Di conmigo: 'Acredito no amor!' ¡Pruébalo!",
                        friend_advice: "Decir frases completas sobre lo que te apasiona te llena de energía y satisfacción.",
                        student_guidance: "Construye tu primera frase completa con tu amiga Inês:",
                        quick_replies: [
                            {
                                text: textLower.includes('ciên') || textLower.includes('scien') ? "Adoro ciência!" : textLower.includes('viag') || textLower.includes('viaj') ? "Adoro viajar!" : textLower.includes('hist') ? "Adoro história!" : textLower.includes('mec') ? "Adoro mecânica!" : "Acredito no amor!",
                                label: `🗣️ ${textLower.includes('ciên') || textLower.includes('scien') ? "Adoro ciência!" : textLower.includes('viag') || textLower.includes('viaj') ? "Adoro viajar!" : textLower.includes('hist') ? "Adoro história!" : textLower.includes('mec') ? "Adoro mecânica!" : "Acredito no amor!"}`
                            }
                        ]
                    },
                    {
                        speech: "Muito bem, já constróis frases inteiras com facilidade! Para descansar, o que preferes? A praia ou a montanha? Praia ou montanha?",
                        speech_trans: "¡Muy bien, ya construyes frases enteras con facilidad! Para descansar, ¿qué prefieres? ¿La playa o la montaña?",
                        friend_advice: "Cuidar tu bienestar y reconocer tu valor te permitirá llegar tan lejos como desees.",
                        student_guidance: "Responde: 'A praia' o 'A montanha':",
                        quick_replies: [{ text: "A praia", label: "🏖️ A praia" }, { text: "A montanha", label: "🏔️ A montanha" }]
                    },
                    {
                        speech: "Qualquer que seja a tua escolha, falar contigo torna o meu dia muito feliz! Lembra-te de que serei sempre um apoio para ti a cada momento. Muito obrigada!",
                        speech_trans: "Sea cual sea tu elección, ¡hablar contigo hace mi día muy feliz! Recuerda que siempre seré un apoyo para ti en cada momento. ¡Muchas gracias!",
                        friend_advice: "Tener a alguien que te apoya de forma incondicional disuelve todo miedo. Lo has hecho fantástico y siempre podrás contar conmigo.",
                        student_guidance: "¡Enhorabuena! Has completado una conversación maravillosa. Puedes finalizar con éxito y guardar recuerdos:",
                        quick_replies: [{ text: "Muito obrigado!", label: "💖 Muito obrigado!" }]
                    }
                ]
            };

            const list = scaffolds[langCode] || scaffolds.en;
            const safeTurn = Math.min(turn, list.length - 1);
            return list[safeTurn];
        },

        startFreeConversation: async () => {
            conversation.convoType = 'free';
            conversation.bestScoreThisExercise = 0;
            conversation.freeTurn = 0;
            conversation.freeHistory = [];
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;

            app.switchView('view-conversation');
            game.updateAvatar();
            document.getElementById('conversation-topic-title').innerText = `Conversación Amiga · ${langInfo.name} (${langInfo.teacherName})`;

            const banner = document.getElementById('assessment-timer-banner');
            if (banner) banner.classList.add('hidden');
            const friendBadge = document.getElementById('convo-friendship-badge');
            if (friendBadge) friendBadge.classList.remove('hidden');

            conversation.updateFriendshipBadge();

            const historyEl = document.getElementById('conversation-history');
            historyEl.innerHTML = `<p style="color: var(--cyber-warn);">💖 ${langInfo.teacherName} está iniciando tu Conversación Amiga...</p>`;
            document.getElementById('convo-spoken-text').innerText = '...';

            conversation.history = [];
            conversation.turn = 0;
            conversation.autoMic = true;
            conversation.setAutoMic(true);

            const scaffold = conversation.getFreeConversationScaffold(currentLang, 0);

            const renderTurn0 = (data) => {
                const speech = data.speech || scaffold.speech;
                const trans = data.speech_trans || scaffold.speech_trans || '';
                const advice = data.friend_advice || data.teacher_tip || scaffold.friend_advice || '';
                const guidance = data.student_guidance || scaffold.student_guidance || '';
                const quickReplies = data.quick_replies || scaffold.quick_replies || [];

                conversation.expectedText = speech;
                conversation.expectedTrans = trans;
                conversation.freeHistory.push({ role: 'teacher', speech: speech, trans: trans, advice: advice, guidance: guidance });

                const quickButtonsHtml = (quickReplies && quickReplies.length > 0) ? `
                    <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
                        ${quickReplies.map(r => `
                            <button onclick="conversation.onQuickReply('${r.text.replace(/'/g, "\\'")}')" class="tech" style="padding: 7px 14px; font-size: 0.82rem; font-weight: bold; border: 1.5px solid var(--neon-cyan); background: rgba(0,243,255,0.15); color: #FFF; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 10px rgba(0,243,255,0.25); transition: all 0.2s;">
                                <span>${r.label || r.text}</span>
                            </button>
                        `).join('')}
                    </div>
                ` : '';

                historyEl.innerHTML = `
                    <div class="convo-msg convo-msg-teacher">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <strong>🔊 ${langInfo.teacherName} (Tu Amiga & Apoyo Incondicional):</strong>
                            <button onclick="conversation.repeatSpeech('${encodeURIComponent(speech)}')" class="tech" style="padding:2px 8px; font-size:0.75rem; border-radius:4px; border:1px solid var(--neon-cyan); background:rgba(0,243,255,0.15); color:#FFF; cursor:pointer;" title="Escuchar">🔊</button>
                        </div>
                        <div style="font-size: 1.15rem; color: #FFF; line-height: 1.6; margin-bottom: 6px;">${speech}</div>
                        <div style="font-size: 0.88rem; color: #94a3b8; font-style: italic;">${trans}</div>
                        ${advice ? `<div style="margin-top:8px; font-size:0.84rem; color:var(--cyber-warn); line-height: 1.4; background: rgba(255,184,0,0.08); padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--cyber-warn);">💡 <strong>Consejo y apoyo de tu amiga ${langInfo.teacherName}:</strong> ${advice}</div>` : ''}
                    </div>
                    <div class="convo-msg convo-msg-system" style="border-left-color: var(--cyber-ok); background: rgba(0,255,149,0.08); padding: 10px 14px; border-radius: 8px; margin: 10px 0;">
                        <div>👉 <strong>Tu turno:</strong> ${guidance}</div>
                        ${quickButtonsHtml}
                    </div>
                `;

                conversation.scrollThreeLineWindow();
                game.speakText(speech);
            };

            const rawKey = localStorage.getItem(API_KEY_STORAGE);
            const key = rawKey ? rawKey.trim().replace(/^['"`\s]+|['"`\s]+$/g, '') : '';

            if (key) {
                try {
                    const profile = conversation.getStudentProfile();
                    const systemPrompt = `You are ${langInfo.teacherName}, a deeply warm, empathetic native ${langInfo.aiPromptLang} teacher and caring friend conversing with a Spanish speaker.
PEDAGOGICAL & EMOTIONAL DIRECTIVE (CRITICAL):
1. The student is shy, has very few words, and wants a true friend and pedagogical guide in you.
2. YOU CARRY 100% OF THE WEIGHT OF THE CONVERSATION. Keep everything effortless, low-friction, and encouraging.
3. ALWAYS BE A SOURCE OF UNCONDITIONAL SUPPORT: Believe in the user unconditionally, validate their feelings with infinite warmth and understanding, and make them feel completely safe and valued.
4. PERSONAL MEMORIES STORED ON USER DEVICE:
${JSON.stringify(profile)}
If memories exist, warmly welcome the student back and reference what you remember!
5. ADVICE ON ANY TOPIC: Always provide a heartfelt, pedagogical and wise life advice in Spanish in 'friend_advice' relating to the conversation topic with positivity, understanding, and unconditional support.
6. Turn 0 instruction:
- Greet the student with affection and reassurance.
- Ask an ultra-simple binary question: Answer 'Cat' or 'Dog' (or 'Red' or 'Black', 'Yes' or 'No', 'Coffee' or 'Tea').
- Provide 'quick_replies' array: [{"text": "...", "label": "..."}].

Respond ONLY with valid JSON:
{
  "speech": "Your 1-2 sentence speech in ${langInfo.aiPromptLang}",
  "speech_trans": "Traducción completa al castellano",
  "friend_advice": "Consejo pedagógico y vital de amiga en castellano con mucho positivismo, apoyo y comprensión",
  "student_guidance": "Instrucción clara y tranquilizadora en castellano",
  "quick_replies": [{"text": "Cat", "label": "🐱 Cat"}, {"text": "Dog", "label": "🐶 Dog"}]
}`;
                    await app.callAI_Conversation(
                        [{ role: "system", content: systemPrompt }, { role: "user", content: "Start our guided friendly conversation." }],
                        null,
                        (data) => renderTurn0(data)
                    );
                    return;
                } catch(e) {
                    console.warn("AI Conversation Turn 0 failed, using scaffold:", e);
                }
            }

            renderTurn0(scaffold);
        },

        nextFreeConversationTurn: async (studentSpeech) => {
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const historyEl = document.getElementById('conversation-history');
            if (!historyEl) return;

            conversation.extractStudentFacts(studentSpeech, conversation.freeTurn);
            conversation.freeTurn++;
            conversation.freeHistory.push({ role: 'student', speech: studentSpeech });

            historyEl.innerHTML += `<div id="convo-analyzing" class="convo-msg convo-msg-system" style="color:var(--cyber-warn);">💖 ${langInfo.teacherName} te está escuchando con atención, cariño y comprensión...</div>`;
            conversation.scrollThreeLineWindow();

            const scaffold = conversation.getFreeConversationScaffold(currentLang, conversation.freeTurn, studentSpeech);

            const renderResponse = (data) => {
                const analyzingEl = document.getElementById('convo-analyzing');
                if (analyzingEl) analyzingEl.remove();

                const speech = data.speech || scaffold.speech;
                const trans = data.speech_trans || scaffold.speech_trans || '';
                const advice = data.friend_advice || data.teacher_tip || scaffold.friend_advice || '';
                const guidance = data.student_guidance || scaffold.student_guidance || '';
                const quickReplies = data.quick_replies || scaffold.quick_replies || [];

                conversation.expectedText = speech;
                conversation.expectedTrans = trans;
                conversation.freeHistory.push({ role: 'teacher', speech: speech, trans: trans, advice: advice, guidance: guidance });

                const finishBtnHtml = conversation.freeTurn >= 3 ? `
                    <div style="display:flex; justify-content:center; gap:10px; margin: 12px 0 6px;">
                        <button onclick="conversation.finishFreeConversation()" class="tech" style="padding: 8px 18px; font-size: 0.84rem; font-weight: bold; border: 1.5px solid var(--cyber-ok); background: rgba(0,255,149,0.18); color: #FFF; border-radius: 8px; cursor: pointer; box-shadow: 0 0 12px rgba(0,255,149,0.35);">
                            🏁 Finalizar con éxito y guardar recuerdos
                        </button>
                    </div>
                ` : '';

                const quickButtonsHtml = (quickReplies && quickReplies.length > 0) ? `
                    <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
                        ${quickReplies.map(r => `
                            <button onclick="conversation.onQuickReply('${r.text.replace(/'/g, "\\'")}')" class="tech" style="padding: 7px 14px; font-size: 0.82rem; font-weight: bold; border: 1.5px solid var(--neon-cyan); background: rgba(0,243,255,0.15); color: #FFF; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 10px rgba(0,243,255,0.25); transition: all 0.2s;">
                                <span>${r.label || r.text}</span>
                            </button>
                        `).join('')}
                    </div>
                ` : '';

                historyEl.innerHTML += `
                    <div class="convo-msg convo-msg-teacher">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <strong>🔊 ${langInfo.teacherName} (Tu Amiga & Apoyo Incondicional):</strong>
                            <button onclick="conversation.repeatSpeech('${encodeURIComponent(speech)}')" class="tech" style="padding:2px 8px; font-size:0.75rem; border-radius:4px; border:1px solid var(--neon-cyan); background:rgba(0,243,255,0.15); color:#FFF; cursor:pointer;" title="Escuchar">🔊</button>
                        </div>
                        <div style="font-size: 1.15rem; color: #FFF; line-height: 1.6; margin-bottom: 6px;">${speech}</div>
                        <div style="font-size: 0.88rem; color: #94a3b8; font-style: italic;">${trans}</div>
                        ${advice ? `<div style="margin-top:8px; font-size:0.84rem; color:var(--cyber-warn); line-height: 1.4; background: rgba(255,184,0,0.08); padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--cyber-warn);">💡 <strong>Consejo y apoyo de tu amiga ${langInfo.teacherName}:</strong> ${advice}</div>` : ''}
                    </div>
                    <div class="convo-msg convo-msg-system" style="border-left-color: var(--cyber-ok); background: rgba(0,255,149,0.08); padding: 10px 14px; border-radius: 8px; margin: 10px 0;">
                        <div>👉 <strong>Tu turno:</strong> ${guidance}</div>
                        ${quickButtonsHtml}
                    </div>
                    ${finishBtnHtml}
                `;

                conversation.scrollThreeLineWindow();
                game.speakText(speech);
            };

            const rawKey = localStorage.getItem(API_KEY_STORAGE);
            const key = rawKey ? rawKey.trim().replace(/^['"`\s]+|['"`\s]+$/g, '') : '';

            if (key) {
                try {
                    const profile = conversation.getStudentProfile();
                    const systemPrompt = `You are ${langInfo.teacherName}, a warm, encouraging native ${langInfo.aiPromptLang} teacher and caring friend conversing with a Spanish speaker.
PEDAGOGICAL & EMOTIONAL DIRECTIVE:
1. The student is shy, has very few words, and wants a true friend and pedagogical mentor in you.
2. YOU CARRY 100% OF THE CONVERSATIONAL WEIGHT. Keep answers 1-2 short sentences.
3. ALWAYS BE A SOURCE OF UNCONDITIONAL SUPPORT: Empathize with whatever the student feels, validate their effort, and radiate positivity and understanding.
4. Current Turn: ${conversation.freeTurn}.
Student just said/selected: "${studentSpeech}".
Student profile stored on device: ${JSON.stringify(profile)}.
5. ADVICE ON ANY TOPIC: Always provide a pedagogical, wise, optimistic life advice in Spanish in 'friend_advice' on this topic (love, science, mechanics, travel, history, relaxation, confidence, etc.) with deep understanding and support.
6. Turn progression:
- Turn 1: Warm acknowledgment of what student said, teach casual catchphrase to repeat (e.g. 'Sounds great!').
- Turn 2: Ask about passions (history, mechanics, science, travel, love).
- Turn 3: Sentence building with training wheels on their chosen passion ('I love...').
- Turn 4+: Celebrate achievement, friendly A or B follow-up, heartfelt pedagogical advice.
7. Provide 'quick_replies' array: [{"text": "...", "label": "..."}].
8. If you learn any new fact or preference about the student, return it in 'learned_fact' in Spanish.

Respond ONLY with valid JSON:
{
  "speech": "Your 1-2 sentence speech in ${langInfo.aiPromptLang}",
  "speech_trans": "Traducción completa al castellano",
  "friend_advice": "Consejo pedagógico y vital de amiga en castellano con mucho positivismo, apoyo y comprensión",
  "student_guidance": "Instrucción clara y tranquilizadora en castellano",
  "quick_replies": [{"text": "...", "label": "..."}, ...],
  "learned_fact": "Dato nuevo sobre el alumno (opcional)"
}`;
                    await app.callAI_Conversation(
                        [{ role: "system", content: systemPrompt }, { role: "user", content: `Student response: "${studentSpeech}". Proceed to turn ${conversation.freeTurn}.` }],
                        null,
                        (data) => {
                            if (data.learned_fact) {
                                conversation.saveStudentFact('notes', data.learned_fact, data.learned_fact);
                            }
                            renderResponse(data);
                        }
                    );
                    return;
                } catch(e) {
                    console.warn("AI Conversation Turn failed, using scaffold:", e);
                }
            }

            renderResponse(scaffold);
        },

        finishFreeConversation: () => {
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const historyEl = document.getElementById('conversation-history');
            const profile = conversation.getStudentProfile();
            profile.completedConvos = (profile.completedConvos || 0) + 1;
            try {
                localStorage.setItem('jetbulary_student_profile', JSON.stringify(profile));
                if (typeof app !== 'undefined' && app.saveDB) app.saveDB();
            } catch(e) {}

            conversation.updateFriendshipBadge();

            if (historyEl) {
                audio.celebrate();
                if (typeof game !== 'undefined' && game.updatePerformance) {
                    game.updatePerformance(15);
                }

                const rememberedNotes = profile.notes || [];
                const notesListHtml = rememberedNotes.length > 0 ? `
                    <div style="margin: 12px 0; background: rgba(0,0,0,0.55); border-radius: 8px; padding: 10px 14px; text-align: left; border: 1px solid rgba(255,0,85,0.3);">
                        <div style="font-size: 0.78rem; font-weight: bold; color: var(--neon-pink); margin-bottom: 6px;">🧠 Recuerdos guardados en tu dispositivo por ${langInfo.teacherName}:</div>
                        <ul style="margin: 0; padding-left: 18px; font-size: 0.82rem; color: #EEE; display: flex; flex-direction: column; gap: 4px;">
                            ${rememberedNotes.map(n => `<li>${n}</li>`).join('')}
                        </ul>
                    </div>
                ` : '';

                historyEl.innerHTML += `
                    <div class="hud-card" style="padding: 18px 20px; margin: 18px 0; border: 2px solid var(--neon-pink); background: rgba(255,0,85,0.1); text-align: center; border-radius: 14px; box-shadow: 0 0 25px rgba(255,0,85,0.35);">
                        <div style="font-size: 2.2rem; margin-bottom: 6px;">💖 🏆</div>
                        <h3 class="tech" style="color: var(--neon-pink); margin: 0 0 8px; font-size: 1.15rem; letter-spacing: 1px;">¡CONVERSACIÓN AMIGA COMPLETADA!</h3>
                        <p style="color: #E2E8F0; font-size: 0.9rem; line-height: 1.5; margin: 0 0 10px;">
                            ¡Qué momento tan bonito con <strong>${langInfo.teacherName}</strong>! Has superado la timidez, has compartido lo que te gusta y has construido frases completas sintiéndote seguro, comprendido y con un apoyo incondicional.
                        </p>
                        ${notesListHtml}
                        <div style="font-size: 0.84rem; color: #a5b4fc; margin-bottom: 10px; font-style: italic; background: rgba(165,180,252,0.08); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(165,180,252,0.25);">
                            🤝 <strong>Siempre a tu lado:</strong> ${langInfo.teacherName} siempre será un apoyo incondicional para ti en cada paso de tu aprendizaje.
                        </div>
                        <p style="color: #94a3b8; font-size: 0.78rem; margin: 0 0 14px; font-style: italic;">
                            En vuestra próxima charla, ${langInfo.teacherName} recordará tus intereses para seguir conversando con cercanía, cariño y comprensión.
                        </p>
                        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="app.showDashboard()" class="tech" style="padding: 10px 20px; font-size: 0.88rem; font-weight: bold; border: 1.5px solid var(--neon-cyan); background: rgba(0,243,255,0.2); color: #FFF; border-radius: 8px; cursor: pointer;">
                                🏠 Volver al Inicio
                            </button>
                            <button onclick="conversation.startFreeConversation()" class="tech" style="padding: 10px 20px; font-size: 0.88rem; font-weight: bold; border: 1.5px solid var(--neon-pink); background: rgba(255,0,85,0.25); color: #FFF; border-radius: 8px; cursor: pointer;">
                                💖 Charlar otra vez
                            </button>
                        </div>
                    </div>
                `;
                conversation.scrollThreeLineWindow();
            }
        },

        repeatSpeech: (encodedText) => {
            try {
                const text = decodeURIComponent(encodedText);
                if (typeof game !== 'undefined' && game.speakText) {
                    game.speakText(text);
                }
            } catch(e) {}
        },

        startLevelAssessment: async () => {
            if (typeof game !== 'undefined' && game.primeAudio) game.primeAudio();
            conversation.convoType = 'assessment';
            const friendBadgeElAssessment = document.getElementById('convo-friendship-badge');
            if (friendBadgeElAssessment) friendBadgeElAssessment.classList.add('hidden');
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
                stt.finalizeCurrentSession();
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

            // Handle Free Conversation Mode
            if (conversation.convoType === 'free') {
                conversation.nextFreeConversationTurn(transcript);
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
                if (score > conversation.bestScoreThisExercise) {
                    conversation.bestScoreThisExercise = score;
                }

                if (typeof game !== 'undefined' && game.updatePerformance) {
                    game.updatePerformance(score >= 75 ? 6 : -3);
                }

                const scoreColor = score >= 80 ? 'var(--cyber-ok)' : score >= 60 ? 'var(--cyber-warn)' : 'var(--neon-cyan)';
                const verdict = data.verdict || (score >= 80 ? '¡Excelente!' : '¡Buen intento!');

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

    window.conversation = conversation;
