import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function quantile(sorted, q) {
  if (sorted.length === 0) return 0;
  const i = Math.max(0, Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1))));
  return sorted[i];
}

async function waitForJson(url, timeoutMs = 7000) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${url}`);
    await delay(120);
  }
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map(); // key: `${sessionId||''}:${method}`
    this.ws.addEventListener('message', (ev) => this.onMessage(ev.data));
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }

  onMessage(data) {
    const msg = JSON.parse(data);
    if (msg.id) {
      const p = this.pending.get(msg.id);
      if (p) {
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message || 'CDP error'));
        else p.resolve(msg.result);
      }
      return;
    }

    if (!msg.method) return;
    const sid = msg.sessionId || '';
    const key = `${sid}:${msg.method}`;
    const list = this.listeners.get(key);
    if (list) {
      for (const fn of list) fn(msg.params);
    }
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  on(method, fn, sessionId = '') {
    const sid = sessionId || '';
    const key = `${sid}:${method}`;
    const list = this.listeners.get(key) || [];
    list.push(fn);
    this.listeners.set(key, list);
    return () => {
      const cur = this.listeners.get(key) || [];
      this.listeners.set(
        key,
        cur.filter((x) => x !== fn),
      );
    };
  }

  async waitForEvent(method, sessionId, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const off = this.on(
        method,
        (params) => {
          off();
          clearTimeout(t);
          resolve(params);
        },
        sessionId,
      );
      const t = setTimeout(() => {
        off();
        reject(new Error(`Timed out waiting for event ${method}`));
      }, timeoutMs);
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {
      // ignore
    }
  }
}

function makeStaticServer(rootDir) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const rel = safePath === '/' ? '/index.html' : safePath;
    const filePath = path.join(rootDir, rel);

    try {
      const st = statSync(filePath);
      if (!st.isFile()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const ctype =
        ext === '.html'
          ? 'text/html; charset=utf-8'
          : ext === '.js'
            ? 'application/javascript; charset=utf-8'
            : ext === '.css'
              ? 'text/css; charset=utf-8'
              : ext === '.md'
                ? 'text/markdown; charset=utf-8'
                : 'application/octet-stream';

      res.setHeader('Content-Type', ctype);
      res.setHeader('Cache-Control', 'no-store');
      res.writeHead(200);
      res.end(readFileSync(filePath));
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return server;
}

function metricsToMap(metricsResult) {
  const out = {};
  const list = metricsResult?.metrics || [];
  for (const m of list) out[m.name] = m.value;
  return out;
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const server = makeStaticServer(rootDir);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/index.html`;

  const chromeArgs = [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=/tmp/raptorq_article_chrome_profile_${Date.now()}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--disable-translate',
    '--hide-scrollbars',
    '--mute-audio',
  ];

  const chrome = spawn('/usr/bin/google-chrome', chromeArgs, { stdio: 'ignore' });

  let cdp;
  try {
    const version = await waitForJson('http://127.0.0.1:9222/json/version');
    cdp = new CDP(version.webSocketDebuggerUrl);
    await cdp.ready();

    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Performance.enable', {}, sessionId);

    await cdp.send('Page.navigate', { url }, sessionId);
    await cdp.waitForEvent('Page.loadEventFired', sessionId, 30000);

    // Let MathJax + hero init settle.
    await delay(2500);

    const metricsBefore = metricsToMap(await cdp.send('Performance.getMetrics', {}, sessionId));

    // Measure: rAF deltas + longtasks while we programmatically scroll.
    const measureExpr = `(async () => {
      const res = { ok: true, notes: [] };
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) res.notes.push('prefers-reduced-motion');

      const perf = { deltas: [], longTasks: [] };
      let rafId = null;
      let last = performance.now();
      const raf = (t) => {
        perf.deltas.push(t - last);
        last = t;
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      let po = null;
      try {
        po = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) perf.longTasks.push(e.duration);
        });
        po.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        res.notes.push('no-longtask');
      }

      const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      const steps = 240;
      const stepDelay = 12;
      for (let i = 0; i <= steps; i++) {
        scrollTo(0, max * (i / steps));
        await new Promise(r => setTimeout(r, stepDelay));
      }
      for (let i = steps; i >= 0; i--) {
        scrollTo(0, max * (i / steps));
        await new Promise(r => setTimeout(r, stepDelay));
      }

      if (rafId) cancelAnimationFrame(rafId);
      if (po) try { po.disconnect(); } catch {}

      const deltas = perf.deltas.slice(5); // drop warmup frames
      deltas.sort((a,b)=>a-b);
      const mean = deltas.reduce((s,x)=>s+x,0) / Math.max(1, deltas.length);
      const p95 = deltas.length ? deltas[Math.floor(deltas.length * 0.95)] : 0;
      const p99 = deltas.length ? deltas[Math.floor(deltas.length * 0.99)] : 0;
      const over20 = deltas.filter(x => x > 20).length;
      const over33 = deltas.filter(x => x > 33).length;

      const longTotal = perf.longTasks.reduce((s,x)=>s+x,0);
      const longCount = perf.longTasks.length;

      return {
        meanDeltaMs: mean,
        p95DeltaMs: p95,
        p99DeltaMs: p99,
        frames: deltas.length,
        framesOver20ms: over20,
        framesOver33ms: over33,
        longTaskCount: longCount,
        longTaskTotalMs: longTotal,
        notes: res.notes,
      };
    })()`;

    const out = await cdp.send(
      'Runtime.evaluate',
      {
        expression: measureExpr,
        awaitPromise: true,
        returnByValue: true,
      },
      sessionId,
    );

    const value = out?.result?.value ?? out?.result ?? out?.value ?? out;

    const metricsAfter = metricsToMap(await cdp.send('Performance.getMetrics', {}, sessionId));
    const metricsDelta = {};
    const keys = new Set([...Object.keys(metricsBefore), ...Object.keys(metricsAfter)]);
    for (const k of keys) metricsDelta[k] = (metricsAfter[k] ?? 0) - (metricsBefore[k] ?? 0);

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          scroll: value,
          metricsDelta,
        },
        null,
        2,
      ),
    );
  } finally {
    if (cdp) cdp.close();
    chrome.kill('SIGKILL');
    server.close();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
