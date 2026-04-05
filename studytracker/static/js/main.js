// main.js – shared utilities for StudyTracker

// Close any modal by clicking outside the card
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('modal-overlay')) {
    // Only close safe modals (not break which auto-closes)
    const safeToClose = ['congratsModal'];
    safeToClose.forEach(id => {
      const el = document.getElementById(id);
      if (el && e.target === el) el.classList.add('hidden');
    });
  }
});
