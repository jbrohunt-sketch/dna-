# Astervell — The Observatory

A phone-first app built around Astervell's Workflow Clarity Pilot. Someone describes one
workflow that keeps slipping and gets a draft observation: an explorable map
of who can act, the evidence labelled honestly, and one reversible test.
From there they can take it to ChatGPT, Claude, Slack, a coding agent or
their calendar, or to Astervell itself.

Open `index.html` in any browser. Everything stays on the device.

## Flow

Arrival → questions (one per screen, branching by who it's for) → a
breathing pause → a sealed card → the observation (Explore · Evidence ·
Your test · Connect) → an invitation to the pilot → home, the library and
earlier observations.

## Principles

- **Nothing pretends.** The observation is built from readable rules, not
  AI, and says it's a draft. The pause says nothing is being calculated.
  Connections that don't exist yet are listed as not here yet.
- **Nothing leaves without being seen.** Every Connect option shows the
  exact text first.
- **Judgment stays human.** Each observation names the decision that must
  stay with people; the build brief forbids tools from making it.

## Structure

| Path | Role |
|---|---|
| `src/content.js` | Every word: questions (with audience branching), phrasing, workflow templates, resources |
| `src/engine.js` | Pure functions: answers → observation, the handoff model, test plan, recommendations, exports (prompt, share text, brief, `.ics`, JSON) |
| `src/app.js` | Scenes, sheets and choreography |
| `src/styles.css` | Design tokens and components |
| `build.py` | Inlines `src/` into `index.html` (`--check` verifies it's current) |
| `tests/engine.test.mjs` | Walks every audience and answer combination |
| `AUDIT.md` | What read as AI-made, what changed, what code can't fix |

```bash
python3 observatory/build.py                   # rebuild index.html after editing src/
node --test observatory/tests/engine.test.mjs  # engine tests
```

During development you can open `src/index.html` directly. It loads the
same files without inlining them.
