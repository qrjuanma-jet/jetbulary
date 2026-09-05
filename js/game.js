// ====== GAME OBJECT ======
    const game = {
        data: [], index: 0, recognition: null, autoMic: true, currentRetries: 0,
        timerInterval: null, wasAutoMic: false, lastText: '', isSessionMode: false, sessionCycle: 0,
        performanceScore: 75,
        sessionMistakes: [],
        sessionWordsPracticed: [],
        lastReportData: null,

        updatePerformance: (delta = 0) => {
            if (delta !== 0) {
                game.performanceScore = Math.max(5, Math.min(100, (game.performanceScore || 75) + delta));
            } else if (!game.performanceScore) {
                game.performanceScore = 75;
            }

            const pct = Math.max(5, Math.min(100, Math.round(game.performanceScore)));
            const bar = document.getElementById('game-performance-bar');
            const label = document.getElementById('game-performance-pct');
            const convoBar = document.getElementById('convo-performance-bar');
            const convoLabel = document.getElementById('convo-performance-pct');

            let shadow = '0 0 10px rgba(0, 255, 149, 0.6)';
            if (pct < 40) shadow = '0 0 12px rgba(255, 0, 85, 0.8)';
            else if (pct < 70) shadow = '0 0 10px rgba(255, 180, 0, 0.7)';

            if (bar) {
                bar.style.width = pct + '%';
                bar.style.boxShadow = shadow;
            }
            if (label) {
                label.innerText = pct + '%';
                label.style.color = pct >= 70 ? 'var(--cyber-ok)' : pct >= 40 ? 'var(--cyber-warn)' : 'var(--neon-pink)';
            }
            if (convoBar) {
                convoBar.style.width = pct + '%';
                convoBar.style.boxShadow = shadow;
            }
            if (convoLabel) {
                convoLabel.innerText = pct + '%';
                convoLabel.style.color = pct >= 70 ? 'var(--cyber-ok)' : pct >= 40 ? 'var(--cyber-warn)' : 'var(--neon-pink)';
            }
        },

        isCloseMatch: (target, spoken) => {
            if (!target || !spoken) return false;
            
            // Clean & normalize both strings
            const normalize = (str) => str.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, " ") // remove punctuation
                .replace(/\s+/g, " ").trim();

            const cleanTarget = normalize(target);
            const cleanSpoken = normalize(spoken);

            if (cleanTarget === cleanSpoken) return true;
            if (cleanSpoken.includes(cleanTarget)) return true;

            // Split into words
            const targetWords = cleanTarget.split(' ').filter(w => w.length > 0);
            const spokenWords = cleanSpoken.split(' ').filter(w => w.length > 0);

            // Filter out common helper articles
            const commonArticles = new Set(['to', 'the', 'a', 'an', 'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'le', 'la', 'les', 'un', 'une', 'du', 'de', 'el', 'la', 'los', 'las', 'un', 'una']);
            const meaningfulTargetWords = targetWords.filter(w => !commonArticles.has(w));
            const meaningfulSpokenWords = spokenWords.filter(w => !commonArticles.has(w));

            // Check direct match on any meaningful word
            for (const tw of (meaningfulTargetWords.length > 0 ? meaningfulTargetWords : targetWords)) {
                for (const sw of (meaningfulSpokenWords.length > 0 ? meaningfulSpokenWords : spokenWords)) {
                    if (sw === tw || sw.includes(tw) || tw.includes(sw)) return true;
                }
            }

            // Levenshtein similarity calculation
            const levDist = (s1, s2) => {
                const costs = [];
                for (let i = 0; i <= s1.length; i++) {
                    let lastValue = i;
                    for (let j = 0; j <= s2.length; j++) {
                        if (i === 0) costs[j] = j;
                        else if (j > 0) {
                            let newValue = costs[j - 1];
                            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                            }
                            costs[j - 1] = lastValue;
                            lastValue = newValue;
                        }
                    }
                    if (i > 0) costs[s2.length] = lastValue;
                }
                return costs[s2.length];
            };

            const mainTarget = (meaningfulTargetWords.length > 0 ? meaningfulTargetWords.join(' ') : cleanTarget);
            const mainSpoken = (meaningfulSpokenWords.length > 0 ? meaningfulSpokenWords.join(' ') : cleanSpoken);
            const maxLen = Math.max(mainTarget.length, mainSpoken.length);
            if (maxLen === 0) return true;
            
            const dist = levDist(mainTarget, mainSpoken);
            const similarity = 1 - (dist / maxLen);

            const levelNum = db.academy_level || 0;
            const thresholds = [0.20, 0.30, 0.40, 0.55, 0.70];
            const requiredThreshold = thresholds[levelNum] !== undefined ? thresholds[levelNum] : 0.25;

            return similarity >= requiredThreshold;
        },

        // Comprobación estricta para frases completas de lección (evita cortar al alumno tras la primera palabra)
        isFullSentenceMatch: (target, spoken) => {
            if (!target || !spoken) return false;
            const normalize = (str) => str.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, " ")
                .replace(/\s+/g, " ").trim();

            const cleanTarget = normalize(target);
            const cleanSpoken = normalize(spoken);

            if (cleanTarget === cleanSpoken) return true;

            const targetWords = cleanTarget.split(' ').filter(w => w.length > 0);
            const spokenWords = cleanSpoken.split(' ').filter(w => w.length > 0);

            // Si el alumno ha pronunciado menos del 85% de las palabras, la frase aún NO está terminada
            if (spokenWords.length < Math.ceil(targetWords.length * 0.85)) return false;

            const levDist = (s1, s2) => {
                const costs = [];
                for (let i = 0; i <= s1.length; i++) {
                    let lastValue = i;
                    for (let j = 0; j <= s2.length; j++) {
                        if (i === 0) costs[j] = j;
                        else if (j > 0) {
                            let newValue = costs[j - 1];
                            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                            }
                            costs[j - 1] = lastValue;
                            lastValue = newValue;
                        }
                    }
                    if (i > 0) costs[s2.length] = lastValue;
                }
                return costs[s2.length];
            };

            const maxLen = Math.max(cleanTarget.length, cleanSpoken.length);
            if (maxLen === 0) return true;
            const dist = levDist(cleanTarget, cleanSpoken);
            const similarity = 1 - (dist / maxLen);

            // Requiere al menos un 88% de coincidencia global sobre la frase completa
            return similarity >= 0.88;
        },

        start: (topicId) => {
            let words = db.words.filter(w => w.topic_id === topicId);
            if (words.length === 0) return alert("No words available.");
            game.data = words.sort(() => Math.random() - 0.5).slice(0, 10);
            game.index = 0; game.isSessionMode = false;
            game.sessionMistakes = [];
            game.sessionWordsPracticed = [];
            app.switchView('view-game');
            game.setAutoMic(true); game.updateAvatar();
            game.updatePerformance(0);
            document.getElementById('session-words-overview').innerHTML = '';
            game.loadCard();
        },

        setAutoMic: (state) => {
            game.autoMic = state;
            const btnOn = document.getElementById('btn-game-auto-on');
            const btnOff = document.getElementById('btn-game-auto-off');
            if (btnOn && btnOff) {
                btnOn.className = state ? 'auto-mic-on' : 'secondary';
                btnOff.className = state ? 'secondary' : 'auto-mic-on';
            }
        },

        updateAvatar: () => {
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            document.querySelectorAll('.avatar-container').forEach(c => {
                c.innerHTML = '';
                c.style.cursor = 'pointer';
                c.title = `Teacher: ${langInfo.teacherName} (${langInfo.name}) - Click to change`;
                c.onclick = () => app.openTeacherModal();
                const img = new Image();
                img.className = 'avatar-img face-img';
                img.alt = langInfo.teacherTitle;
                img.dataset.idleSrc = langInfo.face;
                img.dataset.speakingSrc = langInfo.gif;
                img.dataset.gifSrc = langInfo.gif;
                img.onerror = function() { if (this.src.includes('.gif')) this.src = 'icon.png'; else this.src = langInfo.gif; };
                img.src = langInfo.gif;
                img.onload = function() {
                    if (this.src.includes('.gif') && !this.dataset.staticSrc) {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = this.naturalWidth; canvas.height = this.naturalHeight;
                            canvas.getContext('2d').drawImage(this, 0, 0);
                            this.dataset.staticSrc = canvas.toDataURL();
                            if (!c.classList.contains('talking')) this.src = this.dataset.staticSrc;
                        } catch(e) {}
                    }
                };
                c.appendChild(img);
            });
            if (typeof app !== 'undefined' && app.setupTeacherAvatars) {
                app.setupTeacherAvatars();
            }
        },

        loadCard: () => {
            if (game.index >= game.data.length) {
                if (game.isSessionMode) {
                    session.onWordComplete();
                    return;
                }
                alert("Well done! Keep practicing!");
                app.showDashboard();
                return;
            }
            game.stopMic();
            const item = game.data[game.index];
            game.currentRetries = 0;

            if (item) {
                if (!game.sessionWordsPracticed) game.sessionWordsPracticed = [];
                if (!game.sessionWordsPracticed.some(w => w.id === item.id)) {
                    game.sessionWordsPracticed.push(item);
                }
            }

            const cleanWord = item.english.includes('(') ? item.english.split('(')[0].trim() : item.english;
            const displayEl = document.getElementById('word-display');
            if (displayEl) displayEl.innerHTML = `${cleanWord} <span style="color: var(--neon-pink); font-size: 0.6em;">(${item.spanish})</span>`;
            const ipaEl = document.getElementById('word-ipa');
            if (ipaEl) ipaEl.innerText = item.ipa || '';

            document.getElementById('prompt-pronounce').innerText = 'PRACTICE: SAY THE WORD';
            document.getElementById('feedback-msg').innerText = "";
            document.getElementById('ai-advice').classList.add('hidden');
            document.getElementById('spoken-text').innerText = "...";
            document.getElementById('next-btn').classList.add('hidden');
            document.getElementById('mic-btn').classList.remove('hidden');
            document.getElementById('fail-options').classList.add('hidden');

            setTimeout(() => game.speak(), 500);
        },

        speakAdvice: (text, rateOverride = 0.85) => {
            if (!text) return;
            if (typeof audio !== 'undefined' && audio.stopSpeech) audio.stopSpeech();
            else window.speechSynthesis.cancel();

            const onStartAnim = () => {
                document.querySelectorAll('.avatar-container').forEach(el => el.classList.add('talking'));
                document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.gifSrc) img.src = img.dataset.gifSrc; });
                const mainBtn = document.getElementById('btn-speak-report-main');
                if (mainBtn) mainBtn.style.boxShadow = '0 0 20px rgba(0, 243, 255, 0.8)';
            };

            const onEndAnim = () => {
                document.querySelectorAll('.avatar-container').forEach(el => el.classList.remove('talking'));
                document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.staticSrc) img.src = img.dataset.staticSrc; else if (img.dataset.idleSrc) img.src = img.dataset.idleSrc; });
                const mainBtn = document.getElementById('btn-speak-report-main');
                if (mainBtn) mainBtn.style.boxShadow = 'none';
            };

            onStartAnim();
            if (typeof audio !== 'undefined' && audio.speakNative) {
                audio.speakNative(text, currentLang, onEndAnim, rateOverride);
            } else {
                const u = new SpeechSynthesisUtterance(text);
                u.rate = rateOverride;
                u.lang = LANGUAGES[currentLang]?.speechLang || 'es-ES';
                u.onend = onEndAnim;
                u.onerror = onEndAnim;
                window.speechSynthesis.speak(u);
            }
        },

        showPerformanceReport: async () => {
            game.stopMic();
            window.speechSynthesis.cancel();

            const modal = document.getElementById('modal-performance-report');
            if (modal) modal.classList.remove('hidden');
            history.pushState({ modal: 'performance-report' }, null, '#performance-report');

            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const avatarModal = document.getElementById('avatar-report-modal');
            if (avatarModal) {
                avatarModal.innerHTML = `<img src="${langInfo.gif}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; border: 1.5px solid var(--neon-cyan); box-shadow: 0 0 10px rgba(0,243,255,0.4);">`;
            }
            const titleEl = document.getElementById('report-teacher-name');
            if (titleEl) titleEl.innerText = `${langInfo.teacherName} · Performance Report`;
            const subtitleEl = document.getElementById('report-session-subtitle');
            if (subtitleEl) subtitleEl.innerText = `${langInfo.name} · Level ${app.getLevelLabels()[db.academy_level || 0] || 'A1-A2'}`;
            const speakBtnLbl = document.getElementById('lbl-speak-report-btn');
            if (speakBtnLbl) speakBtnLbl.innerText = `Listen to ${langInfo.teacherName}`;

            const bodyEl = document.getElementById('report-modal-body');
            if (!bodyEl) return;

            bodyEl.innerHTML = `
                <div style="text-align: center; padding: 40px 10px;">
                    <div style="font-size: 2.6rem; margin-bottom: 12px; display: inline-block; animation: bounce 1.2s infinite;">👩‍🏫</div>
                    <div style="font-family: 'Orbitron', sans-serif; color: var(--neon-cyan); font-weight: bold; font-size: 1.05rem; letter-spacing: 0.5px;">${langInfo.teacherName} is analyzing your session...</div>
                    <div style="color: #888; font-size: 0.82rem; margin-top: 8px;">Evaluating pronunciation, fluency, retries, and study tips...</div>
                </div>
            `;

            const levelLabels = app.getLevelLabels();
            const currentLevelIdx = db.academy_level || 0;
            const currentLevelName = levelLabels[currentLevelIdx] || 'A1-A2';
            const performanceScore = Math.round(game.performanceScore || 75);

            const wordsPracticed = game.sessionWordsPracticed && game.sessionWordsPracticed.length > 0
                ? game.sessionWordsPracticed
                : (game.data && game.data.length > 0 ? game.data.slice(0, 4) : []);
            
            const wordsPracticedStr = wordsPracticed.map(w => w.english).join(', ');
            const mistakesList = game.sessionMistakes || [];
            const mistakesStr = mistakesList.map(m => `"${m.word}" (IPA: /${m.ipa || ''}/, student said: "${m.spoken || ''}", retries: ${m.retries})`).join('; ');
            
            // Datos del ejercicio de lección (frase contextual)
            const lessonData = (typeof session !== 'undefined' && session.lastLessonData) ? session.lastLessonData : null;
            const lessonSummaryStr = lessonData
                ? `Frase objetivo de la lección: "${lessonData.phrase}", Lo que dijo el alumno: "${lessonData.spoken}", Puntuación obtenida: ${lessonData.score}%, Veredicto: "${lessonData.verdict || ''}", Consejo recibido: "${lessonData.tips || ''}"`
                : 'El ejercicio de lección aún no ha sido completado en esta sesión';

            const levelGuidelines = [
                {
                    levelName: 'A0 (Starter / Absolute Beginner)',
                    targetAudience: 'Absolute beginner with zero prior background.',
                    vocabularyRange: 'Ultra-simple, high-frequency, everyday words (colors, numbers, objects, greetings).',
                    grammarScope: 'Fundamental basics: simple present tense, subject pronouns (I, you, he/she), singular/plural nouns, basic negation (is not / do not). Keep explanations extremely simple and brief.',
                    idiomsScope: 'Ultra-basic daily functional phrases (e.g. "Have a nice day!", "Nice to meet you!", "Take care!").',
                    phoneticsScope: 'Single vowel clarity, simple consonant sounds, slow and deliberate syllable pronunciation.',
                    sentenceComplexity: 'Short, clean 3-5 word sentences. No subordinate clauses or difficult jargon.'
                },
                {
                    levelName: 'A1-A2 (Basic / Elementary)',
                    targetAudience: 'Elementary student building basic everyday conversational confidence.',
                    vocabularyRange: 'Common daily vocabulary (family, daily routines, food, directions, time).',
                    grammarScope: 'Present simple vs present continuous, past simple (regular -ed and top irregulars: go/went, see/saw, have/had), prepositions of place and time (in, on, at).',
                    idiomsScope: 'Everyday common colloquialisms (e.g. "Piece of cake", "See you later", "Hold on a minute").',
                    phoneticsScope: 'Word stress on 2-syllable words, silent letters (e.g. know, walk), basic sentence rhythm.',
                    sentenceComplexity: 'Simple compound sentences with basic connectors (and, but, because). 5-7 words per sentence.'
                },
                {
                    levelName: 'B1 (Intermediate)',
                    targetAudience: 'Independent learner capable of understanding main points in familiar matters.',
                    vocabularyRange: 'Broad practical vocabulary, emotions, travel, work, abstract feelings, common phrasal verbs.',
                    grammarScope: 'Present perfect, modals of deduction/obligation (should, must, might), first and second conditionals, passive voice introduction, irregular verb past participles.',
                    idiomsScope: 'Authentic native idioms and multi-word phrasal verbs (e.g. "Hit the nail on the head", "Break the ice", "Call it a day").',
                    phoneticsScope: 'Connected speech, linking vowels, contractions (gonna, wanna, shouldn\'t have), distinguishing similar vowel sounds (ship vs sheep).',
                    sentenceComplexity: 'Varied sentences with relative clauses (who, which, that) and conditional structures. 7-10 words per sentence.'
                },
                {
                    levelName: 'B2 (Advanced / Upper Intermediate)',
                    targetAudience: 'Competent speaker needing nuance, fluidity, and stylistic precision.',
                    vocabularyRange: 'Expressive synonyms, precise adjectives, academic/workplace collocations, subtle nuances.',
                    grammarScope: 'Third & mixed conditionals, subjunctive nuances, passive reporting verbs, inversion for emphasis, complex prepositional phrases.',
                    idiomsScope: 'Metaphorical idioms, figurative native expressions, colloquial nuances (e.g. "Burn the midnight oil", "Read between the lines", "Steal someone\'s thunder").',
                    phoneticsScope: 'Intonation contours, emphatic stress, reduction of unstressed syllables (schwa), rhythm modulation.',
                    sentenceComplexity: 'Complex sentences with participial clauses, fronting, and varied discourse markers. 8-14 words.'
                },
                {
                    levelName: 'C1+ (Native / Master / Professional)',
                    targetAudience: 'Near-native fluency, professional precision, and literary/cultural depth.',
                    vocabularyRange: 'Sophisticated lexicon, rhetorical devices, rare idioms, double entendres, domain-specific terminology.',
                    grammarScope: 'Advanced stylistic structures, cleft sentences (What surprised me was...), inversion, nuanced modal perfects, advanced ellipsis and substitution.',
                    idiomsScope: 'Deep cultural allusions, subtle colloquial wit, literary metaphors, proverbs.',
                    phoneticsScope: 'Micro-phonetics, native assimilation, elision, glottal stops, subtle dialectal variations.',
                    sentenceComplexity: 'Natural, elegant, complex native prose with effortless syntactic flexibility.'
                }
            ];

            const currentGuide = levelGuidelines[currentLevelIdx] || levelGuidelines[1];

            const systemPrompt = `You are ${langInfo.teacherName}, a warm, inspiring, expert native ${langInfo.aiPromptLang} teacher in Jetbulary.
The student has selected CEFR Level: ${currentLevelName} (Level index ${currentLevelIdx} out of 4).
Their current session Performance (Rdto.): ${performanceScore}%.

STUDENT SESSION WORK EVIDENCE (EVALUATE BOTH EXERCISES):
1. Single-Word Repetition Exercise:
   - Words practiced: ${wordsPracticedStr || 'Standard curriculum vocabulary'}.
   - Single-word pronunciation challenges / retries: ${mistakesStr || 'Accurate and clean initial attempts'}.
2. Contextual Lesson Sentence Exercise:
   - Lesson evidence: ${lessonSummaryStr}.

MANDATORY DUAL EVALUATION CRITERIA:
In your evaluation and encouragement, you MUST explicitly assess BOTH:
a) Word-level phonetic precision and individual sound articulation (from the word repetition drill).
b) Sentence-level fluidity, linking words together, intonation, and rhythm (from the lesson sentence practice).

======================================================================
STRICT CEFR LEVEL COMPLEXITY CALIBRATION (MANDATORY REQUIREMENT):
You MUST strictly adapt the complexity of your explanations, vocabulary, grammar topics, idioms, curiosities, phonetic depth, and sentence lengths to match Level ${currentLevelName}:
- Target Level: ${currentGuide.levelName}
- Target Audience: ${currentGuide.targetAudience}
- Vocabulary Scope: ${currentGuide.vocabularyRange}
- Grammar & Structural Complexity: ${currentGuide.grammarScope}
- Idioms & Expressions Complexity: ${currentGuide.idiomsScope}
- Phonetics Focus: ${currentGuide.phoneticsScope}
- Sentence Length & Structure: ${currentGuide.sentenceComplexity}
DO NOT exceed this level of complexity. Keep simpler levels (A0/A1) accessible, brief and crystal clear. Make higher levels (B2/C1) rich, deep and nuanced.
======================================================================

CRITICAL LANGUAGE REQUIREMENT:
You MUST write the ENTIRE response in ${langInfo.aiPromptLang}. DO NOT write in Spanish. Every single advice, encouragement, grammar explanation, idiom, curiosity, and example must be written in natural ${langInfo.aiPromptLang}, calibrated to the CEFR level above.

YOUR TASK:
1. Provide a warm, diagnostic evaluation assessing BOTH individual word pronunciation and the lesson sentence flow, along with an inspiring MOTIVATIONAL ENCOURAGEMENT message.
2. Evaluate whether the student should "upgrade" to level index ${Math.min(4, currentLevelIdx + 1)} (${levelLabels[Math.min(4, currentLevelIdx + 1)]}) if ${performanceScore}% >= 85%, "downgrade" to level index ${Math.max(0, currentLevelIdx - 1)} if ${performanceScore}% < 45%, or "stay" at level ${currentLevelName}.
3. Provide practical GRAMMAR & STRUCTURAL INSIGHTS calibrated to ${currentGuide.levelName} (including irregular verbs, conjugation nuances, or sentence structures related to the session).
4. Share actionable NATIVE PRONUNCIATION HACKS & TRICKS (trucos de pronunciación) calibrated to ${currentGuide.levelName} with physical tongue/lip mouth techniques and test phrases.
5. Propose 3 STRUCTURED ADAPTIVE LESSONS (Lecciones Adaptadas) designed specifically for the student's dual performance (${performanceScore}%), mistakes, and level (${currentLevelName}) to systematically master and level up:
   - Lesson 1: Targeted recovery & phonetics of session mistakes/gaps.
   - Lesson 2: Core level grammar & vocabulary solidification.
   - Lesson 3: Level Up Challenge (higher-complexity transition items to advance to next level).
   Each lesson must include 4 target words with IPA, Spanish translations, and sample sentences.
6. Share authentic IDIOMS & EVERYDAY EXPRESSIONS (modismos / collocations) calibrated to ${currentGuide.levelName} with meanings and natural examples.
7. Share a fascinating LINGUISTIC CURIOSITY / FUN FACT about ${langInfo.name} calibrated to ${currentGuide.levelName} (etymology, cultural trivia, false friends).
8. Provide actionable STUDY TIPS and a targeted PRONUNCIATION CLINIC matching ${currentGuide.phoneticsScope}.

Respond ONLY with a valid JSON object matching this schema:
{
  "summary_title": "Short energetic title in ${langInfo.aiPromptLang}",
  "performance_rating": "Rating in ${langInfo.aiPromptLang} (e.g. Outstanding / Strong / Developing / Needs Practice)",
  "encouragement": "A warm, inspiring motivational message in ${langInfo.aiPromptLang} directly praising their effort across words and lesson, building confidence, and energizing them.",
  "evaluation": "2-3 sentences in ${langInfo.aiPromptLang} evaluating their single-word phonetic accuracy and their sentence rhythm/fluency in the lesson based on their ${performanceScore}% Rdto. at level ${currentLevelName}.",
  "level_recommendation": {
    "action": "stay" or "upgrade" or "downgrade",
    "target_level_index": number (0 to 4),
    "target_level_name": "Level label",
    "title": "Short title in ${langInfo.aiPromptLang}",
    "reason": "1-2 clear sentences in ${langInfo.aiPromptLang} explaining why you recommend advancing, staying, or reinforcing a lower level."
  },
  "adaptive_lessons": [
    {
      "lesson_number": 1,
      "lesson_title": "Title in ${langInfo.aiPromptLang} (e.g. 'Phonetic Accuracy & Mistake Mastery')",
      "objective": "Clear 1-sentence goal in ${langInfo.aiPromptLang} based on session performance",
      "target_words": [
        { "word": "word1", "ipa": "ipa1", "spanish": "traducción", "sentence": "Example sentence 1." },
        { "word": "word2", "ipa": "ipa2", "spanish": "traducción", "sentence": "Example sentence 2." },
        { "word": "word3", "ipa": "ipa3", "spanish": "traducción", "sentence": "Example sentence 3." },
        { "word": "word4", "ipa": "ipa4", "spanish": "traducción", "sentence": "Example sentence 4." }
      ]
    },
    {
      "lesson_number": 2,
      "lesson_title": "Title in ${langInfo.aiPromptLang} (e.g. 'Core Grammar & Structure Expansion')",
      "objective": "Grammar and sentence fluidity goal in ${langInfo.aiPromptLang}",
      "target_words": [
        { "word": "word1", "ipa": "ipa1", "spanish": "traducción", "sentence": "Example sentence 1." },
        { "word": "word2", "ipa": "ipa2", "spanish": "traducción", "sentence": "Example sentence 2." },
        { "word": "word3", "ipa": "ipa3", "spanish": "traducción", "sentence": "Example sentence 3." },
        { "word": "word4", "ipa": "ipa4", "spanish": "traducción", "sentence": "Example sentence 4." }
      ]
    },
    {
      "lesson_number": 3,
      "lesson_title": "Title in ${langInfo.aiPromptLang} (e.g. 'Level Up Challenge: Road to Next CEFR Level')",
      "objective": "Higher complexity challenge in ${langInfo.aiPromptLang} to step up",
      "target_words": [
        { "word": "word1", "ipa": "ipa1", "spanish": "traducción", "sentence": "Example sentence 1." },
        { "word": "word2", "ipa": "ipa2", "spanish": "traducción", "sentence": "Example sentence 2." },
        { "word": "word3", "ipa": "ipa3", "spanish": "traducción", "sentence": "Example sentence 3." },
        { "word": "word4", "ipa": "ipa4", "spanish": "traducción", "sentence": "Example sentence 4." }
      ]
    }
  ],
  "grammar_insights": [
    {
      "topic": "Grammar / Irregular Form Topic name in ${langInfo.aiPromptLang} (calibrated to ${currentLevelName})",
      "explanation": "Clear, practical grammar explanation in ${langInfo.aiPromptLang}",
      "example": "Short example showing the rule in action in ${langInfo.aiPromptLang}"
    }
  ],
  "pronunciation_hacks": [
    {
      "hack_title": "Clever name for the pronunciation trick in ${langInfo.aiPromptLang}",
      "target_sound": "Target sound / IPA (e.g. /θ/ or [ɾ] or /ə/)",
      "secret_explanation": "Physical mouth/tongue/breath trick in ${langInfo.aiPromptLang} on how natives produce the sound effortlessly",
      "practice_phrase": "Short phrase or word pair demonstrating the hack in ${langInfo.aiPromptLang}"
    }
  ],
  "idioms_and_expressions": [
    {
      "idiom": "Native idiom or everyday expression in ${langInfo.aiPromptLang} (calibrated to ${currentLevelName})",
      "meaning": "Brief meaning in ${langInfo.aiPromptLang}",
      "example": "Natural example sentence in ${langInfo.aiPromptLang}"
    }
  ],
  "language_curiosities": [
    {
      "fact_title": "Curiosity / Etymology title in ${langInfo.aiPromptLang}",
      "fact_text": "Fascinating linguistic curiosity, etymology or cultural trivia about ${langInfo.name} in ${langInfo.aiPromptLang}"
    }
  ],
  "study_tips": [
    "Tip 1 in ${langInfo.aiPromptLang} on study habits or learning techniques",
    "Tip 2 in ${langInfo.aiPromptLang} on phonetic articulation and speech speed"
  ],
  "pronunciation_clinic": [
    {
      "word": "target word in ${langInfo.aiPromptLang}",
      "ipa": "IPA transcription",
      "phonetic_tip": "Specific, practical tip in ${langInfo.aiPromptLang} on tongue/lip position for this exact sound",
      "example_sentence": "A short, natural sentence in ${langInfo.aiPromptLang}"
    }
  ],
  "spoken_summary": "A friendly 3-sentence conversational speech in ${langInfo.aiPromptLang} spoken directly by ${langInfo.teacherName} praising their progress, introducing the adaptive lessons to level up, and offering the PDF syllabus."
}`;

            await app.callAI_Conversation(
                [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Generate the comprehensive performance, adaptive lessons, grammar, pronunciation hacks, idiom, and level report in ${langInfo.aiPromptLang} for a student at level ${currentLevelName} with ${performanceScore}% Rdto.` }
                ],
                null,
                (data) => {
                    let report = data;
                    if (typeof data === 'string') {
                        try {
                            const jsonMatch = data.match(/\{[\s\S]*\}/);
                            report = JSON.parse(jsonMatch ? jsonMatch[0] : data);
                        } catch(e) {
                            const shouldUp = performanceScore >= 85 && currentLevelIdx < 4;
                            const shouldDown = performanceScore < 45 && currentLevelIdx > 0;
                            const targetIdx = shouldUp ? currentLevelIdx + 1 : shouldDown ? currentLevelIdx - 1 : currentLevelIdx;
                            
                            // Calibrated fallbacks per CEFR level
                            const calibratedGrammar = currentLevelIdx === 0 ? [
                                { topic: "Simple Pronouns & Verbs", explanation: "Always match 'I' with 'am' and 'You' with 'are'.", example: "I am ready. You are welcome." }
                            ] : currentLevelIdx === 1 ? [
                                { topic: "Past Simple Regular (-ed)", explanation: "Add '-ed' to regular verbs when describing completed actions.", example: "Yesterday, I walked to the park." }
                            ] : currentLevelIdx === 2 ? [
                                { topic: "Present Perfect & Life Experiences", explanation: "Use 'have/has + past participle' for experiences without a specific past time.", example: "I have visited three different countries." }
                            ] : currentLevelIdx === 3 ? [
                                { topic: "Mixed Conditionals & Nuance", explanation: "Combine past condition with present result for hypothetical situations.", example: "If I had practiced earlier, I would speak more fluidly today." }
                            ] : [
                                { topic: "Inversion for Dramatic Emphasis", explanation: "Place negative adverbs at the sentence front with auxiliary inversion.", example: "Rarely have I witnessed such rapid linguistic mastery." }
                            ];

                            const calibratedHacks = currentLevelIdx === 0 ? [
                                { hack_title: "The Smile Vowel Shape", target_sound: "/i:/ vs /u:/", secret_explanation: "Pull the corners of your lips like a wide smile for clean vowel clarity.", practice_phrase: "See the blue moon" }
                            ] : currentLevelIdx === 1 ? [
                                { hack_title: "The 3 Sounds of Past '-ed'", target_sound: "-ed -> /t/, /d/, /ɪd/", secret_explanation: "Only say an extra syllable (/ɪd/) after T and D. After others, just finish with a crisp /t/ or /d/.", practice_phrase: "walked, played, decided" }
                            ] : currentLevelIdx === 2 ? [
                                { hack_title: "The Flap 'T' Smooth Glide", target_sound: "/t/ -> [ɾ]", secret_explanation: "Between vowels, tap your tongue tip lightly against the roof of your mouth like a soft Spanish 'R'.", practice_phrase: "Better butter water" }
                            ] : currentLevelIdx === 3 ? [
                                { hack_title: "The Relaxed Schwa /ə/ Hack", target_sound: "Weak Vowels -> /ə/", secret_explanation: "Relax your jaw completely and reduce unstressed function words into a brief neutral sound.", practice_phrase: "A cup of tea to go" }
                            ] : [
                                { hack_title: "Intrusive Glide Linking", target_sound: "Vowel-to-Vowel Link", secret_explanation: "Connect adjacent vowels with a subtle continuous glide without creating glottal stops.", practice_phrase: "Go out and see it" }
                            ];

                            const calibratedLessons = [
                                {
                                    lesson_number: 1,
                                    lesson_title: `Lesson 1 · Session Foundation & Recovery`,
                                    objective: `Reinforce and master key pronunciation points from this session.`,
                                    target_words: (mistakesList.length > 0 ? mistakesList.slice(0, 4) : wordsPracticed.slice(0, 4)).map(w => ({
                                        word: w.word || w.english || 'focus',
                                        ipa: w.ipa || '',
                                        spanish: w.spanish || 'práctica',
                                        sentence: `I practice ${w.word || w.english || 'vocabulary'} every day.`
                                    }))
                                },
                                {
                                    lesson_number: 2,
                                    lesson_title: `Lesson 2 · Level ${currentLevelName} Core Fluency`,
                                    objective: `Solidify core vocabulary and structural patterns for level ${currentLevelName}.`,
                                    target_words: [
                                        { word: "develop", ipa: "dɪˈveləp", spanish: "desarrollar", sentence: "We develop strong language habits." },
                                        { word: "confidence", ipa: "ˈkɒnfɪdəns", spanish: "confianza", sentence: "Speaking daily builds real confidence." },
                                        { word: "fluent", ipa: "ˈfluːənt", spanish: "fluido", sentence: "You are becoming more fluent." },
                                        { word: "mastery", ipa: "ˈmɑːstəri", spanish: "maestría", sentence: "Consistent practice leads to mastery." }
                                    ]
                                },
                                {
                                    lesson_number: 3,
                                    lesson_title: `Lesson 3 · Level Up Challenge (Road to ${levelLabels[Math.min(4, currentLevelIdx + 1)]})`,
                                    objective: `Step up your linguistic complexity with advanced expressions to unlock the next level.`,
                                    target_words: [
                                        { word: "accomplish", ipa: "əˈkʌmplɪʃ", spanish: "lograr / cumplir", sentence: "You will accomplish your fluency goals." },
                                        { word: "articulate", ipa: "ɑːˈtɪkjuleɪt", spanish: "articular / expresivo", sentence: "Natives articulate with natural rhythm." },
                                        { word: "perseverance", ipa: "ˌpɜːsɪˈvɪərəns", spanish: "perseverancia", sentence: "Perseverance unlocks total fluency." },
                                        { word: "sophisticated", ipa: "səˈfɪstɪkeɪtɪd", spanish: "sofisticado", sentence: "Use sophisticated phrases with ease." }
                                    ]
                                }
                            ];

                            const calibratedIdiom = currentLevelIdx === 0 ? [
                                { idiom: "Have a good day!", meaning: "A friendly wish when parting.", example: "Goodbye, have a good day!" }
                            ] : currentLevelIdx === 1 ? [
                                { idiom: "Piece of cake", meaning: "Something that is very easy to do.", example: "This lesson is a piece of cake!" }
                            ] : currentLevelIdx === 2 ? [
                                { idiom: "Hit the nail on the head", meaning: "To describe exactly what is causing a situation or answer accurately.", example: "Your pronunciation hit the nail on the head!" }
                            ] : currentLevelIdx === 3 ? [
                                { idiom: "Burn the midnight oil", meaning: "To study or work late into the night.", example: "You do not need to burn the midnight oil; steady daily practice is best." }
                            ] : [
                                { idiom: "Read between the lines", meaning: "To understand the implicit, deeper meaning not stated directly.", example: "Fluency allows you to read between the lines effortlessly." }
                            ];

                            report = {
                                summary_title: `Level ${currentLevelName} · Language Insights`,
                                performance_rating: performanceScore >= 80 ? "High Mastery" : performanceScore >= 60 ? "Good Progress" : "Developing",
                                encouragement: "You are doing fantastic! Every word you practice brings you closer to effortless fluency. Keep this energy going!",
                                evaluation: `You are performing at ${performanceScore}% Rdto. at level ${currentLevelName}. Keep active focus on speech clarity and sentence rhythm.`,
                                level_recommendation: {
                                    action: shouldUp ? "upgrade" : shouldDown ? "downgrade" : "stay",
                                    target_level_index: targetIdx,
                                    target_level_name: levelLabels[targetIdx],
                                    title: shouldUp ? "Level Up Recommended!" : shouldDown ? "Reinforce Basics" : "Current Level is Optimal",
                                    reason: shouldUp ? `You show exceptional accuracy! You are ready for ${levelLabels[targetIdx]}.` : shouldDown ? `Stepping back to ${levelLabels[targetIdx]} will strengthen your foundations.` : `Your current level (${currentLevelName}) provides the right challenge.`
                                },
                                adaptive_lessons: calibratedLessons,
                                grammar_insights: calibratedGrammar,
                                pronunciation_hacks: calibratedHacks,
                                idioms_and_expressions: calibratedIdiom,
                                language_curiosities: [
                                    {
                                        fact_title: `Linguistic Secret of ${langInfo.name}`,
                                        fact_text: `In ${langInfo.name}, mastering rhythmic pitch accents and word connections dramatically accelerates listening comprehension.`
                                    }
                                ],
                                study_tips: [
                                    "Listen carefully to the native teacher before speaking.",
                                    "Use the slow turtle voice to master difficult consonant clusters."
                                ],
                                pronunciation_clinic: (mistakesList.length > 0 ? mistakesList : wordsPracticed.slice(0, 3)).map(w => ({
                                    word: w.word || w.english,
                                    ipa: w.ipa || '',
                                    phonetic_tip: "Articulate vowel sounds with relaxed jaw positioning.",
                                    example_sentence: `I practice ${w.word || w.english} every day.`
                                })),
                                spoken_summary: `You are doing a wonderful job today with ${performanceScore}% performance at level ${currentLevelName}! I have prepared structured adaptive lessons and a PDF syllabus to help you level up quickly!`
                            };
                        }
                    }
                    game.lastReportData = report;
                    game.renderPerformanceReport(report);
                }
            );
        },

        renderPerformanceReport: (report) => {
            const bodyEl = document.getElementById('report-modal-body');
            if (!bodyEl || !report) return;

            const levelLabels = app.getLevelLabels();
            const currentLevelIdx = db.academy_level || 0;
            const currentLevelName = levelLabels[currentLevelIdx] || 'A1-A2';
            const performanceScore = Math.round(game.performanceScore || 75);
            const badgeColor = performanceScore >= 75 ? 'var(--cyber-ok)' : performanceScore >= 45 ? 'var(--cyber-warn)' : 'var(--neon-pink)';
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;

            // Generate or extract full continuous plain text from teacher
            let fullSpeech = report.teacher_speech || report.spoken_summary || '';
            if (!fullSpeech || fullSpeech.length < 50) {
                const enc = report.encouragement || 'Keep up the fantastic momentum!';
                const evalText = report.evaluation || `Your session performance is at ${performanceScore}% for level ${currentLevelName}.`;
                const recReason = report.level_recommendation ? report.level_recommendation.reason : '';
                const grammarText = report.grammar_insights && report.grammar_insights[0] ? `Key Grammar Focus: ${report.grammar_insights[0].topic}. ${report.grammar_insights[0].explanation} For example: "${report.grammar_insights[0].example}".` : '';
                const hackText = report.pronunciation_hacks && report.pronunciation_hacks[0] ? `Pronunciation Secret: ${report.pronunciation_hacks[0].hack_title}. ${report.pronunciation_hacks[0].secret_explanation} Practice phrase: "${report.pronunciation_hacks[0].practice_phrase}".` : '';
                const mistakesText = report.pronunciation_clinic && report.pronunciation_clinic.length > 0 ? `Targeted corrections: ${report.pronunciation_clinic.map(c => `${c.word} (/ ${c.ipa} /) - ${c.phonetic_tip}`).join('. ')}` : '';
                fullSpeech = `${enc}\n\n${evalText}\n\n${recReason}\n\n${grammarText}\n\n${hackText}\n\n${mistakesText}\n\nI have prepared a complete study syllabus with practical lessons, drills, and examples for your level. You can download your full PDF right now using the button below!`;
            }
            report.teacher_speech = fullSpeech;

            // Formatted paragraphs for comfortable reading
            const paragraphs = fullSpeech.split('\n').filter(p => p.trim().length > 0);
            const paragraphsHtml = paragraphs.map((p, idx) => `
                <p id="teleprompter-p-${idx}" style="margin: 0 0 16px 0; color: #F1F5F9; font-size: 1rem; line-height: 1.68; font-family: 'Outfit', sans-serif; letter-spacing: 0.2px;">
                    ${p.trim()}
                </p>
            `).join('');

            bodyEl.innerHTML = `
                <!-- TOP STATUS BADGE -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(0,243,255,0.06); border: 1.5px solid ${badgeColor}; border-radius: 10px; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;">${performanceScore >= 75 ? '⚡' : performanceScore >= 45 ? '🎯' : '🌱'}</span>
                        <span class="tech" style="color: ${badgeColor}; font-weight: 900; font-size: 0.88rem; letter-spacing: 0.5px;">RDTO: ${performanceScore}% · NIVEL ${currentLevelName}</span>
                    </div>
                    <span style="font-size: 0.76rem; color: #AAA; font-weight: 600;">${langInfo.teacherName} (Nativo/a)</span>
                </div>

                <!-- TELEPROMPTER TEXT BOX (AUTO-SCROLLING PLAIN TEXT) -->
                <div id="report-teleprompter-box" style="background: rgba(0,0,0,0.55); border: 1.5px solid rgba(0,243,255,0.25); border-radius: 12px; padding: 18px 18px 30px; min-height: 220px; max-height: 52vh; overflow-y: auto; scroll-behavior: smooth; box-shadow: inset 0 0 20px rgba(0,0,0,0.8);">
                    ${paragraphsHtml}
                </div>
            `;
        },

        startAdaptiveLesson: (lessonIdx) => {
            const report = game.lastReportData;
            if (!report || !report.adaptive_lessons || !report.adaptive_lessons[lessonIdx]) {
                return alert("No hay datos de lección adaptativa disponibles.");
            }
            const lsn = report.adaptive_lessons[lessonIdx];
            if (!lsn.target_words || lsn.target_words.length === 0) {
                return alert("No hay palabras en esta lección.");
            }

            game.closePerformanceReport();

            const words = lsn.target_words.map((w, i) => ({
                id: `adaptive_${Date.now()}_${i}`,
                english: w.word,
                ipa: w.ipa || '',
                spanish: w.spanish || '',
                sentence_en: w.sentence || `I practice ${w.word}.`,
                sentence_es: ''
            }));

            session.currentWords = words;
            session.currentWordIndex = 0;
            session.phase = 'vocab';

            game.data = words;
            game.index = 0;
            game.isSessionMode = true;
            game.sessionCycle = 0;
            game.currentRetries = 0;

            app.switchView('view-game');
            game.setAutoMic(true);
            game.updateAvatar();
            if (game.updatePerformance) game.updatePerformance(0);
            app.updateLessonButtonsVisibility();
            session.renderWordsOverview();
            game.loadCard();
            audio.start();

            const fb = document.getElementById('feedback-msg');
            if (fb) {
                fb.innerHTML = `🎯 <strong style="color:var(--neon-cyan);">${lsn.lesson_title}</strong>: ${lsn.objective}`;
                fb.className = "feedback";
            }
        },

        applyRecommendedLevel: (targetLevel) => {
            const target = parseInt(targetLevel);
            if (target >= 0 && target <= 4) {
                app.saveAcademyLevel(target);
                const slider = document.getElementById('academy-level-slider');
                if (slider) slider.value = target;
                audio.success();
                const subtitleEl = document.getElementById('report-session-subtitle');
                const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
                if (subtitleEl) subtitleEl.innerText = `${langInfo.name} · Level ${app.getLevelLabels()[target]}`;
                alert(`✅ Nivel actualizado a: ${app.getLevelLabels()[target]}`);
            }
        },

        generateSyllabusPDF: () => {
            const report = game.lastReportData;
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const levelLabels = app.getLevelLabels();
            const currentLevelIdx = db.academy_level || 0;
            const currentLevelName = levelLabels[currentLevelIdx] || 'A1-A2';
            const performanceScore = Math.round(game.performanceScore || 75);

            if (!window.jspdf || !window.jspdf.jsPDF) {
                game.openPrintableSyllabus(report, langInfo, currentLevelName, performanceScore);
                return;
            }

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 15;
                const contentWidth = pageWidth - (margin * 2);
                let y = 16;

                // Control estricto de salto de página
                const checkPageBreak = (neededHeight) => {
                    if (y + neededHeight > pageHeight - 16) {
                        doc.addPage();
                        y = 16;
                        // Mini cabecera de página continuada
                        doc.setFillColor(15, 23, 42);
                        doc.rect(margin, y, contentWidth, 7, 'F');
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(7.5);
                        doc.setTextColor(0, 243, 255);
                        doc.text(`JETBULARY · ${langInfo.name.toUpperCase()} · NIVEL ${currentLevelName}`, margin + 3, y + 4.8);
                        y += 11;
                    }
                };

                // Función auxiliar para imprimir texto con salto de línea automático y control de salto de página
                const printWrapped = (text, x, maxWidth, fontSize, fontStyle, rgbColor, lineSpacing) => {
                    if (!text) return 0;
                    doc.setFont('helvetica', fontStyle || 'normal');
                    doc.setFontSize(fontSize || 8);
                    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
                    const lines = doc.splitTextToSize(String(text), maxWidth);
                    lines.forEach((line) => {
                        checkPageBreak(lineSpacing + 2);
                        doc.text(line, x, y);
                        y += lineSpacing;
                    });
                    return lines.length;
                };

                // Función para dibujar encabezados de sección
                const drawSectionHeader = (title) => {
                    checkPageBreak(12);
                    doc.setFillColor(30, 41, 59);
                    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(255, 255, 255);
                    const titleLines = doc.splitTextToSize(title, contentWidth - 6);
                    doc.text(titleLines[0], margin + 4, y + 4.8);
                    y += 9.5;
                };

                // --- 1. CABECERA PRINCIPAL ---
                doc.setFillColor(10, 15, 28);
                doc.roundedRect(margin, y, contentWidth, 26, 2.5, 2.5, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(15);
                doc.setTextColor(0, 243, 255);
                doc.text("JETBULARY · ACADEMIA DE IDIOMAS IA", margin + 5, y + 7.5);

                doc.setFontSize(9.5);
                doc.setTextColor(255, 255, 255);
                const subTitleLines = doc.splitTextToSize(`TEMARIO PERSONALIZADO DE ESTUDIO · ${langInfo.name.toUpperCase()} (${currentLevelName})`, contentWidth - 10);
                doc.text(subTitleLines[0], margin + 5, y + 14.5);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(180, 200, 220);
                const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                const metaLine = `Profesor/a: ${langInfo.teacherName}   |   Rendimiento: ${performanceScore}%   |   Fecha: ${dateStr}`;
                const splitMeta = doc.splitTextToSize(metaLine, contentWidth - 10);
                doc.text(splitMeta[0], margin + 5, y + 20.5);

                y += 30;

                // --- 2. EVALUACIÓN Y MENSAJE DE LA PROFESORA ---
                const encText = report && report.encouragement ? `"${report.encouragement}"` : `"¡Sigue practicando cada día con constancia!"`;
                const evalText = report && report.evaluation ? report.evaluation : `Evaluación de la sesión al ${performanceScore}% de rendimiento en nivel ${currentLevelName}.`;

                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8);
                const encLines = doc.splitTextToSize(encText, contentWidth - 10);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.8);
                const evalLines = doc.splitTextToSize(evalText, contentWidth - 10);

                const evalBoxHeight = 10 + (encLines.length * 4) + (evalLines.length * 3.8) + 4;
                checkPageBreak(evalBoxHeight);

                doc.setFillColor(240, 253, 250);
                doc.setDrawColor(0, 243, 255);
                doc.roundedRect(margin, y, contentWidth, evalBoxHeight, 2, 2, 'FD');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(13, 148, 136);
                doc.text(`MENSAJE DE ${langInfo.teacherName.toUpperCase()} & EVALUACIÓN`, margin + 5, y + 5.5);

                let boxY = y + 10;
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8);
                doc.setTextColor(30, 41, 59);
                encLines.forEach(l => { doc.text(l, margin + 5, boxY); boxY += 4; });

                boxY += 1;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.8);
                doc.setTextColor(71, 85, 105);
                evalLines.forEach(l => { doc.text(l, margin + 5, boxY); boxY += 3.8; });

                y += evalBoxHeight + 5;

                // --- 3. SECCIÓN 1: LECCIONES ADAPTATIVAS ---
                if (report && report.adaptive_lessons && report.adaptive_lessons.length > 0) {
                    drawSectionHeader("1. PLAN DE LECCIONES ADAPTATIVAS PARA SUPERAR EL NIVEL");

                    report.adaptive_lessons.forEach((lsn, idx) => {
                        const lsnTitle = `[ ] Lección ${lsn.lesson_number || (idx + 1)}: ${lsn.lesson_title || 'Práctica Adaptativa'}`;
                        const objText = `Objetivo: ${lsn.objective || 'Consolidar vocabulario y pronunciación.'}`;
                        
                        let wordsText = '';
                        if (lsn.target_words && Array.isArray(lsn.target_words)) {
                            wordsText = `Palabras: ` + lsn.target_words.map(w => `${w.word}${w.spanish ? ` (${w.spanish})` : ''}`).join('  ·  ');
                        }

                        checkPageBreak(18);
                        printWrapped(lsnTitle, margin + 2, contentWidth - 4, 8.5, 'bold', [13, 148, 136], 4.2);
                        printWrapped(objText, margin + 4, contentWidth - 8, 7.8, 'normal', [51, 65, 85], 3.8);
                        if (wordsText) {
                            printWrapped(wordsText, margin + 4, contentWidth - 8, 7.5, 'italic', [3, 105, 161], 3.6);
                        }
                        y += 2.5;
                    });
                    y += 2;
                }

                // --- 4. SECCIÓN 2: TEMARIO GRAMATICAL Y ESTRUCTURAS ---
                if (report && report.grammar_insights && report.grammar_insights.length > 0) {
                    drawSectionHeader("2. TEMARIO GRAMATICAL Y ESTRUCTURAS CLAVE");

                    report.grammar_insights.forEach((g) => {
                        checkPageBreak(16);
                        printWrapped(`• ${g.topic || 'Regla Gramatical'}:`, margin + 2, contentWidth - 4, 8.5, 'bold', [15, 118, 110], 4.2);
                        printWrapped(g.explanation || '', margin + 4, contentWidth - 8, 7.8, 'normal', [51, 65, 85], 3.8);
                        if (g.example) {
                            printWrapped(`Ejemplo: "${g.example}"`, margin + 4, contentWidth - 8, 7.5, 'italic', [3, 105, 161], 3.8);
                        }
                        y += 2.5;
                    });
                    y += 2;
                }

                // --- 5. SECCIÓN 3: TRUCOS DE PRONUNCIACIÓN NATIVA ---
                if (report && report.pronunciation_hacks && report.pronunciation_hacks.length > 0) {
                    drawSectionHeader("3. TRUCOS Y SECRETOS DE PRONUNCIACIÓN NATIVA");

                    report.pronunciation_hacks.forEach((h) => {
                        const hackTitle = `• ${h.hack_title || 'Truco Fonético'}${h.target_sound ? ` [${h.target_sound}]` : ''}:`;
                        checkPageBreak(16);
                        printWrapped(hackTitle, margin + 2, contentWidth - 4, 8.5, 'bold', [190, 24, 93], 4.2);
                        printWrapped(h.secret_explanation || '', margin + 4, contentWidth - 8, 7.8, 'normal', [51, 65, 85], 3.8);
                        if (h.practice_phrase) {
                            printWrapped(`Frase de práctica: "${h.practice_phrase}"`, margin + 4, contentWidth - 8, 7.5, 'italic', [13, 148, 136], 3.8);
                        }
                        y += 2.5;
                    });
                    y += 2;
                }

                // --- 6. SECCIÓN 4: MODISMOS Y EXPRESIONES ---
                if (report && report.idioms_and_expressions && report.idioms_and_expressions.length > 0) {
                    drawSectionHeader("4. MODISMOS Y EXPRESIONES NATIVAS (IDIOMS)");

                    report.idioms_and_expressions.forEach((item) => {
                        checkPageBreak(15);
                        printWrapped(`• "${item.idiom}":`, margin + 2, contentWidth - 4, 8.5, 'bold', [180, 83, 9], 4.2);
                        if (item.meaning) {
                            printWrapped(`Significado: ${item.meaning}`, margin + 4, contentWidth - 8, 7.8, 'normal', [51, 65, 85], 3.8);
                        }
                        if (item.example) {
                            printWrapped(`Ejemplo: "${item.example}"`, margin + 4, contentWidth - 8, 7.5, 'italic', [30, 64, 175], 3.8);
                        }
                        y += 2.5;
                    });
                    y += 2;
                }

                // --- 7. SECCIÓN 5: VOCABULARIO CLAVE Y CLÍNICA FONÉTICA ---
                const wordsList = report && report.pronunciation_clinic && report.pronunciation_clinic.length > 0
                    ? report.pronunciation_clinic
                    : (game.data && game.data.length > 0 ? game.data.slice(0, 5) : []);

                if (wordsList.length > 0) {
                    drawSectionHeader("5. VOCABULARIO CLAVE Y CLÍNICA DE PRÁCTICA");

                    wordsList.forEach((w) => {
                        const wordTitle = w.word || w.english || '';
                        const ipaTitle = w.ipa ? ` /${w.ipa.replace(/\//g, '')}/` : '';
                        const spanishTitle = w.spanish ? ` (${w.spanish})` : '';
                        checkPageBreak(14);
                        printWrapped(`• ${wordTitle}${ipaTitle}${spanishTitle}`, margin + 2, contentWidth - 4, 8.5, 'bold', [15, 23, 42], 4.2);
                        if (w.phonetic_tip) {
                            printWrapped(`Articulación: ${w.phonetic_tip}`, margin + 4, contentWidth - 8, 7.6, 'normal', [100, 116, 139], 3.6);
                        }
                        if (w.example_sentence) {
                            printWrapped(`Contexto: "${w.example_sentence}"`, margin + 4, contentWidth - 8, 7.6, 'italic', [51, 65, 85], 3.6);
                        }
                        y += 2;
                    });
                    y += 2;
                }

                // --- 8. SECCIÓN 6: CURIOSIDADES Y CONSEJOS ---
                if (report && report.language_curiosities && report.language_curiosities.length > 0) {
                    drawSectionHeader("6. CURIOSIDADES LINGÜÍSTICAS Y CONSEJOS");

                    report.language_curiosities.forEach(c => {
                        checkPageBreak(14);
                        printWrapped(`• ${c.fact_title || 'Curiosidad'}:`, margin + 2, contentWidth - 4, 8.5, 'bold', [15, 118, 110], 4.2);
                        printWrapped(c.fact_text || '', margin + 4, contentWidth - 8, 7.8, 'normal', [51, 65, 85], 3.8);
                        y += 2.5;
                    });
                }

                // --- PIE DE PÁGINA EN TODAS LAS PÁGINAS ---
                const totalPages = doc.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(148, 163, 184);
                    doc.text(`Jetbulary · www.jetbulary.com · Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 7.5, { align: 'center' });
                }

                const fileName = `Jetbulary_Temario_${langInfo.name}_Nivel_${currentLevelName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                doc.save(fileName);
                audio.success();
                alert(`✅ Temario PDF descargado con éxito:\n${fileName}`);

            } catch (err) {
                console.error("Error generating PDF:", err);
                game.openPrintableSyllabus(report, langInfo, currentLevelName, performanceScore);
            }
        },

        openPrintableSyllabus: (report, langInfo, currentLevelName, performanceScore) => {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert("Por favor habilita las ventanas emergentes para ver el temario imprimible.");
                return;
            }

            const lessonsHtml = report && report.adaptive_lessons ? report.adaptive_lessons.map(lsn => `
                <div style="margin-bottom: 12px; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <strong style="color: #0f766e;">[ ] Lección ${lsn.lesson_number || ''}: ${lsn.lesson_title || ''}</strong>
                    <div style="margin: 4px 0; color: #334155; font-size: 0.9rem;">Objetivo: ${lsn.objective || ''}</div>
                    ${lsn.target_words ? `<div style="color: #0369a1; font-size: 0.85rem; font-style: italic;">Palabras clave: ${lsn.target_words.map(w => w.word).join(' · ')}</div>` : ''}
                </div>
            `).join('') : '';

            const grammarHtml = report && report.grammar_insights ? report.grammar_insights.map(g => `
                <div style="margin-bottom: 12px;">
                    <strong style="color: #0d9488;">• ${g.topic || 'Punto Gramatical'}:</strong>
                    <div style="margin: 4px 0 4px 12px; color: #334155;">${g.explanation || ''}</div>
                    ${g.example ? `<div style="margin-left: 12px; font-style: italic; color: #0284c7;">Ejemplo: "${g.example}"</div>` : ''}
                </div>
            `).join('') : '';

            const hacksHtml = report && report.pronunciation_hacks ? report.pronunciation_hacks.map(h => `
                <div style="margin-bottom: 12px;">
                    <strong style="color: #be185d;">• ${h.hack_title || 'Truco Fonético'} ${h.target_sound ? `[${h.target_sound}]` : ''}:</strong>
                    <div style="margin: 4px 0 4px 12px; color: #334155;">${h.secret_explanation || ''}</div>
                    ${h.practice_phrase ? `<div style="margin-left: 12px; font-style: italic; color: #0d9488;">Frase: "${h.practice_phrase}"</div>` : ''}
                </div>
            `).join('') : '';

            const idiomsHtml = report && report.idioms_and_expressions ? report.idioms_and_expressions.map(item => `
                <div style="margin-bottom: 12px;">
                    <strong style="color: #b45309;">• "${item.idiom}"</strong>
                    <div style="margin: 4px 0 4px 12px; color: #334155;">Significado: ${item.meaning || ''}</div>
                    ${item.example ? `<div style="margin-left: 12px; font-style: italic; color: #1e40af;">Ejemplo: "${item.example}"</div>` : ''}
                </div>
            `).join('') : '';

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Jetbulary — Temario ${langInfo.name} ${currentLevelName}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #0f172a; max-width: 800px; margin: 0 auto; line-height: 1.5; }
                        .header { background: #0f172a; color: #fff; padding: 18px 22px; border-radius: 8px; margin-bottom: 20px; }
                        .header h1 { margin: 0 0 6px 0; font-size: 1.4rem; color: #00f3ff; }
                        .header p { margin: 0; font-size: 0.85rem; color: #94a3b8; }
                        .section-title { background: #1e293b; color: #fff; padding: 8px 14px; border-radius: 6px; font-size: 0.95rem; font-weight: bold; margin: 24px 0 12px 0; }
                        .encouragement { background: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px 16px; border-radius: 6px; font-style: italic; margin-bottom: 18px; color: #134e4a; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>JETBULARY · TEMARIO DE ESTUDIO</h1>
                        <p>Idioma: ${langInfo.name} | Nivel: ${currentLevelName} | Profesora: ${langInfo.teacherName} | Rdto: ${performanceScore}%</p>
                    </div>
                    <div class="encouragement">
                        "${report && report.encouragement ? report.encouragement : 'Practice every day for continuous fluency!'}"
                    </div>
                    <div class="section-title">1. PLAN DE LECCIONES ADAPTATIVAS PARA SUPERAR EL NIVEL</div>
                    ${lessonsHtml}
                    <div class="section-title">2. TEMARIO GRAMATICAL Y ESTRUCTURAS</div>
                    ${grammarHtml}
                    <div class="section-title">3. TRUCOS Y SECRETOS DE PRONUNCIACIÓN</div>
                    ${hacksHtml}
                    <div class="section-title">4. MODISMOS Y EXPRESIONES (IDIOMS)</div>
                    ${idiomsHtml}
                    <div style="text-align: center; margin-top: 30px;">
                        <button onclick="window.print()" style="padding: 10px 24px; font-size: 1rem; background: #0d9488; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🖨️ Imprimir / Guardar en PDF</button>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        },

        teleprompterInterval: null,
        isSpeakingReport: false,

        speakReportSpokenSummary: () => {
            if (!game.lastReportData) return;
            const textToSpeak = game.lastReportData.teacher_speech || game.lastReportData.spoken_summary || game.lastReportData.evaluation;
            if (!textToSpeak) return;

            const btn = document.getElementById('btn-speak-report-main');
            const lbl = document.getElementById('lbl-speak-report-btn');

            // If already speaking, stop audio & scroll
            if (game.isSpeakingReport) {
                window.speechSynthesis.cancel();
                game.stopTeleprompterScroll();
                game.isSpeakingReport = false;
                if (btn) btn.style.boxShadow = '0 0 12px rgba(0,243,255,0.35)';
                if (lbl) lbl.innerText = "Escuchar Profesora";
                document.querySelectorAll('.avatar-container').forEach(el => el.classList.remove('talking'));
                document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.staticSrc) img.src = img.dataset.staticSrc; else if (img.dataset.idleSrc) img.src = img.dataset.idleSrc; });
                return;
            }

            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(textToSpeak);
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            u.rate = 0.85;
            u.lang = langInfo.speechLang;

            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
                let f = voices.find(v => v.lang.startsWith(langInfo.code) && langInfo.femaleVoices.some(name => v.name.toLowerCase().includes(name)));
                if (!f) f = voices.find(v => v.lang.startsWith(langInfo.code) || v.lang.replace('_', '-').startsWith(langInfo.code));
                if (f) u.voice = f;
            }

            u.onstart = () => {
                game.isSpeakingReport = true;
                document.querySelectorAll('.avatar-container').forEach(el => el.classList.add('talking'));
                document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.gifSrc) img.src = img.dataset.gifSrc; });
                if (btn) btn.style.boxShadow = '0 0 22px rgba(0, 243, 255, 0.9)';
                if (lbl) lbl.innerText = "⏹️ Detener";
                game.startTeleprompterScroll(textToSpeak.length);
            };

            u.onend = () => {
                game.isSpeakingReport = false;
                game.stopTeleprompterScroll();
                document.querySelectorAll('.avatar-container').forEach(el => el.classList.remove('talking'));
                document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.staticSrc) img.src = img.dataset.staticSrc; else if (img.dataset.idleSrc) img.src = img.dataset.idleSrc; });
                if (btn) btn.style.boxShadow = '0 0 12px rgba(0,243,255,0.35)';
                if (lbl) lbl.innerText = "Escuchar Profesora";
            };

            u.onerror = () => {
                game.isSpeakingReport = false;
                game.stopTeleprompterScroll();
                document.querySelectorAll('.avatar-container').forEach(el => el.classList.remove('talking'));
                if (btn) btn.style.boxShadow = '0 0 12px rgba(0,243,255,0.35)';
                if (lbl) lbl.innerText = "Escuchar Profesora";
            };

            window.speechSynthesis.speak(u);
        },

        startTeleprompterScroll: (textLength) => {
            game.stopTeleprompterScroll();
            const box = document.getElementById('report-teleprompter-box');
            if (!box) return;
            box.scrollTop = 0;

            const approxDurationMs = Math.max(8000, (textLength || 300) * 72);
            const totalScroll = Math.max(0, box.scrollHeight - box.clientHeight);
            if (totalScroll <= 0) return;

            const startTime = Date.now();
            game.teleprompterInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / approxDurationMs);
                box.scrollTop = totalScroll * progress;
                if (progress >= 1) {
                    clearInterval(game.teleprompterInterval);
                }
            }, 60);
        },

        stopTeleprompterScroll: () => {
            if (game.teleprompterInterval) {
                clearInterval(game.teleprompterInterval);
                game.teleprompterInterval = null;
            }
        },

        closePerformanceReport: (skipHistoryBack = false) => {
            window.speechSynthesis.cancel();
            game.isSpeakingReport = false;
            game.stopTeleprompterScroll();
            document.querySelectorAll('.avatar-container').forEach(el => el.classList.remove('talking'));
            document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.staticSrc) img.src = img.dataset.staticSrc; else if (img.dataset.idleSrc) img.src = img.dataset.idleSrc; });
            const modal = document.getElementById('modal-performance-report');
            if (modal) modal.classList.add('hidden');
            const lbl = document.getElementById('lbl-speak-report-btn');
            if (lbl) lbl.innerText = "Escuchar Profesora";
            if (!skipHistoryBack && history.state && history.state.modal === 'performance-report') {
                history.back();
            }
        },

        selectedGrammarLevelIdx: null,
        isGrammarSpeaking: false,
        lastGrammarTextToSpeak: '',

        getPedagogicalCurriculum: function(langCode, levelIdx) {
        const safeIdx = Math.max(0, Math.min(4, levelIdx !== undefined && levelIdx !== null ? levelIdx : 0));
        const code = (langCode || 'en').toLowerCase();

        // 1. ENGLISH CURRICULUM (5 NIVELES COMPLETOS CALIBRADOS PARA HISPANOHABLANTES)
        const enCurriculums = [
            {
                levelTitle: "A0 (Iniciación / Starter)",
                scope: "Fundamentos elementales: orden obligatorio S-V-O, pronombres y verbo To Be sin omitir sujetos.",
                teacherSpokenScript: "Hello! I am Emma, your English teacher. Welcome to your starter guide! Remember the golden rule of English: every sentence must have an explicit subject. In Spanish you say 'es bueno', but in English you always say 'It is good'. Notice the difference between B and V: 'bat' and 'very'. Listen to these examples: 'I am here. It is nice. We are ready.' Let's practice together!",
                phonetics: [
                    {
                        sound: "Diferencia B vs V (/b/ bilabial vs /v/ labiodental)",
                        tip: "En español la B y la V suenan idénticas. En inglés son dos fonemas distintos: la B junta ambos labios ('bat', 'boy'), mientras que la V apoya los dientes superiores sobre el labio inferior y hace vibrar las cuerdas vocales ('very', 'voice', 'van').",
                        spanishContrast: "En castellano 'baca' y 'vaca' suenan igual. En inglés, confundir B y V cambia totalmente la palabra ('berry' = baya vs 'very' = muy).",
                        example: "A very delicious berry."
                    },
                    {
                        sound: "La 'S' Líquida Inicial (Sin 'E' fantasma)",
                        tip: "El cerebro hispanohablante tiende a poner una 'E' antes de cualquier palabra que empiece por S + consonante ('eschool', 'espain'). Elimínala: empieza silbando suavemente como una serpiente ('s-school', 's-start', 's-stop').",
                        spanishContrast: "En castellano toda palabra empieza con E ('España, escuela, estación'). En inglés nunca añadas esa 'e'.",
                        example: "Students start speaking Spanish in Spain."
                    }
                ],
                grammar: [
                    {
                        name: "Orden S-V-O y Sujeto Obligatorio",
                        formula: "[ SUJETO + VERBO + COMPLEMENTO ]",
                        desc: "En español podemos omitir el sujeto ('Tengo hambre', 'Llueve'). En inglés el sujeto es 100% obligatorio siempre, usando 'IT' como comodín impersonal.",
                        example: "It is late and it rains outside."
                    },
                    {
                        name: "El Verbo To Be (Ser y Estar unificados)",
                        formula: "[ I am / You are / He-She-It is / We are / They are ]",
                        desc: "El inglés une 'ser' y 'estar' en un solo verbo. El contexto indica si se refiere a identidad permanente o a un estado transitorio.",
                        example: "I am a doctor and I am happy today."
                    }
                ],
                bridges: [
                    {
                        rule: "Regla mágica: -TION pasa a -CIÓN",
                        spanishLink: "Más de 1.000 palabras en inglés son idénticas al español cambiando -tion por -ción.",
                        example: "Action (acción), Nation (nación), Information (información), Condition (condición)."
                    },
                    {
                        rule: "El artículo universal 'THE'",
                        spanishLink: "En español tienes 4 formas (el, la, los, las). En inglés una sola palabra sirve para todos los géneros y números.",
                        example: "The car, the table, the cars, the tables."
                    }
                ],
                mistakes: [
                    {
                        error: "I have 25 years.",
                        fix: "I am 25 years old.",
                        why: "En inglés la edad no 'se tiene', la edad 'se es' mediante el verbo To Be.",
                        example: "I am twenty-five years old."
                    },
                    {
                        error: "I am agree with you.",
                        fix: "I agree with you.",
                        why: "'Agree' ya es un verbo en inglés ('estar de acuerdo'). No necesita el verbo 'am'.",
                        example: "I agree with you completely."
                    },
                    {
                        error: "Actually I work here.",
                        fix: "Currently I work here. (o 'Right now...')",
                        why: "'Actually' es un falso amigo: significa 'en realidad' o 'de hecho', NO 'actualmente'.",
                        example: "Actually, I am not ready yet."
                    }
                ],
                mnemonics: [
                    {
                        trick: "El silbido de la serpiente (Sssss-cool)",
                        explanation: "Pon el dedo en los labios y haz 'Sssss' durante 1 segundo antes de decir 'speak, Spanish, study' para erradicar la 'E' fantasma.",
                        formula: "Sssss + peak = Speak (¡cero E inicial!)"
                    },
                    {
                        trick: "El comodín 'IT' para el clima y la hora",
                        explanation: "Siempre que en español digas frases sin persona ('hace frío', 'es la una', 'es fácil'), pon 'IT IS'.",
                        formula: "Hace [X] / Es [X] -> IT IS [X]"
                    }
                ],
                modelPhrases: [
                    { phrase: "Hello! My name is Emma and I am very happy to help you.", meaning: "¡Hola! Mi nombre es Emma y estoy muy feliz de ayudarte." },
                    { phrase: "It is cold outside, but it is warm in here.", meaning: "Hace frío afuera, pero está cálido aquí dentro." },
                    { phrase: "Where is the train station? It is near the hotel.", meaning: "¿Dónde está la estación de tren? Está cerca del hotel." }
                ]
            },
            {
                levelTitle: "A1-A2 (Básico / Elemental)",
                scope: "Rutinas diarias, pasado simple (-ed e irregulares), fórmulas de preguntas y preposiciones esenciales.",
                teacherSpokenScript: "Welcome to level A1-A2! Let's master the rhythm of daily life. Pay close attention to questions: always remember the magic formula QUASM: Question word, Auxiliary, Subject, Main verb. For example: 'Where do you live?' or 'What did you buy?' Notice the past tense '-ed': we say 'walked' with a sharp 't', 'played' with a soft 'd', and only add the extra syllable 'id' after T and D, like 'wanted' or 'decided'. You've got this!",
                phonetics: [
                    {
                        sound: "Las 3 pronunciaciones del pasado '-ed' (/t/, /d/, /ɪd/)",
                        tip: "¡NO pronuncies la 'e'! Solo se añade la sílaba extra /ɪd/ si el verbo termina en 'T' o 'D' ('wanted', 'decided'). En verbos sordos suena como una 'T' seca ('walked', 'helped'). En verbos sonoros suena como una 'D' suave ('played', 'loved').",
                        spanishContrast: "Los hispanohablantes suelen decir 'walk-ed' pronunciando la 'e'. En inglés es monosílabo: 'walkt'.",
                        example: "She walked to the park and decided to stay."
                    },
                    {
                        sound: "Letras mudas obligatorias (Silent Letters)",
                        tip: "La 'k' antes de 'n' nunca suena ('know, knife, knee'). La 'l' en 'walk, talk, half, could' es 100% muda.",
                        spanishContrast: "En español todas las letras escritas se pronuncian. En inglés hay letras históricas completamente silenciosas.",
                        example: "I know that he could walk half a mile."
                    }
                ],
                grammar: [
                    {
                        name: "Fórmula QUASM para Preguntas",
                        formula: "[ Question word + Auxiliary (do/does/did) + Subject + Main verb ]",
                        desc: "La estructura universal para formular cualquier pregunta en inglés con fluidez inmediata.",
                        example: "Where (Q) do (A) you (S) live (M)? / What (Q) did (A) you (S) see (M)?"
                    },
                    {
                        name: "Presente Simple vs Continuo",
                        formula: "[ Hábito: I work every day ] vs [ Ahora mismo: I am working right now ]",
                        desc: "Diferencia tajante entre lo que haces como rutina habitual y lo que estás haciendo en este preciso instante.",
                        example: "I usually drink coffee, but right now I am drinking tea."
                    }
                ],
                bridges: [
                    {
                        rule: "Regla -TY pasa a -DAD",
                        spanishLink: "Cientos de sustantivos abstractos terminados en -ty en inglés equivalen a -dad en español.",
                        example: "City (ciudad), University (universidad), Reality (realidad), Activity (actividad)."
                    },
                    {
                        rule: "Regla -IC pasa a -ICO",
                        spanishLink: "Adjetivos terminados en -ic pasan directamente a -ico.",
                        example: "Fantastic (fantástico), Romantic (romántico), Music (música), Classic (clásico)."
                    }
                ],
                mistakes: [
                    {
                        error: "People is very friendly here.",
                        fix: "People are very friendly here.",
                        why: "'People' en inglés es un sustantivo plural (equivale a 'las personas'). Siempre lleva verbo plural.",
                        example: "People are waiting for the train."
                    },
                    {
                        error: "Can you explain me the rule?",
                        fix: "Can you explain the rule to me?",
                        why: "El verbo 'explain' exige la preposición 'to' delante de la persona ('explain something TO someone').",
                        example: "Please explain this to me."
                    },
                    {
                        error: "I was embarrassed during my pregnancy.",
                        fix: "I was embarrassed (avergonzada) vs pregnant (embarazada).",
                        why: "'Embarrassed' significa sentir vergüenza. 'Embarazada' se dice 'pregnant'.",
                        example: "She felt embarrassed when she made a mistake."
                    }
                ],
                mnemonics: [
                    {
                        trick: "La Pirámide de Preposiciones (IN, ON, AT)",
                        explanation: "IN es la base ancha (países, ciudades, años, meses). ON es el medio (calles, días de la semana, superficies). AT es la punta afilada (horas exactas, lugares concretos).",
                        formula: "IN (Grande/Tiempo largo) -> ON (Día/Calle) -> AT (Hora/Punto exacto)"
                    },
                    {
                        trick: "Acrónimo QUASM",
                        explanation: "Para no dudar nunca al hacer preguntas en presente o pasado.",
                        formula: "Q(partícula) + A(auxiliar) + S(sujeto) + M(verbo principal)"
                    }
                ],
                modelPhrases: [
                    { phrase: "I usually wake up at seven, but today I am sleeping late.", meaning: "Normalmente me despierto a las siete, pero hoy estoy durmiendo hasta tarde." },
                    { phrase: "Yesterday we visited the gallery and bought three paintings.", meaning: "Ayer visitamos la galería y compramos tres cuadros." },
                    { phrase: "What did you do last weekend with your family?", meaning: "¿Qué hiciste el fin de semana pasado con tu familia?" }
                ]
            },
            {
                levelTitle: "B1 (Intermedio)",
                scope: "Independencia comunicativa, Present Perfect vs Past Simple, condicionales 1 y 2, y conectores.",
                teacherSpokenScript: "Welcome to intermediate level B1! At this stage, your English connects past experiences to the present. The biggest difference from Spanish is the Present Perfect: when an action is unfinished or the exact time doesn't matter, say 'I have lived here for two years'. Notice your pronunciation flow: link words together! Instead of saying 'pick... it... up', blend them into 'pick-it-up'. Let's build real conversational independence!",
                phonetics: [
                    {
                        sound: "Connected Speech & Enlace Consonante-Vocal (Linking)",
                        tip: "En habla nativa, cuando una palabra termina en consonante y la siguiente empieza en vocal, se unen como si fueran una sola palabra ('check it out' -> /tʃekɪtaʊt/, 'pick it up' -> /pɪkɪtʌp/).",
                        spanishContrast: "Los hispanohablantes tienden a pausar entre palabras. Enlazar sonidos elimina el acento entrecortado.",
                        example: "Turn off the light and pick it up."
                    },
                    {
                        sound: "Vocal Corta /ɪ/ vs Vocal Larga /i:/ (Pares Mínimos)",
                        tip: "En español solo existe una 'I' tensa. En inglés, /ɪ/ es corta, relajada y con mandíbula caída ('ship', 'live', 'fit'), mientras que /i:/ es larga, sonriente y tensa ('sheep', 'leave', 'feet').",
                        spanishContrast: "No diferenciar 'ship' (/ʃɪp/ barco) de 'sheep' (/ʃiːp/ oveja) o 'bitch' de 'beach' causa malentendidos cómicos.",
                        example: "The big ship carried white sheep across the sea."
                    }
                ],
                grammar: [
                    {
                        name: "Present Perfect vs Past Simple",
                        formula: "[ Pasado Simple: Momento cerrado ] vs [ Present Perfect: Conexión con el presente ]",
                        desc: "Usa Past Simple si dices cuándo ocurrió ('Yesterday, in 2020'). Usa Present Perfect para experiencias de vida o acciones no concluidas ('I have lived here for 3 years').",
                        example: "I lived in Paris in 2018. I have lived in Madrid since 2021."
                    },
                    {
                        name: "Los Dos Condicionales Esenciales (1º y 2º)",
                        formula: "[ Real: If + Present, will + Verb ] vs [ Hipotético: If + Past, would + Verb ]",
                        desc: "El primer condicional expresa causa-efecto probable; el segundo condicional plantea situaciones imaginarias.",
                        example: "If I have time, I will call you. If I had a million dollars, I would travel the world."
                    }
                ],
                bridges: [
                    {
                        rule: "Regla -OUS pasa a -OSO",
                        spanishLink: "Adjetivos descriptivos terminados en -ous se corresponden casi siempre con -oso.",
                        example: "Famous (famoso), Delicious (delicioso), Curious (curioso), Nervous (nervioso)."
                    },
                    {
                        rule: "Sufijos idénticos -ABLE / -IBLE",
                        spanishLink: "La gran mayoría de palabras terminadas en -able / -ible tienen exactamente el mismo significado en ambos idiomas.",
                        example: "Comfortable, flexible, horrible, possible, visible, incredible."
                    }
                ],
                mistakes: [
                    {
                        error: "I live here since three years ago.",
                        fix: "I have lived here for three years.",
                        why: "En inglés las acciones que empezaron en el pasado y continúan hoy exigen Present Perfect con 'for' (duración).",
                        example: "She has worked here for five years."
                    },
                    {
                        error: "I have a cold and I am constipated.",
                        fix: "I have a cold and I am congested.",
                        why: "'Constipated' significa estreñido en inglés. Estar constipado/resfriado se dice 'to have a cold' o 'congested'.",
                        example: "I caught a cold yesterday."
                    },
                    {
                        error: "He is very sensible with his feelings.",
                        fix: "He is very sensitive with his feelings.",
                        why: "'Sensible' en inglés significa sensato/juicioso. Sensible emocionalmente se dice 'sensitive'.",
                        example: "It was a sensible decision made by a sensitive person."
                    }
                ],
                mnemonics: [
                    {
                        trick: "La Chincheta (SINCE) vs La Barra de Tiempo (FOR)",
                        explanation: "SINCE es una chincheta clavada en una fecha o punto de partida (since 2015, since Monday). FOR es una barra de medir que cuenta la duración (for 10 minutes, for 4 weeks).",
                        formula: "SINCE = Punto de inicio / FOR = Cantidad de tiempo"
                    },
                    {
                        trick: "Acrónimo FANBOYS para unir oraciones",
                        explanation: "Los 7 conectores coordinantes clave para ganar fluidez B1 sin repetir 'and' todo el tiempo.",
                        formula: "F(or) - A(nd) - N(or) - B(ut) - O(r) - Y(et) - S(o)"
                    }
                ],
                modelPhrases: [
                    { phrase: "I have been working on this project for three weeks and it is almost ready.", meaning: "Llevo tres semanas trabajando en este proyecto y está casi listo." },
                    { phrase: "If you don't hurry up, we will definitely miss the flight.", meaning: "Si no te das prisa, sin duda perderemos el vuelo." },
                    { phrase: "Could you tell me how long it takes to walk from here to the station?", meaning: "¿Podrías decirme cuánto se tarda en caminar desde aquí hasta la estación?" }
                ]
            },
            {
                levelTitle: "B2 (Avanzado / Upper-Intermediate)",
                scope: "Fluidez espontánea, debate, tercer condicional, estilo indirecto y el sonido rey Schwa /ə/.",
                teacherSpokenScript: "Welcome to level B2! Now we move from simply communicating to expressing nuance, subtlety, and precision. Master the most important vowel in the entire English language: the schwa vowel, /ə/. It's a completely relaxed, neutral sound heard in unstressed syllables like 'about', 'problem', and 'police'. Speak with smooth cadence and upgrade your discourse connectors. Listen to how natural English flows!",
                phonetics: [
                    {
                        sound: "El Sonido Rey del Inglés: La Schwa (/ə/)",
                        tip: "El español pronuncia todas las vocales con tensión y claridad silábica. El inglés es acentual: las sílabas no acentuadas se relajan por completo en un sonido neutro y perezoso con la boca entreabierta: 'a-bout' (/əˈbaʊt/), 'prob-lem' (/ˈprɒbləm/), 'doc-tor' (/ˈdɒktə/).",
                        spanishContrast: "Dominar la schwa elimina el 80% del acento hispanohablante y permite entender el habla rápida de películas y nativos.",
                        example: "The doctor talked about a serious problem."
                    },
                    {
                        sound: "Entonación Melódica y Modulación del Énfasis",
                        tip: "Eleva el tono en la palabra con la información clave de la frase y desciende al final de las afirmaciones. Preguntas de sí/no suben al final (↗); preguntas informativas bajan (↘).",
                        spanishContrast: "El español suele tener una entonación más plana. El inglés utiliza ondas melódicas para transmitir certeza, ironía o cortesía.",
                        example: "Are you ready to leave? ↗ / Where did you put my keys? ↘"
                    }
                ],
                grammar: [
                    {
                        name: "Tercer Condicional (Lamentos y pasado irreal)",
                        formula: "[ If + had + participio, would + have + participio ]",
                        desc: "Para hablar de situaciones hipotéticas en el pasado que nunca ocurrieron y sus consecuencias.",
                        example: "If I had known about the delay, I would have taken the train."
                    },
                    {
                        name: "Voz Pasiva Formal y Verbos de Reporte",
                        formula: "[ It is widely believed that... / Subject + is expected to + infinitive ]",
                        desc: "Estructuras impersonales y formales indispensables en exámenes oficiales B2 y entornos profesionales.",
                        example: "The government is expected to announce the new policy tomorrow."
                    }
                ],
                bridges: [
                    {
                        rule: "Sufijo -ATE pasa a verbos en -AR",
                        spanishLink: "Gran cantidad de verbos formales en inglés que terminan en -ate derivan del latín y corresponden a -ar.",
                        example: "Create (crear), Communicate (comunicar), Calculate (calcular), Motivate (motivar)."
                    },
                    {
                        rule: "Conectores formales de raíz culta compartida",
                        spanishLink: "A nivel B2 los conectores escritos son primos hermanos del español culto.",
                        example: "Consequently (consecuentemente), Furthermore (además), In conclusion (en conclusión)."
                    }
                ],
                mistakes: [
                    {
                        error: "I look forward to hear from you soon.",
                        fix: "I look forward to hearing from you soon.",
                        why: "En la expresión 'look forward to', 'to' es una preposición, no parte del infinitivo. Exige verbo en -ING.",
                        example: "We look forward to meeting you next week."
                    },
                    {
                        error: "I need to attend my clients right now.",
                        fix: "I need to assist / serve my clients right now.",
                        why: "'Attend' significa asistir o acudir a un evento ('attend a conference'). Atender a personas se dice 'assist' o 'serve'.",
                        example: "She attended the meeting to assist the new team."
                    },
                    {
                        error: "I didn't notice that the exam was cancelled.",
                        fix: "I didn't realize that the exam was cancelled.",
                        why: "'Notice' es percibir físicamente con la vista o el oído ('noté su perfume'). 'Realize' es darse cuenta mentalmente.",
                        example: "I noticed her smile and realized she was happy."
                    }
                ],
                mnemonics: [
                    {
                        trick: "La Regla del Sándwich para Argumentar",
                        explanation: "1) Afirmación principal -> 2) Conector de contraste (However, Although, Despite) -> 3) Evidencia o matiz de conclusión.",
                        formula: "Idea inicial + Conector B2 + Matiz complementario"
                    },
                    {
                        trick: "El Ascensor de la Voz (Intonation Wave)",
                        explanation: "Sube el tono en la palabra nueva o contrastada y bájalo suavemente al cerrar la oración.",
                        formula: "Subida de tono en foco clave ↗ -> Bajada de confirmación ↘"
                    }
                ],
                modelPhrases: [
                    { phrase: "Had I been informed in advance, I would have prepared a much more thorough report.", meaning: "De haber sido informado con antelación, habría preparado un informe mucho más exhaustivo." },
                    { phrase: "It is widely acknowledged that consistent practice is the single most effective strategy.", meaning: "Es ampliamente reconocido que la práctica constante es la estrategia más eficaz." },
                    { phrase: "Despite facing significant logistical challenges, the team delivered the project on time.", meaning: "A pesar de afrontar importantes retos logísticos, el equipo entregó el proyecto a tiempo." }
                ]
            },
            {
                levelTitle: "C1+ (Dominio Nativo / Maestría)",
                scope: "Precisión retórica, oraciones escindidas (cleft sentences), elisiones nativas y colocaciones de alta densidad.",
                teacherSpokenScript: "Welcome to level C1 and beyond! At this master level, fluency is second nature and your focus is stylistic finesse, pragmatic nuance, and natural idioms. Learn to use cleft sentences to place effortless emphasis on what truly matters, and master idiomatic collocations. Let's speak with absolute elegance and native command!",
                phonetics: [
                    {
                        sound: "Elisión Nativa y Parada Glotal (/ʔ/)",
                        tip: "En registro nativo fluido, los hablantes omiten consonantes oclusivas (/t/ o /d/) cuando van entre dos consonantes ('next door' -> /neks dɔː/, 'last night' -> /lɑːs naɪt/). En acento británico informal se sustituye la /t/ intervocálica por oclusión glotal.",
                        spanishContrast: "Los hispanohablantes intentan sobrearticular cada consonante final. Aprender a elidir da fluidez nativa inmediata.",
                        example: "She left last night and walked next door."
                    },
                    {
                        sound: "Micro-asimilación y Transición Dialectal",
                        tip: "Cuando un sonido final se funde con el siguiente: 'don't you' pasa a sonar /dəʊntʃuː/ (t + y -> ch), 'did you' pasa a sonar /dɪdʒuː/ (d + y -> j).",
                        spanishContrast: "Este fenómeno no existe en español formal. Reconocerlo desbloquea la comprensión de series y nativos reales.",
                        example: "Didn't you know that could happen?"
                    }
                ],
                grammar: [
                    {
                        name: "Oraciones Escindidas (Cleft Sentences para Énfasis)",
                        formula: "[ What + cláusula + is/was + elemento destacado ] o [ It is/was + elemento + that... ]",
                        desc: "Estructura sintáctica avanzada para poner el foco de atención con elegancia retórica superior.",
                        example: "What really impressed the committee was her poise under pressure."
                    },
                    {
                        name: "Inversiones Retóricas Negativas",
                        formula: "[ Adverbio negativo restrictivo + Auxiliar + Sujeto + Verbo ]",
                        desc: "Uso de 'Rarely, Seldom, Under no circumstances, Not only' al inicio para máximo impacto discursivo.",
                        example: "Rarely have I witnessed such sheer determination in language acquisition."
                    }
                ],
                bridges: [
                    {
                        rule: "La Gran Ventaja Greco-Latina en el Registro Culto",
                        spanishLink: "A nivel C1/C2, el inglés culto y académico recurre masivamente a raíces latinas. Más del 60% del vocabulario C1 es casi idéntico al español.",
                        example: "Serendipitous, ephemeral, dichotomy, meticulous, paradigm, ubiquitous."
                    },
                    {
                        rule: "Subjuntivo culto paralelo",
                        spanishLink: "El subjuntivo formal inglés ('I recommend that he be present') refleja exactamente la lógica del subjuntivo español.",
                        example: "It is imperative that every participant submit their evaluation on time."
                    }
                ],
                mistakes: [
                    {
                        error: "He is pulling my hair (como tomar el pelo).",
                        fix: "He is pulling my leg.",
                        why: "Nunca traduzcas modismos españoles literalmente. 'Tomar el pelo' se dice 'pull someone's leg'.",
                        example: "Don't take him seriously, he is just pulling your leg."
                    },
                    {
                        error: "She was very sympathetic with the party guests.",
                        fix: "She was very friendly / outgoing with the guests.",
                        why: "'Sympathetic' significa empático o comprensivo ante el dolor ajeno, NO simpático de carácter.",
                        example: "The doctor was deeply sympathetic to the patient's concerns."
                    },
                    {
                        error: "We need to put the batteries in this project.",
                        fix: "We need to get our act together / pull our socks up.",
                        why: "Modismo español traducido erróneamente. Usa expresiones nativas idiomáticas exactas.",
                        example: "We need to step up our game to meet the deadline."
                    }
                ],
                mnemonics: [
                    {
                        trick: "La Ley del Collocation Match",
                        explanation: "A nivel C1 nunca aprendas adjetivos o adverbios sueltos. Apréndelos siempre en binomios nativos inseparables: bitterly disappointed, highly contentious, deeply ingrained.",
                        formula: "Adverbio intensificador nativo + Adjetivo exacto"
                    },
                    {
                        trick: "El Marco Cleft 'What... was...'",
                        explanation: "Para sonar elocuente en cualquier presentación o ensayo, abre tu idea clave con 'What [X] is/was [Y]'.",
                        formula: "What surprises me most is [clave]"
                    }
                ],
                modelPhrases: [
                    { phrase: "What truly distinguished her argument was the meticulous corroboration of every claim.", meaning: "Lo que realmente distinguió su argumentación fue la meticulosa corroboración de cada afirmación." },
                    { phrase: "Under no circumstances should confidentiality agreements be breached without prior authorization.", meaning: "Bajo ninguna circunstancia deben vulnerarse los acuerdos de confidencialidad sin autorización previa." },
                    { phrase: "He was bitterly disappointed by the verdict, yet maintained remarkable composure throughout.", meaning: "Quedó amargamente decepcionado por el veredicto, pero mantuvo una compostura admirable en todo momento." }
                ]
            }
        ];

        // 2. FRENCH CURRICULUM (FRANÇAIS)
        const frCurriculums = [
            {
                levelTitle: "A0 (Iniciación / Starter)",
                scope: "Bases fundamentales: consonantes finales mudas, vocales nasales y sujeto obligatorio.",
                teacherSpokenScript: "Bonjour ! Je suis Camille, votre professeure de français. Bienvenue ! En français, la première règle d'or est la clarté : l'accent tonique est toujours sur la dernière syllabe prononcée. Écoutez bien : 'Je suis prêt. C'est magnifique. Nous sommes ensemble.' Ne prononcez jamais les consonnes finales muettes comme dans 'grand' ou 'salut'. Pratiquons ensemble !",
                phonetics: [
                    {
                        sound: "Consonantes Finales Mudas (S, T, D, P, X)",
                        tip: "En francés, las consonantes al final de palabra casi nunca se pronuncian: 'salut' suena /saly/, 'grand' suena /gʁɑ̃/, 'Paris' suena /paʁi/.",
                        spanishContrast: "En español toda letra final se pronuncia. En francés pronunciar la 's' o 't' final es un error grave.",
                        example: "Salut, c'est très grand et très beau."
                    },
                    {
                        sound: "La 'R' Uvular Gutural (/ʁ/)",
                        tip: "No vibres la punta de la lengua contra los dientes como en español. Raspa suavemente la parte trasera de la lengua contra el paladar blando (gárgara suave).",
                        spanishContrast: "La 'R' francesa nace en la garganta, no en los dientes.",
                        example: "Merci beaucoup, au revoir !"
                    }
                ],
                grammar: [
                    {
                        name: "Sujeto Obligatorio y Pronombres",
                        formula: "[ Sujet + Verbe + Complément ]",
                        desc: "Al igual que en inglés y a diferencia del español, el sujeto jamás se omite: 'Il pleut' (llueve), 'C'est bon' (es bueno).",
                        example: "Il pleut aujourd'hui mais je suis content."
                    }
                ],
                bridges: [
                    {
                        rule: "Transparencia Léxica Romance (70% común)",
                        spanishLink: "Al ser lenguas hermanas del latín, cientos de palabras son casi idénticas.",
                        example: "Information (información), Famille (familia), Restaurant (restaurante)."
                    }
                ],
                mistakes: [
                    {
                        error: "Je suis actuellement fatigué (pensando que significa 'de hecho').",
                        fix: "En fait, je suis fatigué. (Actuellement = 'en este momento').",
                        why: "'Actuellement' significa en este momento, no 'en realidad' (que es 'en fait').",
                        example: "Actuellement, j'habite à Lyon."
                    }
                ],
                mnemonics: [
                    {
                        trick: "La Regla C-A-R-E-F-U-L",
                        explanation: "Solo las consonantes C, R, F, L suelen pronunciarse al final de palabra (sac, soir, chef, ciel). Las demás son mudas.",
                        formula: "Consonantes finales activas = C - R - F - L"
                    }
                ],
                modelPhrases: [
                    { phrase: "Bonjour ! Comment vous vous appelez ?", meaning: "¡Buenos días! ¿Cómo se llama usted?" },
                    { phrase: "Je voudrais un café s'il vous plaît.", meaning: "Quisiera un café, por favor." }
                ]
            },
            {
                levelTitle: "A1-A2 (Básico / Elemental)",
                scope: "Passé composé con Avoir/Être, la liaison obligatoria y preguntas cotidianas.",
                teacherSpokenScript: "Bienvenue au niveau A1-A2 ! Aujourd'hui nous parlons du passé composé et de la liaison. Quand un mot se termine par une consonne et le suivant commence par une voyelle, liez-les : 'les amis' se prononce 'lé-zami'. Pour le passé composé, utilisez 'avoir' ou 'être' : 'J'ai mangé, je suis parti.' Vous progressez formidablement !",
                phonetics: [
                    {
                        sound: "La Liaison Obligatoria",
                        tip: "Cuando una palabra termina en consonante muda y la siguiente empieza por vocal o H muda, la consonante despierta y se une: 'les amis' -> /le.za.mi/ (la S suena como Z).",
                        spanishContrast: "En español cada palabra se separa limpiamente; en francés la liaison es obligatoria para sonar natural.",
                        example: "Nous avons deux enfants et trois amis."
                    }
                ],
                grammar: [
                    {
                        name: "Passé Composé con ÊTRE vs AVOIR",
                        formula: "[ Sujet + Avoir/Être + Participe Passé ]",
                        desc: "La mayoría de verbos usan AVOIR ('J'ai mangé'). Los 16 verbos de movimiento y cambio de estado usan ÊTRE ('Je suis allé').",
                        example: "Hier, je suis allé au marché et j'ai acheté du fromage."
                    }
                ],
                bridges: [
                    {
                        rule: "Verbos en -ER = Verbos en -AR",
                        spanishLink: "Casi todos los verbos del primer grupo francés (-er) corresponden a verbos regulares en -ar.",
                        example: "Parler (hablar), Chanter (cantar), Danser (bailar)."
                    }
                ],
                mistakes: [
                    {
                        error: "J'attends pour le bus.",
                        fix: "J'attends le bus.",
                        why: "El verbo 'attendre' es transitivo directo (no lleva preposición 'pour').",
                        example: "J'attends ma sœur depuis dix minutes."
                    }
                ],
                mnemonics: [
                    {
                        trick: "Acrónimo DR MRS VANDERTRAMP",
                        explanation: "Las iniciales de los 16 verbos que se conjugan obligatoriamente con el auxiliar ÊTRE en passé composé.",
                        formula: "Descendre, Rester, Monter, Revenir, Sortir, Venir, Aller, Naître, etc."
                    }
                ],
                modelPhrases: [
                    { phrase: "Hier soir, nous sommes allés au cinéma avec des amis.", meaning: "Ayer por la tarde fuimos al cine con unos amigos." },
                    { phrase: "Est-ce que vous pouvez m'indiquer le chemin de la gare ?", meaning: "¿Puede indicarme el camino hacia la estación?" }
                ]
            },
            {
                levelTitle: "B1 (Intermedio)",
                scope: "Subjonctif, l'imparfait vs passé composé, y pronombres relativos.",
                teacherSpokenScript: "Bienvenue au niveau B1 ! Maîtrisez le subjonctif pour exprimer vos sentiments, nécessités et doutes : 'Il faut que tu viennes.' Différenciez bien l'imparfait pour les descriptions et le passé composé pour les actions précises : 'Quand j'étais jeune, je voyageais souvent.' Continuez comme ça !",
                phonetics: [
                    {
                        sound: "Distinción É (/e/ cerrada) vs È (/ɛ/ abierta)",
                        tip: "É cerrada con labios estirados ('été'). È abierta con mandíbula relajada ('père, fête').",
                        spanishContrast: "El español solo tiene una 'E' intermedia; el francés distingue nítidamente abierta de cerrada.",
                        example: "En été, mon père préfère rester au frais."
                    }
                ],
                grammar: [
                    {
                        name: "El Subjuntivo de Obligación y Deseo",
                        formula: "[ Il faut que + Sujet + Verbe au Subjonctif ]",
                        desc: "Imprescindible tras fórmulas impersonales de necesidad ('Il faut que...', 'Je veux que...').",
                        example: "Il faut que nous partions avant midi."
                    }
                ],
                bridges: [
                    {
                        rule: "Imparfait idéntico al Pretérito Imperfecto",
                        spanishLink: "El uso del imperfecto para hábitos pasados y descripciones es exactamente igual al español.",
                        example: "Quand j'étais petit, j'habitais à Madrid."
                    }
                ],
                mistakes: [
                    {
                        error: "Je te demande pardon de te déranger (usando demander como demandar legalmente).",
                        fix: "Demander = Preguntar o pedir. Para demanda judicial = 'Poursuivre en justice'.",
                        why: "'Demander' significa pedir o preguntar, no demandar judicialmente.",
                        example: "Je peux vous demander un renseignement ?"
                    }
                ],
                mnemonics: [
                    {
                        trick: "La regla 'Si + Imparfait -> Conditionnel'",
                        explanation: "Nunca pongas condición en la cláusula con 'Si' (¡los 'si' no llevan 'rait'!).",
                        formula: "Si j'avais le temps (imparfait), je viendrais (conditionnel)."
                    }
                ],
                modelPhrases: [
                    { phrase: "Bien que ce soit difficile, nous avons réussi à terminer à temps.", meaning: "Aunque sea difícil, logramos terminar a tiempo." }
                ]
            },
            {
                levelTitle: "B2 (Avanzado / Upper-Intermediate)",
                scope: "Argumentación, conectores lógicos, condición pasada y voz pasiva formal.",
                teacherSpokenScript: "Bienvenue au niveau B2 ! À ce niveau, travaillez la fluidité et les connecteurs d'argumentation : 'Cependant, bien que, en revanche.' Écoutez : 'Bien qu'il fasse froid, nous avons décidé de sortir.' Utilisez le conditionnel passé pour exprimer des regrets : 'J'aurais aimé vous rencontrer plus tôt.'",
                phonetics: [{ sound: "Rythme et Accent d'Insistance", tip: "Desplaza el acento tónico a la primera sílaba de una palabra para enfatizar emoción o contraste.", spanishContrast: "En español se sube el volumen; en francés se alarga la consonante inicial.", example: "C'est absolument formidable !" }],
                grammar: [{ name: "Conditionnel Passé (Regrets)", formula: "[ Si + Plus-que-parfait, Conditionnel Passé ]", desc: "Para lamentar decisiones pasadas.", example: "Si j'avais su, je serais venu plus tôt." }],
                bridges: [{ rule: "Conectores formales grecolatinos", spanishLink: "Néanmoins, par conséquent, en outre corresponden a conectores formales españoles.", example: "Par conséquent, la réunion est reportée." }],
                mistakes: [{ error: "Confundir 'Deuxième' con 'Second'", fix: "'Second' si solo hay dos elementos; 'Deuxième' si hay tres o más.", why: "Regla académica francesa.", example: "La Seconde Guerre mondiale." }],
                mnemonics: [{ trick: "Le Sandwich de l'Argument", explanation: "Thèse -> Antithèse -> Synthèse.", formula: "D'une part... d'autre part... en conclusion." }],
                modelPhrases: [{ phrase: "Il est indéniable que cette approche présente des avantages majeurs.", meaning: "Es innegable que este enfoque presenta importantes ventajas." }]
            },
            {
                levelTitle: "C1+ (Dominio Nativo / Maestría)",
                scope: "Elegancia estilística, subjuntivo imperfecto literario y registros de lengua.",
                teacherSpokenScript: "Bienvenue au niveau supérieur C1 ! Exprimez vos idées avec subtilité et élégance rhétorique. Maîtrisez les registres de langue et les figures de style : 'Quoi qu'il en soit, force est de constater que la situation évolue.' Visez l'aisance naturelle !",
                phonetics: [{ sound: "Élision Rapide et Chute du 'E' Caduc", tip: "En conversación nativa culta, el 'e' caduco cae sistemáticamente: 'Je ne sais pas' -> /ʃe.pa/.", spanishContrast: "La economía articulatoria nativa francesa es extrema.", example: "Je ne sais pas du tout ce qui s'est passé." }],
                grammar: [{ name: "Inversion du Sujet Littéraire", formula: "[ Adverbe initial + Verbe + Sujet ]", desc: "Inversión formal tras 'Peut-être, Sans doute, À peine'.", example: "À peine étions-nous arrivés que l'orage éclata." }],
                bridges: [{ rule: "Vocabulario de la Ilustración", spanishLink: "La terminología filosófica, jurídica y científica es idéntica.", example: "Anachronisme, quintessence, pléthore." }],
                mistakes: [{ error: "Mélanger les registres de langue", fix: "No usar argot en discurso formal.", why: "El francés penaliza duramente la ruptura de registro.", example: "Une opportunité remarquable." }],
                mnemonics: [{ trick: "La Règle de l'Élégance Rhétorique", explanation: "Variedad léxica sin repeticiones.", formula: "Nom -> Pronom -> Périphrase" }],
                modelPhrases: [{ phrase: "Quoi qu'il en soit, force est de constater l'efficacité de ces mesures.", meaning: "Sea como fuere, es forzoso constatar la eficacia de estas medidas." }]
            }
        ];

        // 3. GERMAN CURRICULUM (DEUTSCH)
        const deCurriculums = [
            {
                levelTitle: "A0 (Iniciación / Starter)",
                scope: "Regla de oro: Verbo en posición 2, mayúsculas en sustantivos y fonética de los Umlaute.",
                teacherSpokenScript: "Hallo! Ich bin Greta, deine Deutschlehrerin. Willkommen! Im Deutschen steht das konjugierte Verb im Hauptsatz immer an der zweiten Position. Höre genau zu: 'Ich heiße Greta. Das Wetter ist heute sehr schön. Wir lernen zusammen.' Achte auf die Umlaute: Ä, Ö und Ü. Viel Erfolg!",
                phonetics: [
                    {
                        sound: "Los Umlaute (Ä, Ö, Ü)",
                        tip: "Para Ö: pon la boca en posición de decir 'O' y, sin mover los labios, pronuncia una 'E'. Para Ü: pon la boca en posición de decir 'U' y pronuncia una 'I'.",
                        spanishContrast: "Estos sonidos no existen en español. Cambian completamente el significado de las palabras ('schon' = ya vs 'schön' = hermoso).",
                        example: "Das ist wirklich sehr schön und nützlich."
                    },
                    {
                        sound: "La 'W' (/v/) y la 'V' (/f/)",
                        tip: "En alemán la 'W' suena siempre como la 'V' labiodental inglesa (/v/). La 'V' alemana casi siempre suena como una 'F' española ('Vogel' suena 'fogel').",
                        spanishContrast: "No digas 'Vasser' con sonido español; di 'Wasser' (/vasɐ/).",
                        example: "Wir trinken warmes Wasser."
                    }
                ],
                grammar: [
                    {
                        name: "Verbo en Segunda Posición (V2)",
                        formula: "[ Posición 1 + VERBO (Pos. 2) + Sujeto + Complementos ]",
                        desc: "En una oración principal, el verbo conjugado va SIEMPRE en el segundo lugar, incluso si empiezas con el tiempo o lugar.",
                        example: "Heute (1) lerne (2) ich (S) Deutsch."
                    }
                ],
                bridges: [
                    {
                        rule: "Palabras Compuestas Lógicas",
                        spanishLink: "El alemán ensambla palabras transparentes que se deducen fácilmente.",
                        example: "Krankenhaus (casa de enfermos = hospital), Wörterbuch (libro de palabras = diccionario)."
                    }
                ],
                mistakes: [
                    {
                        error: "Ich bekomme ein Lehrer (pensando que significa convertirse).",
                        fix: "Ich werde Lehrer. (Bekommen = 'recibir').",
                        why: "'Bekommen' significa recibir. 'Convertirse en' es el verbo 'werden'.",
                        example: "Ich habe gestern einen Brief bekommen."
                    }
                ],
                mnemonics: [
                    {
                        trick: "El candado del verbo en Posición 2",
                        explanation: "Pase lo que pase al inicio de la frase (tiempo, lugar, opinión), el verbo salta al segundo puesto.",
                        formula: "Elemento 1 + VERBO + Sujeto"
                    }
                ],
                modelPhrases: [
                    { phrase: "Guten Tag! Wie geht es Ihnen?", meaning: "¡Buenos días! ¿Cómo está usted?" },
                    { phrase: "Ich lerne Deutsch, weil es mir Spaß macht.", meaning: "Aprendo alemán porque me divierte." }
                ]
            },
            {
                levelTitle: "A1-A2 (Básico / Elemental)",
                scope: "Verbos separables, preposiciones de Akkusativ/Dativ y pasado Perfekt.",
                teacherSpokenScript: "Willkommen auf Niveau A1-A2! Achte auf die trennbaren Verben: 'Ich stehe jeden Tag um sieben Uhr auf.' Das Präfix wandert ganz ans Satzende. Und lerne die Akkusativ- und Dativ-Präpositionen mit Musik. Du machst fantastische Fortschritte!",
                phonetics: [
                    {
                        sound: "El Sonido 'CH': Suave (/ç/) vs Duro (/x/)",
                        tip: "Tras 'e, i, ä, ö, ü' suena suave como el siseo de un gato ('ich, Milch, echt'). Tras 'a, o, u' suena en la garganta como una J suave ('ach, Buch, Nacht').",
                        spanishContrast: "Los hispanohablantes suelen pronunciar todas las CH como 'J' fuerte. Diferenciar el sonido suave 'ich' es vital.",
                        example: "Ich habe in der Nacht ein Buch gelesen."
                    }
                ],
                grammar: [
                    {
                        name: "Verbos Separables (Trennbare Verben)",
                        formula: "[ Sujeto + Verbo Base (Pos. 2) + ... + Prefijo Separable (FINAL) ]",
                        desc: "El prefijo se desprende y se coloca en el último lugar absoluto de la frase.",
                        example: "Ich rufe dich heute Abend an (anrufen)."
                    }
                ],
                bridges: [
                    {
                        rule: "Artículos de Caso Lógicos",
                        spanishLink: "Akkusativ marca el Objeto Directo ('a quién'); Dativ marca el Objeto Indirecto ('para quién').",
                        example: "Ich gebe dem Mann (Dativ) den Apfel (Akkusativ)."
                    }
                ],
                mistakes: [
                    {
                        error: "Confundir Wann, Wenn y Als.",
                        fix: "Wann (pregunta horaria), Wenn (condicional/hábito), Als (momento único en pasado).",
                        why: "El español usa 'cuando' para todo. El alemán exige precisión.",
                        example: "Als ich ein Kind war, spielte ich viel."
                    }
                ],
                mnemonics: [
                    {
                        trick: "Preposiciones de Dativo con Rima",
                        explanation: "Cántalas con ritmo para memorizarlas al instante.",
                        formula: "Aus - bei - mit, nach - seit - von - zu (¡siempre DATIVO!)"
                    }
                ],
                modelPhrases: [
                    { phrase: "Gestern habe ich meine Freunde im Restaurant getroffen.", meaning: "Ayer me encontré con mis amigos en el restaurante." }
                ]
            },
            {
                levelTitle: "B1 (Intermedio)",
                scope: "Oraciones subordinadas (verbo al final), Konjunktiv II y pasiva.",
                teacherSpokenScript: "Willkommen auf Niveau B1! Jetzt verbinden wir Nebensätze mit 'weil', 'dass' oder 'obwohl'. Die goldene Regel: Das Verb wandert ganz ans Ende des Satzes! Höre zu: 'Ich lerne Deutsch, weil es mir großen Spaß macht.' Großartig!",
                phonetics: [{ sound: "Knacklaut (Golpe de Glotis)", tip: "Pequeña interrupción de aire antes de palabras que empiezan por vocal.", spanishContrast: "Evita enlazar palabras como en español.", example: "Er isst einen Apfel." }],
                grammar: [{ name: "Verbo al Final en Subordinadas", formula: "[ Hauptsatz + WEIL / DASS + Nebensatz + VERBO CONJUGADO AL FINAL ]", desc: "El conector subordinante dispara el verbo al final.", example: "Ich bleibe zu Hause, weil es heute stark regnet." }],
                bridges: [{ rule: "Konjunktiv II = Subjuntivo Condicional", spanishLink: "Wäre = fuera/sería, Hätte = tuviera/tendría.", example: "Wenn ich Zeit hätte, würde ich kommen." }],
                mistakes: [{ error: "Poner el verbo en segunda posición tras 'weil'.", fix: "Siempre al final tras conectores subordinantes.", why: "Regla sagrada de la sintaxis alemana.", example: "..., weil er krank ist." }],
                mnemonics: [{ trick: "El Imán del Final", explanation: "Weil, dass, obwohl, wenn son imanes que arrastran el verbo conjugado al final.", formula: "Conector -> [ ... ] -> VERBO." }],
                modelPhrases: [{ phrase: "Obwohl die Prüfung schwierig war, habe ich sie bestanden.", meaning: "Aunque el examen fue difícil, lo aprobé." }]
            },
            {
                levelTitle: "B2 (Avanzado / Upper-Intermediate)",
                scope: "Konjunktiv I de reporte, pasiva de estado y conectores de dos partes.",
                teacherSpokenScript: "Willkommen auf Niveau B2! Meistere das Passiv und zweiteilige Konnektoren wie 'einerseits... andererseits' oder 'nicht nur... sondern auch'. Drücke komplexe Sachverhalte präzise aus!",
                phonetics: [{ sound: "Reducción de '-en' final a sonido silábico /n/", tip: "'Laufen' suena /laʊfn̩/, sin vocal 'e'.", spanishContrast: "No sobrearticular la terminación.", example: "Wir müssen sofort handeln." }],
                grammar: [{ name: "Conectores de Dos Partes (Zweiteilige Konnektoren)", formula: "[ Nicht nur... sondern auch... / Sowohl... als auch... ]", desc: "Estructuras para argumentación sofisticada.", example: "Er spricht sowohl fließend Deutsch als auch Englisch." }],
                bridges: [{ rule: "Sufijos abstractos -heit / -keit = -dad", spanishLink: "Freiheit (libertad), Möglichkeit (posibilidad).", example: "Die Möglichkeit zur Verbesserung." }],
                mistakes: [{ error: "Confundir 'denken an' con 'denken über'.", fix: "'An' para recordar o tener presente; 'Über' para opinar o reflexionar.", why: "Régimen preposicional.", example: "Ich denke oft an meinen Urlaub." }],
                mnemonics: [{ trick: "La Balanza de Argumentación", explanation: "Einerseits (por un lado) equilibra andererseits (por otro).", formula: "Einerseits... andererseits..." }],
                modelPhrases: [{ phrase: "Es steht außer Frage, dass weitere Maßnahmen erforderlich sind.", meaning: "Está fuera de toda duda que son necesarias más medidas." }]
            },
            {
                levelTitle: "C1+ (Dominio Nativo / Maestría)",
                scope: "Nomen-Verb-Verbindungen, construcciones participiales y registro académico.",
                teacherSpokenScript: "Herzlich willkommen auf C1-Niveau! Hier geht es um stilistische Perfektion, Partizipialkonstruktionen und Nomen-Verb-Verbindungen: 'Wir müssen diese Entscheidung in Betracht ziehen.' Drücke komplexe Zusammenhänge souverän aus!",
                phonetics: [{ sound: "Modulación y Matices de Partículas Modales", tip: "Uso sutil de 'ja, doch, wohl, mal, eben' para teñir la frase.", spanishContrast: "Transmiten matices que en español requieren frases enteras.", example: "Das ist ja wirklich eine Überraschung!" }],
                grammar: [{ name: "Nomen-Verb-Verbindungen (Colocaciones Cultas)", formula: "[ Sustantivo abstracto + Verbo funcional ]", desc: "Sustituyen verbos simples por expresiones de alto registro.", example: "Eine Entscheidung treffen (entscheiden), in Betracht ziehen (berücksichtigen)." }],
                bridges: [{ rule: "Préstamos greco-latinos en ciencias y derecho", spanishLink: "Kompatibel, Signifikant, Korrelieren son idénticos.", example: "Die Ergebnisse korrelieren eindeutig." }],
                mistakes: [{ error: "Traducir literalmente giros hispanos.", fix: "Usar equivalentes idiomáticos alemanes exactos.", why: "Precisión pragmática.", example: "Jemandem die Daumen drücken (desear suerte)." }],
                mnemonics: [{ trick: "El Bloque Compacto Participial", explanation: "Encapsular información entre artículo y sustantivo.", formula: "Die [gestern beschlossenen] Maßnahmen." }],
                modelPhrases: [{ phrase: "Wir sollten alle relevanten Faktoren sorgfältig in Betracht ziehen.", meaning: "Deberíamos tener en cuenta detenidamente todos los factores pertinentes." }]
            }
        ];

        // 4. ITALIAN CURRICULUM (ITALIANO)
        const itCurriculums = [
            {
                levelTitle: "A0 (Iniciación / Starter)",
                scope: "Vocales puras, concordancia de género/número y entonación melódica.",
                teacherSpokenScript: "Ciao! Sono Chiara, la tua insegnante d'italiano. In italiano la musica delle parole è fondamentale! Ascolta bene le vocali chiare e le doppie consonanti: 'Ciao, mi chiamo Chiara. Sono felice di conoscerti.' Pronuncia sempre le vocali con decisione. Cominciamo!",
                phonetics: [
                    { sound: "Las 7 Vocales Italianas (E y O abiertas/cerradas)", tip: "El italiano tiene 'E' y 'O' abiertas (/ɛ/, /ɔ/) y cerradas (/e/, /o/). 'Pèsca' (melocotón) vs 'Pésca' (pesca).", spanishContrast: "El español solo tiene 5 vocales; el italiano distingue matices en E y O.", example: "Ho comprato una pesca fresca al mercato." },
                    { sound: "Grupos C/G: Dulce vs Duro", tip: "C/G delante de E/I suena suave ('ciao' = chao, 'gelato' = yelato). Con 'H' suena duro ('chianti' = kianti, 'spaghetti' = spaguetti).", spanishContrast: "En español CH es siempre che; en italiano CH suena como 'K'.", example: "Ciao! Vorrei un caffè e un gelato." }
                ],
                grammar: [{ name: "Artículos Determinados Diversos", formula: "[ il/lo/la/i/gli/le ]", desc: "Uso de 'lo' y 'gli' delante de s+consonante, z, gn, ps ('lo studente', 'gli studenti').", example: "Lo studente legge il libro." }],
                bridges: [{ rule: "Concordancia y Raíz Romance Directa (85% común)", spanishLink: "Las terminaciones -o (masc), -a (fem), -i (masc pl), -e (fem pl) son directas.", example: "Il ragazzo italiano / I ragazzi italiani." }],
                mistakes: [{ error: "Salire pensar que es salir.", fix: "Salire = Subir. Salir se dice 'Uscire'.", why: "Falso amigo clásico.", example: "Salgo le scale / Esco di casa." }],
                mnemonics: [{ trick: "CH suena como K de Kilo", explanation: "Cada vez que veas una H en italiano (ch, gh), piensa en un palo de hierro que endurece el sonido.", formula: "CH = K / GH = G dura" }],
                modelPhrases: [{ phrase: "Piacere di conoscerti! Come stai?", meaning: "¡Un placer conocerte! ¿Cómo estás?" }]
            },
            {
                levelTitle: "A1-A2 (Básico / Elemental)",
                scope: "Dobles consonantes obligatorias, passato prossimo con essere/avere e preposizioni articolate.",
                teacherSpokenScript: "Benvenuto al livello A1-A2! Ricorda la differenza cruciale tra consonanti semplici e doppie: 'pala' e 'palla', 'sete' e 'sette'. Usa il passato prossimo con precisione: 'Ieri ho parlato con Marco e sono andata al cinema.' Bravissimo!",
                phonetics: [{ sound: "Las Dobles Consonantes Obligatorias", tip: "Detén el aire un microsegundo en la doble consonante: 'pala' (pala) vs 'palla' (pelota); 'sete' (sed) vs 'sette' (siete).", spanishContrast: "En español solo la RR y CC se doblan. En italiano todas las consonantes pueden doblarse y cambian el significado.", example: "Ci vediamo alle sette con sette amici." }],
                grammar: [{ name: "Passato Prossimo con ESSERE vs AVERE", formula: "[ Sujeto + Essere/Avere + Participio ]", desc: "Con 'essere', el participio concuerda en género y número con el sujeto ('Lei è andata').", example: "Maria è andata a Roma e ha visto il Colosseo." }],
                bridges: [{ rule: "Preposiciones Articuladas", spanishLink: "Di+il=del, In+il=nel, Da+il=dal se parecen a las contracciones españolas del y al.", example: "Vado nel centro della città." }],
                mistakes: [{ error: "Curare pensar que es curar inmediatamente.", fix: "Curare = Tratar o atender médicamente; Sanare = Curar por completo.", why: "Matiz semántico.", example: "Il medico cura il paziente." }],
                mnemonics: [{ trick: "El Freno de Mano en la Doble Consonante", explanation: "Pon el freno de mano con la lengua un instante antes de soltar la consonante geminada.", formula: "No digas 'sete', frena: 'set-te'." }],
                modelPhrases: [{ phrase: "Ieri sera siamo andati in pizzeria e abbiamo mangiato benissimo.", meaning: "Ayer por la tarde fuimos a la pizzería y comimos de maravilla." }]
            },
            {
                levelTitle: "B1 (Intermedio)",
                scope: "Pronombres combinados (glielo, me lo), partículas 'ci' y 'ne', congiuntivo presente.",
                teacherSpokenScript: "Benvenuto al livello B1! È il momento di conquistare il congiuntivo per esprimere desideri e opinioni: 'Credo che sia una buona idea. Spero che tu venga domani.' Usa le particelle 'ci' e 'ne' con naturalezza!",
                phonetics: [{ sound: "Grupos 'GLI' (/ʎ/) y 'GN' (/ɲ/)", tip: "'GLI' suena como la 'LL' tradicional española ('figlio' -> fi-llo). 'GN' suena exactamente como la 'Ñ' ('bagno' -> ba-ño).", spanishContrast: "Completamente natural para hispanohablantes una vez identificada la grafía.", example: "Mio figlio va in bagno ogni mattina." }],
                grammar: [{ name: "Partículas 'CI' y 'NE'", formula: "[ CI = lugar/con ello ] y [ NE = cantidad/de ello ]", desc: "'Ci vado' (voy allí); 'Ne voglio tre' (quiero tres de eso).", example: "Sei mai stato a Venezia? Sì, ci sono stato due volte." }],
                bridges: [{ rule: "Uso del Subjuntivo paralelo", spanishLink: "Expresa duda, emoción, opinión ('Penso che sia vero').", example: "Penso che tu abbia ragione." }],
                mistakes: [{ error: "Burro pensar que es el animal.", fix: "Burro = Mantequilla. El animal es 'l'asino'.", why: "Falso amigo histórico.", example: "Pane e burro a colazione." }],
                mnemonics: [{ trick: "NE de Número", explanation: "Siempre que hables de una cantidad de algo previamente mencionado, pon NE.", formula: "Cantidad -> usa NE (Ne prendo due)." }],
                modelPhrases: [{ phrase: "Spero vivamente che tu possa venire alla festa domani sera.", meaning: "Espero sinceramente que puedas venir a la fiesta mañana por la noche." }]
            },
            {
                levelTitle: "B2 (Avanzado / Upper-Intermediate)",
                scope: "Periodo ipotetico dell'irrealtà, congiuntivo imperfetto y pasiva con 'venire'.",
                teacherSpokenScript: "Benvenuto al livello B2! Usa il periodo ipotetico dell'irrealtà: 'Se avessi saputo della festa, sarei venuta volentieri.' Padroneggia i pronomi combinati e l'intonazione espressiva. Ottimo lavoro!",
                phonetics: [{ sound: "Entonación Exclamativa e Irónica", tip: "Uso de la melodía musical ascendente para dar énfasis afectivo.", spanishContrast: "El italiano modula tonalmente con mucha mayor amplitud que el español.", example: "Ma non mi dire! Davvero è successo questo?" }],
                grammar: [{ name: "Periodo Ipotetico de 3er Grado", formula: "[ Se + Congiuntivo Trapassato, Condizionale Passato ]", desc: "Hipótesis irreales sobre el pasado.", example: "Se avessi avuto più tempo, avrei visitato anche Firenze." }],
                bridges: [{ rule: "Conectores formales idénticos", spanishLink: "Tuttavia (sin embargo), Pertanto (por lo tanto), Ciononostante.", example: "Tuttavia, la decisione finale spetta al consiglio." }],
                mistakes: [{ error: "Confundir 'caldo' con caldo de sopa.", fix: "'Caldo' = Caliente/Calor. Sopa es 'brodo'.", why: "Falso amigo de temperatura.", example: "Oggi fa molto caldo." }],
                mnemonics: [{ trick: "La Pareja Congiuntivo-Condizionale", explanation: "El 'Se' se casa con el congiuntivo; la otra parte lleva condizionale.", formula: "Se + Congiuntivo -> Condizionale" }],
                modelPhrases: [{ phrase: "Se avessi saputo della tua partenza, ti avrei accompagnato all'aeroporto.", meaning: "Si hubiera sabido de tu partida, te habría acompañado al aeropuerto." }]
            },
            {
                levelTitle: "C1+ (Dominio Nativo / Maestría)",
                scope: "Subjuntivo culto, figuras retóricas y precisión de registro.",
                teacherSpokenScript: "Benvenuto al livello C1! Esprimi concetti complessi con eleganza stilistica e lessico ricercato: 'Ciò nonostante, è opportuno considerare tutte le implicazioni.' Raggiungi la vera maestria!",
                phonetics: [{ sound: "Raddoppiamento Fonosintattico", tip: "Doble articulación natural de la consonante inicial tras ciertas palabras monosílabas ('a casa' -> /ak'kasa/).", spanishContrast: "Secreto supremo de los actores y oradores nativos.", example: "Andiamo a casa a mangiare." }],
                grammar: [{ name: "Passato Remoto de Registro Culto", formula: "[ Verbos regulares e irregulares de pasado absoluto ]", desc: "Imprescindible en literatura, historia y alta cultura italiana.", example: "Dante scrisse la Divina Commedia nel Trecento." }],
                bridges: [{ rule: "Léxico de la cultura clásica", spanishLink: "El italiano formal comparte casi el 95% de la terminología abstracta.", example: "Imprescindibile, paradigmatico, intrinseco." }],
                mistakes: [{ error: "Usar dialectos regionales en contexto formal.", fix: "Emplear el italiano estándar cultivado.", why: "Prestigio lingüístico.", example: "Un punto di vista ineccepibile." }],
                mnemonics: [{ trick: "El Eco Fonosintáctico", explanation: "Tras 'a, da, e, ma, se, più', duplica suavemente el sonido de la palabra siguiente.", formula: "A + Roma -> /a r'roma/" }],
                modelPhrases: [{ phrase: "Resta inteso che ogni decisione dovrà essere ratificata in sede plenaria.", meaning: "Queda entendido que cualquier decisión deberá ser ratificada en sesión plenaria." }]
            }
        ];

        // 5. PORTUGUESE CURRICULUM (PORTUGUÊS)
        const ptCurriculums = [
            {
                levelTitle: "A0 (Iniciación / Starter)",
                scope: "Vogais nasais (ão, mãe), reducción vocálica en Portugal y cortesía básica.",
                teacherSpokenScript: "Olá! Eu sou a Inês, a tua professora de português. Bem-vindo! Repara no som das vogais nasais como em 'pão', 'mãe' e 'bom'. O ar sai pelo nariz e pela boca ao mesmo tempo. Ouve com atenção: 'Eu sou a Inês. Estou muito feliz por estar aqui contigo.' Vamos praticar!",
                phonetics: [
                    { sound: "Vogais Nasais (-ão, -ãe, -õ)", tip: "El diptongo '-ão' no suena como 'an' ni 'on'. Es una 'A' nasalizada seguida de un semivocal 'U' con el aire saliendo por la nariz ('pão', 'não', 'coração').", spanishContrast: "No existe en español. Intentar decir 'pan' o 'pao' delata inmediatamente al extranjero.", example: "Não, obrigado. Eu quero um pão fresco." },
                    { sound: "La 'S' Palatal (/ʃ/ como 'sh')", tip: "En portugués de Portugal, la 'S' al final de palabra o antes de consonante sorda suena como 'sh' ('dois' suena /dojʃ/, 'festa' suena /fɛʃtɐ/).", spanishContrast: "En español la S es sibilante alveolar. En Portugal suena como mandar a callar.", example: "Estes dois rapazes vão à festa." }
                ],
                grammar: [{ name: "Verbo Ser vs Estar", formula: "[ Ser (permanente) ] vs [ Estar (temporal/localización) ]", desc: "Idéntica distinción que en español, pero con conjugaciones propias ('Sou, És, É, Somos, São').", example: "Eu sou português e estou em Lisboa." }],
                bridges: [{ rule: "Sintaxis Compartida (88% común)", spanishLink: "El orden de las palabras y la concordancia es casi idéntica.", example: "A casa é muito grande e bonita." }],
                mistakes: [{ error: "Propina pensar que es una gratificación.", fix: "Propina = Tasa de matrícula universitaria. Propina de camarero es 'Gorjeta'.", why: "Falso amigo financiero.", example: "Pagar a propina da faculdade." }],
                mnemonics: [{ trick: "La Campana Nasal para el -ÃO", explanation: "Tápate la nariz un segundo al decir 'não': si vibra la nariz, lo estás haciendo perfecto.", formula: "N + A nasal + U = Não" }],
                modelPhrases: [{ phrase: "Olá! Muito prazer em conhecer-te!", meaning: "¡Hola! ¡Mucho gusto en conocerte!" }]
            },
            {
                levelTitle: "A1-A2 (Básico / Elemental)",
                scope: "Pretérito perfeito vs imperfeito, estar a + infinitivo (Portugal) y falsos amigos.",
                teacherSpokenScript: "Bem-vindo ao nível A1-A2! Repara nas diferenças entre o pretérito perfeito e o imperfeito: 'Ontem fui ao mercado enquanto chovia.' Em Portugal usamos 'estar a mais infinitivo' em vez do gerúndio: 'Estou a comer.' Muito bem!",
                phonetics: [{ sound: "Reducción de Vocales Átonas en Portugal", tip: "Las vocales no acentuadas casi desaparecen en la pronunciación europea: 'excelente' suena /ɐjʃ.s(ə).lẽ.t(ə)/.", spanishContrast: "El portugués europeo es una lengua con reducción extrema, similar al ruso o inglés.", example: "O telefone está na mesa pequena." }],
                grammar: [{ name: "Estar a + Infinitivo (Perífrasis de Portugal)", formula: "[ Estar conjugado + A + Infinitivo ]", desc: "En Portugal no se usa el gerundio para acciones continuas ('Estou a trabalhar' en vez de 'Estoy trabajando').", example: "Agora mesmo estou a estudar português." }],
                bridges: [{ rule: "Terminaciones -ÇÃO = -CIÓN", spanishLink: "Informação, Ação, Condição son transparentes.", example: "A informação está correta." }],
                mistakes: [{ error: "Borracha pensar que es mujer ebria.", fix: "Borracha = Goma de borrar. Mujer ebria es 'bêbada'.", why: "Falso amigo cómplice.", example: "Preciso de uma borracha para apagar o lápis." }],
                mnemonics: [{ trick: "La Fórmula 'A + Infinitivo' de Portugal", explanation: "Cambia tu gerundio por 'a + verbo en infinitivo'.", formula: "Estou comendo -> Estou a comer" }],
                modelPhrases: [{ phrase: "Ontem estive a falar com o médico sobre a receita.", meaning: "Ayer estuve hablando con el médico sobre la receta." }]
            },
            {
                levelTitle: "B1 (Intermedio)",
                scope: "O Segredo de Ouro: Infinitivo Pessoal, conjuntivo e pronombres clíticos.",
                teacherSpokenScript: "Bem-vindo ao nível B1! O grande segredo do português é o infinitivo pessoal, que não existe em espanhol: 'É importante nós fazermos este exercício.' Usa também o conjuntivo: 'Espero que tenhas um ótimo dia.' Força!",
                phonetics: [{ sound: "La 'L' Final Velarizada (/ɫ/ o /w/)", tip: "En Portugal la 'L' final suena velarizada (oscura). En Brasil suena como una 'U' ('Brasil' -> /bɾaˈziw/).", spanishContrast: "En español la L siempre es clara y dental.", example: "O sol brilha no Brasil e em Portugal." }],
                grammar: [{ name: "El Infinitivo Personal (Invenção Portuguesa)", formula: "[ Infinitivo + Desinencias personales (-es, -mos, -des, -em) ]", desc: "Permite al infinitivo tener su propio sujeto: 'Para nós fazermos' (para que nosotros hagamos).", example: "É melhor irmos embora agora para não chegarmos tarde." }],
                bridges: [{ rule: "Conjuntivo Presente casi idéntico", spanishLink: "Que eu faça, que tu tenhas, que ele possa.", example: "Espero que tudo corra bem." }],
                mistakes: [{ error: "Polvo pensar que es suciedad.", fix: "Polvo = Pulpo de comer. Polvo de suciedad es 'Pó'.", why: "Falso amigo gastronómico.", example: "Hoje vamos comer arroz de polvo." }],
                mnemonics: [{ trick: "El Infinitivo con Dueño", explanation: "Si el infinitivo lo hace 'nosotros', ponle '-mos' (fazer -> fazermos).", formula: "Verbo infinitivo + marca de persona" }],
                modelPhrases: [{ phrase: "Seria conveniente nós falarmos com o diretor antes da decisão final.", meaning: "Sería conveniente que habláramos con el director antes de la decisión final." }]
            },
            {
                levelTitle: "B2 (Avanzado / Upper-Intermediate)",
                scope: "Futuro do conjuntivo, mesóclise y conectores de alta expresión.",
                teacherSpokenScript: "Bem-vindo ao nível B2! Domina o futuro do conjuntivo: 'Quando fores a Lisboa, avisa-me.' E aprende a colocação pronominal avançada. Excelente trabalho!",
                phonetics: [{ sound: "Cadencia Melódica Portuguesa", tip: "Alternancia rápida de sílabas comprimidas con sílabas tónicas alargadas.", spanishContrast: "Ritmo acentual marcado frente al silábico español.", example: "Independentemente de tudo, vamos conseguir." }],
                grammar: [{ name: "Futuro del Subjuntivo (Futuro do Conjuntivo)", formula: "[ Quando / Se + Futuro do Conjuntivo ]", desc: "Totalmente vivo en portugués: 'Quando você quiser' (cuando quieras).", example: "Se tiveres tempo amanhã, vem tomar um café comigo." }],
                bridges: [{ rule: "Sufijos -MENTE para adverbios", spanishLink: "Prontamente, felizmente, claramente.", example: "Ele resolveu o assunto prontamente." }],
                mistakes: [{ error: "Presunto pensar que es sospechoso.", fix: "Presunto = Jamón curado. Sospechoso es 'Suspeito'.", why: "Falso amigo culinario.", example: "Comi uma sandes de presunto." }],
                mnemonics: [{ trick: "El 'Quando' exige Futuro del Subjuntivo", explanation: "En cuanto digas 'quando' para el futuro, usa la forma infinitivo/futuro.", formula: "Quando eu for, quando tu fores, quando ele for." }],
                modelPhrases: [{ phrase: "Assim que tivermos os resultados definitivos, entraremos em contacto.", meaning: "En cuanto tengamos los resultados definitivos, nos pondremos en contacto." }]
            },
            {
                levelTitle: "C1+ (Dominio Nativo / Maestría)",
                scope: "Mesóclise formal, riqueza estilística y precisión retórica lusófona.",
                teacherSpokenScript: "Bem-vindo ao nível C1! Alcança a máxima fluência e riqueza vocabular com expressões idiomáticas e precisão estilística: 'Dir-se-ia que a questão está resolvida.' Parabéns pelo teu percurso!",
                phonetics: [{ sound: "Micro-articulación y Sutileza Entonativa", tip: "Transición elegante entre registros formales e informales sin vacilación.", spanishContrast: "Fluidez natural sin perder la pureza nasal.", example: "Dir-se-ia que a situação é por demais evidente." }],
                grammar: [{ name: "A Mesóclise Clássica", formula: "[ Raiz do verbo + Pronome + Desinência ]", desc: "Exclusiva del portugués formal: 'Far-me-ás um favor' (me harás un favor).", example: "Dar-te-ei todas as informações necessárias amanhã." }],
                bridges: [{ rule: "Vocabulario jurídico-administrativo común", spanishLink: "Inalienável, jurisprudência, consubstanciar.", example: "Consubstanciar uma proposta sólida." }],
                mistakes: [{ error: "Usar construcciones sintácticas del español en portugués culto.", fix: "Respetar la colocación pronominal (ênclise / próclise).", why: "Elegancia normativa.", example: "Disse-me que viria." }],
                mnemonics: [{ trick: "Mesóclise = Pronombre en el Corazón del Verbo", explanation: "El pronombre se mete dentro del futuro o condicional.", formula: "Fará + o -> Fá-lo-á" }],
                modelPhrases: [{ phrase: "Havendo disponibilidade orçamental, implementar-se-ão as novas diretrizes.", meaning: "Habiendo disponibilidad presupuestaria, se implementarán las nuevas directrices." }]
            }
        ];

        // SELECCIÓN SEGÚN IDIOMA
        let curriculumList = enCurriculums;
        if (code === 'fr') curriculumList = frCurriculums;
        else if (code === 'de') curriculumList = deCurriculums;
        else if (code === 'it') curriculumList = itCurriculums;
        else if (code === 'pt') curriculumList = ptCurriculums;
        else {
            // Idiomas secundarios (ru, ca, eu, gl): Generador calibrado
            const langName = code.toUpperCase();
            const levelNames = ["A0 (Iniciación / Starter)", "A1-A2 (Básico / Elemental)", "B1 (Intermedio)", "B2 (Avanzado)", "C1+ (Dominio Nativo)"];
            return {
                levelTitle: levelNames[safeIdx],
                scope: `Dominio oficial y exigencias lingüísticas para el nivel ${levelNames[safeIdx]} en ${langName}.`,
                teacherSpokenScript: `Welcome to level ${levelNames[safeIdx]}! Practice consistently, focus on natural sentence structures, and listen carefully to every native audio example. You are doing great!`,
                phonetics: [
                    {
                        sound: `Fonética y Articulación ${langName}`,
                        tip: "Articula con claridad, prestando atención a la posición de la lengua y a las vocales abiertas y cerradas.",
                        spanishContrast: "Adapta el aparato fonador evitando trasladar directamente los hábitos fonéticos del castellano.",
                        example: "Bona tarda, com esteu?"
                    }
                ],
                grammar: [
                    {
                        name: "Estructura Oracional Clave",
                        formula: "[ Sujeto + Verbo + Complementos ]",
                        desc: "Construye oraciones claras respetando el orden sintáctico natural del idioma.",
                        example: "Aquest és un exemple clar de la gramàtica."
                    }
                ],
                bridges: [
                    {
                        rule: "Puentes Léxicos con el Castellano",
                        spanishLink: "Aprovecha las raíces comunes y los cognados transparentes para expandir tu vocabulario sin esfuerzo.",
                        example: "Informació, Situació, General."
                    }
                ],
                mistakes: [
                    {
                        error: "Traducción literal de giros del castellano.",
                        fix: "Usar expresiones idiomáticas nativas contrastadas.",
                        why: "Cada lengua tiene sus propias colocaciones naturales.",
                        example: "Tenir cura (cuidar)."
                    }
                ],
                mnemonics: [
                    {
                        trick: "El Ancla de la Rutina Diaria",
                        explanation: "Asocia cada regla gramatical con una acción cotidiana que realices todos los días.",
                        formula: "Acción diaria = Frase en el idioma"
                    }
                ],
                modelPhrases: [
                    { phrase: "Moltes gràcies per la vostra atenció i col·laboració.", meaning: "Muchas gracias por vuestra atención y colaboración." }
                ]
            };
        }

        return curriculumList[safeIdx] || curriculumList[0];
    },
        selectGrammarLevel: function(levelIdx) {
            game.selectedGrammarLevelIdx = parseInt(levelIdx, 10);
            game.renderGrammarContent();
            game.speakGrammarSummary(true);
        },

        buildGrammarPlainText: function(cur, langInfo) {
            const teacher = langInfo.teacherName || 'Profesora';
            const lang = langInfo.name || 'Idioma';
            
            let phoneticsNarrative = '';
            if (cur.phonetics && cur.phonetics.length > 0) {
                phoneticsNarrative = cur.phonetics.map(p => {
                    let ex = p.example ? ` Por ejemplo: <strong style="color: var(--neon-cyan); font-style: italic;">"${p.example}"</strong> <button onclick="game.speakExampleText(decodeURIComponent('${encodeURIComponent(p.example)}'))" class="tech" style="padding: 2px 7px; border-radius: 4px; border: 1px solid var(--neon-cyan); background: rgba(0,243,255,0.2); color: #FFF; font-size: 0.74rem; cursor: pointer; vertical-align: baseline; margin: 0 4px;" title="Escuchar pronunciación">🔊</button>.` : '';
                    let contrast = p.spanishContrast ? ` Frente al castellano, ${p.spanishContrast}` : '';
                    return `Respecto a <strong>${p.sound}</strong>: ${p.tip}${contrast}${ex}`;
                }).join(' ');
            }

            let grammarNarrative = '';
            if (cur.grammar && cur.grammar.length > 0) {
                grammarNarrative = cur.grammar.map(g => {
                    let ex = g.example ? ` Escúchalo en la práctica: <strong style="color: var(--neon-cyan); font-style: italic;">"${g.example}"</strong> <button onclick="game.speakExampleText(decodeURIComponent('${encodeURIComponent(g.example)}'))" class="tech" style="padding: 2px 7px; border-radius: 4px; border: 1px solid var(--neon-cyan); background: rgba(0,243,255,0.2); color: #FFF; font-size: 0.74rem; cursor: pointer; vertical-align: baseline; margin: 0 4px;" title="Escuchar frase">🔊</button>.` : '';
                    return `Para dominar <strong>${g.name}</strong>, la clave es ${g.desc} El esquema mental directo es <span style="color: var(--cyber-ok); font-weight: 600;">${g.formula}</span>.${ex}`;
                }).join(' ');
            }

            let bridgesNarrative = '';
            if (cur.bridges && cur.bridges.length > 0) {
                bridgesNarrative = cur.bridges.map(b => {
                    return `Aprovecha la regla de <strong>${b.rule}</strong>: ${b.spanishLink} Puedes comprobarlo en términos como <span style="color: #67e8f9; font-weight: 600;">${b.example}</span>.`;
                }).join(' ');
            }

            let mistakesNarrative = '';
            if (cur.mistakes && cur.mistakes.length > 0) {
                mistakesNarrative = cur.mistakes.map(m => {
                    let ex = m.example ? ` Escucha el uso auténtico: <strong style="color: var(--neon-cyan); font-style: italic;">"${m.example}"</strong> <button onclick="game.speakExampleText(decodeURIComponent('${encodeURIComponent(m.example)}'))" class="tech" style="padding: 2px 7px; border-radius: 4px; border: 1px solid var(--neon-cyan); background: rgba(0,243,255,0.2); color: #FFF; font-size: 0.74rem; cursor: pointer; vertical-align: baseline; margin: 0 4px;" title="Escuchar">🔊</button>.` : '';
                    return `Un fallo habitual de traducción directa es decir <span style="color: #ff6b81; text-decoration: line-through;">"${m.error}"</span>, cuando lo natural es <span style="color: var(--cyber-ok); font-weight: bold;">"${m.fix}"</span>, ya que ${m.why}.${ex}`;
                }).join(' ');
            }

            let mnemonicsNarrative = '';
            if (cur.mnemonics && cur.mnemonics.length > 0) {
                mnemonicsNarrative = cur.mnemonics.map(mn => {
                    let form = mn.formula ? ` Recuerda esta fórmula directa: <span style="color: #a78bfa; font-weight: bold;">${mn.formula}</span>.` : '';
                    return `Aplica la regla nemotécnica de <strong>${mn.trick}</strong>: ${mn.explanation}${form}`;
                }).join(' ');
            }

            let modelPhrasesNarrative = '';
            if (cur.modelPhrases && cur.modelPhrases.length > 0) {
                modelPhrasesNarrative = cur.modelPhrases.map(mp => {
                    return `<span style="display: block; margin: 6px 0; color: #E2E8F0;">• <strong style="color: #FFF; font-style: italic;">"${mp.phrase}"</strong> <button onclick="game.speakExampleText(decodeURIComponent('${encodeURIComponent(mp.phrase)}'))" class="tech" style="padding: 2px 7px; border-radius: 4px; border: 1px solid var(--neon-cyan); background: rgba(0,243,255,0.2); color: #FFF; font-size: 0.74rem; cursor: pointer; margin: 0 4px; vertical-align: baseline;" title="Escuchar">🔊</button> <span style="color: #94a3b8; font-size: 0.88rem;">(${mp.meaning})</span></span>`;
                }).join('');
            }

            return `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 0.95rem; line-height: 1.8; color: #E2E8F0; text-align: left;">
                    
                    <p style="margin: 0 0 16px;">
                        <strong style="color: var(--neon-cyan); font-size: 1.02rem; font-family: 'Orbitron', sans-serif;">GUÍA DEL NIVEL ${cur.levelTitle.toUpperCase()}</strong> · <span style="color: #94a3b8; font-size: 0.84rem;">Profesora ${teacher} (${lang})</span>
                    </p>

                    <p style="margin: 0 0 16px;">
                        ¡Bienvenido a tu guía pedagógica de <strong>${cur.levelTitle}</strong>! En esta etapa tu meta principal es <strong>${cur.scope.toLowerCase()}</strong> Para avanzar con rapidez y naturalidad, abordamos las habilidades requeridas apoyándonos en todo lo que compartes con el castellano y desactivando los vicios de traducción palabra por palabra.
                    </p>

                    ${phoneticsNarrative ? `
                        <p style="margin: 0 0 16px;">
                            En el ámbito de la <strong>fonética, pronunciación y colocación bucal</strong>, la clave respecto al español radica en relajar la musculatura de los labios y dominar los sonidos propios del idioma: ${phoneticsNarrative}
                        </p>
                    ` : ''}

                    ${grammarNarrative ? `
                        <p style="margin: 0 0 16px;">
                            En cuanto a la <strong>arquitectura gramatical y el orden de la frase</strong>, debes acostumbrarte a pensar en los esquemas nativos sin traducir palabra por palabra: ${grammarNarrative}
                        </p>
                    ` : ''}

                    ${bridgesNarrative ? `
                        <p style="margin: 0 0 16px;">
                            Dispones de una enorme ventaja gracias a los <strong>puentes y similitudes con el español</strong>, con miles de raíces y sufijos comunes que amplían tu vocabulario al instante: ${bridgesNarrative}
                        </p>
                    ` : ''}

                    ${mistakesNarrative ? `
                        <p style="margin: 0 0 16px;">
                            Por otro lado, presta especial atención a las <strong>diferencias críticas y falsos amigos</strong> donde el cerebro hispanohablante suele tropezar: ${mistakesNarrative}
                        </p>
                    ` : ''}

                    ${mnemonicsNarrative ? `
                        <p style="margin: 0 0 16px;">
                            Para memorizar y usar el idioma sin dudar en una conversación real, utiliza estas <strong>reglas nemotécnicas y trucos mentales</strong>: ${mnemonicsNarrative}
                        </p>
                    ` : ''}

                    ${modelPhrasesNarrative ? `
                        <div style="margin: 0 0 16px;">
                            Entrena tu ritmo y entonación leyendo y repitiendo en voz alta estas <strong>frases modelo esenciales</strong> del nivel:
                            ${modelPhrasesNarrative}
                        </div>
                    ` : ''}

                    <p style="margin: 0; color: #cbd5e1; font-style: italic; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 14px;">
                        💡 <strong>Consejo de tu profesora ${teacher}:</strong> He comenzado a explicarte este nivel en ${lang} para que entrenes el oído. Lee este texto a tu ritmo, pulsa los altavoces 🔊 en cada ejemplo para imitar los sonidos nativos y verás cómo tu soltura crece día a día.
                    </p>

                </div>
            `;
        },

        updateGrammarSpeakBtn: function() {
            const btn = document.getElementById('btn-speak-grammar-summary');
            const lbl = document.getElementById('lbl-speak-grammar-btn');
            const avatar = document.getElementById('avatar-grammar-modal');
            if (lbl) {
                lbl.innerText = game.isGrammarSpeaking ? 'Pausar Profesora' : 'Escuchar Profesora';
            }
            if (btn) {
                if (game.isGrammarSpeaking) {
                    btn.classList.add('pulsing');
                    btn.style.borderColor = 'var(--neon-pink)';
                    btn.style.boxShadow = '0 0 16px rgba(255,0,85,0.4)';
                } else {
                    btn.classList.remove('pulsing');
                    btn.style.borderColor = 'var(--neon-cyan)';
                    btn.style.boxShadow = '0 0 12px rgba(0,243,255,0.35)';
                }
            }
            if (avatar) {
                if (game.isGrammarSpeaking) avatar.classList.add('talking');
                else avatar.classList.remove('talking');
            }
        },

        renderGrammarContent: function() {
            const modal = document.getElementById('modal-grammar-plus');
            const body = document.getElementById('grammar-modal-body');
            const titleEl = document.getElementById('grammar-modal-title');
            const subtitleEl = document.getElementById('grammar-modal-subtitle');
            const avatarModal = document.getElementById('avatar-grammar-modal');

            if (!modal || !body) return;

            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const levelLabels = app.getLevelLabels();
            const activeLevel = (typeof app !== 'undefined' && app.getAcademyLevel) ? app.getAcademyLevel(currentLang) : (db.academy_level || 0);
            const currentLevelIdx = (game.selectedGrammarLevelIdx !== null && game.selectedGrammarLevelIdx !== undefined) ? parseInt(game.selectedGrammarLevelIdx, 10) : activeLevel;
            const currentLevelName = levelLabels[currentLevelIdx] || 'A1-A2';

            if (avatarModal) {
                avatarModal.innerHTML = `<img src="${langInfo.gif}" class="avatar-img" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="${langInfo.teacherName}">`;
            }

            if (titleEl) titleEl.innerText = `${langInfo.grammarPlusBtnLabel || 'GRAMMAR+'} · NIVEL ${currentLevelName}`;
            if (subtitleEl) subtitleEl.innerText = `Guía Pedagógica y Pronunciación · ${langInfo.name} (${langInfo.teacherName})`;

            const cur = game.getPedagogicalCurriculum(currentLang, currentLevelIdx);
            game.lastGrammarTextToSpeak = cur.teacherSpokenScript;

            game.updateGrammarSpeakBtn();

            const levelTabNames = ['A0', 'A1-A2', 'B1', 'B2', 'C1+'];
            const plainTextHtml = game.buildGrammarPlainText(cur, langInfo);

            body.innerHTML = `
                <!-- SELECTOR DISCRETO DE NIVELES -->
                <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 12px; scrollbar-width: none;">
                    ${levelTabNames.map((name, idx) => `
                        <button onclick="game.selectGrammarLevel(${idx})" class="tech" style="flex: 1; min-width: 65px; padding: 7px 8px; border-radius: 6px; font-size: 0.78rem; font-family: 'Orbitron', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.2s; ${idx === currentLevelIdx ? 'background: rgba(0,243,255,0.25); border: 1.5px solid var(--neon-cyan); color: #FFF; box-shadow: 0 0 10px rgba(0,243,255,0.4);' : 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #AAA;'}">
                            ${name}
                        </button>
                    `).join('')}
                </div>

                <!-- CONTENIDO EN TEXTO PLANO CONTINUO (LIMPIO Y FÁCIL DE LEER) -->
                <div style="padding: 4px 6px;">
                    ${plainTextHtml}
                </div>
            `;
        },

        showGrammarConsultation: async () => {
            const modal = document.getElementById('modal-grammar-plus');
            if (!modal) return;

            let activeLevel = 0;
            if (typeof app !== 'undefined' && app.getAcademyLevel) {
                activeLevel = app.getAcademyLevel(currentLang);
            } else if (typeof db !== 'undefined' && db.academy_level !== undefined) {
                activeLevel = parseInt(db.academy_level, 10);
            }
            if (isNaN(activeLevel) || activeLevel < 0) activeLevel = 0;
            game.selectedGrammarLevelIdx = activeLevel;

            modal.classList.remove('hidden');
            history.pushState({ modal: 'grammar-plus' }, null, '#grammar-plus');
            game.renderGrammarContent();

            // Iniciar de inmediato la voz de la profesora en el idioma seleccionado
            try {
                if (window.speechSynthesis && window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
            } catch(e) {}
            game.speakGrammarSummary(true);
        },

        closeGrammarConsultation: (skipHistoryBack = false) => {
            const modal = document.getElementById('modal-grammar-plus');
            if (modal) modal.classList.add('hidden');
            if (typeof audio !== 'undefined' && audio.stopSpeech) {
                audio.stopSpeech();
            } else if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            game.isGrammarSpeaking = false;
            game.updateGrammarSpeakBtn();
            if (!skipHistoryBack && history.state && history.state.modal === 'grammar-plus') {
                history.back();
            }
        },

        speakGrammarSummary: (forceStart = false) => {
            if (!game.lastGrammarTextToSpeak) return;

            if (game.isGrammarSpeaking && !forceStart) {
                if (typeof audio !== 'undefined' && audio.stopSpeech) {
                    audio.stopSpeech();
                } else if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                }
                game.isGrammarSpeaking = false;
                game.updateGrammarSpeakBtn();
                return;
            }

            if (typeof audio !== 'undefined' && audio.stopSpeech) {
                audio.stopSpeech();
            } else if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }

            game.isGrammarSpeaking = true;
            game.updateGrammarSpeakBtn();

            const onDone = () => {
                game.isGrammarSpeaking = false;
                game.updateGrammarSpeakBtn();
            };

            if (typeof audio !== 'undefined' && audio.speakNative) {
                audio.speakNative(game.lastGrammarTextToSpeak, currentLang, onDone);
            } else if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(game.lastGrammarTextToSpeak);
                u.lang = LANGUAGES[currentLang]?.speechLang || 'en-US';
                u.onend = onDone;
                u.onerror = onDone;
                window.speechSynthesis.speak(u);
            }
        },

        openYouGlishDirect: () => {
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const youglishLang = langInfo.youglishLang || 'english';

            // Obtener el tema actual de la sesión o las palabras practicadas
            let topicObj = null;
            if (session.selectedListId) {
                topicObj = db.topics.find(t => t.id == session.selectedListId);
            }
            if (!topicObj && game.data && game.data.length > 0 && game.data[0].topic_id) {
                topicObj = db.topics.find(t => t.id == game.data[0].topic_id);
            }

            let searchTerm = '';
            if (topicObj && topicObj.name) {
                let cleanName = topicObj.name.includes('/') ? topicObj.name.split('/')[0].trim() : topicObj.name;
                searchTerm = cleanName.replace(/[&,+]/g, ' ').replace(/\s+/g, ' ').trim();
            } else if (game.sessionWordsPracticed && game.sessionWordsPracticed.length > 0) {
                searchTerm = game.sessionWordsPracticed[0].english;
            } else if (game.data && game.data.length > 0) {
                searchTerm = game.data[0].english;
            } else {
                searchTerm = 'conversation';
            }

            if (searchTerm.includes('(')) searchTerm = searchTerm.split('(')[0].trim();

            const url = `https://youglish.com/pronounce/${encodeURIComponent(searchTerm)}/${youglishLang}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        },

        speak: () => {
            const item = game.data[game.index];
            if (!item) return;
            const cleanWord = item.english.includes('(') ? item.english.split('(')[0].trim() : item.english;
            game.speakText(cleanWord);
        },

        speakWordSlow: () => {
            const item = game.data[game.index];
            if (!item) return;
            const cleanWord = item.english.includes('(') ? item.english.split('(')[0].trim() : item.english;
            game.speakText(cleanWord, 0.4);
        },

        primeAudio: () => {
            try {
                if (window.AudioContext || window.webkitAudioContext) {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    const ctx = new AudioCtx();
                    if (ctx.state === 'suspended') ctx.resume();
                }
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance(' ');
                    u.volume = 0.01;
                    window.speechSynthesis.speak(u);
                }
            } catch(e) {}
        },

        speakText: (text, rateOverride) => {
            if (!text) return;
            game.stopMic();
            if (typeof audio !== 'undefined' && audio.stopSpeech) audio.stopSpeech();
            else window.speechSynthesis.cancel();
            game.lastText = text;

            const onStartAnim = () => {
                document.querySelectorAll('.avatar-container').forEach(el => el.classList.add('talking'));
                document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.gifSrc) img.src = img.dataset.gifSrc; });
            };

            const onEndAnim = () => {
                document.querySelectorAll('.avatar-container').forEach(el => el.classList.remove('talking'));
                document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.staticSrc) img.src = img.dataset.staticSrc; else if (img.dataset.idleSrc) img.src = img.dataset.idleSrc; });

                // Auto mic for game view
                if (game.autoMic && !document.getElementById('view-game').classList.contains('hidden')) {
                    setTimeout(() => {
                        if (!document.getElementById('mic-btn').classList.contains('listening') && !document.getElementById('view-game').classList.contains('hidden')) {
                            game.toggleMic(); scrollToMicArea('mic-btn');
                        }
                    }, 500);
                }
                // Auto mic for conversation
                if (conversation.autoMic && !document.getElementById('view-conversation').classList.contains('hidden')) {
                    setTimeout(() => {
                        if (!document.getElementById('mic-btn-convo').classList.contains('listening') && !document.getElementById('view-conversation').classList.contains('hidden')) {
                            conversation.toggleMic(); scrollToMicArea('mic-btn-convo');
                        }
                    }, 1000);
                }
            };

            onStartAnim();
            if (typeof audio !== 'undefined' && audio.speakNative) {
                audio.speakNative(text, currentLang, onEndAnim, rateOverride);
            } else {
                const u = new SpeechSynthesisUtterance(text);
                const sliderRate = parseFloat(document.getElementById('speech-speed-slider')?.value || 0.7);
                u.rate = rateOverride !== undefined ? rateOverride : sliderRate;
                u.lang = LANGUAGES[currentLang]?.speechLang || 'en-US';
                u.onend = onEndAnim;
                u.onerror = onEndAnim;
                window.speechSynthesis.speak(u);
            }
        },

        toggleMic: () => {
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const micBtn = document.getElementById('mic-btn');
            if (stt.isRecording) {
                stt.stop();
                return;
            }

            game.stopMic();
            window.speechSynthesis.cancel();
            game.startTimer();
            scrollToMicArea('mic-btn');

            stt.startRecording(
                'game',
                langInfo.code,
                (transcript) => {
                    game.stopTimer();
                    game.check(transcript);
                },
                (err) => {
                    console.log("Game mic error:", err);
                    game.stopTimer();
                }
            );
        },

        check: (transcript) => {
            document.getElementById('spoken-text').innerText = `You said: "${transcript}"`;
            let target = game.data[game.index].english.toLowerCase();
            if (target.includes('(')) target = target.split('(')[0].trim();
            let clean = transcript.toLowerCase().replace(/[.,!?]/g, '').trim();
            const correct = game.isCloseMatch(target, clean);
            const wId = game.data[game.index].id;
            let prog = db.progress.find(p => p.word_id === wId);
            if (!prog) { prog = { word_id: wId, attempts: 0, successes: 0 }; db.progress.push(prog); }
            prog.attempts++;
            if (correct) prog.successes++;
            app.saveDB();
            game.stopMic();
            if (correct) game.handleCorrect(); else game.handleIncorrect(target, clean);
        },

        stopMic: () => {
            stt.stop();
            game.stopTimer();
        },

        onBackgroundClick: (e) => {
            if (e && e.target && (e.target.closest('.session-word-card') || e.target.closest('button') || e.target.closest('.avatar-container') || e.target.closest('#modal-teacher-select'))) {
                return;
            }
            game.stopAll();
        },

        stopAll: () => {
            game.stopMic();
            window.speechSynthesis.cancel();
            document.querySelectorAll('.avatar-container').forEach(el => el.classList.remove('talking'));
            document.querySelectorAll('.listening').forEach(el => el.classList.remove('listening'));
            const fb = document.getElementById('feedback-msg');
            if (fb) {
                fb.innerText = "⏸️ Pausado. Pulsa el micrófono o una palabra para reanudar.";
                fb.className = "feedback";
            }
        },

        handleCorrect: () => {
            const isRecovery = game.currentRetries >= 3;
            game.updatePerformance(isRecovery ? 4 : 8);

            const fb = document.getElementById('feedback-msg');
            fb.innerHTML = `Correct! 🎉`;
            fb.className = "feedback correct";
            audio.success();
            document.getElementById('mic-btn').classList.add('hidden');
            document.getElementById('fail-options').classList.add('hidden');
            document.getElementById('ai-advice').classList.add('hidden');

            if (game.isSessionMode) {
                setTimeout(() => session.onWordComplete(), 1400);
            } else {
                setTimeout(game.next, 1400);
            }
        },

        handleIncorrect: (target, clean) => {
            audio.fail();

            const currItem = game.data[game.index];
            if (currItem) {
                if (!game.sessionMistakes) game.sessionMistakes = [];
                let existing = game.sessionMistakes.find(m => (m.id && m.id === currItem.id) || m.word === currItem.english);
                if (!existing) {
                    game.sessionMistakes.push({
                        id: currItem.id,
                        word: currItem.english,
                        ipa: currItem.ipa,
                        spanish: currItem.spanish,
                        retries: 1,
                        spoken: clean
                    });
                }
            }

            // Reducir rendimiento
            game.updatePerformance(-8);

            const fb = document.getElementById('feedback-msg');
            if (fb) {
                fb.innerHTML = `❌ <span style="color:var(--cyber-danger); font-weight:bold;">Incorrecto (-8% Rdto.)</span>. Siguiente palabra...`;
                fb.className = "feedback incorrect";
            }

            document.getElementById('mic-btn')?.classList.add('hidden');
            document.getElementById('fail-options')?.classList.add('hidden');
            document.getElementById('ai-advice')?.classList.add('hidden');

            // No hacer repetir: avanzar automáticamente a la siguiente palabra
            if (game.isSessionMode) {
                setTimeout(() => session.onWordComplete(), 900);
            } else {
                setTimeout(() => game.next(), 900);
            }
        },

        retryRecovery: () => {
            const failOptions = document.getElementById('fail-options');
            if (failOptions) failOptions.classList.add('hidden');
            const fb = document.getElementById('feedback-msg');
            if (fb) fb.innerText = "Pronuncia ahora para recuperar el punto:";
            game.updatePerformance(3);
            game.toggleMic();
        },

        getSpecificAdvice: async (targetWord, spokenWord) => {
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const container = document.getElementById('ai-advice');
            if (!container) return;
            container.innerHTML = "🤔 Analyzing your pronunciation..."; container.classList.remove('hidden');
            const prompt = `I'm a ${langInfo.aiPromptLang} student. I tried to say "${targetWord}" in ${langInfo.name} but I said "${spokenWord}". Give me a very brief, practical tip (1-2 sentences) to correct my pronunciation. Be direct and friendly. Answer in ${langInfo.name}.`;
            await app.callAI_Text(prompt, null, (text) => { container.innerHTML = `<strong>💡 Tip:</strong> ${text}`; });
        },

        retry: () => {
            document.getElementById('fail-options')?.classList.add('hidden');
            const fb = document.getElementById('feedback-msg');
            if (fb) fb.innerText = "";
            game.toggleMic();
        },

        next: () => {
            if (game.isSessionMode) { session.onWordComplete(); }
            else { game.index++; game.loadCard(); }
        },

        startTimer: () => {
            const bar = document.getElementById('timer-bar');
            const container = document.getElementById('timer-container');
            container.classList.remove('hidden'); bar.style.width = '0%';
            let startTime = Date.now(); const duration = 6000;
            if (game.timerInterval) clearInterval(game.timerInterval);
            game.timerInterval = setInterval(() => {
                const pct = Math.min(((Date.now() - startTime) / duration) * 100, 100);
                bar.style.width = pct + '%';
                if (pct >= 100) game.stopMic();
            }, 50);
        },
        stopTimer: () => { if (game.timerInterval) clearInterval(game.timerInterval); document.getElementById('timer-container')?.classList.add('hidden'); }
    };

    window.game = game;
