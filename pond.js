// The pond: tap the water to send a ripple. Where two ripples cross on a bud, it blooms.
// A bloom sends out a bright ring that opens close neighbours too. Same rules as the app.
(function () {
  const canvas = document.getElementById('pond');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SPEED = 230, WINDOW = 0.42, MIN_ANGLE = 0.62, REACH = 135;
  const blooms = ['img/Bloom0.png', 'img/Bloom1.png', 'img/Bloom2.png', 'img/BloomLotus.png', 'img/BloomClematis.png', 'img/BloomDahlia.png'];
  const buds = ['img/Bud0.png', 'img/Bud1.png', 'img/Bud2.png', 'img/BudLotus.png', 'img/Bud2.png', 'img/Bud1.png'];
  const hues = [340, 8, 262, 335, 250, 345];
  const img = {};
  for (const src of blooms.concat(buds, ['img/Petal.png'])) { const i = new Image(); i.src = src; img[src] = i; }

  let W = 0, H = 0, unit = 1, dpr = 1;
  let orbs = [], rings = [], petals = [], clock = 0, last = performance.now(), idle = 0, idleTap = 0;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
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
    rings.push({ x, y, r: r0 || 0, prev: r0 || 0, max: Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 20, source, reach: reach || 0, strength: strength || 1 });
  }

  function tap(x, y) {
    idle = 0;
    for (let i = 0; i < 7; i++) petals.push({ x, y, vx: rnd(-80, 80) * unit, vy: rnd(-80, 80) * unit, life: 0.6, size: 2 * unit, glint: true });
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
    for (let i = 0; i < 12; i++) {
      const a = rnd(0, 6.28), s = rnd(90, 240) * unit;
      petals.push({ x: o.x, y: o.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, rot: a, spin: rnd(-4, 4), hue: hues[o.k], size: rnd(8, 13) * unit });
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
      if (p.rot !== undefined) p.rot += p.spin * dt * 0.4;
      p.life -= dt * (p.glint ? 2 : 0.3);
    }
    petals = petals.filter(p => p.life > 0);
    draw();
    requestAnimationFrame(step);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    // Rings
    ctx.globalCompositeOperation = 'lighter';
    for (const ring of rings) {
      const life = Math.max(0, 1 - ring.r / ring.max);
      const bright = ring.reach > 0 && ring.r < ring.reach;
      const a = life * life * 0.55 * ring.strength * (bright ? 1.7 : 1);
      const hue = ring.source ? hues[ring.source.k] : 110;
      const sat = ring.source ? 45 : 8;
      ctx.lineWidth = (bright ? 12 : 8) * unit; ctx.strokeStyle = `hsla(${hue},${sat}%,85%,${a * 0.12})`;
      ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, 6.283); ctx.stroke();
      ctx.lineWidth = (bright ? 2 : 1.3) * unit; ctx.strokeStyle = `hsla(${hue},${sat}%,90%,${a})`;
      ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, 6.283); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Petals on the water
    const petal = img['img/Petal.png'];
    for (const p of petals) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 1.6);
      ctx.translate(p.x, p.y);
      if (p.glint) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'hsla(46,70%,80%,0.9)';
        ctx.beginPath(); ctx.arc(0, 0, p.size, 0, 6.283); ctx.fill();
      } else if (petal.complete && petal.naturalWidth) {
        ctx.rotate(p.rot);
        const w = p.size * 1.6, h = w * (petal.naturalHeight / petal.naturalWidth);
        ctx.filter = `hue-rotate(${p.hue - 340}deg)`;
        ctx.drawImage(petal, -w / 2, -h / 2, w, h);
      }
      ctx.restore();
    }

    // Flowers
    for (const o of orbs) {
      const size = o.r * 2.6;
      if (!o.alive) {
        const open = 1 - Math.max(0, o.pop);
        const s = size * (0.9 + 0.6 * Math.min(1, open * 2.2));
        const im = img[blooms[o.k]];
        if (!im.complete) continue;
        ctx.save(); ctx.globalAlpha = Math.min(1, o.pop * 1.7);
        ctx.translate(o.x, o.y); ctx.rotate(o.seed + open * 0.25);
        ctx.drawImage(im, -s / 2, -s / 2, s, s); ctx.restore();
        continue;
      }
      const t = Math.min(1, (clock - o.born) / 0.45);
      const appear = 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
      const breathe = 1 + Math.sin(clock * 1.4 + o.seed) * 0.025;
      const bob = Math.sin(clock * 0.6 + o.seed) * 3 * unit;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(o.x, o.y + bob, o.r * 0.4, o.x, o.y + bob, o.r * (1.8 + 1.8 * o.glow));
      g.addColorStop(0, `hsla(${hues[o.k]},45%,80%,${0.1 + 0.35 * o.glow})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y + bob, o.r * 3.6, 0, 6.283); ctx.fill();
      ctx.restore();
      const im = img[buds[o.k]];
      if (!im.complete) continue;
      ctx.save();
      ctx.translate(o.x, o.y + bob);
      ctx.scale(appear * breathe * (2 - o.scale), appear * breathe * o.scale);
      ctx.rotate(o.seed + Math.sin(clock * 0.3 + o.seed) * 0.12);
      ctx.drawImage(im, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(step);
})();
