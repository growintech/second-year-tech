// ── Lesson countdown — ends 2026-03-13 16:00 Rome (CET = UTC+1) ──
(function() {
  var TARGET = new Date('2026-03-13T16:00:00+01:00');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    var now  = new Date();
    var diff = TARGET.getTime() - now.getTime();

    // Elements that may or may not exist on this page
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

    // Compact topbar display
    if (topbarEl) {
      topbarEl.textContent = d > 0
        ? d + 'd ' + pad(h) + ':' + pad(m) + ':' + pad(s)
        : pad(h) + ':' + pad(m) + ':' + pad(s);
      // urgent only when < 1 hour remains (no days, no hours left)
      topbarEl.classList.toggle('urgent', d === 0 && h === 0);
    }

    // Full index-page display
    if (elDays)  elDays.textContent  = pad(d);
    if (elHours) elHours.textContent = pad(h);
    if (elMin)   elMin.textContent   = pad(m);
    if (elSec)   elSec.textContent   = pad(s);
  }

  tick();
  setInterval(tick, 1000);
})();

// ── Theme: apply saved preference immediately (also in <head> on each page) ──
(function() {
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light');
  }
})();

// ── Run student code inside a sandboxed iframe ──
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

// ── Evaluate student code and extract named variables ──
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
    // Mock document so querySelector calls don't throw
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

// ── Show ✅/❌ feedback below editor ──
function showFeedback(feedbackId, pass, message) {
  var el = document.getElementById(feedbackId);
  if (!el) return;
  el.style.display = 'block';
  el.className = 'check-feedback ' + (pass ? 'pass' : 'fail');
  el.textContent = (pass ? '\u2705 ' : '\u274c ') + message;
}

document.addEventListener('DOMContentLoaded', function() {

  // ── Copy to clipboard ──
  document.querySelectorAll('.copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var pre = btn.closest('.code-block').querySelector('pre');
      var text = pre.innerText;
      navigator.clipboard.writeText(text).then(function() {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function() {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 1800);
      });
    });
  });

  // ── Q&A reveal (centralised — works on every page) ──
  document.querySelectorAll('.qa-q').forEach(function(q) {
    q.style.cursor = 'pointer';
    q.title = 'Click to reveal answer';
    q.addEventListener('click', function() {
      var a = q.nextElementSibling;
      a.style.display = a.style.display === 'none' ? 'flex' : 'none';
    });
  });

  // ── Theme toggle ──
  var toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    function updateIcon() {
      toggleBtn.textContent = document.documentElement.classList.contains('light') ? '\uD83C\uDF19' : '\u2600\uFE0F';
    }
    updateIcon();
    toggleBtn.addEventListener('click', function() {
      document.documentElement.classList.toggle('light');
      localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
      updateIcon();
    });
  }

});
