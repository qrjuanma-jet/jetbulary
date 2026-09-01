// ====== SESSION MANAGER (4 WORDS AT A TIME) ======
    const session = {
        wordsPerSession: 4,
        currentWords: [],
        currentWordIndex: 0,
        cycleCount: 0,
        phase: 'vocab',
        selectedListId: null,
        lessonCompleted: false,
        lastLessonData: null,

        updatePulsingState: () => {
            const lessonBtn = document.getElementById('btn-lesson-main');
            const gameReportBtn = document.getElementById('btn-report-game');
            const convoReportBtn = document.getElementById('btn-report-convo');

            if (session.lessonCompleted) {
                // FASE 2: Lección completada -> Deja de parpadear LESSON y parpadea el botón ?
                if (lessonBtn) lessonBtn.classList.remove('btn-lesson-pulse');
                if (gameReportBtn) gameReportBtn.classList.add('pulsing');
                if (convoReportBtn) convoReportBtn.classList.add('pulsing');
            } else {
                // FASE 1: Antes de completar la lección -> Parpadea el botón LESSON
                if (lessonBtn) lessonBtn.classList.add('btn-lesson-pulse');
                if (gameReportBtn) gameReportBtn.classList.remove('pulsing');
                if (convoReportBtn) convoReportBtn.classList.remove('pulsing');
            }
        },

        selectList: (id) => {
            session.selectedListId = id === '' ? null : id;
            localStorage.setItem('jetbulary_selected_list', id);
        },

        getNextSessionWords: () => {
            const listId = session.selectedListId;
            if (!listId) return [];
            const words = db.words.filter(w => w.topic_id == listId);
            if (words.length === 0) return [];

            const progressKey = `jetbulary_session_${listId}`;
            const saved = JSON.parse(localStorage.getItem(progressKey) || '{"lastIndex":0}');
            let startIdx = saved.lastIndex || 0;
            if (startIdx >= words.length) startIdx = 0; // Loop back

            const sessionWords = words.slice(startIdx, startIdx + session.wordsPerSession);
            const nextIdx = startIdx + sessionWords.length;
            localStorage.setItem(progressKey, JSON.stringify({ lastIndex: nextIdx, completedAt: new Date().toISOString() }));
            return sessionWords;
        },

        start: () => {
            if (!session.selectedListId) {
                const firstTopic = db.topics.find(t => (t.lang || 'en') === currentLang);
                if (firstTopic) session.selectList(firstTopic.id);
                else return alert('Please select or generate a list first.');
            }

            const words = session.getNextSessionWords();
            if (words.length === 0) {
                return alert('No words available in this list. Generate a new list first.');
            }

            session.currentWords = words;
            session.currentWordIndex = 0;
            session.phase = 'vocab';
            session.lessonCompleted = false;
            session.lastLessonData = null;

            game.data = words;
            game.index = 0;
            game.isSessionMode = true;
            game.sessionCycle = 0;
            app.switchView('view-game');
            game.setAutoMic(true);
            game.updateAvatar();
            if (game.updatePerformance) game.updatePerformance(0);
            app.updateLessonButtonsVisibility();
            session.updatePulsingState();
            session.renderWordsOverview();
            game.loadCard();
        },

        startLesson: () => {
            if (!session.currentWords || session.currentWords.length === 0) {
                session.start();
                return;
            }
            session.markCurrentWordsAsLearned();
            session.phase = 'lesson';
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            conversation.start(session.currentWords, `${langInfo.lessonBtnLabel || 'LESSON'} · ${langInfo.name}`, 'standard');
        },

        startGrammarLesson: () => {
            if (!session.currentWords || session.currentWords.length === 0) {
                session.start();
                return;
            }
            session.markCurrentWordsAsLearned();
            session.phase = 'lesson';
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            conversation.start(session.currentWords, `${langInfo.grammarBtnLabel || 'GRAMMAR'} · ${langInfo.name}`, 'grammar');
        },

        startPronunciationLesson: () => {
            if (!session.currentWords || session.currentWords.length === 0) {
                session.start();
                return;
            }
            session.markCurrentWordsAsLearned();
            session.phase = 'lesson';
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            conversation.start(session.currentWords, `${langInfo.pronunciationBtnLabel || 'PRONUNCIATION'} · ${langInfo.name}`, 'pronunciation');
        },

        renderWordsOverview: () => {
            const container = document.getElementById('session-words-overview');
            if (!container || !session.currentWords) return;
            container.innerHTML = session.currentWords.map((w, i) => {
                const cleanWord = w.english.includes('(') ? w.english.split('(')[0].trim() : w.english;
                return `
                <div class="session-word-card ${i === game.index ? 'active' : ''}" id="session-card-${i}" onclick="session.selectWordCard(${i})" style="cursor: pointer;">
                    <div class="word-en">${cleanWord}</div>
                    ${w.ipa ? `<div class="tech word-ipa">/${w.ipa.replace(/\//g, '')}/</div>` : ''}
                    <div class="word-es">${w.spanish}</div>
                </div>
                `;
            }).join('');
        },

        selectWordCard: (idx) => {
            if (idx < 0 || !game.data || idx >= game.data.length) return;
            game.stopMic();
            window.speechSynthesis.cancel();
            game.index = idx;
            document.querySelectorAll('.session-word-card').forEach((card, i) => {
                if (i === idx) { card.classList.add('active'); card.classList.remove('done'); }
                else { card.classList.remove('active'); }
            });
            game.loadCard();
        },

        markCurrentWordsAsLearned: () => {
            if (!session.currentWords || session.currentWords.length === 0) return;
            session.currentWords.forEach(w => {
                let prog = db.progress.find(p => p.word_id === w.id);
                if (!prog) {
                    prog = { word_id: w.id, attempts: 1, successes: 1 };
                    db.progress.push(prog);
                } else if (prog.attempts === 0) {
                    prog.attempts = 1;
                    prog.successes = 1;
                }
            });
            app.saveDB();
        },

        onWordComplete: () => {
            const card = document.getElementById(`session-card-${game.index}`);
            if (card) { card.classList.remove('active'); card.classList.add('done'); }

            if (game.data && game.data[game.index]) {
                const wId = game.data[game.index].id;
                let prog = db.progress.find(p => p.word_id === wId);
                if (!prog) { prog = { word_id: wId, attempts: 1, successes: 1 }; db.progress.push(prog); }
                app.saveDB();
            }

            if (game.index + 1 < game.data.length) {
                game.index++;
                const nextCard = document.getElementById(`session-card-${game.index}`);
                if (nextCard) nextCard.classList.add('active');
                game.loadCard();
            } else {
                session.markCurrentWordsAsLearned();
                const fb = document.getElementById('feedback-msg');
                if (fb) {
                    fb.innerHTML = `🎉 <strong>¡4 palabras completadas!</strong> Pulsa <strong>LESSON</strong> para practicar la frase con la profesora.`;
                    fb.className = "feedback correct";
                }
            }
        }
    };
