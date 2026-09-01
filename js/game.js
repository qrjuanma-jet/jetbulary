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
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            u.rate = rateOverride;
            u.lang = langInfo.speechLang;

            const voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
                let f = voices.find(v => v.lang.startsWith(langInfo.code) && langInfo.femaleVoices.some(name => v.name.toLowerCase().includes(name)));
                if (!f) f = voices.find(v => v.lang.startsWith(langInfo.code) || v.lang.replace('_', '-').startsWith(langInfo.code));
                if (f) u.voice = f;
            }

            u.onstart = () => {
                document.querySelectorAll('.avatar-container').forEach(el => el.classList.add('talking'));
                document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.gifSrc) img.src = img.dataset.gifSrc; });
                const mainBtn = document.getElementById('btn-speak-report-main');
                if (mainBtn) mainBtn.style.boxShadow = '0 0 20px rgba(0, 243, 255, 0.8)';
            };

            u.onend = () => {
                document.querySelectorAll('.avatar-container').forEach(el => el.classList.remove('talking'));
                document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.staticSrc) img.src = img.dataset.staticSrc; else if (img.dataset.idleSrc) img.src = img.dataset.idleSrc; });
                const mainBtn = document.getElementById('btn-speak-report-main');
                if (mainBtn) mainBtn.style.boxShadow = 'none';
            };

            window.speechSynthesis.speak(u);
        },

        showPerformanceReport: async () => {
            game.stopMic();
            window.speechSynthesis.cancel();

            const modal = document.getElementById('modal-performance-report');
            if (modal) modal.classList.remove('hidden');

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
Words practiced in current session: ${wordsPracticedStr || 'Standard curriculum vocabulary'}.
Challenging words or mistakes made: ${mistakesStr || 'None, initial attempts were accurate'}.

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
1. Provide a warm, diagnostic evaluation and an inspiring MOTIVATIONAL ENCOURAGEMENT message to boost the student's confidence and energy.
2. Evaluate whether the student should "upgrade" to level index ${Math.min(4, currentLevelIdx + 1)} (${levelLabels[Math.min(4, currentLevelIdx + 1)]}) if ${performanceScore}% >= 85%, "downgrade" to level index ${Math.max(0, currentLevelIdx - 1)} if ${performanceScore}% < 45%, or "stay" at level ${currentLevelName}.
3. Provide practical GRAMMAR & STRUCTURAL INSIGHTS calibrated to ${currentGuide.levelName} (including irregular verbs, conjugation nuances, or sentence structures related to the session).
4. Share actionable NATIVE PRONUNCIATION HACKS & TRICKS (trucos de pronunciación) calibrated to ${currentGuide.levelName} with physical tongue/lip mouth techniques and test phrases.
5. Propose 3 STRUCTURED ADAPTIVE LESSONS (Lecciones Adaptadas) designed specifically for the student's performance (${performanceScore}%), mistakes, and level (${currentLevelName}) to systematically master and level up:
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
  "encouragement": "A warm, inspiring motivational message in ${langInfo.aiPromptLang} directly praising their effort, building confidence, and energizing them.",
  "evaluation": "2-3 sentences in ${langInfo.aiPromptLang} evaluating their pronunciation accuracy, rhythm, and vocabulary retention based on their ${performanceScore}% Rdto. at level ${currentLevelName}.",
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
            const ratingText = report.performance_rating || (performanceScore >= 75 ? 'High Mastery' : 'Good Progress');

            // ADAPTIVE LESSONS CARD (PLAN PARA SUPERAR EL NIVEL)
            let lessonsHtml = '';
            if (report.adaptive_lessons && Array.isArray(report.adaptive_lessons) && report.adaptive_lessons.length > 0) {
                lessonsHtml = `
                <div style="background: rgba(0,255,149,0.06); border: 1.5px solid var(--cyber-ok); border-radius: 12px; padding: 14px 16px; box-shadow: 0 0 16px rgba(0,255,149,0.25);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div class="tech" style="color: var(--cyber-ok); font-weight: 900; font-size: 0.86rem; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                            <span>🎯</span>
                            <span>LECCIONES ADAPTATIVAS PARA SUPERAR EL NIVEL</span>
                        </div>
                        <span style="font-size: 0.72rem; background: rgba(0,255,149,0.2); color: var(--cyber-ok); padding: 2px 8px; border-radius: 4px; font-weight: bold; border: 1px solid var(--cyber-ok);">PLAN DE SUPERACIÓN</span>
                    </div>
                    <div style="font-size: 0.82rem; color: #BBB; line-height: 1.35; margin-bottom: 10px;">
                        Lecciones interactivas personalizadas según tu rendimiento (${performanceScore}%) y conocimientos para consolidar y desbloquear el siguiente nivel:
                    </div>
                    ${report.adaptive_lessons.map((lsn, idx) => {
                        const wordsPills = lsn.target_words && Array.isArray(lsn.target_words)
                            ? lsn.target_words.map(w => `<span style="background: rgba(0,0,0,0.5); border: 1px solid rgba(0,243,255,0.3); border-radius: 4px; padding: 2px 6px; font-size: 0.76rem; color: #FFF;"><strong>${w.word}</strong>${w.ipa ? ` <span style="color:var(--neon-pink); font-size:0.7rem;">/${w.ipa.replace(/\//g,'')}/</span>` : ''}</span>`).join(' ')
                            : '';
                        const isChallenge = idx === 2 || (lsn.lesson_title && (lsn.lesson_title.toLowerCase().includes('challenge') || lsn.lesson_title.toLowerCase().includes('level up')));
                        const borderColor = isChallenge ? 'var(--neon-pink)' : 'var(--neon-cyan)';
                        const badgeBg = isChallenge ? 'rgba(255,0,85,0.2)' : 'rgba(0,243,255,0.15)';
                        const badgeColor = isChallenge ? 'var(--neon-pink)' : 'var(--neon-cyan)';
                        return `
                        <div style="background: rgba(0,0,0,0.45); border: 1.5px solid ${borderColor}; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 900; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px;">LECCIÓN ${lsn.lesson_number || (idx + 1)}</span>
                                    <strong style="color: #FFF; font-size: 0.88rem;">${lsn.lesson_title}</strong>
                                </div>
                                ${isChallenge ? '<span style="font-size: 1rem;">🚀</span>' : '<span style="font-size: 1rem;">🌱</span>'}
                            </div>
                            <div style="font-size: 0.8rem; color: #CCC; margin: 4px 0 8px;">${lsn.objective || ''}</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
                                ${wordsPills}
                            </div>
                            <button type="button" onclick="game.startAdaptiveLesson(${idx})" class="tech" style="width: 100%; padding: 8px 12px; background: ${isChallenge ? 'linear-gradient(135deg, rgba(255,0,85,0.3), rgba(0,243,255,0.3))' : 'rgba(0,255,149,0.25)'}; border: 1px solid ${borderColor}; color: #FFF; font-weight: bold; border-radius: 6px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 0 10px ${isChallenge ? 'rgba(255,0,85,0.35)' : 'rgba(0,255,149,0.35)'};">
                                <span>▶️</span>
                                <span>Iniciar Lección ${lsn.lesson_number || (idx + 1)}</span>
                            </button>
                        </div>
                        `;
                    }).join('')}
                </div>
                `;
            }

            // LEVEL RECOMMENDATION CARD
            let levelRecHtml = '';
            if (report.level_recommendation) {
                const rec = report.level_recommendation;
                const isUpgrade = rec.action === 'upgrade' && rec.target_level_index !== undefined && rec.target_level_index > currentLevelIdx;
                const isDowngrade = rec.action === 'downgrade' && rec.target_level_index !== undefined && rec.target_level_index < currentLevelIdx;
                
                const recBorder = isUpgrade ? 'var(--cyber-ok)' : isDowngrade ? 'var(--cyber-warn)' : 'var(--neon-cyan)';
                const recBg = isUpgrade ? 'rgba(0,255,149,0.1)' : isDowngrade ? 'rgba(255,180,0,0.1)' : 'rgba(0,243,255,0.08)';
                const recIcon = isUpgrade ? '🚀' : isDowngrade ? '🌱' : '🎯';
                const targetLbl = rec.target_level_name || levelLabels[rec.target_level_index] || currentLevelName;

                const actionBtnHtml = (isUpgrade || isDowngrade) ? `
                    <button type="button" onclick="game.applyRecommendedLevel(${rec.target_level_index})" class="tech" style="margin-top: 10px; width: 100%; padding: 10px 14px; border: 1.5px solid ${recBorder}; background: ${isUpgrade ? 'rgba(0,255,149,0.25)' : 'rgba(255,180,0,0.25)'}; color: #FFF; font-weight: 900; border-radius: 8px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 0 12px ${isUpgrade ? 'rgba(0,255,149,0.35)' : 'rgba(255,180,0,0.35)'};">
                        <span>${recIcon}</span>
                        <span>${isUpgrade ? 'Subir a' : 'Cambiar a'} Nivel ${targetLbl}</span>
                    </button>
                ` : '';

                levelRecHtml = `
                <div style="background: ${recBg}; border: 1.5px solid ${recBorder}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 0 12px rgba(0,0,0,0.4);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span class="tech" style="color: ${recBorder}; font-weight: 900; font-size: 0.82rem; letter-spacing: 0.5px;">🎓 LEVEL ADVISOR: ${rec.title || (isUpgrade ? 'LEVEL UP RECOMMENDED' : isDowngrade ? 'RECOMMENDED ADJUSTMENT' : 'CURRENT LEVEL IS IDEAL')}</span>
                        <span style="font-size: 1.2rem;">${recIcon}</span>
                    </div>
                    <div style="font-size: 0.86rem; color: #EEE; line-height: 1.4; margin-top: 4px;">
                        ${rec.reason || ''}
                    </div>
                    ${actionBtnHtml}
                </div>
                `;
            }

            // GRAMMAR & IRREGULAR VERBS CARD
            let grammarHtml = '';
            if (report.grammar_insights && Array.isArray(report.grammar_insights) && report.grammar_insights.length > 0) {
                grammarHtml = `
                <div style="background: rgba(0,0,0,0.45); border: 1.5px solid rgba(0,243,255,0.25); border-radius: 12px; padding: 12px 14px;">
                    <div class="tech" style="color: var(--neon-cyan); font-weight: 900; font-size: 0.82rem; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        <span>📐</span>
                        <span>GRAMMAR & IRREGULAR FORMS</span>
                    </div>
                    ${report.grammar_insights.map(g => {
                        const cleanEx = g.example ? g.example.replace(/'/g, "\\'") : '';
                        return `
                        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                            <div style="font-weight: bold; color: var(--cyber-ok); font-size: 0.88rem;">${g.topic || 'Grammar Rule'}</div>
                            <div style="font-size: 0.84rem; color: #DDD; line-height: 1.35; margin-top: 3px;">${g.explanation || ''}</div>
                            ${g.example ? `
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; background: rgba(0,243,255,0.05); padding: 5px 8px; border-radius: 6px; font-size: 0.8rem; color: var(--neon-cyan);">
                                    <span style="font-style: italic;">"${g.example}"</span>
                                    <button type="button" onclick="game.speakAdvice('${cleanEx}', 0.8)" style="background: transparent; border: none; color: var(--neon-cyan); cursor: pointer; font-size: 0.95rem; padding: 0 4px;" title="Listen Example">💬 🔊</button>
                                </div>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>
                `;
            }

            // PRONUNCIATION HACKS & TRICKS CARD
            let hacksHtml = '';
            if (report.pronunciation_hacks && Array.isArray(report.pronunciation_hacks) && report.pronunciation_hacks.length > 0) {
                hacksHtml = `
                <div style="background: rgba(0,243,255,0.05); border: 1.5px solid var(--neon-cyan); border-radius: 12px; padding: 12px 14px;">
                    <div class="tech" style="color: var(--neon-cyan); font-weight: 900; font-size: 0.82rem; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        <span>🎙️</span>
                        <span>PRONUNCIATION HACKS & TRICKS (TRUCOS DE PRONUNCIACIÓN)</span>
                    </div>
                    ${report.pronunciation_hacks.map(h => {
                        const cleanPhrase = h.practice_phrase ? h.practice_phrase.replace(/'/g, "\\'") : '';
                        return `
                        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                                <strong style="color: #FFF; font-size: 0.92rem;">${h.hack_title || 'Pronunciation Hack'}</strong>
                                ${h.target_sound ? `<span style="font-family: monospace; background: rgba(0,243,255,0.15); color: var(--neon-cyan); padding: 2px 6px; border-radius: 4px; font-size: 0.76rem; border: 1px solid rgba(0,243,255,0.3);">${h.target_sound}</span>` : ''}
                            </div>
                            <div style="font-size: 0.83rem; color: #DDD; line-height: 1.35; margin-top: 3px;">${h.secret_explanation || ''}</div>
                            ${h.practice_phrase ? `
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px; background: rgba(0,0,0,0.4); padding: 5px 8px; border-radius: 6px; font-size: 0.82rem; color: var(--cyber-ok); border: 1px solid rgba(0,255,149,0.2);">
                                    <span style="font-style: italic;">"${h.practice_phrase}"</span>
                                    <div style="display: flex; gap: 4px;">
                                        <button type="button" onclick="game.speakAdvice('${cleanPhrase}', 0.8)" class="secondary" style="padding: 2px 6px; font-size: 0.72rem; border-color: var(--cyber-ok); color: var(--cyber-ok); cursor: pointer;" title="Test Hack Normal">🔊 Test</button>
                                        <button type="button" onclick="game.speakAdvice('${cleanPhrase}', 0.45)" class="secondary" style="padding: 2px 6px; font-size: 0.72rem; border-color: var(--neon-pink); color: var(--neon-pink); cursor: pointer;" title="Test Hack Slow">🐢</button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>
                `;
            }

            // IDIOMS & COLLOQUIAL EXPRESSIONS CARD
            let idiomsHtml = '';
            if (report.idioms_and_expressions && Array.isArray(report.idioms_and_expressions) && report.idioms_and_expressions.length > 0) {
                idiomsHtml = `
                <div style="background: rgba(255,0,85,0.05); border: 1.5px solid rgba(255,0,85,0.25); border-radius: 12px; padding: 12px 14px;">
                    <div class="tech" style="color: var(--neon-pink); font-weight: 900; font-size: 0.82rem; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        <span>💬</span>
                        <span>IDIOMS & NATIVE SAYINGS (MODISMOS)</span>
                    </div>
                    ${report.idioms_and_expressions.map(item => {
                        const cleanEx = item.example ? item.example.replace(/'/g, "\\'") : '';
                        const cleanIdm = item.idiom ? item.idiom.replace(/'/g, "\\'") : '';
                        return `
                        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong style="color: #FFF; font-size: 0.92rem;">"${item.idiom}"</strong>
                                <button type="button" onclick="game.speakAdvice('${cleanIdm}', 0.8)" class="secondary" style="padding: 2px 6px; font-size: 0.72rem; border-color: var(--neon-pink); color: var(--neon-pink); cursor: pointer;">🔊</button>
                            </div>
                            <div style="font-size: 0.82rem; color: #BBB; margin-top: 2px;">${item.meaning || ''}</div>
                            ${item.example ? `
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; color: #DDD;">
                                    <span style="font-style: italic;">"${item.example}"</span>
                                    <button type="button" onclick="game.speakAdvice('${cleanEx}', 0.8)" style="background: transparent; border: none; color: var(--neon-pink); cursor: pointer; font-size: 0.95rem; padding: 0 4px;" title="Listen Example">💬 🔊</button>
                                </div>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>
                `;
            }

            // LANGUAGE CURIOSITIES & TRIVIA CARD
            let curiositiesHtml = '';
            if (report.language_curiosities && Array.isArray(report.language_curiosities) && report.language_curiosities.length > 0) {
                curiositiesHtml = `
                <div style="background: rgba(255,180,0,0.06); border: 1.5px solid rgba(255,180,0,0.3); border-radius: 12px; padding: 12px 14px;">
                    <div class="tech" style="color: var(--cyber-warn); font-weight: 900; font-size: 0.82rem; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        <span>🧐</span>
                        <span>LINGUISTIC CURIOSITY & TRIVIA</span>
                    </div>
                    ${report.language_curiosities.map(c => `
                        <div style="margin-bottom: 6px;">
                            <div style="font-weight: bold; color: #FFF; font-size: 0.88rem;">${c.fact_title || 'Did you know?'}</div>
                            <div style="font-size: 0.84rem; color: #CCC; line-height: 1.38; margin-top: 2px;">${c.fact_text || ''}</div>
                        </div>
                    `).join('')}
                </div>
                `;
            }

            let tipsHtml = '';
            if (report.study_tips && Array.isArray(report.study_tips)) {
                tipsHtml = report.study_tips.map(tip => `
                    <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: #EEE; line-height: 1.35; margin-bottom: 6px;">
                        <span style="color: var(--neon-cyan); font-size: 1rem; line-height: 1;">💡</span>
                        <span>${tip}</span>
                    </div>
                `).join('');
            }

            let clinicHtml = '';
            if (report.pronunciation_clinic && Array.isArray(report.pronunciation_clinic) && report.pronunciation_clinic.length > 0) {
                clinicHtml = report.pronunciation_clinic.map(item => {
                    const cleanWord = item.word ? item.word.replace(/'/g, "\\'") : '';
                    const cleanSent = item.example_sentence ? item.example_sentence.replace(/'/g, "\\'") : '';
                    return `
                    <div style="background: rgba(0,0,0,0.5); border: 1.5px solid rgba(0,243,255,0.25); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 6px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <strong style="color: var(--neon-cyan); font-size: 1.05rem;">${item.word}</strong>
                                ${item.ipa ? `<span style="font-family: monospace; color: var(--neon-pink); font-size: 0.8rem;">/${item.ipa.replace(/\//g, '')}/</span>` : ''}
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button type="button" onclick="game.speakAdvice('${cleanWord}', 0.8)" class="secondary" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; border-color: var(--neon-cyan); color: var(--neon-cyan); cursor: pointer;" title="Listen Normal Voice">🔊 Normal</button>
                                <button type="button" onclick="game.speakAdvice('${cleanWord}', 0.45)" class="secondary" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; border-color: var(--neon-pink); color: var(--neon-pink); cursor: pointer;" title="Listen Slow Voice">🐢 Slow</button>
                            </div>
                        </div>
                        ${item.phonetic_tip ? `<div style="font-size: 0.78rem; color: #BBB; line-height: 1.3; margin-top: 4px;"><span style="color:var(--cyber-warn); font-weight:bold;">Tongue & Lips:</span> ${item.phonetic_tip}</div>` : ''}
                        ${item.example_sentence ? `
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; padding-top: 5px; border-top: 1px dashed rgba(255,255,255,0.1); font-size: 0.8rem; color: #DDD;">
                                <span style="font-style: italic;">"${item.example_sentence}"</span>
                                <button type="button" onclick="game.speakAdvice('${cleanSent}', 0.8)" style="background: transparent; border: none; color: var(--neon-cyan); cursor: pointer; font-size: 0.95rem; padding: 2px 4px;" title="Listen Sentence">💬 🔊</button>
                            </div>
                        ` : ''}
                    </div>
                    `;
                }).join('');
            }

            bodyEl.innerHTML = `
                <!-- SCORE & EVALUATION -->
                <div style="background: rgba(0,243,255,0.06); border: 1.5px solid ${badgeColor}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 0 15px rgba(0,0,0,0.5);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span class="tech" style="color: ${badgeColor}; font-weight: 900; font-size: 0.92rem; letter-spacing: 0.5px;">⚡ ${performanceScore}% RDTO. · ${ratingText.toUpperCase()}</span>
                        <span style="font-size: 1.15rem;">${performanceScore >= 75 ? '😊' : performanceScore >= 45 ? '😐' : '😢'}</span>
                    </div>
                    <div style="font-weight: bold; color: #FFF; font-size: 1.05rem; margin-bottom: 6px;">${report.summary_title || 'Session Analysis'}</div>
                    <div style="font-size: 0.86rem; color: #CCC; line-height: 1.4;">${report.evaluation || ''}</div>
                    
                    <!-- TEACHER MOTIVATIONAL ENCOURAGEMENT (ÁNIMO) -->
                    ${report.encouragement ? `
                    <div style="margin-top: 10px; padding: 8px 12px; background: linear-gradient(135deg, rgba(0,255,149,0.15), rgba(0,243,255,0.1)); border-left: 3px solid var(--cyber-ok); border-radius: 6px;">
                        <div style="font-size: 0.74rem; color: var(--cyber-ok); font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">🌟 Teacher Encouragement</div>
                        <div style="font-size: 0.85rem; color: #FFF; font-weight: 600; font-style: italic; margin-top: 2px;">"${report.encouragement}"</div>
                    </div>
                    ` : ''}
                </div>

                <!-- ADAPTIVE LESSONS PATHWAY -->
                ${lessonsHtml}

                <!-- SYLLABUS PDF OFFER CARD -->
                <div style="background: linear-gradient(135deg, rgba(0,243,255,0.12), rgba(0,255,149,0.12)); border: 1.5px solid var(--neon-cyan); border-radius: 12px; padding: 14px 16px; box-shadow: 0 0 16px rgba(0,243,255,0.3); margin-top: 4px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.35rem;">📄</span>
                            <span class="tech" style="color: var(--neon-cyan); font-weight: 900; font-size: 0.86rem; letter-spacing: 0.5px;">PERSONALIZED STUDY SYLLABUS (TEMARIO PDF)</span>
                        </div>
                        <span style="font-size: 0.72rem; background: rgba(0,255,149,0.2); color: var(--cyber-ok); padding: 2px 8px; border-radius: 4px; font-weight: bold; border: 1px solid var(--cyber-ok);">DESCARGABLE</span>
                    </div>
                    <div style="font-size: 0.85rem; color: #EEE; line-height: 1.4; margin-bottom: 10px;">
                        ¿Quieres que te prepare un temario completo con explicaciones gramaticales, trucos de pronunciación nativos, modismos y ejercicios prácticos adaptados a tu nivel <strong>${currentLevelName}</strong>?
                    </div>
                    <button type="button" onclick="game.generateSyllabusPDF()" class="tech" style="width: 100%; padding: 10px 14px; background: linear-gradient(135deg, rgba(0,243,255,0.35), rgba(0,255,149,0.35)); border: 1.5px solid var(--neon-cyan); color: #FFF; font-weight: 900; border-radius: 8px; font-size: 0.86rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 0 14px rgba(0,243,255,0.45); transition: all 0.2s;">
                        <span>📥</span>
                        <span>Descargar Temario Personalizado en PDF</span>
                    </button>
                </div>

                <!-- LEVEL RECOMMENDATION ADVISOR -->
                ${levelRecHtml}

                <!-- GRAMMAR & IRREGULAR FORMS -->
                ${grammarHtml}

                <!-- PRONUNCIATION HACKS & TRICKS -->
                ${hacksHtml}

                <!-- IDIOMS & NATIVE SAYINGS -->
                ${idiomsHtml}

                <!-- LINGUISTIC CURIOSITY -->
                ${curiositiesHtml}

                <!-- STUDY & PRONUNCIATION TIPS -->
                ${tipsHtml ? `
                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(0,243,255,0.25); border-radius: 12px; padding: 12px 14px;">
                    <div class="tech" style="color: var(--neon-cyan); font-weight: 900; font-size: 0.82rem; letter-spacing: 0.5px; margin-bottom: 8px;">📚 STUDY & MASTERY TIPS</div>
                    ${tipsHtml}
                </div>
                ` : ''}

                <!-- PRONUNCIATION CLINIC & EXAMPLES -->
                ${clinicHtml ? `
                <div>
                    <div class="tech" style="color: var(--cyber-warn); font-weight: 900; font-size: 0.82rem; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        <span>🎯</span>
                        <span>PRONUNCIATION CLINIC & EXAMPLES</span>
                    </div>
                    ${clinicHtml}
                </div>
                ` : ''}
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
                const margin = 14;
                const contentWidth = pageWidth - (margin * 2);
                let y = 16;

                const checkPageBreak = (neededHeight) => {
                    if (y + neededHeight > pageHeight - 16) {
                        doc.addPage();
                        y = 16;
                        doc.setFillColor(15, 23, 42);
                        doc.rect(margin, y, contentWidth, 8, 'F');
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8);
                        doc.setTextColor(0, 243, 255);
                        doc.text(`JETBULARY · ${langInfo.name.toUpperCase()} SYLLABUS · LEVEL ${currentLevelName}`, margin + 3, y + 5.5);
                        y += 12;
                    }
                };

                // --- HEADER BANNER ---
                doc.setFillColor(10, 14, 26);
                doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.setTextColor(0, 243, 255);
                doc.text("JETBULARY · ACADEMIA DE IDIOMAS IA", margin + 6, y + 8);

                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                doc.text(`PERSONALIZED STUDY SYLLABUS · ${langInfo.name.toUpperCase()} (LEVEL ${currentLevelName})`, margin + 6, y + 15);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(180, 200, 220);
                const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                doc.text(`Profesor/a: ${langInfo.teacherName}  |  Rendimiento Sesión: ${performanceScore}%  |  Fecha: ${dateStr}`, margin + 6, y + 21);

                y += 32;

                // --- TEACHER ENCOURAGEMENT & EVALUATION ---
                doc.setFillColor(240, 253, 250);
                doc.setDrawColor(0, 243, 255);
                doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(13, 148, 136);
                doc.text(`MENSAJE DE ${langInfo.teacherName.toUpperCase()} & EVALUACIÓN`, margin + 4, y + 5.5);

                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8.5);
                doc.setTextColor(30, 41, 59);
                const encText = report && report.encouragement ? `"${report.encouragement}"` : `"Keep practicing every day with confidence and consistency!"`;
                const splitEnc = doc.splitTextToSize(encText, contentWidth - 8);
                doc.text(splitEnc, margin + 4, y + 10.5);

                if (report && report.evaluation) {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(71, 85, 105);
                    const splitEval = doc.splitTextToSize(report.evaluation, contentWidth - 8);
                    doc.text(splitEval, margin + 4, y + 15.5);
                }

                y += 24;

                // --- SECTION 1: ADAPTIVE LESSONS PATHWAY (PLAN PARA SUPERAR EL NIVEL) ---
                if (report && report.adaptive_lessons && report.adaptive_lessons.length > 0) {
                    checkPageBreak(35);
                    doc.setFillColor(30, 41, 59);
                    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9.5);
                    doc.setTextColor(255, 255, 255);
                    doc.text("1. PLAN DE LECCIONES ADAPTATIVAS PARA SUPERAR EL NIVEL", margin + 4, y + 5);
                    y += 10;

                    report.adaptive_lessons.forEach((lsn, idx) => {
                        checkPageBreak(22);
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8.8);
                        doc.setTextColor(13, 148, 136);
                        doc.text(`[ ] Lección ${lsn.lesson_number || (idx + 1)}: ${lsn.lesson_title}`, margin + 2, y);
                        y += 4.5;

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        doc.setTextColor(51, 65, 85);
                        doc.text(`    Objetivo: ${lsn.objective || ''}`, margin + 2, y);
                        y += 4.5;

                        if (lsn.target_words && Array.isArray(lsn.target_words)) {
                            const wordsSummary = lsn.target_words.map(w => `${w.word} (${w.spanish})`).join(' · ');
                            doc.setFont('helvetica', 'italic');
                            doc.setFontSize(7.8);
                            doc.setTextColor(3, 105, 161);
                            const splitWords = doc.splitTextToSize(`    Palabras y práctica: ${wordsSummary}`, contentWidth - 8);
                            doc.text(splitWords, margin + 2, y);
                            y += (splitWords.length * 3.8);
                        }
                        y += 2;
                    });
                }

                // --- SECTION 2: GRAMMAR & STRUCTURAL INSIGHTS ---
                checkPageBreak(30);
                doc.setFillColor(30, 41, 59);
                doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9.5);
                doc.setTextColor(255, 255, 255);
                doc.text("2. TEMARIO GRAMATICAL Y ESTRUCTURAS CLAVE", margin + 4, y + 5);
                y += 10;

                if (report && report.grammar_insights && report.grammar_insights.length > 0) {
                    report.grammar_insights.forEach((g) => {
                        checkPageBreak(18);
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8.5);
                        doc.setTextColor(15, 118, 110);
                        doc.text(`• ${g.topic || 'Punto Gramatical'}:`, margin + 2, y);
                        y += 4.5;

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        doc.setTextColor(51, 65, 85);
                        const splitExp = doc.splitTextToSize(g.explanation || '', contentWidth - 6);
                        doc.text(splitExp, margin + 4, y);
                        y += (splitExp.length * 3.8);

                        if (g.example) {
                            doc.setFont('helvetica', 'italic');
                            doc.setTextColor(3, 105, 161);
                            doc.text(`  Ejemplo: "${g.example}"`, margin + 4, y);
                            y += 5;
                        }
                        y += 2;
                    });
                }

                // --- SECTION 3: NATIVE PRONUNCIATION HACKS ---
                checkPageBreak(30);
                doc.setFillColor(30, 41, 59);
                doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9.5);
                doc.setTextColor(255, 255, 255);
                doc.text("3. TRUCOS Y SECRETOS DE PRONUNCIACIÓN NATIVA", margin + 4, y + 5);
                y += 10;

                if (report && report.pronunciation_hacks && report.pronunciation_hacks.length > 0) {
                    report.pronunciation_hacks.forEach((h) => {
                        checkPageBreak(18);
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8.5);
                        doc.setTextColor(190, 24, 93);
                        doc.text(`• ${h.hack_title || 'Truco Fonético'} ${h.target_sound ? `[${h.target_sound}]` : ''}:`, margin + 2, y);
                        y += 4.5;

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        doc.setTextColor(51, 65, 85);
                        const splitSec = doc.splitTextToSize(h.secret_explanation || '', contentWidth - 6);
                        doc.text(splitSec, margin + 4, y);
                        y += (splitSec.length * 3.8);

                        if (h.practice_phrase) {
                            doc.setFont('helvetica', 'italic');
                            doc.setTextColor(13, 148, 136);
                            doc.text(`  Frase de Práctica: "${h.practice_phrase}"`, margin + 4, y);
                            y += 5;
                        }
                        y += 2;
                    });
                }

                // --- SECTION 4: IDIOMS & COLLOQUIAL EXPRESSIONS ---
                checkPageBreak(30);
                doc.setFillColor(30, 41, 59);
                doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9.5);
                doc.setTextColor(255, 255, 255);
                doc.text("4. MODISMOS Y EXPRESIONES NATIVAS (IDIOMS)", margin + 4, y + 5);
                y += 10;

                if (report && report.idioms_and_expressions && report.idioms_and_expressions.length > 0) {
                    report.idioms_and_expressions.forEach((item) => {
                        checkPageBreak(16);
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8.5);
                        doc.setTextColor(180, 83, 9);
                        doc.text(`• "${item.idiom}"`, margin + 2, y);
                        y += 4.5;

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        doc.setTextColor(51, 65, 85);
                        doc.text(`  Significado: ${item.meaning || ''}`, margin + 4, y);
                        y += 4;

                        if (item.example) {
                            doc.setFont('helvetica', 'italic');
                            doc.setTextColor(30, 64, 175);
                            doc.text(`  Ejemplo: "${item.example}"`, margin + 4, y);
                            y += 5;
                        }
                        y += 2;
                    });
                }

                // --- SECTION 5: VOCABULARY BANK & DRILLS ---
                checkPageBreak(35);
                doc.setFillColor(30, 41, 59);
                doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9.5);
                doc.setTextColor(255, 255, 255);
                doc.text("5. VOCABULARIO CLAVE Y CLÍNICA DE PRÁCTICA", margin + 4, y + 5);
                y += 10;

                const wordsList = report && report.pronunciation_clinic && report.pronunciation_clinic.length > 0
                    ? report.pronunciation_clinic
                    : (game.data && game.data.length > 0 ? game.data.slice(0, 5) : []);

                wordsList.forEach((w) => {
                    checkPageBreak(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(15, 23, 42);
                    const wordTitle = w.word || w.english || '';
                    const ipaTitle = w.ipa ? ` /${w.ipa.replace(/\//g, '')}/` : '';
                    doc.text(`• ${wordTitle}${ipaTitle}`, margin + 2, y);
                    y += 4;

                    if (w.phonetic_tip) {
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(7.8);
                        doc.setTextColor(100, 116, 139);
                        doc.text(`  Articulación: ${w.phonetic_tip}`, margin + 4, y);
                        y += 4;
                    }
                    if (w.example_sentence) {
                        doc.setFont('helvetica', 'italic');
                        doc.setFontSize(7.8);
                        doc.setTextColor(51, 65, 85);
                        doc.text(`  Contexto: "${w.example_sentence}"`, margin + 4, y);
                        y += 4.5;
                    }
                    y += 1.5;
                });

                // --- SECTION 6: CURIOSITY & STUDY TIPS ---
                if (report && report.language_curiosities && report.language_curiosities.length > 0) {
                    checkPageBreak(25);
                    doc.setFillColor(30, 41, 59);
                    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9.5);
                    doc.setTextColor(255, 255, 255);
                    doc.text("6. CURIOSIDADES LINGÜÍSTICAS Y CONSEJOS DE ESTUDIO", margin + 4, y + 5);
                    y += 10;

                    report.language_curiosities.forEach(c => {
                        checkPageBreak(12);
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8.5);
                        doc.setTextColor(15, 118, 110);
                        doc.text(`• ${c.fact_title || 'Curiosidad'}:`, margin + 2, y);
                        y += 4;

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        doc.setTextColor(51, 65, 85);
                        const splitCur = doc.splitTextToSize(c.fact_text || '', contentWidth - 6);
                        doc.text(splitCur, margin + 4, y);
                        y += (splitCur.length * 3.8) + 2;
                    });
                }

                // --- FOOTER ON ALL PAGES ---
                const totalPages = doc.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(148, 163, 184);
                    doc.text(`Jetbulary · www.jetbulary.com · Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
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

        speakReportSpokenSummary: () => {
            if (!game.lastReportData) return;
            const textToSpeak = game.lastReportData.spoken_summary || game.lastReportData.evaluation;
            if (textToSpeak) {
                game.speakAdvice(textToSpeak, 0.85);
            }
        },

        closePerformanceReport: () => {
            window.speechSynthesis.cancel();
            document.querySelectorAll('.avatar-container').forEach(el => el.classList.remove('talking'));
            document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.staticSrc) img.src = img.dataset.staticSrc; else if (img.dataset.idleSrc) img.src = img.dataset.idleSrc; });
            const modal = document.getElementById('modal-performance-report');
            if (modal) modal.classList.add('hidden');
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
            window.speechSynthesis.cancel();
            game.lastText = text;
            const u = new SpeechSynthesisUtterance(text);
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;

            // Rate from slider or override
            const sliderRate = parseFloat(document.getElementById('speech-speed-slider')?.value || 0.7);
            u.rate = rateOverride !== undefined ? rateOverride : sliderRate;
            u.lang = langInfo.speechLang;

            const applyVoiceAndSpeak = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices && voices.length > 0) {
                    let f = voices.find(v => v.lang.startsWith(langInfo.code) && langInfo.femaleVoices.some(name => v.name.toLowerCase().includes(name)));
                    if (!f) f = voices.find(v => v.lang.startsWith(langInfo.code) || v.lang.replace('_', '-').startsWith(langInfo.code));
                    if (f) u.voice = f;
                }

                u.onstart = () => {
                    document.querySelectorAll('.avatar-container').forEach(el => el.classList.add('talking'));
                    document.querySelectorAll('.avatar-img').forEach(img => { if (img.dataset.gifSrc) img.src = img.dataset.gifSrc; });
                };

                u.onend = () => {
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

                u.onerror = (e) => {
                    console.warn("Speech error:", e);
                    document.querySelectorAll('.avatar-container').forEach(el => el.classList.remove('talking'));
                };

                window.speechSynthesis.speak(u);
            };

            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.onvoiceschanged = () => {
                    window.speechSynthesis.onvoiceschanged = null;
                    applyVoiceAndSpeak();
                };
                setTimeout(applyVoiceAndSpeak, 100);
            } else {
                applyVoiceAndSpeak();
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
            const pointsEarned = isRecovery ? 1 : 2;
            app.addLevelPoints(db.academy_level, pointsEarned);
            game.updatePerformance(isRecovery ? 4 : 8);

            const fb = document.getElementById('feedback-msg');
            fb.innerHTML = `Correct! 🎉 <span style="color:var(--cyber-ok); font-size:0.9rem;">(+${pointsEarned} pts)</span>`;
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
            game.currentRetries++;
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
                        retries: game.currentRetries,
                        spoken: clean
                    });
                } else {
                    existing.retries = Math.max(existing.retries, game.currentRetries);
                    existing.spoken = clean;
                }
            }

            const fb = document.getElementById('feedback-msg');
            const failOptions = document.getElementById('fail-options');

            if (game.currentRetries >= 3) {
                // Penalización tras 3 fallos
                app.addLevelPoints(db.academy_level, -1);
                game.updatePerformance(-10);
                fb.innerHTML = `❌ 3 fallos. <span style="color:var(--cyber-danger); font-weight:bold;">(-1 pt penalización)</span>. Escucha atentamente:`;
                fb.className = "feedback incorrect";
                
                // La profesora pronuncia muy lento para enseñar
                setTimeout(() => game.speakWordSlow(), 500);

                if (failOptions) {
                    failOptions.innerHTML = `
                        <button onclick="game.retryRecovery()" class="warning" style="width:100%; padding:14px; font-weight:bold;">🔄 Repetir (recuperar punto perdido)</button>
                    `;
                    failOptions.classList.remove('hidden');
                }

                // Avance automático tras 5 segundos si el alumno decide no repetir
                setTimeout(() => {
                    if (game.currentRetries >= 3 && !document.getElementById('view-game').classList.contains('hidden') && !stt.isRecording) {
                        game.next();
                    }
                }, 5000);

            } else {
                // Fallo 1 o 2
                game.updatePerformance(-5);
                fb.innerText = `Intento ${game.currentRetries}/3. Vuelve a intentarlo.`;
                fb.className = "feedback incorrect";
                if (failOptions) {
                    failOptions.innerHTML = `
                        <button onclick="game.retry()" class="warning">🔄 Try Again</button>
                        <button onclick="game.speakWordSlow()" class="secondary">🐢 Slow Voice</button>
                        <button onclick="game.next()" class="secondary">⏭️ Skip</button>
                    `;
                    failOptions.classList.remove('hidden');
                }

                if (game.currentRetries === 1 && clean.length > 0) game.getSpecificAdvice(target, clean);
                if (game.autoMic) {
                    setTimeout(() => {
                        if (!document.getElementById('mic-btn').classList.contains('listening') && !document.getElementById('view-game').classList.contains('hidden') && game.currentRetries < 3) {
                            game.retry();
                        }
                    }, 3000);
                }
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
            container.innerHTML = "🤔 Analyzing your pronunciation..."; container.classList.remove('hidden');
            const prompt = `I'm a ${langInfo.aiPromptLang} student. I tried to say "${targetWord}" in ${langInfo.name} but I said "${spokenWord}". Give me a very brief, practical tip (1-2 sentences) to correct my pronunciation. Be direct and friendly. Answer in ${langInfo.name}.`;
            await app.callAI_Text(prompt, null, (text) => { container.innerHTML = `<strong>💡 Tip:</strong> ${text}`; });
        },

        retry: () => {
            document.getElementById('fail-options').classList.add('hidden');
            document.getElementById('feedback-msg').innerText = "";
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
