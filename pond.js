// The pond: tap the water to send a ripple. Where two ripples cross on a bud, it blooms.
// A bloom sends out a bright ring that opens close neighbours too. Same rules as the app.
(function () {
  const canvas = document.getElementById('pond');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SPEED = 230, WINDOW = 0.42, MIN_ANGLE = 0.62, REACH = 135;
  // The X-ray specimens, and the pond's five colours dealt round them
  const kinds = [1, 6, 12, 10, 14, 5];
  const blooms = kinds.map(k => 'img/XrayBloom' + k + '.png');
  const buds = kinds.map(k => 'img/XrayBud' + k + '.png');
  const colours = ['#3DF2F2', '#3DB8FF', '#4DFFB8', '#3E6BFF', '#C9A6FF', '#FF5FA2'];
  const palette = c => [c, '#FFFFFF', mixHex(c, '#FFFFFF', 0.5), mixHex(c, '#000000', 0.3), '#7CF2D8'];
  const img = {};
  for (const src of blooms.concat(buds)) { const i = new Image(); i.src = src; img[src] = i; }
  function mixHex(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  const chainEl = document.getElementById('chain'), codeEl = document.getElementById('code');
  let chain = 0, chainAt = -10;

  let W = 0, H = 0, unit = 1, dpr = 1;
  let orbs = [], rings = [], petals = [], clock = 0, last = performance.now(), idle = 0, idleTap = 0;
  let running = true;
  const sprites = {};   // pre-scaled flowers, glow and tinted petals, rebuilt on resize

  function sprite(key, w, h, paint) {
    const k = key + '|' + Math.round(w) + 'x' + Math.round(h);
    if (sprites[k]) return sprites[k];
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    paint(g, w, h);
    sprites[k] = c;
    return c;
  }

  function flowerSprite(src, size, tint) {
    const im = img[src];
    if (!im.complete || !im.naturalWidth) return null;
    return sprite(src + tint, size, size, (g, w, h) => {
      g.drawImage(im, 0, 0, w, h);
      if (tint) {
        // A light wash in the flower's own colour, never flooded, so the radiograph still reads
        g.globalCompositeOperation = 'multiply';
        g.fillStyle = mixHex('#FFFFFF', tint, 0.45); g.fillRect(0, 0, w, h);
        g.globalCompositeOperation = 'destination-in';
        g.drawImage(im, 0, 0, w, h);
      }
    });
  }

  function glowSprite(colour, r) {
    return sprite('glow' + colour, r * 2, r * 2, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, r * 0.12, w / 2, h / 2, r);
      gr.addColorStop(0, colour + '66'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
  }

  function resize() {
    for (const k in sprites) delete sprites[k];
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(W < 700 ? 1.5 : 1.25, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    unit = Math.min(W, H) / 420;
    if (W < 600) unit *= 1.5;
    if (!orbs.length) seed();
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function seed() {
    orbs = [];
    const n = W < 600 ? 7 : 11;
    let tries = 0;
    while (orbs.length < n && tries++ < 2000) {
      const x = rnd(W * 0.12, W * 0.88), y = rnd(H * 0.12, W < 600 ? H * 0.52 : H * 0.8);
      if (orbs.some(o => Math.hypot(o.x - x, o.y - y) < 90 * unit)) continue;
      orbs.push(makeOrb(x, y));
    }
  }

  function makeOrb(x, y) {
    const k = Math.floor(Math.random() * blooms.length);
    return { x, y, r: 15 * unit, k, hits: [], alive: true, pop: 0, seed: rnd(0, 6.28), born: clock, glow: 0, scale: 1, sv: 0 };
  }

  function addRing(x, y, source, reach, strength, r0) {
    if (rings.length > 24) rings.shift();
    rings.push({ x, y, r: r0 || 0, prev: r0 || 0, max: Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 20, source, reach: reach || 0, strength: strength || 1 });
  }

  function tap(x, y) {
    idle = 0;
    for (let i = 0; i < 6; i++) petals.push({ x, y, vx: rnd(-80, 80) * unit, vy: rnd(-80, 80) * unit, life: 0.6, size: 1.6 * unit, glint: true });
    addRing(x, y, null, 0, 1, 0);
  }

  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect();
    tap(e.clientX - r.left, e.clientY - r.top);
  });

  function ready(o) {
    const bright = o.hits.filter(h => h.w === 2).length * 2;
    if (bright >= 2) return true;
    const plain = o.hits.filter(h => h.w === 1).map(h => h.a);
    const need = 2 - bright;
    if (plain.length < need) return false;
    if (need <= 1) return true;
    for (let i = 0; i < plain.length; i++) for (let j = i + 1; j < plain.length; j++) {
      let d = Math.abs(plain[i] - plain[j]) % (Math.PI * 2);
      if (d > Math.PI) d = Math.PI * 2 - d;
      if (d >= MIN_ANGLE) return true;
    }
    return false;
  }

  function burst(o) {
    o.alive = false; o.pop = 1;
    addRing(o.x, o.y, o, REACH * unit, 1.25, o.r);
    chain = clock - chainAt < 1.2 ? chain + 1 : 1; chainAt = clock;
    if (chainEl) chainEl.textContent = String(chain).padStart(2, '0');
    // The glitch burst: a streak torn across its row, and blocks flung mostly sideways, in the flower's colours
    const pal = palette(colours[o.k]), size = o.r * 2.6;
    const style = o.k % 5;
    petals.push({ x: o.x - size, y: o.y, w: size * 2, h: 4 * unit, life: 0.45, stripes: true, pal, seed: o.seed, vx: 0, vy: 0 });
    const n = 10 + Math.floor(rnd(0, 8));
    for (let i = 0; i < n; i++) {
      const a = style === 2 ? i / n * 6.283 : rnd(0, 6.28);
      const squash = style === 1 ? 0.3 : 0.45 + 0.55 * Math.abs(Math.cos(a));
      const s = rnd(120, 360) * unit * squash;
      const tall = style === 1;
      petals.push({ x: o.x, y: o.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * (tall ? 1.4 : 0.7) + (tall ? 60 * unit : 0), life: rnd(0.5, 0.8),
                    w: (tall ? rnd(2, 4) : rnd(4, 26)) * unit, h: (tall ? rnd(8, 24) : rnd(2, 8)) * unit, colour: pal[Math.floor(rnd(0, pal.length))] });
    }
    setTimeout(() => {
      // A new bud drifts in where there is room
      for (let t = 0; t < 60; t++) {
        const x = rnd(W * 0.12, W * 0.88), y = rnd(H * 0.12, W < 600 ? H * 0.52 : H * 0.8);
        if (orbs.some(p => p.alive && Math.hypot(p.x - x, p.y - y) < 90 * unit)) continue;
        orbs.push(makeOrb(x, y));
        break;
      }
    }, rnd(2500, 5000));
  }

  // When nobody is tapping, the pond plays itself: two taps either side of a bud
  function demo() {
    const alive = orbs.filter(o => o.alive);
    if (!alive.length) return;
    const o = alive[Math.floor(Math.random() * alive.length)];
    const a = rnd(0, 6.28), d = rnd(90, 150) * unit;
    const x1 = o.x + Math.cos(a) * d, y1 = o.y + Math.sin(a) * d;
    const x2 = o.x - Math.cos(a) * d, y2 = o.y - Math.sin(a) * d;
    tap(Math.max(10, Math.min(W - 10, x1)), Math.max(10, Math.min(H - 10, y1)));
    tap(Math.max(10, Math.min(W - 10, x2)), Math.max(10, Math.min(H - 10, y2)));
    idle = 0;
  }

  function step(now) {
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (reduce) dt *= 0.6;
    clock += dt; idle += dt;
    if (codeEl && Math.floor(clock * 4) !== Math.floor((clock - dt) * 4)) codeEl.textContent = '01  ' + (5790 + Math.floor(clock * 4) % 7) + '  8782+33';
    if (idle > (idleTap === 0 ? 1.2 : rnd(2.2, 3.4))) { demo(); idleTap++; }

    const bursts = [];
    for (const ring of rings) {
      ring.prev = ring.r; ring.r += SPEED * unit * dt;
      for (const o of orbs) {
        if (!o.alive || o === ring.source) continue;
        const d = Math.hypot(o.x - ring.x, o.y - ring.y);
        if (d < o.r * 0.6 || !(ring.prev <= d && ring.r > d)) continue;
        const w = ring.reach > 0 && d <= ring.reach ? 2 : 1;
        o.hits.push({ t: clock, a: Math.atan2(ring.y - o.y, ring.x - o.x), w });
        o.hits = o.hits.filter(h => clock - h.t < WINDOW);
        o.glow = 1; o.sv += w === 2 ? 3 : 2;
        if (ready(o)) { o.alive = false; bursts.push(o); }
      }
    }
    rings = rings.filter(r => r.r < r.max);
    for (const o of bursts) burst(o);
    orbs = orbs.filter(o => o.alive || o.pop > 0);
    for (const o of orbs) {
      o.glow = Math.max(0, o.glow - dt * 1.4);
      o.sv += (-170 * (o.scale - 1) - 11 * o.sv) * dt; o.scale += o.sv * dt;
      if (o.pop > 0) o.pop -= dt * 0.6;
    }
    for (const p of petals) {
      const drag = Math.pow(p.glint ? 0.02 : 0.004, dt);
      p.vx *= drag; p.vy *= drag;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt * (p.glint ? 2 : (p.stripes ? 2.2 : 1.4));
    }
    petals = petals.filter(p => p.life > 0);
    if (petals.length > 160) petals.splice(0, petals.length - 160);
    draw();
    if (running) requestAnimationFrame(step);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0A0C0F'; ctx.fillRect(0, 0, W, H);

    // Rings as scans: a fine line, the bright ones in the flower's colour with a tick ring
    for (const ring of rings) {
      const life = Math.max(0, 1 - ring.r / ring.max);
      const bright = ring.reach > 0 && ring.r < ring.reach;
      const a = Math.min(1, life * 1.4) * ring.strength;
      ctx.strokeStyle = ring.source ? colours[ring.source.k] : '#E8EEF2';
      ctx.globalAlpha = (bright ? 0.7 : 0.28) * a;
      ctx.lineWidth = (bright ? 1.2 : 0.8) * unit;
      ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, 6.283); ctx.stroke();
      if (bright) {
        ctx.globalAlpha = 0.45 * a; ctx.lineWidth = 0.8 * unit;
        ctx.beginPath();
        for (let i = 0; i < 72; i++) {
          const t = i / 72 * 6.283 + ring.source.seed, l = (i % 5 === 0 ? 6 : 3.5) * unit;
          ctx.moveTo(ring.x + Math.cos(t) * ring.r, ring.y + Math.sin(t) * ring.r);
          ctx.lineTo(ring.x + Math.cos(t) * (ring.r - l), ring.y + Math.sin(t) * (ring.r - l));
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // The glitch: blocks and torn stripes, and the dots a tap throws
    for (const p of petals) {
      ctx.globalAlpha = Math.min(1, p.life * 1.6);
      if (p.glint) {
        ctx.fillStyle = '#E8EEF2';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill();
      } else if (p.stripes) {
        // A pixel-sorted row: thin vertical slices in the palette
        let x = p.x, i = 0;
        while (x < p.x + p.w) {
          const sw = (2 + 4 * Math.abs(Math.sin(p.seed * 7 + i * 1.7))) * unit;
          ctx.fillStyle = p.pal[(i * 3 + Math.floor(p.seed * 10)) % p.pal.length];
          ctx.fillRect(x, p.y, sw, p.h);
          x += sw; i++;
        }
      } else {
        ctx.fillStyle = p.colour;
        ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
      }
    }
    ctx.globalAlpha = 1;

    // Flowers
    for (const o of orbs) {
      const size = o.r * 2.6;
      if (!o.alive) {
        const open = 1 - Math.max(0, o.pop);
        const s = size * (0.9 + 0.6 * Math.min(1, open * 2.2));
        const sp = flowerSprite(blooms[o.k], Math.round(size * 1.5), colours[o.k]);
        if (!sp) continue;
        ctx.save(); ctx.globalAlpha = Math.min(1, o.pop * 1.7); ctx.globalCompositeOperation = 'lighter';
        ctx.translate(o.x, o.y); ctx.rotate(o.seed + open * 0.25);
        // Out of register for the first instant: pink one way, cyan the other
        if (o.pop > 0.7) {
          const k = (o.pop - 0.7) / 0.3 * 6 * unit;
          ctx.globalAlpha *= 0.5; ctx.drawImage(sp, -s / 2 - k, -s / 2, s, s); ctx.drawImage(sp, -s / 2 + k, -s / 2, s, s);
          ctx.globalAlpha = Math.min(1, o.pop * 1.7);
        }
        ctx.drawImage(sp, -s / 2, -s / 2, s, s); ctx.restore();
        continue;
      }
      const t = Math.min(1, (clock - o.born) / 0.45);
      const appear = 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
      const breathe = 1 + Math.sin(clock * 1.4 + o.seed) * 0.025;
      const bob = Math.sin(clock * 0.6 + o.seed) * 3 * unit;
      const gr = o.r * (1.8 + 1.8 * o.glow);
      const gs = glowSprite(colours[o.k], Math.round(o.r * 3.6));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.25 + 0.75 * o.glow;
      ctx.drawImage(gs, o.x - gr, o.y + bob - gr, gr * 2, gr * 2);
      ctx.restore();
      const sp = flowerSprite(buds[o.k], Math.round(size), colours[o.k]);
      if (!sp) continue;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(o.x, o.y + bob);
      ctx.scale(appear * breathe * (2 - o.scale), appear * breathe * o.scale);
      ctx.rotate(o.seed + Math.sin(clock * 0.3 + o.seed) * 0.12);
      ctx.drawImage(sp, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  resize();
  window.addEventListener('resize', resize);

  function setRunning(on) {
    if (on && !running) { running = true; last = performance.now(); requestAnimationFrame(step); }
    else if (!on) running = false;
  }
  new IntersectionObserver(entries => setRunning(entries[0].isIntersecting && !document.hidden), { threshold: 0.05 }).observe(canvas);
  document.addEventListener('visibilitychange', () => setRunning(!document.hidden && canvas.getBoundingClientRect().bottom > 0));
  requestAnimationFrame(step);
})();
