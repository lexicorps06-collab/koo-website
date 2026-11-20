// Koo: bag, currency, search, filters, forms and checkout. Plain JS; state lives in localStorage.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem('koo-' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('koo-' + k, JSON.stringify(v)); } catch {} },
  };
  const ss = {
    get(k) { try { return JSON.parse(sessionStorage.getItem('koo-' + k)); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem('koo-' + k, JSON.stringify(v)); } catch {} },
  };
  const toast = msg => {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.append(t); setTimeout(() => t.remove(), 2600);
  };

  // ---------- Currency ----------
  // Naira per unit. Estimates for display; checkout says so.
  const RATES = { NGN: 1, USD: 1550, GBP: 1950, EUR: 1680, GHS: 105, KES: 12 };
  const LABEL = { NGN: '₦ NGN', USD: '$ USD', GBP: '£ GBP', EUR: '€ EUR', GHS: '₵ GHS', KES: 'KSh KES' };
  let cur = store.get('cur', 'NGN'); if (!RATES[cur]) cur = 'NGN';
  const money = (n, c = cur, dp) => {
    const v = n / RATES[c];
    const digits = dp ?? (c === 'NGN' || c === 'KES' ? 0 : 2);
    try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v); }
    catch { return c + ' ' + v.toFixed(digits); }
  };
  // Wrap every naira amount written in the page so it can be converted
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => /₦\s?[\d,]{3,}/.test(n.nodeValue) && !n.parentElement.closest('script,template,.money,.cur-label,.cur-list,.cur-pop') ? 1 : 2 });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => {
    const frag = document.createDocumentFragment(); let last = 0; const s = n.nodeValue;
    s.replace(/₦\s?([\d,]{3,})/g, (m, num, i) => {
      frag.append(s.slice(last, i));
      const sp = document.createElement('span'); sp.className = 'money'; sp.dataset.ngn = num.replace(/,/g, ''); sp.textContent = m;
      frag.append(sp); last = i + m.length;
    });
    frag.append(s.slice(last)); n.replaceWith(frag);
  });
  const renderMoney = () => {
    $$('.money').forEach(el => el.textContent = money(+el.dataset.ngn, cur, 0));
    $$('.cur-label').forEach(el => el.textContent = LABEL[cur]);
    $$('.cur-list button,.cur-pop button[data-cur]').forEach(b => b.classList.toggle('on', b.dataset.cur === cur));
  };
  const setCur = c => { cur = c; store.set('cur', c); renderMoney(); renderBag(); renderCheckout(); };
  // Dropdown on every currency pill
  let pop;
  const closePop = () => { pop?.remove(); pop = null; };
  $$('.cur-pill').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation(); if (pop) return closePop();
    pop = document.createElement('div'); pop.className = 'cur-pop'; pop.setAttribute('role', 'menu');
    pop.innerHTML = '<small>Show prices in</small>' + Object.keys(RATES).map(c => `<button type="button" role="menuitemradio" data-cur="${c}">${LABEL[c]}</button>`).join('');
    document.body.append(pop);
    const r = btn.getBoundingClientRect(), z = parseFloat(document.documentElement.style.zoom) || 1;
    pop.style.top = (r.bottom * 1 / 1 + scrollY / 1 + 8) / (z === 1 ? 1 : 1) + 'px'; pop.style.left = Math.max(8, r.right - 200) + 'px';
    pop.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { setCur(b.dataset.cur); closePop(); toast('Prices now in ' + LABEL[b.dataset.cur]); }));
    renderMoney(); pop.querySelector('button.on')?.focus();
  }));
  addEventListener('click', e => { if (pop && !pop.contains(e.target)) closePop(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { closePop(); closeModal(); } });
  $$('.cur-list button').forEach(b => b.addEventListener('click', () => { setCur(b.dataset.cur); toast('Prices now in ' + LABEL[b.dataset.cur]); }));
  // the mobile menu's currency chips
  document.addEventListener('click', e => {
    const s = e.target.closest('.mmenu .cur span'); if (!s) return;
    const c = Object.keys(LABEL).find(k => LABEL[k].toLowerCase() === s.textContent.trim().toLowerCase());
    if (c) { setCur(c); $$('.mmenu .cur span').forEach(x => { const on = x === s; x.classList.toggle('on', on); x.style.background = on ? '#fff' : ''; x.style.color = on ? '#100D0B' : ''; }); }
  });

  // ---------- Bag ----------
  let bag = store.get('bag', []);
  const saveBag = () => { store.set('bag', bag); renderCount(); };
  const count = () => bag.reduce((n, i) => n + i.qty, 0);
  const subtotal = () => bag.reduce((n, i) => n + i.price * i.qty, 0);
  const renderCount = () => {
    const n = count();
    $$('.bag-n').forEach(b => b.textContent = n ? String(n) : '');
    $$('.bag-n-big').forEach(b => b.textContent = n ? String(n) : '');
  };
  const addItem = item => {
    const found = bag.find(i => i.id === item.id && i.variant === item.variant);
    if (found) { if (item.unique) { toast('Already in your bag'); return false; } found.qty += 1; } else bag.push({ ...item, qty: 1 });
    saveBag(); $$('.bag-pill').forEach(p => { p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); });
    return true;
  };

  // Product page
  const info = $('.pdp-info');
  if (info) {
    let size = $('.size.on', info)?.dataset.size || 'One size';
    $$('.size', info).forEach(s => s.addEventListener('click', () => { size = s.dataset.size; }));
    const add = $('.add-btn', info), label = add.textContent;
    add.addEventListener('click', () => {
      addItem({ id: info.dataset.product, name: info.dataset.name, price: +info.dataset.price, variant: size, href: location.pathname.split('/').pop() });
      add.textContent = 'Added to bag'; add.style.background = '#1F5A3B';
      toast(`${info.dataset.name} added to your bag`);
      setTimeout(() => { add.innerHTML = label.replace(/₦[\d,]+/, m => `<span class="money" data-ngn="${info.dataset.price}">${m}</span>`); add.style.background = ''; renderMoney(); }, 2200);
    });
  }
  // Wishlist
  let wish = store.get('wish', []);
  $$('.heart').forEach(h => {
    const id = h.closest('[data-product]')?.dataset.product;
    const paint = () => { const on = wish.includes(id); h.classList.toggle('on', on); h.setAttribute('aria-pressed', on); h.setAttribute('aria-label', on ? 'Remove from wishlist' : 'Save to wishlist'); };
    paint();
    h.addEventListener('click', () => { wish = wish.includes(id) ? wish.filter(x => x !== id) : [...wish, id]; store.set('wish', wish); paint(); toast(wish.includes(id) ? 'Saved to your wishlist' : 'Removed from your wishlist'); });
  });
  // Archive reserve
  $$('.reserve-btn').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    if (addItem({ id: b.dataset.id, name: b.dataset.name, price: +b.dataset.price, variant: 'Archive · ' + b.dataset.variant, href: b.dataset.hrefItem, unique: true })) {
      b.firstChild.textContent = 'Reserved'; toast(`${b.dataset.name} is held for you for 48 hours`);
    }
  }));

  const thumb = id => { const t = document.getElementById('thumb-' + id); return t ? t.innerHTML : ''; };
  function renderBag() {
    const list = $('#bag-items'); if (!list) return;
    const empty = !bag.length;
    $('#bag-empty').classList.toggle('is-hidden', !empty);
    $('.bag-wrap').classList.toggle('is-hidden', empty);
    list.innerHTML = bag.map((i, ix) => `
      <div style="display:flex;gap:24px;padding:24px 0;border-top:1px solid var(--line)">
        <a href="${i.href}" style="width:160px;height:200px;overflow:hidden;flex:none">${thumb(i.id)}</a>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;justify-content:space-between;gap:12px"><a href="${i.href}" style="font-weight:600;font-size:18px">${i.name}</a><span style="font-weight:600;font-size:18px">${money(i.price * i.qty)}</span></div>
          <span style="font-size:15px">${i.variant}</span>
          <div style="display:flex;gap:16px;align-items:center;margin-top:auto;flex-wrap:wrap">
            ${i.unique ? '<span class="mono" style="opacity:.6">One of one</span>' : `<div class="qty"><button type="button" data-dec="${ix}" aria-label="Decrease quantity of ${i.name}">−</button><b aria-live="polite">${i.qty}</b><button type="button" data-inc="${ix}" aria-label="Increase quantity of ${i.name}">+</button></div>`}
            <button type="button" class="linkish" data-rm="${ix}">Remove</button></div></div></div>`).join('');
    $('#b-sub').textContent = money(subtotal()); $('#b-total').textContent = money(subtotal());
    renderCount();
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-inc],[data-dec],[data-rm]'); if (!t) return;
    if (t.dataset.inc) bag[+t.dataset.inc].qty++;
    if (t.dataset.dec) { const i = bag[+t.dataset.dec]; i.qty--; if (i.qty < 1) bag.splice(+t.dataset.dec, 1); }
    if (t.dataset.rm) { const [r] = bag.splice(+t.dataset.rm, 1); toast(`${r.name} removed`); }
    saveBag(); renderBag(); renderCheckout();
  });

  // ---------- Checkout ----------
  const form = $('#co-form');
  const SHIP = { domestic: { express: 9000, standard: 4500, en: '1 to 2 days', sn: '2 to 4 days' }, africa: { express: 42000, standard: 24000, en: '3 to 5 days', sn: '7 to 12 days' }, world: { express: 54000, standard: 31000, en: '3 to 5 days', sn: '7 to 12 days' } };
  const DUTY = { Nigeria: 0, Ghana: .2, Kenya: .25, 'South Africa': .25, 'United Kingdom': .2, 'United States': .1, Canada: .13, France: .2, Germany: .19 };
  const zone = c => c === 'Nigeria' ? 'domestic' : ['Ghana', 'Kenya', 'South Africa'].includes(c) ? 'africa' : 'world';
  const DEFAULT_CUR = { Nigeria: 'NGN', Ghana: 'GHS', Kenya: 'KES', 'United Kingdom': 'GBP', 'United States': 'USD', Canada: 'USD', France: 'EUR', Germany: 'EUR', 'South Africa': 'USD' };
  function totals() {
    const country = form?.country.value || 'Nigeria', z = SHIP[zone(country)], method = form?.ship.value || 'express';
    const sub = subtotal(), ship = z[method], duty = Math.round(sub * (DUTY[country] ?? .2));
    return { country, method, sub, ship, duty, total: sub + ship + duty, z };
  }
  function renderCheckout() {
    if (!form) return;
    if (!bag.length) { $('.co').classList.add('is-hidden'); $('#co-empty').classList.remove('is-hidden'); return; }
    const t = totals(), c = form.currency.value;
    $('#co-items').innerHTML = bag.map(i => `<div style="display:flex;gap:14px;align-items:center;padding:10px 0"><div style="width:64px;height:80px;overflow:hidden;flex:none;border-radius:8px">${thumb(i.id).replace(/width="160" height="200"/, 'width="64" height="80"')}</div><div style="flex:1"><div style="font-weight:600;font-size:15px">${i.name}${i.qty > 1 ? ' × ' + i.qty : ''}</div><div style="font-size:13px;opacity:.6">${i.variant}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><b>${money(i.price * i.qty, c)}</b><button type="button" class="linkish" data-rm="${bag.indexOf(i)}" aria-label="Remove ${i.name}">Remove</button></div></div>`).join('');
    $('#co-sub').textContent = money(t.sub, c);
    $('#co-ship-label').textContent = (t.method === 'express' ? 'Express' : 'Standard') + ' shipping';
    $('#co-ship').textContent = money(t.ship, c);
    $('#co-duty').textContent = t.duty ? money(t.duty, c) : 'None';
    $('#co-duty-note').textContent = t.duty ? 'Paid now, so there is nothing to pay on delivery.' : 'No import duties for deliveries inside Nigeria.';
    $('#co-total').textContent = money(t.total, c);
    $('#pay-btn').textContent = 'Pay ' + money(t.total, c);
    $('#ship-express').textContent = money(t.z.express, c); $('#ship-standard').textContent = money(t.z.standard, c);
    $('#ship-express-note').textContent = t.z.en + ', tracked'; $('#ship-standard-note').textContent = t.z.sn + ', tracked';
  }
  if (form) {
    form.currency.value = cur;
    form.country.addEventListener('change', () => { form.currency.value = DEFAULT_CUR[form.country.value] || 'USD'; renderCheckout(); });
    form.currency.addEventListener('change', renderCheckout);
    $$('.opt').forEach(o => o.addEventListener('click', () => { $$('.opt').forEach(x => x.classList.toggle('on', x === o)); o.querySelector('input').checked = true; renderCheckout(); }));
    let pay = 'card';
    $$('#pay-methods .chip').forEach(ch => ch.addEventListener('click', () => {
      pay = ch.dataset.pay; $$('#pay-methods .chip').forEach(x => x.classList.toggle('on', x === ch));
      $('#card-fields').classList.toggle('is-hidden', pay !== 'card');
      const alt = $('#alt-pay'); alt.classList.toggle('is-hidden', pay === 'card');
      alt.textContent = pay === 'transfer' ? 'After you place the order we email you our bank details. We ship once the transfer arrives.' : 'You will confirm with Apple Pay on your device.';
    }));
    form.card.addEventListener('input', () => { const d = form.card.value.replace(/\D/g, '').slice(0, 16); form.card.value = d.replace(/(.{4})/g, '$1 ').trim(); });
    form.exp.addEventListener('input', () => { const d = form.exp.value.replace(/\D/g, '').slice(0, 4); form.exp.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; });
    const rules = {
      email: v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || 'Enter an email address like name@example.com',
      first: v => !!v.trim() || 'Enter your first name', last: v => !!v.trim() || 'Enter your last name',
      address: v => v.trim().length > 4 || 'Enter your street address', city: v => !!v.trim() || 'Enter your city',
      phone: v => v.replace(/\D/g, '').length >= 7 || 'Enter a phone number so the courier can reach you',
      card: v => pay !== 'card' || v.replace(/\D/g, '').length === 16 || 'Enter the 16-digit card number',
      exp: v => { if (pay !== 'card') return true; const m = v.match(/^(\d{2}) \/ (\d{2})$/); if (!m || +m[1] < 1 || +m[1] > 12) return 'Enter the expiry date as MM / YY'; const d = new Date(2000 + +m[2], +m[1]); return d > new Date() || 'This card has expired'; },
      cvc: v => pay !== 'card' || /^\d{3,4}$/.test(v) || 'Enter the 3 or 4 digits on the back of the card',
    };
    const check = name => {
      const el = form[name], r = rules[name](el.value), err = $('#' + name + '-err');
      el.classList.toggle('bad', r !== true); el.setAttribute('aria-invalid', r !== true); if (err) err.textContent = r === true ? '' : r;
      return r === true;
    };
    Object.keys(rules).forEach(n => form[n].addEventListener('blur', () => form[n].value && check(n)));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = Object.keys(rules).filter(n => !check(n));
      if (bad.length) { $('#form-err').textContent = `Check the ${bad.length === 1 ? 'highlighted field' : bad.length + ' highlighted fields'}.`; form[bad[0]].focus(); return; }
      $('#form-err').textContent = '';
      const t = totals(), c = form.currency.value;
      ss.set('order', { no: 'KOO-' + Math.floor(20000 + Math.random() * 70000), first: form.first.value.trim(), email: form.email.value.trim(),
        addr: `${form.address.value.trim()}, ${form.city.value.trim()}${form.postcode.value ? ' ' + form.postcode.value.trim() : ''}, ${t.country}`,
        country: t.country, method: t.method, items: bag, total: t.total, cur: c, at: new Date().toISOString(), eta: t.method === 'express' ? t.z.en : t.z.sn });
      bag = []; saveBag(); location.href = 'confirmation.html';
    });
    renderCheckout();
  }

  // ---------- Confirmation ----------
  const conf = $('#co-addr');
  if (conf) {
    const o = ss.get('order');
    if (o) {
      $('#co-name').textContent = ', ' + o.first;
      $('#co-meta').textContent = `Order ${o.no} · Confirmation sent to ${o.email}`;
      $('#co-msg').textContent = o.country === 'Nigeria' ? 'Thank you. Your order is with our team in Lagos.' : `Thank you. Your order is with our team in Lagos. Duties are paid, so nothing is owed when it reaches ${o.country}.`;
      $('#co-placed').textContent = new Date(o.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      $('#co-shipped').textContent = o.method === 'express' ? 'Express' : 'Standard';
      $('#co-eta').textContent = o.eta + ' after dispatch';
      $('#co-items').innerHTML = o.items.map(i => `<div style="display:flex;gap:14px;align-items:center;padding:10px 0"><div style="width:64px;height:80px;overflow:hidden;flex:none;border-radius:8px">${thumb(i.id).replace(/width="160" height="200"/, 'width="64" height="80"')}</div><div style="flex:1"><div style="font-weight:600">${i.name}${i.qty > 1 ? ' × ' + i.qty : ''}</div><div style="font-size:13px;opacity:.6">${i.variant}</div></div></div>`).join('');
      $('#co-total').textContent = money(o.total, o.cur);
      conf.textContent = o.addr;
    } else {
      $('#co-msg').textContent = 'There is no recent order in this browser. Your confirmation email has the details of past orders.';
      conf.textContent = 'No recent order';
      $$('.steps').forEach(s => s.classList.add('is-hidden'));
    }
  }

  // ---------- Filters ----------
  const filterCards = (cards, test) => { let n = 0; cards.forEach(c => { const ok = test(c); c.classList.toggle('is-hidden', !ok); n += ok; }); return n; };
  // Home "New in"
  const ACC = ['Jewellery', 'Bags', 'Headwear'];
  $$('[data-filter-group="home"] .chip-f').forEach(b => b.addEventListener('click', () => {
    $$('[data-filter-group="home"] .chip-f').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.style.background = on ? 'var(--ink)' : ''; x.style.color = on ? '#fff' : ''; });
    filterCards($$('#home-grid .card'), c => b.dataset.f === 'all' || (b.dataset.f === 'accessories') === ACC.includes(c.dataset.cat));
  }));
  // Shop
  const sg = $('#shop-grid');
  if (sg) {
    const cards = $$('.card', sg), f = $('#filters');
    let cat = 'all';
    const hashCat = decodeURIComponent(location.hash.slice(1));
    if (hashCat === 'accessories') cat = 'accessories'; else if ($$('#cat-chips .chip').some(c => c.dataset.cat === hashCat)) cat = hashCat;
    const apply = () => {
      const fabs = $$('input[name=fabric]:checked', f).map(i => i.value), ctrs = $$('input[name=country]:checked', f).map(i => i.value);
      const min = +f.min.value || 0, max = +f.max.value || Infinity;
      const n = filterCards(cards, c => (cat === 'all' || (cat === 'accessories' ? ACC.includes(c.dataset.cat) : c.dataset.cat === cat)) && (!fabs.length || fabs.includes(c.dataset.fabric)) && (!ctrs.length || ctrs.includes(c.dataset.country)) && +c.dataset.price >= min && +c.dataset.price <= max);
      $('#result-count').textContent = n; $('#shop-empty').classList.toggle('is-hidden', n > 0);
      $$('#cat-chips .chip').forEach(c => c.classList.toggle('on', c.dataset.cat === cat || (cat === 'accessories' && false)));
      const s = $('#sort').value;
      cards.slice().sort((a, b) => s === 'low' ? a.dataset.price - b.dataset.price : s === 'high' ? b.dataset.price - a.dataset.price : a.dataset.order - b.dataset.order).forEach(c => sg.append(c));
    };
    $$('#cat-chips .chip').forEach(c => c.addEventListener('click', () => { cat = c.dataset.cat; history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + encodeURIComponent(cat)); apply(); }));
    f.addEventListener('input', apply); $('#sort').addEventListener('change', apply);
    const clear = () => { f.reset(); cat = 'all'; history.replaceState(null, '', location.pathname); apply(); };
    $('#clear-filters').addEventListener('click', clear); $('#clear-filters-2').addEventListener('click', clear);
    apply();
  }
  // Archive
  $$('.arch-chips .chip').forEach(b => b.addEventListener('click', () => {
    $$('.arch-chips .chip').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.style.background = on ? '#fff' : ''; x.style.color = on ? '#100D0B' : ''; });
    filterCards($$('#arch-rows .ar-row'), r => b.dataset.type === 'all' || r.dataset.type === b.dataset.type);
  }));
  // Journal
  $$('.j-chips .chip').forEach(b => b.addEventListener('click', () => {
    const c = b.dataset.cat; $$('.j-chips .chip').forEach(x => x.classList.toggle('on', x === b));
    const feat = $('.j-feat'); feat.classList.toggle('is-hidden', !(c === 'all' || feat.dataset.cat === c));
    const n = filterCards($$('.j-grid .story'), s => c === 'all' || s.dataset.cat === c);
    $('#j-empty').classList.toggle('is-hidden', n > 0 || !feat.classList.contains('is-hidden'));
  }));

  // ---------- Search ----------
  const q = $('#q');
  if (q) {
    const cards = $$('#search-grid .card');
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ọ]/g, 'o');
    const run = () => {
      const v = norm(q.value.trim()), words = v.split(/\s+/).filter(Boolean);
      const n = filterCards(cards, c => !words.length || words.every(w => norm(c.dataset.search).includes(w) || (w === 'brass' && c.dataset.fabric === 'Brass')));
      $('#q-count').textContent = words.length ? `${n} ${n === 1 ? 'piece' : 'pieces'} for “${q.value.trim()}”` : `${n} pieces`;
      $('#search-empty').classList.toggle('is-hidden', n > 0); $('#q-echo').textContent = q.value.trim();
      const u = new URL(location.href); words.length ? u.searchParams.set('q', q.value.trim()) : u.searchParams.delete('q'); history.replaceState(null, '', u);
    };
    q.value = new URLSearchParams(location.search).get('q') || '';
    q.addEventListener('input', run); $('#search-form').addEventListener('submit', e => { e.preventDefault(); run(); });
    $('#q-clear').addEventListener('click', () => { q.value = ''; run(); q.focus(); });
    $$('.q-chip').forEach(c => c.addEventListener('click', () => { q.value = c.dataset.q; run(); }));
    run(); if (!q.value) q.focus();
  }

  // ---------- Modals ----------
  let modal;
  function closeModal() { if (!modal) return; modal.remove(); modal = null; }
  const openModal = (html, onReady) => {
    closeModal(); modal = document.createElement('div'); modal.className = 'modal-bg';
    modal.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">${html}</div>`;
    modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) closeModal(); });
    document.body.append(modal); onReady?.(modal); modal.querySelector('input,textarea,button')?.focus();
  };
  $$('.ask-btn').forEach(b => b.addEventListener('click', () => openModal(`
    <h2>Ask about ${b.dataset.piece}</h2><p class="lead">We reply within one working day.</p>
    <form novalidate style="display:flex;flex-direction:column;gap:14px">
      <div class="field2"><label for="ask-email">Email</label><input class="inp" id="ask-email" type="email" required autocomplete="email"><span class="err"></span></div>
      <div class="field2"><label for="ask-msg">Question</label><textarea class="inp" id="ask-msg" required></textarea><span class="err"></span></div>
      <div style="display:flex;gap:10px"><button class="btn" type="submit">Send question</button><button class="btn ghost" type="button" data-close>Cancel</button></div></form>`, m => {
      m.querySelector('form').addEventListener('submit', e => {
        e.preventDefault(); const em = m.querySelector('#ask-email'), msg = m.querySelector('#ask-msg'); let ok = true;
        [[em, /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value), 'Enter an email address like name@example.com'], [msg, msg.value.trim().length > 3, 'Write your question']].forEach(([el, good, text]) => { el.classList.toggle('bad', !good); el.nextElementSibling.textContent = good ? '' : text; ok = ok && good; });
        if (!ok) return; m.querySelector('.modal-box').innerHTML = `<h2>Question sent</h2><p class="lead">We will reply to ${em.value} within one working day.</p><button class="btn" type="button" data-close>Done</button>`; m.querySelector('[data-close]').focus();
      });
    })));

  // ---------- Simple forms: newsletter and contact ----------
  const simpleForm = (f, fields, done) => f && f.addEventListener('submit', e => {
    e.preventDefault(); let ok = true;
    fields.forEach(([sel, test, text]) => { const el = $(sel, f), good = test(el.value); el.classList.toggle('bad', !good); el.setAttribute('aria-invalid', !good); const err = el.parentElement.querySelector('.err') || el.closest('.field2')?.querySelector('.err'); if (err) err.textContent = good ? '' : text; ok = ok && good; });
    const msg = $('.form-msg', f);
    if (!ok) { if (msg && !$('.err', f)) msg.textContent = fields[0][2]; return; }
    done(f, msg);
  });
  const isEmail = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  $$('.news-form').forEach(f => simpleForm(f, [['input', isEmail, 'Enter an email address like name@example.com']], (f, msg) => { msg.textContent = 'You are on the list. The next letter arrives at the start of the month.'; f.reset(); }));
  simpleForm($('#contact-form'), [['#c-name', v => !!v.trim(), 'Enter your name'], ['#c-email', isEmail, 'Enter an email address like name@example.com'], ['#c-msg', v => v.trim().length > 3, 'Write a message']],
    (f, msg) => { msg.textContent = 'Message sent. We reply within one working day.'; f.reset(); });

  // ---------- First paint ----------
  renderMoney(); renderBag(); renderCount();
})();
