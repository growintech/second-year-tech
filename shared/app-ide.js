  // ── Theme ──
  (function() {
    if (localStorage.getItem('git-theme') === 'light') {
      document.documentElement.classList.add('light');
      document.getElementById('theme-btn').textContent = '☀️';
    }
  })();

  function toggleTheme() {
    var isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('git-theme', isLight ? 'light' : 'dark');
    document.getElementById('theme-btn').textContent = isLight ? '☀️' : '🌙';
    if (editor) editor.setOption('theme', isLight ? 'vscode-light' : 'vscode-dark');
  }

  // ── Layout ──
  var currentLayout = localStorage.getItem('git-layout') || 'split';
  var shell = document.getElementById('shell');

  function applyLayout(layout) {
    currentLayout = layout;
    shell.className = 'layout-' + layout;
    document.getElementById('layout-btn').textContent = layout === 'split' ? '⊞ Split' : '☰ Top-down';
    localStorage.setItem('git-layout', layout);
    updatePanelFlex();
    setTimeout(function() { if (editor) editor.refresh(); }, 80);
  }
  function toggleLayout() { applyLayout(currentLayout === 'split' ? 'topdown' : 'split'); }
  applyLayout(currentLayout);

  // ── Panel toggles ──
  function togglePanel(name) {
    var ids = { instructions: 'panel-instructions', editor: 'panel-editor-console', preview: 'panel-preview' };
    var pillIds = { instructions: 'pill-instructions', editor: 'pill-editor', preview: 'pill-preview' };
    var panel = document.getElementById(ids[name]);
    var pill = document.getElementById(pillIds[name]);
    if (!panel) return;
    panel.classList.toggle('hidden');
    pill.classList.toggle('pill-active');
    updatePanelFlex();
    setTimeout(function() { if (editor) editor.refresh(); }, 80);
  }

  function updatePanelFlex() {
    if (currentLayout !== 'split') return;
    var i = !document.getElementById('panel-instructions').classList.contains('hidden');
    var e = !document.getElementById('panel-editor-console').classList.contains('hidden');
    var p = !document.getElementById('panel-preview').classList.contains('hidden');
    document.getElementById('panel-instructions').style.flex = i ? '0 0 280px' : '';
    document.getElementById('panel-editor-console').style.flex = e ? '1' : '';
    document.getElementById('panel-preview').style.flex = p ? '1' : '';
    setTimeout(function() { if (editor) editor.refresh(); }, 80);
  }

  // ── Console ──
  function toggleConsolePanel() {
    var pill = document.getElementById('pill-console');
    var con = document.getElementById('panel-console');
    con.classList.toggle('hidden');
    pill.classList.toggle('pill-active');
  }
  function toggleConsoleExpand() {
    var con = document.getElementById('panel-console');
    con.classList.toggle('expanded');
    document.getElementById('console-chevron').textContent = con.classList.contains('expanded') ? '▲' : '▼';
  }
  
  function inspectVar(val) {
    if (val === null) return '<span style="color:#a31515">null</span>';
    if (val === undefined) return '<span style="color:#a31515">undefined</span>';
    if (typeof val === 'string') return '<span style="color:#a31515">"' + val + '"</span>';
    if (typeof val === 'number') return '<span style="color:#098658">' + val + '</span>';
    if (typeof val === 'boolean') return '<span style="color:#0000ff">' + val + '</span>';
    if (typeof val === 'function') return '<span style="color:#795e26">[Function]</span>';
    if (Array.isArray(val)) return '<span style="color:#000000">[' + val.map(inspectVar).join(', ') + ']</span>';
    if (typeof val === 'object') {
      try { return '<span style="color:#000000">' + JSON.stringify(val) + '</span>'; }
      catch (e) { return '<span style="color:#000000">[Object]</span>'; }
    }
    return String(val);
  }

  function addConsoleMessage(msg, type, isHtml) {
    var body = document.getElementById('console-body');
    var def = body.querySelector('[data-default]');
    if (def) def.remove();
    var inputRow = document.getElementById('console-input-row');
    
    var div = document.createElement('div');
    div.className = 'console-msg' + (type === 'error' ? ' error' : '');
    var textSpan = document.createElement('span');
    textSpan.className = 'console-msg-text';
    if (isHtml) textSpan.innerHTML = msg; else textSpan.textContent = msg;
    div.appendChild(textSpan);
    
    var closeBtn = document.createElement('button');
    closeBtn.className = 'console-close';
    closeBtn.textContent = '×';
    closeBtn.title = 'Dismiss';
    closeBtn.onclick = function() { div.remove(); };
    div.appendChild(closeBtn);
    
    if (inputRow) {
      body.insertBefore(div, inputRow);
    } else {
      body.appendChild(div);
    }
    
    body.scrollTop = body.scrollHeight;
    
    if (type === 'error') {
      var panel = document.getElementById('panel-console');
      panel.classList.remove('hidden');
      panel.classList.add('expanded');
      document.getElementById('console-chevron').textContent = '▲';
      document.getElementById('pill-console').classList.add('pill-active');
    }
  }
  
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'iframe-error') addConsoleMessage('⚠ ' + e.data.message, 'error');
    if (e.data && e.data.type === 'iframe-console') {
       addConsoleMessage(e.data.message, 'log', false);
    }
  });

  // ── Editor ──
  var STEP = window.IDE_STEP || 1;
  var STARTER_HTML = document.getElementById('starter-code') ? document.getElementById('starter-code').textContent : '';

  var htmlContent = STARTER_HTML;
  var jsContent = '';
  var activeTab = 'html';

  var isLight = document.documentElement.classList.contains('light');
  var codeEditorEl = document.getElementById('code-editor');
  var editor = null;
  if (codeEditorEl) {
    editor = CodeMirror.fromTextArea(codeEditorEl, {
      mode: 'htmlmixed',
      theme: isLight ? 'vscode-light' : 'vscode-dark',
      lineNumbers: true,
      lineWrapping: true,
      viewportMargin: Infinity,
      extraKeys: { 'Ctrl-Space': 'autocomplete', 'Tab': function(cm) { cm.replaceSelection('  '); } },
      hintOptions: { completeSingle: false },
      autoCloseTags: true,
      matchBrackets: true,
      styleActiveLine: true
    });
    if (STARTER_HTML) editor.setValue(STARTER_HTML);
  }

  function switchTab(tab) {
    if (tab === activeTab || !editor) return;
    if (activeTab === 'html') htmlContent = editor.getValue();
    else jsContent = editor.getValue();
    activeTab = tab;
    editor.setOption('mode', tab === 'html' ? 'htmlmixed' : 'javascript');
    editor.setValue(tab === 'html' ? htmlContent : jsContent);
    document.getElementById('tab-html').classList.toggle('active', tab === 'html');
    document.getElementById('tab-js').classList.toggle('active', tab === 'js');
    var status = document.getElementById('status-lang');
    if (status) status.textContent = tab === 'html' ? 'HTML' : 'JS';
    editor.focus();
  }
  
  window.switchTab = switchTab;

  // ── Run ──
  function buildSrcdoc() {
    var html = activeTab === 'html' && editor ? editor.getValue() : htmlContent;
    var js = activeTab === 'js' && editor ? editor.getValue() : jsContent;
    var onerr = '<script>window.onerror=function(m,s,l){window.parent.postMessage({type:\'iframe-error\',message:m+(s?\' (\'+s+\':\'+l+\')\':\'\')},"*");return false;};<\/script>';
    var consol = '<script>console.log = function() { var args = Array.from(arguments).join(" "); window.parent.postMessage({type:"iframe-console", message: args}, "*"); };<\/script>';
    var doc = html.replace(/(<head[^>]*>)/i, '$1\n  ' + onerr + '\n  ' + consol);
    if (!/<head/i.test(doc)) {
        doc = '<head>' + onerr + '\n  ' + consol + '</head>' + doc;
    }
    if (js && js.trim()) {
        if (doc.includes('</body>')) {
            doc = doc.replace('</body>', '<script>\n' + js + '\n<\/script>\n</body>');
        } else {
            doc += '<script>\n' + js + '\n<\/script>';
        }
    }
    return doc;
  }
  function runPreview() {
    if (!editor) return;
    document.getElementById('console-body').querySelectorAll('.console-msg.error').forEach(function(m) { m.remove(); });
    document.getElementById('preview-frame').srcdoc = buildSrcdoc();
  }
  window.addEventListener('load', function() { setTimeout(runPreview, 100); });

  // ── Console Input ──
  var consoleInput = document.getElementById('console-input');
  if (consoleInput) {
    consoleInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var code = consoleInput.value;
        if (!code.trim()) return;
        consoleInput.value = '';
        addConsoleMessage('> ' + code, 'log', false);
        try {
          var iframe = document.getElementById('preview-frame');
          if (iframe && iframe.contentWindow) {
             var res = iframe.contentWindow.eval(code);
             addConsoleMessage('← ' + inspectVar(res), 'log', true);
          } else {
             var res = eval(code);
             addConsoleMessage('← ' + inspectVar(res), 'log', true);
          }
        } catch (err) {
          addConsoleMessage(err.toString(), 'error', false);
        }
      }
    });
  }

  // ── Check ──
  var stepPassed = false;
  function runCheck() {
    if (!editor) return;
    var code = activeTab === 'html' ? editor.getValue() : htmlContent;
    var failures = window.validateStep ? window.validateStep(STEP, code) : [];
    
    // Check if code is empty (basic validation)
    if (!code || code.trim() === '') {
        failures.push('Code cannot be empty.');
    }

    var result = document.getElementById('check-result');
    if (failures.length === 0) {
      stepPassed = true;
      result.className = 'pass visible';
      result.innerHTML = '✅ Great work! Step ' + STEP + ' complete. <strong>Next is now unlocked.</strong>';
      var btn = document.getElementById('next-btn');
      if (btn) { btn.classList.remove('ide-nav-btn-disabled'); btn.classList.add('ide-nav-btn-primary'); btn.disabled = false; }
      addConsoleMessage('✅ Step ' + STEP + ' passed!', 'log', false);
    } else {
      result.className = 'fail visible';
      var dismiss = `<button class="console-close" style="position:absolute; top:8px; right:8px; font-size:16px;" onclick="document.getElementById('check-result').className='fail'">×</button>`;
      result.innerHTML = dismiss + '❌ Not quite. Fix these:<ul>' + failures.map(function(f){return '<li>'+f+'</li>';}).join('') + '</ul>';
      addConsoleMessage('❌ Check failed: ' + failures.length + ' issue(s)', 'error', false);
    }
  }

  window.runCheck = runCheck;
  window.runPreview = runPreview;

  function goNext() {
    if (!stepPassed) return;
    if (window.IDE_NEXT_URL) window.location = window.IDE_NEXT_URL;
  }
  
  window.goNext = goNext;

  // ── Drag-to-resize panels ──
  (function initDragHandles() {
    var dragging = null, startPos = 0, startSizeA = 0, startSizeB = 0, dragPanelA, dragPanelB;
    document.querySelectorAll('.drag-handle').forEach(function(handle) {
      handle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        dragging = handle;
        handle.classList.add('dragging');
        var isV = currentLayout === 'split';
        startPos = isV ? e.clientX : e.clientY;
        dragPanelA = document.getElementById(handle.dataset.panelA);
        dragPanelB = document.getElementById(handle.dataset.panelB);
        if (!dragPanelA || !dragPanelB) return;
        var rA = dragPanelA.getBoundingClientRect();
        var rB = dragPanelB.getBoundingClientRect();
        startSizeA = isV ? rA.width : rA.height;
        startSizeB = isV ? rB.width : rB.height;
        document.body.style.cursor = isV ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
        var frame = document.getElementById('preview-frame');
        if (frame) frame.style.pointerEvents = 'none';
      });
    });
    document.addEventListener('mousemove', function(e) {
      if (!dragging || !dragPanelA || !dragPanelB) return;
      var isV = currentLayout === 'split';
      var delta = (isV ? e.clientX : e.clientY) - startPos;
      var newA = Math.max(100, startSizeA + delta);
      var newB = Math.max(100, startSizeB - delta);
      dragPanelA.style.flex = '0 0 ' + newA + 'px';
      dragPanelB.style.flex = '0 0 ' + newB + 'px';
      if (editor) editor.refresh();
    });
    document.addEventListener('mouseup', function() {
      if (!dragging) return;
      dragging.classList.remove('dragging');
      dragging = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      var frame = document.getElementById('preview-frame');
      if (frame) frame.style.pointerEvents = '';
      try {
        var sizes = {};
        ['panel-instructions','panel-editor-console','panel-preview'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) {
            var m = (el.style.flex||'').match(/0 0 (\d+)px/);
            if (m) sizes[id] = parseInt(m[1]);
          }
        });
        if (Object.keys(sizes).length) localStorage.setItem('git-panel-sizes', JSON.stringify(sizes));
      } catch(err) {}
    });
    // Restore saved sizes
    try {
      var saved = JSON.parse(localStorage.getItem('git-panel-sizes') || '{}');
      Object.keys(saved).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.flex = '0 0 ' + saved[id] + 'px';
      });
    } catch(err) {}
  })();

  // ── Save/restore editor code ──
  (function() {
    if (!editor) return;
    var saved = localStorage.getItem('git-code-step-' + STEP);
    if (saved && saved.trim()) { htmlContent = saved; editor.setValue(saved); }
  })();
  var _saveTimer;
  if (editor) {
    editor.on('change', function() {
      clearTimeout(_saveTimer);
      _saveTimer = setTimeout(function() {
        try { localStorage.setItem('git-code-step-' + STEP, activeTab === 'html' ? editor.getValue() : htmlContent); } catch(e) {}
      }, 500);
    });
  }

  // ── Hints ──
  function toggleHints(btn) {
    var body = btn.nextElementSibling;
    var open = body.classList.toggle('open');
    btn.querySelector('span').textContent = open ? '▼' : '▶';
  }
  
  window.toggleHints = toggleHints;
  
  function revealNextHint(btn) {
    var body = btn.closest('.hints-body');
    var hidden = body.querySelectorAll('.hint-item:not(.revealed)');
    if (hidden.length > 0) hidden[0].classList.add('revealed');
    if (body.querySelectorAll('.hint-item:not(.revealed)').length === 0) {
      btn.disabled = true; btn.textContent = 'All hints shown';
    }
  }
  
  window.revealNextHint = revealNextHint;
