/* BODY (1/2) — the 8 contract components. Each factory takes (config, ctx) where
 * ctx = {user_id, archetype, component_id} and returns a DOM element. Every user
 * interaction calls window.lyraEmit (C2); high-blast actions call window.lyraDispatch (C3).
 * Missing config fields fall back to plausible fake contact-center data. */
(function () {
  var POLICY = 'demo-v1';

  function emit(ctx, event, value) {
    if (typeof window.lyraEmit !== 'function') return; // no-op if PROOF absent
    window.lyraEmit({
      event: event,
      component_id: ctx.component_id,
      archetype: ctx.archetype || '',
      user_id: ctx.user_id || 'maya',
      value: value || {},
      ts: 0,
      policy_version: POLICY
    });
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function card(titleText) { var c = el('div', 'card'); if (titleText) c.appendChild(el('div', 'title', titleText)); return c; }

  var C = {};

  C.MetricGrid = function (cfg, ctx) {
    cfg = cfg || {};
    var tiles = cfg.tiles || [
      { label: 'Team CSAT', value: '86%', delta: '+1.4pp', trend: 'up' },
      { label: 'Cases in queue', value: '24', delta: 'steady', trend: 'flat' },
      { label: 'Approvals pending', value: '3', delta: '+2', trend: 'down' },
      { label: 'Avg handle time', value: '6:24', delta: '-0:12', trend: 'up' }
    ];
    var g = el('div', 'metricgrid');
    tiles.forEach(function (t) {
      var m = el('div', 'metric');
      m.appendChild(el('div', 'micro', t.label));
      m.appendChild(el('div', 'k', t.value));
      m.appendChild(el('div', 'd ' + (t.trend || 'flat'), t.delta || ''));
      m.addEventListener('click', function () { emit(ctx, 'metric.opened', { label: t.label }); });
      g.appendChild(m);
    });
    return g;
  };

  C.GeneratedTable = function (cfg, ctx) {
    cfg = cfg || {};
    var cols = cfg.columns || ['Agent', 'Struggle score'];
    var rows = cfg.rows || [['Marco Diaz', '82'], ['Priya Nair', '74']];
    var c = card(cfg.title);
    var table = el('table', 'gt');
    var thead = el('thead'), htr = el('tr');
    cols.forEach(function (col) {
      var th = el('th', null, col);
      th.addEventListener('click', function () { sortBy(col); emit(ctx, 'table.sorted', { column: col }); });
      htr.appendChild(th);
    });
    thead.appendChild(htr); table.appendChild(thead);
    var tbody = el('tbody');
    var hlIdx = cfg.highlight ? cols.indexOf(cfg.highlight) : -1;
    function draw(data) {
      tbody.innerHTML = '';
      data.forEach(function (r) {
        var tr = el('tr');
        r.forEach(function (cell, i) { var td = el('td', i === hlIdx ? 'hl' : null, cell); tr.appendChild(td); });
        tr.addEventListener('click', function () { emit(ctx, 'row.opened', { row: r[0] }); });
        tbody.appendChild(tr);
      });
    }
    function sortBy(col) {
      var i = cols.indexOf(col);
      var sorted = rows.slice().sort(function (a, b) {
        var av = parseFloat(String(a[i]).replace(/[^\d.-]/g, '')), bv = parseFloat(String(b[i]).replace(/[^\d.-]/g, ''));
        if (!isNaN(av) && !isNaN(bv)) return bv - av;
        return String(a[i]).localeCompare(String(b[i]));
      });
      draw(sorted);
    }
    table.appendChild(tbody);
    cfg.sortBy ? sortBy(cfg.sortBy) : draw(rows);
    c.appendChild(table);
    return c;
  };

  C.GeneratedChart = function (cfg, ctx) {
    cfg = cfg || {};
    var series = cfg.series || [{ name: 'This week', values: [83, 85, 87, 86, 88] }];
    var labels = cfg.labels || series[0].values.map(function (_, i) { return 'D' + (i + 1); });
    var colors = ['var(--blue)', 'var(--lyra)', '#8B5CF6'];
    var max = Math.max.apply(null, series.reduce(function (a, s) { return a.concat(s.values); }, [1]));
    var c = card(cfg.title || 'Trend');
    var chart = el('div', 'chart');
    labels.forEach(function (_, i) {
      var grp = el('div', 'grp');
      series.forEach(function (s, si) {
        var bar = el('div', 'bar');
        bar.style.background = colors[si % colors.length];
        bar.style.height = Math.round((s.values[i] / max) * 100) + '%';
        grp.appendChild(bar);
      });
      chart.appendChild(grp);
    });
    c.appendChild(chart);
    var labs = el('div', 'chart-labels'); labels.forEach(function (l) { labs.appendChild(el('span', null, l)); }); c.appendChild(labs);
    var legend = el('div', 'chart-legend');
    series.forEach(function (s, si) { legend.appendChild(el('span', null, '<i style="background:' + colors[si % colors.length] + '"></i>' + s.name)); });
    c.appendChild(legend);
    c.addEventListener('click', function () { emit(ctx, 'chart.inspected', { title: cfg.title }); });
    return c;
  };

  C.AdaptiveCard = function (cfg, ctx) {
    cfg = cfg || {};
    var c = card(cfg.title || 'Card');
    var fields = cfg.fields || [{ label: 'Info', value: '—' }];
    var wrap = el('div', 'fields');
    fields.forEach(function (f) {
      var row = el('div', 'f');
      row.appendChild(el('div', 'fl', f.label));
      row.appendChild(el('div', 'fv', f.value));
      wrap.appendChild(row);
    });
    c.appendChild(wrap);
    if (cfg.actions && cfg.actions.length) {
      var bar = C.ActionBar({ actions: cfg.actions }, ctx);
      bar.style.marginTop = '12px';
      c.appendChild(bar);
    }
    return c;
  };

  C.StreamingMessage = function (cfg, ctx) {
    cfg = cfg || {};
    var full = cfg.text || 'Working on it…';
    var c = card(cfg.title);
    var msg = el('div', 'stream-msg');
    var span = el('span'); var caret = el('span', 'caret', '&nbsp;');
    msg.appendChild(span); msg.appendChild(caret);
    c.appendChild(msg);
    var i = 0, reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { span.textContent = full; caret.remove(); }
    else {
      var timer = setInterval(function () {
        span.textContent = full.slice(0, ++i);
        if (i >= full.length) { clearInterval(timer); setTimeout(function () { caret.remove(); }, 400); }
      }, 16);
    }
    emit(ctx, 'message.streamed', { chars: full.length });
    return c;
  };

  C.ActionBar = function (cfg, ctx) {
    cfg = cfg || {};
    var actions = cfg.actions || [{ action_id: 'noop', label: 'OK', blast_radius: 'low' }];
    var bar = el('div', 'actionbar');
    actions.forEach(function (a) {
      var high = a.blast_radius === 'high';
      var btn = el('button', high ? 'high' : null, a.label || 'Action');
      btn.addEventListener('click', function () {
        emit(ctx, 'action.clicked', { action_id: a.action_id, label: a.label });
        if (typeof window.lyraDispatch === 'function') {
          window.lyraDispatch({ action_id: a.action_id || 'action', label: a.label, blast_radius: a.blast_radius || 'low', payload: a.payload || {}, inverse: a.inverse || null });
        }
      });
      bar.appendChild(btn);
    });
    return bar;
  };

  C.StepsTracker = function (cfg, ctx) {
    cfg = cfg || {};
    var steps = cfg.steps || [{ label: 'Verify', state: 'done' }, { label: 'Draft', state: 'active' }, { label: 'Send', state: 'todo' }];
    var c = card(cfg.title || 'Plan');
    var list = el('div', 'steps');
    steps.forEach(function (s, i) {
      var row = el('div', 'step ' + (s.state || 'todo'));
      row.appendChild(el('div', 'n', s.state === 'done' ? '✓' : (i + 1)));
      row.appendChild(el('div', null, '<div style="font-weight:600">' + s.label + '</div>'));
      row.addEventListener('click', function () { emit(ctx, 'step.opened', { step: s.label }); });
      list.appendChild(row);
    });
    c.appendChild(list);
    return c;
  };

  C.PromptInput = function (cfg, ctx) {
    cfg = cfg || {};
    var c = card(cfg.title);
    var wrap = el('div', 'promptinput');
    var input = el('input'); input.placeholder = cfg.placeholder || 'Ask Lyra…';
    var btn = el('button', null, 'Send');
    function submit() {
      var v = input.value.trim(); if (!v) return;
      emit(ctx, 'prompt.submitted', { text: v });
      if (typeof window.lyraOnPrompt === 'function') window.lyraOnPrompt(v);
      input.value = '';
    }
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    wrap.appendChild(input); wrap.appendChild(btn); c.appendChild(wrap);
    return c;
  };

  window.lyraComponents = C;
  window.lyraRenderComponent = function (name, cfg, ctx) {
    var f = C[name];
    if (!f) { console.error('[BODY] unknown component', name); return el('div', 'card', 'Unknown component: ' + name); }
    return f(cfg, ctx);
  };
})();
