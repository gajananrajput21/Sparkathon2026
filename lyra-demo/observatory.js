/* UX MASTER — the "brain of the UI" persona. Renders the Adaptation Observatory:
 * a meta-monitoring page over agentic adoption + user behavior + all measurement.
 * Reuses the 8 Lyra components; reads live window.LYRA.state and blends realistic
 * day-level aggregates. Not driven by the archetype brain — this user watches the system. */
(function () {
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // per-user behavior the UX Master monitors (day aggregates + inferred interpretation)
  var USERS = [
    { name: 'Maya Chen', role: 'Supervisor', adaptations: 34, ratio: '22 : 2', kept: '94%', top: 'monitor', read: 'Approves 92% of high-blast actions — autonomy safe to raise on approvals.' },
    { name: 'Tom Okafor', role: 'Analyst', adaptations: 41, ratio: '15 : 1', kept: '88%', top: 'decide', read: 'Re-densifies layouts and adds columns — bias data-dense for this persona.' },
    { name: 'Noah Adams', role: 'Agent', adaptations: 27, ratio: '15 : 4', kept: '79%', top: 'act', read: 'Dwells on single-case views, rejects team rollups — keep focus, avoid rollups.' }
  ];

  window.lyraRenderObservatory = function () {
    var stage = document.getElementById('stage'); if (!stage) return;
    var banner = document.getElementById('fallbackBanner'); if (banner) banner.style.display = 'none';
    var S = (window.LYRA && window.LYRA.state) || { trust: 72, adaptations: 0, approve: 0, edit: 0, reject: 0, events: [], autonomy: 'require' };

    document.body.setAttribute('data-persona', 'uxmaster');
    window.LYRA = window.LYRA || {};
    window.LYRA.currentUser = 'ava';
    window.LYRA.currentArchetype = 'observatory';
    var ctx = { user_id: 'ava', archetype: 'observatory', component_id: 'observatory' };

    stage.innerHTML = '';

    // hero
    var hero = el('div', 'obs-hero');
    hero.appendChild(el('span', 'goal', 'UX MASTER · OBSERVATORY'));
    hero.appendChild(el('h1', null, 'Ava Mercer — the UI’s own UX brain'));
    hero.appendChild(el('div', 'summary', 'Watching how the interface adapts, how each person responds, and what the system should learn from it.'));
    stage.appendChild(hero);

    // KPI row — live trust + adaptations, seeded adoption rates
    var totalAdapt = 102 + S.adaptations;
    var kpis = window.lyraRenderComponent('MetricGrid', { tiles: [
      { label: 'Adaptations today', value: String(totalAdapt), delta: '+' + S.adaptations + ' this session', trend: 'up' },
      { label: 'System Trust Index', value: String(S.trust), delta: S.trust >= 72 ? 'healthy' : 'watch', trend: S.trust >= 72 ? 'up' : 'down' },
      { label: 'Adoption rate', value: '87%', delta: 'kept vs reverted', trend: 'up' },
      { label: 'Autonomy', value: S.autonomy === 'notify' ? 'Notify' : 'Approval', delta: S.autonomy === 'notify' ? 'earned ✓' : 'required', trend: 'flat' },
      { label: 'Reversal rate', value: '6%', delta: '-2pp wk', trend: 'up' }
    ] }, ctx);
    stage.appendChild(kpis);

    // two-column: behavior table (wide) + interpretation card
    var two = el('div', 'obs-two');

    var table = window.lyraRenderComponent('GeneratedTable', {
      title: 'How each person uses the adapting UI',
      columns: ['User', 'Role', 'Adaptations', 'Approve : Reject', 'Kept', 'The system reads this as'],
      rows: USERS.map(function (u) { return [u.name, u.role, String(u.adaptations), u.ratio, u.kept, u.read]; }),
      highlight: 'Kept'
    }, ctx);
    two.appendChild(table);

    var interp = window.lyraRenderComponent('AdaptiveCard', {
      title: 'Human interpretation (what the data means)',
      fields: [
        { label: 'Supervisors', value: 'High approval, low reversal → raise autonomy on approvals.' },
        { label: 'Analysts', value: 'Densify + reorder → default to data-dense trees.' },
        { label: 'Agents', value: 'Reject rollups → keep single-case focus.' },
        { label: 'Net signal', value: 'Confidence to earn autonomy for supervisors; hold for agents.' }
      ]
    }, ctx);
    two.appendChild(interp);
    stage.appendChild(two);

    // adoption trend
    var chart = window.lyraRenderComponent('GeneratedChart', {
      title: 'Agentic adoption — last 7 days (adaptations vs reversals)',
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series: [
        { name: 'Adaptations', values: [72, 80, 86, 84, 95, 58, totalAdapt] },
        { name: 'Reversals', values: [9, 7, 8, 6, 5, 4, 6] }
      ]
    }, ctx);
    stage.appendChild(chart);

    // count this view as an adaptation too
    if (typeof window.lyraEmit === 'function') {
      window.lyraEmit({ event: 'layout.rendered', component_id: 'observatory', archetype: 'observatory', user_id: 'ava', value: { view: 'observatory' }, ts: 0, policy_version: 'demo-v1' });
    }
  };
})();
