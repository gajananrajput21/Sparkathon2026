/* BODY (2/2) — renderer + morph + shared-file view. Owns window.renderTree(tree)
 * and window.lyraOnPrompt(text). Consumes a C1 tree, lays out archetype slots,
 * morphs between trees (persisting components fade/glide, arrivers rise in), and
 * renders the same shared file as two role-specific panes. */
(function () {
  var SLOTS = {
    answer: ['response', 'followups'],
    monitor: ['overview', 'detail', 'alerts'],
    create: ['chat', 'canvas', 'controls'],
    decide: ['criteria', 'comparison', 'verdict'],
    act: ['plan', 'progress', 'approval']
  };
  var AVATAR = { maya: 'var(--blue)', tom: 'var(--lyra)', noah: '#8B5CF6', dana: '#E0A100' };

  var stage, banner, currentTree = null, prevSlots = {};

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function emitRendered(tree) {
    if (typeof window.lyraEmit !== 'function') return;
    window.lyraEmit({
      event: 'layout.rendered',
      component_id: tree.archetype,
      archetype: tree.archetype,
      user_id: tree.user.id,
      value: { goal: tree.intent.goal, fallback: !!tree.fallback },
      ts: 0,
      policy_version: 'demo-v1'
    });
  }

  function buildSlots(tree, container, opts) {
    opts = opts || {};
    var want = SLOTS[tree.archetype] || [];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var grid = el('div', 'slots ' + tree.archetype);
    var newSlots = {};
    want.forEach(function (slotName) {
      var slotDef = tree.slots[slotName];
      if (!slotDef) return;
      var host = el('div', 'slot');
      host.dataset.slot = slotName;
      var ctx = { user_id: tree.user.id, archetype: tree.archetype, component_id: slotName };
      host.appendChild(window.lyraRenderComponent(slotDef.component, slotDef.config, ctx));
      grid.appendChild(host);
      newSlots[slotName] = slotDef.component;

      // MORPH: animate arrivers/changers; persisting same-component slots stay calm
      var changed = opts.morph && prevSlots[slotName] !== slotDef.component;
      var arriving = opts.morph && !prevSlots.hasOwnProperty(slotName);
      if (!reduce && opts.morph && (changed || arriving)) {
        host.classList.add('enter');
        var settle = function () { host.classList.remove('enter'); };
        requestAnimationFrame(function () { requestAnimationFrame(settle); }); setTimeout(settle, 80); // ensure it lands even if rAF is throttled
      }
    });
    container.appendChild(grid);
    if (opts.trackSlots) prevSlots = newSlots;
    return grid;
  }

  // ---- main entry ------------------------------------------------------------
  window.renderTree = function (tree, mountEl) {
    var target = mountEl || stage;
    if (!target) return;
    var morph = !mountEl && !!currentTree;

    // persona token mode + shared state for PROOF
    document.body.setAttribute('data-persona', tree.user.persona);
    window.LYRA = window.LYRA || {};
    window.LYRA.currentUser = tree.user.id;
    window.LYRA.currentArchetype = tree.archetype;

    if (!mountEl && banner) banner.style.display = tree.fallback ? 'block' : 'none';

    // fade the departing layout, then swap
    var old = target.querySelector('.slots');
    var intent = target.querySelector('.stage-intent');
    function swap() {
      target.innerHTML = '';
      var head = el('div', 'stage-intent');
      head.appendChild(el('span', 'goal', tree.intent.goal));
      head.appendChild(el('div', 'summary', tree.intent.summary || ''));
      target.appendChild(head);
      buildSlots(tree, target, { morph: morph, trackSlots: !mountEl });
    }
    if (old && morph) {
      old.style.transition = 'opacity .2s'; old.style.opacity = '0';
      if (intent) intent.style.opacity = '0';
      setTimeout(swap, 160);
    } else { swap(); }

    if (!mountEl) currentTree = tree;
    emitRendered(tree);
  };

  // ---- prompt -> infer -> render --------------------------------------------
  window.lyraOnPrompt = async function (text) {
    exitShared();
    window.LYRA = window.LYRA || {};
    window.LYRA.lastPrompt = text; // remembered so a persona switch can re-run the same intent
    var user = currentTree ? currentTree.user : { id: 'maya', persona: 'supervisor' };
    if (banner) { banner.style.display = 'block'; banner.textContent = 'Thinking…'; }
    var tree = await window.lyraInfer(text, user);
    if (banner) banner.textContent = tree.fallback ? 'Offline fallback layout — live model unavailable, demo continues.' : '';
    window.renderTree(tree);
  };

  // ---- shared-file split (the killer moment) --------------------------------
  var sharedOn = false;
  function mayaTree() {
    return {
      user: { id: 'maya', persona: 'supervisor' },
      intent: { goal: 'monitor', summary: 'Q3 report — supervisor lens.' },
      archetype: 'monitor',
      slots: {
        overview: { component: 'MetricGrid', config: { tiles: [{ label: 'Report status', value: 'Draft', delta: '1 approval left', trend: 'flat' }, { label: 'Team CSAT', value: '86%', delta: '+1.4pp', trend: 'up' }] } },
        detail: { component: 'AdaptiveCard', config: { title: 'Awaiting your approval', fields: [{ label: 'Refund', value: '$49 — Jordan Rivera, billing dispute #48213' }], actions: [{ action_id: 'approve-refund-48213', label: 'Approve refund', blast_radius: 'high', payload: { amount: 49, case: '48213' }, inverse: { action_id: 'reverse-refund-48213', label: 'Reverse refund', payload: { case: '48213' } } }] } },
        alerts: { component: 'AdaptiveCard', config: { title: 'Handling agent', fields: [{ label: 'Noah Adams', value: 'CSAT 88% · 2 active cases' }] } }
      },
      policy_version: 'demo-v1'
    };
  }
  function tomTree() {
    return {
      user: { id: 'tom', persona: 'analyst' },
      intent: { goal: 'decide', summary: 'Q3 report — analyst lens.' },
      archetype: 'decide',
      slots: {
        criteria: { component: 'MetricGrid', config: { tiles: [{ label: 'Sentiment', value: '+0.34', delta: 'rising', trend: 'up' }, { label: 'Talk ratio', value: '48%', delta: 'balanced', trend: 'flat' }, { label: 'Silence', value: '9%', delta: '-2pp', trend: 'up' }, { label: 'QA score', value: '91', delta: '+3', trend: 'up' }] } },
        comparison: { component: 'GeneratedChart', config: { title: 'Sentiment trend — case #48213', series: [{ name: 'Sentiment', values: [40, 45, 55, 52, 61, 68, 72] }], labels: ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00'] } },
        verdict: { component: 'GeneratedTable', config: { title: 'Detected topics', columns: ['Topic', 'Weight'], rows: [['Billing dispute', '0.61'], ['Refund request', '0.44'], ['Account access', '0.18']], highlight: 'Weight' } }
      },
      policy_version: 'demo-v1'
    };
  }
  function paneFor(user, lens, tree, activeUser) {
    var pane = el('div', 'pane');
    var pres = el('div', 'presence');
    ['maya', 'tom'].forEach(function (u) {
      var av = el('div', 'av' + (u === activeUser ? '' : ' dim'), u[0].toUpperCase());
      av.style.background = AVATAR[u];
      pres.appendChild(av);
    });
    pres.appendChild(el('div', null, '<div class="who">' + user + '</div><div class="lens">' + lens + '</div>'));
    pane.appendChild(pres);
    var body = el('div'); pane.appendChild(body);
    window.renderTree(tree, body);
    return pane;
  }
  function enterShared() {
    if (!stage) return;
    sharedOn = true;
    var btn = document.getElementById('sharedBtn'); if (btn) btn.classList.add('active');
    if (banner) banner.style.display = 'none';
    stage.innerHTML = '';
    var split = el('div', 'split');
    split.appendChild(el('div', 'shared-caption', 'Same file · q3-report · Two people · Two interfaces'));
    split.appendChild(paneFor('Maya Chen · Supervisor', 'approval & overview', mayaTree(), 'maya'));
    split.appendChild(paneFor('Tom Okafor · Analyst', 'data-dense', tomTree(), 'tom'));
    stage.appendChild(split);
  }
  function exitShared() {
    if (!sharedOn) return;
    sharedOn = false;
    var btn = document.getElementById('sharedBtn'); if (btn) btn.classList.remove('active');
    if (currentTree) { var t = currentTree; currentTree = null; window.renderTree(t); }
  }
  window.lyraToggleShared = function () { sharedOn ? exitShared() : enterShared(); };
  window.exitShared = exitShared;

  // switching persona re-runs the algorithm on the same intent -> the UI reshapes for the person
  window.lyraSetPersona = async function (persona) {
    exitShared();
    if (persona === 'uxmaster') { // the UX Master watches the system, not a work archetype
      if (typeof window.lyraRenderObservatory === 'function') { currentTree = null; window.lyraRenderObservatory(); }
      return;
    }
    var id = { supervisor: 'maya', analyst: 'tom', agent: 'noah' }[persona] || 'maya';
    var text = (window.LYRA && window.LYRA.lastPrompt) || 'show me which agents are struggling today';
    var tree = await window.lyraInfer(text, { id: id, persona: persona });
    if (banner) banner.style.display = tree.fallback ? 'block' : 'none';
    if (banner && tree.fallback) banner.textContent = 'Offline fallback layout — live model unavailable, demo continues.';
    window.renderTree(tree);
  };

  // ---- boot ------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    stage = document.getElementById('stage');
    banner = document.getElementById('fallbackBanner');
  });
})();
