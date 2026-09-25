// Prerender the atlas into a script-free HTML page for viewers that don't run JavaScript
// (e.g. the iOS file preview). Usage: node tools/prerender.mjs data/processed/atlas.html data/processed/atlas_static.html
// Needs the `playwright` npm package and a Chromium (set CHROMIUM_PATH if not the default).
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const [src, out] = process.argv.slice(2);
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
await p.goto('file://' + path.resolve(src));
await p.waitForTimeout(600);
const html = await p.evaluate(async () => {
  const chapters = [...document.querySelectorAll('.chap')].map((c) => ({
    name: c.querySelector('.chap-btn').innerText.replace(/\s+/g, ' ').trim(),
    subs: [...c.querySelectorAll('.sub-btn')].map((s) => [s.dataset.go, s.innerText.trim()]),
  }));
  const parts = [];
  for (const ch of chapters) {
    const secs = [];
    for (const [id, name] of ch.subs) {
      document.querySelector(`[data-go="${id}"]`).click();
      await new Promise((r) => setTimeout(r, 250));
      const sec = document.getElementById(id).cloneNode(true);
      sec.querySelectorAll('.tabs, .g-btns, .scoreline, .reveal-btn, button.link, .lens').forEach((n) => n.remove());
      sec.querySelectorAll('[data-view="table"]').forEach((n) => n.remove());
      const ap = sec.querySelector('#apoe');
      if (ap) { const d = document.createElement('details'); d.className = 'why'; d.innerHTML = '<summary>Tap to show my APOE result</summary>'; ap.classList.remove('hidden'); ap.removeAttribute('id'); d.appendChild(ap); sec.querySelector('.panel .muted')?.after(d); }
      sec.querySelectorAll('button.door, button.study, button.lab-banner, button.ring-row').forEach((btn) => { const div = document.createElement('div'); div.className = btn.className; div.innerHTML = btn.innerHTML; btn.replaceWith(div); });
      sec.querySelectorAll('[data-tip]').forEach((n) => n.removeAttribute('data-tip'));
      sec.querySelectorAll('.rv').forEach((n) => { n.classList.remove('rv'); n.style.transitionDelay = ''; });
      secs.push(`<section class="page active" id="s-${id}"><div class="sec-label">${ch.name} · ${name}</div>${sec.innerHTML}</section>`);
    }
    parts.push({ ch, secs });
  }
  const toc = parts.map(({ ch }) => `<div class="toc-ch"><b>${ch.name}</b>${ch.subs.map(([id, n]) => `<a href="#s-${id}">${n}</a>`).join('')}</div>`).join('');
  const css = document.querySelector('style').textContent;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;"><title>Genome Atlas</title>
<style>${css}
.static main{max-width:1100px;margin:0 auto;padding:24px 16px 80px}
.static section.page{display:block;animation:none;padding-top:28px;margin-top:28px;border-top:1px solid var(--rule)}
.sec-label{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--brass);margin-bottom:10px}
.toc{display:grid;gap:10px;margin:18px 0 8px}.toc-ch{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;font-size:14px}.toc-ch b{font-family:var(--serif);font-weight:500;font-size:17px;width:100%}
.toc a{color:var(--accent);text-decoration:none}
</style></head><body class="static"><main>
<div class="brand">GENOME ATLAS</div><p class="faint" style="font-size:13px;margin:4px 0 0">Static edition for phones and previews: everything in one scroll, no scripts, no network. Tap "Why do we think this?" to expand any evidence.</p>
<nav class="toc">${toc}</nav>${parts.flatMap((x) => x.secs).join('')}</main></body></html>`;
});
fs.writeFileSync(out, html);
console.log(out, (fs.statSync(out).size / 1e6).toFixed(1) + ' MB');
await b.close();
