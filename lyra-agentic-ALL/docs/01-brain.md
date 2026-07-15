# Lyra Agentic Sprint — 01 · DESIGNER A: BRAIN

**Your mission in one line:** everything between what a user types and a valid "layout tree" — the JSON that tells the UI how to rebuild itself.

You are a UX designer, not a developer — and that's fine. Claude Code writes all the code. Your job: paste the prompts below in order, run the checks after each one, and paste any error back to Claude until the check passes.

## What you own / what you never touch

- **You own:** `brain.js`, `orchestrator-prompt.txt`, `fallbacks.json`, `test-brain.html`
- **You never touch:** anything visual (that's BODY), anything about telemetry panels (that's PROOF). If your Claude starts building UI, stop it: "You are BRAIN. No DOM, no CSS."

## Setup (10 minutes)

1. Create a folder: `lyra-brain/`
2. Open Claude Code in that folder.
3. Create a file called `CLAUDE.md` and paste the block below into it — this is your agent's standing instructions for the whole sprint:

```
You are BRAIN, one of three agents building a 2-day demo of Lyra Agentic —
an adaptive B2B interface where AI infers user intent and reshapes the UI.
Your teammate is a UX designer, not a developer: explain what you build in
plain language, and always tell them exactly how to verify it works.

YOUR SCOPE: intent inference only. You produce layout-tree JSON. You never
write DOM code, CSS, or telemetry panels.

FROZEN CONTRACT C1 — your only output format:
{
  "user": {"id": "", "persona": "supervisor|agent|analyst"},
  "intent": {"goal": "monitor|create|decide|answer|act",
             "summary": "", "confidence": 0.0},
  "archetype": "monitor",
  "slots": {"<slotName>": {"component": "<Name>", "config": {}}},
  "policy_version": "demo-v1"
}
Allowed components (exactly): MetricGrid, GeneratedChart, AdaptiveCard,
StreamingMessage, GeneratedTable, ActionBar, StepsTracker, PromptInput.
Archetype slots (fixed): answer: response, followups · monitor: overview,
detail, alerts · create: chat, canvas, controls · decide: criteria,
comparison, verdict · act: plan, progress, approval.
If you ever want to change this contract: STOP and tell the designer to
ask the sprint lead. Never change it yourself.

TECH RULES: vanilla JavaScript only, no frameworks, no build tools.
Everything must run by opening an html file in a browser.
```

## Your task sequence — paste these prompts in order

### Prompt 1 — the three fallback trees (your safety net)

```
Create fallbacks.json containing three perfect, hand-crafted layout trees
per contract C1, keyed by these exact demo inputs:
1. "show me which agents are struggling today" → monitor archetype,
   user maya/supervisor: overview=MetricGrid, detail=GeneratedTable
   (config: columns showing agent names + a struggle score), alerts=AdaptiveCard.
2. "draft feedback for the weakest team" → create archetype, maya/supervisor:
   chat=StreamingMessage, canvas=AdaptiveCard (a drafted feedback note),
   controls=ActionBar with one high-blast action "Send feedback"
   (include a plausible inverse in the payload).
3. "compare this week to last week" → decide archetype, tom/analyst:
   criteria=GeneratedTable, comparison=GeneratedChart, verdict=AdaptiveCard.
Fill configs with realistic fake contact-center data. Then create
test-brain.html: a page with a dropdown of the three inputs and a <pre>
area that displays the selected tree, plus a green "VALID" / red "INVALID"
badge from a validator you write against contract C1.
```

✅ **Check:** open `test-brain.html` in your browser. All three selections show JSON with a green VALID badge.

### Prompt 2 — the orchestrator prompt (the actual brain)

```
Write orchestrator-prompt.txt: a system prompt for the Claude API. It
receives {userText, user:{id, persona}} and must return ONLY a valid
contract-C1 JSON object — no prose, no markdown fences. It must: infer
the goal from the text, pick the matching archetype, fill every slot for
that archetype using only the 8 allowed components, write a one-sentence
intent summary, set confidence (0-1), and tailor configs to the persona
(supervisors see approval-oriented views, analysts see data-dense views).
Include 2 few-shot examples inside the prompt. Explain to me in plain
language what each part of the prompt does.
```

✅ **Check:** read Claude's plain-language explanation; confirm the two examples produce trees that look like your fallbacks.

### Prompt 3 — the API caller with armor

```
Create brain.js with: window.lyraInfer = async (userText, user) that
calls the Anthropic API messages endpoint with orchestrator-prompt.txt
as the system prompt (model claude-sonnet-4-6, max_tokens 1000), parses
the response, validates against C1, and on ANY failure (invalid JSON,
network error, or 8-second timeout) returns the closest fallback tree
from fallbacks.json plus a flag {fallback: true}. Invalid JSON gets one
retry with a correction message before falling back. Add a test section
to test-brain.html: a text input + persona dropdown + "Infer" button that
shows the returned tree, whether it was live or fallback, and the
round-trip time.
```

> **Note (repo maintainers):** `claude-sonnet-4-6` is not a current model id. For a standalone build with your own key use `claude-sonnet-5` (recommended), `claude-opus-4-8`, or `claude-fable-5`.

✅ **Check:** type each demo input → VALID tree appears. Then turn off your wifi and click Infer → fallback tree appears within ~1 second with the fallback flag. Turn wifi back on.

### Prompt 4 — persona sensitivity (the adaptive proof)

```
Test that the same input with different personas returns meaningfully
different trees (different configs or component choices). Add a
"compare personas" button to test-brain.html that runs the same text as
supervisor and as analyst and shows both trees side by side, highlighting
the differences. If the model returns near-identical trees, strengthen
the persona instructions in orchestrator-prompt.txt.
```

✅ **Check:** same sentence, two personas → visibly different trees.

## Definition of done + handoff

Done = all four checks pass. Handoff (Day 2 H0): zip `lyra-brain/` and send to the sprint lead. Then be on call for integration questions.

## If you get stuck

Paste the exact error text to Claude and add: "Fix this. Explain what was wrong in one sentence." If Claude proposes changing contract C1 — refuse and message the lead. If a check keeps failing after 3 attempts, tell Claude: "Start this file over with a simpler approach that passes the check."
