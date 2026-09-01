// ====== VOCAB OBJECT ======
    const vocab = {
        activeTopicId: 'all',
        selectedIds: new Set(),
        searchQuery: '',

        onSearch: (q) => {
            vocab.searchQuery = (q || '').trim().toLowerCase();
            vocab.render();
        },

        changeTopic: (val) => {
            vocab.activeTopicId = val;
            vocab.render();
        },

        toggleSelect: (id) => {
            if (vocab.selectedIds.has(id)) {
                vocab.selectedIds.delete(id);
            } else {
                vocab.selectedIds.add(id);
            }
            vocab.updateSelectionUI();
        },

        selectAll: () => {
            const visibleWords = vocab.getFilteredWords();
            visibleWords.forEach(w => vocab.selectedIds.add(w.id));
            vocab.render();
        },

        deselectAll: () => {
            vocab.selectedIds.clear();
            vocab.render();
        },

        updateSelectionUI: () => {
            const count = vocab.selectedIds.size;
            const countEl = document.getElementById('vocab-selection-count');
            const btn = document.getElementById('btn-convo-selected');
            if (countEl) countEl.innerText = `${count} word${count === 1 ? '' : 's'} selected`;
            if (btn) {
                btn.style.opacity = count > 0 ? '1' : '0.5';
                btn.style.pointerEvents = count > 0 ? 'auto' : 'none';
                btn.innerHTML = `💬 START CONVERSATION WITH (${count}) SELECTED WORDS`;
            }
        },

        getFilteredWords: () => {
            return db.words.filter(w => {
                const topic = db.topics.find(t => t.id === w.topic_id);
                if (!topic || (topic.lang || 'en') !== currentLang) return false;
                if (vocab.activeTopicId !== 'all' && w.topic_id != vocab.activeTopicId) return false;
                if (vocab.searchQuery) {
                    const matchTarget = (w.english || '').toLowerCase().includes(vocab.searchQuery);
                    const matchEs = (w.spanish || '').toLowerCase().includes(vocab.searchQuery);
                    if (!matchTarget && !matchEs) return false;
                }
                return true;
            });
        },

        render: () => {
            const list = document.getElementById('vocab-list');
            const selector = document.getElementById('vocab-topic-selector');
            if (!list || !selector) return;

            const langInfo = LANGUAGES[currentLang] || LANGUAGES.en;
            const topics = db.topics.filter(t => (t.lang || 'en') === currentLang);
            selector.innerHTML = '<option value="all">ALL WORDS</option>' +
                topics.map(t => `<option value="${t.id}" ${t.id == vocab.activeTopicId ? 'selected' : ''}>${t.name.toUpperCase()}</option>`).join('');

            let words = vocab.getFilteredWords().map(w => {
                const p = db.progress.find(pr => pr.word_id === w.id);
                const score = p && p.attempts > 0 ? Math.round((p.successes / p.attempts) * 100) : -1;
                return { ...w, score };
            }).sort((a,b) => a.score - b.score);

            vocab.updateSelectionUI();

            if (words.length === 0) {
                list.innerHTML = `<p style="text-align:center; color:#666; padding:20px;">No words found in ${langInfo.name}.</p>`;
                return;
            }

            list.innerHTML = words.map(w => {
                const cleanWord = w.english.includes('(') ? w.english.split('(')[0].trim() : w.english;
                const isChecked = vocab.selectedIds.has(w.id);
                const badge = w.score === -1 ? '<span class="tech" style="color:#888; font-size:0.65rem; border:1px solid #888; padding:2px 4px; border-radius:3px;">[NEW]</span>' :
                    w.score < 50 ? '<span class="tech" style="color:var(--cyber-danger); font-size:0.65rem; border:1px solid var(--cyber-danger); padding:2px 4px; border-radius:3px;">[HARD]</span>' :
                    w.score < 80 ? '<span class="tech" style="color:var(--cyber-warn); font-size:0.65rem; border:1px solid var(--cyber-warn); padding:2px 4px; border-radius:3px;">[MEDIUM]</span>' :
                    '<span class="tech" style="color:var(--cyber-ok); font-size:0.65rem; border:1px solid var(--cyber-ok); padding:2px 4px; border-radius:3px;">[OK]</span>';

                return `
                <div class="vocab-item" style="background: rgba(18,18,20,0.95); border: 1px solid ${isChecked ? 'var(--neon-cyan)' : 'var(--cyber-border)'}; border-radius: 6px; padding: 14px; box-shadow: ${isChecked ? 'var(--cyber-glow)' : 'none'}; transition: all 0.2s;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px;">
                        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; flex: 1;">
                            <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="vocab.toggleSelect(${w.id})" style="width: 20px; height: 20px; accent-color: var(--neon-cyan); cursor: pointer;">
                            <span style="color: var(--neon-cyan); font-weight: 800; font-size: 1.3rem; letter-spacing: 0.5px;">${w.english}</span>
                        </label>
                        ${badge}
                    </div>
                    <div style="color: var(--neon-pink); font-size: 0.95rem; margin-left: 32px; margin-bottom: 12px; font-weight: 500;">${w.spanish}</div>
                    
                    ${w.sentence_en ? `
                    <!-- CONTEXTUAL SENTENCE DISPLAY -->
                    <div style="margin-left: 32px; margin-bottom: 10px; padding: 8px 12px; background: rgba(255,255,255,0.04); border-left: 3px solid var(--cyber-warn); border-radius: 6px; font-size: 0.88rem; color: #DDD;">
                        <div style="font-weight: 500; line-height: 1.35; color: #FFF;">💬 "${w.sentence_en}"</div>
                        ${w.sentence_es ? `<div style="font-size: 0.8rem; color: #999; margin-top: 3px;">📖 ${w.sentence_es}</div>` : ''}
                    </div>` : ''}

                    <!-- ACTION BUTTONS: WORD / SENTENCE / YOUGLISH NATIVES -->
                    <div style="display: flex; gap: 8px; margin-left: 32px; flex-wrap: wrap;">
                        <button onclick="game.speakText('${cleanWord.replace(/'/g, "\\'")}')" class="secondary" style="width: auto; padding: 8px 14px; font-size: 0.8rem; border-color: var(--neon-cyan); color: var(--neon-cyan); font-weight: 600;" title="Escuchar pronunciación de la palabra">
                            🔊 Palabra
                        </button>
                        ${w.sentence_en ? `
                        <button onclick="game.speakText('${w.sentence_en.replace(/'/g, "\\'")}')" class="secondary" style="width: auto; padding: 8px 14px; font-size: 0.8rem; border-color: var(--cyber-warn); color: var(--cyber-warn); font-weight: 600;" title="Escuchar frase completa en contexto">
                            💬 Frase en Contexto
                        </button>` : ''}
                        <a href="https://youglish.com/pronounce/${encodeURIComponent(cleanWord)}/${langInfo.youglishLang}" target="_blank" class="tech" style="display: inline-flex; align-items: center; gap: 4px; padding: 8px 14px; font-size: 0.8rem; border: 1px solid rgba(0,243,255,0.4); background: rgba(0,243,255,0.08); color: var(--neon-cyan); text-decoration: none; border-radius: 4px; font-weight: 600;" title="Escuchar a nativos reales pronunciarla en YouTube">
                            👂 Escuchar Nativos (YouGlish)
                        </a>
                    </div>
                </div>`;
            }).join('');
        },

        startSelectedConversation: () => {
            if (vocab.selectedIds.size === 0) {
                alert('Please select at least one word from the list.');
                return;
            }
            const selectedWords = db.words.filter(w => vocab.selectedIds.has(w.id));
            conversation.start(selectedWords, "Custom Vocabulary Practice");
        }
    };
