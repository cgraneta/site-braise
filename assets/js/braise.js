/* BRAISE — V76 · script unique (toutes les pages)
   Modules : préférences d'animation · images · en-tête et défilement ·
   défilement fluide et ancres · menu mobile · logo flamme · révélations
   et rideaux · boutons magnétiques · carrousel Événements · visionneuse ·
   moteur de gravure (simulation, « Merci », 404) · formulaire ·
   bouton devis mobile · FAQ */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smoothstep = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const root = document.documentElement;
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const finePointer = () => matchMedia('(pointer:fine)').matches;
  const isMobile = () => matchMedia('(max-width:760px)').matches;

  /* --- Préférences d'animation --------------------------------------- */
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  let userOff = false;
  try { userOff = localStorage.getItem('braise-motion') === 'off'; } catch (e) {}
  const reduced = () => mq.matches || userOff;
  const motionHooks = [];
  function applyMotion() {
    root.classList.toggle('motion', !reduced());
    $$('.motion-toggle').forEach(t => {
      t.setAttribute('aria-pressed', String(reduced()));
      t.textContent = reduced() ? 'Réactiver les animations' : 'Réduire les animations';
    });
    motionHooks.forEach(fn => fn());
  }
  $$('.motion-toggle').forEach(t => t.addEventListener('click', () => {
    userOff = !userOff;
    try { localStorage.setItem('braise-motion', userOff ? 'off' : 'on'); } catch (e) {}
    applyMotion();
  }));
  mq.addEventListener('change', applyMotion);

  /* --- Images : fondu depuis l'aperçu flou ----------------------------- */
  $$('.media img').forEach(img => {
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  });

  /* --- En-tête, progression, section active ---------------------------- */
  const header = $('.site-header');
  const bar = $('.progress');
  const spyLinks = $$('.nav a[href*="#"], .rail a');
  const spyEls = [...new Set(spyLinks.map(a => a.hash))].map(h => document.getElementById(h.slice(1))).filter(Boolean)
    .sort((a, b) => a.offsetTop - b.offsetTop);
  const scrollHooks = [];
  let ticking = false;
  function onScroll() {
    ticking = false;
    header && header.classList.toggle('is-scrolled', scrollY > 40);
    if (bar) {
      const max = root.scrollHeight - innerHeight;
      bar.style.setProperty('--progress', max > 0 ? clamp(scrollY / max).toFixed(4) : 0);
    }
    if (spyEls.length) {
      const line = (header ? header.offsetHeight : 0) + innerHeight * 0.3;
      let current = spyEls[0].id;
      spyEls.forEach(el => { if (el.getBoundingClientRect().top <= line) current = el.id; });
      spyLinks.forEach(a => {
        if (a.hash === '#' + current) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }
    scrollHooks.forEach(fn => fn());
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* V75 : défilement natif, sans interception de la molette. */
  const smooth = { to(y) { scrollTo({top: Math.max(0,y), behavior: reduced() ? 'auto' : 'smooth'}); } };
  let scrollIdle;
  addEventListener('scroll', () => { root.classList.add('is-scrolling'); clearTimeout(scrollIdle); scrollIdle=setTimeout(()=>root.classList.remove('is-scrolling'),180); }, {passive:true});
  // Ancres internes : défilement doux et mise au point accessible
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    const el = document.getElementById(url.hash.slice(1));
    if (!el) return;
    e.preventDefault();
    const y = el.id === 'accueil' ? 0 : el.getBoundingClientRect().top + scrollY - (header ? header.offsetHeight : 0);
    smooth.to(y);
    try { history.pushState(null, '', url.hash); } catch (_) {}
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  });

  /* --- Menu mobile ----------------------------------------------------- */
  const menu = $('.menu-toggle');
  const nav = $('#site-nav');
  if (menu && nav) {
    const setMenu = open => {
      nav.classList.toggle('is-open', open);
      menu.setAttribute('aria-expanded', String(open));
      $('.menu-label', menu).textContent = open ? 'Fermer' : 'Menu';
    };
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
    });
    document.addEventListener('pointerdown', e => {
      if (menu.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !menu.contains(e.target)) setMenu(false);
    });
  }

  /* --- Logo : la flamme s'allume au survol ------------------------------ */
  (() => {
    const logo = $('.site-header .brand');
    if (!logo) return;
    const paths = $$('.flame-fire path', logo);
    let frame = 0;
    function draw(ms) {
      frame = 0;
      const t = ms / 1000, n = v => v.toFixed(2);
      const wave = (a, b, c) => Math.sin(t * a) + 0.45 * Math.sin(t * b + c);
      const lean = wave(4.1, 8.7, 2) * 24, height = 98 + wave(5.2, 11.3, 1) * 21, width = 25 + wave(4.6, 11.8, 3) * 7;
      paths.forEach((p, i) => {
        const s = i ? 0.57 : 1, H = height * s, B = width * s, A = lean * s, x = 456, y = 110 - i * 5;
        p.setAttribute('d', `M${x} ${y} C${n(x - B)} ${n(y - 3)} ${n(x - B * 1.25)} ${n(y - H * .24)} ${n(x - B * .65 + A * .2)} ${n(y - H * .49)} C${n(x + A * .7 - 8 * s)} ${n(y - H * .73)} ${n(x + A + 7 * s)} ${n(y - H * .85)} ${n(x + A)} ${n(y - H)} C${n(x + A + 19 * s)} ${n(y - H * .74)} ${n(x + B + A * .4)} ${n(y - H * .53)} ${n(x + B * .82)} ${n(y - H * .28)} Q${n(x + B * .8)} ${n(y - 5)} ${x} ${y}Z`);
      });
      if (logo.classList.contains('is-lit') && !document.hidden && !reduced()) frame = requestAnimationFrame(draw);
    }
    const sync = () => { if (frame) { cancelAnimationFrame(frame); frame = 0; } if (logo.classList.contains('is-lit')) draw(performance.now()); };
    const set = v => { logo.classList.toggle('is-lit', v); sync(); };
    logo.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') set(true); });
    logo.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') set(false); });
    logo.addEventListener('focus', () => set(true));
    logo.addEventListener('blur', () => set(false));
    document.addEventListener('visibilitychange', sync);
    motionHooks.push(sync);
  })();

  /* --- Révélations et rideaux d'image ---------------------------------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal, .curtain').forEach(el => io.observe(el));

  /* --- Boutons magnétiques (desktop) ----------------------------------- */
  $$('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || reduced()) return;
      const r = b.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      b.style.setProperty('--mx', (clamp(x, -1, 1) * 7).toFixed(2) + 'px');
      b.style.setProperty('--my', (clamp(y, -1, 1) * 5).toFixed(2) + 'px');
    });
    b.addEventListener('pointerleave', () => { b.style.removeProperty('--mx'); b.style.removeProperty('--my'); });
  });

  /* --- Carrousel Événements : piloté par le défilement ----------------- */
  (() => {
    const ev = $('#evenements');
    if (!ev) return;
    const sticky = $('.events-sticky', ev), stage = $('.tiles', ev), tiles = $$('.tile', stage), dots = $$('.events-progress button', ev);
    let on = null, angle = 0, raf = 0, last = 0;
    const range = () => Math.max(1, ev.offsetHeight - sticky.offsetHeight);
    function mode() {
      const next = !reduced() && innerWidth > 760 && innerHeight >= 620 && finePointer();
      if (next === on) return;
      on = next;
      ev.classList.toggle('is-orbit', on);
      if (!on) tiles.forEach(t => { t.removeAttribute('style'); t.classList.remove('is-front'); t.removeAttribute('aria-hidden'); t.inert=false; });
      kick();
    }
    function kick() { if (on && !raf) raf = requestAnimationFrame(paint); }
    function paint(t) {
      raf = 0;
      if (!on) return;
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const p = clamp((top - ev.getBoundingClientRect().top) / range());
      const q = p * 3, step = Math.min(2, Math.floor(q));
      const f = step === 2 ? 0 : clamp((q - step - 0.4) / 0.5);
      const target = -120 * (step + smoothstep(f));
      const dt = last ? Math.min(50, t - last) : 16;
      last = t;
      angle += (target - angle) * (1 - Math.exp(-dt / 140));
      if (Math.abs(target - angle) < 0.08) angle = target;
      const W = stage.clientWidth;
      let front = 0;
      tiles.forEach((tile, i) => {
        const a = (angle + i * 120) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), alpha = smoothstep((c + 0.12) / 1.12);
        tile.style.setProperty('--ox', (s * W * 0.83).toFixed(1) + 'px');
        tile.style.setProperty('--oy', (-s * 42).toFixed(2) + 'deg');
        tile.style.setProperty('--os', (0.78 + 0.22 * Math.max(0, c)).toFixed(4));
        tile.style.setProperty('--oa', alpha.toFixed(4));
        tile.style.setProperty('--ov', alpha > 0 ? 'visible' : 'hidden');
        const isFront = alpha > 0.6;
        tile.classList.toggle('is-front', isFront);
        tile.setAttribute('aria-hidden', String(!isFront));
        tile.inert = !isFront;
        if (isFront) { front = i; $$('.curtain', tile).forEach(c => c.classList.add('is-in')); }
      });
      dots.forEach((d, i) => { d.classList.toggle('on', i === front); d.setAttribute('aria-pressed', String(i === front)); });
      if (angle !== target) kick(); else last = 0;
    }
    tiles.forEach((tile, i) => tile.addEventListener('focusin', () => {
      if (!on || tile.classList.contains('is-front')) return;
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      scrollTo({ top: ev.getBoundingClientRect().top + scrollY - top + range() * (i + 0.1) / 3, behavior: 'instant' });
    }));
    dots.forEach((d,i) => d.addEventListener('click', () => { if (!on) return; const top = parseFloat(getComputedStyle(sticky).top) || 0; smooth.to(ev.getBoundingClientRect().top + scrollY - top + range() * (i + .12) / 3); }));
    scrollHooks.push(kick);
    motionHooks.push(mode);
    addEventListener('resize', () => { mode(); kick(); });
  })();

  /* --- Visionneuse : agrandissement depuis la vignette ------------------ */
  (() => {
    const dlg = $('.lightbox');
    const frames = $$('.frame');
    if (!dlg || !frames.length) return;
    const stage = $('.lb-stage', dlg), big = $('img', stage);
    let index = 0, opener = null, busy = false, closePending = false;
    const srcOf = f => { const im = $('img', f); return im.currentSrc || im.src; };
    function fill(i) {
      index = (i + frames.length) % frames.length;
      const f = frames[index], im = $('img', f), fig = f.closest('figure');
      big.src = im.src; big.alt = im.alt;
      $('.lb-title', dlg).textContent = $('figcaption strong', fig).textContent;
      $('.lb-cat', dlg).textContent = $('figcaption small', fig).textContent;
      $('.lb-detail', dlg).textContent = fig.dataset.detail || '';
      $('.lb-count', dlg).textContent = String(index + 1).padStart(2, '0') + ' / ' + String(frames.length).padStart(2, '0');
    }
    function fitted() { // rectangle réellement occupé par l'image « contain »
      const r = stage.getBoundingClientRect(), iw = big.naturalWidth || 4, ih = big.naturalHeight || 5;
      const k = Math.min(r.width / iw, r.height / ih), w = iw * k, h = ih * k;
      return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
    }
    function fly(from, to, src) {
      const clone = document.createElement('img');
      clone.className = 'lb-flight'; clone.src = src; clone.alt = '';
      clone.style.objectFit = 'cover';
      dlg.append(clone); dlg.classList.add('is-flying');
      const kf = r => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      const anim = clone.animate([kf(from), kf(to)], { duration: 650, easing: EASE, fill: 'forwards' });
      return anim.finished.catch(() => {}).then(() => { clone.remove(); dlg.classList.remove('is-flying'); });
    }
    async function open(i, f) {
      if (dlg.open) return;
      closePending = false; opener = f; fill(i);
      dlg.showModal();
      $('[data-close]', dlg).focus({preventScroll:true});
      if (reduced()) return;
      busy = true;
      if (!big.complete) await Promise.race([big.decode().catch(()=>{}),new Promise(r=>setTimeout(r,1200))]);
      await fly($('img', f).closest('.media').getBoundingClientRect(), fitted(), big.src);
      busy = false;
      if (closePending) close();
    }
    async function close() {
      if (busy) { closePending = true; return; }
      if (!dlg.open) return;
      closePending = false;
      const f = frames[index], thumb = $('img', f).closest('.media').getBoundingClientRect();
      const visible = thumb.bottom > 0 && thumb.top < innerHeight;
      if (!reduced() && visible && f === opener) {
        busy = true;
        $$(':scope > :not(.lb-flight)', dlg).forEach(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }));
        await fly(fitted(), thumb, big.src);
        busy = false;
      }
      dlg.close();
      $$(':scope > *', dlg).forEach(el => el.getAnimations().forEach(a => a.cancel()));
    }
    function go(dir) {
      if (busy) return;
      const old = big.cloneNode();
      fill(index + dir);
      if (reduced()) return;
      old.removeAttribute('class'); old.alt = ''; old.setAttribute('aria-hidden','true');
      stage.append(old);
      old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 48}px)` }], { duration: 600, easing: EASE, fill: 'forwards' })
        .finished.catch(() => {}).then(() => old.remove());
      big.animate([{ opacity: 0, transform: `translateX(${dir * 48}px)` }, { opacity: 1, transform: 'none' }], { duration: 700, easing: EASE });
      $('.lb-text', dlg).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: EASE });
    }
    frames.forEach((f, i) => f.addEventListener('click', () => open(i, f)));
    $('[data-close]', dlg).addEventListener('click', close);
    $('[data-prev]', dlg).addEventListener('click', () => go(-1));
    $('[data-next]', dlg).addEventListener('click', () => go(1));
    dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
    dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => opener && opener.focus({ preventScroll: true }));
    let touch = null;
    dlg.addEventListener('touchstart', e => { if (e.touches.length === 1) touch = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
    dlg.addEventListener('touchend', e => {
      if (!touch) return;
      const x = e.changedTouches[0].clientX - touch[0], y = e.changedTouches[0].clientY - touch[1];
      touch = null;
      if (Math.abs(x) > 55 && Math.abs(x) > Math.abs(y) * 1.5) go(x < 0 ? 1 : -1);
    }, { passive: true });
  })();

  /* --- Moteur de gravure (canvas) --------------------------------------- */
  function engrave(canvas, text, { animate = true, font = 'Marcellus, Georgia, serif', weight = '', onStatus = () => {} } = {}) {
    const state = engrave.tokens.get(canvas) || 0;
    const id = state + 1; engrave.tokens.set(canvas, id);
    const c = canvas.getContext('2d');
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 160, d = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * d; canvas.height = h * d;
    c.setTransform(d, 0, 0, d, 0, 0);
    const mask = document.createElement('canvas');
    mask.width = Math.round(w); mask.height = Math.round(h);
    const m = mask.getContext('2d');
    let size = Math.min(84, h * 0.46);
    const setFont = () => { m.font = `${weight} ${size}px ${font}`; };
    setFont();
    while (m.measureText(text).width > w * 0.84 && size > 10) { size--; setFont(); }
    m.textAlign = 'center'; m.textBaseline = 'middle';
    m.fillStyle = '#472812'; m.shadowColor = '#704019'; m.shadowBlur = 1;
    m.fillText(text, w / 2, h / 2);
    const pix = m.getImageData(0, 0, mask.width, mask.height).data, rows = [];
    for (let y = 0; y < mask.height; y += 2) {
      let lo = mask.width, hi = -1;
      for (let x = 0; x < mask.width; x++) if (pix[(y * mask.width + x) * 4 + 3] > 30) { lo = Math.min(lo, x); hi = x; }
      if (hi >= lo) rows.push({ y, lo, hi });
    }
    if (!animate || reduced() || !rows.length) {
      c.clearRect(0, 0, w, h); c.drawImage(mask, 0, 0);
      onStatus('done');
      return;
    }
    const start = performance.now(), duration = Math.min(4200, Math.max(1800, text.length * 180 + 1200));
    onStatus('busy');
    (function frame(now) {
      if (engrave.tokens.get(canvas) !== id) return;
      const p = clamp((now - start) / duration), q = p * rows.length, i = Math.min(rows.length - 1, Math.floor(q)), r = rows[i], f = q - i;
      const x = i % 2 ? r.hi - (r.hi - r.lo) * f : r.lo + (r.hi - r.lo) * f;
      c.clearRect(0, 0, w, h);
      if (r.y > 0) c.drawImage(mask, 0, 0, mask.width, r.y, 0, 0, mask.width, r.y);
      const a = i % 2 ? x : r.lo, b = i % 2 ? r.hi : x;
      if (b > a) c.drawImage(mask, a, r.y, b - a, 2, a, r.y, b - a, 2);
      if (p < 1) {
        c.save();
        const beam = c.createLinearGradient(x, 0, x, r.y);
        beam.addColorStop(0, '#ff5b2311'); beam.addColorStop(1, '#ff6439dd');
        c.strokeStyle = beam; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(x - 19, 0); c.lineTo(x, r.y); c.stroke();
        c.shadowColor = '#ff561b'; c.shadowBlur = 12; c.fillStyle = '#fff2bb';
        c.beginPath(); c.arc(x, r.y, 1.3, 0, Math.PI * 2); c.fill();
        c.restore();
        requestAnimationFrame(frame);
      } else {
        c.clearRect(0, 0, w, h); c.drawImage(mask, 0, 0);
        onStatus('done');
      }
    })(start);
  }
  engrave.tokens = new WeakMap();

  // Simulation
  (() => {
    const input = $('#engrave-name'), button = $('.engrave-start'), canvas = $('.engrave-board canvas'), status = $('.engrave-status');
    if (!input || !canvas) return;
    const run = animate => engrave(canvas, input.value.trim() || 'Votre prénom', {
      animate,
      onStatus: s => {
        status.textContent = s === 'busy' ? 'Gravure en cours…' : animate ? 'Gravure terminée.' : 'Aperçu de votre inscription.';
        button.setAttribute('aria-busy', String(s === 'busy'));
        button.textContent = s === 'busy' ? 'Recommencer la gravure' : 'Graver mon prénom';
      }
    });
    button.addEventListener('click', () => run(true));
    input.addEventListener('input', () => run(false));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); run(true); } });
    let lw = canvas.clientWidth, lh = canvas.clientHeight;
    new ResizeObserver(() => { if (canvas.clientWidth !== lw || canvas.clientHeight !== lh) { lw = canvas.clientWidth; lh = canvas.clientHeight; run(false); } }).observe(canvas);
    document.fonts && document.fonts.ready.then(() => run(false));
    run(false);
  })();

  // Page 404 : « 404 » se grave à l'arrivée
  (() => {
    const canvas = $('.lost-board canvas');
    if (!canvas) return;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => engrave(canvas, '404'));
  })();

  /* --- Formulaire : validation en direct, Turnstile, envoi, « Merci » -- */
  (() => {
    const form = $('#braiseEventForm');
    if (!form) return;
    const API_URL = 'https://braise-form-api.c-granet.workers.dev/';
    const status = $('#braiseFormStatus');
    const submit = $('button[type="submit"]', form);
    const select = $('#bEvent');
    $$('[data-event]').forEach(a => a.addEventListener('click', () => { select.value = a.dataset.event; check(select, true); }));

    // Validation
    const rules = {
      bEvent: v => v ? '' : 'Choisissez un type d’événement.',
      bName: v => v.trim().length >= 2 ? '' : 'Indiquez votre nom ou celui de votre société.',
      bEmail: v => !v.trim() ? 'Indiquez votre adresse e-mail.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Cette adresse e-mail semble incomplète.',
      bMessage: v => v.trim().length >= 10 ? '' : 'Décrivez votre projet en quelques mots.'
    };
    const touched = new Set();
    function check(el, show) {
      const field = el.closest('.field'), rule = rules[el.id], err = $('#' + el.id + '-err');
      const msg = rule ? rule(el.value) : '';
      const filled = el.value.trim() !== '';
      field.classList.toggle('is-valid', !msg && (rule ? true : filled));
      field.classList.toggle('is-invalid', !!msg && show);
      el.setAttribute('aria-invalid', String(!!msg && show));
      if (err) err.textContent = show ? msg : '';
      return !msg;
    }
    $$('.input', form).forEach(el => {
      el.addEventListener('blur', () => { touched.add(el.id); check(el, true); });
      el.addEventListener('input', () => check(el, touched.has(el.id)));
      el.addEventListener('change', () => { touched.add(el.id); check(el, true); });
    });

    // Vérification Turnstile
    const PENDING = 'Vérification de sécurité en cours…';
    let lastOwn = '', verified = false;
    const own = (msg, state) => {
      if (status.textContent && status.textContent !== lastOwn) return;
      lastOwn = msg; status.textContent = msg; status.dataset.state = state;
    };
    const say = (msg, state) => { lastOwn = ''; status.textContent = msg; status.dataset.state = state || ''; };
    window.braiseTurnstileVerified = () => { verified = true; own('Vérification terminée : vous pouvez envoyer votre demande.', 'ok'); };
    window.braiseTurnstileExpired = () => { verified = false; own('La vérification a expiré, elle se relance automatiquement…', 'pending'); };
    window.braiseTurnstileError = () => { verified = false; own('La vérification de sécurité a échoué. Rechargez la page ou écrivez à contact@atelier-braise.fr.', 'error'); };
    own(PENDING, 'pending');
    (window.__tsq || []).forEach(k => window['braiseTurnstile' + k]());
    setTimeout(() => {
      if (!verified && status.textContent === PENDING) own('La vérification de sécurité tarde à se charger. Patientez ou écrivez à contact@atelier-braise.fr.', 'error');
    }, 12000);

    // Confirmation : « Merci » se grave
    function success() {
      form.classList.add('is-sent');
      const panel = $('.form-success', form);
      panel.focus({ preventScroll: true });
      const canvas = $('.merci-board canvas', form);
      const fontReady = document.fonts ? document.fonts.load('italic 300 60px "Cormorant Garamond"') : Promise.resolve();
      fontReady.then(() => engrave(canvas, 'Merci', { font: '"Cormorant Garamond", Georgia, serif', weight: 'italic 300' }));
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      let first = null;
      Object.keys(rules).forEach(id => { const el = $('#' + id); touched.add(id); if (!check(el, true) && !first) first = el; });
      if (first) { first.focus(); say('Merci de compléter les champs signalés.', 'error'); return; }
      const widget = $('.cf-turnstile', form);
      if (submit.disabled) return;
      let token;
      try { token = window.turnstile && window.turnstile.getResponse(widget); } catch (_) {}
      if (!token) { say('Veuillez patienter pendant la vérification de sécurité, puis réessayer.', 'pending'); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        turnstileToken: token,
        nom: String(data.name || '').trim(),
        email: String(data.email || '').trim(),
        telephone: '',
        evenement: String(data.event || '').trim(),
        date: String(data.date || '').trim(),
        lieu: String(data.place || '').trim(),
        message: [
          'Nombre d’invités : ' + (data.guests || 'À définir'),
          'Prestation envisagée : ' + (data.objects || 'À définir'),
          'Projet : ' + (data.message || 'À définir')
        ].join('\n')
      };
      submit.disabled = true;
      $('span', submit).textContent = 'Envoi en cours…';
      say('Transmission sécurisée de votre demande…', 'pending');
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        let response;
        try {
          response = await fetch(API_URL, { signal: controller.signal, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } finally { clearTimeout(timeout); }
        if (!response.ok) throw new Error('Erreur serveur : ' + response.status);
        say('Votre demande a bien été envoyée.', 'ok');
        form.reset();
        success();
      } catch (err) {
        say('L’envoi a échoué. Veuillez réessayer ou écrire à contact@atelier-braise.fr.', 'error');
      } finally {
        try { if (window.turnstile) window.turnstile.reset(widget); } catch (_) {}
        submit.disabled = false;
        $('span', submit).textContent = 'Envoyer ma demande';
      }
    });

    // Aperçu de la confirmation sans envoi réel : ajouter #apercu-merci à l'adresse
    if (document.documentElement.dataset.preview === 'true' && location.hash === '#apercu-merci') {
      const go = () => { $('#contact').scrollIntoView(); success(); };
      document.readyState === 'complete' ? go() : addEventListener('load', go);
    }
  })();

  /* --- Bouton « Demander un devis » mobile ------------------------------ */
  (() => {
    const cta = $('.mobile-cta');
    if (!cta) return;
    const inside = new Set();
    const ctaIO = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? inside.add(e.target) : inside.delete(e.target));
      const hide = inside.size > 0;
      cta.classList.toggle('is-hidden', hide);
      cta.setAttribute('aria-hidden', String(hide));
      cta.tabIndex = hide ? -1 : 0;
    }, { rootMargin: '0px 0px -15% 0px' });
    ['#contact', '.site-footer'].forEach(s => $(s) && ctaIO.observe($(s)));
  })();

  /* --- FAQ : une seule réponse ouverte à la fois ------------------------ */
  const faq = $$('.faq-list details');
  faq.forEach(d => d.addEventListener('toggle', () => { if (d.open) faq.forEach(o => { if (o !== d) o.open = false; }); }));

  applyMotion();
  onScroll();
})();

/* V77: native swipe and progressive form; original desktop form and API preserved. */
(()=>{const mq=matchMedia('(max-width:760px), (pointer:coarse) and (max-width:1024px)');const stage=document.querySelector('.tiles');if(!stage)return;const tiles=[...stage.querySelectorAll('.tile')],dots=[...document.querySelectorAll('.events-progress button')];const active=()=>{if(!mq.matches||document.querySelector('.events').classList.contains('is-orbit'))return;let i=tiles.reduce((best,t,k)=>Math.abs(t.getBoundingClientRect().left-stage.getBoundingClientRect().left)<Math.abs(tiles[best].getBoundingClientRect().left-stage.getBoundingClientRect().left)?k:best,0);dots.forEach((d,k)=>{d.classList.toggle('on',k===i);d.setAttribute('aria-pressed',String(k===i))})};stage.addEventListener('scroll',active,{passive:true});dots.forEach((d,i)=>d.addEventListener('click',()=>{if(mq.matches&&!document.querySelector('.events').classList.contains('is-orbit'))stage.scrollTo({left:tiles[i].offsetLeft-tiles[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'})}));mq.addEventListener('change',active);active();
const f=document.querySelector('#braiseEventForm'),panels=[...f.querySelectorAll('.mobile-form-panel')],nav=f.querySelector('.mobile-form-nav'),next=nav.querySelector('[data-form-next]'),back=nav.querySelector('[data-form-back]');let step=0;function render(){f.classList.toggle('is-wizard',mq.matches);panels.forEach((p,i)=>p.hidden=mq.matches&&i!==step);nav.querySelector('.mobile-form-progress').textContent=`Étape ${step+1}/3 — ${['Votre événement','Votre projet','Vos coordonnées'][step]}`;back.hidden=step===0;next.hidden=step===2}function move(i){step=i;render();panels[i].querySelector('input,select,textarea')?.focus({preventScroll:true})}next.addEventListener('click',()=>{let invalid=[...panels[step].querySelectorAll('[required]')].find(x=>!x.checkValidity()||(x.minLength>0&&x.value.trim().length<x.minLength));if(invalid){invalid.reportValidity();invalid.focus();return}move(Math.min(2,step+1))});back.addEventListener('click',()=>move(Math.max(0,step-1)));f.addEventListener('submit',e=>{if(!mq.matches)return;if(step<2){e.preventDefault();e.stopImmediatePropagation();next.click();return}let bad=panels.findIndex(p=>[...p.querySelectorAll('[required]')].some(x=>!x.checkValidity()||(x.minLength>0&&x.value.trim().length<x.minLength)));if(bad>=0&&bad!==step)move(bad)},true);document.querySelectorAll('[data-event]').forEach(a=>a.addEventListener('click',()=>{step=0;render()}));mq.addEventListener('change',render);render();})();
