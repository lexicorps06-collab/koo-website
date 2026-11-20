// Koo motion and interaction. Plain JS, no libraries.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Links: any element with data-href navigates
  document.querySelectorAll('[data-href]').forEach(el => {
    el.style.cursor = 'pointer';
    if (!el.hasAttribute('tabindex') && !/^(A|BUTTON)$/.test(el.tagName)) el.tabIndex = 0;
    const go = ev => {
      if (ev.target.closest('[data-href]') !== el) return;
        // Shared-element transition from the kaftan card to its product image
      const img = el.querySelector('.img');
      if (img && el.dataset.vt) img.style.viewTransitionName = 'hero-img';
      location.href = el.dataset.href;
    };
    el.addEventListener('click', go);
    el.addEventListener('keydown', ev => { if (ev.key === 'Enter') go(ev); });
  });

  // 1. Page entrance: split big headings into words
  const heroH = document.querySelector('.hero h1, section h1.disp, h1.disp');
  if (heroH && !reduce) {
    let i = 0;
    const split = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.append(s); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') split(n);
      });
    };
    split(heroH);
  }
  document.querySelectorAll('.strip .t').forEach((t, i) => t.style.setProperty('--i', i));
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ready')));

  // 2. "Ad·ire": the word parts and the kaftan rises into the gap as you scroll
  const bw = document.querySelector('.big-word');
  if (bw && !reduce) {
    const gap = bw.querySelector('.gap'), inset = bw.querySelector('.inset');
    const tick = () => {
      const r = bw.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
      const e = 1 - Math.pow(1 - p, 3);
      const max = bw.offsetWidth < 700 ? 84 : 250;
      gap.style.width = (max * 0.16 + max * 0.84 * e) + 'px';
      inset.style.transform = `translateY(${(1 - e) * (max < 100 ? 60 : 140)}px)`;
      inset.style.opacity = Math.min(1, e * 1.4);
    };
    addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true }); tick();
  }

  // 3. Archive fan opens when it comes into view
  const fan = document.querySelector('.fan');
  if (fan) {
    [...fan.children].forEach(c => c.style.setProperty('--d', Math.round(Math.abs(parseFloat(c.style.left) - 570) / 260)));
    if (reduce) fan.classList.add('open');
    else new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { fan.classList.add('open'); o.disconnect(); } }), { threshold: .35 }).observe(fan);
  }

  // 4. Product cards: a close-up of the cloth on hover
  const FABRIC = { 'Adire eleko kaftan':'adireL','Aṣọ-oke agbada':'asooke','Kente stole':'kenteL','Bògòlanfini wrap skirt':'bogolan',
    'Cowrie clutch':'asookeR','Kente kaftan':'kenteL','Adire oniko scarf':'adireL','Kitenge shirt':'wax','Aṣọ-oke fila cap':'asooke' };
  document.querySelectorAll('.card').forEach(card => {
    const name = card.querySelector('.name')?.textContent.trim(), img = card.querySelector('.img');
    if (name === 'Adire eleko kaftan') card.dataset.vt = '1';
    const f = FABRIC[name]; if (!f || !img) return;
    img.insertAdjacentHTML('beforeend', `<svg class="alt" width="100%" height="100%" aria-hidden="true"><rect width="100%" height="100%" fill="url(#${f})"/></svg>`);
  });

  // 5. Choices answer the click
  const pick = (sel, scope) => document.querySelectorAll(sel).forEach(el => el.addEventListener('click', () => {
    if (el.classList.contains('off')) return;
    el.closest(scope).querySelectorAll(sel).forEach(x => x.classList.remove('on')); el.classList.add('on');
  }));
  pick('.size', 'div');
  document.querySelectorAll('.swatch-pick').forEach(s => s.addEventListener('click', () => {
    document.querySelectorAll('.swatch-pick').forEach(x => x.style.outline = 'none');
    s.style.outline = '2px solid #100D0B'; s.style.outlineOffset = '3px';
    const lab = document.querySelector('[data-colour-label]'); if (lab) lab.textContent = 'Colour: ' + s.dataset.name;
  }));
  document.querySelectorAll('.acc .h').forEach(h => h.addEventListener('click', () => {
    const a = h.parentElement; a.classList.toggle('open'); h.lastElementChild.textContent = a.classList.contains('open') ? '−' : '+';
  }));

  // 7. Mobile menu (phones) and scaling (tablets and small laptops)
  const nav = document.querySelector('.topnav, .hero .nav');
  if (nav && nav.querySelector('.grp')) {
    const light = !nav.classList.contains('on-paper');
    const btn = document.createElement('span');
    btn.className = 'pill menu-btn'; btn.setAttribute('role', 'button'); btn.tabIndex = 0;
    btn.setAttribute('aria-label', 'Open menu'); btn.textContent = 'Menu';
    nav.insertBefore(btn, nav.firstChild);
    const m = document.createElement('div'); m.className = 'mmenu'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Menu');
    m.innerHTML = `<div class="mtop"><span class="pill" style="background:rgba(255,255,255,.14);color:#fff">Koo</span><span class="pill mclose" role="button" tabindex="0" style="background:#fff;color:#100D0B">Close</span></div>
      <a href="index.html">Home</a><a href="shop.html">Shop</a><a href="archive.html">Archive</a><a href="journal.html">Journal</a><a href="know-your-cloth.html">Know your cloth</a>
      <div class="msub"><a href="search.html">Search</a><a href="bag.html">Bag</a><a href="makers.html">Our makers</a>
      <div class="cur mono" style="margin-top:8px"><span class="on" style="background:#fff;color:#100D0B">₦ NGN</span><span>$ USD</span><span>£ GBP</span><span>€ EUR</span><span>₵ GHS</span><span>KSh KES</span></div></div>`;
    document.body.append(m);
    const open = v => { document.documentElement.classList.toggle('menu-open', v); document.body.classList.toggle('menu-open', v); };
    btn.addEventListener('click', () => open(true));
    m.querySelector('.mclose').addEventListener('click', () => open(false));
    addEventListener('keydown', e => { if (e.key === 'Escape') open(false); });
    if (!light) btn.style.cssText = 'background:rgba(16,13,11,.06);color:#100D0B';
  }
  const fit = () => {
    const w = document.documentElement.clientWidth;
    document.documentElement.style.zoom = (w > 760 && w < 1440) ? (w / 1440).toFixed(4) : '';
  };
  fit(); addEventListener('resize', fit);
})();
