// Engine tests: every audience and answer path produces a readable,
// honest observation. Run with: node --test observatory/tests
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../src/content.js');
const E = require('../src/engine.js');
const NOW = new Date('2026-09-30T12:00:00Z');

const opts = (id, a) => {
  const q = C.QUESTIONS.find(x => x.id === id);
  return (typeof q.options === 'function' ? q.options(a) : q.options).map(o => o.v);
};

// Walk the question graph, taking the i-th option of every single choice.
function answersFor(audience, pick) {
  const a = { name: 'Sam', audience };
  for (let guard = 0; guard < 40; guard++) {
    const next = E.questionsFor(a).find(q => !(q.id in a));
    if (!next) break;
    if (next.type === 'text') a[next.id] = 'Quote approvals';
    else if (next.type === 'long') a[next.id] = 'It sits in the inbox.';
    else if (next.type === 'multi') a[next.id] = opts(next.id, a).slice(0, 3);
    else { const o = opts(next.id, a); a[next.id] = o[pick(next.id, o.length)]; }
  }
  return a;
}

const BAD = /undefined|null|NaN|\$\{|\[object|  /;
const texts = o => [o.reported, o.question, o.hypothesis, o.contrary, o.changeMind, o.flagNote, o.aiNote, o.feelNote,
  o.workflowLabel, ...o.steps.flat()].join(' | ');

test('each audience asks a different, complete set of questions', () => {
  const ids = aud => E.questionsFor(answersFor(aud, () => 0)).map(q => q.id);
  assert.ok(!ids('self').includes('owner'), 'solo operators are not asked who takes the next step');
  assert.ok(ids('org').includes('approvals') && ids('org').includes('sponsor'));
  assert.ok(!ids('team').includes('approvals'));
  for (const aud of ['self', 'team', 'org', 'advisor']) {
    const n = ids(aud).length;
    assert.ok(n >= 12 && n <= 16, `${aud}: ${n} questions`);
  }
});

test('every combination composes clean text', () => {
  let count = 0;
  for (const audience of ['self', 'team', 'org', 'advisor']) {
    for (let w = 0; w < 8; w++) for (let o = 0; o < 5; o++) for (let x = 0; x < 5; x++) {
      const a = answersFor(audience, (id, n) => (id === 'workflow' ? w : id === 'owner' ? o : x) % n);
      const obs = E.compose(a, 1, NOW);
      assert.doesNotMatch(texts(obs), BAD, JSON.stringify(a));
      assert.equal(obs.steps.length, 6);
      assert.ok(obs.flag >= 0 && obs.flag < 6);
      for (const token of ['owner', 'holder', 'cover']) for (const away of [false, true]) for (const compare of [false, true]) {
        const d = E.derive(obs, { token, away, compare });
        assert.doesNotMatch(d.title + d.body + d.status, BAD, `${audience} ${token} ${away}`);
        const plan = E.testPlan(obs, { token, away });
        if (plan.kind === 'plan') assert.doesNotMatch(plan.rows.flat().join(' ') + plan.title + plan.staged, BAD);
      }
      count++;
    }
  }
  assert.ok(count > 500);
});

test('a solo operator is never told "the owner" decides', () => {
  const a = answersFor('self', () => 0);
  const obs = E.compose(a, 1, NOW);
  for (const token of ['owner', 'holder', 'cover']) for (const away of [false, true]) {
    const d = E.derive(obs, { token, away });
    assert.doesNotMatch(d.title + d.body, /the owner|The owner|team lead/);
  }
});

test('the arrangement starts where the person said it does', () => {
  const coord = E.compose({ audience: 'team', owner: 'coordinator', workflow: 'lead' }, 1, NOW);
  assert.equal(coord.start, 'holder');
  const founder = E.compose({ audience: 'team', owner: 'founder', workflow: 'lead' }, 1, NOW);
  assert.equal(founder.start, 'owner');
  assert.equal(E.testPlan(coord, { token: 'holder' }).kind, 'unchanged');
  assert.equal(E.testPlan(coord, { token: 'cover' }).kind, 'plan');
});

test('answers invalidated by an earlier change are dropped', () => {
  const a = E.prune({ audience: 'self', owner: 'queue', approvals: '3', workflow: 'crossteam', doors: ['system', 'email'] });
  assert.equal(a.owner, undefined);
  assert.equal(a.approvals, undefined);
  assert.equal(a.workflow, undefined);
  assert.deepEqual(a.doors, ['email']);
});

test('bridges carry only what the person wrote, and fit their channels', () => {
  const a = answersFor('org', () => 1);
  const obs = E.compose(a, 4, NOW);
  const prompt = E.aiPrompt(obs);
  assert.match(prompt, /not verified/);
  assert.match(prompt, /Don’t invent facts/);
  assert.ok(E.chatgptUrl(prompt).length < 8000, 'ChatGPT link stays under common URL limits');
  assert.ok(E.claudeDesktopUrl(prompt).startsWith('claude://claude.ai/new?q='));
  assert.match(E.brief(obs, { token: 'cover' }), /## Stays human/);
  assert.match(E.mailto(obs), /^mailto:agentflow\.work@gmail\.com\?subject=/);
  const json = JSON.parse(E.exportJSON(obs, { token: 'cover' }));
  assert.equal(json.version, E.SCHEMA);
});

test('calendar file is valid iCalendar with Day 7 and Day 30 reviews', () => {
  const obs = E.compose(answersFor('team', () => 0), 1, NOW);
  const ics = E.ics(obs, NOW);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.match(ics, /DTSTART;VALUE=DATE:20261007/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261030/);
  for (const line of ics.split('\r\n')) assert.ok(line.length <= 75, `line too long: ${line}`);
  assert.doesNotMatch(ics.replace(/\r\n/g, ''), /\n/);
  assert.match(E.googleCalUrl(obs, 7, NOW), /dates=20261007%2F20261008/);
});

test('recommendations respond to how the work feels', () => {
  const base = { audience: 'team', workflow: 'lead', owner: 'coordinator', away: 'waits' };
  const calm = E.recommend(E.compose({ ...base, feel: 'fine', ai: 'none' }, 1, NOW));
  const anxious = E.recommend(E.compose({ ...base, feel: 'anxious', ai: 'private' }, 1, NOW));
  assert.ok(anxious.includes('fearless') && anxious.includes('breath'));
  assert.ok(anxious.includes('askperson'));
  assert.ok(!calm.includes('fearless'));
  const ids = new Set(C.RESOURCES.map(r => r.id));
  for (const id of [...calm, ...anxious]) assert.ok(ids.has(id), `unknown resource ${id}`);
});
