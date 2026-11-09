/* (mino) — interactions & motion */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const loader = $('#loader');

  if (!window.gsap || !window.ScrollTrigger) { if (loader) loader.style.display = 'none'; return; }
  gsap.registerPlugin(ScrollTrigger);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  /* ---------------- Smooth scroll ---------------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.8, easing: t => 1 - Math.pow(1 - t, 4) });
    else el.scrollIntoView({ behavior: 'smooth' });
  };
  $$('[data-scroll]').forEach(a => a.addEventListener('click', e => {
    const h = a.getAttribute('href');
    if (h && h.startsWith('#')) { e.preventDefault(); scrollTo(h === '#top' ? document.body : h); }
  }));

  /* ---------------- Split text ---------------- */
  const splitWords = (root, cls = 'wi', wrap = true) => {
    const walk = (node) => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const inner = document.createElement('span'); inner.className = cls; inner.textContent = p;
            if (wrap) { const w = document.createElement('span'); w.className = 'w'; w.appendChild(inner); frag.appendChild(w); }
            else frag.appendChild(inner);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains('w')) {
          if (child.classList.contains('mino')) { child.classList.add(cls); return; }
          walk(child);
        }
      });
    };
    walk(root);
    return $$('.' + cls, root);
  };

  /* ---------------- Preloader → hero intro ---------------- */
  const heroWords = $$('.hero-title .wi');
  gsap.set(heroWords, { yPercent: 115, rotate: 3 });
  gsap.set('.hero-fade', { opacity: 0, y: 30 });
  gsap.set('#heroMedia', { scale: 1.32 });

  const intro = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('#heroMedia', { scale: 1.06, duration: 2.6 }, 0)
      .to(heroWords, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.08 }, 0.15)
      .to('.hero-fade', { opacity: 1, y: 0, duration: 1.4, stagger: 0.12 }, 0.7);
    if (lenis) lenis.start();
  };

  const word = $('.loader-mark .word');
  const count = { v: 0 };
  const ltl = gsap.timeline({ onComplete: () => { loader.style.display = 'none'; } });
  ltl.to(word, { width: () => word.scrollWidth, duration: 1.1, ease: 'expo.inOut' }, 0.2)
     .to(count, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { $('#count').textContent = String(Math.round(count.v)).padStart(3, '0'); } }, 0)
     .to('#loaderBar', { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
     .to('.loader-mark', { y: -30, opacity: 0, duration: 0.7, ease: 'power3.in' }, 1.95)
     .to('.loader-count, .loader-tag', { opacity: 0, duration: 0.4 }, 1.95)
     .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.15, ease: 'expo.inOut' }, 2.25)
     .add(intro, 2.55);

  /* ---------------- Hero exit as sheet slides over ---------------- */
  gsap.timeline({ scrollTrigger: { trigger: '#statement', start: 'top bottom', end: 'top top', scrub: true } })
    .to('#heroInner', { yPercent: -18, opacity: 0, ease: 'none' }, 0)
    .to('#heroMedia', { yPercent: 12, scale: 1.16, ease: 'none' }, 0)
    .to('#heroDim', { opacity: 0.55, ease: 'none' }, 0)
    .to('.hero-meta', { opacity: 0, ease: 'none' }, 0);

  /* ---------------- Headline reveals ---------------- */
  $$('[data-split]').forEach(h => {
    const words = splitWords(h);
    gsap.set(words, { yPercent: 115, rotate: 2.5 });
    ScrollTrigger.create({
      trigger: h, start: 'top 86%', once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, rotate: 0, duration: 1.4, ease: 'expo.out', stagger: 0.06 })
    });
  });

  /* ---------------- Statement word scrub ---------------- */
  const sWords = splitWords($('#statementText'), 'sw', false);
  gsap.set(sWords, { opacity: 0.13 });
  gsap.to(sWords, {
    opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: '#statementText', start: 'top 78%', end: 'bottom 45%', scrub: 0.6 }
  });

  /* ---------------- Fade-up blocks ---------------- */
  gsap.set('.reveal-up', { opacity: 0, y: 60 });
  ScrollTrigger.batch('.reveal-up', {
    start: 'top 90%', once: true,
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12 })
  });

  /* ---------------- Image frames: clip reveal + parallax ---------------- */
  $$('.frame.reveal').forEach(fig => {
    const inner = $('.inner', fig), img = $('img', fig);
    gsap.set(fig, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(inner, { scale: 1.35 });
    ScrollTrigger.create({
      trigger: fig, start: 'top 88%', once: true,
      onEnter: () => {
        gsap.to(fig, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' });
        gsap.to(inner, { scale: 1, duration: 2.2, ease: 'expo.out', delay: 0.15 });
      }
    });
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    if (fig.dataset.speed) {
      const s = parseFloat(fig.dataset.speed);
      gsap.fromTo(fig, { yPercent: -s * 0.6 }, { yPercent: s, ease: 'none', scrollTrigger: { trigger: fig.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });

  /* ---------------- Chapter color transitions ---------------- */
  const chaptersEl = $('#therapies');
  const setTheme = (ch) => gsap.to(chaptersEl, { backgroundColor: ch.dataset.bg, '--fg': ch.dataset.fg, duration: 1.1, ease: 'power2.out', overwrite: 'auto' });
  const chapters = $$('.chapter');
  gsap.set(chaptersEl, { backgroundColor: chapters[0].dataset.bg, '--fg': chapters[0].dataset.fg });
  chapters.forEach(ch => {
    ScrollTrigger.create({ trigger: ch, start: 'top 55%', end: 'bottom 55%', onEnter: () => setTheme(ch), onEnterBack: () => setTheme(ch) });
    const num = $('.ch-bignum', ch);
    gsap.fromTo(num, { yPercent: 30 }, { yPercent: -40, ease: 'none', scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------------- Therapy index hover preview ---------------- */
  const floatImg = $('#floatImg');
  const rows = $$('.index-row');
  const imgs = rows.map(r => { const i = new Image(); i.src = r.dataset.img; i.alt = ''; floatImg.appendChild(i); return i; });
  if (fine) {
    const fx = gsap.quickTo(floatImg, 'x', { duration: 0.7, ease: 'power3' });
    const fy = gsap.quickTo(floatImg, 'y', { duration: 0.7, ease: 'power3' });
    gsap.set(floatImg, { xPercent: -50, yPercent: -50 });
    $('#indexList').addEventListener('mousemove', e => { fx(e.clientX + 40); fy(e.clientY); });
    rows.forEach((r, i) => r.addEventListener('mouseenter', () => {
      imgs.forEach((im, j) => im.classList.toggle('on', i === j));
      gsap.to(floatImg, { opacity: 1, scale: 1, rotate: (i % 2 ? 3 : -3), duration: 0.6, ease: 'expo.out' });
    }));
    $('#indexList').addEventListener('mouseleave', () => gsap.to(floatImg, { opacity: 0, scale: 0.6, duration: 0.5, ease: 'expo.out' }));
  }
  rows.forEach(r => r.addEventListener('click', () => scrollTo(r.dataset.target)));
  gsap.from(rows, { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#indexList', start: 'top 85%' } });

  /* ---------------- Approach: horizontal pinned scroll ---------------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = $('#apTrack');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '#approach', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: self => gsap.set('#apBar', { scaleX: self.progress })
      }
    });
    $$('.step').forEach(step => {
      gsap.fromTo($('.bar', step), { height: '0%' }, { height: '100%', ease: 'none', scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 85%', end: 'left 35%', scrub: true } });
      gsap.fromTo($('.step-n', step), { yPercent: 40, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 95%', end: 'left 50%', scrub: true } });
    });
  });

  /* ---------------- Counters ---------------- */
  $$('.count').forEach(el => {
    const to = +el.dataset.to, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 2.2, ease: 'expo.out', onUpdate: () => el.textContent = Math.round(o.v) }) });
  });

  /* ---------------- Closing: window expands to full bleed ---------------- */
  gsap.timeline({ scrollTrigger: { trigger: '#begin', start: 'top 75%', end: 'top top', scrub: true } })
    .fromTo('#closingMedia', { clipPath: 'inset(14% 10% 14% 10% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' }, 0)
    .fromTo('#closingMedia img', { scale: 1.2 }, { scale: 1, ease: 'none' }, 0);

  /* ---------------- Footer wordmark ---------------- */
  gsap.timeline({ scrollTrigger: { trigger: '#wordmark', start: 'top bottom', end: 'bottom bottom', scrub: true } })
    .fromTo('#wordmark .p:first-child', { xPercent: -160, rotate: -12 }, { xPercent: 0, rotate: 0, ease: 'none' }, 0)
    .fromTo('#wordmark .p:last-child', { xPercent: 160, rotate: 12 }, { xPercent: 0, rotate: 0, ease: 'none' }, 0)
    .fromTo('#wordmark .m', { yPercent: 40, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: 'none' }, 0);

  /* ---------------- Nav + progress ---------------- */
  const nav = $('#nav'); let lastY = 0;
  const onScroll = (y) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    gsap.set('#progress', { scaleX: max > 0 ? y / max : 0 });
    nav.classList.toggle('is-hidden', y > lastY && y > 300);
    lastY = y;
  };
  if (lenis) lenis.on('scroll', e => onScroll(e.scroll)); else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  /* ---------------- Cursor ---------------- */
  if (fine) {
    const dot = $('#cursor'), ring = $('#cursorRing');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12 }), dy = gsap.quickTo(dot, 'y', { duration: 0.12 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });
    addEventListener('mousemove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener('mouseover', e => {
      const v = e.target.closest('[data-cursor="view"]');
      const l = e.target.closest('a, button, .index-row, .tier');
      ring.classList.toggle('is-view', !!v && !l);
      ring.classList.toggle('is-link', !!l);
    });
    document.addEventListener('mouseleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.3 }));
    document.addEventListener('mouseenter', () => gsap.to([dot, ring], { opacity: 1, duration: 0.3 }));

    /* Magnetic buttons */
    $$('.magnetic').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.4); });
      el.addEventListener('mouseleave', () => { gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' }); });
    });

    /* Tilt cards + glow */
    $$('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', px * 100 + '%'); card.style.setProperty('--my', py * 100 + '%');
        gsap.to(card, { rotateY: (px - 0.5) * 7, rotateX: (0.5 - py) * 7, y: -8, transformPerspective: 1100, duration: 0.6, ease: 'power3' });
      });
      card.addEventListener('mouseleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 1, ease: 'expo.out' }));
    });
    $$('.glow').forEach(card => card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px'); card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
