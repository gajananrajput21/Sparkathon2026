# Lyra Agentic Sprint — 00 · MASTER PLAN (Sprint Lead)

**Team:** 4 UX designers · 4 Claude accounts (Claude Code) · Claude is the architect, developer, and algorithm assistant. You review visually and integrate — you never write code by hand.

## 1. What we are building (the concept)

A live demo of an agentic B2B interface: every user is an individual, but people sometimes work together in the same shared file. The entire system behaves around the agentic interface — the AI reads each person's intent and reshapes the UI to fit them, even when two people are looking at the same shared file at the same time.

The demo's killer moment: a shared document open side by side — Maya (supervisor) and Tom (analyst) see the same file rendered completely differently, each fitting their role like a glove — while a live telemetry panel proves every adaptation is measured, and every AI action waits for human approval and can be undone.

## 2. The team and the split

| File | Person | Codename | Builds |
|------|--------|----------|--------|
| 01 | Designer A | BRAIN | Intent inference: user text + persona → layout tree (Claude API + fallbacks) |
| 02 | Designer B | BODY | The visible UI: renderer, components, morph animation, shared-file collaboration view |
| 03 | Designer C | PROOF | Telemetry panel, Trust Index, approve/edit/reject + undo |
| 00 | You | LEAD | Contracts, integration, demo script, rehearsal |

Each person works in their own folder on their own Claude account. Nobody touches another lane's files. Everything connects through the contracts below.

## 3. The contracts (the law of the sprint)

These four JSON contracts appear in every designer file. They are frozen. If any designer's Claude suggests changing a contract, the answer is no — they message you instead, and only you may change a contract (then all four files update together).

### C1 — Layout Tree (BRAIN produces, BODY renders)

```json
{
  "user": {"id": "maya", "persona": "supervisor|agent|analyst"},
  "intent": {"goal": "monitor|create|decide|answer|act",
             "summary": "", "confidence": 0.0},
  "archetype": "monitor",
  "slots": {
    "<slotName>": {"component": "<ComponentName>", "config": {}}
  },
  "policy_version": "demo-v1"
}
```

Allowed components (exactly 8): MetricGrid, GeneratedChart, AdaptiveCard, StreamingMessage, GeneratedTable, ActionBar, StepsTracker, PromptInput

Archetype slots (fixed): answer: response, followups · monitor: overview, detail, alerts · create: chat, canvas, controls · decide: criteria, comparison, verdict · act: plan, progress, approval

### C2 — Event Envelope (everyone emits, PROOF collects)

```json
{"event": "component.action", "component_id": "", "archetype": "",
 "user_id": "", "value": {}, "ts": 0, "policy_version": "demo-v1"}
```

Emission is one global call: `window.lyraEmit(event)`. PROOF implements it; BODY calls it; if undefined, no-op.

### C3 — Action Contract (BODY dispatches, PROOF intercepts)

```json
{"action_id": "", "label": "", "blast_radius": "low|high",
 "payload": {}, "inverse": {}}
```

Via `window.lyraDispatch(action)`. High blast radius = approval overlay is mandatory.

### C4 — Shared-file view state (BODY internal, LEAD verifies)

The collaboration view renders the same fileId for two users simultaneously:

```json
{"fileId": "q3-report", "viewers": [{"id":"maya","persona":"supervisor"},{"id":"tom","persona":"analyst"}]}
```

One layout tree requested per viewer, rendered side by side with presence avatars.

## 4. Timeline

**DAY 1**
- H0 — You: send each designer their md file + confirm contracts read
- H0-H6 — Parallel build (each file has its own prompt sequence)
- H6 — CHECKPOINT 1 (video call, 20 min): each designer shares screen, shows their test page passing its checks
- H6-H9 — Continue per file; you collect blockers

**DAY 2**
- H0-H2 — Handoff: each designer sends their folder (zip or drive)
- H2-H4 — You + your Claude: INTEGRATION (procedure below)
- H4-H5 — Record backup video of the full flow (stage insurance)
- H5-H7 — Fix list only — NO new features
- H7-H8 — 3 full rehearsals with the demo script

## 5. Integration procedure (Day 2, your Claude Code session)

Create a folder `lyra-demo/` and copy in: BRAIN's `brain.js`, `orchestrator-prompt.txt`, `fallbacks.json` · BODY's `index.html`, `renderer.js`, `components.js`, `styles.css` · PROOF's `telemetry.js`, `actions.js`.

Paste this to your Claude Code:

> You are the INTEGRATOR. In this folder are three modules built against frozen contracts (pasted below). Wire them together in index.html: load order styles → telemetry.js → actions.js → components.js → renderer.js → brain.js. Do not redesign anything; only fix wiring. Then run this smoke test and fix failures one by one:
> 1. Page loads with no console errors.
> 2. Typing "show me which agents are struggling today" renders the monitor archetype within 8s (or fallback banner + tree).
> 3. Every click on any component adds an event to the telemetry panel.
> 4. Typing "draft feedback for the weakest team" morphs to create; the send action opens the approval overlay; Approve moves the Trust Index; Undo reverses it.
> 5. The shared-file toggle shows Maya's and Tom's views side by side, same file, different layouts.
> CONTRACTS: [paste C1-C4]

For every error: copy the console error, paste it to Claude, apply the fix, re-run. Do not debug by hand.

## 6. The demo script (10 minutes)

- **The problem (1 min):** "Every B2B system treats users as identical. Humans adapt to software. We reversed it."
- **Moment 1 — it listens (2 min):** type "show me which agents are struggling today" → the UI builds itself into a monitoring view. Point at the telemetry panel: "every adaptation, measured."
- **Moment 2 — it asks permission (2 min):** type "draft feedback for the weakest team" → morph to create → click send → approval overlay → Approve → Trust Index rises → Undo → everything reverses. "Autonomy is earned, and nothing is irreversible."
- **Moment 3 — the shared file (3 min):** open the collaboration view. "Same file. Two people. Two completely different interfaces — each fits its person like a glove. This is what no competitor shows."
- **The ask (2 min):** 90-day pilot on one workflow, success metrics agreed upfront.

## 7. Risk fallbacks (decide now, not on stage)

- API fails on stage → BRAIN's fallback trees render instantly with a small banner; the demo proceeds identically.
- Integration slips past Day 2 H4 → cut the approval flow, keep morph + telemetry + shared file (still a strong show).
- Everything burns → the backup video from H4-H5.

## 8. Your rules as lead

Never accept a contract change without updating all four files. Never allow a new feature after Day 2 H5. Every designer question about "can I also add…" → the answer is "backlog, after the demo." Your scarce resource is not code — it's rehearsal time.
