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

        lastGrammarTextToSpeak: '',

        showGrammarConsultation: async () => {
            const modal = document.getElementById('modal-grammar-plus');
            const body = document.getElementById('grammar-modal-body');
            const titleEl = document.getElementById('grammar-modal-title');
            const subtitleEl = document.getElementById('grammar-modal-subtitle');
            const avatarModal = document.getElementById('avatar-grammar-modal');

            if (!modal || !body) return;

            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const levelLabels = app.getLevelLabels();
            const currentLevelIdx = db.academy_level || 0;
            const currentLevelName = levelLabels[currentLevelIdx] || 'A1-A2';

            if (avatarModal) {
                avatarModal.innerHTML = `<img src="${langInfo.gif}" class="avatar-img" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="${langInfo.teacherName}">`;
            }

            if (titleEl) titleEl.innerText = `${langInfo.grammarPlusBtnLabel || 'GRAMMAR+'} · NIVEL ${currentLevelName}`;
            if (subtitleEl) subtitleEl.innerText = `Guía Oficial y Exigencias · ${langInfo.name} (${langInfo.teacherName})`;

            modal.classList.remove('hidden');
            history.pushState({ modal: 'grammar-plus' }, null, '#grammar-plus');

            // Matriz curricular completa y estructurada por nivel CEFR
            const levelCurriculums = [
                {
                    level: "A0 (Iniciación / Starter)",
                    scope: "Fundamentos básicos absolutos de comunicación elemental, sonidos y orden sintáctico.",
                    grammar: [
                        { name: "Pronombres y Verbo To Be / Ser-Estar", desc: "Uso correcto de pronombres personales y concordancia verbal básica.", example: "I am a student. You are ready. He is here." },
                        { name: "Sustantivos Singulares y Plurales", desc: "Reglas de plurales regulares (-s, -es) y artículos determinados/indeterminados.", example: "a book / two books, an apple / three apples" },
                        { name: "Negación y Preguntas Simples", desc: "Formación de oraciones negativas y preguntas de respuesta sí/no.", example: "Is this correct? No, it is not." }
                    ],
                    phonetics: [
                        { sound: "Vocales Claras & Articulación", tip: "Apertura bucal deliberada y separación clara de sílabas sin acelerarse." }
                    ],
                    mistakes: [
                        { error: "Olvidar el pronombre sujeto (ej. *is good*)", fix: "Siempre incluir el sujeto explícito: 'It is good'." }
                    ],
                    idioms: [
                        { phrase: "Have a nice day! / Take care!", meaning: "Fórmulas de cortesía cotidianas obligatorias de despedida." }
                    ]
                },
                {
                    level: "A1-A2 (Básico / Elemental)",
                    scope: "Comunicación cotidiana, descripciones personales, rutinas habituales y narración en pasado simple.",
                    grammar: [
                        { name: "Present Simple vs Present Continuous", desc: "Diferenciar hábitos y rutinas frente a acciones que ocurren en este preciso momento.", example: "I usually work, but right now I am studying." },
                        { name: "Pasado Simple (Regulares -ed e Irregulares Clave)", desc: "Narrar acciones finalizadas en un momento concreto del pasado.", example: "Yesterday I went to the store and bought fresh fruit." },
                        { name: "Preposiciones de Lugar y Tiempo (in, on, at)", desc: "Reglas fundamentales para situar objetos, fechas, horas y lugares.", example: "at 5 PM, on Monday, in the morning, at home" }
                    ],
                    phonetics: [
                        { sound: "Las 3 pronunciaciones del pasado -ed (/t/, /d/, /ɪd/)", tip: "Solo se añade la sílaba extra /ɪd/ tras sonidos 'T' o 'D' (decided, wanted). En el resto, finaliza con sonido seco /t/ o /d/ (walked, played)." },
                        { sound: "Letras mudas comunes", tip: "No pronunciar la 'k' en 'know/knife' ni la 'l' en 'walk/talk/could'." }
                    ],
                    mistakes: [
                        { error: "Confundir 'make' vs 'do'", fix: "Usar 'do' para actividades y tareas (do homework); usar 'make' para crear o producir (make a decision)." }
                    ],
                    idioms: [
                        { phrase: "Piece of cake", meaning: "Algo sumamente fácil de realizar." },
                        { phrase: "See you later / Hold on a second", meaning: "Expresiones estándar de fluidez conversacional básica." }
                    ]
                },
                {
                    level: "B1 (Intermedio)",
                    scope: "Independencia comunicativa, narración de vivencias pasadas, opiniones personales y planes futuros.",
                    grammar: [
                        { name: "Present Perfect vs Past Simple", desc: "Conectar experiencias pasadas con relevancia en el presente frente a momentos cerrados.", example: "I have lived here for two years (todavía vivo aquí)." },
                        { name: "Primer y Segundo Condicional (Real vs Hipotético)", desc: "Estructuras condicionales de causa-efecto y situaciones imaginarias.", example: "If I have time, I will call you. If I had more time, I would travel more." },
                        { name: "Modales de Obligación, Consejo y Deducción", desc: "Uso de must, should, have to, might y could con precisión de matices.", example: "You should rest. She must be at home right now." }
                    ],
                    phonetics: [
                        { sound: "Connected Speech & Linking", tip: "Enlazar consonante final con vocal inicial de la siguiente palabra de forma continua (ej. 'pick it up' -> /pɪkɪtʌp/)." },
                        { sound: "Diferenciación de vocales cortas vs largas", tip: "Distinguir nítidamente pares mínimos como ship /ʃɪp/ vs sheep /ʃiːp/." }
                    ],
                    mistakes: [
                        { error: "Usar 'since' en lugar de 'for'", fix: "'Since' para un punto de inicio (since 2020); 'For' para una duración de tiempo (for 3 years)." }
                    ],
                    idioms: [
                        { phrase: "Hit the nail on the head", meaning: "Acertar plenamente en un diagnóstico o respuesta." },
                        { phrase: "Break the ice / Call it a day", meaning: "Romper la tensión / Dar por concluida una jornada de trabajo." }
                    ]
                },
                {
                    level: "B2 (Avanzado / Upper Intermediate)",
                    scope: "Fluidez espontánea, debate argumentativo, matices estilísticos y estructuras sintácticas complejas.",
                    grammar: [
                        { name: "Tercer Condicional y Condicionales Mixtos", desc: "Hipótesis sobre el pasado y sus consecuencias en el presente.", example: "If I had taken that opportunity, my life would be completely different now." },
                        { name: "Voz Pasiva Avanzada y Verbos de Reporte", desc: "Estructuras formales e impersonales (It is widely believed that...).", example: "The results are expected to be announced tomorrow." },
                        { name: "Inversión y Estructuras de Énfasis", desc: "Uso de adverbios negativos al inicio para dar fuerza estilística.", example: "Rarely have I seen such dedication to language learning." }
                    ],
                    phonetics: [
                        { sound: "Reducción de sílabas débiles (Schwa /ə/)", tip: "Relajar la mandíbula y neutralizar vocales átonas para lograr el ritmo acentual nativo." },
                        { sound: "Entonación y Modulación del Énfasis", tip: "Variar la melodía de la frase para transmitir ironía, duda o certeza absoluta." }
                    ],
                    mistakes: [
                        { error: "Abuso de conectores simples (and, but, so)", fix: "Utilizar conectores avanzados como 'furthermore', 'nevertheless', 'consequently' o 'in light of'." }
                    ],
                    idioms: [
                        { phrase: "Burn the midnight oil", meaning: "Trabajar o estudiar intensamente hasta altas horas de la noche." },
                        { phrase: "Read between the lines / Steal someone's thunder", meaning: "Captar el significado implícito / Quitarle el protagonismo a alguien." }
                    ]
                },
                {
                    level: "C1+ (Dominio Nativo / Maestría)",
                    scope: "Precisión profesional, profundidad retórica, sutilezas culturales y flexibilidad total de registro.",
                    grammar: [
                        { name: "Oraciones Escindidas (Cleft Sentences)", desc: "Enfocar elementos concretos de la oración con máxima elegancia sintáctica.", example: "What really made the difference was her relentless consistency." },
                        { name: "Subjuntivo Avanzado, Elipsis y Sustitución", desc: "Economía del lenguaje y construcciones hipotéticas de registro culto.", example: "Had we known sooner, we would have acted accordingly." },
                        { name: "Colocaciones Avanzadas y Precisión Léxica", desc: "Uso exacto de combinaciones naturales nativas de alta densidad léxica.", example: "bitterly disappointed, highly contentious, fiercely independent" }
                    ],
                    phonetics: [
                        { sound: "Micro-asimilación y Elisión Nativa", tip: "Transiciones naturales de sonidos adyacentes y oclusiones glotales según dialectos." }
                    ],
                    mistakes: [
                        { error: "Traducción literal de frases hechas del español", fix: "Utilizar equivalentes pragmáticos nativos con carga cultural exacta." }
                    ],
                    idioms: [
                        { phrase: "Barking up the wrong tree / Bite the bullet", meaning: "Estar equivocado de objetivo / Afrontar con valentía una situación inevitable." }
                    ]
                }
            ];

            const cur = levelCurriculums[currentLevelIdx] || levelCurriculums[1];

            game.lastGrammarTextToSpeak = `Esta es la guía de gramática y exigencias oficiales para el nivel ${currentLevelName} en ${langInfo.name}. Los puntos clave exigibles incluyen: ${cur.grammar.map(g => g.name).join('. ')}. En fonética, domina: ${cur.phonetics.map(p => p.sound).join('. ')}.`;

            body.innerHTML = `
                <!-- RESUMEN DEL NIVEL -->
                <div style="background: rgba(0,243,255,0.08); border-left: 4px solid var(--neon-cyan); padding: 12px 16px; border-radius: 6px;">
                    <div style="font-family: 'Orbitron', sans-serif; font-size: 0.92rem; font-weight: bold; color: var(--neon-cyan);">
                        🎯 REQUISITOS OFICIALES · NIVEL ${cur.level}
                    </div>
                    <div style="margin-top: 4px; font-size: 0.85rem; color: #DDD; line-height: 1.4;">
                        ${cur.scope}
                    </div>
                </div>

                <!-- 1. ESTRUCTURAS GRAMATICALES CLAVE -->
                <div style="margin-top: 4px;">
                    <div style="font-family: 'Orbitron', sans-serif; font-size: 0.88rem; font-weight: bold; color: var(--cyber-ok); margin-bottom: 8px;">
                        📖 1. ESTRUCTURAS GRAMATICALES EXIGIBLES
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${cur.grammar.map(g => `
                            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 12px;">
                                <strong style="color: var(--neon-cyan); font-size: 0.88rem;">• ${g.name}:</strong>
                                <div style="font-size: 0.82rem; color: #BBB; margin: 3px 0 5px;">${g.desc}</div>
                                <div style="font-size: 0.8rem; color: #FFF; font-style: italic; background: rgba(0,0,0,0.4); padding: 5px 8px; border-radius: 4px; border-left: 2px solid var(--cyber-ok);">
                                    Ejemplo: "${g.example}"
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 2. FONÉTICA Y ARTICULACIÓN -->
                <div style="margin-top: 6px;">
                    <div style="font-family: 'Orbitron', sans-serif; font-size: 0.88rem; font-weight: bold; color: var(--neon-pink); margin-bottom: 8px;">
                        🗣️ 2. PRONUNCIACIÓN & FONÉTICA DEL NIVEL
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${cur.phonetics.map(p => `
                            <div style="background: rgba(255,0,85,0.06); border: 1px solid rgba(255,0,85,0.2); border-radius: 8px; padding: 10px 12px;">
                                <strong style="color: var(--neon-pink); font-size: 0.88rem;">• ${p.sound}:</strong>
                                <div style="font-size: 0.82rem; color: #DDD; margin-top: 3px; line-height: 1.35;">${p.tip}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 3. ERRORES TÍPICOS A EVITAR -->
                <div style="margin-top: 6px;">
                    <div style="font-family: 'Orbitron', sans-serif; font-size: 0.88rem; font-weight: bold; color: var(--cyber-warn); margin-bottom: 8px;">
                        ⚠️ 3. ERRORES TÍPICOS DE ESTE NIVEL
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${cur.mistakes.map(m => `
                            <div style="background: rgba(255,184,0,0.06); border: 1px solid rgba(255,184,0,0.2); border-radius: 8px; padding: 10px 12px;">
                                <div style="color: #ff6b81; font-size: 0.82rem; text-decoration: line-through;">❌ ${m.error}</div>
                                <div style="color: var(--cyber-ok); font-size: 0.84rem; font-weight: 600; margin-top: 3px;">✅ Corrección: ${m.fix}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 4. MODISMOS Y EXPRESIONES -->
                <div style="margin-top: 6px;">
                    <div style="font-family: 'Orbitron', sans-serif; font-size: 0.88rem; font-weight: bold; color: #a78bfa; margin-bottom: 8px;">
                        💬 4. EXPRESIONES Y MODISMOS (IDIOMS)
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${cur.idioms.map(item => `
                            <div style="background: rgba(167,139,250,0.06); border: 1px solid rgba(167,139,250,0.25); border-radius: 8px; padding: 10px 12px;">
                                <strong style="color: #c4b5fd; font-size: 0.88rem;">"${item.phrase}"</strong>
                                <div style="font-size: 0.82rem; color: #DDD; margin-top: 3px;">Significado: ${item.meaning}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        closeGrammarConsultation: (skipHistoryBack = false) => {
            const modal = document.getElementById('modal-grammar-plus');
            if (modal) modal.classList.add('hidden');
            window.speechSynthesis.cancel();
            if (!skipHistoryBack && history.state && history.state.modal === 'grammar-plus') {
                history.back();
            }
        },

        speakGrammarSummary: () => {
            if (!game.lastGrammarTextToSpeak) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(game.lastGrammarTextToSpeak);
            u.lang = 'es-ES';
            u.rate = 0.95;
            window.speechSynthesis.speak(u);
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
