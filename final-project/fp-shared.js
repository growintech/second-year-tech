/*
 * final-project/fp-shared.js
 * School selector, dynamic countdown, and school-aware UI for all Final Project pages.
 *
 * Features:
 *   - First-visit school selector modal (Sommeiller / Monti)
 *   - localStorage persistence (key: git-fp-school)
 *   - Navbar school toggle pill (always visible, works on every page)
 *   - Countdown engine: finds next upcoming deadline for selected school
 *   - School-aware date/text swapping via data attributes
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'git-fp-school';

  // All deadlines in Rome time (CEST = UTC+2 in April/May)
  var DEADLINES = {
    sommeiller: [
      { label: 'Phase 1 \u2014 Problem to Solution',  short: 'Phase 1',  date: '2026-04-03T23:59:00+02:00' },
      { label: 'Phase 2 \u2014 Form & Landing Page',   short: 'Phase 2',  date: '2026-04-08T23:59:00+02:00' },
      { label: 'Phase 3 \u2014 Website Progress',      short: 'Phase 3',  date: '2026-04-15T23:59:00+02:00' },
      { label: 'Final Submission',                      short: 'Final',    date: '2026-04-20T23:59:00+02:00' },
      { label: 'Presentations (last lesson)',           short: 'Present.', date: '2026-04-22T16:00:00+02:00' }
    ],
    monti: [
      { label: 'Phase 1 \u2014 Problem to Solution',  short: 'Phase 1',  date: '2026-04-03T23:59:00+02:00' },
      { label: 'Phase 2 \u2014 Form & Landing Page',   short: 'Phase 2',  date: '2026-04-10T23:59:00+02:00' },
      { label: 'Phase 3 \u2014 Website Progress',      short: 'Phase 3',  date: '2026-04-17T23:59:00+02:00' },
      { label: 'Final Submission',                      short: 'Final',    date: '2026-04-22T23:59:00+02:00' },
      { label: 'Presentations (last lesson)',           short: 'Present.', date: '2026-04-24T16:00:00+02:00' }
    ]
  };

  /* ── Helpers ── */
  function pad(n) { return String(n).padStart(2, '0'); }
  function getSchool() { return localStorage.getItem(STORAGE_KEY); }
  function setSchool(v) { localStorage.setItem(STORAGE_KEY, v); }

  /* ── Inject CSS (modal + toggle + timeline highlight) ── */
  var css = document.createElement('style');
  css.id = 'fp-injected-css';
  css.textContent =
    /* ── School toggle pill ── */
    '.school-toggle{display:inline-flex;background:var(--surface-2);border:1px solid var(--border-2);border-radius:8px;overflow:hidden;flex-shrink:0}' +
    '.school-toggle-btn{padding:4px 12px;font-size:11px;font-weight:500;font-family:"DM Sans",sans-serif;background:none;border:none;color:var(--text-muted);cursor:pointer;transition:all .2s;white-space:nowrap;letter-spacing:.02em}' +
    '.school-toggle-btn:first-child{border-right:1px solid var(--border-2)}' +
    '.school-toggle-btn.active{background:var(--grad);color:#fff;font-weight:600}' +
    '.school-toggle-btn:not(.active):hover{color:var(--text);background:rgba(255,255,255,.04)}' +
    /* ── Timeline active column ── */
    '.tl-active{color:var(--grad-start)!important;font-weight:600!important}' +
    'html.light .tl-active{color:#0050cc!important}' +
    /* ── Modal overlay ── */
    '#fp-school-modal{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .4s ease}' +
    '#fp-school-modal.visible{opacity:1}' +
    '#fp-school-modal.leaving{opacity:0;pointer-events:none}' +
    '.fp-modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}' +
    '.fp-modal-card{position:relative;background:var(--surface);border:1px solid var(--border-2);border-radius:20px;padding:44px 40px 40px;max-width:500px;width:100%;text-align:center;transform:translateY(24px) scale(.96);transition:transform .5s cubic-bezier(.16,1,.3,1);box-shadow:0 25px 60px rgba(0,0,0,.45)}' +
    '#fp-school-modal.visible .fp-modal-card{transform:translateY(0) scale(1)}' +
    '#fp-school-modal.leaving .fp-modal-card{transform:translateY(24px) scale(.96)}' +
    '.fp-modal-logo{height:52px;margin:0 auto 24px;display:block}' +
    '.fp-modal-title{font-size:24px;font-weight:600;color:#fff;margin-bottom:8px;letter-spacing:-.01em}' +
    'html.light .fp-modal-title{color:#0d1020}' +
    '.fp-modal-sub{font-size:14.5px;color:var(--text-muted);margin-bottom:32px;line-height:1.6}' +
    '.fp-modal-schools{display:grid;grid-template-columns:1fr 1fr;gap:14px}' +
    '.fp-modal-school{display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px 16px 24px;background:var(--surface-2);border:2px solid var(--border-2);border-radius:14px;cursor:pointer;transition:all .25s cubic-bezier(.16,1,.3,1);font-family:"DM Sans",sans-serif}' +
    '.fp-modal-school:hover{border-color:rgba(0,225,255,.45);box-shadow:0 0 28px rgba(0,225,255,.12),inset 0 0 28px rgba(0,225,255,.04);transform:scale(1.04)}' +
    '.fp-modal-school.selected{border-color:var(--grad-start);background:rgba(0,225,255,.1);animation:fpPulse .35s ease}' +
    '@keyframes fpPulse{0%{transform:scale(1.04)}50%{transform:scale(.96)}100%{transform:scale(1)}}' +
    '.fp-modal-school-icon{font-size:32px}' +
    '.fp-modal-school-name{font-size:18px;font-weight:600;color:#fff}' +
    'html.light .fp-modal-school-name{color:#0d1020}' +
    '.fp-modal-school-day{font-size:11px;color:var(--text-muted);letter-spacing:.08em;text-transform:uppercase;font-weight:500}' +
    /* ── Tour replay button ── */
    '.tour-btn{background:var(--surface-2);border:1px solid var(--border-2);border-radius:8px;padding:5px 9px;cursor:pointer;font-size:14px;line-height:1;transition:all .15s;color:var(--text-muted);flex-shrink:0}' +
    '.tour-btn:hover{border-color:rgba(0,225,255,.3);background:var(--surface);transform:scale(1.08)}' +
    '@media(max-width:420px){.fp-modal-schools{grid-template-columns:1fr}.fp-modal-card{padding:36px 24px 32px}}';
  document.head.appendChild(css);

  /* ── Find next deadline for school ── */
  function getNextDeadline(school) {
    var now = Date.now();
    var list = DEADLINES[school] || [];
    for (var i = 0; i < list.length; i++) {
      if (new Date(list[i].date).getTime() > now) return list[i];
    }
    return null;
  }

  /* ── Countdown engine ── */
  var cdTimer = null;

  function tick() {
    var school = getSchool();
    if (!school) return;

    var next = getNextDeadline(school);
    var lblEl = document.getElementById('fp-cd-label');
    var dEl   = document.getElementById('fp-cd-days');
    var hEl   = document.getElementById('fp-cd-hours');
    var mEl   = document.getElementById('fp-cd-minutes');
    var sEl   = document.getElementById('fp-cd-seconds');

    if (!next) {
      if (lblEl) lblEl.textContent = 'All deadlines have passed!';
      [dEl, hEl, mEl, sEl].forEach(function (el) { if (el) el.textContent = '00'; });
      return;
    }

    var diff = new Date(next.date).getTime() - Date.now();
    if (diff <= 0) { tick(); return; }

    var d = Math.floor(diff / 86400000); diff -= d * 86400000;
    var h = Math.floor(diff / 3600000);  diff -= h * 3600000;
    var m = Math.floor(diff / 60000);    diff -= m * 60000;
    var s = Math.floor(diff / 1000);

    var schoolName = school.charAt(0).toUpperCase() + school.slice(1);
    if (lblEl) lblEl.textContent = schoolName + ' \u2014 ' + next.label;
    if (dEl) dEl.textContent = pad(d);
    if (hEl) hEl.textContent = pad(h);
    if (mEl) mEl.textContent = pad(m);
    if (sEl) sEl.textContent = pad(s);
  }

  function startCountdown() {
    if (cdTimer) clearInterval(cdTimer);
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  /* ── Generic phase countdown with urgency colours ── */
  /*
   * Each phase page has a .phase-countdown[data-phase="N"] container.
   * Phase N's deadline index in DEADLINES:
   *   Phase 1 → index 0  (Phase 1 — Problem to Solution)
   *   Phase 2 → index 1  (Phase 2 — Form & Landing Page)
   *   Phase 3 → index 2  (Phase 3 — Website Progress)
   *   Phase 4 → index 3  (Final Submission)
   *
   * A phase countdown is greyed out (inactive) until the PREVIOUS phase's
   * deadline has passed. Phase 1 is always active (no predecessor).
   *
   * Phase labels for display:
   */
  var PHASE_LABELS = [
    'Phase 1',
    'Phase 2',
    'Phase 3',
    'Final Submission'
  ];

  var phaseTimer = null;

  function lerpHSL(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  function hslStr(c) {
    return 'hsl(' + Math.round(c[0]) + ',' + Math.round(c[1]) + '%,' + Math.round(c[2]) + '%)';
  }

  function getUrgencyColor(hoursLeft) {
    var cyan   = [186, 100, 50];
    var yellow = [48,  96,  48];
    var orange = [28,  96,  50];
    var red    = [0,   84,  60];

    if (hoursLeft > 12) return { color: hslStr(cyan), color2: hslStr([210, 100, 50]) };
    if (hoursLeft > 6) {
      return { color: hslStr(yellow), color2: hslStr([42, 90, 45]) };
    }
    if (hoursLeft > 2) {
      var t = 1 - (hoursLeft - 2) / 4;
      var c = lerpHSL(yellow, orange, t);
      var c2 = lerpHSL([42, 90, 45], [20, 90, 45], t);
      return { color: hslStr(c), color2: hslStr(c2) };
    }
    if (hoursLeft > 1) {
      var t2 = 1 - (hoursLeft - 1);
      var c3 = lerpHSL(orange, red, t2);
      var c4 = lerpHSL([20, 90, 45], [350, 80, 50], t2);
      return { color: hslStr(c3), color2: hslStr(c4) };
    }
    return { color: hslStr(red), color2: hslStr([350, 80, 50]) };
  }

  function getPhaseDeadline(phaseIndex, school) {
    // Phase 1 (index 0) is the same for both schools
    if (phaseIndex === 0) return DEADLINES.sommeiller[0];
    var list = DEADLINES[school] || DEADLINES.sommeiller;
    return list[phaseIndex] || null;
  }

  function getPrevPhaseDeadline(phaseIndex, school) {
    if (phaseIndex <= 0) return null; // no predecessor
    return getPhaseDeadline(phaseIndex - 1, school);
  }

  function formatDeadlineDate(isoStr) {
    var d = new Date(isoStr);
    var months = ['Jan','Feb','Mar','April','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()];
  }

  function phaseCountdownTick() {
    var containers = document.querySelectorAll('.phase-countdown');
    if (!containers.length) return;

    var school = getSchool() || 'sommeiller';
    var now = Date.now();

    containers.forEach(function (container) {
      var phaseIndex = parseInt(container.getAttribute('data-phase'), 10) - 1; // 0-based
      var prefix = container.getAttribute('data-prefix') || 'ph';

      var lblEl = container.querySelector('.phase-cd-label');
      var dEl   = container.querySelector('.phase-cd-days');
      var hEl   = container.querySelector('.phase-cd-hours');
      var mEl   = container.querySelector('.phase-cd-minutes');
      var sEl   = container.querySelector('.phase-cd-seconds');

      var deadline = getPhaseDeadline(phaseIndex, school);
      var prevDeadline = getPrevPhaseDeadline(phaseIndex, school);
      var label = PHASE_LABELS[phaseIndex] || 'Deadline';

      if (!deadline) return;

      var deadlineMs = new Date(deadline.date).getTime();
      var diff = deadlineMs - now;

      // Check if previous phase is still active
      var prevActive = false;
      if (prevDeadline) {
        prevActive = new Date(prevDeadline.date).getTime() > now;
      }

      // Reset all state classes
      container.classList.remove('cd-inactive', 'cd-urgent-yellow', 'cd-urgent-orange', 'cd-urgent-red', 'cd-expired');

      if (prevActive) {
        // Previous phase hasn't ended → grey/inactive countdown
        container.classList.add('cd-inactive');

        if (lblEl) lblEl.textContent = '🔒 ' + label + ' · starts after previous deadline';
        // Still show the countdown numbers (greyed out)
        var gDiff = diff;
        var gd = Math.floor(gDiff / 86400000); gDiff -= gd * 86400000;
        var gh = Math.floor(gDiff / 3600000);  gDiff -= gh * 3600000;
        var gm = Math.floor(gDiff / 60000);    gDiff -= gm * 60000;
        var gs = Math.floor(gDiff / 1000);
        if (dEl) dEl.textContent = pad(gd);
        if (hEl) hEl.textContent = pad(gh);
        if (mEl) mEl.textContent = pad(gm);
        if (sEl) sEl.textContent = pad(gs);
        return;
      }

      // Deadline has passed
      if (diff <= 0) {
        if (lblEl) lblEl.textContent = label + ' deadline has passed!';
        [dEl, hEl, mEl, sEl].forEach(function (el) { if (el) el.textContent = '00'; });
        container.style.setProperty('--cd-color', hslStr([0, 84, 60]));
        container.style.setProperty('--cd-color2', hslStr([350, 80, 50]));
        container.classList.add('cd-expired');
        return;
      }

      // Active countdown with urgency colours
      var hoursLeft = diff / 3600000;
      var urgency = getUrgencyColor(hoursLeft);

      container.style.setProperty('--cd-color', urgency.color);
      container.style.setProperty('--cd-color2', urgency.color2);

      container.classList.toggle('cd-urgent-yellow', hoursLeft <= 12 && hoursLeft > 2);
      container.classList.toggle('cd-urgent-orange', hoursLeft <= 2 && hoursLeft > 1);
      container.classList.toggle('cd-urgent-red', hoursLeft <= 1);

      var d2 = Math.floor(diff / 86400000); diff -= d2 * 86400000;
      var h2 = Math.floor(diff / 3600000);  diff -= h2 * 3600000;
      var m2 = Math.floor(diff / 60000);    diff -= m2 * 60000;
      var s2 = Math.floor(diff / 1000);

      if (lblEl) {
        var dateStr = formatDeadlineDate(deadline.date);
        if (hoursLeft <= 1) lblEl.textContent = '⚠️ LESS THAN 1 HOUR — ' + label;
        else if (hoursLeft <= 2) lblEl.textContent = '⚠️ Final hours — ' + label;
        else if (hoursLeft <= 6) lblEl.textContent = '⏳ Deadline approaching — ' + label;
        else if (hoursLeft <= 12) lblEl.textContent = '⏳ Deadline today — ' + label;
        else lblEl.textContent = 'Deadline — ' + label + ' · ' + dateStr;
      }
      if (dEl) dEl.textContent = pad(d2);
      if (hEl) hEl.textContent = pad(h2);
      if (mEl) mEl.textContent = pad(m2);
      if (sEl) sEl.textContent = pad(s2);
    });
  }

  function startPhaseCountdowns() {
    if (phaseTimer) clearInterval(phaseTimer);
    if (!document.querySelectorAll('.phase-countdown').length) return;
    phaseCountdownTick();
    phaseTimer = setInterval(phaseCountdownTick, 1000);
  }

  /* ── Inject phase countdown urgency CSS ── */
  var phaseCss = document.createElement('style');
  phaseCss.id = 'fp-phase-urgency-css';
  phaseCss.textContent =
    /* Active state: urgency gradient on numbers */
    '.phase-countdown .lc-num{' +
      'background:linear-gradient(135deg,var(--cd-color,var(--grad-start)),var(--cd-color2,var(--grad-end)))!important;' +
      '-webkit-background-clip:text!important;' +
      '-webkit-text-fill-color:transparent!important;' +
      'background-clip:text!important;' +
      'transition:all .6s ease;' +
    '}' +
    '.phase-countdown .lc-sep{' +
      'color:var(--cd-color,var(--grad-start));' +
      'opacity:.5;' +
      'transition:color .6s ease;' +
    '}' +
    '.phase-countdown .phase-cd-label{' +
      'font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;' +
      'color:var(--text-dim);margin-bottom:18px;transition:color .6s ease;' +
    '}' +
    '.phase-countdown{transition:border-color .6s ease,box-shadow .6s ease,opacity .6s ease}' +
    /* Inactive / greyed out state */
    '.phase-countdown.cd-inactive{' +
      'opacity:0.5;' +
      'border-color:var(--border)!important;' +
      'box-shadow:none!important;' +
    '}' +
    '.phase-countdown.cd-inactive .lc-num{' +
      'background:var(--text-dim)!important;' +
      '-webkit-background-clip:text!important;' +
      '-webkit-text-fill-color:transparent!important;' +
      'background-clip:text!important;' +
    '}' +
    '.phase-countdown.cd-inactive .lc-sep{' +
      'color:var(--text-dim)!important;' +
    '}' +
    '.phase-countdown.cd-inactive .phase-cd-label{' +
      'color:var(--text-dim)!important;' +
    '}' +
    /* Yellow urgency */
    '.phase-countdown.cd-urgent-yellow{' +
      'border-color:rgba(234,179,8,0.25);' +
      'box-shadow:0 0 24px rgba(234,179,8,0.06);' +
    '}' +
    '.phase-countdown.cd-urgent-yellow .phase-cd-label{' +
      'color:hsl(48,80%,48%);' +
    '}' +
    /* Orange urgency */
    '.phase-countdown.cd-urgent-orange{' +
      'border-color:rgba(245,158,11,0.35);' +
      'box-shadow:0 0 28px rgba(245,158,11,0.08);' +
    '}' +
    '.phase-countdown.cd-urgent-orange .phase-cd-label{' +
      'color:hsl(28,90%,55%);' +
    '}' +
    /* Red urgency with pulse */
    '.phase-countdown.cd-urgent-red{' +
      'border-color:rgba(239,68,68,0.4);' +
      'box-shadow:0 0 32px rgba(239,68,68,0.1);' +
      'animation:cdPulseRed 2s ease-in-out infinite;' +
    '}' +
    '.phase-countdown.cd-urgent-red .phase-cd-label{' +
      'color:hsl(0,84%,60%);font-weight:700;' +
    '}' +
    '@keyframes cdPulseRed{' +
      '0%,100%{box-shadow:0 0 32px rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.4)}' +
      '50%{box-shadow:0 0 48px rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.6)}' +
    '}' +
    /* Expired state */
    '.phase-countdown.cd-expired{' +
      'border-color:rgba(239,68,68,0.3);' +
      'opacity:0.7;' +
    '}' +
    '.phase-countdown.cd-expired .phase-cd-label{' +
      'color:var(--red);font-weight:700;' +
    '}' +
    /* Light-mode adjustments */
    'html.light .phase-countdown.cd-inactive{opacity:0.45}' +
    'html.light .phase-countdown.cd-urgent-yellow{border-color:rgba(180,130,0,0.3);box-shadow:0 0 20px rgba(180,130,0,0.05)}' +
    'html.light .phase-countdown.cd-urgent-orange{border-color:rgba(180,100,0,0.3);box-shadow:0 0 24px rgba(180,100,0,0.06)}' +
    'html.light .phase-countdown.cd-urgent-red{border-color:rgba(200,50,50,0.35);box-shadow:0 0 28px rgba(200,50,50,0.08)}';
  document.head.appendChild(phaseCss);

  /* ── Update all school-aware UI elements ── */
  function updateSchoolUI(school) {
    // Toggle buttons
    document.querySelectorAll('.school-toggle-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-school') === school);
    });

    // Date elements: <span data-date-sommeiller="8 April" data-date-monti="10 April">
    document.querySelectorAll('[data-date-sommeiller]').forEach(function (el) {
      el.textContent = el.getAttribute('data-date-' + school) || '';
    });

    // Show/hide school-specific blocks: <div data-school-show="sommeiller">
    document.querySelectorAll('[data-school-show]').forEach(function (el) {
      el.style.display = el.getAttribute('data-school-show') === school ? '' : 'none';
    });

    // Timeline column highlight
    document.querySelectorAll('.tl-sommeiller').forEach(function (td) {
      td.classList.toggle('tl-active', school === 'sommeiller');
    });
    document.querySelectorAll('.tl-monti').forEach(function (td) {
      td.classList.toggle('tl-active', school === 'monti');
    });

    startCountdown();
    startPhaseCountdowns();
  }

  /* ── Show school-selector modal ── */
  function showModal() {
    var overlay = document.createElement('div');
    overlay.id = 'fp-school-modal';
    overlay.innerHTML =
      '<div class="fp-modal-backdrop"></div>' +
      '<div class="fp-modal-card">' +
        '<img src="../shared/logo.svg" alt="Grow in Tech" class="fp-modal-logo">' +
        '<h2 class="fp-modal-title">Welcome to the Final Project</h2>' +
        '<p class="fp-modal-sub">Choose your school to see the right deadlines and schedule throughout the site.</p>' +
        '<div class="fp-modal-schools">' +
          '<button class="fp-modal-school" data-school="sommeiller">' +
            '<span class="fp-modal-school-icon">\uD83C\uDFDB\uFE0F</span>' +
            '<span class="fp-modal-school-name">Sommeiller</span>' +
            '<span class="fp-modal-school-day">Wednesday</span>' +
          '</button>' +
          '<button class="fp-modal-school" data-school="monti">' +
            '<span class="fp-modal-school-icon">\uD83C\uDFDB\uFE0F</span>' +
            '<span class="fp-modal-school-name">Monti</span>' +
            '<span class="fp-modal-school-day">Friday</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Double rAF so the transition triggers after the element is in the DOM
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { overlay.classList.add('visible'); });
    });

    overlay.querySelectorAll('.fp-modal-school').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var school = btn.getAttribute('data-school');
        btn.classList.add('selected');
        setSchool(school);

        setTimeout(function () {
          overlay.classList.add('leaving');
          setTimeout(function () {
            overlay.remove();
            updateSchoolUI(school);
            // Start the guided tour after modal closes
            startGuidedTour(false);
          }, 450);
        }, 350);
      });
    });
  }

  /* ── Multi-step guided tour ── */
  var TOUR_STEPS_INDEX = [
    {
      target: '#school-toggle',
      title: 'Switch School',
      desc: 'Tap here anytime to switch between Sommeiller and Monti. All dates and deadlines update automatically.',
      position: 'below'
    },
    {
      target: '#tour-countdown',
      title: 'Live Countdown',
      desc: 'Shows the time remaining to your next deadline. It updates in real time based on your selected school.',
      position: 'below'
    },
    {
      target: '#tour-phases',
      title: 'Project Phases',
      desc: 'Your project is split into 4 phases. Click any card to see the full instructions for that phase.',
      position: 'below'
    },
    {
      target: '#tour-overview',
      title: 'Phase Overview',
      desc: 'A quick summary of what each phase requires — useful for a bird\'s-eye view of the entire project.',
      position: 'below'
    },
    {
      target: '#tour-timeline',
      title: 'Timeline',
      desc: 'All key dates in one table. The column for your school is highlighted automatically.',
      position: 'below'
    },
    {
      target: '#tour-rubric',
      title: 'Grading Rubric',
      desc: 'How your project will be graded — 100 points split across goals, guidelines, presentation and code quality.',
      position: 'above'
    },
    {
      target: '#tour-howto',
      title: 'How-to Guides',
      desc: 'Expand these for step-by-step tips on building forms, writing your diary, and doing market research.',
      position: 'above'
    },
    {
      target: '#tour-resources',
      title: 'Resources & Tools',
      desc: 'Links to every tool you\'ll need — Google Forms, Tally, Perplexity, XMind, JSBin, Bootstrap, and more.',
      position: 'above'
    }
  ];

  var tourActive = false;

  function startGuidedTour(forceReplay) {
    var TUTORIAL_KEY = 'git-fp-tutorial-seen';
    if (!forceReplay && localStorage.getItem(TUTORIAL_KEY)) return;

    // Only run on the index page
    var steps = TOUR_STEPS_INDEX;
    // Verify at least 2 targets exist (school toggle + one section)
    var available = steps.filter(function (s) { return document.querySelector(s.target); });
    if (available.length < 2) return;

    localStorage.setItem(TUTORIAL_KEY, '1');
    tourActive = true;
    var currentStep = 0;

    // Inject tour CSS
    var existing = document.getElementById('fp-tour-css');
    if (existing) existing.remove();
    var tourCss = document.createElement('style');
    tourCss.id = 'fp-tour-css';
    tourCss.textContent =
      '#fp-tour-overlay{position:fixed;inset:0;z-index:9999;pointer-events:none;transition:opacity .4s ease;opacity:0}' +
      '#fp-tour-overlay.visible{opacity:1}' +
      '#fp-tour-overlay.leaving{opacity:0;pointer-events:none}' +
      '.fp-tour-backdrop{position:fixed;inset:0;pointer-events:all}' +
      /* Highlight cut-out */
      '.fp-tour-highlight{position:absolute;border-radius:12px;box-shadow:0 0 0 4px rgba(0,225,255,.55),0 0 20px rgba(0,225,255,.3),0 0 60px rgba(0,225,255,.12);z-index:2;pointer-events:none;transition:all .5s cubic-bezier(.16,1,.3,1);animation:fpTourPulse 2.5s ease-in-out infinite}' +
      '@keyframes fpTourPulse{0%,100%{box-shadow:0 0 0 4px rgba(0,225,255,.55),0 0 20px rgba(0,225,255,.3),0 0 60px rgba(0,225,255,.12)}50%{box-shadow:0 0 0 6px rgba(0,225,255,.75),0 0 30px rgba(0,225,255,.4),0 0 80px rgba(0,225,255,.2)}}' +
      /* Tooltip card */
      '.fp-tour-tooltip{position:absolute;z-index:3;pointer-events:all;max-width:320px;width:max-content;opacity:0;transform:translateY(12px);transition:opacity .4s ease .15s,transform .4s cubic-bezier(.16,1,.3,1) .15s}' +
      '#fp-tour-overlay.visible .fp-tour-tooltip{opacity:1;transform:translateY(0)}' +
      '.fp-tour-tooltip-card{background:rgba(8,16,32,.92);border:1px solid rgba(0,225,255,.25);border-radius:14px;padding:18px 20px 16px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 16px 48px rgba(0,0,0,.45)}' +
      '.fp-tour-tooltip-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:6px;line-height:1.3}' +
      '.fp-tour-tooltip-desc{font-size:13px;color:rgba(200,215,230,.85);line-height:1.55;margin-bottom:14px}' +
      /* Tooltip footer (dots + buttons) */
      '.fp-tour-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}' +
      '.fp-tour-dots{display:flex;gap:5px}' +
      '.fp-tour-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.2);transition:all .3s}' +
      '.fp-tour-dot.active{background:rgba(0,225,255,.8);box-shadow:0 0 6px rgba(0,225,255,.4)}' +
      '.fp-tour-dot.done{background:rgba(0,225,255,.35)}' +
      '.fp-tour-actions{display:flex;gap:8px}' +
      '.fp-tour-btn{font-family:\"DM Sans\",sans-serif;font-size:12px;font-weight:600;letter-spacing:.04em;padding:6px 16px;border-radius:8px;border:none;cursor:pointer;transition:all .2s}' +
      '.fp-tour-btn-next{background:var(--grad);color:#fff}' +
      '.fp-tour-btn-next:hover{transform:scale(1.04);box-shadow:0 4px 16px rgba(0,225,255,.25)}' +
      '.fp-tour-btn-skip{background:transparent;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.12)}' +
      '.fp-tour-btn-skip:hover{color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.25)}' +
      /* Step counter */
      '.fp-tour-counter{font-size:10px;color:rgba(255,255,255,.35);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}' +
      /* Light mode */
      'html.light .fp-tour-tooltip-card{background:rgba(255,255,255,.95);border-color:rgba(0,80,204,.2);box-shadow:0 16px 48px rgba(0,0,0,.12)}' +
      'html.light .fp-tour-tooltip-title{color:#0d1020}' +
      'html.light .fp-tour-tooltip-desc{color:#3a4055}' +
      'html.light .fp-tour-dot{background:rgba(0,0,0,.12)}' +
      'html.light .fp-tour-dot.active{background:rgba(0,80,204,.7);box-shadow:0 0 6px rgba(0,80,204,.3)}' +
      'html.light .fp-tour-dot.done{background:rgba(0,80,204,.25)}' +
      'html.light .fp-tour-btn-skip{color:rgba(0,0,0,.4);border-color:rgba(0,0,0,.1)}' +
      'html.light .fp-tour-highlight{box-shadow:0 0 0 4px rgba(0,80,204,.45),0 0 20px rgba(0,80,204,.25),0 0 60px rgba(0,80,204,.1)}' +
      'html.light .fp-tour-counter{color:rgba(0,0,0,.3)}';
    document.head.appendChild(tourCss);

    // Create overlay container
    var overlay = document.createElement('div');
    overlay.id = 'fp-tour-overlay';

    // SVG backdrop: full-screen rect with a cut-out hole
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'fp-tour-backdrop');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:all';

    var defs = document.createElementNS(svgNS, 'defs');
    var mask = document.createElementNS(svgNS, 'mask');
    mask.setAttribute('id', 'fp-tour-mask');
    var maskBg = document.createElementNS(svgNS, 'rect');
    maskBg.setAttribute('x', '0');
    maskBg.setAttribute('y', '0');
    maskBg.setAttribute('width', '100%');
    maskBg.setAttribute('height', '100%');
    maskBg.setAttribute('fill', 'white');
    mask.appendChild(maskBg);

    var maskHole = document.createElementNS(svgNS, 'rect');
    maskHole.setAttribute('fill', 'black');
    maskHole.setAttribute('rx', '12');
    mask.appendChild(maskHole);
    defs.appendChild(mask);
    svg.appendChild(defs);

    var backdrop = document.createElementNS(svgNS, 'rect');
    backdrop.setAttribute('x', '0');
    backdrop.setAttribute('y', '0');
    backdrop.setAttribute('width', '100%');
    backdrop.setAttribute('height', '100%');
    backdrop.setAttribute('fill', 'rgba(0,0,0,0.7)');
    backdrop.setAttribute('mask', 'url(#fp-tour-mask)');
    svg.appendChild(backdrop);

    overlay.appendChild(svg);

    // Highlight ring element
    var highlight = document.createElement('div');
    highlight.className = 'fp-tour-highlight';
    overlay.appendChild(highlight);

    // Tooltip element
    var tooltip = document.createElement('div');
    tooltip.className = 'fp-tour-tooltip';
    overlay.appendChild(tooltip);

    document.body.appendChild(overlay);

    function buildTooltipHTML(step, idx, total) {
      var dots = '';
      for (var d = 0; d < total; d++) {
        var cls = d < idx ? 'done' : (d === idx ? 'active' : '');
        dots += '<span class="fp-tour-dot ' + cls + '"></span>';
      }
      var isLast = idx === total - 1;
      return '<div class="fp-tour-tooltip-card">' +
        '<div class="fp-tour-counter">Step ' + (idx + 1) + ' of ' + total + '</div>' +
        '<div class="fp-tour-tooltip-title">' + step.title + '</div>' +
        '<div class="fp-tour-tooltip-desc">' + step.desc + '</div>' +
        '<div class="fp-tour-footer">' +
          '<div class="fp-tour-dots">' + dots + '</div>' +
          '<div class="fp-tour-actions">' +
            '<button class="fp-tour-btn fp-tour-btn-skip" id="fp-tour-skip">Skip</button>' +
            '<button class="fp-tour-btn fp-tour-btn-next" id="fp-tour-next">' + (isLast ? 'Done \u2713' : 'Next \u2192') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    function positionElements(stepData) {
      var targetEl = document.querySelector(stepData.target);
      if (!targetEl) return;

      var padX = 10, padY = 8;
      var rect = targetEl.getBoundingClientRect();

      var hlLeft = rect.left - padX;
      var hlTop = rect.top - padY;
      var hlW = rect.width + padX * 2;
      var hlH = rect.height + padY * 2;

      // Highlight ring (fixed, viewport coordinates)
      highlight.style.position = 'fixed';
      highlight.style.left = hlLeft + 'px';
      highlight.style.top = hlTop + 'px';
      highlight.style.width = hlW + 'px';
      highlight.style.height = hlH + 'px';

      // SVG mask hole (viewport coordinates)
      maskHole.setAttribute('x', hlLeft);
      maskHole.setAttribute('y', hlTop);
      maskHole.setAttribute('width', hlW);
      maskHole.setAttribute('height', hlH);

      // Tooltip position (fixed, always visible in viewport)
      tooltip.style.position = 'fixed';
      var tooltipGap = 14;
      var visibleBottom = Math.min(rect.bottom + padY, window.innerHeight);
      var visibleTop = Math.max(rect.top - padY, 0);

      if (stepData.position === 'above' || visibleBottom + 160 > window.innerHeight) {
        // Place above the visible top of the element
        tooltip.style.bottom = (window.innerHeight - visibleTop + tooltipGap) + 'px';
        tooltip.style.top = 'auto';
      } else {
        // Place below the visible bottom of the element
        tooltip.style.top = (visibleBottom + tooltipGap) + 'px';
        tooltip.style.bottom = 'auto';
      }
      // Center tooltip relative to target, clamped to viewport
      var tooltipLeft = Math.max(16, Math.min(
        hlLeft + hlW / 2 - 160,
        window.innerWidth - 340
      ));
      tooltip.style.left = tooltipLeft + 'px';
    }

    function showStep(idx) {
      currentStep = idx;
      var stepData = available[idx];
      var targetEl = document.querySelector(stepData.target);
      if (!targetEl) { endTour(); return; }

      // Scroll target into view first
      var rect = targetEl.getBoundingClientRect();
      var scrollTarget = rect.top + (window.scrollY || window.pageYOffset) - window.innerHeight / 4;

      window.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' });

      // Wait for scroll to settle, then position
      setTimeout(function () {
        tooltip.innerHTML = buildTooltipHTML(stepData, idx, available.length);
        positionElements(stepData);

        // Re-trigger tooltip animation
        overlay.classList.remove('visible');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            overlay.classList.add('visible');
          });
        });

        // Bind buttons
        var nextBtn = document.getElementById('fp-tour-next');
        var skipBtn = document.getElementById('fp-tour-skip');
        if (nextBtn) nextBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (idx < available.length - 1) {
            overlay.classList.remove('visible');
            setTimeout(function () { showStep(idx + 1); }, 300);
          } else {
            endTour();
          }
        });
        if (skipBtn) skipBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          endTour();
        });
      }, 500);
    }

    // Update mask hole on scroll/resize
    function updatePositions() {
      if (!tourActive) return;
      var stepData = available[currentStep];
      if (stepData) positionElements(stepData);
    }
    window.addEventListener('scroll', updatePositions);
    window.addEventListener('resize', updatePositions);

    function endTour() {
      tourActive = false;
      overlay.classList.remove('visible');
      overlay.classList.add('leaving');
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
      setTimeout(function () {
        overlay.remove();
        var css = document.getElementById('fp-tour-css');
        if (css) css.remove();
      }, 500);
    }

    // Start after a brief delay
    setTimeout(function () {
      showStep(0);
    }, 300);
  }

  // Expose globally for the replay button
  window._fpStartTour = function () {
    if (tourActive) return;
    startGuidedTour(true);
  };

  /* ── Init on DOMContentLoaded ── */
  document.addEventListener('DOMContentLoaded', function () {
    // Bind navbar toggle clicks
    document.querySelectorAll('.school-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var s = btn.getAttribute('data-school');
        setSchool(s);
        updateSchoolUI(s);
      });
    });

    // Start Phase 1 countdown immediately (deadline is same for both schools)
    startPhaseCountdowns();

    // Bind tour replay button
    var tourBtn = document.getElementById('tour-btn');
    if (tourBtn) {
      tourBtn.addEventListener('click', function () {
        if (window._fpStartTour) window._fpStartTour();
      });
    }

    var school = getSchool();
    if (school) {
      updateSchoolUI(school);
    } else {
      showModal();
    }
  });
})();

/* ── Global helpers (used via onclick in HTML) ── */
function toggleTrack(id) {
  var card = document.getElementById(id);
  var isOpen = card.classList.toggle('open');
  card.querySelector('.track-toggle').setAttribute('aria-expanded', String(isOpen));
}

function toggleHowto(id) {
  var card = document.getElementById(id);
  var isOpen = card.classList.toggle('open');
  card.querySelector('.howto-toggle').setAttribute('aria-expanded', String(isOpen));
}

function copyTemplate() {
  var el = document.getElementById('wa-template');
  if (!el) return;
  var text = el.textContent;
  navigator.clipboard.writeText(text).then(function () {
    var btn = document.getElementById('wa-copy-btn');
    if (btn) {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    }
  });
}
