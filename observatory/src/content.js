/* Astervell Observatory — content.
 *
 * Every word the app says lives here: questions, phrasing, workflow
 * templates, resources. engine.js turns answers into an observation;
 * app.js choreographs it. Change the words here, not in the logic.
 *
 * Conventions
 * - A question's `q`, `help` and `options` may be functions of the
 *   answers so far (`a`). That is how one intake serves a solo operator,
 *   an owner-led team, a department in a large organization, or an
 *   advisor speaking about someone else's team.
 * - `when(a)` decides whether a question is asked at all.
 * - Typographic apostrophes (’) throughout; never straight quotes in copy.
 */
(function (root) {
  'use strict';

  const BRAND = {
    email: 'agentflow.work@gmail.com',
    calendar: 'https://calendly.com/agentflow-work/30min',
    founder: 'Rahmat',
    site: 'https://astervell.com',
  };

  // Who the observation is about. Changes wording, options and the model.
  const AUDIENCE = {
    self: { label: 'Just me', decider: 'You', requester: 'Client' },
    team: { label: 'An owner-led team', decider: 'Owner', mono: 'O', requester: 'Client' },
    org: { label: 'A team inside a larger organization', decider: 'Team lead', mono: 'L', requester: 'Requester' },
    advisor: { label: 'Someone I advise', decider: 'Owner', mono: 'O', requester: 'Client' },
  };

  const is = (a, ...aud) => aud.includes(a.audience);
  const their = a => (is(a, 'advisor') ? 'their' : 'your');

  const QUESTIONS = [
    {
      id: 'name', type: 'text', kicker: 'Before we begin',
      q: 'What should we call you?',
      help: 'A first name is plenty. It stays on this device.',
      placeholder: 'First name', max: 40,
    },
    {
      id: 'audience', type: 'single', kicker: 'Who this is for',
      q: 'Who is this for?',
      help: 'The questions that follow change with your answer.',
      options: [
        { v: 'self', t: 'Just me', s: 'I run the work and do most of it myself.' },
        { v: 'team', t: 'An owner-led team', s: 'A small team where the owner still decides most things.' },
        { v: 'org', t: 'A team inside a larger organization', s: 'Departments, approvals, several systems.' },
        { v: 'advisor', t: 'Someone I advise', s: 'A client, or a team I support.' },
      ],
    },
    {
      id: 'workflow', type: 'single', kicker: 'The workflow',
      q: a => (is(a, 'advisor') ? 'Which of their workflows keeps <em>slipping</em>?' : 'Which workflow keeps <em>slipping</em>?'),
      help: 'Pick the one that costs the most attention. We look at one at a time.',
      options: a => [
        { v: 'lead', t: 'Lead intake', s: 'New requests, from first contact to a reply' },
        { v: 'scheduling', t: 'Scheduling', s: 'Finding a time and confirming it' },
        { v: 'followup', t: 'Follow-up', s: 'What happens after the conversation ends' },
        { v: 'onboarding', t: 'Getting started', s: 'From a yes to a good first week' },
        { v: 'knowledge', t: 'Team knowledge', s: is(a, 'self') ? 'Answers that live only in your head' : 'Answers that live in one person’s head' },
        ...(is(a, 'self') ? [] : [{ v: 'approvals', t: 'Approvals', s: 'Waiting for someone to say yes' }]),
        ...(is(a, 'org', 'advisor') ? [{ v: 'crossteam', t: 'Handoffs between teams', s: 'Where one team’s done becomes another’s start' }] : []),
        { v: 'other', t: 'Something else', s: 'You’ll name it on the next screen' },
      ],
    },
    {
      id: 'workflowName', type: 'text', kicker: 'In a few words',
      when: a => a.workflow === 'other',
      q: 'What do you call this workflow?',
      help: 'Whatever the team would call it out loud.',
      placeholder: 'e.g. Quote approvals', max: 40,
    },
    {
      id: 'doors', type: 'multi', layout: 'chips', kicker: 'The doors',
      q: 'Where does the work <em>arrive</em>?',
      help: 'Choose every way in. Most teams have more than they think.',
      options: a => [
        { v: 'form', t: 'Website form', short: 'Form' },
        { v: 'email', t: 'Email', short: 'Email' },
        { v: 'phone', t: 'Phone & voicemail', short: 'Phone' },
        { v: 'text', t: 'Texts & DMs', short: 'Texts' },
        { v: 'chat', t: 'Slack or Teams', short: 'Chat' },
        ...(is(a, 'self') ? [] : [{ v: 'system', t: 'A request or ticket system', short: 'Tickets' }]),
        { v: 'person', t: 'In person', short: 'In person' },
        { v: 'referral', t: 'Referrals', short: 'Referrals' },
      ],
    },
    {
      id: 'tools', type: 'multi', layout: 'chips', kicker: 'The tools',
      q: 'What does it <em>pass through</em> on the way?',
      help: 'Every tool the work touches between arriving and being done. Each crossing is a place context can fall out.',
      options: [
        { v: 'slack', t: 'Slack' },
        { v: 'teams', t: 'Microsoft Teams' },
        { v: 'email', t: 'Email' },
        { v: 'sheet', t: 'Spreadsheets' },
        { v: 'crm', t: 'A CRM' },
        { v: 'tickets', t: 'A ticket or project tool' },
        { v: 'calendar', t: 'Calendar' },
        { v: 'docs', t: 'Notes or docs' },
        { v: 'memory', t: 'Paper or memory' },
      ],
    },
    {
      id: 'owner', type: 'single', kicker: 'The handoff',
      when: a => !is(a, 'self'),
      q: 'Who usually takes the <em>next step</em>?',
      help: 'Not who should. Who usually does.',
      options: a => (is(a, 'org') ? [
        { v: 'lead', t: 'The team lead' },
        { v: 'coordinator', t: 'A coordinator or ops person' },
        { v: 'first', t: 'Whoever sees it first' },
        { v: 'queue', t: 'Nobody. It sits in a queue' },
        { v: 'depends', t: 'It depends on the day' },
      ] : [
        { v: 'founder', t: 'The owner' },
        { v: 'coordinator', t: 'An office coordinator' },
        { v: 'first', t: 'Whoever sees it first' },
        { v: 'depends', t: 'It depends on the day' },
      ]),
    },
    {
      id: 'away', type: 'single', kicker: 'The gap',
      q: a => (is(a, 'self') ? 'When you’re away, what <em>happens</em>?'
        : a.owner === 'queue' ? 'When nobody is watching the queue, what <em>happens</em>?'
        : 'When that person is away, what <em>happens</em>?'),
      help: 'An honest “not sure” is useful evidence too.',
      options: a => (is(a, 'self') ? [
        { v: 'named', t: 'Someone I’ve asked covers' },
        { v: 'autoreply', t: 'An auto-reply, then it waits' },
        { v: 'waits', t: 'It waits for me' },
        { v: 'unsure', t: 'Honestly, not sure' },
      ] : a.owner === 'queue' ? [
        { v: 'named', t: 'Someone is assigned to watch it' },
        { v: 'notices', t: 'Whoever notices picks it up' },
        { v: 'waits', t: 'It waits until someone looks' },
        { v: 'unsure', t: 'Honestly, not sure' },
      ] : [
        { v: 'named', t: 'A named person covers' },
        { v: 'waits', t: 'It waits for their return' },
        { v: 'notices', t: 'Whoever notices picks it up' },
        { v: 'unsure', t: 'Honestly, not sure' },
      ]),
    },
    {
      id: 'frequency', type: 'single', kicker: 'The pattern',
      q: 'How often does something slip?',
      help: 'Your best guess. We’ll treat it as reported, not measured.',
      options: [
        { v: 'rare', t: 'Rarely, but it stings' },
        { v: 'monthly', t: 'A few times a month' },
        { v: 'weekly', t: 'Most weeks' },
        { v: 'often', t: 'More than we’d admit' },
      ],
    },
    {
      id: 'signal', type: 'single', kicker: 'The signal',
      q: 'How do you usually <em>find out</em>?',
      options: a => [
        { v: 'client', t: is(a, 'org') ? 'The requester chases it' : 'The client follows up' },
        { v: 'teammate', t: is(a, 'self') ? 'I notice, late' : 'A teammate notices' },
        { v: 'review', t: 'In a regular review' },
        { v: 'late', t: 'Weeks later, or never' },
      ],
    },
    {
      id: 'approvals', type: 'single', kicker: 'The approvals',
      when: a => is(a, 'org'),
      q: 'How many approvals before the work can <em>move</em>?',
      help: 'Count sign-offs, not people who are copied in.',
      options: [
        { v: '0', t: 'None' },
        { v: '1', t: 'One' },
        { v: '2', t: 'Two' },
        { v: '3', t: 'Three or more' },
        { v: 'varies', t: 'It depends who asks' },
      ],
    },
    {
      id: 'judgment', type: 'single', kicker: 'The boundary',
      q: 'Which decision must stay <em>human</em>?',
      help: 'Tools may help around it. They never make it.',
      options: a => [
        { v: 'fit', t: 'Who is a good fit' },
        { v: 'urgency', t: 'What is urgent' },
        { v: 'promise', t: 'What we promise' },
        { v: 'tone', t: 'The relationship itself' },
        ...(is(a, 'org', 'advisor') ? [{ v: 'risk', t: 'What is safe or allowed' }] : []),
      ],
    },
    {
      id: 'ai', type: 'single', kicker: 'AI in the work',
      q: 'Where is AI in this work <em>already</em>?',
      help: 'ChatGPT, Claude, Copilot, automations. There’s no right answer.',
      options: a => [
        { v: 'none', t: 'Nowhere yet' },
        { v: 'private', t: is(a, 'self') ? 'I use it on my own' : 'People use it on their own', s: 'Personal ChatGPT or Claude chats' },
        ...(is(a, 'self') ? [] : [{ v: 'sanctioned', t: 'We have an approved tool' }]),
        { v: 'automated', t: 'Some steps run automatically' },
        { v: 'unsure', t: 'Not sure' },
      ],
    },
    {
      id: 'feel', type: 'single', kicker: 'How it feels',
      q: a => (is(a, 'self') ? 'How does this work feel to <em>you</em>?' : 'How does it feel to the <em>people</em> in it?'),
      help: 'This matters as much as the timing.',
      options: a => [
        { v: 'fine', t: 'Mostly fine, just slow' },
        { v: 'rushed', t: 'Rushed' },
        { v: 'anxious', t: 'Anxious that things get dropped' },
        { v: 'uneven', t: is(a, 'self') ? 'Heavy. It’s all on me' : 'Uneven. Some carry more' },
        { v: 'numb', t: 'Numb. It’s just how it is' },
      ],
    },
    {
      id: 'sponsor', type: 'single', kicker: 'Permission',
      when: a => is(a, 'org'),
      q: 'Who could say yes to a <em>small test</em>?',
      help: 'Five cases, one week, fully reversible.',
      options: [
        { v: 'me', t: 'I can' },
        { v: 'manager', t: 'My manager' },
        { v: 'above', t: 'Someone above that' },
        { v: 'unclear', t: 'Nobody clearly' },
      ],
    },
    {
      id: 'note', type: 'long', kicker: 'In your words',
      q: a => `In one sentence, where does ${is(a, 'advisor') ? 'their' : 'it'} get <em>stuck</em>?`,
      help: 'Optional. Describe the process only.',
      placeholder: 'Requests sit in the shared inbox when…', max: 280,
    },
  ];

  const PHRASE = {
    // Who takes the next step, as a noun phrase inside a sentence.
    owner: {
      self: 'you', founder: 'the owner', coordinator: 'the coordinator', first: 'whoever saw it first',
      depends: 'the person on duty', lead: 'the team lead', queue: 'whoever watches the queue',
    },
    away: {
      named: a => (is(a, 'self') ? 'someone you’ve asked is meant to cover' : 'a named person is meant to cover'),
      autoreply: () => 'an auto-reply goes out, then it waits',
      waits: a => (is(a, 'self') ? 'it waits for you' : a.owner === 'queue' ? 'it waits until someone looks' : 'it waits for their return'),
      notices: () => 'whoever notices picks it up',
      unsure: () => 'nobody is quite sure what happens',
    },
    frequency: { rare: 'rarely, but it stings', monthly: 'a few times a month', weekly: 'most weeks', often: 'more often than anyone would admit' },
    signal: {
      client: a => (is(a, 'org') ? 'the requester chases it' : 'the client follows up'),
      teammate: a => (is(a, 'self') ? 'you notice, late' : 'a teammate notices'),
      review: () => 'it surfaces in a regular review',
      late: () => 'weeks later, if at all',
    },
    // The human decision, three ways: in a sentence, as a short verb object, as a label.
    judgment: {
      fit: ['who is a good fit', 'fit', 'Fit stays human'],
      urgency: ['what is urgent', 'what’s urgent', 'Urgency stays human'],
      promise: ['what gets promised', 'what’s promised', 'Promises stay human'],
      tone: ['the relationship and its tone', 'the tone', 'The relationship stays human'],
      risk: ['what is safe or allowed', 'what’s allowed', 'Risk calls stay human'],
    },
  };

  // Workflow templates. `steps(c)` receives the cast of the observation:
  // c.role (who holds the next step), c.decider, c.requester, c.doors,
  // c.inbox, c.same (holder and decider are one person), c.self.
  const WORKFLOWS = {
    lead: {
      arc: 'From a request<br>to a confirmed next step.',
      unit: 'requests',
      question: o => `Who takes the next action when ${o} ${o === 'you' ? 'are' : 'is'} away?`,
      flag: 1,
      request: 'Could we book<br>a first visit?',
      steps: c => [
        ['Request arrives', c.requester, c.doors],
        ['Request received', c.role, c.inbox],
        ['Fit reviewed', c.same ? c.decider : `${c.role} / ${c.decider.toLowerCase()}`, 'Human review'],
        ['Reply sent', c.role, 'Email / chat'],
        ['Next step agreed', `${c.role} + ${c.requester.toLowerCase()}`, 'Email / calendar'],
        ['Confirmed', c.requester, 'Route to clarify'],
      ],
      move: ['Name the cover.', 'Confirm the handoff.'],
      change: 'Where requests already land, write the next action and who holds it. Before any absence, the cover person says yes, out loud or in writing.',
      measure: 'Minutes to an acknowledged owner, and whether the next action is visible. Keep unresolved requests visible.',
    },
    scheduling: {
      arc: 'From a request<br>to a booked time.',
      unit: 'bookings',
      question: () => 'Who holds an open booking between messages?',
      flag: 3,
      request: 'Does Thursday<br>still work?',
      steps: c => [
        ['Time requested', c.requester, c.doors],
        ['Availability checked', c.role, 'Calendar'],
        ['Options sent', c.role, 'Email / text'],
        ['Waiting on a choice', c.requester, 'Reply thread'],
        ['Booking confirmed', c.role, 'Calendar'],
        ['Reminder sent', c.self ? 'You or a tool' : `A tool or ${c.role.toLowerCase()}`, 'Route to clarify'],
      ],
      move: ['One holder per booking.', 'Pass it on out loud.'],
      change: 'Each open scheduling thread has one named holder until a time is confirmed. Handing it over means the next holder says so, in the thread.',
      measure: 'Messages and hours from first request to a confirmed time, and how many threads have no visible holder.',
    },
    followup: {
      arc: 'From a conversation<br>to a closed loop.',
      unit: 'conversations',
      question: () => 'Who owns the next step once the conversation ends?',
      flag: 2,
      request: 'Great talking.<br>What’s next?',
      steps: c => [
        ['Conversation ends', `${c.requester} + ${c.role.toLowerCase()}`, c.doors],
        ['Next step noted', c.role, 'Notes or memory'],
        ['Owner assigned', 'To clarify', 'Not yet visible'],
        ['Follow-up sent', c.role, 'Email / phone'],
        ['Reply received', c.requester, 'Inbox'],
        ['Loop closed', c.role, 'Shared record'],
      ],
      move: ['Name the next step', 'before you leave the room.'],
      change: 'Every conversation ends with a written next step, an owner and a date, kept where the team already looks. Nothing else changes.',
      measure: 'Share of conversations with a written next step and owner, and days to the first follow-up.',
    },
    onboarding: {
      arc: 'From a yes<br>to a good first week.',
      unit: 'new clients',
      question: () => 'Who looks after a new client between the yes and the first session?',
      flag: 2,
      request: 'We’re in.<br>What do you need from us?',
      steps: c => [
        ['Client says yes', c.requester, c.doors],
        ['Kickoff scheduled', c.role, 'Email / calendar'],
        ['Details gathered', 'To clarify', 'Forms / email'],
        ['Work set up', c.self ? 'You' : 'Team', 'Shared tools'],
        ['First session', `${c.decider} + ${c.requester.toLowerCase()}`, 'Call / in person'],
        ['First check-in', c.role, 'Route to clarify'],
      ],
      move: ['One named guide', 'for the first two weeks.'],
      change: 'Each new client gets one named guide from yes to first check-in, who tells them who to contact and when.',
      measure: 'Days from yes to first session, and how often a new client asks “what happens next?”',
    },
    knowledge: {
      arc: 'From a question<br>to an answer anyone can find.',
      unit: 'repeated questions',
      question: o => (o === 'you' ? 'Where does an answer go after you give it?' : `Where does the answer go after ${o} gives it?`),
      flag: 4,
      request: 'Where’s the<br>template for this?',
      steps: c => [
        ['Question comes up', c.self ? 'You, later' : 'Teammate', 'Chat or in person'],
        ['Asks around', c.self ? 'You' : 'Teammate', 'Search / chat'],
        ['Finds the one who knows', c.role, 'Memory'],
        ['Answer given', c.role, 'Conversation'],
        ['Answer written down', 'To clarify', 'No shared place yet'],
        ['Next person finds it', c.self ? 'Future you' : 'Next teammate', 'Unknown'],
      ],
      move: ['Write down', 'the next answer.'],
      change: 'The next time someone answers a repeated question, the answer goes in one shared place the team already uses.',
      measure: 'How often the same question is asked twice, and whether the second person finds the answer without asking.',
    },
    approvals: {
      arc: 'From a request<br>to a decision someone can act on.',
      unit: 'approval requests',
      question: () => 'Which approvals change the outcome, and which only add waiting?',
      flag: 2,
      request: 'Can I get a yes<br>on this by Friday?',
      steps: c => [
        ['Request submitted', c.requester, c.doors],
        ['Checked for completeness', c.role, c.inbox],
        ['Waiting for approval', c.decider, 'To clarify'],
        ['Approved or returned', c.decider, 'Email / system'],
        ['Requester told', c.role, 'Email / chat'],
        ['Work proceeds', c.requester, 'Next system'],
      ],
      move: ['Separate the check', 'from the wait.'],
      change: 'For the next five requests, note which approval changed anything. Where none did, propose one step to trial as notify-only, with that approver’s agreement.',
      measure: 'Hours waiting at each approval, and how many approvals changed the outcome.',
    },
    crossteam: {
      arc: 'From one team’s done<br>to the next team’s start.',
      unit: 'handoffs',
      question: () => 'What does the receiving team need that it doesn’t get?',
      flag: 2,
      request: 'Is this ready<br>for us yet?',
      steps: c => [
        ['Work finished', 'Sending team', c.doors],
        ['Handed over', c.role, 'Ticket / chat'],
        ['Received', 'Receiving team', 'Their queue'],
        ['Clarified', 'Both teams', 'Chat thread'],
        ['Picked up', 'Receiving team', 'Their system'],
        ['Sender hears back', 'Sending team', 'Route to clarify'],
      ],
      move: ['Agree what “ready”', 'means.'],
      change: 'Both teams agree a short “ready to hand over” note. The receiving team acknowledges each handoff where the sender can see it.',
      measure: 'Clarifying messages per handoff, and time from hand-over to visible pickup.',
    },
    other: {
      arc: 'From the first step<br>to done.',
      unit: 'cases',
      question: o => `Who takes the next action when ${o} ${o === 'you' ? 'are' : 'is'} away?`,
      flag: 1,
      request: 'Any update<br>on this?',
      steps: c => [
        ['Work arrives', c.requester, c.doors],
        ['Received', c.role, c.inbox],
        ['Decision needed', c.decider, 'Human review'],
        ['Work done', c.role, 'Your tools'],
        ['Checked', c.decider, 'Review'],
        ['Closed', c.role, 'Route to clarify'],
      ],
      move: ['Name the next action,', 'every time.'],
      change: 'Wherever the work sits, write the next action and who holds it. That is the whole change.',
      measure: 'How often work sits without a visible next action, and for how long.',
    },
  };

  const HYPOTHESIS = {
    named: 'The cover may exist on paper but not in practice. Work is received, but nobody visibly accepts it.',
    autoreply: 'The auto-reply tells the client something, but promises nothing. The wait after it may be the real gap.',
    waits: 'An explicitly agreed cover may reduce the work left without a visible next action.',
    notices: 'When everyone can pick it up, nobody clearly holds it. A named next-action role may reduce drift.',
    unsure: 'The handoff may be invisible rather than broken. Making the next action visible may be the first useful change.',
  };

  const FLAGNOTE = {
    named: 'Cover is named, but acceptance isn’t visible.',
    autoreply: 'An auto-reply goes out. Then it waits.',
    waits: o => `When ${o} ${o === 'you' ? 'are' : 'is'} away, this waits.`,
    notices: 'Anyone can pick it up, so nobody clearly holds it.',
    unsure: 'What happens here is unclear from your answers.',
  };

  // What AI already does in the work, and what that means for the evidence.
  const AI_NOTE = {
    none: 'No AI in this workflow yet. Good: the first change should be a human agreement, not a tool.',
    private: 'Some of this work already runs through personal ChatGPT or Claude chats. That work is invisible to everyone else, and so are its mistakes. Worth asking, kindly, what people paste in.',
    sanctioned: 'An approved AI tool is in the loop. Check which step it touches, and whether a person still sees what it decided.',
    automated: 'Some steps run automatically. Automations fail quietly; check who would notice if one stopped.',
    unsure: 'Nobody is sure where AI is used. That is worth one question in the walkthrough.',
  };

  // How the work feels, and what that changes about how to read it.
  const FEEL_NOTE = {
    fine: 'The people are okay. Protect that: any change should cost them less than it saves.',
    rushed: 'Rushed work skips acknowledgments first. The fix may be a smaller promise, not a faster reply.',
    anxious: 'When people fear dropping things, they hold work longer and double-check. That can look like slowness from outside.',
    uneven: 'Uneven load is an ownership question before it is a speed question.',
    numb: 'When a problem feels normal, people stop reporting it. The real frequency may be higher than anyone guesses.',
  };

  const METHOD = [
    ['Listen', 'Walk through one concrete example without collecting sensitive records.'],
    ['Map', 'Trace steps, owners and decisions. Ask the person who does the work to correct it.'],
    ['Check', 'Label supported friction, other explanations, and what is still unknown.'],
    ['Design', 'Propose one reversible change, or recommend no change when the evidence is thin.'],
    ['Test', 'Agree a baseline, a small trial, and a Day 30 decision: keep, revise or undo.'],
  ];

  const RITUAL = {
    keep: 'Keep it, and keep watching workload and handoff quality alongside speed. A faster handoff is not better if it moves work to the wrong person.',
    revise: 'Revise it. Change one thing, write down who decided, and run the same comparison again.',
    undo: 'Undo it. Restore the old way without deleting the history. “No change is supported” is still a finding.',
  };

  // Resources. `kind` drives the library filters. Astervell practices are
  // original; books and research are real, cited, and not linked (links rot,
  // titles don't). Apps link to their own homepages.
  const RESOURCES = [
    { id: 'walk', kind: 'practice', title: 'The handoff walk', meta: 'Astervell practice · 20 minutes',
      note: 'Walk one real request from last week with the person who handled it.',
      steps: [
        'Pick one request from last week. A normal one, not the disaster.',
        'Sit with the person who handled it. Ask them to show you, not tell you.',
        'At each step ask three things: who had it, where did it sit, what were they waiting for?',
        'Write down only what they say. No fixing, no “why didn’t you”.',
        'Read it back. Ask: what did I get wrong?',
      ] },
    { id: 'cover', kind: 'practice', title: 'Name the cover', meta: 'Astervell practice · 10 minutes',
      note: 'A two-sentence agreement that closes most off-shift gaps.',
      steps: [
        'Before anyone is away, say it plainly: “While I’m out, ___ will acknowledge new requests. They won’t decide ___.”',
        'The cover answers: “Yes, I have it.” Silence is not a yes.',
        'Write both sentences where the work lands, not in a separate document.',
        'When the person is back, the cover hands over what’s open, out loud.',
      ] },
    { id: 'baseline', kind: 'practice', title: 'The five-request baseline', meta: 'Astervell practice · one week',
      note: 'Before changing anything, count what actually happens.',
      steps: [
        'Take the next five comparable requests. Don’t pick them.',
        'For each: when it arrived, when someone visibly acknowledged it, and who.',
        'Stop at seven days, even if you have fewer than five.',
        'That is your baseline. Now a trial has something to be compared with.',
      ] },
    { id: 'nochange', kind: 'practice', title: 'The no-change finding', meta: 'Astervell practice · 5 minutes',
      note: 'Sometimes the evidence says leave it. Write that down.',
      steps: [
        'List what you checked: the walk, the baseline, the people you asked.',
        'Say plainly why no change is supported.',
        'Name what would make you look again.',
        'Share it. It protects the team from change for its own sake.',
      ] },
    { id: 'askperson', kind: 'practice', title: 'Ask the person, not the tool', meta: 'Astervell practice · 10 minutes',
      note: 'Before handing a step to AI or an automation.',
      steps: [
        'Find the person who does the step today.',
        'Ask: “What do you notice here that isn’t written down anywhere?”',
        'Ask: “When does this step need judgment?”',
        'Whatever they name is the part a tool will miss. Keep it human, or keep it visible.',
      ] },
    { id: 'breath', kind: 'pause', title: 'One long exhale', meta: 'In this app · 1 minute',
      note: 'A short breathing pause before a decision. In through the nose, out slowly.', action: 'breathe' },
    { id: 'sighing', kind: 'read', title: 'Brief structured respiration practices enhance mood and reduce physiological arousal',
      meta: 'Balban et al. · Cell Reports Medicine · 2023',
      note: 'The Stanford study behind the long-exhale pause. Five minutes a day of exhale-focused breathing improved mood in a month-long trial.' },
    { id: 'mwv', kind: 'read', title: 'Making Work Visible', meta: 'Dominica DeGrandis · 2017',
      note: 'The book closest to what this app does: find where work hides, and show it.' },
    { id: 'goal', kind: 'read', title: 'The Goal', meta: 'Eliyahu M. Goldratt · 1984',
      note: 'A novel about bottlenecks. Read it if work keeps piling up in one place.' },
    { id: 'checklist', kind: 'read', title: 'The Checklist Manifesto', meta: 'Atul Gawande · 2009',
      note: 'Small written agreements that prevent big misses.' },
    { id: 'humble', kind: 'read', title: 'Humble Inquiry', meta: 'Edgar H. Schein · 2013',
      note: 'How to ask so people tell you what actually happens.' },
    { id: 'fearless', kind: 'read', title: 'The Fearless Organization', meta: 'Amy C. Edmondson · 2018',
      note: 'Why people stop reporting problems, and how to make it safe to speak again.' },
    { id: 'topologies', kind: 'read', title: 'Team Topologies', meta: 'Matthew Skelton & Manuel Pais · 2019',
      note: 'For work that crosses team lines: who owns what, and how teams should hand off.' },
    { id: 'systems', kind: 'read', title: 'Thinking in Systems', meta: 'Donella H. Meadows · 2008',
      note: 'For when fixing one step quietly breaks another.' },
    { id: 'weeks', kind: 'read', title: 'Four Thousand Weeks', meta: 'Oliver Burkeman · 2021',
      note: 'On finite time. For when the honest problem is that there is too much.' },
    { id: 'calm', kind: 'pause', title: 'Calm', meta: 'App · opens their site', url: 'https://www.calm.com',
      note: 'Guided sessions, breathing and sleep.' },
    { id: 'headspace', kind: 'pause', title: 'Headspace', meta: 'App · opens their site', url: 'https://www.headspace.com',
      note: 'Short guided meditations, including ones for work.' },
    { id: 'insight', kind: 'pause', title: 'Insight Timer', meta: 'App · large free library', url: 'https://insighttimer.com',
      note: 'Thousands of free guided sessions and a plain meditation timer.' },
    { id: 'claude', kind: 'tool', title: 'Claude', meta: 'AI assistant · claude.ai', url: 'https://claude.ai',
      note: 'Good for thinking a problem through with you. Paste the process, never the records.' },
    { id: 'chatgpt', kind: 'tool', title: 'ChatGPT', meta: 'AI assistant · chatgpt.com', url: 'https://chatgpt.com',
      note: 'Ask it to question your explanation, not to decide for you.' },
    { id: 'workflowbuilder', kind: 'tool', title: 'Slack Workflow Builder', meta: 'Built into Slack',
      note: 'Can post a structured message when someone fills in a form: a simple way to make an acknowledgment visible.' },
  ];

  const LIBRARY_FILTERS = [
    ['foryou', 'For you'], ['practice', 'Practices'], ['read', 'Reading'], ['pause', 'Pause'], ['tool', 'Tools'],
  ];

  const api = { BRAND, AUDIENCE, QUESTIONS, PHRASE, WORKFLOWS, HYPOTHESIS, FLAGNOTE, AI_NOTE, FEEL_NOTE, METHOD, RITUAL, RESOURCES, LIBRARY_FILTERS, their };
  root.AstervellContent = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
