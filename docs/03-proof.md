# Lyra Agentic Sprint — 03 · DESIGNER C: PROOF

**Your mission in one line:** make the invisible visible — the live telemetry panel that proves every adaptation is measured, and the trust mechanics (approve / edit / reject / undo) that prove humans stay in control.

You are a UX designer; Claude Code writes all the code. Paste the prompts in order, verify each check, paste errors back until green. Your lane is what separates this demo from "another AI mockup" — the measurement brain, on screen.

## What you own / what you never touch

- **You own:** `telemetry.js`, `actions.js`, `test-proof.html` (+ the panel's styles)
- **You never touch:** the renderer or components (BODY), API calls (BRAIN). You provide two global functions the others call: `window.lyraEmit(event)` and `window.lyraDispatch(action)`.

## Setup (10 minutes)

Create folder `lyra-proof/`, open Claude Code there, create `CLAUDE.md` with:

```
You are PROOF, one of three agents building a 2-day demo of Lyra Agentic —
an adaptive B2B interface. Your teammate is a UX designer, not a developer:
explain in plain language and always say how to verify each step.

YOUR SCOPE: measurement and human control. You implement two globals the
other modules call:
window.lyraEmit(event)    — contract C2 (you collect and display)
window.lyraDispatch(action) — contract C3 (you intercept and govern)
You never render app components and never call external APIs.

FROZEN CONTRACTS:
C2 event: {"event","component_id","archetype","user_id","value","ts",
"policy_version"}
C3 action: {"action_id","label","blast_radius":"low|high","payload",
"inverse"}
Contract changes: STOP and route to the sprint lead.

VISUAL LANGUAGE: read the CSS custom properties BODY defines (ink, lyra,
mist tokens) — never redefine them; your panel must feel native. Fonts:
Inter 12px bold uppercase for labels, Open Sans for values, Space Grotesk
for the big numbers. The panel mounts into #lyra-telemetry (340px right
rail); if that element is absent (your test page), create a stand-in.

TECH RULES: vanilla JS + CSS, runs by opening an html file.
```

## Your task sequence

### Prompt 1 — the event stream (the heartbeat)

```
Create telemetry.js implementing window.lyraEmit(event): validate against
C2 (log invalid ones in red to console, don't crash), store in memory,
and render a live panel into #lyra-telemetry titled "LIVE SIGNAL": a
scrolling stream (newest first, max 50 visible) showing each event as a
compact row — component_id, event name, user_id chip, relative time
("2s ago"). New rows slide in with a subtle flash of the lyra accent.
Create test-proof.html that loads the panel and fires realistic synthetic
events every 1.5 seconds (mix of components, two user_ids: maya and tom).
```

✅ **Check:** open test-proof.html — a living stream, rows sliding in, two different user chips visible.

### Prompt 2 — the counters (the brain's face)

```
Add a counters section above the stream with three live tiles:
1. TRUST INDEX — big Space Grotesk number, starts at 72. Rules:
   approval event +1, rejection −3, undo −2, clamp 0–100. Animate
   value changes (count up/down) and pulse the tile.
2. A:E:R — approve:edit:reject running ratio as three small bars.
3. ADAPTATIONS — count of layout.rendered events, with a tiny
   "stability budget: X/2.0 spent" caption (macro change costs 1.0,
   count layout.rendered events as macro).
Wire all three to compute from the same event stream lyraEmit receives —
no separate bookkeeping. Extend the synthetic generator in
test-proof.html with approval/rejection/undo events so I can watch the
math live.
```

✅ **Check:** counters move correctly as synthetic events flow — reject drops Trust Index by 3, approvals tick it up.

### Prompt 3 — the approval gate (humans in control)

```
Create actions.js implementing window.lyraDispatch(action) per C3:
- blast_radius "low": execute immediately (log), journal the inverse,
  emit an action.executed event.
- blast_radius "high": FREEZE — render a modal ActionBar overlay, Lyra-
  styled: the action label, a one-line payload summary, and three
  buttons — Approve (lyra accent), Edit (opens the payload in an
  editable textarea, then approve), Reject (quiet red). Every decision
  emits the matching C2 event (action.approved / action.edited /
  action.rejected) and only Approve/Edit execute + journal the inverse.
- A persistent small "UNDO LAST" button in the panel: replays the most
  recent journaled inverse, emits action.undone, and shows a toast
  "Reversed."
- An autonomy chip in the panel showing the current mode: starts
  "REQUIRE APPROVAL"; after 3 consecutive approvals with no reject/undo,
  flips to "NOTIFY ONLY" (visually celebrated, subtle); any reject or
  undo flips it back instantly.
Add a "Fire high-blast action" button to test-proof.html sending a
realistic C3 action ("Send feedback to team", with an inverse).
```

✅ **Check:** the full ritual works: fire → overlay → Approve → Trust Index +1 → repeat ×3 → chip flips to NOTIFY ONLY → Undo → chip snaps back, index −2, toast shows. Run it end to end twice.

### Prompt 4 — the polish pass

```
Refine the panel to demo quality: consistent 8px spacing rhythm, the
counters aligned as a clean grid, stream rows truncating gracefully,
and a one-line footer: "Every adaptation measured · Every action
reversible". Verify nothing in the panel redefines BODY's tokens and
everything still works when #lyra-telemetry is provided by another page.
```

✅ **Check:** side-by-side with the Lyra landing style, the panel looks like the same family.

## Definition of done + handoff

All four checks pass. Day 2 H0: zip `lyra-proof/` to the sprint lead; stay on call during integration — your globals are the wiring everyone else plugs into, so you'll likely get the first integration questions.
