// Aurelia Cloud Edition — front-end demo. No payments or personal data are collected or sent anywhere.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const U = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const money = v => `₹${Number(v).toLocaleString('en-IN')}`;
const safe = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FREE_SHIP = 4999;

let PRODUCTS = [
  { name: 'Amber Noir', price: 3499, cat: 'warm', notes: 'Amber · Saffron · Cedar', img: '1594035910387-fea47794261f', desc: 'A warm, smoky trail for nights that deserve to be remembered.', badge: 'BESTSELLER' },
  { name: 'Velvet Bloom', price: 2999, cat: 'floral', notes: 'Rose · Peony · Musk', img: '1547887538-e3a2f32cb1cc', desc: 'Petals at dusk, softened with a gentle, skin-close musk.' },
  { name: 'Citrus Muse', price: 2799, cat: 'fresh', notes: 'Bergamot · Neroli · Vetiver', img: '1592945403244-b3fbafd7f539', desc: 'Bright citrus and green woods, like morning opening its windows.' },
  { name: 'Midnight Oud', price: 3999, cat: 'warm', notes: 'Oud · Incense · Tonka', img: '1595425970377-c9703cf48b6d', desc: 'Deep woods and slow-burning incense with a velvet finish.' },
  { name: 'Solar Skin', price: 3199, cat: 'fresh', notes: 'Neroli · Salt · White Musk', img: '1615634260167-c8cdede054de', desc: 'A sun-warmed, airy scent with a soft mineral finish.', badge: 'NEW' },
  { name: 'Rose Nocturne', price: 3299, cat: 'floral', notes: 'Damask Rose · Plum · Patchouli', img: '1590736969955-71cc94901144', desc: 'Dark fruit and velvety rose, bold without ever being loud.' },
  { name: 'Cloud Vanilla', price: 2899, cat: 'warm', notes: 'Vanilla · Coconut milk · Sandalwood', img: '1608571423902-eed4a5ad8108', desc: 'Creamy and weightless, like a warm blanket made of mist.', badge: 'NEW' },
  { name: 'Green Mist', price: 2599, cat: 'fresh', notes: 'Green tea · Fig leaf · Mint', img: '1501004318641-b39e6451bec6', desc: 'Dewy leaves after rain — crisp, calm and clean.' },
  { name: 'Petal Silk', price: 2699, cat: 'floral', notes: 'Jasmine · Lily · Pear', img: '1490750967868-88aa4486c946', desc: 'A light floral that moves like silk in a breeze.' },
  { name: 'Ember Wood', price: 3599, cat: 'warm', notes: 'Birch · Leather · Amber', img: '1518531933037-91b2f5f229cc', desc: 'Campfire embers and polished wood, calm and confident.' },
  { name: 'Discovery Set', price: 1499, cat: 'gift', notes: '6 × 2ml mini vials', img: '1541643600914-78b084683601', desc: 'Sample six signatures before choosing your forever bottle.', badge: 'GIFT' },
  { name: 'Golden Hour Gift Box', price: 5999, cat: 'gift', notes: '2 × 50ml · Gift wrap · Note', img: '1594035910387-fea47794261f', desc: 'Two full bottles in signature packaging, ready to give.', badge: 'GIFT' }
];
PRODUCTS.push(
 { name: 'Saffron Dusk', price: 3399, cat: 'warm', notes: 'Saffron · Leather · Benzoin', img: '1523293182086-7651a899d37f', desc: 'Golden spice melting into soft suede.', badge: 'NEW' },
 { name: 'Iris Veil', price: 3099, cat: 'floral', notes: 'Iris · Violet · Cashmere wood', img: '1588405748880-12d1d2a59f75', desc: 'Powdery, quiet and impossibly smooth.' },
 { name: 'Sea Salt Drift', price: 2699, cat: 'fresh', notes: 'Sea salt · Grapefruit · Driftwood', img: '1557170334-a9632e77c6e4', desc: 'Cool spray over warm stone.' },
 { name: 'Tobacco Rain', price: 3699, cat: 'warm', notes: 'Tobacco · Rum · Vanilla', img: '1563170351-be82bc888aa4', desc: 'Sweet leaf and a late-night storm.', badge: 'BESTSELLER' }
);
// Load the product catalogue from the Express backend. The built-in catalogue remains as offline fallback.
async function syncProductsFromBackend() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Product API unavailable');
    const payload = await response.json();
    if (Array.isArray(payload.products) && payload.products.length) {
      PRODUCTS = payload.products;
      renderGrid();
      if (typeof renderBag === 'function') renderBag();
      const cube = document.querySelector('#cube');
      if (cube && typeof POOL !== 'undefined') {
        cube.innerHTML = POOL.slice(0, 6).map((id, i) => `<div><img referrerpolicy="no-referrer" src="${U(id, 600)}" alt="${safe(PRODUCTS[i]?.name || 'Aurelia fragrance')}"></div>`).join('');
      }
    }
  } catch (error) {
    console.info('Using built-in Aurelia catalogue:', error.message);
  }
}

const byName = n => PRODUCTS.find(p => p.name === n) || (n === 'Discovery Set' ? PRODUCTS[10] : null);

let bag = [], wishlist = [], toastT;
try { wishlist = JSON.parse(localStorage.getItem('ac-wish') || '[]').filter(n => byName(n)); } catch (e) {}
try { const s = JSON.parse(localStorage.getItem('ac-bag') || '[]'); if (Array.isArray(s)) bag = s.filter(x => byName(x.name) && x.quantity > 0).map(x => ({ name: x.name, quantity: Math.min(99, Math.floor(x.quantity)) })); } catch (e) {}
const persist = () => { try { localStorage.setItem('ac-bag', JSON.stringify(bag)); localStorage.setItem('ac-wish', JSON.stringify(wishlist)); } catch (e) {} };

function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }

/* ---------- Shop grid ---------- */
let filter = 'all', sort = 'feat', query = '';
function renderGrid() {
  let list = PRODUCTS.filter(p => (filter === 'all' || p.cat === filter) && (!query || [p.name, p.notes, p.desc].join(' ').toLowerCase().includes(query)));
  if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
  if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  $('#grid').innerHTML = list.map((p, i) => `
    <article class="card" data-tilt style="animation-delay:${i * 60}ms">
      <div class="pic"><img loading="lazy" src="${U(p.img, 700)}" alt="${safe(p.name)} perfume">${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
        <button class="wish ${wishlist.includes(p.name) ? 'on' : ''}" data-wish="${safe(p.name)}" aria-label="Toggle wishlist">${wishlist.includes(p.name) ? '♥' : '♡'}</button>
        <button class="qv" data-qv="${safe(p.name)}">Quick view</button></div>
      <div class="info"><h3>${safe(p.name)}</h3><span class="n">${safe(p.notes)}</span><span class="stars">★★★★★ <small>sample</small></span>
        <div class="buy"><span class="price">${money(p.price)}</span><button class="add" data-add="${safe(p.name)}">Add +</button></div></div>
    </article>`).join('');
  $('#resultCount').textContent = list.length ? `Showing ${list.length} of ${PRODUCTS.length} products` : 'No fragrances match your search yet.';
  initTilt();
}
$('#filters').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; filter = b.dataset.f; $$('.chip-btn').forEach(x => x.classList.toggle('active', x === b)); renderGrid(); });
$('#sort').addEventListener('change', e => { sort = e.target.value; renderGrid(); });
$$('[data-pick]').forEach(a => a.addEventListener('click', () => { filter = a.dataset.pick; $$('.chip-btn').forEach(x => x.classList.toggle('active', x.dataset.f === filter)); renderGrid(); }));

/* ---------- Bag ---------- */
function addToBag(name) {
  if (!byName(name)) return;
  const ex = bag.find(i => i.name === name);
  if (ex) ex.quantity = Math.min(99, ex.quantity + 1); else bag.push({ name, quantity: 1 });
  renderBag(); toast(`${name} added to your bag`);
}
function renderBag() {
  const count = bag.reduce((s, i) => s + i.quantity, 0);
  const sub = bag.reduce((s, i) => s + byName(i.name).price * i.quantity, 0);
  $('#bagCount').textContent = count; $('#subtotal').textContent = money(sub);
  const left = Math.max(0, FREE_SHIP - sub);
  $('#shipText').textContent = sub === 0 ? `Free shipping above ${money(FREE_SHIP)}` : left ? `Add ${money(left)} more for free shipping` : '🎉 You unlocked free shipping';
  $('#shipBar').style.width = Math.min(100, sub / FREE_SHIP * 100) + '%';
  $('#items').innerHTML = bag.length ? bag.map(i => { const p = byName(i.name); return `<div class="line"><img src="${U(p.img, 200)}" alt=""><div><h4>${safe(p.name)}</h4><p>${money(p.price)}</p><div class="qty"><button data-dec="${safe(p.name)}" aria-label="Decrease">−</button><span>${i.quantity}</span><button data-inc="${safe(p.name)}" aria-label="Increase">+</button></div></div><strong>${money(p.price * i.quantity)}</strong></div>`; }).join('') : '<p class="empty">Your bag is waiting for a signature scent.</p>';
  persist();
}
function drawer(open) { $('#drawer').classList.toggle('open', open); $('#overlay').classList.toggle('open', open); $('#drawer').setAttribute('aria-hidden', String(!open)); document.body.style.overflow = open ? 'hidden' : ''; }
$('#bagBtn').onclick = () => drawer(true); $('#closeBag').onclick = () => drawer(false); $('#overlay').onclick = () => drawer(false);
$('#items').addEventListener('click', e => {
  const inc = e.target.dataset.inc, dec = e.target.dataset.dec; const it = bag.find(i => i.name === (inc || dec)); if (!it) return;
  it.quantity += inc ? 1 : -1; it.quantity = Math.min(99, it.quantity); bag = bag.filter(i => i.quantity > 0); renderBag();
});
document.addEventListener('click', e => {
  const add = e.target.closest('[data-add]'); if (add) addToBag(add.dataset.add);
  const w = e.target.closest('[data-wish]'); if (w) toggleWish(w.dataset.wish);
  const q = e.target.closest('[data-qv]'); if (q) quickView(q.dataset.qv);
});

/* ---------- Wishlist ---------- */
function toggleWish(n) { wishlist = wishlist.includes(n) ? wishlist.filter(x => x !== n) : [...wishlist, n]; toast(wishlist.includes(n) ? 'Saved to wishlist' : 'Removed from wishlist'); updateWish(); renderGrid(); }
function updateWish() { $('#wishCount').textContent = wishlist.length; persist(); }
$('#wishBtn').onclick = () => {
  const items = wishlist.map(byName).filter(Boolean);
  modal(`<p class="kicker">YOUR CURATED EDIT</p><h2>Wishlist</h2>${items.length ? items.map(p => `<div class="wl"><span>${safe(p.name)} · ${money(p.price)}</span><button data-add="${safe(p.name)}">Add to bag +</button></div>`).join('') : '<p>Your wishlist is empty. Tap ♡ on any fragrance.</p>'}`);
};

/* ---------- Modal / quick view / checkout preview ---------- */
const modalEl = $('#modal');
function modal(html) { $('#modalBody').innerHTML = html; modalEl.classList.add('open'); modalEl.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; $('#modalX').focus(); }
function closeModal() { modalEl.classList.remove('open'); modalEl.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
$('#modalX').onclick = closeModal; modalEl.addEventListener('click', e => { if (e.target === modalEl) closeModal(); });
function quickView(n) { const p = byName(n); modal(`<img class="qv-img" src="${U(p.img, 900)}" alt="${safe(p.name)}"><p class="kicker">THE AURELIA COLLECTION</p><h2>${safe(p.name)}</h2><p><b>${safe(p.notes)}</b></p><p>${safe(p.desc)}</p><div class="qv-price">${money(p.price)}</div><button class="btn solid wide" data-add="${safe(p.name)}">Add to bag +</button>`); }
$('#checkout').onclick = () => {
  if (!bag.length) { toast('Add a fragrance to your bag first.'); return; }
  drawer(false);
  const total = bag.reduce((s, i) => s + byName(i.name).price * i.quantity, 0);
  modal(`<p class="kicker">CHECKOUT PREVIEW</p><h2>Almost <em>yours.</em></h2><p>${bag.reduce((s, i) => s + i.quantity, 0)} item(s) · ${money(total)}</p><div class="warn">DEMO ONLY — no order is placed, no payment is processed, and nothing you type is saved or sent. Do not enter real card or UPI details.</div>
  <form class="form" id="coForm"><label>Full name<input required maxlength="80" autocomplete="name"></label><label>Email<input type="email" required autocomplete="email"></label><label>Mobile<input required inputmode="numeric" pattern="[0-9]{10}" placeholder="10-digit number"></label><label>Address<textarea required rows="2"></textarea></label>
  <fieldset><legend>Payment style (visual preview only)</legend><label class="pay"><input type="radio" name="pay" value="UPI" checked> UPI</label><label class="pay"><input type="radio" name="pay" value="Card"> Credit / Debit card</label><label class="pay"><input type="radio" name="pay" value="COD"> Cash on delivery</label></fieldset>
  <button class="btn solid wide" type="submit">Preview order · ${money(total)}</button></form>`);
  $('#coForm').onsubmit = e => { e.preventDefault(); if (!e.currentTarget.reportValidity()) return; const m = new FormData(e.currentTarget).get('pay'); modal(`<p class="kicker">DEMO COMPLETE</p><h2>Preview <em>ready.</em></h2><p>You chose ${safe(m)} for this demonstration. No order was created and no data left your browser.</p><button class="btn solid wide" id="doneBtn">Continue shopping</button>`); $('#doneBtn').onclick = closeModal; };
};

/* ---------- Search ---------- */
const sp = $('#searchPanel');
const closeSearch = () => { sp.classList.remove('open'); sp.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
$('#searchBtn').onclick = () => { sp.classList.add('open'); sp.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; $('#q').focus(); };
$('#closeSearch').onclick = closeSearch;
$('#q').addEventListener('input', e => { query = e.target.value.toLowerCase().trim(); filter = 'all'; $$('.chip-btn').forEach(x => x.classList.toggle('active', x.dataset.f === 'all')); renderGrid(); const n = $$('.card').length; $('#qHint').textContent = `${n} fragrance${n === 1 ? '' : 's'} found. Press Enter to view.`; });
$('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { closeSearch(); $('#shop').scrollIntoView({ behavior: 'smooth' }); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeSearch(); drawer(false); } });

/* ---------- Nav ---------- */
$('#burger').onclick = e => { const o = $('#links').classList.toggle('open'); e.currentTarget.textContent = o ? '✕' : '☰'; e.currentTarget.setAttribute('aria-expanded', String(o)); };
$$('#links a').forEach(a => a.addEventListener('click', () => { $('#links').classList.remove('open'); $('#burger').textContent = '☰'; }));
$('#totop').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
$('#newsForm').addEventListener('submit', e => { e.preventDefault(); $('#newsMsg').textContent = `Thanks — ${$('#email').value} was entered in this demo. Nothing was sent or saved.`; $('#email').value = ''; toast('Thank you for your interest!'); });

/* ---------- 3D tilt ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function initTilt() {
  if (reduce) return;
  $$('[data-tilt]').forEach(el => {
    if (el._t) return; el._t = 1;
    el.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-4px)`; });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------- Hero bottle follows pointer ---------- */
const stage = $('#heroStage'), bottle = $('#bottle3d');
stage.addEventListener('pointermove', e => { if (reduce || e.pointerType === 'touch') return; const r = stage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; bottle.style.animationPlayState = 'paused'; bottle.style.transform = `rotateY(${x * 40}deg) rotateX(${-y * 20}deg)`; });
stage.addEventListener('pointerleave', () => { bottle.style.animationPlayState = 'running'; bottle.style.transform = ''; });

/* ---------- 3D ring carousel ---------- */
const CAR = PRODUCTS.slice(0, 8), carousel = $('#carousel'), N = CAR.length, STEP = 360 / N;
const RADIUS = () => Math.round(130 / Math.tan(Math.PI / N)) + 40;
carousel.innerHTML = CAR.map(p => `<div class="panel"><img loading="lazy" src="${U(p.img, 500)}" alt="${safe(p.name)}"><span>${safe(p.name)}</span></div>`).join('');
let idx = 0, rot = 0, auto = true, drag = null;
function layoutCar() { const r = RADIUS(); $$('.panel').forEach((p, i) => { p.style.transform = `rotateY(${i * STEP}deg) translateZ(${r}px)`; }); applyCar(); }
function applyCar() { carousel.style.transform = `translateZ(${-RADIUS()}px) rotateY(${rot}deg)`; const cur = ((Math.round(-rot / STEP) % N) + N) % N; $('#carName').textContent = CAR[cur].name; }
function goCar(d) { rot -= d * STEP; applyCar(); }
$('#next').onclick = () => { auto = false; goCar(1); }; $('#prev').onclick = () => { auto = false; goCar(-1); };
const scene = $('#scene');
scene.addEventListener('pointerdown', e => { drag = { x: e.clientX, r: rot }; auto = false; carousel.classList.add('drag'); scene.setPointerCapture(e.pointerId); });
scene.addEventListener('pointermove', e => { if (!drag) return; rot = drag.r + (e.clientX - drag.x) * .4; applyCar(); });
const endDrag = () => { if (!drag) return; drag = null; carousel.classList.remove('drag'); rot = Math.round(rot / STEP) * STEP; applyCar(); };
scene.addEventListener('pointerup', endDrag); scene.addEventListener('pointercancel', endDrag);
setInterval(() => { if (auto && !reduce && !document.hidden) goCar(1); }, 3200);
addEventListener('resize', layoutCar);

/* ---------- Scroll effects ---------- */
const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 });
$$('.reveal').forEach(el => io.observe(el));
const counted = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return; const el = en.target, end = +el.dataset.count; let n = 0; const step = Math.max(1, Math.ceil(end / 40));
  const t = setInterval(() => { n = Math.min(end, n + step); el.textContent = n; if (n >= end) clearInterval(t); }, 35); counted.unobserve(el);
}), { threshold: .6 });
$$('[data-count]').forEach(el => counted.observe(el));
const bannerImg = $('.banner>img');
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  $('#progress').style.width = (h > 0 ? y / h * 100 : 0) + '%';
  $('#nav').classList.toggle('scrolled', y > 10); $('#totop').classList.toggle('show', y > 700);
  if (!reduce) { const r = bannerImg.parentElement.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) bannerImg.style.transform = `translateY(${(r.top - innerHeight / 2) * -.12}px)`; }
}
addEventListener('scroll', onScroll, { passive: true });

/* ---------- Init ---------- */
renderGrid(); renderBag(); updateWish(); layoutCar(); initTilt(); onScroll();

/* ---------- Night Bloom extras ---------- */
const POOL = PRODUCTS.slice(0, 11).map(p => p.img);
addEventListener('load', () => setTimeout(() => $('#loader').classList.add('hide'), 500));
setTimeout(() => $('#loader').classList.add('hide'), 2500);
addEventListener('pointermove', e => { const g = $('#glow'); g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; });
(() => { const c = $('#fx'), x = c.getContext('2d'); let W, H, P = [];
  const size = () => { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; P = Array.from({ length: reduce ? 0 : 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() + .2, r: Math.random() * 2.2 + .6 })); };
  size(); addEventListener('resize', size);
  (function tick() { x.clearRect(0, 0, W, H); P.forEach(p => { p.y -= p.z * .5; p.x += Math.sin(p.y / 60) * .3; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; } x.beginPath(); x.arc(p.x, p.y, p.r * p.z, 0, 7); x.fillStyle = `rgba(255,${190 + (p.z * 40 | 0)},${140 + (p.z * 60 | 0)},${.25 + p.z * .4})`; x.fill(); }); requestAnimationFrame(tick); })(); })();
addEventListener('scroll', () => { if (reduce) return; const y = scrollY; $$('.chip').forEach((c, i) => c.style.translate = `0 ${y * (.05 + i * .03)}px`); }, { passive: true });
setInterval(() => { const n = new Date(), e = new Date(n); e.setHours(23, 59, 59, 999); const d = e - n, p = v => String(Math.floor(v)).padStart(2, '0'); $('#cdh').textContent = p(d / 36e5); $('#cdm').textContent = p(d / 6e4 % 60); $('#cds').textContent = p(d / 1e3 % 60); }, 1000);
const fq = $('#fq'), ans = {};
function finder(step) {
  if (step === 0) fq.innerHTML = `<h3>What mood are you in?</h3><div class="opts">${[['warm', 'Warm & smoky'], ['floral', 'Soft florals'], ['fresh', 'Fresh & airy'], ['gift', 'A gift']].map(o => `<button data-m="${o[0]}">${o[1]}</button>`).join('')}</div>`;
  if (step === 1) fq.innerHTML = `<h3>How loud should it be?</h3><div class="opts"><button data-s="soft">Close to skin</button><button data-s="bold">Fill the room</button></div>`;
  if (step === 2) { const l = PRODUCTS.filter(p => p.cat === ans.m).sort((a, b) => a.price - b.price), p = ans.s === 'soft' ? l[0] : l[l.length - 1];
    fq.innerHTML = `<div class="res"><img src="${U(p.img, 500)}" alt="${safe(p.name)}"><div><p class="kicker">YOUR MATCH</p><h3>${safe(p.name)}</h3><p>${safe(p.notes)}</p><p><b>${money(p.price)}</b></p><button class="btn solid" data-add="${safe(p.name)}">Add to bag +</button> <button class="btn ghost" data-again>Retake</button></div></div>`; }
}
fq.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.m) { ans.m = b.dataset.m; finder(1); } else if (b.dataset.s) { ans.s = b.dataset.s; finder(2); } else if ('again' in b.dataset) finder(0); });
finder(0);
$('#stripTrack').innerHTML = [...POOL, ...POOL].map(id => `<img loading="lazy" src="${U(id, 500)}" alt="">`).join('');
$('.masonry').addEventListener('click', e => { const i = e.target.closest('img'); if (!i) return; $('#lb img').src = i.src.replace('w=800', 'w=1400'); $('#lb').classList.add('open'); });
$('#lb').onclick = () => $('#lb').classList.remove('open');

/* ---------- Image safety net: any broken photo becomes a local bottle artwork ---------- */
const art = (t = '') => { let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) % 360; const a = `hsl(${h},60%,38%)`, b = `hsl(${(h + 50) % 360},70%,62%)`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='#120a20'/></linearGradient><linearGradient id='b' x1='0' x2='1'><stop offset='0' stop-color='${b}'/><stop offset='.5' stop-color='#fff' stop-opacity='.85'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='400' height='500' fill='url(#g)'/><rect x='170' y='90' width='60' height='50' rx='6' fill='#e6c180'/><rect x='185' y='135' width='30' height='25' fill='#b98b4a'/><rect x='110' y='155' width='180' height='260' rx='30' fill='url(#b)' opacity='.9'/><rect x='140' y='230' width='120' height='90' fill='#fbf0d8'/><text x='200' y='282' font-family='Georgia' font-size='16' text-anchor='middle' fill='#3a2616'>AURELIA</text><ellipse cx='200' cy='440' rx='90' ry='12' fill='#000' opacity='.35'/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg); };
const fixImg = i => { if (i.dataset.fb) return; i.dataset.fb = 1; i.removeAttribute('srcset'); i.loading = 'eager'; i.src = art(i.alt || i.src); };
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') fixImg(e.target); }, true);
const sweep = () => $$('img').forEach(i => { if (i.complete && i.naturalWidth === 0) fixImg(i); });
addEventListener('load', sweep); [1500, 4000, 9000].forEach(t => setTimeout(sweep, t));

/* ---------- Aurora v2 extras ---------- */
$('#cube').innerHTML = POOL.slice(0, 6).map((id, i) => `<div><img referrerpolicy="no-referrer" src="${U(id, 600)}" alt="${safe(PRODUCTS[i].name)}"></div>`).join('');
$('.sky').insertAdjacentHTML('beforeend', [[8,20],[22,70],[48,12],[70,60],[88,26],[60,85]].map((p, i) => `<i class="gem" style="left:${p[0]}%;top:${p[1]}%;animation-delay:${-i * 1.5}s;width:${28 + i * 7}px;height:${28 + i * 7}px"></i>`).join(''));
if (!reduce) $$('.btn').forEach(b => { b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * .2}px ${(e.clientY - r.top - r.height / 2) * .3}px`; }); b.addEventListener('pointerleave', () => b.style.translate = ''); });
new MutationObserver(() => { const c = $('#bagCount'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }).observe($('#bagCount'), { childList: true });

// Backend integration: refresh the catalogue after all UI handlers are ready.
syncProductsFromBackend();
