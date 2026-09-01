// ====== SCROLL TO MIC ======
function scrollToMicArea(micBtnId) {
    requestAnimationFrame(() => {
        const micBtn = document.getElementById(micBtnId);
        if (!micBtn) return;
        micBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
        setTimeout(() => micBtn.scrollIntoView({ behavior: 'smooth', block: 'end' }), 400);
    });
}

// ====== DATABASE & PERSISTENT STORAGE (INDEXEDDB + LOCALSTORAGE) ======
const DB_KEY = 'jetbulary_db';
const API_KEY_STORAGE = 'jetbulary_apikey';
let db = { topics: [], words: [], progress: [], grammar_courses: {}, academy_tips: [], academy_level: 0, reported_errors: [] };
let currentLang = localStorage.getItem('jetbulary_current_lang') || 'en';

// Automatic IndexedDB persistent storage backup layer
const idbBackup = {
    dbName: 'JetbularyPersistentBackup',
    storeName: 'backup_store',
    open: () => {
        return new Promise((resolve) => {
            if (!window.indexedDB) return resolve(null);
            const req = window.indexedDB.open(idbBackup.dbName, 1);
            req.onupgradeneeded = (e) => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains(idbBackup.storeName)) {
                    d.createObjectStore(idbBackup.storeName);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    },
    save: async (key, val) => {
        try {
            const idb = await idbBackup.open();
            if (!idb) return;
            const tx = idb.transaction(idbBackup.storeName, 'readwrite');
            tx.objectStore(idbBackup.storeName).put(val, key);
        } catch(e) {}
    },
    get: async (key) => {
        try {
            const idb = await idbBackup.open();
            if (!idb) return null;
            return new Promise((resolve) => {
                const tx = idb.transaction(idbBackup.storeName, 'readonly');
                const req = tx.objectStore(idbBackup.storeName).get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            });
        } catch(e) { return null; }
    },
    syncAll: async () => {
        const fullBackup = {
            db: db,
            apiKey: localStorage.getItem(API_KEY_STORAGE),
            currentLang: currentLang,
            speechSpeed: localStorage.getItem('jetbulary_speech_speed'),
            updatedAt: Date.now()
        };
        await idbBackup.save('jetbulary_full_backup', fullBackup);
        if (navigator.storage && navigator.storage.persist) {
            try { navigator.storage.persist(); } catch(e) {}
        }
    },
    restoreIfMissing: async () => {
        try {
            const backup = await idbBackup.get('jetbulary_full_backup');
            if (backup && backup.db) {
                let localEmpty = false;
                const localData = localStorage.getItem(DB_KEY);
                if (!localData) {
                    localEmpty = true;
                } else {
                    const parsed = JSON.parse(localData);
                    if ((!parsed.progress || parsed.progress.length === 0) && (backup.db.progress && backup.db.progress.length > 0)) {
                        localEmpty = true;
                    }
                }

                if (localEmpty) {
                    console.log("Restoring progress automatically from Persistent IndexedDB Backup...");
                    db = backup.db;
                    localStorage.setItem(DB_KEY, JSON.stringify(db));
                    if (backup.apiKey && !localStorage.getItem(API_KEY_STORAGE)) {
                        localStorage.setItem(API_KEY_STORAGE, backup.apiKey);
                    }
                    if (backup.currentLang) {
                        currentLang = backup.currentLang;
                        localStorage.setItem('jetbulary_current_lang', currentLang);
                    }
                    if (backup.speechSpeed) {
                        localStorage.setItem('jetbulary_speech_speed', backup.speechSpeed);
                    }
                    return true;
                }
            }
        } catch(e) {}
        return false;
    }
};
