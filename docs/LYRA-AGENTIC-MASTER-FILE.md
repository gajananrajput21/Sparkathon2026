# LYRA AGENTIC — THE MASTER FILE

Architecture · Components · All 64 Metrics · Algorithms · Long-Term Capability Plan · Agent Prompts, System Prompts & Skill Patches

**Version 1.0 · Consolidated single source of truth**

## Table of Contents

- **PART I** — Implementation Architecture (4 layers: Foundation, Components, Measurement, Algorithms — with interfaces, roadmap, team, risks)
- **PART II** — Component Library Specification (3-layer product architecture, intent object, 19 component contracts, 5 layout archetypes)
- **PART III** — Master Measurement Catalog (all 64 metrics, 7 composite indices, guardrails)
- **PART IV** — Algorithms Deep Dive (10 universal algorithms, per-component algorithms, statistical hygiene)
- **PART V** — Long-Term Capability Roadmap (Phase 0 → Year 3: every capability, in order)
- **PART VI** — Agent Operations Pack (contracts C1–C4, system prompts for BRAIN / BODY / PROOF / ORCHESTRATOR / INTEGRATOR, designer CLAUDE.md skills)
- **PART VII** — Skill Patch Roadmap (how the prompts and skills themselves evolve per phase)

---

# PART I — IMPLEMENTATION ARCHITECTURE

```
┌────────────────────────────────────────────────────┐
│ L4  ALGORITHM LAYER      decides                    │
│     bandits · autonomy ladder · calibration · VOI   │
├────────────────────────────────────────────────────┤
│ L3  MEASUREMENT LAYER    observes                   │
│     event bus · pipeline · profiles · holdout       │
├────────────────────────────────────────────────────┤
│ L2  COMPONENT LAYER      renders                    │
│     headless primitives · skins · containers        │
├────────────────────────────────────────────────────┤
│ L1  FOUNDATION LAYER     enables                    │
│     action runtime · layout engine · token modes    │
└────────────────────────────────────────────────────┘
```

Interfaces: L1→L2 primitive contract · L2→L3 event envelope · L3→L4 feature store · L4→L2 layout tree + config patches

## L1 — Foundation Architecture Layer

Four subsystems. Everything else is built on these.

### 1.1 The Headless Core

Every component = headless primitive (logic, state, a11y, telemetry) + skin (visuals only).

```
packages/
  @lyra/core         headless primitives, state machines, action + telemetry hooks
  @lyra/skins        default skin (token-driven), swappable per brand
  @lyra/layout       layout-tree renderer + archetype definitions
  @lyra/orchestrator client SDK for the decision service
  @lyra/telemetry    event envelope, batching, transport
  @lyra/tokens       token system with adaptation modes
```

Primitive contract (the L1→L2 interface):

```ts
interface LyraPrimitive<Config, State> {
  config: Config;                          // adaptation props, orchestrator-writable
  machine: StateMachine<State>;            // explicit, declared states
  emit: (event: LyraEvent) => void;        // built-in, cannot be omitted
  dispatch: (action: LyraAction) => void;  // routes through action runtime
  degrade: () => Config;                   // low-confidence fallback config
}
```

Non-negotiables baked into the base class: telemetry on every state transition (100% coverage by construction), a `degrade()` implementation, and a declared machine — a component without these does not compile.

### 1.2 Layout-as-Data Engine

Pages are not coded; they are layout trees the orchestrator emits and a renderer materializes:

```json
{
  "archetype": "decide",
  "version": "policy-v14",
  "slots": {
    "criteria":   {"component": "GeneratedTable", "config": {"columns": ["price","sla"]}},
    "comparison": {"component": "AdaptiveCard",   "config": {"density": "compact"}},
    "verdict":    {"component": "ActionBar",      "config": {"mode": "require_approval"}}
  }
}
```

Renderer: maps tree → primitives + skins. Pure function; no layout logic in components. Stability gate lives here: `diff(tree_t, tree_t+1)` → change_cost (micro .1 / meso .5 / macro 1.0); render blocked if session budget (2.0) exceeded — queued to session boundary. Archetype registry: the 5 archetypes (Answer/Create/Decide/Monitor/Act) are data files defining slots + defaults.

### 1.3 Action Runtime (trust as infrastructure)

All consequential operations route through one dispatcher — never direct API calls from components:

```
dispatch(action) →
  classify blast radius (config per action type)
  → consult autonomy ladder state (L4)
  → require_approval? render ActionBar interception
  → execute with journaled inverse operation (undo for free)
  → emit action lifecycle events (L3)
```

Properties this buys by construction: every AI action is reversible, approval gating is runtime-enforced, kill-switch parameters are dispatcher config, and approve/edit/reject telemetry feeds the Trust Index uniformly.

### 1.4 Token System with Adaptation Modes

| Mode axis | Values | Orchestrator flips when |
|-----------|--------|-------------------------|
| density | compact / comfortable / spacious | expertise + device + task stage |
| guidance | guided / balanced / minimal | novice ↔ expert estimate |
| persona | supervisor / agent / analyst / admin | role + intent |
| theme | light / dark / brand-n | user preference |

One mode flip re-derives every component's spacing, type scale, and chrome coherently — the mechanism behind "reshapes like a glove."

## L2 — Component Planning Layer

### 2.1 Build order (dependency-driven, value-early)

```
Wave 0  Foundation: primitive base class, action runtime, token modes,
        telemetry transport, layout renderer            [4–6 wks]
Wave 1  TRUST FAMILY first: ActionBar, Undo surface, StepsTracker,
        ConfidenceBadge, Escalation, Feedback           [4 wks]
Wave 2  Conversational: PromptInput, StreamingMessage,
        SuggestionChips, ClarificationCard, CitationChip [4 wks]
Wave 3  Containers: PageShell, SplitView + the 5 archetypes [3 wks]
Wave 4  Generative: AdaptiveCard, DynamicForm, GeneratedTable,
        GeneratedChart, ArtifactCanvas                  [5 wks]
```

Why trust-first: it's the family with no legacy equivalent, it exercises the action runtime immediately, and it's the differentiator in every pitch.

### 2.2 State machines

- **ActionBar:** proposing → awaiting_decision → (approved | editing → approved | rejected) → executing → reversible → settled. awaiting_decision duration = Time-to-Decision (#32); editing branch payload = Edit Delta (#33).
- **PageShell:** inferring → rendering(archetype) → stable → (adapting[budget-gated] | user_override → frozen). The user_override transition is a labeled training example (L4), an Intent-Match miss (#3), and a session-freeze command.

### 2.3 Definition of Done per component

Headless primitive + default skin, all machine states reachable · Storybook: one story per adaptation state + live telemetry panel · Contract doc (intent affordance · adaptation API · events · degrade) · Figma counterpart · Accessibility pass per state (announce that the UI adapted, or trust dies) · Degradation tested.

## L3 — Measurement Layer

### 3.1 Pipeline architecture

```
Primitive.emit()
  → client buffer (batch 5s / 50 events, offline-safe queue)
  → ingestion API (schema-validated against envelope; rejects malformed)
  → event bus (topic per family)
      ├→ raw event store (immutable, 13-mo retention, tenant-isolated)
      ├→ stream aggregators (sessionization, friction CUSUM, live metrics)
      ├→ feature store (per-user profiles, per-segment aggregates)  ← L4 reads here
      └→ analytics warehouse (the 64-metric catalog materialized as views)
```

The holdout is pipeline-level: 2–5% of users flagged at profile creation, stratified by segment; every metric view computes lift = adapted − holdout. Adaptation Lift (#1) is a column, not a project. Privacy by architecture: profiles store preferences and statistics, never content; aggregates leave the tenant only at k ≥ 20.

### 3.3 The L3→L4 interface: the feature store

```ts
interface UserFeatures {
  profile: DecayedPreferenceVector;   // verbosity, density, chip affinity…
  trust: { ti: number; ladder: Map<WorkflowId, AutonomyState> };
  intentHistory: IntentSummary[];
  calibration: { ece: number; overTrustGap: number };
  holdout: boolean;
}
```

## L4 — Algorithm Layer

Split principle: decisions online, learning offline. The decision service only evaluates pre-trained policies against the feature store — no training in the request path. Safety constraints live in the action space, not the reward: trust components cannot be hidden, approval requirements cannot be lowered by a learned policy, exploration spends inside the stability budget, per-user policy switches require n ≥ 20.

## Roadmap, Team, Risks

| Phase | Duration | Ships | Exit criterion |
|-------|----------|-------|----------------|
| 0 Foundation | 6 wks | L1 subsystems + pipeline skeleton | event round-trip: primitive → warehouse view |
| 1 Instrumented trust | 6 wks | Wave 1+2 components, static configs, dashboard | baseline data flowing; A:E:R and undo live |
| 2 Layout engine | 5 wks | Wave 3 containers, archetypes, budget gate | archetype switch demo, budget enforced |
| 3 First brains | 6 wks | verbosity + chip bandits, VOI gate, holdout on | first Adaptation Lift number with CI |
| 4 Full orchestration | 8 wks | archetype selection, autonomy ladder, Wave 4 | pilot workflow end-to-end, guardrails green |

~7 months to a lift-proven pilot. Team: 2 platform eng · 2 component eng · 1 data eng · 1 ML eng · 1 designer · PM/architect (phases 0–1 possible with five).

**Top risks:** foundation gold-plating (timebox Wave 0) · orchestrator wrongness erodes trust (holdout + guardrails auto-rollback) · latency (cache intent, render last-known-good) · telemetry schema churn (versioned envelope) · a11y regression (adaptation announcements are DoD).

The one-paragraph summary: four layers with data-only interfaces — primitives that cannot forget to measure, layouts that are diffable data, actions that are reversible by runtime, and algorithms that decide online but learn offline. Trust family first, holdout always on, adaptivity earned per workflow by proven lift.

---

# PART II — COMPONENT LIBRARY SPECIFICATION

## Part 1 — Architecture

### 1.1 The three layers

```
┌─────────────────────────────────────────────┐
│  INTENT LAYER — infers what the user is      │
│  trying to do. Output: Intent Object         │
├─────────────────────────────────────────────┤
│  ORCHESTRATION LAYER ("the smart layer")     │
│  Decides WHAT to render and HOW.             │
│  Output: Layout archetype + component config │
├─────────────────────────────────────────────┤
│  COMPONENT LAYER — agentic-ready components  │
│  that accept AI-driven config + emit telemetry│
└─────────────────────────────────────────────┘
         ▲                          │
         └──── telemetry loop ──────┘
```

### 1.2 The Intent Object

```json
{
  "goal": "compare_options | create | answer | monitor | act",
  "explicit_intent": "string — what the user literally asked",
  "implicit_intent": "string — inferred from behavior/context",
  "latent_intent": "reduce_uncertainty | learn | decide | delegate",
  "confidence": 0.0,
  "expertise_estimate": "novice | intermediate | expert",
  "urgency": "low | medium | high",
  "journey_stage": "explore | narrow | execute | verify",
  "context": { "device": "", "session_history_ref": "", "domain": "" }
}
```

### 1.4 The Component Contract (applies to every component)

Every component MUST define four things: **Intent affordance** (which goals it serves) · **Adaptation API** (params the orchestrator may flex) · **Telemetry emitted** (events mapped to a layer) · **Degradation behavior** (what it does at low confidence / model failure).

## Part 2 — Component Taxonomy

Five families, twenty core components:

- **A — Conversational primitives:** Prompt Input · Streaming Message · Suggestion Chips · Clarification Card · Citation Chip
- **B — Generative surfaces:** Adaptive Card · Dynamic Form · Generated Table · Generated Chart · Artifact Canvas
- **C — Agent transparency:** Plan/Steps Tracker · Tool-Call Indicator · Confidence Badge · Source Panel
- **D — Control & trust:** Action Bar (Approve/Edit/Reject) · Undo/Rollback · Human Escalation · Feedback Control
- **E — Adaptive containers:** Page Shell · Split View (Chat + Canvas)

*(Family-by-family contracts, adaptation APIs, telemetry and degradation for all 19 components are catalogued in the source spec; the strongest single trust signal is the Action Bar's approve : edit : reject ratio, and Undo is a hard invariant with no permitted degradation.)*

## Part 4 — Adaptive Layout Archetypes

| Archetype | Selected when goal = | Slots | Default components |
|-----------|----------------------|-------|--------------------|
| Answer | answer, quick lookup | header · response · follow-ups | Streaming Message, Citation Chips, Suggestion Chips |
| Create | create, draft, build | chat · canvas · controls | Split View, Artifact Canvas, Action Bar, Undo |
| Decide | compare_options | criteria · comparison · verdict | Generated Table, Adaptive Cards, Source Panel |
| Monitor | monitor, track | overview · detail · alerts | Generated Charts, Adaptive Cards, Confidence Badges |
| Act | act, delegate, execute | plan · progress · approval | Steps Tracker, Tool-Call Indicator, Action Bar, Escalation |

Transition rules: archetypes may change between turns, never mid-response; a user override freezes orchestrator layout changes for the session; journey_stage modulates density.

## Part 6 — Governance

- **Stability budget:** max N layout/config changes per session (start: 2). A UI that reshapes constantly destroys learnability.
- **Autonomy is earned, never defaulted:** mode upgrades require sustained approve-rate above threshold AND explicit user consent.
- **Undo is invariant:** every AI-initiated change must be reversible.
- **No fabricated confidence:** Confidence Badge and Citation Chip hide rather than guess.
- **Telemetry transparency:** users can view and reset their personalization profile.

---

# PART III — MASTER MEASUREMENT CATALOG (64 METRICS)

## 1. Composite indices (the headline numbers)

| # | Metric | Definition | Drives |
|---|--------|-----------|--------|
| 1 | Adaptation Lift | M(adapted) − M(static holdout) | Ship/rollback every adaptation policy |
| 2 | Trust Index (TI) | w1·AcceptRate + w2·(1−Intervention) + w3·Autonomy + w4·VerificationEase, EWMA α≈0.2 | Autonomy ladder, exec dashboard |
| 3 | Intent-Match Rate | sessions with no archetype override / all sessions | Orchestrator accuracy, retraining |
| 4 | Cognitive-Load Proxy (CLP) | z(turns)+z(help)+z(dwell/length)+z(clarifications) | Rollback clever-but-confusing adaptations |
| 5 | Confidence Calibration (ECE) | Σ(n_b/N)·\|acc(b)−conf(b)\| | Confidence Badge display gate (≤0.1) |
| 6 | Over-Trust Gap | acceptance rate on low-confidence outputs | Transparency prominence |
| 7 | Stability Spend | Σ change costs vs budget (micro .1 / meso .5 / macro 1.0, B_max=2) | Caps UI thrash per session |

## Metric families (2–9)

- **Intent & input (8–17):** prompt rewrite rate, hesitation index, prompt abandon, reformulation similarity, autocomplete acceptance, chip ignore rate, chip CTR@k (debiased), chip near-miss, archetype override rate, navigation path entropy.
- **Conversation & clarification (18–23):** clarification rate, answer vs skip, post-clarification lift, VOI gate, turns-to-success, follow-up/correction depth.
- **Response & satisfaction (24–30):** regeneration rate, copy/share rate, read-completion, mid-stream stop, rating distribution, correction-text volume, feedback rate.
- **Trust & control (31–39):** approve:edit:reject ratio, time-to-decision, edit delta, autonomy ladder state, intervention rate, steps expansion, citation open rate + trend, source click-through depth, tool indicator expansion.
- **Quality & recovery (40–48):** undo rate per (component,intent), undo half-life, redo-after-undo, escalation rate per intent, struggle score, prefill precision per field, AI retention ratio, revert rate, friction moments (CUSUM).
- **Efficiency & completion (49–53):** task completion rate, time-to-completion, multi-step completion, form funnel, tool usage frequency.
- **Personalization (54–60):** verbosity preference, chip source affinity, field relevance weights, chart type preference, split ratio preference, time in canvas vs chat, profile stability.
- **Business (61–64):** export/publish rate, action conversion, feature adoption & retention, support deflection.

## 10. Guardrails (ship with every experiment)

Completion Rate (49), Undo Rate (40), Escalation Rate (43), CLP (4) — any red movement blocks a policy from shipping regardless of its target metric. Plus hygiene invariants: static holdout always on (1), novelty discount ~2 weeks, min n=20 per user-level policy switch, k≥20 anonymity on aggregates, policy_version on every event.

**64 metrics · 19 components · 9 layers · 7 composite indices.**

---

# PART IV — ALGORITHMS DEEP DIVE

## Part A — Universal Algorithms

- **A2 Adaptation Lift** — Lift(M) = M(adapted) − M(holdout, static default). Keep a persistent 2–5% holdout; a policy that cannot beat static gets rolled back automatically.
- **A3 Trust Index** — TI = w1·AcceptRate + w2·(1−InterventionRate) + w3·AutonomyLevel + w4·VerificationEase; EWMA α≈0.2.
- **A4 Earned Autonomy** — per (user, workflow) ladder: require_approval → notify_only → autonomous. PROMOTE if AcceptRate(window N=30) ≥ 0.95 AND zero critical rejections AND explicit consent. DEMOTE on any critical rejection, undo on an autonomous action, or AcceptRate < 0.85 over last 10. Demotion instant; promotion slow — asymmetry is the safety property.
- **A5 Confidence calibration** — ECE = Σ_b (n_b/N)·\|acc(b)−conf(b)\|. ECE > 0.1 disables the Confidence Badge for that surface.
- **A6 Friction detection** — CUSUM changepoints on hesitation, rewrite bursts, rapid navigation, repeated undo → friction_moment events.
- **A7 Stability budget** — token bucket; costs micro .1 / meso .5 / macro 1.0; B_max = 2.0/session; a user-initiated change refunds its cost.
- **A8 Personalization & policy learning** — contextual bandit (Thompson / LinUCB); reward = task-completion + acceptance − regeneration/undo penalty; exploration capped inside the stability budget; safety-relevant configs excluded from the action space by construction.
- **A9 Intent-match rate** — every user override generates a labeled training example; the worst off-diagonal confusion cell is the next model investment.
- **A10 Cognitive-load proxy** — CLP = z(turns) + z(help) + z(dwell/length) + z(clarifications); rising CLP after a rollout = clever but confusing → roll back.

## Part C — Statistical Hygiene

Always report lift against the static holdout · novelty discount ~2 weeks · segment by User × Intent × Context × Outcome · min sample gates (n<20 no per-user switch) · guardrail metrics ship with every experiment · privacy by architecture (k≥20) · policy versioning on every event.

---

# PART V — LONG-TERM CAPABILITY ROADMAP

## Horizon 1 — Months 0–7: Prove

Phase 0 Foundation → Phase 1 Instrumented trust → Phase 2 Layout engine → Phase 3 First brains → Phase 4 Full orchestration. Exit criterion: one workflow where adapted UI beats static holdout with CI excluding zero, guardrails green.

## Horizon 2 — Months 7–18: Scale

Multi-user shared-file adaptation (per-viewer rendering, presence-aware layouts, conflict rules) · cross-session memory (portable profiles + user-visible editor) · team-level adaptation (role priors for new-hire cold-start) · full autonomy ladder in production + kill-switch console · intent model v2 (override-label flywheel, latent-intent inference) · archetype authoring kit · internal developer SDK.

## Horizon 3 — Months 18–36: Compound

External SDK / white-label (tenant-isolated telemetry) · predictive orchestration (pre-render likely next archetype) · organization-level intelligence (cross-team friction maps, ROI attribution) · adaptive accessibility · regulated-mode packs (EU AI Act export, audit presets) · closed-loop model improvement.

The compounding thesis: every event → better profiles → better adaptation → more usage → more events. Horizon 1 proves the loop; Horizon 2 widens it to teams and shared files; Horizon 3 sells the loop itself.

---

# PART VI — AGENT OPERATIONS PACK

## 0. The rule that makes parallelism work

Contracts freeze before agents start. Agents build against contracts, never against each other's code. With AI agents, build volume is cheap; integration failures are expensive.

## 1. Frozen contracts (Hour 0)

*(See the sprint packs 00–03 for the operative C1–C4. Note: the demo used a reduced C2 without user_id; the sprint-pack C1/C2 with top-level `user` / `user_id` are canonical for the demo — see the repo README's known-discrepancy note.)*

## 2. Agent roster

| Agent | Mission | Owns | Never touches |
|-------|---------|------|---------------|
| A — BRAIN | user text → valid C1 JSON; validation; 3 fallbacks | brain.js, orchestrator-prompt.txt, fallbacks.json | DOM, CSS |
| B — BODY | C1 tree → screen; 8 stubs; morph; token modes | renderer.js, components.js, styles.css | API calls, event storage |
| C — PROOF | telemetry panel + Trust Index + A:E:R; action runtime lite | telemetry.js, actions.js, panel styles | renderer internals |
| O — ORCHESTRATOR | runs the kanban; checks acceptance criteria; integrates; flags contract-drift | integration branch | feature code |

## 3. System prompts

Ready-to-paste system prompts for BRAIN, BODY, PROOF, ORCHESTRATOR and INTEGRATOR are in the sprint packs and the operating plan. Each agent shares zero files, communicates only through the 4 frozen contracts, and every ticket has literal acceptance criteria — so all three lanes run at full speed with integration risk concentrated at 3 planned checkpoints.

## 5. Kanban (summary)

Lanes A/B/C/O, columns Backlog → Ready → In-Progress → Review → Done. Priority P0 (demo dies without it) / P1 (convincing) / P2 (polish). P2 requires all P0 in Done across every lane first. After Day 2 H5: bug fixes only.

---

# PART VII — SKILL PATCH ROADMAP

The prompts and skills are living artifacts. Each phase patches them. Version everything; an agent running an outdated skill is a silent contract risk.

**Patch discipline:** every CLAUDE.md / system prompt carries `SKILL-VERSION: <phase>.<rev>`. A patch = additive section under `## PATCH <version>` — never silently rewrite earlier instructions. Contract changes ship as a patch to all skills simultaneously + a one-line CHANGELOG.

- **Patch 1.x — Demo → Phase 0:** BRAIN swaps fallback-first → schema-registry validation, adds envelope outcome_ref + adaptation_state (the demo envelope was the reduced C2). BODY replaces inline sample trees with archetype-registry loading + primitive-contract compliance. PROOF: Trust Index constants → config; holdout-awareness. NEW: PIPELINE agent.
- **Patch 2.x — Phase 2–3:** BODY stability-budget-gated renderer + a11y DoD. BRAIN intent-object v1 (journey_stage, expertise) + VOI. NEW: BANDIT agent (action-space safety in the prompt). ORCHESTRATOR: guardrail-block rule.
- **Patch 3.x — Horizon 2:** all skills multi-user context ("the user" → "each viewer"); C2 user_id mandatory; conflict rule (per-pane isolation wins). PROOF: autonomy hysteresis + kill-switch console. BRAIN: role-prior cold start. NEW: PROFILE steward agent.
- **Patch 4.x — Horizon 3:** tenant-isolation preamble. NEW: COMPLIANCE agent (EU AI Act / audit export). INTEGRATOR: SDK packaging checks.

**The meta-skill (write once, Phase 0):** a short `LYRA-COMMON.md` prepended to every agent skill — the frozen-contract law, the "explain in plain language + how to verify" rule, the vanilla-tech constraint, the escalation path, and the version/patch discipline.

---

*END OF MASTER FILE · Parts I–VII. Companion files: sprint designer packs (00–03), landing page, strategy one-pagers, ROI model.*
