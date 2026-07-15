/* BRAIN — intent inference. Owns: window.lyraInfer(userText, user) -> C1 layout tree.
 * Live path calls the Anthropic Messages API; on ANY failure it returns the closest
 * hand-crafted fallback tree from fallbacks.json with {fallback:true}.
 *
 * LIVE MODE is opt-in: set window.LYRA_API_KEY (and optionally window.LYRA_MODEL)
 * before this file loads. With no key we go straight to fallbacks — the demo runs
 * offline by design (see master-plan §7). */
(function () {
  var MODEL = (typeof window !== 'undefined' && window.LYRA_MODEL) || 'claude-sonnet-5';
  var TIMEOUT_MS = 8000;
  var ALLOWED = ['MetricGrid', 'GeneratedChart', 'AdaptiveCard', 'StreamingMessage', 'GeneratedTable', 'ActionBar', 'StepsTracker', 'PromptInput'];
  var SLOTS = {
    answer: ['response', 'followups'],
    monitor: ['overview', 'detail', 'alerts'],
    create: ['chat', 'canvas', 'controls'],
    decide: ['criteria', 'comparison', 'verdict'],
    act: ['plan', 'progress', 'approval']
  };

  var fallbacks = {};
  var orchestratorPrompt = '';
  var ready = (function () {
    var p1 = fetch('fallbacks.json').then(function (r) { return r.json(); }).then(function (j) { fallbacks = j; }).catch(function () { fallbacks = {}; });
    var p2 = fetch('orchestrator-prompt.txt').then(function (r) { return r.text(); }).then(function (t) { orchestratorPrompt = t; }).catch(function () { orchestratorPrompt = ''; });
    return Promise.all([p1, p2]);
  })();

  // ---- Contract C1 validation ------------------------------------------------
  function validateC1(tree) {
    if (!tree || typeof tree !== 'object') return 'not an object';
    if (!tree.user || typeof tree.user.persona !== 'string') return 'missing user.persona';
    if (!tree.intent || typeof tree.intent.goal !== 'string') return 'missing intent.goal';
    if (!SLOTS[tree.archetype]) return 'unknown archetype: ' + tree.archetype;
    if (!tree.slots || typeof tree.slots !== 'object') return 'missing slots';
    var want = SLOTS[tree.archetype];
    for (var i = 0; i < want.length; i++) {
      var s = tree.slots[want[i]];
      if (!s) return 'missing slot: ' + want[i];
      if (ALLOWED.indexOf(s.component) === -1) return 'bad component in ' + want[i] + ': ' + s.component;
    }
    if (tree.policy_version !== 'demo-v1') return 'bad policy_version';
    return null;
  }

  // ---- Fallback selection (intent match -> persona-specific tree) ------------
  // fallbacks.json is keyed by intent; each entry has {match:[keywords], base, personas:{}}.
  // We pick the intent by keyword score, then deep-merge the persona override onto the base
  // so the SAME text yields a genuinely different tree per persona.
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function deepMerge(target, source) {
    if (!source) return target;
    Object.keys(source).forEach(function (k) {
      if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k]) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
        deepMerge(target[k], source[k]);
      } else {
        target[k] = clone(source[k]);
      }
    });
    return target;
  }

  function pickIntent(userText) {
    var t = (userText || '').toLowerCase();
    var keys = Object.keys(fallbacks);
    var best = keys[0], bestScore = -1;
    keys.forEach(function (key) {
      var words = (fallbacks[key].match) || [];
      var score = words.reduce(function (acc, w) { return acc + (t.indexOf(w) !== -1 ? 1 : 0); }, 0);
      if (score > bestScore) { bestScore = score; best = key; }
    });
    return best;
  }

  function closestFallback(userText, user) {
    var key = pickIntent(userText);
    var entry = fallbacks[key];
    if (!entry || !entry.base) return emergencyTree(user);
    var persona = (user && user.persona) || 'supervisor';
    var tree = clone(entry.base);
    if (entry.personas && entry.personas[persona]) deepMerge(tree, entry.personas[persona]);
    tree.user = { id: (user && user.id) || 'maya', persona: persona };
    tree.policy_version = 'demo-v1';
    tree.fallback = true;
    return tree;
  }

  function emergencyTree(user) {
    return {
      user: { id: (user && user.id) || 'maya', persona: (user && user.persona) || 'supervisor' },
      intent: { goal: 'monitor', summary: 'Overview while the model is unavailable.', confidence: 0.5 },
      archetype: 'monitor',
      slots: {
        overview: { component: 'MetricGrid', config: { tiles: [{ label: 'Team CSAT', value: '86%', delta: '+1.4pp', trend: 'up' }] } },
        detail: { component: 'GeneratedTable', config: { columns: ['Agent', 'Struggle score'], rows: [['Marco Diaz', '82']] } },
        alerts: { component: 'AdaptiveCard', config: { title: 'Needs attention', fields: [{ label: 'Marco Diaz', value: 'Score 82' }] } }
      },
      policy_version: 'demo-v1',
      fallback: true
    };
  }

  // ---- Live API path ---------------------------------------------------------
  function extractJson(text) {
    var s = (text || '').trim();
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a === -1 || b === -1) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  }

  function callApi(userText, user, correction) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    var userMsg = JSON.stringify({ userText: userText, user: user });
    if (correction) userMsg += '\n\nYour previous reply was not valid JSON per contract C1 (' + correction + '). Reply again with ONLY the corrected JSON object.';
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': window.LYRA_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: orchestratorPrompt,
        messages: [{ role: 'user', content: userMsg }]
      })
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      var text = (data.content && data.content[0] && data.content[0].text) || '';
      return extractJson(text);
    }).finally(function () { clearTimeout(timer); });
  }

  // ---- Public entry point ----------------------------------------------------
  window.lyraInfer = async function (userText, user) {
    await ready;
    user = user || { id: 'maya', persona: 'supervisor' };

    if (!window.LYRA_API_KEY) {
      return closestFallback(userText, user); // offline / no-key: instant fallback
    }

    try {
      var tree = await callApi(userText, user, null);
      var err = validateC1(tree);
      if (err) {
        tree = await callApi(userText, user, err); // one correction retry
        err = validateC1(tree);
      }
      if (err) return closestFallback(userText, user);
      tree.fallback = false;
      if (user.id) tree.user.id = user.id;
      return tree;
    } catch (e) {
      return closestFallback(userText, user);
    }
  };

  // exposed for the smoke test / debugging
  window.lyraBrainReady = ready;
  window.lyraValidateC1 = validateC1;
})();
