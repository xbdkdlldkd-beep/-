/**
 * مُنظِّم (Munazzem Pro) - صلاتي، حياتي، وتنظيم الوقت والمهام
 *
 * Core Pillars:
 * 1. الصلاة أولاً: مواقيت دقيقة، تتبع الصلوات اليومي، عداد تنازلي، تكبيرات الأذان، وأذكار حصن المسلم.
 * 2. إدارة المهام بيدك أنت: لا يتم إضافة أي مهمة عشوائية، تنظيم كامل للمذاكرة والرياضة والعبادات.
 * 3. نظام تنبيهات وإشعارات بأصوات حقيقية (Web Audio API Synthesizer) تعمل بدون إنترنت.
 * 4. مؤقت المذاكرة (بومودورو) ومؤقت تمارين الجيم والجدول الزمني المجمع.
 */

// ==================== STATE MANAGEMENT ====================
let tasks = [];
let activeAlertTask = null;
let masterVolume = 0.8;

// Prayer State
let prayerTimes = {
    fajr: '04:45',
    sunrise: '06:12',
    dhuhr: '11:45',
    asr: '14:48',
    maghrib: '17:15',
    isha: '18:35'
};
let prayerStatus = {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false
};
let selectedLocation = 'Cairo,Egypt';
let nextPrayerKey = null;

// Pomodoro State
let pomoTimeLeft = 25 * 60;
let pomoDuration = 25 * 60;
let pomoTimerId = null;
let pomoMode = 'focus';
let pomoCompletedSessions = 0;
let pomoTotalMinutes = 0;

// Workout State
let workoutTimeLeft = 60;
let workoutDuration = 60;
let workoutTimerId = null;

// ==================== AUDIO SYNTHESIZER (WEB AUDIO API) ====================
class SoundManager {
    constructor() {
        this.ctx = null;
    }

    initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(soundType) {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(masterVolume, now);
        gainNode.connect(this.ctx.destination);

        switch (soundType) {
            case 'adhan':
                this.playAdhan(now, gainNode);
                break;
            case 'bell':
                this.playBell(now, gainNode);
                break;
            case 'chime':
                this.playChime(now, gainNode);
                break;
            case 'digital':
                this.playDigital(now, gainNode);
                break;
            case 'energetic':
                this.playEnergetic(now, gainNode);
                break;
            case 'zen':
                this.playZen(now, gainNode);
                break;
            case 'shortBeep':
                this.playShortBeep(now, gainNode);
                break;
            default:
                this.playChime(now, gainNode);
        }
    }

    // 1. Melodic Adhan Takbeer (Allahu Akbar tones)
    playAdhan(now, masterGain) {
        // Melodic sequence for "Allahu Akbar": F4 -> G4 -> A4 -> G4 -> F4
        const melody = [
            { freq: 349.23, time: 0.0, dur: 0.5 }, // Al-
            { freq: 392.00, time: 0.55, dur: 0.4 }, // la-
            { freq: 440.00, time: 1.0, dur: 0.8 }, // hu
            { freq: 392.00, time: 1.85, dur: 0.5 }, // Ak-
            { freq: 349.23, time: 2.4, dur: 1.2 }  // bar
        ];

        melody.forEach(note => {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, now + note.time);

            noteGain.gain.setValueAtTime(0.001, now + note.time);
            noteGain.gain.exponentialRampToValueAtTime(0.45, now + note.time + 0.08);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.dur);

            // Add warm harmonic
            const osc2 = this.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(note.freq * 2, now + note.time);

            osc.connect(noteGain);
            osc2.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(now + note.time);
            osc.stop(now + note.time + note.dur + 0.1);
            osc2.start(now + note.time);
            osc2.stop(now + note.time + note.dur + 0.1);
        });
    }

    // 2. Bell for Study
    playBell(now, masterGain) {
        const freqs = [523.25, 1046.5, 1567.98];
        freqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            noteGain.gain.setValueAtTime(0.5, now);
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 1.6);
        });
    }

    // 3. Gentle Chime
    playChime(now, masterGain) {
        const tones = [659.25, 987.77];
        tones.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.15);

            noteGain.gain.setValueAtTime(0.001, now + idx * 0.15);
            noteGain.gain.exponentialRampToValueAtTime(0.4, now + idx * 0.15 + 0.05);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(now + idx * 0.15);
            osc.stop(now + idx * 0.15 + 1.3);
        });
    }

    // 4. Digital Beep
    playDigital(now, masterGain) {
        [0, 0.18, 0.36].forEach(timeOffset => {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1046.5, now + timeOffset);

            noteGain.gain.setValueAtTime(0.2, now + timeOffset);
            noteGain.gain.setValueAtTime(0.001, now + timeOffset + 0.09);

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + 0.1);
        });
    }

    // 5. Energetic Workout
    playEnergetic(now, masterGain) {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);

            noteGain.gain.setValueAtTime(0.25, now + idx * 0.12);
            noteGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.2);

            osc.connect(noteGain);
            noteGain.connect(masterGain);

            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.22);
        });
    }

    // 6. Zen Bowl
    playZen(now, masterGain) {
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, now);

        noteGain.gain.setValueAtTime(0.01, now);
        noteGain.gain.exponentialRampToValueAtTime(0.5, now + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 2.6);
    }

    playShortBeep(now, masterGain) {
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);

        noteGain.gain.setValueAtTime(0.3, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }
}

const sounds = new SoundManager();

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initTheme();
    loadUserData();
    initPrayerSystem();
    initNotifications();
    setupEventListeners();
    renderTasks();
    renderStats();
    updateTimeline();
    setupCurrentDateDisplay();

    // Live countdown and reminder checks every second
    setInterval(() => {
        updatePrayerCountdown();
        checkReminders();
    }, 1000);
});

// Setup current Gregorian & Hijri Date
function setupCurrentDateDisplay() {
    const el = document.getElementById('currentDateDisplay');
    const hijriEl = document.getElementById('hijriDateDisplay');
    const now = new Date();

    if (el) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        el.textContent = now.toLocaleDateString('ar-EG', options);
    }

    if (hijriEl) {
        try {
            const hijriStr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(now);
            hijriEl.textContent = `${hijriStr} هـ`;
        } catch (e) {
            hijriEl.textContent = 'بتوفيق الله وبركته';
        }
    }
}

// ==================== PRAYER ENGINE & TIMES ====================
async function initPrayerSystem() {
    const savedCity = localStorage.getItem('munazzem_city') || 'Cairo,Egypt';
    selectedLocation = savedCity;
    const citySelect = document.getElementById('citySelect');
    if (citySelect) citySelect.value = savedCity;

    loadPrayerStatus();
    await fetchPrayerTimes();
    updatePrayerUI();
}

async function fetchPrayerTimes() {
    const [city, country] = selectedLocation.split(',');
    try {
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`);
        if (response.ok) {
            const data = await response.json();
            if (data && data.data && data.data.timings) {
                const t = data.data.timings;
                prayerTimes = {
                    fajr: cleanTime(t.Fajr),
                    sunrise: cleanTime(t.Sunrise),
                    dhuhr: cleanTime(t.Dhuhr),
                    asr: cleanTime(t.Asr),
                    maghrib: cleanTime(t.Maghrib),
                    isha: cleanTime(t.Isha)
                };
                localStorage.setItem('munazzem_cached_prayers', JSON.stringify(prayerTimes));
            }
        }
    } catch (e) {
        // Fallback to cached or defaults
        const cached = localStorage.getItem('munazzem_cached_prayers');
        if (cached) {
            try { prayerTimes = JSON.parse(cached); } catch (err) {}
        }
    }
}

function cleanTime(str) {
    if (!str) return '12:00';
    return str.split(' ')[0].substring(0, 5);
}

function loadPrayerStatus() {
    const todayStr = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(`munazzem_prayers_${todayStr}`);
    if (stored) {
        try {
            prayerStatus = JSON.parse(stored);
        } catch (e) {
            resetPrayerStatus();
        }
    } else {
        resetPrayerStatus();
    }
}

function resetPrayerStatus() {
    prayerStatus = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
    savePrayerStatus();
}

function savePrayerStatus() {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`munazzem_prayers_${todayStr}`, JSON.stringify(prayerStatus));
    updatePrayerUI();
    updateTimeline();
}

function togglePrayerStatus(prayerKey) {
    sounds.initContext();
    if (prayerStatus[prayerKey] !== undefined) {
        prayerStatus[prayerKey] = !prayerStatus[prayerKey];
        if (prayerStatus[prayerKey]) {
            sounds.play('adhan');
        }
        savePrayerStatus();
    }
}

function updatePrayerUI() {
    const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

    prayers.forEach(p => {
        const card = document.querySelector(`.prayer-card[data-prayer="${p}"]`);
        if (!card) return;

        const timeEl = card.querySelector('.prayer-time');
        if (timeEl && prayerTimes[p]) {
            timeEl.textContent = prayerTimes[p];
        }

        const btn = card.querySelector('.prayer-check-btn');
        if (btn) {
            const isDone = prayerStatus[p];
            if (isDone) {
                btn.className = 'prayer-check-btn completed w-full py-1.5 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 bg-emerald-600 border-emerald-500 text-white';
                btn.innerHTML = '<i data-lucide="check-check" class="w-3.5 h-3.5"></i> <span>تم بحمد الله</span>';
            } else {
                btn.className = 'prayer-check-btn w-full py-1.5 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 border-white/20 bg-white/5 text-slate-300 hover:bg-emerald-600 hover:text-white';
                btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i> <span>صليت</span>';
            }
        }
    });

    // Score: X / 5
    const doneCount = Object.values(prayerStatus).filter(Boolean).length;
    const progressEl = document.getElementById('prayerProgressText');
    if (progressEl) {
        progressEl.textContent = `${doneCount} / 5 صلوات`;
    }

    lucide.createIcons();
}

// Live Countdown to Next Prayer
function updatePrayerCountdown() {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const currentSecs = now.getSeconds();

    const prayerOrder = [
        { key: 'fajr', name: 'صلاة الفجر', time: prayerTimes.fajr },
        { key: 'sunrise', name: 'الشروق', time: prayerTimes.sunrise },
        { key: 'dhuhr', name: 'صلاة الظهر', time: prayerTimes.dhuhr },
        { key: 'asr', name: 'صلاة العصر', time: prayerTimes.asr },
        { key: 'maghrib', name: 'صلاة المغرب', time: prayerTimes.maghrib },
        { key: 'isha', name: 'صلاة العشاء', time: prayerTimes.isha }
    ];

    let next = null;
    let nextDiffMins = 0;

    for (let p of prayerOrder) {
        if (!p.time) continue;
        const [h, m] = p.time.split(':').map(Number);
        const pMins = h * 60 + m;
        if (pMins > currentMins || (pMins === currentMins && currentSecs === 0)) {
            next = p;
            nextDiffMins = pMins - currentMins;
            break;
        }
    }

    // If all prayers passed today, next is Fajr tomorrow
    if (!next) {
        next = prayerOrder[0];
        const [h, m] = next.time.split(':').map(Number);
        nextDiffMins = (24 * 60 - currentMins) + (h * 60 + m);
    }

    nextPrayerKey = next.key;

    // Highlight next prayer card
    document.querySelectorAll('.prayer-card').forEach(c => {
        if (c.getAttribute('data-prayer') === next.key) {
            c.classList.add('is-next');
        } else {
            c.classList.remove('is-next');
        }
    });

    const nameEl = document.getElementById('nextPrayerName');
    const countdownEl = document.getElementById('nextPrayerCountdown');

    if (nameEl) nameEl.textContent = `${next.name} (${next.time})`;

    if (countdownEl) {
        const totalSecsRemaining = (nextDiffMins * 60) - currentSecs;
        if (totalSecsRemaining > 0) {
            const hrs = Math.floor(totalSecsRemaining / 3600);
            const mins = Math.floor((totalSecsRemaining % 3600) / 60);
            const secs = totalSecsRemaining % 60;
            countdownEl.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        } else {
            countdownEl.textContent = 'حان الآن وقت الصلاة!';
        }
    }
}

// ==================== USER TASKS (NO DUMMY TASKS ADDED) ====================
function loadUserData() {
    const stored = localStorage.getItem('munazzem_tasks');
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            tasks = [];
        }
    } else {
        // User requested: clean slate, no dummy tasks!
        tasks = [];
    }

    // Pomodoro stats
    pomoCompletedSessions = parseInt(localStorage.getItem('munazzem_pomo_sessions') || '0');
    pomoTotalMinutes = parseInt(localStorage.getItem('munazzem_pomo_minutes') || '0');
    updatePomoStatsUI();

    // Volume
    const savedVol = localStorage.getItem('munazzem_volume');
    if (savedVol !== null) {
        masterVolume = parseFloat(savedVol);
        const slider = document.getElementById('masterVolumeSlider');
        const label = document.getElementById('volumeValueLabel');
        if (slider) slider.value = Math.round(masterVolume * 100);
        if (label) label.textContent = `${Math.round(masterVolume * 100)}%`;
    }
}

function saveTasks() {
    localStorage.setItem('munazzem_tasks', JSON.stringify(tasks));
    renderTasks();
    renderStats();
    updateTimeline();
}

let currentFilter = 'all';
let searchQuery = '';

function renderTasks() {
    const container = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;

    let filtered = tasks.filter(t => {
        if (currentFilter === 'worship' && t.category !== 'worship') return false;
        if (currentFilter === 'study' && t.category !== 'study') return false;
        if (currentFilter === 'fitness' && t.category !== 'fitness') return false;
        if (currentFilter === 'personal' && t.category !== 'personal') return false;
        if (currentFilter === 'completed' && !t.completed) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q));
        }
        return true;
    });

    filtered.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const timeA = `${a.date || ''} ${a.time || ''}`;
        const timeB = `${b.date || ''} ${b.time || ''}`;
        return timeA.localeCompare(timeB);
    });

    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = filtered.map(t => createTaskCardHtml(t)).join('');
    lucide.createIcons();
}

function createTaskCardHtml(task) {
    const isCompleted = task.completed;

    const categoryConfig = {
        worship: { label: 'طاعة وعبادة', icon: 'heart-handshake', bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
        study: { label: 'مذاكرة', icon: 'book-open', bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
        fitness: { label: 'رياضة وجيم', icon: 'dumbbell', bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
        personal: { label: 'شخصي', icon: 'calendar-check', bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' }
    }[task.category] || { label: 'عام', icon: 'tag', bg: 'bg-slate-50 text-slate-600' };

    const priorityLabels = {
        high: '<span class="text-[11px] font-bold px-2 py-0.5 rounded-full badge-high">عالية جداً 🔥</span>',
        medium: '<span class="text-[11px] font-bold px-2 py-0.5 rounded-full badge-medium">متوسطة</span>',
        normal: '<span class="text-[11px] font-bold px-2 py-0.5 rounded-full badge-normal">عادية</span>'
    }[task.priority || 'normal'];

    const timeFormatted = task.time ? `<span class="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300"><i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i> ${task.time}</span>` : '';
    const dateFormatted = task.date ? `<span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i> ${task.date}</span>` : '';

    return `
    <div class="task-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition hover:shadow-md ${isCompleted ? 'opacity-60 bg-slate-50 dark:bg-slate-900/40' : ''}" data-id="${task.id}">
        <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 flex-1">
                <!-- Checkbox -->
                <button onclick="toggleTaskComplete('${task.id}')" class="mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-600'}">
                    ${isCompleted ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}
                </button>

                <div class="flex-1 space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs px-2.5 py-0.5 rounded-lg font-bold border flex items-center gap-1 ${categoryConfig.bg}">
                            <i data-lucide="${categoryConfig.icon}" class="w-3.5 h-3.5"></i>
                            ${categoryConfig.label}
                        </span>
                        ${priorityLabels}
                        ${task.sound ? `<span class="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1"><i data-lucide="volume-2" class="w-3 h-3"></i> ${getSoundName(task.sound)}</span>` : ''}
                    </div>

                    <h4 class="text-sm font-bold text-slate-900 dark:text-white ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}">
                        ${escapeHtml(task.title)}
                    </h4>

                    ${task.notes ? `<p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${escapeHtml(task.notes)}</p>` : ''}

                    <div class="flex items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                        ${dateFormatted}
                        ${timeFormatted}
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1">
                <button onclick="testTaskSound('${task.sound || 'chime'}')" class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="تجربة الصوت">
                    <i data-lucide="play" class="w-4 h-4"></i>
                </button>
                <button onclick="editTask('${task.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="تعديل">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="حذف">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    </div>
    `;
}

function getSoundName(sound) {
    const names = {
        adhan: 'تكبيرات الأذان',
        bell: 'جرس',
        chime: 'لطيفة',
        digital: 'رقمي',
        energetic: 'حماسي',
        zen: 'زن'
    };
    return names[sound] || sound;
}

function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const studyCount = tasks.filter(t => t.category === 'study' && !t.completed).length;
    const fitnessCount = tasks.filter(t => t.category === 'fitness' && !t.completed).length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statStudy').textContent = studyCount;
    document.getElementById('statFitness').textContent = fitnessCount;
}

// ==================== REMINDER & ALARM ENGINE ====================
let lastCheckedMinute = '';

function checkReminders() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDay = String(now.getDate()).padStart(2, '0');
    const currentDateStr = `${currentYear}-${currentMonth}-${currentDay}`;

    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    // 1. Check Prayer Times for Adhan Reminder
    if (currentTimeStr !== lastCheckedMinute) {
        lastCheckedMinute = currentTimeStr;

        const prayerNames = { fajr: 'صلاة الفجر', dhuhr: 'صلاة الظهر', asr: 'صلاة العصر', maghrib: 'صلاة المغرب', isha: 'صلاة العشاء' };
        for (let [pKey, pTime] of Object.entries(prayerTimes)) {
            if (pKey === 'sunrise') continue;
            if (pTime === currentTimeStr) {
                // Prayer Time Arrived!
                triggerPrayerAlarm(prayerNames[pKey] || pKey);
            }
        }
    }

    // 2. Check User Tasks
    tasks.forEach(task => {
        if (task.completed || task.notified || !task.time) return;
        if (task.date && task.date > currentDateStr) return;

        if (task.time <= currentTimeStr) {
            triggerTaskReminder(task);
        }
    });
}

function triggerPrayerAlarm(prayerName) {
    sounds.play('adhan');

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🕌 حان الآن موعد ${prayerName}!`, {
            body: '«حي على الصلاة، حي على الفلاح» — بارك الله في وقتك ورزقك القبول.',
            icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
            requireInteraction: true
        });
    }

    showActiveAlertBanner({
        title: `🕌 حان الآن موعد ${prayerName}`,
        notes: '«إن الصلاة كانت على المؤمنين كتاباً موقوتاً» — أرحنا بها يا بلال.',
        id: null
    });
}

function triggerTaskReminder(task) {
    task.notified = true;
    saveTasks();

    sounds.play(task.sound || 'chime');

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🔔 تذكير: ${task.title}`, {
            body: task.notes || 'حان موعد هذه المهمة الآن حسب جدولك.',
            icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
            requireInteraction: true
        });
    }

    showActiveAlertBanner(task);
}

function showActiveAlertBanner(task) {
    activeAlertTask = task;
    const banner = document.getElementById('activeAlertBanner');
    const title = document.getElementById('alertTitle');
    const notes = document.getElementById('alertNotes');

    title.textContent = task.title;
    notes.textContent = task.notes || 'تذكير في الموعد المحدد';

    banner.classList.add('show');
}

function dismissActiveAlert() {
    const banner = document.getElementById('activeAlertBanner');
    banner.classList.remove('show');
    activeAlertTask = null;
}

// ==================== TIMELINE VIEW ====================
function updateTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // Combine Prayer Times + User Tasks
    let items = [];

    // Add Prayers
    const prayerNames = [
        { name: 'صلاة الفجر', time: prayerTimes.fajr, icon: 'sunrise', type: 'prayer' },
        { name: 'صلاة الظهر', time: prayerTimes.dhuhr, icon: 'sun-medium', type: 'prayer' },
        { name: 'صلاة العصر', time: prayerTimes.asr, icon: 'cloud-sun', type: 'prayer' },
        { name: 'صلاة المغرب', time: prayerTimes.maghrib, icon: 'sunset', type: 'prayer' },
        { name: 'صلاة العشاء', time: prayerTimes.isha, icon: 'moon', type: 'prayer' }
    ];

    prayerNames.forEach(p => {
        if (p.time) items.push(p);
    });

    // Add User Tasks for Today
    const todaysTasks = tasks.filter(t => !t.date || t.date === todayStr);
    todaysTasks.forEach(t => {
        items.push({
            name: t.title,
            time: t.time || '--:--',
            category: t.category,
            completed: t.completed,
            id: t.id,
            type: 'task'
        });
    });

    // Sort chronologically
    items.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

    container.innerHTML = items.map(item => {
        if (item.type === 'prayer') {
            return `
            <div class="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        <i data-lucide="${item.icon}" class="w-4 h-4"></i>
                    </div>
                    <div>
                        <h5 class="text-xs font-black text-emerald-900 dark:text-emerald-200">${item.name}</h5>
                        <p class="text-[11px] text-emerald-700/70 dark:text-emerald-400 font-mono">الساعة: ${item.time}</p>
                    </div>
                </div>
                <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60">فريضة 🕌</span>
            </div>
            `;
        } else {
            return `
            <div class="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
                        ${item.time.substring(0, 2)}
                    </div>
                    <div>
                        <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 ${item.completed ? 'line-through opacity-50' : ''}">
                            ${escapeHtml(item.name)}
                        </h5>
                        <p class="text-[11px] text-slate-400 font-mono">الساعة: ${item.time}</p>
                    </div>
                </div>
                <div>
                    ${item.completed ? '<span class="text-xs font-bold text-emerald-600">مكتمل ✅</span>' : `<button onclick="toggleTaskComplete('${item.id}')" class="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white transition font-bold">إنجاز</button>`}
                </div>
            </div>
            `;
        }
    }).join('');

    lucide.createIcons();
}

// ==================== AZKAR (حصن المسلم) ====================
const azkarData = {
    afterPrayer: [
        { text: 'أَسْتَغْفِرُ اللهَ، أَسْتَغْفِرُ اللهَ، أَسْتَغْفِرُ اللهَ. اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الجَلَالِ وَالإِكْرَامِ.', count: 1 },
        { text: 'لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.', count: 1 },
        { text: 'سُبْحَانَ اللهِ (33 مرة) ، الحَمْدُ لِلَّهِ (33 مرة) ، اللهُ أَكْبَرُ (33 مرة). وتمام المائة: لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.', count: 1 },
        { text: 'قراءة آية الكرسي: «اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...» (من قرأها دبر كل صلاة لم يمنعه من دخول الجنة إلا أن يموت).', count: 1 }
    ],
    morning: [
        { text: 'أَصْبَحْنَا وَأَصْبَحَ المُلْكُ لِلَّهِ، وَالحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.', count: 1 },
        { text: 'سَيِّدُ الاِسْتِغْفَارِ: «اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ».', count: 1 },
        { text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.', count: 3 },
        { text: 'رَضِيتُ بِاللَّهِ رَبَّاً، وَبِالإِسْلاَمِ دِيناً، وَبِمُحَمَّدٍ ﷺ نَبِيّاً.', count: 3 }
    ],
    evening: [
        { text: 'أَمْسَيْنَا وَأَمْسَى المُلْكُ لِلَّهِ، وَالحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ.', count: 1 },
        { text: 'أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.', count: 3 },
        { text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ المَصِيرُ.', count: 1 }
    ]
};

function renderAzkar(cat = 'afterPrayer') {
    const container = document.getElementById('azkarContentList');
    if (!container) return;

    const list = azkarData[cat] || azkarData.afterPrayer;
    container.innerHTML = list.map((item, index) => `
        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <p class="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-semibold leading-relaxed">
                ${item.text}
            </p>
            <div class="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">التكرار: ${item.count} مرة</span>
                <button onclick="this.classList.toggle('bg-emerald-600'); this.classList.toggle('text-white')" class="px-2.5 py-1 rounded-lg border border-emerald-500 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold transition">
                    تمت القراءة ✓
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== POMODORO TIMER ====================
function switchPomoMode(mode) {
    pomoMode = mode;
    document.querySelectorAll('.pomo-mode').forEach(b => b.classList.remove('active', 'bg-indigo-600', 'text-white'));
    document.querySelectorAll('.pomo-mode').forEach(b => b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300'));

    let activeBtn;
    if (mode === 'focus') {
        pomoDuration = 25 * 60;
        activeBtn = document.getElementById('pomoModeFocus');
        document.getElementById('pomoStatusText').textContent = 'جاهز للمذاكرة والتركيز!';
    } else if (mode === 'shortBreak') {
        pomoDuration = 5 * 60;
        activeBtn = document.getElementById('pomoModeShortBreak');
        document.getElementById('pomoStatusText').textContent = 'استراحة قصيرة — تنفس بعمق واشرب الماء';
    } else {
        pomoDuration = 15 * 60;
        activeBtn = document.getElementById('pomoModeLongBreak');
        document.getElementById('pomoStatusText').textContent = 'استراحة طويلة — رائع ما أنجزته!';
    }

    if (activeBtn) {
        activeBtn.classList.add('active', 'bg-indigo-600', 'text-white');
        activeBtn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
    }

    resetPomo();
}

function togglePomo() {
    sounds.initContext();
    if (pomoTimerId) {
        clearInterval(pomoTimerId);
        pomoTimerId = null;
        document.getElementById('pomoBtnLabel').textContent = 'استئناف';
    } else {
        pomoTimerId = setInterval(pomoTick, 1000);
        document.getElementById('pomoBtnLabel').textContent = 'إيقاف مؤقت';
    }
}

function pomoTick() {
    if (pomoTimeLeft > 0) {
        pomoTimeLeft--;
        updatePomoDisplay();
    } else {
        clearInterval(pomoTimerId);
        pomoTimerId = null;
        document.getElementById('pomoBtnLabel').textContent = 'بدء الجلسة';

        sounds.play('bell');

        if (pomoMode === 'focus') {
            pomoCompletedSessions++;
            pomoTotalMinutes += 25;
            localStorage.setItem('munazzem_pomo_sessions', pomoCompletedSessions.toString());
            localStorage.setItem('munazzem_pomo_minutes', pomoTotalMinutes.toString());
            updatePomoStatsUI();

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🎉 أحسنت! انتهت جلسة المذاكرة', {
                    body: 'حان وقت الراحة القصيرة لمدة 5 دقائق.',
                    icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png'
                });
            }
            switchPomoMode('shortBreak');
        } else {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⏰ انتهت الاستراحة!', {
                    body: 'حان وقت العودة لجلسة المذاكرة والتركيز.',
                    icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png'
                });
            }
            switchPomoMode('focus');
        }
    }
}

function resetPomo() {
    if (pomoTimerId) {
        clearInterval(pomoTimerId);
        pomoTimerId = null;
    }
    pomoTimeLeft = pomoDuration;
    document.getElementById('pomoBtnLabel').textContent = 'بدء الجلسة';
    updatePomoDisplay();
}

function updatePomoDisplay() {
    const mins = Math.floor(pomoTimeLeft / 60);
    const secs = pomoTimeLeft % 60;
    const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById('pomoTimeDisplay').textContent = str;
}

function updatePomoStatsUI() {
    const countEl = document.getElementById('pomoSessionCount');
    const minsEl = document.getElementById('pomoTotalMinutes');
    if (countEl) countEl.textContent = pomoCompletedSessions;
    if (minsEl) minsEl.textContent = `${pomoTotalMinutes} د`;
}

// ==================== WORKOUT REST TIMER ====================
function setWorkoutDuration(seconds, btn) {
    workoutDuration = seconds;
    document.querySelectorAll('.workout-preset').forEach(b => {
        b.classList.remove('active', 'bg-rose-600', 'text-white');
        b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
    });
    if (btn) {
        btn.classList.add('active', 'bg-rose-600', 'text-white');
        btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
    }
    resetWorkout();
}

function toggleWorkout() {
    sounds.initContext();
    if (workoutTimerId) {
        clearInterval(workoutTimerId);
        workoutTimerId = null;
        document.getElementById('workoutBtnLabel').textContent = 'استئناف';
    } else {
        workoutTimerId = setInterval(workoutTick, 1000);
        document.getElementById('workoutBtnLabel').textContent = 'إيقاف مؤقت';
    }
}

function workoutTick() {
    if (workoutTimeLeft > 0) {
        workoutTimeLeft--;
        updateWorkoutDisplay();

        if (workoutTimeLeft === 3 || workoutTimeLeft === 2 || workoutTimeLeft === 1) {
            sounds.play('shortBeep');
        }
    } else {
        clearInterval(workoutTimerId);
        workoutTimerId = null;
        document.getElementById('workoutBtnLabel').textContent = 'بدء مؤقت الراحة';
        sounds.play('energetic');

        document.getElementById('workoutStatusText').textContent = '🔥 انتهت فترة الراحة! ابدأ مجموعتك التالية الآن!';

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('💪 انتهت الراحة! ابدأ جولتك التالية', {
                body: 'حافظ على حماسك وتركيزك في التمرين.',
                icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png'
            });
        }
        workoutTimeLeft = workoutDuration;
        updateWorkoutDisplay();
    }
}

function resetWorkout() {
    if (workoutTimerId) {
        clearInterval(workoutTimerId);
        workoutTimerId = null;
    }
    workoutTimeLeft = workoutDuration;
    document.getElementById('workoutBtnLabel').textContent = 'بدء مؤقت الراحة';
    document.getElementById('workoutStatusText').textContent = 'جاهز لبدء الراحة بعد التمرين';
    updateWorkoutDisplay();
}

function updateWorkoutDisplay() {
    const mins = Math.floor(workoutTimeLeft / 60);
    const secs = workoutTimeLeft % 60;
    const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById('workoutTimeDisplay').textContent = str;
}

// ==================== TASK MODAL ====================
function openTaskModal(taskId = null) {
    sounds.initContext();
    const modal = document.getElementById('taskModal');
    const titleEl = document.getElementById('modalTitle');
    const form = document.getElementById('taskForm');

    form.reset();
    document.getElementById('editTaskId').value = '';

    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('taskDate').value = todayStr;

    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            titleEl.innerHTML = '<i data-lucide="edit-3" class="w-5 h-5 text-emerald-600"></i> تعديل المهمة';
            document.getElementById('editTaskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDate').value = task.date || todayStr;
            document.getElementById('taskTime').value = task.time || '';
            document.getElementById('taskSound').value = task.sound || 'chime';
            document.getElementById('taskPriority').value = task.priority || 'normal';
            document.getElementById('taskNotes').value = task.notes || '';

            const catRadio = document.querySelector(`input[name="taskCategory"][value="${task.category}"]`);
            if (catRadio) catRadio.checked = true;
        }
    } else {
        titleEl.innerHTML = '<i data-lucide="plus-circle" class="w-5 h-5 text-emerald-600"></i> إضافة مهمة جديدة';
    }

    modal.classList.remove('hidden');
    lucide.createIcons();
    document.getElementById('taskTitle').focus();
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
}

function handleTaskFormSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('editTaskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const category = document.querySelector('input[name="taskCategory"]:checked').value;
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const sound = document.getElementById('taskSound').value;
    const priority = document.getElementById('taskPriority').value;
    const notes = document.getElementById('taskNotes').value.trim();

    if (!title) return;

    if (editId) {
        const index = tasks.findIndex(t => t.id === editId);
        if (index !== -1) {
            tasks[index] = {
                ...tasks[index],
                title,
                category,
                date,
                time,
                sound,
                priority,
                notes,
                notified: false
            };
        }
    } else {
        const newTask = {
            id: Date.now().toString(),
            title,
            category,
            date,
            time,
            sound,
            priority,
            notes,
            completed: false,
            notified: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }

    saveTasks();
    closeTaskModal();
}

function toggleTaskComplete(id) {
    sounds.initContext();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            sounds.play('chime');
        }
        saveTasks();
    }
}

function deleteTask(id) {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
    }
}

function editTask(id) {
    openTaskModal(id);
}

function testTaskSound(soundType) {
    sounds.play(soundType);
}

// ==================== THEME & NOTIFICATIONS ====================
function initTheme() {
    const savedTheme = localStorage.getItem('munazzem_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('munazzem_theme', isDark ? 'dark' : 'light');
    lucide.createIcons();
}

function initNotifications() {
    updateNotificationButtonUI();
}

function updateNotificationButtonUI() {
    const btn = document.getElementById('notifyBtn');
    const statusText = document.getElementById('notifyStatusText');
    if (!('Notification' in window)) {
        if (statusText) statusText.textContent = 'الإشعارات غير مدعومة';
        return;
    }

    if (Notification.permission === 'granted') {
        if (statusText) statusText.textContent = 'التنبيهات مفعّلة ✅';
        if (btn) btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition shadow-xs';
    } else {
        if (statusText) statusText.textContent = 'تفعيل التنبيهات 🔔';
        if (btn) btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition shadow-xs';
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    sounds.initContext();
    try {
        const perm = await Notification.requestPermission();
        updateNotificationButtonUI();
        if (perm === 'granted') {
            sounds.play('adhan');
            new Notification('مُنظِّم — جاهز للتنبيه!', {
                body: 'تم تفعيل التنبيهات بنجاح. سنذكرك بمواقيت الصلاة ومواعيد المذاكرة والرياضة بدقة.',
                icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png'
            });
        }
    } catch (e) {
        console.error(e);
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('notifyBtn').addEventListener('click', requestNotificationPermission);

    // City change
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.addEventListener('change', async (e) => {
            selectedLocation = e.target.value;
            localStorage.setItem('munazzem_city', selectedLocation);
            await fetchPrayerTimes();
            updatePrayerUI();
            updateTimeline();
        });
    }

    // Azkar Modal
    const azkarModal = document.getElementById('azkarModal');
    document.getElementById('openAzkarBtn').addEventListener('click', () => {
        renderAzkar('afterPrayer');
        azkarModal.classList.remove('hidden');
    });
    document.getElementById('closeAzkarModalBtn').addEventListener('click', () => {
        azkarModal.classList.add('hidden');
    });
    document.querySelectorAll('.azkar-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.azkar-tab').forEach(t => {
                t.classList.remove('active', 'bg-emerald-100', 'text-emerald-800', 'dark:bg-emerald-950', 'dark:text-emerald-300', 'font-bold');
                t.classList.add('font-medium', 'text-slate-600', 'dark:text-slate-400');
            });
            tab.classList.add('active', 'bg-emerald-100', 'text-emerald-800', 'dark:bg-emerald-950', 'dark:text-emerald-300', 'font-bold');
            tab.classList.remove('font-medium', 'text-slate-600', 'dark:text-slate-400');
            renderAzkar(tab.getAttribute('data-cat'));
        });
    });

    // Task Modal
    document.getElementById('openNewTaskBtn').addEventListener('click', () => openTaskModal());
    document.getElementById('closeModalBtn').addEventListener('click', closeTaskModal);
    document.getElementById('cancelTaskBtn').addEventListener('click', closeTaskModal);
    document.getElementById('taskForm').addEventListener('submit', handleTaskFormSubmit);

    document.getElementById('previewTaskSoundBtn').addEventListener('click', () => {
        const s = document.getElementById('taskSound').value;
        sounds.play(s);
    });

    // Audio Modal
    const audioModal = document.getElementById('audioModal');
    document.getElementById('audioSettingsModalBtn').addEventListener('click', () => {
        sounds.initContext();
        audioModal.classList.remove('hidden');
    });
    document.getElementById('closeAudioModalBtn').addEventListener('click', () => {
        audioModal.classList.add('hidden');
    });

    // Master volume slider
    const volSlider = document.getElementById('masterVolumeSlider');
    const volLabel = document.getElementById('volumeValueLabel');
    volSlider.addEventListener('input', (e) => {
        masterVolume = e.target.value / 100;
        volLabel.textContent = `${e.target.value}%`;
        localStorage.setItem('munazzem_volume', masterVolume.toString());
    });

    document.querySelectorAll('.test-sound-row').forEach(row => {
        row.addEventListener('click', () => {
            sounds.play(row.getAttribute('data-sound'));
        });
    });

    // Workspace tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active', 'bg-emerald-600', 'text-white');
                b.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-700', 'dark:text-slate-300');
            });
            btn.classList.add('active', 'bg-emerald-600', 'text-white');
            btn.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-700', 'dark:text-slate-300');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');
            lucide.createIcons();
        });
    });

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(p => {
                p.classList.remove('active', 'bg-emerald-100', 'text-emerald-800', 'dark:bg-emerald-950', 'dark:text-emerald-300', 'font-bold');
                p.classList.add('font-medium', 'text-slate-600', 'dark:text-slate-400');
            });
            pill.classList.add('active', 'bg-emerald-100', 'text-emerald-800', 'dark:bg-emerald-950', 'dark:text-emerald-300', 'font-bold');
            pill.classList.remove('font-medium', 'text-slate-600', 'dark:text-slate-400');

            currentFilter = pill.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderTasks();
    });

    // Pomodoro Controls
    document.getElementById('pomoToggleBtn').addEventListener('click', togglePomo);
    document.getElementById('pomoResetBtn').addEventListener('click', resetPomo);
    document.getElementById('pomoModeFocus').addEventListener('click', () => switchPomoMode('focus'));
    document.getElementById('pomoModeShortBreak').addEventListener('click', () => switchPomoMode('shortBreak'));
    document.getElementById('pomoModeLongBreak').addEventListener('click', () => switchPomoMode('longBreak'));

    // Workout Controls
    document.getElementById('workoutToggleBtn').addEventListener('click', toggleWorkout);
    document.getElementById('workoutResetBtn').addEventListener('click', resetWorkout);
    document.querySelectorAll('.workout-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            setWorkoutDuration(parseInt(btn.getAttribute('data-sec')), btn);
        });
    });

    // Active alert banner actions
    document.getElementById('dismissAlertBtn').addEventListener('click', dismissActiveAlert);
    document.getElementById('completeAlertTaskBtn').addEventListener('click', () => {
        if (activeAlertTask && activeAlertTask.id) {
            toggleTaskComplete(activeAlertTask.id);
        }
        dismissActiveAlert();
    });
    document.getElementById('snoozeAlertTaskBtn').addEventListener('click', () => {
        if (activeAlertTask && activeAlertTask.id) {
            const now = new Date(Date.now() + 5 * 60000);
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            activeAlertTask.time = `${hours}:${minutes}`;
            activeAlertTask.notified = false;
            saveTasks();
        }
        dismissActiveAlert();
    });

    // Export & Import backup
    document.getElementById('exportDataBtn').addEventListener('click', exportBackup);
    document.getElementById('importDataBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', importBackup);
}

// Backup & Restore
function exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `munazzem_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
}

function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const imported = JSON.parse(evt.target.result);
            if (Array.isArray(imported)) {
                tasks = imported;
                saveTasks();
                alert('تم استيراد البيانات بنجاح!');
            } else {
                alert('الملف غير صالح');
            }
        } catch (err) {
            alert('حدث خطأ أثناء قراءة الملف');
        }
    };
    reader.readAsText(file);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
