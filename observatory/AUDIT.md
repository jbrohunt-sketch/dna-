# Does the Observatory feel made with thought, or made by one prompt?

An honest audit of the first build, what changed in response, and what code
alone can't fix.

## The first build: where it read as AI-made

1. **One headline formula, everywhere.** Nearly every screen used the same
   shape: a serif sentence, then a gold italic phrase ("Untangle *the
   handoff.*", "Keep the learning. *Keep your choice.*"). One formula repeated
   is the clearest tell of generated design.
2. **A fake "thinking" screen.** After the questions, a five-second animation
   claimed to be "separating what you reported from what might explain it."
   The result was already computed, instantly, by simple rules. That is the
   most AI-product move in the build, and it contradicted Astervell's own
   rule: evidence before interpretation.
3. **"Premium" signals with no meaning.** Twinkling stars, a card sheen that
   swept every five seconds, "Est. Seattle", catalogue numbers. Decoration
   that says "expensive" rather than something that helps.
4. **Fill-in-the-blank personalization that broke.** A solo operator was told
   "the owner still decides." Copy read like "Lead intake arrives through 3
   doors." Templated text shows its seams fastest when it's wrong.
5. **One kind of user.** Ten fixed questions, four options each. No room for
   a department inside a large company, or a consultant describing a client.
6. **No point of view on AI.** An app about work in 2026 that never asked
   where ChatGPT, Claude or automations already sit in the workflow.
7. **A dead end.** Nothing could leave the screen: not to Slack, a calendar,
   ChatGPT, Claude, or a coding agent.
8. **No engineering underneath.** One 1,900-line file, no tests, no data
   model that a real service could adopt.

What already had real thought in it: the data boundary, labelling drafts as
drafts, the correction flow, keep / revise / undo, and (from the prototype)
separating acknowledgment from acceptance.

## What changed

| Problem | Change |
|---|---|
| Fake thinking screen | Replaced by an honest pause: "Nothing is being calculated. This pause is for you." Two real breaths, 4 seconds in and 6 out, skippable. |
| One kind of user | The intake branches: just me, an owner-led team, a team inside a larger organization, or someone I advise. Twelve to sixteen questions depending on the path. Organizations are asked about approvals and who could approve a test. |
| No AI point of view | A question on where AI already is, which shapes the evidence ("work in personal ChatGPT chats is invisible to everyone else, and so are its mistakes"). |
| Only the clock mattered | A question on how the work *feels*, which changes the reading and the resources. |
| Dead end | **Connect:** ChatGPT (prefilled link), Claude (copy and open; prefilled in the desktop app), Slack or Teams (device share sheet), a build brief for Claude Code, Codex or Cowork, Day 7 and Day 30 in any calendar, a breathing pause, and Calm, Headspace and Insight Timer. Every option shows the exact text before it leaves. |
| No resources | **Library:** five original Astervell practices, eight books and one study (real, cited, unsponsored), three pause apps, and two AI tools with guidance. "For you" is ranked from the observation. |
| Broken templates | A test walks all 800 answer combinations and fails on "undefined", double spaces, or a solo operator being told about "the owner". |
| Decoration | Stars stand still, the sheen is gone, headline shapes vary, and questions use plain italics instead of gold. |
| No engineering | `src/` split into content, engine and app. A build step produces the single file. Tests run with `node --test observatory/tests/engine.test.mjs`. The observation has a versioned schema and can be exported as JSON. |

## What code can't fix

These are why it may still feel AI-made, in order of impact:

1. **The voice is still mine, not Rahmat's.** The strongest tell of AI
   products is fluent, well-balanced copy with no person behind it. The fix
   is a human one: Rahmat rewrites the fifteen questions and the five key
   screens in his own words, including one real (anonymised) story.
2. **No real scars yet.** Apps that feel made by people carry evidence of
   real users: an odd option someone asked for, a question reworded because
   three owners misread it. Put it in front of five owners and one
   department lead, and change what they stumble on.
3. **Imagery is generic.** Glowing orbs and a star field are the house
   style of AI-generated premium. Hand-drawn maps, photos of real
   whiteboards, or Rahmat's own handwriting on the pause screen would be
   unmistakably human.
4. **The rules were written in one sitting.** They're readable and tested,
   but they need a practitioner's review. Each hypothesis should be
   something Rahmat would actually say in a readout.

## From app to service: what real connections take

The Connect tab is the honest ceiling of a static app. Going further needs
an Astervell backend and accounts, and one decision each:

- **Team observations** (the big-company feature): five people answer the
  same intake about the same handoff; the gaps between their answers are
  the finding. Needs accounts, workspaces and invitations.
- **Slack app:** OAuth, reading only metadata (when a request arrived and
  when someone first replied), never message content; posting the Day 7
  check-in. Needs a Slack app and a privacy review.
- **Inside ChatGPT and Claude:** both support MCP connectors, so an Astervell
  connector could let someone say "open my latest observation" inside the
  assistant they already use, sharing only what they choose.
- **Calendars:** write review events directly through Google and Microsoft
  APIs instead of a file.
- **Calm and Headspace** don't, as far as I know, offer open APIs for this.
  Links are the honest ceiling. A native app could log mindful minutes to
  Apple Health.
