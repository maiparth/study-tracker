// ============================================================
//  StudyTracker – Pomodoro Timer (timer.js)
// ============================================================

const FOCUS_DURATION = 25 * 60;   // 1500 seconds
const BREAK_DURATION = 5 * 60;   //  300 seconds
const CIRCUMFERENCE = 2 * Math.PI * 108; // ≈ 678.6
const TIMER_STORAGE_KEY = 'studytracker.timerState';

// ---- State ----
let taskName = '';
let timerInterval = null;
let secondsLeft = FOCUS_DURATION;
let totalSecondsElapsed = 0;
let isBreak = false;
let pomodoros = 0;
let running = false;
let breakCountdownId = null;
let sessionStartAt = null;
let pausedAccumulatedMs = 0;
let currentPhaseEndsAt = null;
let pausedAt = null;

// ---- DOM refs ----
const taskInput = document.getElementById('taskNameInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resumeBtn = document.getElementById('resumeBtn');
const doneBtn = document.getElementById('doneBtn');
const statsBtn = document.getElementById('statsBtn')
const timerDisplay = document.getElementById('timerDisplay');
const timerMode = document.getElementById('timerMode');
const pomodoroCount = document.getElementById('pomodoroCount');
const ringProgress = document.getElementById('ringProgress');
const timerSection = document.getElementById('timerSection');
const taskInputSec = document.getElementById('taskInputSection');
const timerTaskBadge = document.getElementById('timerTaskBadge');
const congratsModal = document.getElementById('congratsModal');
const breakModal = document.getElementById('breakModal');
const breakTimerDisp = document.getElementById('breakTimerDisplay');

// ---- Storage helpers ----
function saveTimerState() {
  if (!taskName) {
    localStorage.removeItem(TIMER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
    taskName,
    secondsLeft,
    totalSecondsElapsed,
    isBreak,
    pomodoros,
    running,
    sessionStartAt,
    pausedAccumulatedMs,
    currentPhaseEndsAt,
    pausedAt,
  }));
}

function clearTimerState() {
  localStorage.removeItem(TIMER_STORAGE_KEY);
}

function loadTimerState() {
  const rawState = localStorage.getItem(TIMER_STORAGE_KEY);
  if (!rawState) return null;

  try {
    return JSON.parse(rawState);
  } catch (error) {
    clearTimerState();
    return null;
  }
}

function getTotalElapsedSeconds(now = Date.now()) {
  if (sessionStartAt == null) return totalSecondsElapsed;
  const pausedMs = pausedAccumulatedMs + (pausedAt ? (now - pausedAt) : 0);
  return Math.max(0, Math.floor((now - sessionStartAt - pausedMs) / 1000));
}

function getRemainingSeconds(now = Date.now()) {
  if (!running || currentPhaseEndsAt == null) {
    return secondsLeft;
  }
  return Math.max(0, Math.ceil((currentPhaseEndsAt - now) / 1000));
}

function applyModeToUI() {
  timerMode.textContent = isBreak ? 'BREAK' : 'FOCUS';
  pomodoroCount.textContent = `🍅 Round ${isBreak ? pomodoros : pomodoros + 1}`;
  ringProgress.style.stroke = isBreak ? '#a78bfa' : '#e07a5f';
}

function advancePhase(now = Date.now()) {
  if (!currentPhaseEndsAt) return;

  while (currentPhaseEndsAt && now >= currentPhaseEndsAt) {
    if (!isBreak) {
      pomodoros += 1;
      isBreak = true;
      currentPhaseEndsAt += BREAK_DURATION * 1000;
      showBreakModal();
    } else {
      isBreak = false;
      currentPhaseEndsAt += FOCUS_DURATION * 1000;
      hideBreakModal();
    }
  }

  secondsLeft = getRemainingSeconds(now);
  totalSecondsElapsed = getTotalElapsedSeconds(now);
}

function restoreTimerUI() {
  taskInputSec.classList.add('hidden');
  timerSection.classList.remove('hidden');
  timerTaskBadge.textContent = taskName;

  if (running && currentPhaseEndsAt != null) {
    advancePhase();
    startCountdown();
    startElapsedCounter();
    if (isBreak) {
      showBreakModal();
    } else {
      hideBreakModal();
    }
  } else {
    clearInterval(timerInterval);
    stopBtn.classList.add('hidden');
    resumeBtn.classList.remove('hidden');
    hideBreakModal();
  }

  updateDisplay();
}

// ---- Listeners ----
taskInput.addEventListener('input', () => {
  startBtn.disabled = taskInput.value.trim().length === 0;
});

taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !startBtn.disabled) startTimer();
});

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', pauseTimer);
resumeBtn.addEventListener('click', resumeTimer);
doneBtn.addEventListener('click', markDone);
statsBtn.addEventListener('click', resetAll);
document.getElementById('modalNewTask')
  .addEventListener('click', resetAll);

window.addEventListener('beforeunload', saveTimerState);

const storedState = loadTimerState();
if (storedState && storedState.taskName) {
  taskName = storedState.taskName || '';
  secondsLeft = storedState.secondsLeft ?? FOCUS_DURATION;
  totalSecondsElapsed = storedState.totalSecondsElapsed ?? 0;
  isBreak = Boolean(storedState.isBreak);
  pomodoros = storedState.pomodoros ?? 0;
  running = Boolean(storedState.running);
  sessionStartAt = storedState.sessionStartAt ?? null;
  pausedAccumulatedMs = storedState.pausedAccumulatedMs ?? 0;
  currentPhaseEndsAt = storedState.currentPhaseEndsAt ?? null;
  pausedAt = storedState.pausedAt ?? null;

  if (running && currentPhaseEndsAt) {
    advancePhase();
  }

  restoreTimerUI();
}

// ============================================================
//  CORE FUNCTIONS
// ============================================================

function startTimer() {
  taskName = taskInput.value.trim();
  if (!taskName) return;

  taskInputSec.classList.add('hidden');
  timerSection.classList.remove('hidden');
  timerTaskBadge.textContent = taskName;

  isBreak = false;
  secondsLeft = FOCUS_DURATION;
  pomodoros = 0;
  totalSecondsElapsed = 0;
  running = true;
  sessionStartAt = Date.now();
  pausedAccumulatedMs = 0;
  currentPhaseEndsAt = Date.now() + FOCUS_DURATION * 1000;
  pausedAt = null;

  startCountdown();
  startElapsedCounter();
  saveTimerState();
}

function startCountdown() {
  running = true;
  clearInterval(timerInterval);
  stopBtn.classList.remove('hidden');
  resumeBtn.classList.add('hidden');
  timerInterval = setInterval(tick, 1000);
  if (currentPhaseEndsAt == null) {
    currentPhaseEndsAt = Date.now() + secondsLeft * 1000;
  }
  updateDisplay();
}

function tick() {
  if (!running) return;

  advancePhase();
  if (secondsLeft <= 0) {
    if (!isBreak) {
      pomodoros++;
      beginBreak();
    } else {
      hideBreakModal();
      isBreak = false;
      secondsLeft = FOCUS_DURATION;
      currentPhaseEndsAt = Date.now() + FOCUS_DURATION * 1000;
      startCountdown();
    }
    saveTimerState();
    return;
  }

  updateDisplay();
  saveTimerState();
}

function updateDisplay() {
  secondsLeft = getRemainingSeconds();
  totalSecondsElapsed = getTotalElapsedSeconds();

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  timerDisplay.textContent =
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  applyModeToUI();

  const total = isBreak ? BREAK_DURATION : FOCUS_DURATION;
  const fraction = secondsLeft / total;
  ringProgress.style.strokeDashoffset = CIRCUMFERENCE * fraction;
}

function pauseTimer() {
  clearInterval(timerInterval);
  running = false;
  pausedAt = Date.now();
  currentPhaseEndsAt = null;
  stopBtn.classList.add('hidden');
  resumeBtn.classList.remove('hidden');
  saveTimerState();
}

function resumeTimer() {
  if (pausedAt) {
    pausedAccumulatedMs += Date.now() - pausedAt;
    pausedAt = null;
  }

  running = true;
  stopBtn.classList.remove('hidden');
  resumeBtn.classList.add('hidden');
  currentPhaseEndsAt = Date.now() + secondsLeft * 1000;
  timerInterval = setInterval(tick, 1000);
  saveTimerState();
}

function startElapsedCounter() {
  clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
}

// ============================================================
//  BREAK FLOW
// ============================================================

function beginBreak() {
  isBreak = true;
  secondsLeft = BREAK_DURATION;
  currentPhaseEndsAt = Date.now() + BREAK_DURATION * 1000;
  updateDisplay();
  showBreakModal();
  // Break countdown inside modal
  let breakLeft = BREAK_DURATION;
  updateBreakDisplay(breakLeft);
  clearInterval(breakCountdownId);
  breakCountdownId = setInterval(() => {
    breakLeft--;
    updateBreakDisplay(breakLeft);
    if (breakLeft <= 0) {
      clearInterval(breakCountdownId);
      // tick() will handle transition when ring timer also hits 0
      // but we drive it from here to sync:
      hideBreakModal();
      secondsLeft = 0; // force tick() transition on next call
      tick();
      saveTimerState();
    }
  }, 1000);
}

function updateBreakDisplay(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  breakTimerDisp.textContent =
    `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function showBreakModal() {
  breakModal.classList.remove('hidden');
}

function hideBreakModal() {
  breakModal.classList.add('hidden');
}

// ============================================================
//  DONE / SAVE
// ============================================================

async function markDone() {
  clearInterval(timerInterval);
  clearInterval(breakCountdownId);
  hideBreakModal();

  totalSecondsElapsed = getTotalElapsedSeconds();
  pomodoros = Math.max(pomodoros, 1); // at least 1

  // Save to Django backend
  try {
    const resp = await fetch(SAVE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': CSRF_TOKEN
      },
      body: JSON.stringify({
        task_name: taskName,
        time_taken_seconds: totalSecondsElapsed,
        pomodoros: pomodoros
      })
    });
    if (!resp.ok) console.warn('Save failed', await resp.text());
  } catch (err) {
    console.error('Network error saving session:', err);
  }

  // Populate & show congratulations modal
  document.getElementById('modalTaskName').textContent = `"${taskName}"`;
  document.getElementById('modalPomodoros').textContent = `🍅 × ${pomodoros}`;
  const m = Math.floor(totalSecondsElapsed / 60);
  const s = totalSecondsElapsed % 60;
  document.getElementById('modalTimeTaken').textContent =
    `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;

  congratsModal.classList.remove('hidden');
  clearTimerState();
}

// ============================================================
//  RESET
// ============================================================

function resetAll() {
  congratsModal.classList.add('hidden');
  timerSection.classList.add('hidden');
  taskInputSec.classList.remove('hidden');

  taskInput.value = '';
  startBtn.disabled = true;

  clearInterval(timerInterval);
  clearInterval(breakCountdownId);
  running = false;
  taskName = '';
  secondsLeft = FOCUS_DURATION;
  totalSecondsElapsed = 0;
  isBreak = false;
  pomodoros = 0;
  sessionStartAt = null;
  pausedAccumulatedMs = 0;
  currentPhaseEndsAt = null;
  pausedAt = null;

  // Reset ring
  ringProgress.style.strokeDashoffset = 0;
  timerDisplay.textContent = '25:00';
  timerMode.textContent = 'FOCUS';
  clearTimerState();
}
