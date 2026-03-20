// ── Theme ──────────────────────────────────────────────────────────────────
(function initTheme() {
  const stored = localStorage.getItem('git-theme');
  if (stored === 'light') document.documentElement.classList.add('light');
})();

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light');
  localStorage.setItem('git-theme', isLight ? 'light' : 'dark');
  // update button icon if present
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  // update mini-IDE CodeMirror theme if present
  if (window._miniEditor) {
    window._miniEditor.setOption('theme', isLight ? 'vscode-light' : 'vscode-dark');
  }
}

// ── Mini-IDE ───────────────────────────────────────────────────────────────
function initMiniIDE(editorId, previewId, runBtnId, starterCode) {
  const textarea = document.getElementById(editorId);
  if (!textarea) return;
  const isLight = document.documentElement.classList.contains('light');
  const editor = CodeMirror.fromTextArea(textarea, {
    mode: 'htmlmixed',
    theme: isLight ? 'vscode-light' : 'vscode-dark',
    lineNumbers: true,
    lineWrapping: true,
    viewportMargin: Infinity,
  });
  editor.setValue(starterCode);
  window._miniEditor = editor;

  const runBtn = document.getElementById(runBtnId);
  const preview = document.getElementById(previewId);

  function runPreview() {
    const code = editor.getValue();
    const srcdoc = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head><body>${code}<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"><\/script></body></html>`;
    preview.srcdoc = srcdoc;
  }

  runBtn.addEventListener('click', runPreview);
  // auto-run once on load
  runPreview();
}

// ── Quiz Engine ────────────────────────────────────────────────────────────
function renderQuiz(containerId, stepNum, quizData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const questions = quizData.slice(0, 3); // max 3 questions on intro page
  container.innerHTML = questions.map((q, i) => `
    <div class="quiz-q" id="q${i}">
      <div class="q-text">${i + 1}. ${q.q}</div>
      <div class="q-options">
        ${q.opts.map((opt, j) => `
          <label class="q-option" id="q${i}-opt${j}">
            <input type="radio" name="q${i}" value="${j}"> ${opt}
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function checkQuiz(stepNum, quizData, goBtnId, resultId) {
  const questions = quizData.slice(0, 3);
  let allCorrect = true;
  questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    // clear previous highlights
    for (let j = 0; j < q.opts.length; j++) {
      const lbl = document.getElementById(`q${i}-opt${j}`);
      if (lbl) { lbl.classList.remove('correct', 'wrong'); }
    }
    if (!selected) {
      allCorrect = false;
      return;
    }
    const val = parseInt(selected.value);
    const correctLbl = document.getElementById(`q${i}-opt${q.correct}`);
    const selectedLbl = document.getElementById(`q${i}-opt${val}`);
    if (val === q.correct) {
      if (correctLbl) correctLbl.classList.add('correct');
    } else {
      allCorrect = false;
      if (selectedLbl) selectedLbl.classList.add('wrong');
      if (correctLbl) correctLbl.classList.add('correct');
    }
  });

  const result = document.getElementById(resultId);
  if (allCorrect) {
    if (result) { result.className = 'quiz-result pass'; result.textContent = '✅ Perfect! The IDE is now unlocked.'; }
    localStorage.setItem('quiz-passed-' + stepNum, '1');
    const goBtn = document.getElementById(goBtnId);
    if (goBtn) {
      goBtn.classList.remove('nav-btn-disabled');
      goBtn.classList.add('nav-btn-primary');
      goBtn.removeAttribute('disabled');
    }
  } else {
    if (result) { result.className = 'quiz-result fail'; result.textContent = '❌ Some answers are wrong. Review the highlighted options and try again.'; }
  }
}

function restoreQuizState(stepNum, goBtnId) {
  if (localStorage.getItem('quiz-passed-' + stepNum) === '1') {
    const goBtn = document.getElementById(goBtnId);
    if (goBtn) {
      goBtn.classList.remove('nav-btn-disabled');
      goBtn.classList.add('nav-btn-primary');
      goBtn.removeAttribute('disabled');
    }
  }
}

// ── Copy code blocks ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.code-block').forEach(function (block) {
    const btn = block.querySelector('.copy-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const code = block.querySelector('code') || block.querySelector('pre');
      if (!code) return;
      navigator.clipboard.writeText(code.innerText).then(function () {
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
      });
    });
  });
});
