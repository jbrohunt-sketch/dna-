/* Astervell Observatory — engine.
 *
 * Pure functions: answers in, observation out. No DOM, no storage, no
 * network, no clock unless one is passed in. That keeps it testable in
 * Node (tests/engine.test.mjs) and portable to a server later.
 *
 * Nothing here is "AI". The observation is a deterministic reading of
 * what the person said, labelled as a draft. The app says so, too.
 */
(function (root) {
  'use strict';

  const C = root.AstervellContent || (typeof require !== 'undefined' ? require('./content.js') : null);
  const SCHEMA = 2;

  const call = (v, a) => (typeof v === 'function' ? v(a) : v);
  const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const plain = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  /* ---------------------------------------------------------------
     Questions
  ---------------------------------------------------------------- */
  function questionsFor(a) {
    return C.QUESTIONS.filter(q => !q.when || q.when(a));
  }

  function resolve(q, a) {
    return { ...q, q: call(q.q, a), help: call(q.help, a), options: call(q.options, a) };
  }

  function labelFor(id, value, a) {
    const q = C.QUESTIONS.find(x => x.id === id);
    const opts = q && call(q.options, a);
    const hit = opts && opts.find(o => o.v === value);
    return hit ? hit.t : '';
  }

  // Remove answers that no longer apply after an earlier answer changed
  // (e.g. switching audience from org to self drops `approvals`).
  function prune(a) {
    const keep = {};
    for (const q of questionsFor(a)) {
      if (!(q.id in a)) continue;
      const opts = call(q.options, a);
      if (!opts) { keep[q.id] = a[q.id]; continue; }
      const valid = new Set(opts.map(o => o.v));
      if (q.type === 'multi') {
        const vs = (a[q.id] || []).filter(v => valid.has(v));
        if (vs.length) keep[q.id] = vs;
      } else if (valid.has(a[q.id])) keep[q.id] = a[q.id];
    }
    return keep;
  }

  /* ---------------------------------------------------------------
     The cast: who holds the work, who decides, who could cover
  ---------------------------------------------------------------- */
  const HOLDER = {
    founder: { label: 'Teammate', role: 'Sees it first', mono: 'T', the: 'your teammate' },
    lead: { label: 'Teammate', role: 'Sees it first', mono: 'T', the: 'your teammate' },
    coordinator: { label: 'Coordinator', role: 'Shared inbox', mono: 'C', the: 'the coordinator' },
    first: { label: 'First to see it', role: 'Whoever’s there', mono: 'F', the: 'whoever saw it first' },
    depends: { label: 'On duty', role: 'Varies by day', mono: 'D', the: 'the person on duty' },
    queue: { label: 'The queue', role: 'Nobody watching', mono: 'Q', the: 'the queue', thing: true },
  };
  const STEP_ROLE = {
    founder: 'Owner', lead: 'Team lead', coordinator: 'Coordinator', first: 'First to see it',
    depends: 'On duty', queue: 'Nobody named',
  };

  function castFor(a) {
    const aud = C.AUDIENCE[a.audience] || C.AUDIENCE.team;
    const self = a.audience === 'self';
    const j = C.PHRASE.judgment[a.judgment] || C.PHRASE.judgment.fit;
    const owner = self ? 'self' : (a.owner || 'depends');
    const start = self || owner === 'founder' || owner === 'lead' ? 'owner' : 'holder';
    const people = self ? {
      holder: { label: 'Written reply', role: 'Acknowledges only', mono: '✎', the: 'a written reply', thing: true },
      owner: { label: 'You', role: `Decides ${j[1]}`, mono: 'Y', the: 'you', you: true },
      cover: { label: 'Backup', role: a.away === 'named' ? 'Asked, not confirmed' : 'Not yet asked', mono: '✧', the: 'your backup' },
    } : {
      holder: HOLDER[owner] || HOLDER.depends,
      owner: { label: aud.decider, role: `Decides ${j[1]}`, mono: aud.mono || aud.decider[0], the: `the ${aud.decider.toLowerCase()}` },
      cover: { label: 'Cover', role: a.away === 'named' ? 'Named, not confirmed' : 'Not yet agreed', mono: '✧', the: 'the cover' },
    };
    return { self, owner, start, people, decider: aud.decider, requester: aud.requester, j };
  }

  function doorsLabel(a) {
    const q = C.QUESTIONS.find(x => x.id === 'doors');
    const opts = call(q.options, a);
    const list = (a.doors || []).map(v => (opts.find(o => o.v === v) || {}).t).filter(Boolean);
    if (!list.length) return { short: 'Several ways in', list };
    return { short: list.slice(0, 2).join(' / ') + (list.length > 2 ? ` +${list.length - 2}` : ''), list };
  }

  function toolsList(a) {
    const q = C.QUESTIONS.find(x => x.id === 'tools');
    return (a.tools || []).map(v => (q.options.find(o => o.v === v) || {}).t).filter(Boolean);
  }

  const joinList = xs => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);

  /* ---------------------------------------------------------------
     Compose the observation
  ---------------------------------------------------------------- */
  function compose(input, number = 1, now = new Date()) {
    const a = prune(input);
    const cast = castFor(a);
    const wf = C.WORKFLOWS[a.workflow] || C.WORKFLOWS.other;
    const doors = doorsLabel(a);
    const tools = toolsList(a);
    const ownerPhrase = C.PHRASE.owner[cast.owner] || 'the person on duty';
    const away = a.away || 'unsure';
    const workflowLabel = a.workflow === 'other'
      ? (plain(a.workflowName) || 'Your workflow')
      : (labelFor('workflow', a.workflow, a) || 'Your workflow');

    const steps = wf.steps({
      role: cast.self ? 'You' : STEP_ROLE[cast.owner] || 'On duty',
      decider: cast.decider,
      requester: cast.requester,
      doors: doors.short,
      inbox: cast.self ? 'Your inbox' : a.audience === 'org' ? 'Queue or inbox' : 'Shared inbox',
      same: cast.self || cast.owner === 'founder' || cast.owner === 'lead',
      self: cast.self,
    });

    const flagNote = call(C.FLAGNOTE[away], ownerPhrase);
    const who = a.audience === 'advisor' ? 'They' : 'You';

    const reported = [
      `In ${workflowLabel.toLowerCase()}, work arrives through ${doors.list.length === 1 ? 'one door' : doors.list.length ? doors.list.length + ' doors' : 'several doors'}` +
        (tools.length ? ` and passes through ${tools.length === 1 ? 'one tool' : tools.length + ' tools'}.` : '.'),
      cast.self
        ? `The next step is yours; when you’re away, ${call(C.PHRASE.away[away], a)}.`
        : `The next step usually sits with ${ownerPhrase}; when ${cast.owner === 'queue' ? 'nobody is watching' : 'they are away'}, ${call(C.PHRASE.away[away], a)}.`,
      `It slips ${C.PHRASE.frequency[a.frequency] || 'sometimes'}, and ${who.toLowerCase()} usually find out when ${call(C.PHRASE.signal[a.signal] || (() => 'someone notices'), a)}.`,
    ].join(' ');

    let contrary = a.frequency === 'rare'
      ? 'At this frequency the cost may be real but rare. Adding a control could create more work than it saves.'
      : `Some waits may be intentional: decisions about ${cast.j[0]} sometimes need time. Not every pause is a slip.`;
    if (a.audience === 'org' && ['2', '3', 'varies'].includes(a.approvals)) {
      contrary += ' And each approval may protect something nobody on the team can see from where they sit.';
    }
    const changeMind = away === 'named'
      ? 'A walkthrough shows the named cover already accepts work reliably. Then don’t add another control.'
      : `A walkthrough shows ${wf.unit} already reach an acknowledged owner in reasonable time. Then no change is supported, and we say so.`;

    let hypothesis = C.HYPOTHESIS[away] || C.HYPOTHESIS.unsure;
    if (cast.owner === 'queue') hypothesis = 'A queue stores work but never says “mine”. A named person watching it, even part-time, may be the missing piece.';
    if (cast.self && away === 'waits') hypothesis = 'When everything waits for you, a written acknowledgment or a named backup may remove the wait without handing over any decision.';

    const sponsorNote = a.sponsor === 'unclear'
      ? 'Nobody clearly owns the yes. Before any trial, find the person who can authorize five cases for one week.'
      : a.sponsor === 'above'
        ? 'The yes sits two levels up. Keep the trial small enough that it can be approved in a sentence.'
        : '';

    return {
      v: SCHEMA,
      id: 'obs-' + now.getTime().toString(36),
      number,
      created: now.toISOString(),
      name: plain(a.name).slice(0, 40),
      audience: a.audience || 'team',
      answers: a,
      workflowLabel,
      arc: wf.arc,
      request: wf.request,
      steps,
      flag: wf.flag,
      flagNote,
      question: wf.question(ownerPhrase),
      reported,
      hypothesis,
      contrary,
      changeMind,
      aiNote: C.AI_NOTE[a.ai] || '',
      feelNote: C.FEEL_NOTE[a.feel] || '',
      sponsorNote,
      doors: doors.list,
      tools,
      judgment: cast.j[0],
      jshort: cast.j[1],
      lock: cast.j[2],
      move: wf.move,
      change: wf.change,
      measure: wf.measure,
      unit: wf.unit,
      people: cast.people,
      start: cast.start,
    };
  }

  /* ---------------------------------------------------------------
     The explorable model: where first-reply authority sits
  ---------------------------------------------------------------- */
  const verbIs = p => (p.you ? 'are' : 'is');

  function derive(obs, arr) {
    const P = obs.people;
    const self = obs.audience === 'self';
    const start = obs.start;
    const tok = arr.compare ? start : arr.token;
    const asDescribed = tok === start && !arr.compare && arr.token === start;
    const D = P.owner;
    const decides = self ? 'decide' : 'decides';
    const Dname = cap(D.the);
    const s = obs.jshort;

    if (tok === start && arr.away) {
      const p = P[tok];
      return {
        tok, blocked: true,
        title: 'The work waits<br>at an empty desk.',
        body: p.thing
          ? 'Nobody is watching the queue. Someone would need to agree to watch it before the work can move.'
          : `${cap(p.the)} ${verbIs(p)} away. ${self ? 'A backup' : obs.answers.away === 'named' ? 'The named cover' : 'Someone'} would need to agree to cover before the work can move.`,
        status: p.thing ? 'Stored,<br>not owned' : 'An owner,<br>nobody available',
      };
    }
    if (tok === 'owner') {
      return self ? {
        tok, blocked: false,
        title: 'You reply and decide.<br>Both wait on you.',
        body: `Try moving the first reply to a written acknowledgment or a backup. Keep decisions about ${obs.judgment} with you.`,
        status: 'Permission<br>concentrates here',
      } : {
        tok, blocked: false,
        title: `Even the first reply<br>goes back to ${D.the}.`,
        body: `${asDescribed ? 'This is the arrangement you described. ' : ''}Move the reply token to ${P.holder.the} or a cover. Keep decisions about ${obs.judgment} with ${D.the}.`,
        status: 'Permission<br>concentrates here',
      };
    }
    if (tok === 'holder') {
      const H = P.holder;
      if (H.thing && self) return {
        tok, blocked: false,
        title: `A written reply goes out.<br>You still decide ${s}.`,
        body: 'The client hears back quickly, and nothing is promised until you decide. Write the wording once, with care.',
        status: 'Acknowledge<br>before deciding',
      };
      if (H.thing) return {
        tok, blocked: false,
        title: 'The queue holds it.<br>Nobody has said “mine”.',
        body: `${asDescribed ? 'This is the arrangement you described. ' : ''}A queue stores work; it doesn’t acknowledge it. Try giving the first reply to a person.`,
        status: 'Stored,<br>not owned',
      };
      return {
        tok, blocked: false,
        title: `${cap(H.the)} can reply.<br>${Dname} still ${decides} ${s}.`,
        body: asDescribed
          ? `This is the arrangement you described. Switch ${H.the} to away and watch where the work goes.`
          : `${cap(H.the)} needs agreed wording and capacity. Try the boundary before keeping it.`,
        status: 'Acknowledge<br>before review',
      };
    }
    return {
      tok, blocked: false,
      title: self ? `Your backup can reply.<br>You still decide ${s}.` : `The cover can reply.<br>${Dname} still ${decides} ${s}.`,
      body: `${self ? 'Your backup' : 'The cover'} needs capacity and an explicit agreement. The work has moved, not vanished.`,
      status: 'Cover<br>accepts first',
    };
  }

  function awayLabel(obs, away) {
    const p = obs.people[obs.start];
    if (p.thing) return away ? 'Nobody is watching the queue' : 'Someone is watching the queue';
    return `${cap(p.the)} ${verbIs(p)} ${away ? 'away' : 'available'}`;
  }

  /* ---------------------------------------------------------------
     The test plan that follows from the arrangement
  ---------------------------------------------------------------- */
  function testPlan(obs, arr) {
    const P = obs.people;
    const tok = arr.token;
    const self = obs.audience === 'self';
    const a = obs.answers;
    if (arr.evidenceFirst) return {
      kind: 'evidence',
      eyebrow: 'Understanding is a valid next step',
      title: 'Check before<br>you change.',
      chip: 'An evidence-first plan',
      rows: [
        ['First', 'Walk through two more real examples with the person doing the work.'],
        ['Ask', obs.question],
        ['Watch', 'What would contradict the explanation you started with?'],
        ['Then', 'Correct the map. Decide whether any change is justified.'],
      ],
      staged: 'Check the decision boundary with the person doing the work before changing anything.',
    };
    if (tok === obs.start) return { kind: 'unchanged' };

    const who = P[tok];
    const Dname = cap(P.owner.the);
    const decides = self ? 'decide' : 'decides';
    const first = a.sponsor === 'unclear'
      ? `Find who can say yes to a five-${obs.unit.replace(/s$/, '')} trial. Until then, stay evidence-first.`
      : who.thing ? 'Write the acknowledgment once. It says when you’ll reply, and promises nothing else.'
      : `Agree wording, capacity and the boundary with ${who.the}.`;
    const tryRow = who.thing
      ? `A written reply acknowledges the next five comparable ${obs.unit} for one week. You still decide ${obs.jshort}.`
      : `${cap(who.the)} acknowledges the next five comparable ${obs.unit} over one week. ${Dname} still ${decides} ${obs.jshort}.`;
    const rows = [['First', first], ['Try', tryRow], ['Watch', obs.measure]];
    if (a.audience === 'org' && ['2', '3', 'varies'].includes(a.approvals)) {
      rows.push(['Ask', 'Before touching any approval, ask its owner what it protects.']);
    }
    rows.push(['Undo if', 'Ownership gets less clear, capacity fails, or someone makes a commitment without authority.']);
    return {
      kind: 'plan',
      eyebrow: 'Keep it small. Keep it reversible.',
      title: `Five ${obs.unit}.<br>One new boundary.`,
      chip: `First reply · ${who.thing ? 'written' : who.label}`,
      rows,
      staged: `${cap(who.the)} acknowledges the next five ${obs.unit}. ${Dname} ${self ? 'keep' : 'keeps'} decisions about ${obs.judgment}.`,
    };
  }

  /* ---------------------------------------------------------------
     Resources that fit this observation
  ---------------------------------------------------------------- */
  function recommend(obs, limit = 6) {
    const a = obs.answers;
    const score = {};
    const add = (id, n) => { score[id] = (score[id] || 0) + n; };
    add('walk', 5); add('baseline', 4); add('mwv', 2);
    if (['named', 'waits', 'unsure', 'autoreply'].includes(a.away)) add('cover', 4);
    if (['anxious', 'numb'].includes(a.feel)) { add('fearless', 4); add('breath', 4); }
    if (a.feel === 'rushed' || a.feel === 'uneven') { add('weeks', 3); add('breath', 4); }
    if (['private', 'sanctioned', 'automated', 'unsure'].includes(a.ai)) { add('askperson', 4); add('claude', 1); add('chatgpt', 1); }
    if (a.audience === 'org' || a.workflow === 'crossteam') add('topologies', 3);
    if (a.workflow === 'approvals' || ['2', '3', 'varies'].includes(a.approvals)) { add('systems', 3); add('nochange', 2); }
    if (['weekly', 'often'].includes(a.frequency)) add('goal', 2);
    if (a.frequency === 'rare') add('nochange', 3);
    if (a.audience === 'advisor') add('humble', 4);
    if (['knowledge', 'followup', 'onboarding'].includes(a.workflow)) add('checklist', 3);
    if ((a.tools || []).includes('slack') || (a.doors || []).includes('chat')) add('workflowbuilder', 2);
    return Object.keys(score).sort((x, y) => score[y] - score[x]).slice(0, limit);
  }

  /* ---------------------------------------------------------------
     Bridges: honest ways to take the observation elsewhere.
     Each returns exactly the text that would leave the device, so the
     app can show it before anything is sent.
  ---------------------------------------------------------------- */
  function facts(obs) {
    const a = obs.answers;
    const L = id => labelFor(id, a[id], a);
    return [
      ['Workflow', `${obs.workflowLabel} (${(C.AUDIENCE[obs.audience] || {}).label || ''})`.replace(' ()', '')],
      ['Arrives through', obs.doors.join(', ')],
      ['Passes through', obs.tools.join(', ')],
      ['Next step usually sits with', obs.audience === 'self' ? 'Me' : L('owner')],
      ['When they are away', L('away')],
      ['How often it slips', L('frequency')],
      ['How we find out', L('signal')],
      ['Approvals before it moves', L('approvals')],
      ['Must stay human', L('judgment')],
      ['AI today', L('ai')],
      ['How it feels', L('feel')],
      ['Who could approve a test', L('sponsor')],
      ['In my words', plain(a.note)],
    ].filter(r => r[1]);
  }

  function aiPrompt(obs) {
    return [
      'I’m looking at one workflow using the Astervell method: evidence before interpretation. Below is a draft I made from my own answers. It is not verified and may be wrong.',
      '',
      ...facts(obs).map(([k, v]) => `${k}: ${v}`),
      '',
      `Working hypothesis: ${obs.hypothesis}`,
      `Proposed test: ${obs.move.join(' ')} ${obs.change}`,
      '',
      'Please help me prepare a 30-minute walkthrough with the person who does this work:',
      '1. Five neutral questions to ask them. No leading questions.',
      '2. What evidence would show my hypothesis is wrong.',
      '3. One way the proposed test could backfire, and what to watch for.',
      '',
      'Don’t invent facts about my team and don’t decide for us. Ask me if you need more. I’ve described the process only, with no records.',
    ].join('\n');
  }

  function shareText(obs) {
    return [
      `Workflow check: ${obs.workflowLabel}`,
      '',
      `Where it slips: ${obs.flagNote}`,
      `The question: ${obs.question}`,
      `A small test we could try: ${obs.move.join(' ')} Five ${obs.unit}, one week, then keep, revise or undo.`,
      `Stays human: ${obs.judgment}.`,
      '',
      'This is a draft from my own answers, not a finding. Does it match what you see?',
    ].join('\n');
  }

  function brief(obs, arr) {
    const plan = testPlan(obs, arr || { token: obs.start });
    const rows = plan.kind === 'plan' ? plan.rows : [['Try', obs.change], ['Watch', obs.measure]];
    const tools = obs.tools.length ? obs.tools.join(', ') : 'the tools the team already uses';
    return [
      `# Build brief: ${obs.move.join(' ')}`,
      '',
      `> From an Astervell Observatory draft (${obs.workflowLabel}). Not verified. Build nothing that makes the decisions listed under “Stays human”.`,
      '',
      '## Context',
      obs.reported,
      '',
      '## The trial',
      ...rows.map(([k, v]) => `- **${k}:** ${v}`),
      '',
      '## What a tool may do',
      `- Make the next action and its holder visible where the work already lands (${tools}).`,
      '- Post or log an acknowledgment that promises nothing beyond a reply time.',
      '- Remind the cover before an absence starts, and hand open items back afterwards.',
      '',
      '## Stays human',
      `- Decisions about ${obs.judgment}.`,
      '- Accepting or declining the work, and anything said on the team’s behalf.',
      '',
      '## Constraints',
      '- Reversible in one step. Keep the history.',
      `- Prefer configuring ${tools} over adding a new tool.`,
      '- Store no customer, patient or financial records. None are included here.',
      '',
      '## Ask me before',
      '- Choosing between options, adding an integration, or changing who decides anything.',
    ].join('\n');
  }

  const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const addDays = (d, n) => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() + n); return x; };
  const icsText = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  // RFC 5545: lines longer than 75 octets fold with CRLF + space.
  const fold = line => {
    const out = [];
    let rest = line;
    while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
    out.push(rest);
    return out.join('\r\n');
  };

  const REVIEWS = [
    [7, 'Day 7 · look at the raw counts', 'Look at what actually happened. Who waited? Who took on more work?'],
    [30, 'Day 30 · keep, revise or undo', 'Decide: keep it, revise one thing, or undo it without deleting the history.'],
  ];

  function ics(obs, now = new Date()) {
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Astervell//Observatory//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    for (const [n, title, desc] of REVIEWS) {
      const day = addDays(now, n);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${obs.id}-d${n}@observatory.astervell.com`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd(day)}`,
        `DTEND;VALUE=DATE:${ymd(addDays(day, 1))}`,
        fold(`SUMMARY:${icsText(`${title} (${obs.workflowLabel})`)}`),
        fold(`DESCRIPTION:${icsText(`${desc}\n\nThe test: ${obs.move.join(' ')}\nStays human: ${obs.judgment}.`)}`),
        'END:VEVENT',
      );
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
  }

  function googleCalUrl(obs, days, now = new Date()) {
    const r = REVIEWS.find(x => x[0] === days) || REVIEWS[1];
    const day = addDays(now, r[0]);
    const q = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${r[1]} (${obs.workflowLabel})`,
      dates: `${ymd(day)}/${ymd(addDays(day, 1))}`,
      details: `${r[2]}\n\nThe test: ${obs.move.join(' ')}\nStays human: ${obs.judgment}.`,
    });
    return 'https://calendar.google.com/calendar/render?' + q.toString();
  }

  const chatgptUrl = text => 'https://chatgpt.com/?q=' + encodeURIComponent(text);
  const claudeDesktopUrl = text => 'claude://claude.ai/new?q=' + encodeURIComponent(text);

  function mailto(obs) {
    const body = [
      `Hello ${C.BRAND.founder},`,
      '',
      'I completed an observation in the Astervell Observatory and would like to talk about fit for the Workflow Clarity Pilot.',
      '',
      ...facts(obs).map(([k, v]) => `${k}: ${v}`),
      '',
      '(Process description only. No customer records, credentials or files.)',
      obs.name ? `\n${obs.name}` : '',
    ].join('\n');
    return `mailto:${C.BRAND.email}?subject=${encodeURIComponent('Astervell workflow conversation · ' + obs.workflowLabel)}&body=${encodeURIComponent(body)}`;
  }

  function exportJSON(obs, arr) {
    return JSON.stringify({ schema: 'astervell.observation', version: SCHEMA, observation: obs, arrangement: arr || null }, null, 2);
  }

  const api = {
    SCHEMA, questionsFor, resolve, labelFor, prune, compose, derive, awayLabel, testPlan, recommend,
    facts, aiPrompt, shareText, brief, ics, googleCalUrl, chatgptUrl, claudeDesktopUrl, mailto, exportJSON, plain,
  };
  root.AstervellEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
