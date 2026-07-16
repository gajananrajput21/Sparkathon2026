# Lyra Agentic

**Interfaces that fit people, not the other way around.**

Lyra Agentic is an *agentic UI layer* for B2B SaaS (built in the NICE CXone / Lyra context). The AI infers each user's intent and reshapes the interface to fit them — navigation, layout, and density adapt per person. Critically, people also collaborate in shared files: the same shared file is rendered completely differently for two viewers at the same time. Everything is measured (telemetry + a live Trust Index) and humans stay in control (approve / edit / reject, universal undo, earned autonomy).

This repo holds the concept, a working interactive prototype, the management deck, and the full strategy/build docs.

## What's inside

```
├── prototype/
│   ├── adaptive-workspace-cea.html   ← main prototype (open this)
│   └── adaptive-workspace-v1.html    ← earlier generic-Lyra version
├── deck/
│   └── lyra-agentic-deck.html        ← NICE-branded management deck
├── concept/
│   └── adaptive-workspace-concept.png ← the concept poster
└── docs/
    ├── 00-master-plan.md             ← sprint lead plan + frozen contracts
    ├── 01-brain.md                   ← Designer A lane (intent → layout tree)
    ├── 02-body.md                    ← Designer B lane (renderer, components, morph)
    ├── 03-proof.md                   ← Designer C lane (telemetry, Trust Index, trust controls)
    └── LYRA-AGENTIC-MASTER-FILE.md   ← consolidated architecture, 64 metrics, algorithms, roadmap
```

## The prototype

`prototype/adaptive-workspace-cea.html` — a self-contained, interactive CXone "Adaptive Workspace" built in the Lyra CEA design language (no build step; just open it in a browser). It demonstrates all four pillars of the concept:

1. **Adapts per person and per tab** — switch the user from the top-right avatar (Maya · Supervisor, Noah · Agent, Tom · Analyst, Dana · Admin) and the entire workspace reshapes: content, hero, navigation order, and every tab (Inbox, Conversations, Customers, Knowledge, Reports, Settings) render a role-specific view.
2. **Humans in control** — AI suggestions apply with a reversible undo; supervisor approvals gate high-blast actions; the admin controls an earned-autonomy ladder and a global kill-switch.
3. **Measured** — the **Live Signal** panel (topbar activity icon) shows a Trust Index that moves on approve (+1) / reject (−3) / undo (−2), an A:E:R ratio, an adaptations counter, an autonomy chip, and a live multi-user event stream.
4. **Collaborative** — the **Shared file** toggle splits the stage: the same case, open by two people, rendered as two completely different interfaces, side by side, with presence avatars.

### A 5th user: Ava Mercer · UX Master

Switch to **Ava Mercer** in the avatar menu for the **Adaptation Observatory** — a persona that watches the other four instead of doing case work. `home`/`reports`/`conversations`/`customers`/`knowledge`/`inbox`/`settings` surface the Catalog v1 composites (Trust Index, A:E:R, adoption, ROI, cohorts, governance) from a real per-day telemetry rollup (localStorage) that accrues as you use the app.

Ava's **Pattern Intelligence** tab (badge "v2") adds Catalog v2 — metrics **#65–85** (cards 11–17: sequential patterns, emergent personas, combination signals, collaboration, drift & anomaly, augmentation & skill, AI economics). Since no production traffic exists yet, this tab runs on a clearly-labeled **simulated** 8-week synthetic dataset (seeded, reproducible) — every number is computed live from that dataset by the method each catalog card specifies (PrefixSpan-style sequence mining, k-means clustering with a bootstrap-ARI stability check, a real Kaplan-Meier survival curve for Time-to-Trust, PSI/KS-style drift tests, etc.), following the v2 house rule of mining on one window and validating on a later one before trusting a pattern.

Ava's **Experiments & Releases** tab (badge "v1") adds Surface 3 of the dashboard spec — one record per `policy_version` with its pre-registered target metric, lift + 95% CI, all four guardrails, and rollback status.

### Filter by persona

Every page of the Observatory (Home, Experiments, Insights, and the rest) carries a **persona filter bar** — All / Supervisor / Agent / Analyst / Admin — pinned at the top, plus a **guardrail strip** (completion, undo, escalation, CLP) that recomputes for whichever scope is selected. Each persona is a simulated cohort of 100 people in the v1 engine (60 in v2) — one of whom is always the real interactive demo account (Maya Chen, Noah Adams, Tom Okafor, or Dana Levi), the rest generated for this analysis. Selecting a persona shows a roster sample of that cohort (name, autonomy tier, Trust Index, adaptive/holdout status) and recomputes every tile — lift, Trust Index, autonomy ladder, intent-match, CLP, stability, friction, patterns, clusters, drift, augmentation, economics — from that cohort's own data. A few metrics (the model's confidence-calibration curve, and cluster *fits* themselves) are intentionally kept whole-population, with a note explaining why, since they don't have a coherent single-persona definition.

### Run it

It's a static file — open `prototype/adaptive-workspace-cea.html` directly in a browser, or serve the folder:

```bash
cd prototype && python3 -m http.server 8000
# then open http://localhost:8000/adaptive-workspace-cea.html
```

Best viewed at ≥ 1000px wide so cards sit side-by-side and the shared file shows two full panes.

## The deck

`deck/lyra-agentic-deck.html` — a 13-slide NICE-branded management pitch (problem → idea → the working prototype → the shared-file differentiator → market → business model → ROI → three horizons → the ask). Open it and use **← / →** (or space) to move between slides.

## The concept & build plan

`docs/` contains the full concept: the sprint packs (00–03) with the four frozen contracts, and the consolidated master file (four-layer architecture, the 64-metric measurement catalog, the algorithms, and the three-horizon capability roadmap).

### Known contract note

The demo's reduced event envelope (C2) omitted `user_id`; the sprint-pack C1/C2 — with a top-level `user` object and `user_id` — are the canonical versions, since the shared-file per-viewer telemetry depends on them.

## Status

Concept, interactive prototype, and management deck are complete. The ask: a 90-day instrumentation pilot on one workflow, an executive sponsor in CX, and a small build team to take the prototype to a lift-proven pilot.
