// ============================================================
//  StudyTracker – Pomodoro Timer (timer.js)
// ============================================================

const FOCUS_DURATION = 25 * 60;   // 1500 seconds
const BREAK_DURATION = 5  * 60;   //  300 seconds
const CIRCUMFERENCE  = 2 * Math.PI * 108; // ≈ 678.6

// ---- State ----
let taskName           = '';
let timerInterval      = null;
let elapsedInterval    = null;
let secondsLeft        = FOCUS_DURATION;
let totalSecondsElapsed = 0;
let isBreak            = false;
let pomodoros          = 0;
let running            = false;
let breakCountdownId   = null;

// ---- DOM refs ----
const taskInput       = document.getElementById('taskNameInput');
const startBtn        = document.getElementById('startBtn');
const stopBtn         = document.getElementById('stopBtn');
const resumeBtn       = document.getElementById('resumeBtn');
const doneBtn         = document.getElementById('doneBtn');
const timerDisplay    = document.getElementById('timerDisplay');
const timerMode       = document.getElementById('timerMode');
const pomodoroCount   = document.getElementById('pomodoroCount');
const ringProgress    = document.getElementById('ringProgress');
const timerSection    = document.getElementById('timerSection');
const taskInputSec    = document.getElementById('taskInputSection');
const timerTaskBadge  = document.getElementById('timerTaskBadge');
const congratsModal   = document.getElementById('congratsModal');
const breakModal      = document.getElementById('breakModal');
const breakTimerDisp  = document.getElementById('breakTimerDisplay');

// ---- Listeners ----
taskInput.addEventListener('input', () => {
  startBtn.disabled = taskInput.value.trim().length === 0;
});

taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !startBtn.disabled) startTimer();
});

startBtn.addEventListener('click',                startTimer);
stopBtn.addEventListener('click',                 pauseTimer);
resumeBtn.addEventListener('click',               resumeTimer);
doneBtn.addEventListener('click',                 markDone);
document.getElementById('modalNewTask')
        .addEventListener('click',                resetAll);

// ============================================================
//  CORE FUNCTIONS
// ============================================================

function startTimer() {
  taskName = taskInput.value.trim();
  if (!taskName) return;

  taskInputSec.classList.add('hidden');
  timerSection.classList.remove('hidden');
  timerTaskBadge.textContent = taskName;

  isBreak              = false;
  secondsLeft          = FOCUS_DURATION;
  pomodoros            = 0;
  totalSecondsElapsed  = 0;

  startCountdown();
  startElapsedCounter();
}

function startCountdown() {
  running = true;
  clearInterval(timerInterval);
  stopBtn.classList.remove('hidden');
  resumeBtn.classList.add('hidden');
  timerInterval = setInterval(tick, 1000);
  updateDisplay();
}

function tick() {
  if (secondsLeft <= 0) {
    clearInterval(timerInterval);
    running = false;

    if (!isBreak) {
      // Focus session ended → break
      pomodoros++;
      beginBreak();
    } else {
      // Break ended → next focus session
      hideBreakModal();
      isBreak     = false;
      secondsLeft = FOCUS_DURATION;
      startCountdown();
    }
    return;
  }
  secondsLeft--;
  updateDisplay();
}

function updateDisplay() {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  timerDisplay.textContent =
    `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

  timerMode.textContent    = isBreak ? 'BREAK' : 'FOCUS';
  pomodoroCount.textContent = `🍅 Round ${isBreak ? pomodoros : pomodoros + 1}`;

  const total    = isBreak ? BREAK_DURATION : FOCUS_DURATION;
  const fraction = secondsLeft / total;
  ringProgress.style.strokeDashoffset = CIRCUMFERENCE * fraction;
  ringProgress.style.stroke = isBreak ? '#a78bfa' : '#e07a5f';
}

function pauseTimer() {
  clearInterval(timerInterval);
  running = false;
  stopBtn.classList.add('hidden');
  resumeBtn.classList.remove('hidden');
}

function resumeTimer() {
  running = true;
  stopBtn.classList.remove('hidden');
  resumeBtn.classList.add('hidden');
  timerInterval = setInterval(tick, 1000);
}

function startElapsedCounter() {
  clearInterval(elapsedInterval);
  elapsedInterval = setInterval(() => { totalSecondsElapsed++; }, 1000);
}

// ============================================================
//  BREAK FLOW
// ============================================================

function beginBreak() {
  isBreak     = true;
  secondsLeft = BREAK_DURATION;
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
    }
  }, 1000);
}

function updateBreakDisplay(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  breakTimerDisp.textContent =
    `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
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
  clearInterval(elapsedInterval);
  clearInterval(breakCountdownId);
  hideBreakModal();

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
        task_name:           taskName,
        time_taken_seconds:  totalSecondsElapsed,
        pomodoros:           pomodoros
      })
    });
    if (!resp.ok) console.warn('Save failed', await resp.text());
  } catch (err) {
    console.error('Network error saving session:', err);
  }

  // Populate & show congratulations modal
  document.getElementById('modalTaskName').textContent   = `"${taskName}"`;
  document.getElementById('modalPomodoros').textContent  = `🍅 × ${pomodoros}`;
  const m = Math.floor(totalSecondsElapsed / 60);
  const s = totalSecondsElapsed % 60;
  document.getElementById('modalTimeTaken').textContent  =
    `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;

  congratsModal.classList.remove('hidden');
}

// ============================================================
//  RESET
// ============================================================

function resetAll() {
  congratsModal.classList.add('hidden');
  timerSection.classList.add('hidden');
  taskInputSec.classList.remove('hidden');

  taskInput.value  = '';
  startBtn.disabled = true;

  clearInterval(timerInterval);
  clearInterval(elapsedInterval);
  clearInterval(breakCountdownId);

  // Reset ring
  ringProgress.style.strokeDashoffset = 0;
  timerDisplay.textContent = '25:00';
  timerMode.textContent    = 'FOCUS';
}
