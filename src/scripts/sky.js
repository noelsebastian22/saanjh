/**
 * Night sky background. No dependencies.
 *
 * Two fixed canvases sit behind the page:
 *   .sky__field  three pre-rendered star layers (far, mid, near) and a faint
 *                Milky Way. Repainted only when the scroll position changes.
 *   .sky__live   the handful of stars that twinkle and the odd shooting star.
 *                Repainted every frame, but it is only ~100 sprite draws.
 *
 * Each layer is a viewport-sized tile that wraps on both axes and moves at its
 * own fraction of the page scroll. Far stars barely move, near stars move
 * more, which is what makes scrolling feel like panning across a deep sky.
 *
 * Stars are placed on a jittered grid (one per cell, anywhere in the cell), so
 * they spread evenly without clumping, and brightness follows a steep power
 * curve: thousands of faint pinpricks, a few bright stars with colour and glow.
 *
 * prefers-reduced-motion: one static paint. No parallax, twinkle or meteors.
 */

const root = document.querySelector('[data-sky]');
if (root) initSky(root);

function initSky(root) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const field = root.querySelector('.sky__field');
  const live = root.querySelector('.sky__live');
  const fctx = field.getContext('2d');
  const lctx = live.getContext('2d');

  /* speed: share of scrollY the layer moves. drift: sideways share, so the sky
     slides on a slight diagonal like it is turning overhead. */
  const LAYERS = [
    { speed: 0.035, drift: 0.01, area: 880, rMin: 0.3, rMax: 0.75, alpha: 0.78, glow: 2 },
    { speed: 0.09, drift: 0.025, area: 5200, rMin: 0.42, rMax: 1.05, alpha: 0.92, glow: 0.86 },
    { speed: 0.18, drift: 0.05, area: 21000, rMin: 0.55, rMax: 1.45, alpha: 1, glow: 0.62 },
  ];

  /* Stellar colours, roughly by spectral class, with how common each is. */
  const PALETTE = [
    { w: 0.08, c: [168, 190, 255] },
    { w: 0.2, c: [204, 216, 255] },
    { w: 0.32, c: [250, 248, 255] },
    { w: 0.2, c: [255, 244, 228] },
    { w: 0.13, c: [255, 222, 182] },
    { w: 0.07, c: [255, 196, 158] },
  ];

  let W = 0, H = 0, dpr = 1;
  let tiles = [];
  let twinklers = [];
  let sprites = [];
  let scroll = window.scrollY;
  let painted = NaN;
  let meteor = null;
  let nextMeteor = 0;
  let last = performance.now();
  let raf = 0;

  /* ---------- helpers ---------- */

  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const gauss = (r) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  const mod = (n, m) => ((n % m) + m) % m;

  function pickColour(r) {
    let x = r();
    for (let i = 0; i < PALETTE.length; i++) { x -= PALETTE[i].w; if (x <= 0) return i; }
    return 2;
  }
  /* Faint stars read as white; colour only shows once a star is bright. */
  function tint(i, b) {
    const c = PALETTE[i].c, k = 0.25 + 0.75 * b;
    return [255 + (c[0] - 255) * k, 255 + (c[1] - 255) * k, 255 + (c[2] - 255) * k].map(Math.round);
  }
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

  /* Call fn at (x, y) and at every wrapped copy that could bleed into the tile. */
  function wrapped(x, y, reach, fn) {
    const xs = [x], ys = [y];
    if (x < reach) xs.push(x + W); else if (x > W - reach) xs.push(x - W);
    if (y < reach) ys.push(y + H); else if (y > H - reach) ys.push(y - H);
    for (const px of xs) for (const py of ys) fn(px, py);
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * dpr));
    c.height = Math.max(1, Math.round(h * dpr));
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return [c, ctx];
  }

  /* ---------- painting a star ---------- */

  function drawStar(ctx, x, y, r, colour, a, glow, spikes) {
    if (glow) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 7);
      g.addColorStop(0, rgba(colour, 0.32 * a));
      g.addColorStop(0.22, rgba(colour, 0.09 * a));
      g.addColorStop(1, rgba(colour, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 7, 0, Math.PI * 2); ctx.fill();
    }
    if (spikes) {
      const L = r * 11;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const g = ctx.createLinearGradient(x - dx * L, y - dy * L, x + dx * L, y + dy * L);
        g.addColorStop(0, rgba(colour, 0));
        g.addColorStop(0.5, rgba(colour, 0.28 * a));
        g.addColorStop(1, rgba(colour, 0));
        ctx.strokeStyle = g; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(x - dx * L, y - dy * L); ctx.lineTo(x + dx * L, y + dy * L); ctx.stroke();
      }
    }
    ctx.fillStyle = rgba(colour, a);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  /* ---------- building the layers ---------- */

  function buildLayer(L, li) {
    const [canvas, ctx] = makeCanvas(W, H);
    const r = rng(1103 + li * 7919);
    const cell = Math.sqrt(L.area);
    const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
    const cw = W / cols, ch = H / rows;

    if (li === 0) paintMilkyWay(ctx, rng(77));
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        /* Jittered grid, with a few empty cells so it never reads as a pattern. */
        if (r() < 0.12) continue;
        const x = (gx + r()) * cw;
        const y = (gy + r()) * ch;
        const b = Math.pow(r(), 3.2);
        const rad = L.rMin + (L.rMax - L.rMin) * b;
        const col = tint(pickColour(r), b);
        const a = (0.16 + 0.84 * b) * L.alpha;
        const glow = b > L.glow;
        const spikes = li === 2 && b > 0.9;
        wrapped(x, y, rad * 11, (px, py) => drawStar(ctx, px, py, rad, col, a, glow, spikes));
      }
    }
    return canvas;
  }

  /* A soft band along the tile's diagonal. Running corner to corner means it
     joins up seamlessly when the tile wraps on both axes. */
  function paintMilkyWay(ctx, r) {
    const len = Math.hypot(W, H);
    const ux = W / len, uy = -H / len;      // along the band
    const nx = -uy, ny = ux;                // across the band
    const band = Math.min(len * 0.17, 360);
    const at = (t, s) => [t * W + nx * s, H - t * H + ny * s];

    /* The haze is summed as floating-point light on a one-third size grid, then
       written out once with random dither. Stacking hundreds of faint canvas
       gradients instead leaves a visible cross-hatch from 8-bit rounding. */
    const q = 1 / 3;
    const gw = Math.max(1, Math.round(W * q)), gh = Math.max(1, Math.round(H * q));
    const light = new Float32Array(gw * gh * 3);
    const dust = new Float32Array(gw * gh);

    /* Elliptical gaussian stretched along the band. sa/sc are sigmas in CSS px. */
    const splat = (x, y, sa, sc, fn) => {
      const cx = x * q, cy = y * q, a = sa * q * 2.8, c = sc * q * 2.8;
      const ex = Math.sqrt((a * ux) ** 2 + (c * nx) ** 2);
      const ey = Math.sqrt((a * uy) ** 2 + (c * ny) ** 2);
      const ia = 1 / (2 * (sa * q) ** 2), ic = 1 / (2 * (sc * q) ** 2);
      for (let py = Math.floor(cy - ey); py <= Math.ceil(cy + ey); py++) {
        const row = mod(py, gh) * gw, dy = py - cy;
        for (let px = Math.floor(cx - ex); px <= Math.ceil(cx + ex); px++) {
          const dx = px - cx;
          const u = dx * ux + dy * uy, v = dx * nx + dy * ny;
          const e = u * u * ia + v * v * ic;
          if (e < 7.8) fn(row + mod(px, gw), Math.exp(-e));
        }
      }
    };
    const glow = (x, y, sa, sc, colour, amp) =>
      splat(x, y, sa, sc, (i, g) => {
        light[i * 3] += colour[0] * g * amp;
        light[i * 3 + 1] += colour[1] * g * amp;
        light[i * 3 + 2] += colour[2] * g * amp;
      });

    /* A wide, faint underglow first, then finer clouds on top. */
    for (let i = 0; i < 16; i++) {
      const [x, y] = at(i / 16 + r() * 0.04, gauss(r) * band * 0.08);
      glow(x, y, band * 0.7, band * 0.3, [0.44, 0.48, 0.74], 3.2);
    }
    const clouds = Math.round(len / 2.4);
    for (let i = 0; i < clouds; i++) {
      const t = r();
      const s = gauss(r) * band * 0.24;
      const [x, y] = at(t, s);
      /* Brighter and a touch warmer toward a core about a third of the way along. */
      const core = Math.exp(-Math.pow((t - 0.36) / 0.14, 2));
      const size = band * (0.03 + r() * 0.09) * (1 + core * 0.3);
      const warm = r() < core * 0.5 && Math.abs(s) < band * 0.18;
      const c = warm ? [0.82, 0.74, 0.7] : r() < 0.6 ? [0.48, 0.53, 0.8] : [0.6, 0.58, 0.84];
      glow(x, y, size * (1.8 + r() * 2.4), size, c, (0.9 + r() * 1.9) * (0.75 + core * 0.9));
    }
    /* Dust lanes: broken dark streaks near the centre line, in a few patches
       rather than one continuous river. */
    const patches = 9;
    for (let p = 0; p < patches; p++) {
      const t0 = r(), offset = gauss(r) * band * 0.05, spread = 0.03 + r() * 0.05;
      const n = Math.round(len / 45);
      for (let i = 0; i < n; i++) {
        const [x, y] = at(t0 + gauss(r) * spread, offset + gauss(r) * band * 0.025);
        const size = band * (0.01 + r() * 0.025);
        const depth = 0.06 + r() * 0.14;
        splat(x, y, size * (2.5 + r() * 3), size, (k, g) => { dust[k] += g * depth; });
      }
    }

    const haze = document.createElement('canvas');
    haze.width = gw; haze.height = gh;
    const h = haze.getContext('2d');
    const img = h.createImageData(gw, gh);
    const px = img.data;
    for (let i = 0; i < gw * gh; i++) {
      const keep = 1 - Math.min(0.6, dust[i]);
      const R = light[i * 3] * keep, G = light[i * 3 + 1] * keep, B = light[i * 3 + 2] * keep;
      const m = Math.max(R, G, B);
      if (m < 0.05) continue;
      /* Light over a dark sky: store it as colour plus coverage, with noise dither. */
      px[i * 4] = (R / m) * 255;
      px[i * 4 + 1] = (G / m) * 255;
      px[i * 4 + 2] = (B / m) * 255;
      px[i * 4 + 3] = Math.min(255, Math.max(0, m + Math.random() - 0.5));
    }
    h.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(haze, 0, 0, W, H);

    /* The grain that makes it look milky: a dense drift of very faint stars. */
    const grains = Math.round((W * H) / 520);
    for (let i = 0; i < grains; i++) {
      const [x, y] = at(r(), gauss(r) * band * 0.2);
      const rad = 0.18 + r() * 0.26;
      const a = 0.05 + Math.pow(r(), 2.5) * 0.36;
      ctx.fillStyle = rgba([232, 234, 255], a);
      ctx.beginPath(); ctx.arc(mod(x, W), mod(y, H), rad, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* Twinkling stars are not baked into the tiles: they are drawn live. */
  function buildTwinklers() {
    const r = rng(4242);
    const list = [];
    const count = Math.round((W * H) / 16000);
    for (let i = 0; i < count; i++) {
      const layer = r() < 0.6 ? 1 : 2;
      const b = 0.45 + r() * 0.55;
      list.push({
        layer,
        x: r() * W,
        y: r() * H,
        size: (layer === 2 ? 11 : 8) * (0.6 + b * 0.7),
        sprite: pickColour(r),
        base: 0.35 + b * 0.55,
        amp: 0.25 + r() * 0.45,
        f1: 0.35 + r() * 1.3,
        f2: 1.7 + r() * 2.6,
        p: r() * Math.PI * 2,
      });
    }
    return list;
  }

  function buildSprites() {
    return PALETTE.map((_, i) => {
      const size = 32;
      const [c, ctx] = makeCanvas(size, size);
      const col = tint(i, 1);
      const m = size / 2;
      const g = ctx.createRadialGradient(m, m, 0, m, m, m);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.07, rgba(col, 0.95));
      g.addColorStop(0.2, rgba(col, 0.22));
      g.addColorStop(0.5, rgba(col, 0.05));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      return c;
    });
  }

  /* ---------- per-frame painting ---------- */

  function offsets(li, y) {
    const L = LAYERS[li];
    return [mod(y * L.drift, W), mod(y * L.speed, H)];
  }

  function paintField(y) {
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, field.width, field.height);
    const tw = field.width, th = field.height;
    tiles.forEach((tile, li) => {
      const [ox, oy] = offsets(li, y);
      /* Whole device pixels only: sub-pixel draws blur the tiny stars. */
      const dx = -Math.round(ox * dpr), dy = -Math.round(oy * dpr);
      fctx.drawImage(tile, dx, dy);
      fctx.drawImage(tile, dx + tw, dy);
      fctx.drawImage(tile, dx, dy + th);
      fctx.drawImage(tile, dx + tw, dy + th);
    });
  }

  function paintLive(t, y) {
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lctx.clearRect(0, 0, W, H);
    const offs = [offsets(0, y), offsets(1, y), offsets(2, y)];

    for (const s of twinklers) {
      const [ox, oy] = offs[s.layer];
      const x = mod(s.x - ox, W), y2 = mod(s.y - oy, H);
      /* Two sine waves at unrelated rates, so no two stars pulse in step. */
      const wave = reduced ? 0 : Math.sin(t * s.f1 + s.p) * 0.7 + Math.sin(t * s.f2 + s.p * 1.7) * 0.3;
      const a = Math.max(0, Math.min(1, s.base * (1 - s.amp * 0.5 + s.amp * 0.5 * wave)));
      lctx.globalAlpha = a;
      lctx.drawImage(sprites[s.sprite], x - s.size / 2, y2 - s.size / 2, s.size, s.size);
    }
    lctx.globalAlpha = 1;

    if (!reduced) paintMeteor(t);
  }

  function paintMeteor(t) {
    if (!meteor) {
      if (!nextMeteor) nextMeteor = t + 6 + Math.random() * 8;
      if (t < nextMeteor) return;
      /* Falls 15 to 35 degrees below horizontal, left or right. */
      const angle = (15 + Math.random() * 20) * (Math.PI / 180);
      const dir = Math.random() < 0.5 ? 1 : -1;
      meteor = {
        x: W * (0.15 + Math.random() * 0.7),
        y: H * (0.05 + Math.random() * 0.35),
        dx: dir * Math.cos(angle),
        dy: Math.sin(angle),
        dist: 260 + Math.random() * 260,
        len: 90 + Math.random() * 110,
        t0: t,
        dur: 0.9 + Math.random() * 0.6,
      };
    }
    const m = meteor;
    const p = (t - m.t0) / m.dur;
    if (p >= 1) { meteor = null; nextMeteor = t + 9 + Math.random() * 14; return; }
    const ease = 1 - Math.pow(1 - p, 2);
    const hx = m.x + m.dx * m.dist * ease, hy = m.y + m.dy * m.dist * ease;
    const tail = m.len * Math.min(1, p * 3);
    const fade = Math.sin(Math.PI * p);
    const g = lctx.createLinearGradient(hx - m.dx * tail, hy - m.dy * tail, hx, hy);
    g.addColorStop(0, 'rgba(239,215,154,0)');
    g.addColorStop(1, `rgba(255,248,232,${(0.75 * fade).toFixed(3)})`);
    lctx.strokeStyle = g;
    lctx.lineWidth = 1.1;
    lctx.lineCap = 'round';
    lctx.beginPath(); lctx.moveTo(hx - m.dx * tail, hy - m.dy * tail); lctx.lineTo(hx, hy); lctx.stroke();
    lctx.globalAlpha = fade;
    lctx.drawImage(sprites[2], hx - 6, hy - 6, 12, 12);
    lctx.globalAlpha = 1;
  }

  /* ---------- lifecycle ---------- */

  function build() {
    const rect = root.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [field, live]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    sprites = buildSprites();
    tiles = LAYERS.map(buildLayer);
    twinklers = buildTwinklers();
    painted = NaN;
    root.classList.add('is-ready');
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const target = window.scrollY;
    /* Ease toward the real scroll position: the sky floats rather than snaps. */
    scroll += (target - scroll) * (1 - Math.exp(-dt * 7));
    if (Math.abs(target - scroll) < 0.1) scroll = target;
    if (scroll !== painted) { paintField(scroll); painted = scroll; }
    paintLive(now / 1000, scroll);
    raf = requestAnimationFrame(frame);
  }

  function paintStatic() {
    paintField(0);
    paintLive(0, 0);
  }

  build();
  if (reduced) paintStatic();
  else raf = requestAnimationFrame(frame);

  let resizeTimer = 0;
  let lastW = W, lastH = H;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const rect = root.getBoundingClientRect();
      /* Ignore mobile URL-bar wobble: only rebuild on a real size change. */
      if (Math.abs(rect.width - lastW) < 2 && Math.abs(rect.height - lastH) < 120) return;
      lastW = rect.width; lastH = rect.height;
      build();
      if (reduced) paintStatic();
    }, 160);
  });

  document.addEventListener('visibilitychange', () => {
    if (reduced) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
}
