// ====== APP OBJECT ======
    const app = {
        toggleLevelPicker: () => {
            const body = document.getElementById('level-picker-body');
            const chevron = document.getElementById('level-chevron');
            if (!body) return;
            const isHidden = body.classList.contains('hidden');
            if (isHidden) {
                body.classList.remove('hidden');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            } else {
                body.classList.add('hidden');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
        },

        openApiKeyInfoModal: () => {
            const modal = document.getElementById('modal-apikey-info');
            if (modal) modal.classList.remove('hidden');
            history.pushState({ modal: 'apikey-info' }, null, '#apikey-info');
        },

        closeApiKeyInfoModal: (skipHistoryBack = false) => {
            const modal = document.getElementById('modal-apikey-info');
            if (modal) modal.classList.add('hidden');
            if (!skipHistoryBack && history.state && history.state.modal === 'apikey-info') {
                history.back();
            }
        },

        openTeacherModal: () => {
            const modal = document.getElementById('modal-teacher-select');
            if (!modal) return;
            modal.classList.remove('hidden');
            document.querySelectorAll('.lang-check').forEach(el => el.style.display = 'none');
            const activeCheck = document.getElementById(`check-${currentLang}`);
            if (activeCheck) activeCheck.style.display = 'inline';
            history.pushState({ modal: 'teacher' }, null, '#teacher');
        },

        closeTeacherModal: (skipHistoryBack = false) => {
            const modal = document.getElementById('modal-teacher-select');
            if (modal) modal.classList.add('hidden');
            if (!skipHistoryBack && history.state && history.state.modal === 'teacher') {
                history.back();
            }
        },

        setLanguage: (langCode) => {
            if (!LANGUAGES[langCode]) return;
            currentLang = langCode;
            localStorage.setItem('jetbulary_current_lang', langCode);
            app.closeTeacherModal();

            // Refresh UI, Avatars and Translator Buttons
            game.updateAvatar();
            app.updateHeaderTranslatorBtn();
            if (typeof translator !== 'undefined' && translator.init) translator.init();
            
            // Auto select next pending topic in this language
            app.autoSelectNextPendingTopic();
            app.renderDashboardLists();
            if (!document.getElementById('view-vocab').classList.contains('hidden')) {
                vocab.activeTopicId = 'all';
                vocab.selectedIds.clear();
                vocab.render();
            }
        },

        getNextPendingTopic: (lang = currentLang) => {
            const topicsInLang = db.topics.filter(t => (t.lang || 'en') === lang);
            if (topicsInLang.length === 0) return null;

            // Sort by level ascending, then by ID
            topicsInLang.sort((a, b) => {
                const la = a.level !== undefined ? a.level : 0;
                const lb = b.level !== undefined ? b.level : 0;
                if (la !== lb) return la - lb;
                return a.id - b.id;
            });

            // Find first topic where not all words have at least 1 success
            for (const topic of topicsInLang) {
                const words = db.words.filter(w => w.topic_id === topic.id);
                if (words.length === 0) return topic;
                const isComplete = words.every(w => {
                    const prog = db.progress.find(p => p.word_id === w.id);
                    return prog && prog.successes >= 1;
                });
                if (!isComplete) {
                    return topic;
                }
            }

            return topicsInLang[0];
        },

        autoSelectNextPendingTopic: () => {
            const pendingTopic = app.getNextPendingTopic(currentLang);
            if (pendingTopic) {
                session.selectList(pendingTopic.id);
                const tLevel = pendingTopic.level !== undefined ? pendingTopic.level : 0;
                if (app.isLevelUnlocked(tLevel) && (db.academy_level || 0) < tLevel) {
                    db.academy_level = tLevel;
                    app.saveDB();
                    app.updateAcademyLevelDisplay(tLevel);
                }
            }
        },

        getLevelLabels: () => ['A0 (Starter)', 'A1-A2 (Basic)', 'B1 (Intermediate)', 'B2 (Advanced)', 'C1+ (Native/Pro)'],

        isLevelUnlocked: (levelNum) => {
            return true; // Todos los niveles siempre desbloqueados por decisión del usuario
        },

        addLevelPoints: (levelNum, delta) => {
            // Sistema de puntos desactivado
        },

        selectLevelDirectly: (lvl) => {
            const slider = document.getElementById('academy-level-slider');
            if (slider) slider.value = lvl;
            app.saveAcademyLevel(lvl);
        },

        saveAcademyLevel: (val) => {
            const targetLvl = parseInt(val);
            db.academy_level = targetLvl;
            app.saveDB();
            app.updateAcademyLevelDisplay(targetLvl);
            app.renderDashboardLists();
            app.updateLessonButtonsVisibility();
        },

        updateAcademyLevelDisplay: (val) => {
            const display = document.getElementById('academy-level-display');
            if (display) {
                const labels = app.getLevelLabels();
                display.innerHTML = `<span style="color:var(--neon-cyan); font-weight:900;">${labels[parseInt(val)] || labels[0]}</span>`;
            }
            app.renderLevelBadges();
            app.updateLessonButtonsVisibility();
        },

        renderLevelBadges: () => {
            const container = document.getElementById('level-badges-container');
            if (!container) return;
            const labels = ['A0', 'A1-A2', 'B1', 'B2', 'C1+'];
            container.innerHTML = labels.map((lbl, idx) => {
                const isCurrent = (db.academy_level || 0) === idx;
                const border = isCurrent ? 'var(--neon-cyan)' : 'rgba(0,255,149,0.35)';
                const bg = isCurrent ? 'rgba(0,243,255,0.22)' : 'rgba(0,255,149,0.06)';
                return `
                    <div onclick="app.selectLevelDirectly(${idx})" style="flex: 1; min-width: 54px; padding: 9px 4px; text-align: center; border: 1.5px solid ${border}; background: ${bg}; border-radius: 6px; font-size: 0.76rem; cursor: pointer; transition: all 0.2s; box-shadow: ${isCurrent ? '0 0 10px rgba(0,243,255,0.3)' : 'none'};" title="Elegir nivel ${lbl}">
                        <div style="font-weight: 900; color: ${isCurrent ? 'var(--neon-cyan)' : '#FFF'};">${lbl}</div>
                    </div>
                `;
            }).join('');
        },

        updateHeaderTranslatorBtn: () => {
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const label = langInfo.translatorBtnLabel || 'TRANSLATOR';
            document.querySelectorAll('.lbl-translator-btn').forEach(el => {
                el.innerText = label;
            });
        },

        updateLessonButtonsVisibility: () => {
            const freeConvoBtn = document.getElementById('btn-free-conversation');
            if (freeConvoBtn) {
                freeConvoBtn.classList.remove('hidden'); // Siempre disponible para todos los niveles
            }
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const lessonLbl = document.getElementById('lbl-lesson-btn');
            if (lessonLbl) {
                lessonLbl.innerText = langInfo.lessonBtnLabel || 'LESSON';
            }
            const grammarPlusLbl = document.getElementById('lbl-grammar-plus-btn');
            if (grammarPlusLbl) {
                grammarPlusLbl.innerText = langInfo.grammarPlusBtnLabel || (langInfo.grammarBtnLabel ? `${langInfo.grammarBtnLabel}+` : 'GRAMMAR+');
            }
        },

        saveDB: () => {
            localStorage.setItem(DB_KEY, JSON.stringify(db));
            if (typeof idbBackup !== 'undefined' && idbBackup.syncAll) {
                idbBackup.syncAll();
            }
        },
        loadDB: () => { const data = localStorage.getItem(DB_KEY); if(data) db = JSON.parse(data); },

        ensureDefaultTopics: () => {
            let modified = false;
            ['en', 'de', 'fr'].forEach(langKey => {
                const list = defaultTopicsByLang[langKey] || [];
                list.forEach((def, defIdx) => {
                    let topic = db.topics.find(t => t.name.toUpperCase() === def.name.toUpperCase() && (t.lang || 'en') === langKey);
                    if (!topic) {
                        const offset = langKey === 'en' ? 0 : langKey === 'de' ? 1000 : 2000;
                        topic = { id: 999000 + offset + defIdx, name: def.name, lang: langKey, level: def.level !== undefined ? def.level : 0 };
                        db.topics.push(topic);
                        modified = true;
                    } else if (topic.level === undefined && def.level !== undefined) {
                        topic.level = def.level;
                        modified = true;
                    }
                    def.words.forEach((w, wIdx) => {
                        const targetWord = (w.english || '').toLowerCase();
                        const exists = db.words.some(word => word.topic_id === topic.id && (word.english || '').toLowerCase() === targetWord);
                        if (!exists) {
                            db.words.push({ ...w, id: 9990000 + (topic.id * 10) + wIdx, topic_id: topic.id });
                            modified = true;
                        }
                    });
                });
            });
            if (modified) app.saveDB();
        },

        openBackupModal: () => {
            const modal = document.getElementById('modal-backup-manager');
            if (modal) modal.classList.remove('hidden');
            history.pushState({ modal: 'backup' }, null, '#backup');
        },

        closeBackupModal: (skipHistoryBack = false) => {
            const modal = document.getElementById('modal-backup-manager');
            if (modal) modal.classList.add('hidden');
            if (!skipHistoryBack && history.state && history.state.modal === 'backup') {
                history.back();
            }
        },

        exportBackup: () => {
            const backup = {
                app: 'Jetbulary',
                version: '3.2',
                timestamp: new Date().toISOString(),
                db: db,
                currentLang: currentLang,
                apiKey: localStorage.getItem(API_KEY_STORAGE) || ''
            };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `jetbulary_progreso_backup_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        importBackupFile: (file) => {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data && data.db) {
                        db = data.db;
                        app.saveDB();
                        if (data.apiKey) localStorage.setItem(API_KEY_STORAGE, data.apiKey);
                        if (data.currentLang) currentLang = data.currentLang;
                        alert("✅ ¡Copia de seguridad restaurada con éxito!");
                        location.reload();
                    } else {
                        alert("❌ Archivo de copia de seguridad no válido.");
                    }
                } catch(err) {
                    alert("❌ Error al leer el archivo de copia de seguridad: " + err.message);
                }
            };
            reader.readAsText(file);
        },

        openShareModal: () => {
            const modal = document.getElementById('modal-share');
            if (modal) modal.classList.remove('hidden');
            history.pushState({ modal: 'share' }, null, '#share');
        },
        closeShareModal: (skipHistoryBack = false) => {
            const modal = document.getElementById('modal-share');
            if (modal) modal.classList.add('hidden');
            const qrBox = document.getElementById('qr-display-box');
            if (qrBox) qrBox.classList.add('hidden');
            if (!skipHistoryBack && history.state && history.state.modal === 'share') {
                history.back();
            }
        },
        openVoiceSettingsModal: () => {
            app.closeShareModal(true);
            const modal = document.getElementById('modal-voice-settings');
            if (modal) modal.classList.remove('hidden');
            history.pushState({ modal: 'voice-settings' }, null, '#voice-settings');
        },
        closeVoiceSettingsModal: (skipHistoryBack = false) => {
            const modal = document.getElementById('modal-voice-settings');
            if (modal) modal.classList.add('hidden');
            if (!skipHistoryBack && history.state && history.state.modal === 'voice-settings') {
                history.back();
            }
        },
        openAndroidVoiceSettings: () => {
            try {
                window.location.href = "intent:#Intent;action=com.android.settings.TTS_SETTINGS;end";
            } catch(e) {
                try {
                    window.location.href = "intent:#Intent;action=android.settings.VOICE_INPUT_SETTINGS;end";
                } catch(err) {
                    window.open("https://play.google.com/store/apps/details?id=com.google.android.tts", "_blank");
                }
            }
        },
        shareApp: () => {
            app.openShareModal();
        },
        toggleQrCode: () => {
            const qrBox = document.getElementById('qr-display-box');
            if (qrBox) qrBox.classList.toggle('hidden');
        },

        init: async () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration error:', err));
            }
            if (navigator.storage && navigator.storage.persist) {
                try { navigator.storage.persist(); } catch(e) {}
            }
            try { const data = localStorage.getItem(DB_KEY); if (data) db = JSON.parse(data); } catch(e) {}
            if (!db.topics) db.topics = [];
            if (!db.words) db.words = [];
            if (!db.progress) db.progress = [];
            if (!db.level_points) db.level_points = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
            if (db.academy_level === undefined) db.academy_level = 0;

            if (typeof idbBackup !== 'undefined' && idbBackup.restoreIfMissing) {
                await idbBackup.restoreIfMissing();
            }

            app.ensureDefaultTopics();
            if (typeof idbBackup !== 'undefined' && idbBackup.syncAll) {
                idbBackup.syncAll();
            }

            // Restore speed
            const savedSpeed = localStorage.getItem('jetbulary_speech_speed');
            if (savedSpeed) {
                const slider = document.getElementById('speech-speed-slider');
                const label = document.getElementById('speed-value-label');
                if (slider) slider.value = savedSpeed;
                if (label) label.textContent = parseFloat(savedSpeed).toFixed(2) + 'x';
            }

            setTimeout(() => {
                const slider = document.getElementById('academy-level-slider');
                if (slider) slider.value = db.academy_level;
                app.updateAcademyLevelDisplay(db.academy_level);
            }, 200);

            const savedKey = localStorage.getItem(API_KEY_STORAGE);
            if (savedKey) {
                app.showDashboard('replace');
            } else {
                app.switchView('view-apikey', 'replace');
            }

            // Auto select the list that the user needs to complete (or next pending)
            app.autoSelectNextPendingTopic();

            app.checkCookies();
            app.renderDashboardLists();
            if (typeof game !== 'undefined' && game.updateAvatar) game.updateAvatar();
            app.updateHeaderTranslatorBtn();
            app.updateLessonButtonsVisibility();

            window.onpopstate = (event) => {
                const voiceModal = document.getElementById('modal-voice-settings');
                if (voiceModal && !voiceModal.classList.contains('hidden')) {
                    voiceModal.classList.add('hidden');
                    return;
                }
                
                const shareModal = document.getElementById('modal-share');
                if (shareModal && !shareModal.classList.contains('hidden')) {
                    shareModal.classList.add('hidden');
                    return;
                }
                const backupModal = document.getElementById('modal-backup-manager');
                if (backupModal && !backupModal.classList.contains('hidden')) {
                    backupModal.classList.add('hidden');
                    return;
                }
                const infoModal = document.getElementById('modal-apikey-info');
                if (infoModal && !infoModal.classList.contains('hidden')) {
                    infoModal.classList.add('hidden');
                    return;
                }
                const teacherModal = document.getElementById('modal-teacher-select');
                if (teacherModal && !teacherModal.classList.contains('hidden')) {
                    teacherModal.classList.add('hidden');
                    return;
                }
                const grammarPlusModal = document.getElementById('modal-grammar-plus');
                if (grammarPlusModal && !grammarPlusModal.classList.contains('hidden')) {
                    if (typeof game !== 'undefined' && game.closeGrammarConsultation) game.closeGrammarConsultation(true);
                    else grammarPlusModal.classList.add('hidden');
                    return;
                }
                const reportModal = document.getElementById('modal-performance-report');
                if (reportModal && !reportModal.classList.contains('hidden')) {
                    if (typeof game !== 'undefined' && game.closePerformanceReport) game.closePerformanceReport(true);
                    else reportModal.classList.add('hidden');
                    return;
                }
                const vocabAiModal = document.getElementById('modal-vocab-ai-mode');
                if (vocabAiModal && !vocabAiModal.classList.contains('hidden')) {
                    translator.closeVocabModeModal();
                    return;
                }
                const transView = document.getElementById('view-translator');
                if (transView && !transView.classList.contains('hidden')) {
                    translator.exitToDashboard();
                    return;
                }
                if (event.state && event.state.view) {
                    if (event.state.view === 'view-dashboard') app.showDashboard('none');
                    else app.switchView(event.state.view, 'none');
                } else {
                    const isDash = !document.getElementById('view-dashboard').classList.contains('hidden');
                    if (!isDash) app.showDashboard('none');
                }
            };
        },

        updateSpeedLabel: (val) => {
            const label = document.getElementById('speed-value-label');
            if (label) label.textContent = parseFloat(val).toFixed(2) + 'x';
            localStorage.setItem('jetbulary_speech_speed', val);
            const slider = document.getElementById('speech-speed-slider');
            if (slider) slider.value = val;
        },

        showDashboard: (h) => {
            window.speechSynthesis.cancel();
            if (typeof session !== 'undefined' && session.markCurrentWordsAsLearned) {
                session.markCurrentWordsAsLearned();
            }
            if (typeof translator !== 'undefined') {
                translator.stop();
            }
            if (typeof game !== 'undefined' && game.stopMic) game.stopMic();
            if (typeof conversation !== 'undefined') {
                conversation.stopMic();
                if (conversation.assessmentTimerInterval) {
                    clearInterval(conversation.assessmentTimerInterval);
                    conversation.assessmentTimerInterval = null;
                }
                const banner = document.getElementById('assessment-timer-banner');
                if (banner) banner.classList.add('hidden');
            }
            document.querySelectorAll('.listening').forEach(el => el.classList.remove('listening'));
            app.switchView('view-dashboard', h);
            if (typeof game !== 'undefined' && game.updateAvatar) game.updateAvatar();
            app.autoSelectNextPendingTopic();
            app.renderDashboardLists();
            app.renderLevelBadges();
            app.updateLessonButtonsVisibility();
        },

        renderDashboardLists: () => {
            const selector = document.getElementById('dashboard-list-selector');
            if (!selector) return;
            const topics = db.topics.filter(t => (t.lang || 'en') === currentLang);
            topics.sort((a, b) => {
                const la = a.level !== undefined ? a.level : 0;
                const lb = b.level !== undefined ? b.level : 0;
                if (la !== lb) return la - lb;
                return a.id - b.id;
            });

            selector.innerHTML = '<option value="">Select a list...</option>' +
                topics.map(t => {
                    const wordCount = db.words.filter(w => w.topic_id === t.id).length;
                    const wordsInTopic = db.words.filter(w => w.topic_id === t.id);
                    const isCompleted = wordsInTopic.length > 0 && wordsInTopic.every(w => {
                        const p = db.progress.find(pr => pr.word_id === w.id);
                        return p && p.successes >= 1;
                    });
                    const statusIcon = isCompleted ? '✅ ' : '';
                    return `<option value="${t.id}" ${t.id == session.selectedListId ? 'selected' : ''}>${statusIcon}${t.name} (${wordCount})</option>`;
                }).join('');
        },

        showVocab: () => { app.switchView('view-vocab'); vocab.render(); },
        showTranslator: async () => {
            window.speechSynthesis.cancel();
            if (typeof game !== 'undefined' && game.stopMic) game.stopMic();
            if (typeof conversation !== 'undefined') conversation.stopMic();
            app.switchView('view-translator');
            if (typeof translator !== 'undefined') await translator.init();
        },
        startDirectHandsFree: async () => {
            window.speechSynthesis.cancel();
            if (typeof game !== 'undefined' && game.stopMic) game.stopMic();
            if (typeof conversation !== 'undefined') conversation.stopMic();
            app.switchView('view-translator');
            if (typeof translator !== 'undefined') await translator.init();
        },
        showStats: () => {
            app.switchView('view-stats');
            const prog = db.progress;
            const total = prog.length;
            const succ = prog.reduce((a,b) => a + b.successes, 0);
            const att = prog.reduce((a,b) => a + b.attempts, 0);
            document.getElementById('stat-total').innerText = total;
            document.getElementById('stat-acc').innerText = (att > 0 ? Math.round((succ/att)*100) : 0) + '%';
        },
        showPrivacy: () => app.switchView('view-privacy'),
        showTerms: () => app.switchView('view-terms'),

        switchView: (id, historyAction = 'push') => {
            document.querySelectorAll('.container[id^="view-"]').forEach(el => { el.classList.add('hidden'); el.style.zIndex = '1'; el.style.position = 'relative'; });
            const target = document.getElementById(id);
            if (target) {
                target.classList.remove('hidden'); target.style.zIndex = '500'; target.style.position = 'relative';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                target.querySelectorAll('button').forEach(btn => { btn.style.zIndex = '600'; btn.style.pointerEvents = 'auto'; });
            }

            if (id !== 'view-translator') {
                const transView = document.getElementById('view-translator');
                if (transView) transView.classList.remove('apaisado-forced');
                if (window.translator && translator.checkOrientation) {
                    window.removeEventListener('resize', translator.checkOrientation);
                    window.removeEventListener('orientationchange', translator.checkOrientation);
                }
            }

            const newUrl = "#" + id.replace('view-', '');
            if (historyAction === 'push') history.pushState({ view: id }, null, newUrl);
            else if (historyAction === 'replace') history.replaceState({ view: id }, null, newUrl);
        },

        logout: () => {
            if (confirm("Change API Key?")) { localStorage.removeItem(API_KEY_STORAGE); app.switchView('view-apikey'); }
        },

        toggleApiKeySection: () => {
            const body = document.getElementById('apikey-body');
            const chevron = document.getElementById('apikey-chevron');
            if (!body) return;
            const isHidden = body.classList.contains('hidden');
            if (isHidden) {
                body.classList.remove('hidden');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            } else {
                body.classList.add('hidden');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
        },

        toggleApiKeyHelp: () => {
            const box = document.getElementById('apikey-help-box');
            if (box) box.classList.toggle('hidden');
        },

        saveApiKey: (keyOverride) => {
            const input = document.getElementById('api-key-input');
            const k = (keyOverride || (input ? input.value : '')).trim().replace(/^['"`\s]+|['"`\s]+$/g, '');
            if (k && k.startsWith('gsk_') && k.length > 20) {
                localStorage.setItem(API_KEY_STORAGE, k);
                app.showDashboard();
            } else if (k && k.length > 10) {
                localStorage.setItem(API_KEY_STORAGE, k);
                app.showDashboard();
            } else {
                document.getElementById('autodetect-status').innerHTML = '⚠️ Clave inválida. Asegúrate de copiar tu API Key de Groq (gsk_...).';
            }
        },

        onApiKeyInput: (val) => {
            const btn = document.getElementById('btn-sync');
            if (!btn) return;
            const valid = val && val.trim().length > 10;
            btn.style.opacity = valid ? '1' : '0.5';
            btn.style.pointerEvents = valid ? 'auto' : 'none';
        },

        toggleApiKeyVisibility: () => {
            const input = document.getElementById('api-key-input');
            input.type = input.type === 'password' ? 'text' : 'password';
        },

        waitForClipboard: () => {
            const onReturn = async () => {
                window.removeEventListener('focus', onReturn);
                document.removeEventListener('visibilitychange', onVisibility);
                try {
                    const text = await navigator.clipboard.readText();
                    const trimmed = text ? text.trim() : '';
                    if (trimmed && trimmed.startsWith('gsk_') && trimmed.length > 20) {
                        document.getElementById('autodetect-status').innerHTML = '✅ <strong style="color:var(--neon-cyan)">Key detected!</strong> Activating...';
                        const input = document.getElementById('api-key-input');
                        if (input) { input.value = trimmed; app.onApiKeyInput(trimmed); }
                        setTimeout(() => app.saveApiKey(trimmed), 800);
                    } else if (trimmed && trimmed.length > 20) {
                        document.getElementById('autodetect-status').innerHTML = '📋 Key detected. Please verify and click START LEARNING.';
                        const input = document.getElementById('api-key-input');
                        if (input) { input.value = trimmed; app.onApiKeyInput(trimmed); }
                    } else {
                        document.getElementById('autodetect-status').innerHTML = '📋 Paste your key in the field below and click START LEARNING.';
                    }
                } catch(e) {
                    document.getElementById('autodetect-status').innerHTML = '📋 Paste your key in the field below and click START LEARNING.';
                }
            };
            const onVisibility = async () => { if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('focus', onReturn); onReturn(); } };
            window.addEventListener('focus', onReturn);
            document.addEventListener('visibilitychange', onVisibility);
        },

        checkCookies: () => { if (!localStorage.getItem('jetbulary_cookies')) document.getElementById('cookie-banner').classList.remove('hidden'); },
        acceptCookies: () => { localStorage.setItem('jetbulary_cookies', 'accepted'); document.getElementById('cookie-banner').classList.add('hidden'); },

        getCorrectCount: () => db.progress.reduce((a, p) => a + p.successes, 0),

        generateListFromInput: async () => {
            const input = document.getElementById('list-topic-input') || document.getElementById('list-topic-input-vocab');
            let topic = input ? input.value.trim() : '';
            const levelNum = document.getElementById('academy-level-slider')?.value || 0;
            const levels = ["Beginner", "Elementary", "Intermediate", "Advanced", "Native"];
            const levelLabel = levels[levelNum];
            if (topic) { app.generateVocabList(topic, levelLabel); if(input) input.value = ""; }
            else { app.generateVocabList(null, levelLabel); }
        },

        generateVocabList: async (topic, levelLabel = "Intermediate") => {
            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const topicDesc = topic ? `topic: ${topic}` : `a NEW and ESSENTIAL VOCABULARY topic that a "${levelLabel}" level ${langInfo.name} student must know. PRIORITIZE basic structural vocabulary (family, home, food, work, travel, etc.).`;
            const prompt = `Act as an expert linguist. Generate a list of MINIMUM 40 common and essential ${langInfo.name} words related to ${topicDesc}.

RULES:
1. Include plenty of common verbs.
2. ABSOLUTE RULE FOR VERBS: For EACH verb, write the infinitive followed by its main forms in parentheses if applicable.
3. Return ONLY a JSON object:
{
  "topic": "[TOPIC IN UPPERCASE]",
  "words": [
    {"english": "word or verb in ${langInfo.name}", "spanish": "Spanish translation", "ipa": "/pronunciation/", "sentence_en": "Example sentence in ${langInfo.name}", "sentence_es": "Spanish translation"}
  ]
}
Ensure minimum 40 real, useful words in ${langInfo.name} aligned to level "${levelLabel}".`;

            const btn = document.querySelector('button[onclick="app.generateListFromInput()"]');
            await app.callAI_Text(prompt, btn, (response) => {
                try {
                    const jsonStr = response.replace(/```json|```/g, '').trim();
                    const data = JSON.parse(jsonStr);
                    if (data.words && Array.isArray(data.words)) {
                        const finalTopicName = data.topic || (topic ? topic.toUpperCase() : "GENERATED TOPIC");
                        let newTopic = topic ? db.topics.find(t => t.name.toLowerCase() === finalTopicName.toLowerCase() && (t.lang || 'en') === currentLang) : null;
                        if (!newTopic) { newTopic = { id: Date.now(), name: finalTopicName, lang: currentLang }; db.topics.push(newTopic); }
                        data.words.forEach((w, i) => { db.words.push({ ...w, id: Date.now() + i + 1, topic_id: newTopic.id }); });
                        app.saveDB();
                        app.renderDashboardLists();
                        if (!document.getElementById('view-vocab').classList.contains('hidden')) vocab.render();
                        alert(`✅ Added ${data.words.length} words in ${langInfo.name} about '${newTopic.name}'!`);
                    }
                } catch (e) { console.error("Error:", e); alert("AI could not generate the list. Try again."); }
            });
        },

        exportDB: () => {
            const dataStr = JSON.stringify(db, null, 2);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `jetbulary_backup_${new Date().toISOString().slice(0,10)}.json`;
            a.click(); URL.revokeObjectURL(url);
        },

        installApp: async () => {
            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            
            if (isStandalone) {
                alert("✅ Jetbulary ya está instalada y ejecutándose como aplicación en tu dispositivo.");
                return;
            }

            if (window.deferredPrompt) {
                try {
                    window.deferredPrompt.prompt();
                    const choiceResult = await window.deferredPrompt.userChoice;
                    if (choiceResult && choiceResult.outcome === 'accepted') {
                        console.log('User accepted install');
                        app.closeShareModal(true);
                    }
                } catch(e) {
                    console.log('Install prompt error:', e);
                }
                window.deferredPrompt = null;
            } else if (isIOS) {
                alert("📲 Para instalar Jetbulary en tu iPhone / iPad (iOS):\n\n1. Abre esta página en Safari.\n2. Pulsa en el botón 'Compartir' (icono de un cuadrado con flecha hacia arriba ⎋ abajo en la barra).\n3. Desliza hacia abajo y pulsa en 'Añadir a la pantalla de inicio' ➕.\n4. Pulsa 'Añadir' en la esquina superior derecha.\n\n¡Listo! Aparecerá el icono de Jetbulary en tu pantalla de inicio.");
            } else {
                const isAndroid = /Android/i.test(navigator.userAgent);
                if (isAndroid) {
                    alert("📲 Para instalar Jetbulary en tu móvil Android:\n\n1. Pulsa en los 3 puntos (⋮) arriba a la derecha en Chrome.\n2. Selecciona 'Instalar aplicación' o 'Añadir a la pantalla de inicio'.\n3. Confirma la instalación.");
                } else {
                    alert("📲 Para instalar Jetbulary en tu ordenador (PC / Mac):\n\n1. En Chrome o Edge, pulsa el icono de instalar ⊕ o 📲 situado a la derecha en la barra de direcciones (URL).\n2. O pulsa en los 3 puntos (⋮) > 'Guardar y compartir' > 'Instalar Jetbulary'.");
                }
            }
        },

        // ====== AI API CALLS WITH DYNAMIC MODEL DISCOVERY & CASCADING FALLBACK ======
        getAvailableGroqModels: async (key) => {
            try {
                const res = await fetch("https://api.groq.com/openai/v1/models", {
                    headers: { "Authorization": `Bearer ${key}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const availableIds = (data.data || []).map(m => m.id);
                    if (availableIds.length > 0) return availableIds;
                }
            } catch(e) {}
            return [];
        },

        callAI_Text: async (prompt, btn, callback) => {
            const rawKey = localStorage.getItem(API_KEY_STORAGE);
            const key = rawKey ? rawKey.trim().replace(/^['"`\s]+|['"`\s]+$/g, '') : '';
            if (!key) return alert("Falta la API Key de Groq. Actívala en la pantalla de inicio.");
            let originalText = "";
            if (btn) { originalText = btn.innerText; btn.disabled = true; btn.innerText = "..."; }

            const userModels = await app.getAvailableGroqModels(key);
            const defaultCandidates = [
                'llama-3.3-70b-versatile',
                'llama-3.1-8b-instant',
                'llama3-70b-8192',
                'llama3-8b-8192',
                'mixtral-8x7b-32768',
                'gemma2-9b-it',
                'openai/gpt-oss-20b'
            ];
            
            const candidates = userModels.length > 0
                ? defaultCandidates.filter(m => userModels.includes(m)).concat(userModels.filter(m => !m.includes('whisper') && !m.includes('guard') && !m.includes('tts') && !m.includes('vision')))
                : defaultCandidates;

            let lastError = null;
            try {
                for (const modelName of candidates) {
                    try {
                        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                            body: JSON.stringify({ model: modelName, messages: [{role:"user", content: prompt}], temperature: 0.7 })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            callback(data.choices[0].message.content);
                            return;
                        }
                        if (res.status === 401) {
                            throw new Error("Tu API Key de Groq es inválida o ha caducado. Pulsa 'Cambio Key' e introduce tu clave correcta (gsk_...).");
                        }
                        const errJson = await res.json().catch(() => ({}));
                        lastError = errJson?.error?.message || `HTTP ${res.status}`;
                        console.warn(`Groq model ${modelName} failed (${lastError}), trying next candidate...`);
                    } catch(e) {
                        if (e.message && e.message.includes('API Key')) throw e;
                        lastError = e.message;
                    }
                }
                throw new Error(lastError || "No se pudo conectar con ningún modelo de Groq");
            } catch(e) {
                alert("Error de IA: " + e.message);
            } finally {
                if (btn) { btn.disabled = false; btn.innerText = originalText; }
            }
        },

        callAI_Conversation: async (messages, btn, callback) => {
            const rawKey = localStorage.getItem(API_KEY_STORAGE);
            const key = rawKey ? rawKey.trim().replace(/^['"`\s]+|['"`\s]+$/g, '') : '';
            if (!key) return alert("Falta la API Key de Groq. Actívala en la pantalla de inicio.");
            let originalText = "";
            if (btn) { originalText = btn.innerText; btn.disabled = true; btn.innerText = "..."; }

            // Ensure JSON is explicitly mentioned in the messages so Groq's json_object mode succeeds
            const sanitizedMessages = messages.map(m => ({ ...m }));
            const hasJsonMention = sanitizedMessages.some(m => /json/i.test(m.content));
            if (!hasJsonMention && sanitizedMessages.length > 0) {
                sanitizedMessages[0].content += " (Respond in valid JSON format)";
            }

            const userModels = await app.getAvailableGroqModels(key);
            const defaultCandidates = [
                'llama-3.3-70b-versatile',
                'llama-3.1-8b-instant',
                'llama3-70b-8192',
                'llama3-8b-8192',
                'mixtral-8x7b-32768',
                'gemma2-9b-it',
                'openai/gpt-oss-20b'
            ];
            
            const candidates = userModels.length > 0
                ? defaultCandidates.filter(m => userModels.includes(m)).concat(userModels.filter(m => !m.includes('whisper') && !m.includes('guard') && !m.includes('tts') && !m.includes('vision')))
                : defaultCandidates;

            let lastError = null;
            try {
                for (const modelName of candidates) {
                    try {
                        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                            body: JSON.stringify({
                                model: modelName,
                                messages: sanitizedMessages,
                                temperature: 0.7,
                                response_format: { type: "json_object" }
                            })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            const content = data.choices[0].message.content;
                            let parsed = null;
                            try {
                                parsed = JSON.parse(content);
                            } catch(pe) {
                                const jsonMatch = content.match(/\{[\s\S]*\}/);
                                if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
                                else throw pe;
                            }
                            callback(parsed);
                            return;
                        }
                        if (res.status === 401) {
                            throw new Error("Tu API Key de Groq es inválida o ha caducado. Pulsa 'Cambio Key' e introduce tu clave correcta (gsk_...).");
                        }
                        const errBody = await res.json().catch(() => ({}));
                        lastError = errBody?.error?.message || `HTTP ${res.status}`;
                        console.warn(`Groq conversation model ${modelName} failed (${lastError}), trying next candidate...`);
                    } catch(e) {
                        if (e.message && e.message.includes('API Key')) throw e;
                        lastError = e.message;
                    }
                }
                throw new Error(lastError || "No se pudo conectar con ningún modelo de Groq");
            } catch(e) {
                console.error("AI Error:", e);
                alert("Error de IA: " + e.message);
            } finally {
                if (btn) { btn.disabled = false; btn.innerText = originalText; }
            }
        },

        transcribeAudioWithGroq: async (audioBlob, langCode) => {
            const key = localStorage.getItem(API_KEY_STORAGE);
            if (!key) throw new Error("Missing API Key");

            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");
            formData.append("model", "whisper-large-v3-turbo");
            formData.append("temperature", "0");
            if (langCode && langCode !== 'auto') formData.append("language", langCode);
            formData.append("response_format", "json");

            const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${key}` },
                body: formData
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error("Groq Whisper error: " + errText);
            }

            const data = await res.json();
            const raw = data.text ? data.text.trim() : '';
            const cleanLower = raw.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'¿¡]/g, '').trim();
            const hallucinations = ['thank you', 'thank you very much', 'thanks for watching', 'thank you for watching', 'subtitles by', 'mbc 뉴스', 'you', 'bye', 'goodbye'];
            if (hallucinations.includes(cleanLower)) {
                console.warn("🛡️ Descartada alucinación de silencio de Whisper:", raw);
                return '';
            }
            return raw;
        },
    };
