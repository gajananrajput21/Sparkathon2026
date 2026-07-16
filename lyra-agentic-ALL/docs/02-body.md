# Lyra Agentic Sprint — 02 · DESIGNER B: BODY

**Your mission in one line:** everything visible — the UI that receives a "layout tree" and builds itself, morphs between layouts, and shows the same shared file differently for two different people.

You are a UX designer; Claude Code writes all the code. Paste the prompts in order, run the visual check after each, paste errors back until it passes. You own the demo's beauty — your eye is the quality bar here.

## What you own / what you never touch

- **You own:** `index.html`, `renderer.js`, `components.js`, `styles.css`, `test-body.html`
- **You never touch:** API calls (BRAIN) or event storage/panels (PROOF). You call two global functions they provide: `window.lyraEmit(event)` and `window.lyraDispatch(action)` — if they don't exist yet, your code must no-op safely.

## Setup (10 minutes)

Create folder `lyra-body/`, open Claude Code there, create `CLAUDE.md` with:

```
You are BODY, one of three agents building a 2-day demo of Lyra Agentic —
an adaptive B2B interface. Your teammate is a UX designer, not a developer:
explain in plain language and always say how to visually verify each step.

YOUR SCOPE: rendering and visuals only. You consume layout-tree JSON
(contract C1 below) and produce the visible UI. You never call APIs and
never store events. You call window.lyraEmit(event) on every user
interaction (contract C2) and window.lyraDispatch(action) for consequential
actions (contract C3); if undefined, no-op.

FROZEN CONTRACTS:
C1 layout tree: {"user":{"id","persona"},"intent":{"goal","summary",
"confidence"},"archetype","slots":{"<slot>":{"component","config"}},
"policy_version"}
Components (exactly 8): MetricGrid, GeneratedChart, AdaptiveCard,
StreamingMessage, GeneratedTable, ActionBar, StepsTracker, PromptInput.
Archetype slots: answer: response,followups · monitor: overview,detail,
alerts · create: chat,canvas,controls · decide: criteria,comparison,
verdict · act: plan,progress,approval.
C2 event: {"event","component_id","archetype","user_id","value","ts",
"policy_version"}
C3 action: {"action_id","label","blast_radius":"low|high","payload",
"inverse"}
Contract changes: STOP and route to the sprint lead. Never change them.

DESIGN LANGUAGE (Lyra): ink #0A2230, lyra accent #2BD9C8, blue #007CBE,
mist bg #F5F8FA, white cards radius 10px shadow 1px 2px 10px #CFDCE6.
Fonts: Space Grotesk (headings), Open Sans (body), Inter 12px bold
uppercase (micro labels). Motion: 700ms cubic-bezier(.6,.05,.2,1),
transform/opacity only, honor prefers-reduced-motion.

TECH RULES: vanilla JS + CSS, no frameworks, runs by opening index.html.
```

## Your task sequence

### Prompt 1 — the stage and the tokens

```
Create index.html and styles.css: a full-screen app shell in the Lyra
design language — a slim top bar with the Lyra Agentic logo, a main
"stage" area where layouts render, and an empty right rail (340px)
reserved for the telemetry panel (PROOF will fill it; give it
id="lyra-telemetry"). Implement token modes as CSS custom-property sets
switched by attributes on <body>: data-persona (supervisor/agent/analyst
— each shifts accent tone subtly) and data-density (compact/comfortable —
spacing and type scale). Add a small dev toolbar (top-right) with
dropdowns to flip both attributes live.
```

✅ **Check:** open index.html — Lyra look, and flipping the toolbar dropdowns visibly changes spacing/accent everywhere.

### Prompt 2 — the eight components

```
Create components.js: factory functions for the 8 contract components.
Each returns a DOM element styled to the Lyra language, filled from its
config with plausible fake contact-center data when config fields are
missing: MetricGrid (4 stat tiles), GeneratedChart (CSS bar sparkline),
AdaptiveCard (title/fields/actions), StreamingMessage (text that types
itself in), GeneratedTable (sortable columns from config), ActionBar
(buttons; any button whose config marks blast_radius high must dispatch
via window.lyraDispatch with the full C3 object including inverse),
StepsTracker (3-step plan with states), PromptInput (text field + submit
that calls window.lyraOnPrompt(text) if defined). EVERY interaction —
click, sort, submit — calls window.lyraEmit with a valid C2 envelope
(user_id from the current tree's user). Create test-body.html rendering
all 8 in a grid.
```

✅ **Check:** test-body.html shows all 8 looking demo-worthy; open the browser console — every click prints an emit.

### Prompt 3 — the renderer and the morph (your signature moment)

```
Create renderer.js: window.renderTree(tree) that renders a contract-C1
tree into the stage — archetype-specific slot layout (monitor: overview
top full-width, detail left 60%, alerts right; create: chat left 40%,
canvas right, controls bottom-right; decide: criteria top, comparison
center-left, verdict right; answer and act analogous). Set body
data-persona from tree.user.persona. THE MORPH: when a new tree arrives,
diff against the current one — components present in both animate to
their new position/size (FLIP technique, transform/opacity, 700ms house
easing); departing ones fade+scale out; arriving ones fade+rise in.
Never rebuild a persisting component from scratch. Add a dropdown to
test-body.html with 3 sample trees (write them inline matching BRAIN's
demo inputs: monitor, create, decide) to switch between.
```

✅ **Check:** switching trees is smooth and beautiful — components glide, nothing flickers. Also check the reduced-motion setting disables it.

### Prompt 4 — the shared file, two humans (the killer feature)

```
Add a collaboration view: a toggle "Shared file" in the top bar. When on,
the stage splits into two synchronized panes rendering THE SAME fileId
("q3-report") for two viewers — Maya (supervisor) and Tom (analyst) —
each pane headed by a presence bar (avatar chips showing both users are
in the file, with the active viewer highlighted). Each pane calls
window.renderTree with a different tree (add two inline sample trees for
the same file: Maya's is approval-and-overview oriented, Tom's is
data-dense with charts). A small caption between panes reads: "Same file.
Two people. Two interfaces." Both panes emit C2 events with their own
user_id.
```

✅ **Check:** toggle on → same file, visibly different layouts side by side, presence avatars on both.

## Definition of done + handoff

All four checks pass. Day 2 H0: zip `lyra-body/` to the sprint lead; stay on call for integration.
