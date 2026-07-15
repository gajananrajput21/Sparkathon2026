/* PROOF (1/2) — measurement. Owns window.lyraEmit(event) [C2] and renders the
 * LIVE SIGNAL panel into #lyra-telemetry: event stream + Trust Index + A:E:R + Adaptations.
 * Shared state (window.LYRA) is read by actions.js. Never renders app components. */
(function () {
  var MAX_ROWS = 50;

  var state = {
    events: [],
    trust: 72,
    approve: 0, edit: 0, reject: 0,
    adaptations: 0,
    consecutiveApprovals: 0,
    autonomy: 'require'   // 'require' | 'notify'
  };
  window.LYRA = window.LYRA || {};
  window.LYRA.state = state;

  function now() { return (window.performance && performance.now) ? performance.now() : (+new Date()); }
  var t0 = now();
  function relTime(ts) {
    var s = Math.max(0, Math.round((now() - ts) / 1000));
    if (s < 1) return 'now';
    if (s < 60) return s + 's ago';
    var m = Math.floor(s / 60);
    return m + 'm ago';
  }

  function validC2(e) {
    return e && typeof e.event === 'string' && typeof e.user_id === 'string' && e.policy_version === 'demo-v1';
  }

  var USER_COLOR = { maya: 'var(--blue)', tom: 'var(--lyra)', noah: '#8B5CF6', dana: '#E0A100' };

  // ---- panel scaffold --------------------------------------------------------
  var mount, elTrust, elTrustTile, elBars, elAdapt, elBudget, elAutonomy, elStream;

  function ensureMount() {
    mount = document.getElementById('lyra-telemetry');
    if (!mount) { // stand-in for a bare test page
      mount = document.createElement('aside');
      mount.id = 'lyra-telemetry';
      document.body.appendChild(mount);
    }
    if (mount.dataset.built) return;
    mount.dataset.built = '1';
    mount.innerHTML =
      '<div class="tel-head">LIVE SIGNAL</div>' +
      '<div class="tel-counters">' +
      '  <div class="tel-tile" id="ti-tile"><div class="tel-label">Trust Index</div><div class="tel-big" id="ti-value">72</div><div class="tel-sub">approve +1 · reject −3 · undo −2</div></div>' +
      '  <div class="tel-tile"><div class="tel-label">A : E : R</div><div class="tel-bars" id="ti-bars"></div></div>' +
      '  <div class="tel-tile"><div class="tel-label">Adaptations</div><div class="tel-big" id="ti-adapt">0</div><div class="tel-sub" id="ti-budget">stability budget 0.0 / 2.0</div></div>' +
      '  <div class="tel-autonomy" id="ti-autonomy">REQUIRE APPROVAL</div>' +
      '</div>' +
      '<div class="tel-stream" id="ti-stream"></div>' +
      '<div class="tel-foot">Every adaptation measured · Every action reversible</div>';
    elTrust = mount.querySelector('#ti-value');
    elTrustTile = mount.querySelector('#ti-tile');
    elBars = mount.querySelector('#ti-bars');
    elAdapt = mount.querySelector('#ti-adapt');
    elBudget = mount.querySelector('#ti-budget');
    elAutonomy = mount.querySelector('#ti-autonomy');
    elStream = mount.querySelector('#ti-stream');
    renderCounters();
  }

  // ---- rendering -------------------------------------------------------------
  function renderCounters() {
    elTrust.textContent = state.trust;
    elAdapt.textContent = state.adaptations;
    elBudget.textContent = 'stability budget ' + state.adaptations.toFixed(1) + ' / 2.0';
    var total = state.approve + state.edit + state.reject || 1;
    elBars.innerHTML =
      bar('A', state.approve, total, 'var(--lyra)') +
      bar('E', state.edit, total, 'var(--blue)') +
      bar('R', state.reject, total, 'var(--red)');
    if (state.autonomy === 'notify') {
      elAutonomy.textContent = 'NOTIFY ONLY ✓';
      elAutonomy.classList.add('is-earned');
    } else {
      elAutonomy.textContent = 'REQUIRE APPROVAL';
      elAutonomy.classList.remove('is-earned');
    }
  }

  function bar(label, n, total, color) {
    var pct = Math.round((n / total) * 100);
    return '<div class="tel-bar"><span>' + label + '</span>' +
      '<i style="width:' + pct + '%;background:' + color + '"></i>' +
      '<b>' + n + '</b></div>';
  }

  function pushRow(e) {
    var row = document.createElement('div');
    row.className = 'tel-row';
    var color = USER_COLOR[e.user_id] || 'var(--slate)';
    row.innerHTML =
      '<span class="tel-comp">' + (e.component_id || e.event) + '</span>' +
      '<span class="tel-ev">' + e.event + '</span>' +
      '<span class="tel-user" style="background:' + color + '">' + e.user_id + '</span>' +
      '<span class="tel-time" data-ts="' + e.ts + '">now</span>';
    elStream.insertBefore(row, elStream.firstChild);
    while (elStream.childElementCount > MAX_ROWS) elStream.removeChild(elStream.lastChild);
    var showRow = function () { row.classList.add('in'); };
    requestAnimationFrame(showRow); setTimeout(showRow, 30); // rAF pauses in background tabs
  }

  function bumpTrust() {
    elTrustTile.classList.remove('pulse');
    void elTrustTile.offsetWidth; // reflow to restart the animation
    elTrustTile.classList.add('pulse');
  }

  // ---- the global everyone calls (C2) ---------------------------------------
  window.lyraEmit = function (event) {
    if (!validC2(event)) { console.error('[PROOF] invalid C2 event', event); return; }
    if (typeof event.ts !== 'number') event.ts = now();
    state.events.push(event);

    var n = event.event;
    if (n === 'action.approved' || n === 'suggestion.applied') { state.trust = Math.min(100, state.trust + 1); state.approve++; state.consecutiveApprovals++; bumpTrust(); }
    else if (n === 'action.edited') { state.trust = Math.min(100, state.trust + 1); state.edit++; state.consecutiveApprovals++; bumpTrust(); }
    else if (n === 'action.rejected') { state.trust = Math.max(0, state.trust - 3); state.reject++; state.consecutiveApprovals = 0; bumpTrust(); }
    else if (n === 'action.undone') { state.trust = Math.max(0, state.trust - 2); state.consecutiveApprovals = 0; bumpTrust(); }
    else if (n === 'layout.rendered') { state.adaptations++; }

    // autonomy ladder: 3 clean approvals in a row -> NOTIFY ONLY; any reject/undo resets
    if (state.consecutiveApprovals >= 3 && state.autonomy !== 'notify') state.autonomy = 'notify';
    if (n === 'action.rejected' || n === 'action.undone') state.autonomy = 'require';

    ensureMount();
    pushRow(event);
    renderCounters();
  };

  // keep relative times fresh
  setInterval(function () {
    if (!elStream) return;
    var rows = elStream.querySelectorAll('.tel-time');
    for (var i = 0; i < rows.length; i++) rows[i].textContent = relTime(+rows[i].dataset.ts);
  }, 1000);

  document.addEventListener('DOMContentLoaded', ensureMount);
  ensureMount();
})();
