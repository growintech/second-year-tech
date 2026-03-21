/*
 * shared/app-intro.js
 * Shared utilities for all intro/exercise pages (lesson14 + lesson15).
 *
 * Includes: theme toggle, countdown, runCode, checkStudentCode, showFeedback,
 *           initMiniIDE, initSnippet, switchClassTab, quiz engine, copy buttons, Q&A reveal.
 */

// ── Countdown — lesson ends 2026-03-13 16:00 Rome (CET = UTC+1) ──
(function() {
  var TARGET = new Date('2026-03-13T16:00:00+01:00');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    var now  = new Date();
    var diff = TARGET.getTime() - now.getTime();

    var topbarEl = document.getElementById('topbar-cd');
    var elDays   = document.getElementById('cd-days');
    var elHours  = document.getElementById('cd-hours');
    var elMin    = document.getElementById('cd-minutes');
    var elSec    = document.getElementById('cd-seconds');

    if (diff <= 0) {
      if (topbarEl) { topbarEl.textContent = '00:00:00'; topbarEl.classList.add('urgent'); }
      if (elDays)   elDays.textContent = '00';
      if (elHours)  elHours.textContent = '00';
      if (elMin)    elMin.textContent = '00';
      if (elSec)    elSec.textContent = '00';
      return;
    }

    var d = Math.floor(diff / 86400000); diff -= d * 86400000;
    var h = Math.floor(diff / 3600000);  diff -= h * 3600000;
    var m = Math.floor(diff / 60000);    diff -= m * 60000;
    var s = Math.floor(diff / 1000);

    if (topbarEl) {
      topbarEl.textContent = d > 0
        ? d + 'd ' + pad(h) + ':' + pad(m) + ':' + pad(s)
        : pad(h) + ':' + pad(m) + ':' + pad(s);
      topbarEl.classList.toggle('urgent', d === 0 && h === 0);
    }

    if (elDays)  elDays.textContent  = pad(d);
    if (elHours) elHours.textContent = pad(h);
    if (elMin)   elMin.textContent   = pad(m);
    if (elSec)   elSec.textContent   = pad(s);
  }

  tick();
  setInterval(tick, 1000);
})();

// ── Theme ──
function toggleTheme() {
  var isLight = document.documentElement.classList.toggle('light');
  localStorage.setItem('git-theme', isLight ? 'light' : 'dark');
  var btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  var theme = isLight ? 'vscode-light' : 'vscode-dark';
  if (window._miniEditor) window._miniEditor.setOption('theme', theme);
  if (window._snippetEditors) {
    window._snippetEditors.forEach(function(e) { e.setOption('theme', theme); });
  }
}

// ── Run student code inside a sandboxed iframe (lesson14) ──
function runCode(editorId, outputId, htmlContent) {
  var ta = document.getElementById(editorId);
  var iframe = document.getElementById(outputId);
  if (!ta || !iframe) return;
  var code = ta.value.replace(/<\/script>/gi, '<\\/script>');
  var html = htmlContent || '';
  var src = '<!DOCTYPE html><html><head><style>'
    + 'body{font-family:sans-serif;font-size:14px;padding:12px;margin:0;color:#1a1d2e;background:#fff}'
    + 'pre.log{margin:3px 0;padding:4px 10px;background:#f0f2f7;border-radius:4px;font-size:13px;font-family:monospace;white-space:pre-wrap}'
    + 'pre.err{background:#fee2e2;color:#dc2626}'
    + '#countdown{font-family:monospace;font-size:22px;padding:8px 0;}'
    + '</style></head><body>'
    + html
    + '<scr' + 'ipt>'
    + 'var _ol=console.log;'
    + 'console.log=function(){'
    + '_ol.apply(console,arguments);'
    + 'var p=document.createElement("pre");'
    + 'p.className="log";'
    + 'p.textContent=Array.from(arguments).map(function(a){return typeof a==="object"?JSON.stringify(a):String(a);}).join(" ");'
    + 'document.body.appendChild(p);'
    + '};'
    + 'try{\n'
    + code
    + '\n}catch(e){'
    + 'var p=document.createElement("pre");'
    + 'p.className="log err";'
    + 'p.textContent="\u26a0 Error: "+e.message;'
    + 'document.body.appendChild(p);'
    + '}'
    + '<\/scr' + 'ipt>'
    + '</body></html>';
  iframe.srcdoc = src;
}

// ── Evaluate student code and extract named variables (lesson14) ──
function checkStudentCode(code, extract) {
  var logs = [], alerts_cap = [];
  var _log = console.log, _alert = window.alert;
  console.log = function() { logs.push(Array.from(arguments).map(String).join(' ')); };
  window.alert = function(m) { alerts_cap.push(String(m)); };
  var vars = {}, err = null;
  try {
    var extractStr = extract.map(function(v) {
      return '"' + v + '":(typeof ' + v + '!=="undefined"?' + v + ':undefined)';
    }).join(',');
    var mockDoc = 'var document={'
      + 'querySelector:function(){return{innerText:"",textContent:""};}'
      + ',getElementById:function(){return{innerText:"",textContent:""};}'
      + ',querySelectorAll:function(){return[];}};';
    var fn = new Function(mockDoc + '\n' + code + '\nreturn {' + extractStr + '};');
    vars = fn();
  } catch(e) { err = e.message; }
  console.log = _log;
  window.alert = _alert;
  return { vars: vars, logs: logs, alerts: alerts_cap, error: err };
}

// ── Show ✅/❌ feedback below editor (lesson14) ──
function showFeedback(feedbackId, pass, message) {
  var el = document.getElementById(feedbackId);
  if (!el) return;
  el.style.display = 'block';
  el.className = 'check-feedback ' + (pass ? 'pass' : 'fail');
  el.textContent = (pass ? '\u2705 ' : '\u274c ') + message;
}

// ── Mini-IDE (lesson15) ──
function initMiniIDE(editorId, previewId, runBtnId, starterCode) {
  var textarea = document.getElementById(editorId);
  if (!textarea) return;
  var isLight = document.documentElement.classList.contains('light');
  var editor = CodeMirror.fromTextArea(textarea, {
    mode: 'htmlmixed',
    theme: isLight ? 'vscode-light' : 'vscode-dark',
    lineNumbers: true,
    lineWrapping: true,
    viewportMargin: Infinity
  });
  editor.setValue(starterCode);
  window._miniEditor = editor;

  var runBtn = document.getElementById(runBtnId);
  var preview = document.getElementById(previewId);

  function runPreview() {
    var code = editor.getValue();
    var srcdoc = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head><body>' + code + '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"><\/script></body></html>';
    preview.srcdoc = srcdoc;
  }

  runBtn.addEventListener('click', runPreview);
  runPreview();

  var wrap = preview.closest('.mini-ide-wrap') || preview.parentElement;
  if (!wrap) return;
  var handle = document.createElement('div');
  handle.className = 'mini-resize-handle';
  handle.setAttribute('aria-hidden', 'true');
  wrap.insertBefore(handle, preview);

  var dragging = false, startY = 0, startH = 0;
  handle.addEventListener('mousedown', function(e) {
    e.preventDefault();
    dragging = true;
    startY = e.clientY;
    startH = preview.offsetHeight;
    handle.classList.add('dragging');
    preview.style.pointerEvents = 'none';
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var delta = e.clientY - startY;
    var newH = Math.max(80, Math.min(600, startH + delta));
    preview.style.height = newH + 'px';
    preview.style.flexShrink = '0';
  });
  document.addEventListener('mouseup', function() {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    preview.style.pointerEvents = '';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

// ── Read-only Snippets (lesson15) ──
function initSnippet(textareaId, withCopyBtn) {
  var textarea = document.getElementById(textareaId);
  if (!textarea) return;
  var isLight = document.documentElement.classList.contains('light');
  var editor = CodeMirror.fromTextArea(textarea, {
    mode: 'htmlmixed',
    theme: isLight ? 'vscode-light' : 'vscode-dark',
    lineNumbers: false,
    lineWrapping: true,
    readOnly: 'nocursor'
  });
  if (!window._snippetEditors) window._snippetEditors = [];
  window._snippetEditors.push(editor);

  if (withCopyBtn) {
    var block = textarea.closest('.snippet-block') || textarea.parentElement;
    var btn = document.createElement('button');
    btn.className = 'snippet-copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', function() {
      var code = editor.getValue();
      navigator.clipboard.writeText(code).then(function() {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function() { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1600);
      }).catch(function() {
        btn.textContent = 'Error';
        setTimeout(function() { btn.textContent = 'Copy'; }, 1600);
      });
    });
    if (block) block.appendChild(btn);
  }
}

// ── Class Switcher (lesson15) ──
function switchClassTab(switcherId, tabIndex) {
  var switcher = document.getElementById(switcherId);
  if (!switcher) return;
  var tabs = switcher.querySelectorAll('.cs-tab');
  var panes = switcher.querySelectorAll('.cs-pane');
  tabs.forEach(function(t, i) { t.classList.toggle('active', i === tabIndex); });
  panes.forEach(function(p, i) { p.classList.toggle('active', i === tabIndex); });
}

// ── Quiz Engine (lesson15) ──
function renderQuiz(containerId, stepNum, quizData) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var questions = quizData.slice(0, 3);
  container.innerHTML = questions.map(function(q, i) {
    return '<div class="quiz-q" id="q' + i + '">'
      + '<div class="q-text">' + (i + 1) + '. ' + q.q + '</div>'
      + '<div class="q-options">'
      + q.opts.map(function(opt, j) {
          return '<label class="q-option" id="q' + i + '-opt' + j + '">'
            + '<input type="radio" name="q' + i + '" value="' + j + '"> ' + opt
            + '</label>';
        }).join('')
      + '</div></div>';
  }).join('');
}

function checkQuiz(stepNum, quizData, goBtnId, resultId) {
  var questions = quizData.slice(0, 3);
  var allCorrect = true;
  questions.forEach(function(q, i) {
    var selected = document.querySelector('input[name="q' + i + '"]:checked');
    for (var j = 0; j < q.opts.length; j++) {
      var lbl = document.getElementById('q' + i + '-opt' + j);
      if (lbl) { lbl.classList.remove('correct', 'wrong'); }
    }
    if (!selected) { allCorrect = false; return; }
    var val = parseInt(selected.value);
    var correctLbl = document.getElementById('q' + i + '-opt' + q.correct);
    var selectedLbl = document.getElementById('q' + i + '-opt' + val);
    if (val === q.correct) {
      if (correctLbl) correctLbl.classList.add('correct');
    } else {
      allCorrect = false;
      if (selectedLbl) selectedLbl.classList.add('wrong');
      if (correctLbl) correctLbl.classList.add('correct');
    }
  });

  var result = document.getElementById(resultId);
  if (allCorrect) {
    if (result) { result.className = 'quiz-result pass'; result.textContent = '✅ Perfect! The IDE is now unlocked.'; }
    localStorage.setItem('quiz-passed-' + stepNum, '1');
    var goBtn = document.getElementById(goBtnId);
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
    var goBtn = document.getElementById(goBtnId);
    if (goBtn) {
      goBtn.classList.remove('nav-btn-disabled');
      goBtn.classList.add('nav-btn-primary');
      goBtn.removeAttribute('disabled');
    }
  }
}

// ── DOMContentLoaded: copy buttons, Q&A reveal, theme toggle setup ──
document.addEventListener('DOMContentLoaded', function() {

  // Copy code blocks
  document.querySelectorAll('.code-block').forEach(function(block) {
    var btn = block.querySelector('.copy-btn');
    if (!btn) return;
    btn.addEventListener('click', function() {
      var code = block.querySelector('code') || block.querySelector('pre');
      if (!code) return;
      navigator.clipboard.writeText(code.innerText).then(function() {
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
      });
    });
  });

  // Q&A reveal
  document.querySelectorAll('.qa-q').forEach(function(q) {
    q.style.cursor = 'pointer';
    q.title = 'Click to reveal answer';
    q.addEventListener('click', function() {
      var a = q.nextElementSibling;
      a.style.display = a.style.display === 'none' ? 'flex' : 'none';
    });
  });

  // Theme toggle button — attach only if button has no onclick attribute
  // (lesson15 intro pages use onclick="toggleTheme()" directly on the element)
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn && !themeBtn.getAttribute('onclick')) {
    themeBtn.addEventListener('click', toggleTheme);
  }
  // Set initial icon
  if (themeBtn) {
    themeBtn.textContent = document.documentElement.classList.contains('light') ? '☀️' : '🌙';
  }

});
