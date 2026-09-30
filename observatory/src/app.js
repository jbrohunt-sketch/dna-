/* Astervell Observatory — app.
 *
 * Choreography only. Words live in content.js, reasoning in engine.js.
 * One scene is on stage at a time; each has a tone (night or paper) that
 * the frame crossfades between. Sheets slide over any scene.
 */
(() => {
'use strict';

const C = window.AstervellContent;
const E = window.AstervellEngine;

/* ------------------------------------------------------------------
   Utilities
------------------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(3, '0');
const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const wait = ms => sleep(reduced ? Math.min(ms, 60) : ms);
const announce = t => { $('#announce').textContent = t; };
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

const store = {
  get(k, d) { try { const v = localStorage.getItem('astervell.observatory.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('astervell.observatory.' + k, JSON.stringify(v)); } catch (e) {} },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith('astervell.observatory.')).forEach(k => localStorage.removeItem(k)); } catch (e) {} },
};

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (err) {}
    ta.remove();
    return ok;
  }
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  arrow: '<svg class="arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  go: '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cross: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  explore: '<svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="3"/><circle cx="17" cy="16" r="4"/><path d="M9 9l5 4M5 18l2-8"/><circle cx="5" cy="19" r="1"/></svg>',
  evidence: '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5"/></svg>',
  test: '<svg viewBox="0 0 24 24"><path d="M18 6a8 8 0 1 0 2 11M18 2v5h-5M9 12l2 2 4-4"/></svg>',
  connect: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 11l7.4-3.8M8.3 13l7.4 3.8"/></svg>',
  key: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="4"/><path d="m11 11 9 9m-6-6 3-3m0 6 3-3"/></svg>',
  lock: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 7V5a4 4 0 0 1 8 0v2M3 7h10v8H3z"/></svg>',
  think: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/></svg>',
  team: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 19c.6-3.4 3-5 6-5s5.4 1.6 6 5M15 14.2c2.6-.3 4.9 1.1 5.5 4.3"/></svg>',
  code: '<svg viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  leaf: '<svg viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>',
  out: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
};

// The mark: a peak, a horizon, and three nodes along the path of the work.
function emblem(cls = '', animated = false) {
  const d = animated ? ' draw' : '';
  return `<svg class="emblem ${cls}" viewBox="0 0 80 80" aria-hidden="true">
    <path class="${d}" style="--len:120;--dl:.25s" d="M26 56 L42 17 Q44 12.5 46 17 L64 60"/>
    <path class="${d}" style="--len:90;--dl:.7s" d="M9 70 Q24 50 38 60 T70 70"/>
    <path class="${d}" style="--len:40;--dl:1s" d="M40 44 Q48 54 60 58"/>
    <circle cx="40" cy="44" r="2.8" style="--dl:1.5s"/><circle cx="50" cy="53.5" r="2.8" style="--dl:1.65s"/><circle cx="61" cy="58.4" r="2.8" style="--dl:1.8s"/>
  </svg>`;
}

// A still sky, seeded so stars keep their places between visits.
function paintSky() {
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let stars = '';
  for (let i = 0; i < 80; i++) {
    const r = rnd() < .9 ? .5 + rnd() * .6 : 1.1 + rnd() * .5;
    stars += `<circle class="st" cx="${(rnd() * 100).toFixed(2)}%" cy="${(rnd() * 70).toFixed(2)}%" r="${r.toFixed(2)}" style="--o:${(.15 + rnd() * .45).toFixed(2)}"/>`;
  }
  $('#sky').innerHTML = `<svg preserveAspectRatio="none">${stars}</svg><div class="horizon"></div>`;
}

function dial() {
  let ticks = '';
  for (let i = 0; i < 120; i++) {
    const major = i % 10 === 0;
    const a = (i / 120) * Math.PI * 2, r1 = 250, r2 = major ? 232 : 242;
    ticks += `<line class="t${major ? ' major' : ''}" x1="${260 + r1 * Math.cos(a)}" y1="${260 + r1 * Math.sin(a)}" x2="${260 + r2 * Math.cos(a)}" y2="${260 + r2 * Math.sin(a)}"/>`;
  }
  return `<div class="dial" aria-hidden="true"><svg viewBox="0 0 520 520"><circle class="ring" cx="260" cy="260" r="200"/><circle class="ring" cx="260" cy="260" r="140" stroke-dasharray="2 8"/>${ticks}</svg></div>`;
}

/* The breathing pause: 4 seconds in, 6 out. Real timing, even with reduced
   motion (the circle simply doesn't move). Returns a stop function. */
function runBreath(root, cycles, onDone) {
  const b = $('.breath', root), cue = $('.breath-cue', root), count = $('.breath-count', root);
  let alive = true;
  (async () => {
    await sleep(500);
    for (let n = 1; n <= cycles && alive; n++) {
      if (count) count.textContent = `${n} of ${cycles}`;
      b.classList.remove('exhale'); b.classList.add('inhale'); cue.textContent = 'Breathe in';
      await sleep(4000); if (!alive) return;
      b.classList.remove('inhale'); b.classList.add('exhale'); cue.textContent = 'And out, slowly';
      await sleep(6000);
    }
    if (alive) { cue.textContent = 'Thank you.'; if (count) count.textContent = ''; onDone && onDone(); }
  })();
  return () => { alive = false; };
}
const breathHTML = () => `
  <div class="breath" aria-hidden="true"><span class="ring"></span><span class="ring r2"></span><span class="orbit-dot"></span><span class="lung"></span></div>
  <p class="breath-cue" aria-live="polite">&nbsp;</p>
  <p class="num breath-count"></p>`;

/* ------------------------------------------------------------------
   State and persistence
------------------------------------------------------------------- */
const state = {
  answers: {},
  obs: null,
  count: store.get('count', 0),
};

function history() { return store.get('history', []); }
function saveObservation(obs) {
  store.set('obs.' + obs.id, obs);
  store.set('latest', obs.id);
  store.set('count', obs.number);
  store.set('history', [{ id: obs.id, number: obs.number, label: obs.workflowLabel, created: obs.created },
    ...history().filter(h => h.id !== obs.id)].slice(0, 12));
}
function loadObservation(id) { return id ? store.get('obs.' + id, null) : null; }
state.obs = loadObservation(store.get('latest', null));

function arrangement(o) {
  return Object.assign({ token: o.start, away: false, compare: false, staged: false, evidenceFirst: false, correction: '' },
    store.get('arr.' + o.id, {}), { compare: false });
}
function saveArrangement(o, arr) {
  const { token, away, staged, evidenceFirst, correction } = arr;
  store.set('arr.' + o.id, { token, away, staged, evidenceFirst, correction });
}

/* ------------------------------------------------------------------
   Scene manager
------------------------------------------------------------------- */
const stage = $('#stage');
let current = null;
const SCENES = {};

function go(name, arg, dir = 1) {
  closeSheet();
  const mod = SCENES[name];
  const el = document.createElement('section');
  el.className = 'scene';
  el.dataset.scene = name;
  el.dataset.tone = mod.tone;
  el.style.setProperty('--dir', dir);
  el.innerHTML = mod.render(arg);
  document.documentElement.dataset.tone = mod.tone;
  $('meta[name="theme-color"]').content = mod.tone === 'night' ? '#07110e' : '#f4f1e8';
  stage.appendChild(el);
  const prev = current;
  current = el;
  if (prev) {
    prev.style.setProperty('--dir', dir);
    prev.classList.remove('in'); prev.classList.add('out');
    prev.dispatchEvent(new Event('leave'));
    setTimeout(() => prev.remove(), 750);
  }
  el.getBoundingClientRect();
  requestAnimationFrame(() => el.classList.add('in'));
  mod.mount && mod.mount(el, arg);
  const focus = el.querySelector('[data-focus]');
  if (focus) setTimeout(() => focus.focus({ preventScroll: true }), 60);
}

/* 1 · Arrival ------------------------------------------------------ */
SCENES.arrival = {
  tone: 'night',
  render() {
    const o = state.obs;
    return `
      ${dial()}
      <div class="arrival">
        <header class="arrival-top rise" style="--i:0">
          <div class="wordmark">Astervell<small>The Observatory</small></div>
          <span class="num">Workflow · Culture · Agency</span>
        </header>
        <div class="arrival-hero">
          ${emblem('', true)}
          <h1 class="display rise" style="--i:3" tabindex="-1" data-focus>${o
            ? `Welcome back${o.name ? ',<br><em>' + esc(o.name) + '</em>' : '.'}`
            : 'Most work doesn’t break.<br>It <em>waits.</em>'}</h1>
          <p class="lede rise" style="--i:4">${o
            ? `Your ${esc(o.workflowLabel.toLowerCase())} observation is where you left it.`
            : 'Tell us about one piece of work that keeps slipping. You’ll get a draft map, a question worth asking, and one change you can undo.'}</p>
        </div>
        <footer class="arrival-foot">
          ${o ? `
            <button class="btn btn-light rise" style="--i:6" data-act="home">Enter the observatory ${ICON.arrow}</button>
            <button class="btn btn-ghost rise" style="--i:7" data-act="begin">Begin a new observation</button>`
          : `
            <button class="btn btn-light rise" style="--i:6" data-act="begin">Begin ${ICON.arrow}</button>
            <div class="meta-row rise" style="--i:7"><span>5 minutes</span><span>No records</span><span>Private</span></div>`}
        </footer>
      </div>`;
  },
  mount(el) {
    el.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'begin') { state.answers = {}; go('intake'); }
      if (act === 'home') go('home');
    });
  },
};

/* 2 · Intake — one question per screen, branching by audience ------ */
SCENES.intake = {
  tone: 'paper',
  render() {
    return `
      <div class="intake">
        <div class="intake-bar">
          <button class="iconbtn" data-act="back" aria-label="Back">${ICON.back}</button>
          <div class="progress" aria-hidden="true"></div>
          <span class="num intake-count"></span>
        </div>
        <div class="q-wrap"></div>
      </div>`;
  },
  mount(el) {
    let cur = null;
    let busy = false;
    const wrap = $('.q-wrap', el);
    const bar = $('.progress', el);
    const list = () => E.questionsFor(state.answers);

    const paintProgress = (qs, i) => {
      if (bar.children.length !== qs.length) bar.innerHTML = qs.map(() => '<i></i>').join('');
      $$('i', bar).forEach((b, k) => { b.className = k < i ? 'done' : k === i ? 'now' : ''; });
      $('.intake-count', el).textContent = `${String(i + 1).padStart(2, '0')} / ${qs.length}`;
    };

    const show = (id, dir) => {
      const qs = list();
      const i = Math.max(0, qs.findIndex(q => q.id === id));
      const q = E.resolve(qs[i], state.answers);
      cur = q.id;
      busy = false;
      paintProgress(qs, i);
      const node = document.createElement('div');
      node.className = 'q enter';
      node.style.setProperty('--qdir', dir);
      node.innerHTML = questionHTML(q, state.answers[q.id]);
      const old = $('.q:not(.leave)', wrap);
      if (old) { old.style.setProperty('--qdir', dir); old.classList.add('leave'); setTimeout(() => old.remove(), 550); }
      wrap.appendChild(node);
      node.getBoundingClientRect();
      requestAnimationFrame(() => node.classList.remove('enter'));
      el.scrollTo({ top: 0 });
      bind(node, q);
      announce(`Question ${i + 1} of ${qs.length}`);
      const f = node.querySelector('input, textarea') || node.querySelector('h2');
      setTimeout(() => f && f.focus({ preventScroll: true }), reduced ? 0 : 450);
    };

    const next = () => {
      state.answers = E.prune(E.prune(state.answers));
      const qs = list();
      const i = qs.findIndex(q => q.id === cur);
      if (i < qs.length - 1) show(qs[i + 1].id, 1);
      else finish();
    };

    const finish = () => {
      state.answers = E.prune(E.prune(state.answers));
      state.count += 1;
      state.obs = E.compose(state.answers, state.count, new Date());
      saveObservation(state.obs);
      go('pause');
    };

    const bind = (node, q) => {
      if (q.type === 'single') {
        node.addEventListener('click', async e => {
          const opt = e.target.closest('.opt');
          if (!opt || busy) return;
          busy = true;
          $$('.opt', node).forEach(o => o.setAttribute('aria-checked', String(o === opt)));
          opt.classList.add('chosen');
          $('.opts', node).classList.add('settling');
          state.answers[q.id] = opt.dataset.v;
          buzz(8);
          await wait(460);
          next();
        });
      }
      if (q.type === 'multi') {
        const cont = $('[data-act="next"]', node);
        const sync = () => { cont.disabled = !(state.answers[q.id] || []).length; };
        node.addEventListener('click', e => {
          const opt = e.target.closest('.opt');
          if (!opt) return;
          const set = new Set(state.answers[q.id] || []);
          set.has(opt.dataset.v) ? set.delete(opt.dataset.v) : set.add(opt.dataset.v);
          state.answers[q.id] = q.options.map(o => o.v).filter(v => set.has(v));
          opt.setAttribute('aria-pressed', String(set.has(opt.dataset.v)));
          $('.key', opt).textContent = set.has(opt.dataset.v) ? '✓' : '';
          buzz(6);
          sync();
        });
        sync();
      }
      if (q.type === 'text' || q.type === 'long') {
        const input = $('input, textarea', node);
        const counter = $('.count', node);
        const cont = $('[data-act="next"]', node);
        const sync = () => { if (q.id === 'workflowName') cont.disabled = !input.value.trim(); };
        input.addEventListener('input', () => {
          state.answers[q.id] = input.value;
          if (counter) counter.textContent = `${input.value.length} / ${q.max}`;
          sync();
        });
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter' && (q.type === 'text' || e.metaKey || e.ctrlKey) && !cont.disabled) { e.preventDefault(); next(); }
        });
        sync();
      }
      node.addEventListener('click', e => { if (e.target.closest('[data-act="next"]')) next(); });
    };

    el.addEventListener('click', e => {
      if (!e.target.closest('[data-act="back"]')) return;
      const qs = list();
      const i = qs.findIndex(q => q.id === cur);
      if (i <= 0) go('arrival', null, -1); else show(qs[i - 1].id, -1);
    });

    // Number keys choose options.
    el.addEventListener('keydown', e => {
      const n = parseInt(e.key, 10);
      if (!n || e.target.matches('input, textarea')) return;
      const opt = $$('.q:not(.leave) .opt', el)[n - 1];
      if (opt) opt.click();
    });

    show(list()[0].id, 1);
  },
};

function questionHTML(q, val) {
  let body = '';
  if (q.type === 'single' || q.type === 'multi') {
    const multi = q.type === 'multi';
    body = `<div class="opts${q.layout === 'chips' ? ' chips' : ''}" role="${multi ? 'group' : 'radiogroup'}" aria-labelledby="qh">
      ${q.options.map((o, k) => {
        const on = multi ? (val || []).includes(o.v) : val === o.v;
        return `<button class="opt${multi ? ' multi' : ''}" data-v="${o.v}" style="--i:${k}" ${multi ? `aria-pressed="${on}"` : `role="radio" aria-checked="${on}"`}>
          <span class="key" aria-hidden="true">${multi ? (on ? '✓' : '') : k + 1}</span>
          <span><b>${o.t}</b>${o.s ? `<small>${o.s}</small>` : ''}</span>
        </button>`;
      }).join('')}
    </div>
    ${multi ? `<div class="q-actions"><button class="btn btn-primary" data-act="next">Continue ${ICON.arrow}</button></div>` : ''}`;
  } else if (q.type === 'text') {
    body = `<label class="sr" for="qi">${q.placeholder}</label>
      <input id="qi" class="field" type="text" autocomplete="${q.id === 'name' ? 'given-name' : 'off'}" maxlength="${q.max || 40}" placeholder="${q.placeholder}" value="${esc(val)}">
      <div class="q-actions"><button class="btn btn-primary" data-act="next">Continue ${ICON.arrow}</button></div>`;
  } else {
    body = `<label class="sr" for="qi">${E.plain(q.q)}</label>
      <textarea id="qi" class="field" maxlength="${q.max}" placeholder="${q.placeholder}">${esc(val)}</textarea>
      <p class="num count">${(val || '').length} / ${q.max}</p>
      <div class="guard">${ICON.shield}<p class="fine" style="color:var(--muted)">Describe the process only. No customer or patient records, credentials, financial files or screenshots of private data.</p></div>
      <div class="q-actions"><button class="btn btn-primary" data-act="next">I’m done ${ICON.arrow}</button></div>`;
  }
  return `
    <div class="q-kicker eyebrow">${q.kicker}</div>
    <h2 class="title" id="qh" tabindex="-1">${q.q}</h2>
    ${q.help ? `<p class="lede">${q.help}</p>` : ''}
    ${body}`;
}

/* 3 · Pause — nothing is computed here; this moment is for the person */
SCENES.pause = {
  tone: 'night',
  render() {
    return `
      <div class="pause">
        <p class="eyebrow rise" style="--i:0;margin-top:3vh">Before you look</p>
        <h1 class="title rise" style="--i:1" tabindex="-1" data-focus>Take one breath.</h1>
        <p class="lede rise" style="--i:2">Your observation is already written. Nothing is being calculated. This pause is for you.</p>
        <div class="rise" style="--i:3">${breathHTML()}</div>
        <div class="later rise" style="--i:4">
          <button class="btn btn-ghost" data-act="ready">I’m ready</button>
        </div>
      </div>`;
  },
  mount(el) {
    let done = false;
    const onward = () => { if (done) return; done = true; stop(); go('reveal'); };
    const stop = runBreath(el, 2, () => setTimeout(onward, 900));
    el.addEventListener('leave', () => stop());
    $('[data-act="ready"]', el).addEventListener('click', onward);
  },
};

/* 4 · Reveal — the sealed card ------------------------------------- */
SCENES.reveal = {
  tone: 'night',
  render() {
    const o = state.obs;
    return `
      <div class="reveal">
        <div class="reveal-head">
          <p class="eyebrow rise" style="--i:0">Observation N° ${pad(o.number)}</p>
          <h1 class="title rise" style="--i:1" tabindex="-1" data-focus>${o.name ? esc(o.name) + ', it’s' : 'It’s'} <em>ready.</em></h1>
        </div>
        <div class="envelope-wrap rise" style="--i:3">
          <button class="envelope" data-act="open" aria-label="Open your observation">
            <span class="flap"></span>
            <span class="seal">${emblem()}</span>
            <span class="env-inner">
              <span style="text-align:left;display:block">
                <span class="eyebrow" style="display:block;margin:0 0 12px">${esc(o.workflowLabel)}</span>
                <span class="env-name" style="display:block">A map, a question,<br><em>and one change you can undo.</em></span>
                <span class="num" style="display:block;margin-top:12px">A draft from your answers. Not a finding.</span>
              </span>
            </span>
            <span class="hint">Tap to open</span>
          </button>
        </div>
      </div>`;
  },
  mount(el) {
    $('[data-act="open"]', el).addEventListener('click', async e => {
      const env = e.currentTarget;
      if (env.classList.contains('opening')) return;
      env.classList.add('opening');
      buzz(14);
      await wait(1050);
      go('observation', { from: 'reveal' });
    });
  },
};

/* 5 · Observation — Explore · Evidence · Test · Connect ------------ */
// Shared coordinates for people, token and SVG paths (viewBox 400 × 360).
const MAP = {
  people: { holder: [100, 170], owner: [300, 200], cover: [110, 300] },
  token: { holder: [100, 104], owner: [300, 128], cover: [196, 286] },
  base: [
    'M200 64 C200 110 118 112 100 150',
    'M122 176 C190 176 240 184 272 196',
    'M100 192 C86 232 92 262 106 282',
    'M130 306 C210 330 270 284 296 226',
  ],
  path: {
    owner: 'M200 64 C200 110 118 112 100 150 S230 176 290 196',
    holder: 'M200 64 C200 110 118 112 100 150',
    cover: 'M200 64 C120 84 34 170 60 250 S92 296 104 298',
  },
};

let obsCtl = null;

SCENES.observation = {
  tone: 'night',
  render(arg) {
    const o = state.obs;
    const fromHome = arg && arg.from === 'home';
    return `
      <div class="obs-shell">
        <header class="obs-top">
          <button class="iconbtn" data-act="home" aria-label="${fromHome ? 'Back to the observatory' : 'Close'}">${fromHome ? ICON.back : ICON.close}</button>
          <span class="num">N° ${pad(o.number)} · ${esc(o.workflowLabel)}</span>
          <button class="iconbtn" data-act="about" aria-label="About this model">${ICON.info}</button>
        </header>
        <div class="obs-view" id="obs-view"></div>
        <nav class="obs-nav" aria-label="Observation views">
          <button data-view="explore">${ICON.explore}<span>Explore</span></button>
          <button data-view="evidence">${ICON.evidence}<span>Evidence</span></button>
          <button data-view="test">${ICON.test}<span>Your test</span></button>
          <button data-view="connect">${ICON.connect}<span>Connect</span></button>
        </nav>
      </div>`;
  },
  mount(el, arg) {
    const o = state.obs;
    const P = o.people;
    const arr = arrangement(o);
    let view = (arg && arg.view) || 'explore';
    const viewEl = $('#obs-view', el);
    const save = () => saveArrangement(o, arr);
    const pct = ([x, y]) => `left:${x / 4}%;top:${y / 3.6}%`;

    const person = id => {
      const p = P[id], m = E.derive(o, arr);
      const away = id === o.start && arr.away;
      return `<button class="person ${id}${m.tok === id ? ' selected' : ''}${away ? ' away' : ''}" data-person="${id}" style="${pct(MAP.people[id])}"
          aria-pressed="${m.tok === id}" aria-label="${esc(p.label)}, ${esc(p.role)}${away ? ', away' : ''}. Give first-reply authority">
        <span class="orb">${esc(p.mono)}</span>${away ? '<span class="away-badge">Away</span>' : ''}
        <span class="pname">${esc(p.label)}</span><span class="prole">${esc(p.role)}</span>
      </button>`;
    };

    const explore = () => {
      const m = E.derive(o, arr);
      const flow = o.steps.map((s, k) => `
        <li class="${k === o.flag ? 'flag' : ''}" style="--i:${k}">
          <span class="dot">${String(k + 1).padStart(2, '0')}</span>
          <div><b>${esc(s[0])}</b><small>${esc(s[1])} <i>· ${esc(s[2])}</i></small>
          ${k === o.flag ? `<div class="flagnote">${esc(o.flagNote)}</div>` : ''}</div>
        </li>`).join('');
      const hint = arr.token === o.start && !arr.compare
        ? `<span class="token-hint" aria-hidden="true" style="${m.tok === 'owner' ? 'left:20%;top:27%' : 'left:45%;top:31%'}">drag or tap</span>` : '';
      return `
        <section class="pane">
          <div class="intro pop-in"><h1 class="title" tabindex="-1" data-focus>Who can act?</h1>
            <p class="lede">Move the first reply between people. Watch where the work goes.</p></div>
          <div class="scene-top pop-in" style="--i:1"><span class="eyebrow">${arr.compare ? 'As you described it' : 'Your arrangement'}</span>
            <button class="chip" data-act="compare" aria-pressed="${arr.compare}">${arr.compare ? 'Back to yours' : 'See original'}</button></div>
          <div class="system pop-in" style="--i:2" id="system" aria-label="Interactive model. Move first-reply authority between people.">
            <div class="halo" style="${pct(MAP.people[m.tok])}"></div>
            <svg class="links" viewBox="0 0 400 360" aria-hidden="true">
              ${MAP.base.map(d => `<path d="${d}"/>`).join('')}
              <path class="${m.blocked ? 'blocked' : 'active'}" d="${MAP.path[m.tok]}"/>
              <path class="travel" d="${MAP.path[m.tok]}"/>
            </svg>
            <button class="request" data-act="request" style="left:50%;top:10%"><small>New · ${esc((o.doors[0] || 'Arrives').split(' ')[0])}</small><span>${o.request}</span></button>
            ${person('holder')}${person('owner')}${person('cover')}
            ${hint}
            <button class="token" id="token" data-at="${m.tok}" style="${pct(MAP.token[m.tok])}" aria-label="First-reply authority, now with ${esc(P[m.tok].label)}. Drag to a person or tap for options">${ICON.key} First reply</button>
            <span class="status" aria-live="polite">${m.status}</span>
            <span class="lock">${ICON.lock} ${esc(o.lock)}</span>
          </div>
          <div class="story" aria-live="polite"><h2>${m.title}</h2><p>${esc(m.body)}</p></div>
          <div class="control"><span>${esc(E.awayLabel(o, arr.away))}</span>
            <button class="switch" data-act="away" role="switch" aria-checked="${!arr.away}" aria-label="${esc(E.awayLabel(o, false))}"><i></i></button></div>
          <div class="pair">
            <button class="btn btn-ghost" data-act="replay">Replay</button>
            <button class="btn btn-light" data-act="try">Try this ${ICON.arrow}</button>
          </div>
          <p class="fine center">A way to think, not a prediction.</p>
          <details class="steps">
            <summary><span class="eyebrow">The path, step by step</span><span class="num">${o.steps.length} steps</span></summary>
            <ol class="flow">${flow}</ol>
            <div class="block"><span class="eyebrow">The question</span><p class="q-line">${esc(o.question)}</p></div>
            <p class="fine">Built from your answers. A draft reconstruction, not observed work.</p>
          </details>
        </section>`;
    };

    const evidence = () => {
      const note = o.answers.note && o.answers.note.trim();
      const quote = arr.correction || note || o.reported;
      const reads = [
        ['A possibility', o.hypothesis],
        ['Another explanation', o.contrary],
        ['What would change our mind', o.changeMind],
        ['How it feels', o.feelNote],
        ['AI in the work', o.aiNote],
        ['Permission', o.sponsorNote],
      ].filter(r => r[1]);
      return `
        <section class="pane">
          <p class="eyebrow pop-in">Before we explain it</p>
          <h1 class="title pop-in" style="--i:1" tabindex="-1" data-focus>What do we actually know?</h1>
          <article class="paper-note pop-in" style="--i:2">
            <span class="eyebrow">Your account${arr.correction ? ' · corrected' : ''}</span>
            <blockquote>“${esc(quote)}”</blockquote>
            <small>${!arr.correction && note ? esc(o.reported) : 'Reported, not observed. Frequency and duration are unmeasured.'}</small>
          </article>
          <button class="textbtn pop-in" style="--i:3" data-act="correct">That’s not quite right</button>
          ${reads.map(([k, v], i) => `<div class="read pop-in" style="--i:${4 + i}"><span class="kind"><i></i>${k}</span><p>${esc(v)}</p></div>`).join('')}
          <div class="read ask pop-in" style="--i:10"><span class="kind">Ask before changing</span><p>${esc(o.question)}</p></div>
          <p class="fine center" style="margin-top:22px">This is a working interpretation. Correct it. A different account may support a different next step.</p>
        </section>`;
    };

    const test = () => {
      const plan = E.testPlan(o, arr);
      const choice = store.get('ritual.' + o.id, null);
      const inviteBtn = `<button class="btn btn-light" data-act="invite" style="margin-top:12px">Talk it through with Astervell ${ICON.arrow}</button>`;
      if (arr.staged && plan.kind !== 'unchanged') return `
        <section class="pane center-pane">
          <div class="seal-done pop-in">${ICON.check}</div>
          <p class="eyebrow pop-in" style="--i:1">Saved for review</p>
          <h1 class="title pop-in" style="--i:2" tabindex="-1" data-focus>A small test,<br>held lightly.</h1>
          <p class="lede pop-in" style="--i:3">${esc(plan.staged)}</p>
          <div class="rowlist pop-in" style="--i:4">
            <div><small>Notice</small><p>Who waits? Who takes on more work? What would change your mind?</p></div>
            <div><small>Return</small><p>Look at the raw counts after a week. Keep, revise or undo by Day 30.</p></div>
          </div>
          <div class="decide3 pop-in" style="--i:5" role="group" aria-label="Day 30 decision">
            ${['keep', 'revise', 'undo'].map(c => `<button data-rit="${c}" aria-pressed="${choice === c}">${cap(c)}</button>`).join('')}
          </div>
          <p class="fine center" role="status">${choice ? esc(C.RITUAL[choice]) : 'Saved on this device. No real workflow has changed.'}</p>
          <button class="btn btn-ghost" data-view="connect" style="margin-top:14px">Put the dates in your calendar</button>
          ${inviteBtn}
          <button class="textbtn" data-act="explore">Back to the model</button>
        </section>`;
      if (plan.kind === 'unchanged') return `
        <section class="pane center-pane">
          <p class="eyebrow pop-in">One reversible change</p>
          <h1 class="title pop-in" style="--i:1" tabindex="-1" data-focus>What would you like to try?</h1>
          <div class="empty-orbit pop-in" style="--i:2"><span class="orb">${esc(P[o.start].mono)}</span></div>
          <p class="lede pop-in" style="--i:3">Nothing has moved yet. Move the first reply in the model, or check the evidence first.</p>
          <div class="suggest pop-in" style="--i:4"><span class="eyebrow">Where Astervell would start</span><p class="big-move">${esc(o.move[0])} <span>${esc(o.move[1])}</span></p><p class="fine">${esc(o.change)}</p></div>
          <button class="btn btn-light" data-act="explore">Explore a change ${ICON.arrow}</button>
          <button class="textbtn" data-act="evfirst">Check the evidence first</button>
        </section>`;
      return `
        <section class="pane">
          <p class="eyebrow pop-in">${esc(plan.eyebrow)}</p>
          <h1 class="title pop-in" style="--i:1" tabindex="-1" data-focus>${plan.title}</h1>
          <div class="token static pop-in" style="--i:2">${ICON.key} ${esc(plan.chip)}</div>
          <div class="rowlist pop-in" style="--i:3">${plan.rows.map(r => `<div><small>${r[0]}</small><p>${esc(r[1])}</p></div>`).join('')}</div>
          <button class="btn btn-light" data-act="stage">${plan.kind === 'evidence' ? 'Keep this evidence plan' : 'Keep this test for review'} ${ICON.arrow}</button>
          <button class="textbtn" data-act="evfirst">${plan.kind === 'evidence' ? 'Return to the trial' : 'Not enough evidence yet'}</button>
          <p class="fine center">A draft plan. Real changes need the people involved to agree.</p>
        </section>`;
    };

    const connect = () => {
      const pauses = C.RESOURCES.filter(r => r.kind === 'pause' && r.url);
      return `
        <section class="pane">
          <p class="eyebrow pop-in">Connect</p>
          <h1 class="title pop-in" style="--i:1" tabindex="-1" data-focus>Take it where<br>the work happens.</h1>
          <p class="lede pop-in" style="--i:2">Nothing leaves this device until you choose it, and you’ll see exactly what goes.</p>

          <div class="bridge-group pop-in" style="--i:3"><span class="eyebrow">Think it through</span>
            <button class="bridge" data-bridge="chatgpt"><span class="glyph">${ICON.think}</span><span><b>Ask ChatGPT</b><small>Opens ChatGPT with your observation as a prompt.</small></span><span class="go-arrow">›</span></button>
            <button class="bridge" data-bridge="claude"><span class="glyph">${ICON.think}</span><span><b>Ask Claude</b><small>Copies the prompt and opens Claude. The desktop app can take it filled in.</small></span><span class="go-arrow">›</span></button>
          </div>

          <div class="bridge-group pop-in" style="--i:4"><span class="eyebrow">Bring in your team</span>
            <button class="bridge" data-bridge="share"><span class="glyph">${ICON.team}</span><span><b>Share to Slack or Teams</b><small>A short message asking “does this match what you see?”</small></span><span class="go-arrow">›</span></button>
          </div>

          <div class="bridge-group pop-in" style="--i:5"><span class="eyebrow">Build the trial</span>
            <button class="bridge" data-bridge="brief"><span class="glyph">${ICON.code}</span><span><b>Brief for Claude Code, Codex or Cowork</b><small>The trial, its guardrails, and what must stay human.</small></span><span class="go-arrow">›</span></button>
          </div>

          <div class="bridge-group pop-in" style="--i:6"><span class="eyebrow">Keep the dates</span>
            <button class="bridge" data-act="ics"><span class="glyph">${ICON.cal}</span><span><b>Add Day 7 and Day 30</b><small>A calendar file for Apple, Outlook and most calendars.</small></span><span class="go-arrow">↓</span></button>
            <div class="bridge-row">
              <a class="pill" href="${esc(E.googleCalUrl(o, 7))}" target="_blank" rel="noopener">Google Calendar · Day 7</a>
              <a class="pill" href="${esc(E.googleCalUrl(o, 30))}" target="_blank" rel="noopener">Day 30</a>
            </div>
          </div>

          <div class="bridge-group pop-in" style="--i:7"><span class="eyebrow">Stay human</span>
            <button class="bridge" data-act="breathe"><span class="glyph">${ICON.leaf}</span><span><b>One long exhale</b><small>A minute of breathing, right here. Before a decision helps most.</small></span><span class="go-arrow">›</span></button>
            <div class="bridge-row">${pauses.map(r => `<a class="pill" href="${r.url}" target="_blank" rel="noopener">${esc(r.title)} ↗</a>`).join('')}</div>
          </div>

          <div class="bridge-group pop-in" style="--i:8"><span class="eyebrow">Go further</span>
            <button class="bridge" data-act="library"><span class="glyph">${ICON.book}</span><span><b>Library</b><small>Practices, reading and tools chosen for this kind of work.</small></span><span class="go-arrow">›</span></button>
            <button class="bridge" data-act="invite"><span class="glyph">${ICON.mail}</span><span><b>Talk to Astervell</b><small>A person, not a bot. ${esc(C.BRAND.founder)} reads every message.</small></span><span class="go-arrow">›</span></button>
          </div>

          <div class="honest pop-in" style="--i:9">
            <span class="eyebrow">Not here yet</span>
            <p>Live connections that read your Slack channels or calendar. Those need an Astervell account and your explicit permission, so we’re building them carefully instead of pretending now.</p>
          </div>
        </section>`;
    };

    const VIEWS = { explore, evidence, test, connect };
    const replay = () => {
      const t = $('.travel', viewEl);
      if (!t) return;
      t.classList.remove('go'); void t.getBoundingClientRect(); t.classList.add('go');
    };
    const render = (scrollTop = true) => {
      viewEl.innerHTML = VIEWS[view]();
      $$('.obs-nav [data-view]', el).forEach(b => { b.classList.toggle('on', b.dataset.view === view); b.setAttribute('aria-current', b.dataset.view === view ? 'page' : 'false'); });
      if (scrollTop) el.scrollTo({ top: 0 });
      if (view === 'explore') bindDrag();
    };
    const show = v => { view = v; render(); const f = $('[data-focus]', viewEl); f && f.focus({ preventScroll: true }); };
    const assign = id => {
      arr.token = id; arr.compare = false; arr.staged = false; arr.evidenceFirst = false;
      save(); buzz(10); render(false); replay();
      toast(id === o.start ? 'Back to the arrangement you described' : `First reply moved to ${P[id].the}`);
    };

    function bindDrag() {
      const token = $('#token', viewEl), sys = $('#system', viewEl);
      let drag = null, dragged = false;
      token.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        drag = { x: e.clientX, y: e.clientY, box: sys.getBoundingClientRect(), moved: false };
        dragged = false;
        token.setPointerCapture(e.pointerId);
      });
      token.addEventListener('pointermove', e => {
        if (!drag) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 7) { drag.moved = true; token.classList.add('dragging'); }
        if (!drag.moved) return;
        token.style.left = Math.max(6, Math.min(94, (e.clientX - drag.box.left) / drag.box.width * 100)) + '%';
        token.style.top = Math.max(6, Math.min(94, (e.clientY - drag.box.top) / drag.box.height * 100)) + '%';
        $$('.person', sys).forEach(p => {
          const r = $('.orb', p).getBoundingClientRect();
          p.classList.toggle('target', Math.hypot(e.clientX - r.x - r.width / 2, e.clientY - r.y - r.height / 2) < 64);
        });
      });
      token.addEventListener('pointerup', () => {
        if (!drag) return;
        dragged = drag.moved;
        const target = drag.moved && $('.person.target', sys);
        drag = null;
        if (target) assign(target.dataset.person); else if (dragged) render(false);
      });
      token.addEventListener('pointercancel', () => { drag = null; render(false); });
      token.addEventListener('click', () => { if (!dragged) openSheet('assign'); });
    }

    el.addEventListener('click', e => {
      const nav = e.target.closest('[data-view]');
      if (nav) return show(nav.dataset.view);
      const p = e.target.closest('[data-person]');
      if (p) return assign(p.dataset.person);
      const rit = e.target.closest('[data-rit]');
      if (rit) { store.set('ritual.' + o.id, rit.dataset.rit); buzz(10); return render(false); }
      const bridge = e.target.closest('[data-bridge]');
      if (bridge) return openSheet('preview', { kind: bridge.dataset.bridge, arr });
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      if (act === 'home') go('home', null, -1);
      if (act === 'about') openSheet('about');
      if (act === 'request') openSheet('request');
      if (act === 'compare') { arr.compare = !arr.compare; render(false); replay(); }
      if (act === 'away') { arr.away = !arr.away; arr.staged = false; save(); buzz(8); render(false); replay(); }
      if (act === 'replay') replay();
      if (act === 'try') { arr.compare = false; show('test'); }
      if (act === 'explore') show('explore');
      if (act === 'evfirst') { arr.evidenceFirst = !arr.evidenceFirst; arr.staged = false; save(); render(); }
      if (act === 'stage') { arr.staged = true; save(); render(); toast('Saved for review on this device'); }
      if (act === 'correct') openSheet('correct');
      if (act === 'invite') go('invite');
      if (act === 'library') go('library', { from: 'observation' });
      if (act === 'breathe') openSheet('breathe');
      if (act === 'ics') { download(`astervell-${o.number}-reviews.ics`, E.ics(o), 'text/calendar'); toast('Calendar file saved. Open it to add both dates.'); }
    });

    obsCtl = {
      arr: () => arr,
      assign: id => { closeSheet(); assign(id); },
      correct: text => { arr.correction = text; arr.staged = false; save(); closeSheet(); render(); toast('Account corrected. Read the interpretation again.'); },
    };
    render();
    setTimeout(replay, reduced ? 0 : 1200);
  },
};

/* 6 · Invitation --------------------------------------------------- */
SCENES.invite = {
  tone: 'night',
  render() {
    const o = state.obs;
    const org = o.audience === 'org';
    return `
      <div class="invite">
        <div class="obs-head" style="margin-bottom:0">
          <button class="iconbtn" data-act="back" aria-label="Back to your observation">${ICON.back}</button>
          <span class="num" style="color:var(--on-night-faint)">Workflow Clarity Pilot</span>
        </div>
        <div class="invite-card rise" style="--i:1">
          <p class="eyebrow">${o.name ? 'For ' + esc(o.name) : 'An invitation'}</p>
          <h2 tabindex="-1" data-focus>One workflow.<br><em>One clear next move.</em></h2>
          <p class="lede">Your ${esc(o.workflowLabel.toLowerCase())} observation is a draft. The pilot checks it with the person who does the work, and turns it into a map you can trust.</p>
          ${org ? `<div class="price"><b style="font-size:34px">Scoped with you</b><span>Fee agreed<br>in writing</span></div>`
            : `<div class="price"><b>$750</b><span>Fixed pilot fee<br>USD</span></div>`}
          <dl class="rows">
            <div><dt>Scope</dt><dd>${org ? 'One workflow and one team, with the people who do the work.' : 'One operator, one workflow. A short private intake, a 60-minute mapping session and a 30-minute readout.'}</dd></div>
            <div><dt>Timing</dt><dd>${org ? 'Agreed in writing before anything starts.' : 'Three business days after activation.'}</dd></div>
            <div><dt>You receive</dt><dd><ul class="receive">
              <li>Visual workflow map</li><li>Up to three evidence-labeled friction points</li><li>Human-judgment boundaries</li><li>One reversible quick win</li><li>30-day action sheet</li></ul></dd></div>
          </dl>
          <div class="sig">${emblem()}<p>You work directly with ${esc(C.BRAND.founder)}, founder of Astervell, in Seattle. Asking about fit costs nothing.</p></div>
        </div>
        <div class="invite-actions" id="invite-actions">
          <a class="btn btn-light rise" style="--i:3;text-decoration:none" href="${esc(E.mailto(o))}" data-act="accept">Write to ${esc(C.BRAND.founder)} ${ICON.arrow}</a>
          <a class="btn btn-ghost rise" style="--i:4;text-decoration:none" href="${C.BRAND.calendar}" target="_blank" rel="noopener">Book a 30-minute conversation</a>
          <button class="fine rise" style="--i:5;padding:12px;text-decoration:underline;text-underline-offset:3px" data-act="terms">Before you commit: scope and exclusions</button>
          <button class="fine rise" style="--i:6;padding:8px" data-act="home">Not now</button>
        </div>
      </div>`;
  },
  mount(el) {
    el.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'back') go('observation', { from: 'reveal', view: 'test' }, -1);
      if (act === 'home') go('home');
      if (act === 'terms') openSheet('terms');
      if (act === 'accept') {
        setTimeout(() => {
          $('#invite-actions', el).innerHTML = `
            <div class="sent pop-in" style="--i:0">
              <p class="eyebrow" style="color:var(--gold)">Draft opened</p>
              <p class="title">Nothing is sent<br>until <em>you</em> send it.</p>
              <p class="lede">Read the email in your mail app first. It describes the process only.</p>
            </div>
            <button class="btn btn-light pop-in" style="--i:2" data-act="home">Enter the observatory ${ICON.arrow}</button>`;
        }, 400);
      }
    });
  },
};

/* 7 · Library ------------------------------------------------------ */
const KIND = { practice: 'Practice', read: 'Reading', pause: 'Pause', tool: 'Tool' };

SCENES.library = {
  tone: 'paper',
  render() {
    return `
      <div class="lib-head">
        <button class="iconbtn" data-act="back" aria-label="Back">${ICON.back}</button>
        <span class="num">Library</span>
      </div>
      <h1 class="title rise" style="--i:0" tabindex="-1" data-focus>A small shelf.</h1>
      <p class="lede rise" style="--i:1">Practices from the Astervell method, reading we trust, and a few ways to slow down. Nothing here is sponsored.</p>
      <div class="filters rise" style="--i:2" role="group" aria-label="Filter">
        ${C.LIBRARY_FILTERS.filter(([k]) => k !== 'foryou' || state.obs).map(([k, t]) => `<button data-filter="${k}">${t}</button>`).join('')}
      </div>
      <ul class="shelf rise" style="--i:3" id="shelf"></ul>`;
  },
  mount(el, arg) {
    let filter = state.obs ? 'foryou' : 'practice';
    const paint = () => {
      $$('[data-filter]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
      const items = filter === 'foryou'
        ? E.recommend(state.obs, 8).map(id => C.RESOURCES.find(r => r.id === id)).filter(Boolean)
        : C.RESOURCES.filter(r => r.kind === filter);
      $('#shelf', el).innerHTML = items.map(r => {
        const inner = `<span><span class="kind">${KIND[r.kind]}</span><b>${esc(r.title)}</b><span class="meta">${esc(r.meta)}</span><p>${esc(r.note)}</p></span>`;
        if (r.url) return `<li><a class="item" href="${r.url}" target="_blank" rel="noopener">${inner}<span class="act">${ICON.out}</span></a></li>`;
        if (r.steps || r.action) return `<li><button class="item" data-res="${r.id}">${inner}<span class="act">${ICON.go}</span></button></li>`;
        return `<li><div class="item">${inner}</div></li>`;
      }).join('');
    };
    el.addEventListener('click', e => {
      const f = e.target.closest('[data-filter]');
      if (f) { filter = f.dataset.filter; paint(); return; }
      const r = e.target.closest('[data-res]');
      if (r) { const res = C.RESOURCES.find(x => x.id === r.dataset.res); return openSheet(res.action === 'breathe' ? 'breathe' : 'practice', res); }
      if (e.target.closest('[data-act="back"]')) {
        if (arg && arg.from === 'observation') go('observation', { from: 'home', view: 'connect' }, -1); else go('home', null, -1);
      }
    });
    paint();
  },
};

/* 8 · Home — the observatory, in modules --------------------------- */
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Late evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

SCENES.home = {
  tone: 'paper',
  render() {
    const o = state.obs;
    const choice = o ? store.get('ritual.' + o.id, null) : null;
    const mini = o ? o.steps.map((_, k) => `<i class="${k === o.flag ? 'flag' : ''}"></i>`).join('<b></b>') : '';
    const earlier = history().filter(h => !o || h.id !== o.id).slice(0, 4);
    return `
      <div class="home-head">
        <div>
          <p class="eyebrow rise" style="--i:0">${greeting()}${o && o.name ? ', ' + esc(o.name) : ''}</p>
          <h1 class="title rise" style="--i:1" tabindex="-1" data-focus>The Observatory</h1>
        </div>
        <button class="iconbtn rise" style="--i:1" data-act="arrival" aria-label="Back to the start">${emblem()}</button>
      </div>
      <div class="modules">
        ${o ? `
        <button class="mod wide dark rise" style="--i:2" data-act="obs">
          <span class="go">${ICON.go}</span>
          <div><p class="eyebrow">Latest · N° ${pad(o.number)}</p><h4>${esc(o.workflowLabel)}</h4></div>
          <div><div class="mini-flow" aria-hidden="true">${mini}</div><p class="fine" style="margin-top:12px">${esc(o.question)}</p></div>
        </button>
        <section class="mod ritual rise" style="--i:3" aria-labelledby="rit">
          <div><p class="eyebrow">Day 30 · you decide</p><h4 id="rit">${esc(o.move[0])} ${esc(o.move[1])}</h4></div>
          <div>
            <div class="choices" role="group" aria-label="Day 30 decision">
              ${['keep', 'revise', 'undo'].map(c => `<button data-rit="${c}" aria-pressed="${choice === c}">${cap(c)}<small>${c === 'keep' ? 'it works' : c === 'revise' ? 'change one thing' : 'restore'}</small></button>`).join('')}
            </div>
            <p class="answer" aria-live="polite">${choice ? C.RITUAL[choice] : 'After the trial, record the decision here. Every change is a small test you can keep, revise or undo.'}</p>
          </div>
        </section>
        <button class="mod wide rise" style="--i:4;min-height:0" data-act="connect">
          <span class="go">${ICON.go}</span>
          <p class="eyebrow">Connect</p><h4 style="font-size:22px">ChatGPT, Claude, Slack, your calendar, and a breath.</h4>
        </button>` : ''}
        <button class="mod rise" style="--i:5" data-act="library">
          <span class="go">${ICON.go}</span>
          <p class="eyebrow">Library</p><h4>Practices, reading, pauses.</h4>
        </button>
        <button class="mod rise" style="--i:6" data-act="method">
          <span class="go">${ICON.go}</span>
          <p class="eyebrow">The method</p><h4>Evidence before interpretation.</h4>
        </button>
        ${earlier.length ? `
        <section class="mod wide rise" style="--i:7;min-height:0">
          <p class="eyebrow">Earlier observations</p>
          <ul class="shelf" style="margin:0">${earlier.map(h => `<li><button class="item" data-open="${h.id}" style="padding:12px 0"><span><b style="font-size:19px;margin:0">${esc(h.label)}</b><span class="meta">N° ${pad(h.number)} · ${new Date(h.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></span><span class="act">${ICON.go}</span></button></li>`).join('')}</ul>
        </section>` : ''}
        ${o ? `<button class="mod wide dark rise" style="--i:8" data-act="invite">
          <span class="go">${ICON.go}</span>
          <div><p class="eyebrow">Workflow Clarity Pilot</p><h4>Check the draft with a person.</h4></div>
          <p class="fine">One workflow, one clear next move. You keep the decision.</p>
        </button>` : ''}
        <button class="mod rise" style="--i:9;min-height:0" data-act="data">
          <p class="eyebrow">Your data</p><h4 style="font-size:20px">On this device only.</h4>
        </button>
        <button class="mod rise" style="--i:9;min-height:0" data-act="begin">
          <p class="eyebrow">New</p><h4 style="font-size:20px">Observe another workflow.</h4>
        </button>
      </div>
      <footer class="home-foot rise" style="--i:10">
        <p>Human judgment, made navigable.</p>
        <a class="fine link" href="${C.BRAND.site}" target="_blank" rel="noopener">astervell.com</a>
      </footer>`;
  },
  mount(el) {
    el.addEventListener('click', e => {
      const rit = e.target.closest('[data-rit]');
      if (rit) {
        const c = rit.dataset.rit;
        store.set('ritual.' + state.obs.id, c);
        $$('[data-rit]', el).forEach(b => b.setAttribute('aria-pressed', String(b === rit)));
        const ans = $('.ritual .answer', el);
        ans.style.opacity = 0;
        setTimeout(() => { ans.textContent = C.RITUAL[c]; ans.style.transition = 'opacity .5s'; ans.style.opacity = 1; }, 150);
        buzz(10);
        return;
      }
      const open = e.target.closest('[data-open]');
      if (open) {
        const o = loadObservation(open.dataset.open);
        if (o) { state.obs = o; store.set('latest', o.id); go('observation', { from: 'home' }); }
        return;
      }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'obs') go('observation', { from: 'home' });
      if (act === 'connect') go('observation', { from: 'home', view: 'connect' });
      if (act === 'invite') go('invite');
      if (act === 'library') go('library', { from: 'home' });
      if (act === 'method' || act === 'data') openSheet(act);
      if (act === 'arrival') go('arrival', null, -1);
      if (act === 'begin') { state.answers = {}; go('intake'); }
    });
  },
};

/* ------------------------------------------------------------------
   Sheets
------------------------------------------------------------------- */
const BRIDGE = {
  chatgpt: {
    title: 'Ask ChatGPT', text: o => E.aiPrompt(o),
    note: 'ChatGPT opens with this as your message. It may send straight away, so read it here first.',
    actions: o => `<a class="btn btn-primary" href="${esc(E.chatgptUrl(E.aiPrompt(o)))}" target="_blank" rel="noopener" data-done>Open ChatGPT ${ICON.arrow}</a>
      <button class="btn btn-ghost" data-copy>Copy instead</button>`,
  },
  claude: {
    title: 'Ask Claude', text: o => E.aiPrompt(o),
    note: 'On the web, Claude can’t take a prompt from a link, so this copies it and opens a new chat for you to paste into.',
    actions: o => `<button class="btn btn-primary" data-copy-open="https://claude.ai/new">Copy and open Claude ${ICON.arrow}</button>
      <a class="btn btn-ghost" href="${esc(E.claudeDesktopUrl(E.aiPrompt(o)))}" data-done>Open in the Claude desktop app</a>`,
  },
  share: {
    title: 'Share with your team', text: o => E.shareText(o),
    note: 'Your device’s share sheet reaches Slack, Teams and Messages. On a computer, this copies the message for you to paste.',
    actions: () => `${navigator.share ? `<button class="btn btn-primary" data-share>Share… ${ICON.arrow}</button>` : ''}
      <button class="btn ${navigator.share ? 'btn-ghost' : 'btn-primary'}" data-copy>Copy message</button>`,
  },
  brief: {
    title: 'A brief for a coding agent', text: (o, arr) => E.brief(o, arr),
    note: 'For Claude Code, Codex or Cowork. It says what a tool may do, and what it must leave to people.',
    actions: o => `<button class="btn btn-primary" data-copy>Copy brief</button>
      <button class="btn btn-ghost" data-download="astervell-${o.number}-brief.md">Download .md</button>`,
  },
};

const SHEETS = {
  method: () => `
    <p class="eyebrow">The method</p>
    <h2 class="title" id="sheet-title">Evidence before interpretation.</h2>
    <p class="lede">Reconstruct one real example. Separate what was reported from what might explain it. Check the map with the person who does the work, consider another explanation, and agree what evidence would change the recommendation.</p>
    <ol class="method">${C.METHOD.map((m, k) => `<li><span>${String(k + 1).padStart(2, '0')}</span><div><b>${m[0]}</b><p>${m[1]}</p></div></li>`).join('')}</ol>`,
  data: () => `
    <p class="eyebrow">Your data</p>
    <h2 class="title" id="sheet-title">A conversation, not system access.</h2>
    <p class="lede">Everything you’ve answered is stored in this browser and nowhere else. Nothing is sent unless you open a Connect option or write to us, and you see the text first.</p>
    <div class="ask">
      <div class="yes">${ICON.check}How the work moves, in your words</div>
      <div class="no">${ICON.cross}<span>Customer or patient records</span></div>
      <div class="no">${ICON.cross}<span>Passwords and system access</span></div>
      <div class="no">${ICON.cross}<span>Screenshots of private data</span></div>
    </div>
    <div class="sheet-actions">
      ${state.obs ? '<button class="btn btn-ghost" data-act="export">Download my observation (.json)</button>' : ''}
      <button class="btn btn-ghost" data-act="forget">Forget everything on this device</button>
    </div>`,
  terms: () => `
    <p class="eyebrow">Before you commit</p>
    <h2 class="title" id="sheet-title">Scope and exclusions.</h2>
    <div class="fineprint">
      <p>Written scope and activation terms are agreed before payment. The fee is due before kickoff, after written scope acceptance.</p>
      <p>The delivery clock starts only after written scope acceptance, cleared payment, private intake review, acknowledgement of the data boundary, confirmation of the workflow and decision authority, and scheduling of the mapping session.</p>
      <p>Excludes implementation, software, additional workflows, staff evaluation, regulated data, professional advice and guaranteed results.</p>
      <p>A finding may be that no meaningful change is supported. The quick win is a recommendation to test, not implementation or a promised saving.</p>
    </div>`,
  assign: () => {
    const o = state.obs, P = o.people, cur = obsCtl.arr().token;
    return `
    <p class="eyebrow">Move one decision</p>
    <h2 class="title" id="sheet-title">Who may send the first reply?</h2>
    <p class="lede">This allows acknowledgment, not acceptance of the work.</p>
    <div class="owners">${['holder', 'owner', 'cover'].map(id => `
      <button data-assign="${id}" aria-pressed="${cur === id}"><span class="orb sm">${esc(P[id].mono)}</span>
        <span><b>${esc(P[id].label)}${id === o.start ? ' <em>· as described</em>' : ''}</b><small>${esc(P[id].role)}${id === o.start && obsCtl.arr().away ? ' · away' : ''}</small></span></button>`).join('')}
    </div>
    <p class="fine" style="margin-top:14px">Decisions about ${esc(o.judgment)} stay where they are.</p>`;
  },
  correct: () => `
    <p class="eyebrow">You can correct the map</p>
    <h2 class="title" id="sheet-title">What is closer to what happens?</h2>
    <form id="correction-form">
      <label class="sr" for="correction">Your account</label>
      <textarea class="field" id="correction" maxlength="280" required>${esc(obsCtl.arr().correction || state.obs.reported)}</textarea>
      <div class="guard">${ICON.shield}<p class="fine" style="color:var(--muted)">Describe the process only. No client names, records or credentials.</p></div>
      <button class="btn btn-primary" style="margin-top:16px">Apply correction</button>
    </form>`,
  request: () => {
    const o = state.obs;
    return `
    <p class="eyebrow">${esc(o.doors[0] || 'A typical arrival')}</p>
    <h2 class="title" id="sheet-title">“${E.plain(o.request)}”</h2>
    <p class="lede">The first acknowledgment and the decision about ${esc(o.judgment)} often end up bundled together, so both wait for the same person.</p>
    <p class="lede" style="margin-top:12px">They are different decisions. The model lets you try separating them.</p>`;
  },
  about: () => `
    <p class="eyebrow">About this model</p>
    <h2 class="title" id="sheet-title">Rules, not magic.</h2>
    <div class="fineprint">
      <p>The observation is built from your answers by plain, readable rules. No AI writes it, and it predicts nothing. That’s deliberate: you should be able to see why it says what it says.</p>
      <p>Only first-reply authority moves in the model. Real changes need the people involved to agree.</p>
      <p>Your answers and choices stay on this device unless you send them somewhere yourself.</p>
    </div>`,
  practice: r => `
    <p class="eyebrow">${esc(r.meta)}</p>
    <h2 class="title" id="sheet-title">${esc(r.title)}</h2>
    <p class="lede">${esc(r.note)}</p>
    <ol class="steps-list">${r.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>`,
  breathe: {
    html: () => `
      <p class="eyebrow">In this app · 1 minute</p>
      <h2 class="title" id="sheet-title">One long exhale.</h2>
      <p class="lede">In through the nose for four. Out through the mouth for six, slower than feels natural.</p>
      ${breathHTML()}
      <p class="fine" style="text-align:center">Based on exhale-focused breathing studied at Stanford (Balban et al., 2023).</p>`,
    mount: body => { sheetCleanup = runBreath(body, 6); },
  },
  preview: {
    html: ({ kind, arr }) => {
      const b = BRIDGE[kind];
      return `
        <p class="eyebrow">Connect</p>
        <h2 class="title" id="sheet-title">${b.title}</h2>
        <p class="lede">${b.note}</p>
        <pre class="preview" tabindex="0">${esc(b.text(state.obs, arr))}</pre>
        <p class="leaves fine">${ICON.shield}This is exactly what leaves this device.</p>
        <div class="sheet-actions">${b.actions(state.obs)}</div>`;
    },
    mount: (body, { kind, arr }) => {
      const text = BRIDGE[kind].text(state.obs, arr);
      body.addEventListener('click', async e => {
        if (e.target.closest('[data-copy]')) { toast(await copy(text) ? 'Copied' : 'Couldn’t copy. Select the text above.'); }
        const co = e.target.closest('[data-copy-open]');
        if (co) { await copy(text); window.open(co.dataset.copyOpen, '_blank', 'noopener'); toast('Copied. Paste it into the new chat.'); }
        if (e.target.closest('[data-share]')) { try { await navigator.share({ title: `Workflow check: ${state.obs.workflowLabel}`, text }); } catch (err) {} }
        const dl = e.target.closest('[data-download]');
        if (dl) download(dl.dataset.download, text, 'text/markdown');
        if (e.target.closest('[data-done]')) setTimeout(closeSheet, 300);
      });
    },
  },
};

const sheetRoot = $('#sheet');
let lastFocus = null;
let sheetCleanup = null;
function openSheet(name, arg) {
  lastFocus = document.activeElement;
  const def = SHEETS[name];
  const body = $('#sheet-body');
  if (sheetCleanup) { sheetCleanup(); sheetCleanup = null; }
  body.replaceWith(body.cloneNode(false)); // drop listeners from the previous sheet
  const fresh = $('#sheet-body');
  fresh.innerHTML = typeof def === 'function' ? def(arg) : def.html(arg);
  if (def.mount) def.mount(fresh, arg);
  sheetRoot.classList.add('open');
  sheetRoot.setAttribute('aria-hidden', 'false');
  $('.sheet', sheetRoot).scrollTop = 0;
  const title = $('#sheet-title');
  title.setAttribute('tabindex', '-1');
  setTimeout(() => title.focus({ preventScroll: true }), 80);
}
function closeSheet() {
  if (sheetCleanup) { sheetCleanup(); sheetCleanup = null; }
  if (!sheetRoot.classList.contains('open')) return;
  sheetRoot.classList.remove('open');
  sheetRoot.setAttribute('aria-hidden', 'true');
  lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
}
sheetRoot.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) closeSheet();
  const who = e.target.closest('[data-assign]');
  if (who && obsCtl) obsCtl.assign(who.dataset.assign);
  if (e.target.closest('[data-act="export"]')) {
    download(`astervell-observation-${state.obs.number}.json`, E.exportJSON(state.obs, store.get('arr.' + state.obs.id, null)), 'application/json');
  }
  if (e.target.closest('[data-act="forget"]')) {
    store.clear();
    state.obs = null; state.count = 0; state.answers = {};
    go('arrival', null, -1);
    toast('Forgotten. Nothing is left on this device.');
  }
});
sheetRoot.addEventListener('submit', e => {
  e.preventDefault();
  const v = $('#correction', sheetRoot)?.value.trim();
  if (v && obsCtl) obsCtl.correct(v);
});
// Drag the sheet down to dismiss.
(() => {
  const sheet = $('.sheet', sheetRoot);
  let y0 = null, dy = 0;
  sheet.addEventListener('touchstart', e => { if (sheet.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    if (y0 === null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    if (dy > 0) { sheet.style.transition = 'none'; sheet.style.transform = `translateY(${dy}px)`; }
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (y0 === null) return;
    sheet.style.transition = ''; sheet.style.transform = '';
    if (dy > 110) closeSheet();
    y0 = null;
  });
})();
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

/* ------------------------------------------------------------------
   Begin
------------------------------------------------------------------- */
paintSky();
// The frame is a viewport, never a scroller: undo any focus-driven scroll.
$('#app').addEventListener('scroll', e => { e.currentTarget.scrollTop = 0; e.currentTarget.scrollLeft = 0; });
go('arrival');
})();
