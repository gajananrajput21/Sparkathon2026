# lyra-demo — integrated build (§5)

The three lanes wired together against the frozen C1–C4 contracts.

| Lane | Files | Provides |
|------|-------|----------|
| BRAIN | `brain.js`, `orchestrator-prompt.txt`, `fallbacks.json` | `window.lyraInfer(text, user)` → C1 layout tree (live Claude API + fallback armor) |
| BODY  | `index.html`, `renderer.js`, `components.js`, `styles.css` | `window.renderTree(tree)`, `window.lyraOnPrompt(text)`, 8 components, morph, shared-file split |
| PROOF | `telemetry.js`, `actions.js` | `window.lyraEmit(event)` [C2], `window.lyraDispatch(action)` [C3], Trust Index, approval gate, undo |

**Load order (index.html):** styles → telemetry → actions → components → renderer → brain.

## Run
Open `index.html` via any static server (fonts + fetch need http, not `file://`):
```
python3 -m http.server 8899 --directory .
```

## Live BRAIN (optional)
By default the demo runs on hand-crafted fallback trees — it works offline (master-plan §7).
To enable live inference, paste a key in `index.html` before boot:
```js
window.LYRA_API_KEY = 'sk-ant-...';
window.LYRA_MODEL = 'claude-sonnet-5';
```

## Smoke test (§5)
1. Page loads, no console errors.
2. "show me which agents are struggling today" → monitor archetype within 8s (or fallback banner + tree).
3. Every click on any component adds an event to the LIVE SIGNAL panel.
4. "draft feedback for the weakest team" → morph to create; Send opens the approval overlay; Approve moves the Trust Index; Undo reverses it.
5. Shared-file toggle shows Maya's and Tom's views side by side — same file, different layouts.

> These are net-new module builds against the contracts, standing in until the designers'
> real `lyra-brain` / `lyra-body` / `lyra-proof` handoff folders arrive; drop those in over these.
