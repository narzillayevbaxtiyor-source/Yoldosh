'use strict';
/* ============ SOZLAMALAR (ochiq kalit — frontendda turishi xavfsiz) ============ */
const SB_URL = 'https://levetwginxirdqdnvshc.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxldmV0d2dpbnhpcmRxZG52c2hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2OTAyODgsImV4cCI6MjEwODI2NjI4OH0.v_eyC9d0QTvyjD9HKOVmIe4TPEttSMUV8hWBQMIdnC8';
const sb = supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

/* ============ YORDAMCHILAR ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { } } };
const S = {
  lang: ls.get('lang') || 'uz', theme: ls.get('theme') || '', country: ls.get('country') || null, city: ls.get('city') || '',
  countries: [], cities: [], user: null, profile: null, bot: null, tabs: {}, place: { cat: 'hospital' }, cache: {}, timer: null, prefill: null
};
const t = k => (T[k] && (T[k][S.lang] || T[k].uz)) || k;
const nm = r => r ? (r['name_' + S.lang] || r.name_uz) : '';
const CUR = ['USD', 'RUB', 'KZT', 'TRY', 'KRW', 'AED', 'PLN', 'GBP', 'EUR', 'UZS'];
const DEF_CUR = { russia: 'RUB', kazakhstan: 'KZT', turkey: 'TRY', korea: 'KRW', uae: 'AED', poland: 'PLN', uk: 'GBP' };
const GRAD = { russia: ['#2563eb', '#7c3aed'], kazakhstan: ['#0ea5e9', '#14b8a6'], turkey: ['#dc2626', '#f97316'], korea: ['#db2777', '#8b5cf6'], uae: ['#d97706', '#eab308'], poland: ['#e11d48', '#fb7185'], uk: ['#1d4ed8', '#4338ca'] };
const SECS = ['home', 'ticket', 'transfer', 'housing', 'jobs', 'places'];
const ICON = { home: '🏠', ticket: '✈️', transfer: '🚕', housing: '🛏️', jobs: '💼', places: '📍' };
const COL = { home: '#ea580c', ticket: '#2563eb', transfer: '#059669', housing: '#7c3aed', jobs: '#db2777', places: '#0891b2' };
const fmt = (p, c) => `${Number(p).toLocaleString('ru-RU')} ${esc(c || '')}`;
const fdate = d => { const x = new Date(d); return isNaN(x) ? '' : `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`; };
const fdt = d => { const x = new Date(d); return isNaN(x) ? '' : `${fdate(d)} ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; };
const sk = n => '<div class="sk"></div>'.repeat(n);
const empty = (em, txt) => `<div class="empty"><div class="em">${em}</div><p>${esc(txt)}</p></div>`;
const country = () => S.countries.find(c => c.slug === S.country);
const myCities = () => { const c = country(); return c ? S.cities.filter(x => x.country_id === c.id) : []; };
const cityOpts = (sel, all) => (all ? `<option value="">${t('all_cities')}</option>` : '') + myCities().map(c => `<option value="${c.id}" ${String(sel) === String(c.id) ? 'selected' : ''}>${esc(nm(c))}</option>`).join('');
const curOpts = sel => CUR.map(c => `<option ${c === sel ? 'selected' : ''}>${c}</option>`).join('');
const defCur = () => DEF_CUR[S.country] || 'USD';
const cityName = c => c ? nm(c) : '';
const tx = (r, f, k) => (r.tr && r.tr[S.lang] && r.tr[S.lang][k]) || r[f]; // AI tarjimasi bo'lsa o'shani ko'rsatamiz
async function aiCall(body) {
  let token = SB_KEY;
  try { const { data } = await sb.auth.getSession(); if (data.session) token = data.session.access_token; } catch (_) { }
  const r = await fetch(`${SB_URL}/functions/v1/ai`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: SB_KEY, authorization: 'Bearer ' + token }, body: JSON.stringify({ lang: S.lang, ...body }) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 429) throw new Error(t('ai_busy'));
  if (!r.ok || j.error) throw new Error(j.error === 'ai_off' ? t('ai_off') : t('err'));
  return j;
}

let toastT;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3500); }
function errMsg(e) {
  const m = String(e && e.message || e || '');
  if (/rate_limited/.test(m)) return t('rate_limited');
  if (/blocked/.test(m)) return t('blocked');
  if (/not_verified/.test(m)) return t('not_verified_err');
  if (/anonymous/i.test(m)) return t('anon_off');
  if (/row-level security/i.test(m)) return t('blocked');
  return m && m.length < 140 ? m : t('err');
}
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="sheet"><button class="x" data-act="close">✕</button>${html}</div>`; m.hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; }

/* ============ KIRISH (parolsiz, anonim) ============ */
async function auth() {
  let { data: { session } } = await sb.auth.getSession();
  if (!session) { const { data, error } = await sb.auth.signInAnonymously(); if (error) throw error; session = data.session; }
  S.user = session.user;
}
async function needAuth() { if (!S.user) await auth(); }
async function loadProfile() {
  if (!S.user) return;
  const { data } = await sb.from('profiles').select('*').eq('id', S.user.id).maybeSingle();
  S.profile = data;
}

/* ============ ALOQA ============ */
const digits = v => String(v || '').replace(/\D/g, '');
function tgLink(v) {
  v = String(v || '').trim();
  if (/^\+?\d[\d\s-]{6,}$/.test(v)) return 'https://t.me/+' + digits(v);
  return 'https://t.me/' + v.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '');
}
const waLink = v => 'https://wa.me/' + digits(v);
const contactFields = () => `
  <label>${t('telegram')}<input name="tg" autocomplete="off" maxlength="64" placeholder="@username / +998…" value="${esc(ls.get('tg') || '')}"></label>
  <label>${t('whatsapp')}<input name="wa" inputmode="tel" maxlength="20" placeholder="+998…" value="${esc(ls.get('wa') || '')}"></label>
  <small>${t('contact_hint')}</small>`;
async function mkContact(fd) {
  const tg = (fd.get('tg') || '').trim(), wa = (fd.get('wa') || '').trim();
  if (!tg && !wa) throw new Error(t('contact_req'));
  ls.set('tg', tg); ls.set('wa', wa);
  await needAuth();
  const { data, error } = await sb.from('contacts').insert({ owner: S.user.id, telegram: tg || null, whatsapp: wa || null }).select('id').single();
  if (error) throw error;
  return data.id;
}
async function revealContact(btn) {
  const out = btn.parentElement.querySelector('.contact-out') || btn.closest('.card,.sheet').querySelector('.contact-out');
  btn.disabled = true;
  try {
    await needAuth();
    const { data, error } = await sb.rpc('get_contact', { p_contact_id: btn.dataset.c });
    if (error) throw error;
    const c = data && data[0];
    if (!c) throw new Error(t('err'));
    out.innerHTML = (c.telegram ? `<a class="tg" target="_blank" rel="noopener" href="${esc(tgLink(c.telegram))}">✈️ ${t('write_tg')}</a>` : '') +
      (c.whatsapp ? `<a class="wa" target="_blank" rel="noopener" href="${esc(waLink(c.whatsapp))}">💬 ${t('write_wa')}</a>` : '');
    btn.hidden = true;
    if (btn.dataset.req) sb.from('ride_requests').update({ status: 'chosen' }).eq('id', btn.dataset.req).eq('status', 'open').then(() => { });
  } catch (e) { toast(errMsg(e)); btn.disabled = false; }
}

/* ============ RASM YUKLASH ============ */
async function shrink(file) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
}
async function uploadImages(files) {
  const urls = [];
  for (const [i, f] of [...files].slice(0, 5).entries()) {
    if (!f || !f.size) continue;
    const blob = await shrink(f);
    const path = `${S.user.id}/${Date.now()}-${i}.jpg`;
    const { error } = await sb.storage.from('images').upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    urls.push(sb.storage.from('images').getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

/* ============ CHROME (header, nav) ============ */
function drawChrome() {
  $('#langs').innerHTML = [['uz', 'UZ'], ['cyr', 'ЎЗ'], ['ru', 'RU']].map(([k, l]) => `<button data-act="lang" data-v="${k}" class="${S.lang === k ? 'on' : ''}">${l}</button>`).join('');
  $('#nav').innerHTML = SECS.map(s => `<a href="#/${s}" class="${S.route === s ? 'on' : ''}" style="--c:${COL[s]}"><span>${ICON[s]}</span>${t('nav_' + s)}</a>`).join('');
  $('#installBtn').hidden = isStandalone();
  document.documentElement.lang = S.lang === 'ru' ? 'ru' : 'uz';
  if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme;
}

/* ============ KARTALAR ============ */
function countryCard(c, i) {
  const g = GRAD[c.slug] || ['#ea580c', '#f59e0b'];
  const img = c.image_url ? `background-image:url('${esc(c.image_url)}');` : '';
  return `<button class="cc ${c.image_url ? 'img' : ''} ${S.country === c.slug ? 'on' : ''}" data-act="country" data-v="${esc(c.slug)}" style="--g1:${g[0]};--g2:${g[1]};${img}animation-delay:${i * 40}ms"><i>${esc(c.icon || '🌍')}</i><b>${esc(nm(c))}</b></button>`;
}
function dealCard(d) {
  S.cache[d.id] = d;
  return `<article class="deal" data-act="deal" data-id="${d.id}"><div class="rt">${esc(d.from_place)} → ${esc(d.to_place)}</div><div class="pr">${fmt(d.price, d.currency)}</div><small>📅 ${fdate(d.depart_date)}${d.airline ? ' · ' + esc(d.airline) : ''}</small><small>${t('updated')}: ${fdate(d.updated_at)} · ${t('hot_note')}</small></article>`;
}
function adCard(a) {
  return `<div class="card pad"><b>${esc(a.from_place)} → ${esc(a.to_place)}</b><div class="meta">${esc(cityName(a.cities))} · ${esc(a.drivers?.name || '')} · ${esc(a.drivers?.car_model || '')}</div><div class="price">${fmt(a.price, a.currency)}</div>${a.drivers ? `<button class="btn sm ghost" style="margin-top:8px" data-act="contact" data-c="${a.drivers.contact_id}">${t('contact_btn')}</button><div class="contact-out"></div>` : ''}</div>`;
}
function hCard(h) {
  S.cache[h.id] = h;
  return `<article class="card h" data-act="open-h" data-id="${h.id}">${h.images?.[0] ? `<img loading="lazy" src="${esc(h.images[0])}" alt="">` : '<div class="ph">🏠</div>'}<div class="b"><h3>${esc(tx(h, 'title', 'title'))}</h3><div class="meta">${esc(cityName(h.cities))}${h.area ? ' · ' + esc(h.area) : ''}</div><div class="tags"><span>${t('kind_' + h.kind)}</span><span>${t('aud_' + h.audience)}</span></div><div class="price">${fmt(h.price, h.currency)}</div></div></article>`;
}
function jCard(j) {
  S.cache[j.id] = j;
  return `<article class="card j" data-act="open-j" data-id="${j.id}"><div class="b"><h3>${esc(tx(j, 'title', 'title'))}</h3><div class="meta">${esc(cityName(j.cities))}${j.employer ? ' · ' + esc(j.employer) : ''}</div><div class="tags"><span>${t('sec_' + j.sector)}</span>${j.housing_provided ? `<span>🏠 ${t('housing_provided')}</span>` : ''}</div>${j.salary ? `<div class="price">${fmt(j.salary, j.currency)}</div>` : ''}</div></article>`;
}
const cityEmbed = 'cities!inner(country_id,name_uz,name_cyr,name_ru)';

/* ============ SAHIFALAR ============ */
const PAGES = {};
function needCountry(v) {
  if (country()) return country();
  v.innerHTML = empty('🌍', t('pick_country_first')) + `<a class="btn" style="display:block;text-align:center;text-decoration:none" href="#/home">${t('go_home')}</a>`;
  return null;
}

PAGES.home = async v => {
  const c = country();
  v.innerHTML = `<section class="hero"><h1>${t('choose_country')}</h1><p>${t('choose_country_sub')}</p></section>
  ${isStandalone() ? '' : `<button class="btn ghost" style="margin-bottom:12px" data-act="install">📲 ${t('install_btn')}</button>`}
  <div class="cgrid">${S.countries.map(countryCard).join('')}</div>
  <h3 class="sh">${t('hot_title')}</h3><div id="h-hot" class="car">${sk(1)}</div>
  <h3 class="sh">${t('cheap_transfer')}<a href="#/transfer">${t('see_all')}</a></h3><div id="h-tr">${sk(2)}</div>
  <h3 class="sh">${t('new_housing')}<a href="#/housing">${t('see_all')}</a></h3><div id="h-h">${sk(2)}</div>
  <h3 class="sh">${t('new_jobs')}<a href="#/jobs">${t('see_all')}</a></h3><div id="h-j">${sk(2)}</div>
  <h3 class="sh">${t('how_title')}</h3>
  <div class="how">${[1, 2, 3, 4].map(n => `<div><span class="n">${['🌍', '✈️', '🚕', '🏠'][n - 1]}</span><span><b>${n}. ${t('hw' + n)}</b><small>${t('hw' + n + 'd')}</small></span></div>`).join('')}</div>`;
  const cid = c && c.id;
  const filt = q => cid ? q.eq('cities.country_id', cid) : q;
  const today = new Date().toISOString().slice(0, 10);
  (async () => {
    let q = sb.from('hot_deals').select('*').eq('active', true).gte('depart_date', today).order('depart_date').limit(10);
    if (cid) q = q.eq('country_id', cid);
    const { data } = await q; const el = $('#h-hot'); if (!el) return;
    if (data && data.length) el.innerHTML = data.map(dealCard).join(''); else { el.classList.remove('car'); el.innerHTML = empty('🔥', t('empty_hot')); }
  })();
  (async () => {
    const { data } = await filt(sb.from('route_ads').select(`id,from_place,to_place,price,currency,${cityEmbed},drivers(name,car_model,contact_id)`).eq('active', true).order('price').limit(4));
    const el = $('#h-tr'); if (!el) return;
    el.innerHTML = data && data.length ? data.map(adCard).join('') : empty('🚕', t('empty_transfer'));
  })();
  (async () => {
    const { data } = await filt(sb.from('housing').select(`*,${cityEmbed}`).eq('status', 'approved').order('created_at', { ascending: false }).limit(4));
    const el = $('#h-h'); if (!el) return;
    el.innerHTML = data && data.length ? data.map(hCard).join('') : empty('🏠', t('empty_housing'));
  })();
  (async () => {
    const { data } = await filt(sb.from('jobs').select(`*,${cityEmbed}`).eq('status', 'approved').order('created_at', { ascending: false }).limit(4));
    const el = $('#h-j'); if (!el) return;
    el.innerHTML = data && data.length ? data.map(jCard).join('') : empty('💼', t('empty_jobs'));
  })();
};

/* ---------- BILET ---------- */
PAGES.ticket = async v => {
  const p = S.prefill || {}; S.prefill = null;
  v.innerHTML = `<h2 class="pt">✈️ ${t('ticket_title')}</h2><div class="warn" style="background:var(--accs);color:var(--acc)">${t('ticket_note')}</div>
  <div class="card pad" style="margin-bottom:12px"><textarea id="aitxt" maxlength="400" placeholder="${esc(t('ai_fill_ph'))}"></textarea><button class="btn ghost" style="margin-top:8px" data-act="aifill">${t('ai_fill')}</button></div>
  <form class="card pad" data-form="ticket">
    <div class="row"><label>${t('from')}<input name="from" required maxlength="80" value="${esc(p.from || '')}"></label><label>${t('to')}<input name="to" required maxlength="80" value="${esc(p.to || '')}"></label></div>
    <div class="row"><label>${t('date')}<input type="date" name="date" required min="${new Date().toISOString().slice(0, 10)}" value="${esc(p.date || '')}"></label>
    <label>${t('pax')}<select name="pax">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<option>${n}</option>`).join('')}</select></label></div>
    <label>${t('name')}<input name="name" required minlength="2" maxlength="60" value="${esc(ls.get('name') || '')}"></label>
    ${contactFields()}
    <button class="btn" type="submit">${t('send')}</button>
  </form>`;
};

/* ---------- TRANSFER ---------- */
PAGES.transfer = async v => {
  if (!needCountry(v)) return;
  try { await auth(); await loadProfile(); } catch (e) { /* anonim kirish o'chiq bo'lishi mumkin */ }
  const tab = S.tabs.transfer || 'pass';
  v.innerHTML = `<h2 class="pt">🚕 ${t('transfer_title')}</h2>${seg('transfer', [['pass', t('passenger')], ['drv', t('driver')]], tab)}<div id="tr"></div>`;
  const el = $('#tr');
  if (!S.user) { el.innerHTML = empty('🔒', t('anon_off')); return; }
  if (tab === 'drv') await drvTab(el); else await passTab(el);
};
const seg = (pg, items, cur) => `<div class="seg">${items.map(([k, l]) => `<button data-act="tab" data-pg="${pg}" data-v="${k}" class="${cur === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
const verifyBanner = () => S.profile && !S.profile.verified ? `<div class="warn"><b>${t('verify_title')}</b><br>${t('verify_text')}<br><button class="btn sm" style="margin-top:8px" data-act="verify">✈️ ${t('verify_btn')}</button></div>` : '';
const profileForm = role => `<form class="card pad" data-form="profile"><h3>${t('profile_title')}</h3><input type="hidden" name="role" value="${role}">
  <label>${t('name')}<input name="name" required minlength="2" maxlength="60" value="${esc(ls.get('name') || '')}"></label>${contactFields()}<button class="btn" type="submit">${t('send')}</button></form>`;

async function passTab(el) {
  if (!S.profile) { el.innerHTML = profileForm('passenger'); return; }
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  el.innerHTML = `${verifyBanner()}<form class="card pad" data-form="ride"><h3>${t('tr_new')}</h3>
    <label>${t('city')}<select name="city" required>${cityOpts(S.city)}</select></label>
    <div class="row"><label>${t('from')}<input name="from" required maxlength="150"></label><label>${t('to')}<input name="to" required maxlength="150"></label></div>
    <div class="row"><label>${t('when')}<input type="datetime-local" name="when" required min="${now}"></label><label>${t('pax')}<select name="pax">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option>${n}</option>`).join('')}</select></label></div>
    <label class="chk"><input type="checkbox" name="lug"> ${t('luggage')}</label><button class="btn" type="submit">${t('send')}</button></form>
  <h3 class="sh">${t('my_requests')}<a href="#" data-act="reload">🔄 ${t('refresh')}</a></h3><div id="myreq">${sk(1)}</div>
  <h3 class="sh">${t('route_ads')}</h3><div id="ads">${sk(1)}</div>`;
  loadMyReq(); loadAds();
  S.timer = setInterval(loadMyReq, 20000);
}
async function loadMyReq() {
  const el = $('#myreq'); if (!el || !S.user) return;
  const [{ data }, { data: rv }] = await Promise.all([
    sb.from('ride_requests').select('*,cities(name_uz,name_cyr,name_ru),ride_offers(id,price,currency,note,driver_id,drivers(name,car_model,car_color,plate,rating_avg,rating_count,contact_id))').eq('passenger_id', S.user.id).order('created_at', { ascending: false }).limit(10),
    sb.from('reviews').select('request_id').eq('passenger_id', S.user.id)]);
  if ($('#modal').hidden === false) return; // modal ochiq bo'lsa yangilamaymiz
  if (!data || !data.length) { el.innerHTML = empty('🧳', t('empty_requests')); return; }
  const rated = new Set((rv || []).map(x => x.request_id));
  el.innerHTML = data.map(r => {
    S.cache[r.id] = r;
    const offs = [...(r.ride_offers || [])].sort((a, b) => a.price - b.price);
    const offHtml = r.status === 'cancelled' ? '' : offs.length ? offs.map((o, i) => `<div class="offer ${i === 0 ? 'best' : ''}">${i === 0 ? `<span class="badge">🔥 ${t('cheapest')}</span> ` : ''}<b>${fmt(o.price, o.currency)}</b>
      <div class="meta">${esc(o.drivers?.name)} · ${esc(o.drivers?.car_model)} ${esc(o.drivers?.car_color)} · ${esc(o.drivers?.plate)} · ⭐ ${Number(o.drivers?.rating_avg || 0).toFixed(1)} (${o.drivers?.rating_count || 0})</div>${o.note ? `<div class="meta">“${esc(o.note)}”</div>` : ''}
      <button class="btn sm" style="margin-top:6px" data-act="contact" data-c="${o.drivers?.contact_id}" data-req="${r.id}">${t('contact_btn')}</button> <button class="lnk" data-act="report" data-type="driver" data-id="${o.driver_id}">${t('report')}</button><div class="contact-out"></div></div>`).join('') : `<p class="meta" style="margin-top:8px">⏳ ${t('no_offers')}</p>`;
    const act = r.status === 'chosen' ? `<button class="btn sm ghost" data-act="done" data-id="${r.id}">✅ ${t('trip_done')}</button> ` : '';
    const rate = r.status === 'done' && !rated.has(r.id) && offs.length ? `<button class="btn sm ghost" data-act="rate" data-id="${r.id}">⭐ ${t('rate_btn')}</button> ` : '';
    const cancel = r.status === 'open' ? `<button class="lnk" data-act="cancel" data-id="${r.id}">${t('cancel_req')}</button>` : '';
    return `<div class="card pad"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(r.from_place)} → ${esc(r.to_place)}</b><span class="st">${t('st_' + r.status)}</span></div>
      <div class="meta">${esc(cityName(r.cities))} · ${fdt(r.ride_at)} · ${r.pax} ${t('pax_short')}${r.luggage ? ' · 🧳' : ''}</div>${offHtml}<div style="margin-top:8px">${act}${rate}${cancel}</div></div>`;
  }).join('');
}
async function loadAds() {
  const c = country(); const el = $('#ads'); if (!el) return;
  const { data } = await sb.from('route_ads').select(`id,from_place,to_place,price,currency,${cityEmbed},drivers(name,car_model,contact_id)`).eq('active', true).eq('cities.country_id', c.id).order('price').limit(20);
  el.innerHTML = data && data.length ? data.map(adCard).join('') : empty('🛣️', t('empty_transfer'));
}

async function drvTab(el) {
  const { data: d } = await sb.from('drivers').select('*').eq('user_id', S.user.id).maybeSingle();
  if (!d) {
    const c = country();
    el.innerHTML = `<form class="card pad" data-form="driver"><h3>${t('reg_driver')}</h3>
      <label>${t('name')}<input name="name" required minlength="2" maxlength="60" value="${esc(ls.get('name') || '')}"></label>
      <div class="row"><label>${t('car_model')}<input name="model" required maxlength="40"></label><label>${t('car_color')}<input name="color" required maxlength="30"></label></div>
      <label>${t('plate')}<input name="plate" required maxlength="20"></label>
      <div class="row"><label>${t('country')}<select name="country" data-citysel="dcity">${S.countries.map(x => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(nm(x))}</option>`).join('')}</select></label>
      <label>${t('city')}<select name="city" id="dcity" required>${cityOpts(S.city)}</select></label></div>
      ${contactFields()}<button class="btn" type="submit">${t('send')}</button></form>`;
    return;
  }
  const { data: reqs } = await sb.from('ride_requests').select('*').eq('city_id', d.city_id).eq('status', 'open').order('ride_at').limit(30);
  const ids = (reqs || []).map(r => r.id);
  const { data: mine } = ids.length ? await sb.from('ride_offers').select('request_id,price,currency').eq('driver_id', S.user.id).in('request_id', ids) : { data: [] };
  const mo = Object.fromEntries((mine || []).map(o => [o.request_id, o]));
  const { data: ads } = await sb.from('route_ads').select('*').eq('driver_id', S.user.id).order('created_at', { ascending: false });
  el.innerHTML = `${verifyBanner()}
  <div class="card pad"><b>${esc(d.name)}</b> · ${esc(d.car_model)} ${esc(d.car_color)} · ${esc(d.plate)}<div class="meta">⭐ ${Number(d.rating_avg).toFixed(1)} (${d.rating_count}) · ${S.profile?.verified ? '✅ ' + t('verified') : '⚠️ ' + t('not_verified')}</div></div>
  <button class="online ${d.online ? 'on' : ''}" data-act="online" data-v="${d.online ? 0 : 1}">${d.online ? '🟢 ' + t('you_online') + ' — ' + t('go_offline') : '⚪ ' + t('you_offline') + ' — ' + t('go_online')}</button>
  <h3 class="sh">${t('open_requests')}<a href="#" data-act="reload">🔄 ${t('refresh')}</a></h3>
  ${reqs && reqs.length ? reqs.map(r => `<form class="card pad" data-form="offer" data-req="${r.id}"><b>${esc(r.from_place)} → ${esc(r.to_place)}</b><div class="meta">${fdt(r.ride_at)} · ${r.pax} ${t('pax_short')}${r.luggage ? ' · 🧳' : ''}</div>
    ${mo[r.id] ? `<div class="meta">${t('your_offer')}: <b>${fmt(mo[r.id].price, mo[r.id].currency)}</b></div>` : ''}
    <div class="row"><label>${t('price')}<input name="price" type="number" min="1" step="any" inputmode="decimal" required value="${mo[r.id] ? mo[r.id].price : ''}"></label><label>${t('currency')}<select name="cur">${curOpts(mo[r.id]?.currency || defCur())}</select></label></div>
    <input name="note" maxlength="200" placeholder="${t('note')}"><button class="btn" type="submit">${t('offer_btn')}</button></form>`).join('') : empty('📭', t('empty_open'))}
  <h3 class="sh">${t('route_ads')}</h3>
  <form class="card pad" data-form="route"><div class="row"><label>${t('from')}<input name="from" required maxlength="100"></label><label>${t('to')}<input name="to" required maxlength="100"></label></div>
    <div class="row"><label>${t('price')}<input name="price" type="number" min="1" step="any" inputmode="decimal" required></label><label>${t('currency')}<select name="cur">${curOpts(defCur())}</select></label></div>
    <button class="btn" type="submit">${t('add_route')}</button></form>
  ${(ads || []).map(a => `<div class="card pad" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span><b>${esc(a.from_place)} → ${esc(a.to_place)}</b><br><span class="price">${fmt(a.price, a.currency)}</span></span><button class="lnk" data-act="delroute" data-id="${a.id}">${t('delete')}</button></div>`).join('')}`;
}

/* ---------- UY ---------- */
PAGES.housing = async v => {
  if (!needCountry(v)) return;
  const tab = S.tabs.housing || 's';
  v.innerHTML = `<h2 class="pt">🛏️ ${t('housing_title')}</h2>${seg('housing', [['s', t('search_tab')], ['p', t('post_tab_housing')]], tab)}<div id="hb"></div>`;
  const el = $('#hb');
  if (tab === 'p') { el.innerHTML = housingForm(); return; }
  el.innerHTML = `<form class="card pad" data-form="hsearch" data-auto="1"><div class="row"><label>${t('city')}<select name="city">${cityOpts(S.city, true)}</select></label>
    <label>${t('kind')}<select name="kind"><option value="">${t('any')}</option>${['apartment', 'room', 'bed'].map(k => `<option value="${k}">${t('kind_' + k)}</option>`).join('')}</select></label></div>
    <div class="row"><label>${t('price_min')}<input name="min" type="number" min="0" inputmode="decimal"></label><label>${t('price_max')}<input name="max" type="number" min="0" inputmode="decimal"></label></div>
    <label>${t('audience')}<select name="aud"><option value="">${t('any')}</option>${['men', 'women', 'family'].map(k => `<option value="${k}">${t('aud_' + k)}</option>`).join('')}</select></label></form><div id="hres">${sk(2)}</div>`;
  FORMS.hsearch($('form[data-form=hsearch]'));
};
const housingForm = () => `<form class="card pad" data-form="hpost"><div class="warn">${t('warn_housing')}</div>
  <label>${t('title')}<input name="title" required maxlength="120"></label>
  <div class="row"><label>${t('city')}<select name="city" required>${cityOpts(S.city)}</select></label><label>${t('area')}<input name="area" maxlength="80"></label></div>
  <div class="row"><label>${t('price')}<input name="price" type="number" min="0" step="any" inputmode="decimal" required></label><label>${t('currency')}<select name="cur">${curOpts(defCur())}</select></label></div>
  <div class="row"><label>${t('kind')}<select name="kind">${['apartment', 'room', 'bed'].map(k => `<option value="${k}">${t('kind_' + k)}</option>`).join('')}</select></label>
  <label>${t('audience')}<select name="aud">${['any', 'men', 'women', 'family'].map(k => `<option value="${k}">${t('aud_' + k)}</option>`).join('')}</select></label></div>
  <label>${t('description')}<textarea name="desc" maxlength="2000"></textarea></label>
  <label>${t('photos')}<input type="file" name="photos" accept="image/*" multiple></label>
  <label>${t('name')}<input name="name" required minlength="2" maxlength="60" value="${esc(ls.get('name') || '')}"></label>${contactFields()}
  <button class="btn" type="submit">${t('send')}</button></form>`;

/* ---------- ISH ---------- */
PAGES.jobs = async v => {
  if (!needCountry(v)) return;
  const tab = S.tabs.jobs || 's';
  v.innerHTML = `<h2 class="pt">💼 ${t('jobs_title')}</h2>${seg('jobs', [['s', t('search_tab')], ['p', t('post_tab_job')]], tab)}<div id="jb"></div>`;
  const el = $('#jb');
  const SEC = ['construction', 'warehouse', 'factory', 'driver', 'kitchen', 'agriculture', 'other'];
  if (tab === 'p') {
    el.innerHTML = `<form class="card pad" data-form="jpost"><div class="warn">${t('warn_job')}</div>
    <label>${t('job_title')}<input name="title" required maxlength="120"></label>
    <div class="row"><label>${t('city')}<select name="city" required>${cityOpts(S.city)}</select></label><label>${t('sector')}<select name="sector">${SEC.map(k => `<option value="${k}">${t('sec_' + k)}</option>`).join('')}</select></label></div>
    <div class="row"><label>${t('salary')}<input name="salary" type="number" min="0" step="any" inputmode="decimal"></label><label>${t('currency')}<select name="cur">${curOpts(defCur())}</select></label></div>
    <label>${t('schedule')}<input name="sched" maxlength="100"></label>
    <label>${t('requirements')}<textarea name="req" maxlength="2000"></textarea></label>
    <label class="chk"><input type="checkbox" name="hous"> ${t('housing_provided')}</label>
    <label>${t('employer')}<input name="emp" maxlength="100"></label>${contactFields()}
    <button class="btn" type="submit">${t('send')}</button></form>`;
    return;
  }
  el.innerHTML = `<form class="card pad" data-form="jsearch" data-auto="1"><div class="row"><label>${t('city')}<select name="city">${cityOpts(S.city, true)}</select></label>
    <label>${t('sector')}<select name="sector"><option value="">${t('any')}</option>${SEC.map(k => `<option value="${k}">${t('sec_' + k)}</option>`).join('')}</select></label></div>
    <div class="row"><label>${t('salary_min')}<input name="min" type="number" min="0" inputmode="decimal"></label><label class="chk" style="padding-top:20px"><input type="checkbox" name="hous"> ${t('housing_provided')}</label></div></form><div id="jres">${sk(2)}</div>`;
  FORMS.jsearch($('form[data-form=jsearch]'));
};

/* ---------- JOYLAR ---------- */
PAGES.places = async v => {
  const c = needCountry(v); if (!c) return;
  const cities = myCities();
  if (!S.city || !cities.find(x => String(x.id) === String(S.city))) S.city = cities[0] ? String(cities[0].id) : '';
  const cats = ['hospital', 'mosque', 'restaurant', 'money'], ci = { hospital: '🏥', mosque: '🕌', restaurant: '🍲', money: '💸' };
  v.innerHTML = `<h2 class="pt">📍 ${t('places_title')}</h2>
  <div class="chips">${cities.map(x => `<button data-act="pcity" data-v="${x.id}" class="${String(x.id) === String(S.city) ? 'on' : ''}">${esc(nm(x))}</button>`).join('')}</div>
  <div class="chips">${cats.map(k => `<button data-act="pcat" data-v="${k}" class="${S.place.cat === k ? 'on' : ''}">${ci[k]} ${t('cat_' + k)}</button>`).join('')}</div><div id="pl">${sk(2)}</div>`;
  const { data } = await sb.from('places').select('*,cities(name_uz,name_cyr,name_ru)').eq('active', true).eq('city_id', S.city).eq('category', S.place.cat).order('name');
  const pl = $('#pl'); if (!pl) return;
  pl.innerHTML = data && data.length ? data.map(p => {
    const map = p.map_url || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.name + ' ' + (p.address || ''));
    return `<div class="card">${p.image_url ? `<img loading="lazy" src="${esc(p.image_url)}" alt="" style="width:100%;height:130px;object-fit:cover;display:block">` : ''}<div class="b"><h3>${ci[p.category]} ${esc(p.name)}</h3>
    ${p.address ? `<div class="meta">📍 ${esc(p.address)}</div>` : ''}${p.hours ? `<div class="meta">🕒 ${esc(p.hours)}</div>` : ''}${p.phone ? `<div class="meta">📞 <a href="tel:${esc(p.phone)}">${esc(p.phone)}</a></div>` : ''}
    <a class="btn sm ghost" style="display:inline-block;margin-top:8px;text-decoration:none" target="_blank" rel="noopener" href="${esc(map)}">🗺️ ${t('open_map')}</a></div></div>`;
  }).join('') : empty(ci[S.place.cat], t('empty_places'));
};

/* ============ FORMALAR ============ */
const FORMS = {};
FORMS.ticket = async f => {
  const fd = new FormData(f); const cid = await mkContact(fd);
  ls.set('name', fd.get('name').trim());
  const { error } = await sb.from('ticket_orders').insert({ user_id: S.user.id, name: fd.get('name').trim(), from_place: fd.get('from').trim(), to_place: fd.get('to').trim(), travel_date: fd.get('date'), pax: +fd.get('pax'), contact_id: cid });
  if (error) throw error;
  f.outerHTML = `<div class="card radar"><div class="pl">✈️</div><div class="dots"><span></span><span></span><span></span></div><p style="margin-top:12px;font-weight:600">${t('ticket_searching')}</p><button class="btn ghost" style="margin-top:14px" data-act="newticket">${t('new_request')}</button></div>`;
};
FORMS.profile = async f => {
  const fd = new FormData(f); await needAuth(); await mkContact(fd);
  const name = fd.get('name').trim(); ls.set('name', name);
  const { error } = await sb.from('profiles').insert({ id: S.user.id, name, role: fd.get('role') });
  if (error) throw error;
  await loadProfile(); render();
};
FORMS.ride = async f => {
  const fd = new FormData(f); S.city = fd.get('city'); ls.set('city', S.city);
  const { error } = await sb.from('ride_requests').insert({ passenger_id: S.user.id, city_id: +fd.get('city'), from_place: fd.get('from').trim(), to_place: fd.get('to').trim(), ride_at: new Date(fd.get('when')).toISOString(), pax: +fd.get('pax'), luggage: fd.get('lug') === 'on' });
  if (error) throw error;
  f.reset(); toast(t('sent_ok')); loadMyReq();
};
FORMS.driver = async f => {
  const fd = new FormData(f); await needAuth();
  const name = fd.get('name').trim(); ls.set('name', name);
  const cid = await mkContact(fd);
  if (!S.profile) { const { error } = await sb.from('profiles').insert({ id: S.user.id, name, role: 'driver' }); if (error) throw error; await loadProfile(); }
  const { error } = await sb.from('drivers').insert({ user_id: S.user.id, name, car_model: fd.get('model').trim(), car_color: fd.get('color').trim(), plate: fd.get('plate').trim().toUpperCase(), contact_id: cid, country_id: +fd.get('country'), city_id: +fd.get('city') });
  if (error) throw error;
  toast(t('saved')); render();
};
FORMS.offer = async f => {
  const fd = new FormData(f);
  const { error } = await sb.from('ride_offers').upsert({ request_id: f.dataset.req, driver_id: S.user.id, price: +fd.get('price'), currency: fd.get('cur'), note: (fd.get('note') || '').trim() || null }, { onConflict: 'request_id,driver_id' });
  if (error) throw error;
  toast(t('sent_ok')); render();
};
FORMS.route = async f => {
  const fd = new FormData(f);
  const { data: d } = await sb.from('drivers').select('city_id').eq('user_id', S.user.id).single();
  const { error } = await sb.from('route_ads').insert({ driver_id: S.user.id, city_id: d.city_id, from_place: fd.get('from').trim(), to_place: fd.get('to').trim(), price: +fd.get('price'), currency: fd.get('cur') });
  if (error) throw error;
  toast(t('saved')); render();
};
function drawChat(typing) {
  const el = $('#chatlog'); if (!el) return;
  el.innerHTML = `<div class="msg a">${esc(t('chat_welcome'))}</div>` + S.chat.map(m => `<div class="msg ${m.role === 'user' ? 'u' : 'a'}">${esc(m.content)}</div>`).join('') + (typing ? '<div class="msg a"><span class="dots"><span></span><span></span><span></span></span></div>' : '');
  el.scrollTop = el.scrollHeight;
}
FORMS.chat = async f => {
  const inp = f.elements.q, q = inp.value.trim(); if (!q) return;
  inp.value = ''; S.chat.push({ role: 'user', content: q }); drawChat(true);
  try {
    const c = country();
    const { reply } = await aiCall({ action: 'chat', country: c ? c.name_ru : '', messages: S.chat.slice(-8) });
    S.chat.push({ role: 'assistant', content: reply || t('err') });
  } catch (e) { S.chat.push({ role: 'assistant', content: '⚠️ ' + errMsg(e) }); }
  drawChat();
};
FORMS.review = async f => {
  const fd = new FormData(f);
  const { error } = await sb.from('reviews').insert({ request_id: fd.get('req'), driver_id: fd.get('driver'), passenger_id: S.user.id, stars: +fd.get('stars'), comment: (fd.get('comment') || '').trim() || null });
  if (error) throw error;
  closeModal(); toast(t('thanks')); loadMyReq();
};
FORMS.report = async f => {
  const fd = new FormData(f);
  await needAuth();
  const { error } = await sb.from('complaints').insert({ target_type: fd.get('type'), target_id: fd.get('id'), reason: fd.get('reason').trim() });
  if (error) throw error;
  closeModal(); toast(t('report_sent'));
};
FORMS.hsearch = async f => {
  const fd = new FormData(f); const c = country();
  let q = sb.from('housing').select(`*,${cityEmbed}`).eq('status', 'approved').eq('cities.country_id', c.id).order('created_at', { ascending: false }).limit(40);
  if (fd.get('city')) { q = q.eq('city_id', +fd.get('city')); S.city = fd.get('city'); ls.set('city', S.city); }
  if (fd.get('kind')) q = q.eq('kind', fd.get('kind'));
  if (fd.get('aud')) q = q.in('audience', [fd.get('aud'), 'any']);
  if (fd.get('min')) q = q.gte('price', +fd.get('min'));
  if (fd.get('max')) q = q.lte('price', +fd.get('max'));
  const { data, error } = await q; if (error) throw error;
  $('#hres').innerHTML = data.length ? data.map(hCard).join('') : empty('🏠', t('empty_housing'));
};
FORMS.jsearch = async f => {
  const fd = new FormData(f); const c = country();
  let q = sb.from('jobs').select(`*,${cityEmbed}`).eq('status', 'approved').eq('cities.country_id', c.id).order('created_at', { ascending: false }).limit(40);
  if (fd.get('city')) { q = q.eq('city_id', +fd.get('city')); S.city = fd.get('city'); ls.set('city', S.city); }
  if (fd.get('sector')) q = q.eq('sector', fd.get('sector'));
  if (fd.get('min')) q = q.gte('salary', +fd.get('min'));
  if (fd.get('hous')) q = q.eq('housing_provided', true);
  const { data, error } = await q; if (error) throw error;
  $('#jres').innerHTML = data.length ? data.map(jCard).join('') : empty('💼', t('empty_jobs'));
};
FORMS.hpost = async f => {
  const fd = new FormData(f); await needAuth();
  const name = fd.get('name').trim(); ls.set('name', name);
  const cid = await mkContact(fd);
  const images = await uploadImages(f.elements.photos.files);
  const { error } = await sb.from('housing').insert({ owner_id: S.user.id, title: fd.get('title').trim(), city_id: +fd.get('city'), area: (fd.get('area') || '').trim() || null, price: +fd.get('price'), currency: fd.get('cur'), kind: fd.get('kind'), audience: fd.get('aud'), description: (fd.get('desc') || '').trim() || null, images, poster_name: name, contact_id: cid, status: 'pending' });
  if (error) throw error;
  f.outerHTML = `<div class="card radar"><div class="pl">🏠</div><p style="font-weight:600">${t('posted_housing')}</p></div>`;
};
FORMS.jpost = async f => {
  const fd = new FormData(f); await needAuth();
  const cid = await mkContact(fd);
  const { error } = await sb.from('jobs').insert({ owner_id: S.user.id, title: fd.get('title').trim(), city_id: +fd.get('city'), salary: fd.get('salary') ? +fd.get('salary') : null, currency: fd.get('cur'), sector: fd.get('sector'), schedule: (fd.get('sched') || '').trim() || null, requirements: (fd.get('req') || '').trim() || null, housing_provided: fd.get('hous') === 'on', employer: (fd.get('emp') || '').trim() || null, contact_id: cid, status: 'pending' });
  if (error) throw error;
  f.outerHTML = `<div class="card radar"><div class="pl">💼</div><p style="font-weight:600">${t('posted_job')}</p></div>`;
};

/* ============ HODISALAR ============ */
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const btn = f.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
  try { await FORMS[f.dataset.form](f); } catch (err) { console.error(err); toast(errMsg(err)); }
  if (btn) btn.disabled = false;
});
document.addEventListener('change', e => {
  const f = e.target.closest('form[data-auto]'); if (f) FORMS[f.dataset.form](f).catch(err => toast(errMsg(err)));
  const cs = e.target.dataset && e.target.dataset.citysel;
  if (cs) { const id = +e.target.value; $('#' + cs).innerHTML = S.cities.filter(c => c.country_id === id).map(c => `<option value="${c.id}">${esc(nm(c))}</option>`).join(''); }
});
const ACT = {
  close: closeModal,
  lang(b) { S.lang = b.dataset.v; ls.set('lang', S.lang); render(); },
  country(b) { S.country = b.dataset.v; ls.set('country', S.country); S.city = ''; render(); },
  tab(b) { S.tabs[b.dataset.pg] = b.dataset.v; render(); },
  reload() { render(); },
  newticket() { render(); },
  pcity(b) { S.city = b.dataset.v; ls.set('city', S.city); render(); },
  pcat(b) { S.place.cat = b.dataset.v; render(); },
  contact: revealContact,
  deal(b) { const d = S.cache[b.dataset.id]; S.prefill = { from: d.from_place, to: d.to_place, date: d.depart_date }; location.hash = '#/ticket'; },
  'open-h'(b) {
    const h = S.cache[b.dataset.id];
    openModal(`<h3>${esc(tx(h, 'title', 'title'))}</h3>${h.images?.length ? `<div class="gal">${h.images.map(u => `<img src="${esc(u)}" alt="" loading="lazy">`).join('')}</div>` : ''}
    <div class="price">${fmt(h.price, h.currency)}</div><div class="meta">${esc(cityName(h.cities))}${h.area ? ' · ' + esc(h.area) : ''}</div>
    <div class="tags"><span>${t('kind_' + h.kind)}</span><span>${t('aud_' + h.audience)}</span></div>
    ${tx(h, 'description', 'text') ? `<p style="white-space:pre-wrap">${esc(tx(h, 'description', 'text'))}</p>` : ''}<div class="warn">${t('warn_housing')}</div>
    ${h.poster_name ? `<div class="meta">${t('poster')}: ${esc(h.poster_name)}</div>` : ''}
    ${h.contact_id ? `<button class="btn" style="margin-top:10px" data-act="contact" data-c="${h.contact_id}">${t('contact_btn')}</button><div class="contact-out"></div>` : ''}
    <button class="lnk" data-act="report" data-type="housing" data-id="${h.id}">${t('report')}</button>`);
  },
  'open-j'(b) {
    const j = S.cache[b.dataset.id];
    openModal(`<h3>${esc(tx(j, 'title', 'title'))}</h3>${j.salary ? `<div class="price">${fmt(j.salary, j.currency)}</div>` : ''}<div class="meta">${esc(cityName(j.cities))}${j.employer ? ' · ' + esc(j.employer) : ''}</div>
    <div class="tags"><span>${t('sec_' + j.sector)}</span>${j.housing_provided ? `<span>🏠 ${t('housing_provided')}</span>` : ''}</div>
    ${j.schedule ? `<p><b>${t('schedule')}:</b> ${esc(j.schedule)}</p>` : ''}${tx(j, 'requirements', 'text') ? `<p style="white-space:pre-wrap"><b>${t('requirements')}:</b> ${esc(tx(j, 'requirements', 'text'))}</p>` : ''}
    <div class="warn">${t('warn_job')}</div>
    ${j.contact_id ? `<button class="btn" data-act="contact" data-c="${j.contact_id}">${t('contact_btn')}</button><div class="contact-out"></div>` : ''}
    <button class="lnk" data-act="report" data-type="job" data-id="${j.id}">${t('report')}</button>`);
  },
  report(b) {
    openModal(`<h3>${t('report')}</h3><form data-form="report"><input type="hidden" name="type" value="${esc(b.dataset.type)}"><input type="hidden" name="id" value="${esc(b.dataset.id)}">
    <label>${t('report_reason')}<textarea name="reason" required minlength="3" maxlength="500"></textarea></label><button class="btn bad" type="submit">${t('send')}</button></form>`);
  },
  async done(b) { const { error } = await sb.from('ride_requests').update({ status: 'done' }).eq('id', b.dataset.id); if (error) return toast(errMsg(error)); await loadMyReq(); ACT.rate({ dataset: { id: b.dataset.id } }); },
  async cancel(b) { await sb.from('ride_requests').update({ status: 'cancelled' }).eq('id', b.dataset.id); loadMyReq(); },
  rate(b) {
    const r = S.cache[b.dataset.id]; if (!r) return;
    const drivers = [...new Map((r.ride_offers || []).map(o => [o.driver_id, o.drivers])).entries()];
    if (!drivers.length) return;
    openModal(`<h3>${t('rate_title')}</h3><form data-form="review"><input type="hidden" name="req" value="${r.id}">
    <label>${t('driver')}<select name="driver">${drivers.map(([id, d]) => `<option value="${id}">${esc(d?.name)} · ${esc(d?.car_model)} · ${esc(d?.plate)}</option>`).join('')}</select></label>
    <div class="stars">${[5, 4, 3, 2, 1].map(n => `<input type="radio" name="stars" id="s${n}" value="${n}" ${n === 5 ? 'checked' : ''}><label for="s${n}">★</label>`).join('')}</div>
    <label>${t('comment')}<textarea name="comment" maxlength="300"></textarea></label><button class="btn" type="submit">${t('send')}</button></form>`);
  },
  async online(b) {
    const { error } = await sb.rpc('set_online', { p_online: b.dataset.v === '1' });
    if (error) { toast(errMsg(error)); if (/not_verified/.test(error.message)) ACT.verify(); return; }
    render();
  },
  async delroute(b) { await sb.from('route_ads').delete().eq('id', b.dataset.id); render(); },
  async verify() {
    if (!S.bot) return toast(t('bot_missing'));
    const { data, error } = await sb.rpc('create_verify_code');
    if (error) return toast(errMsg(error));
    openModal(`<h3>${t('verify_title')}</h3><p>${t('verify_text')}</p><a class="btn" style="display:block;text-align:center;text-decoration:none;margin:12px 0" target="_blank" rel="noopener" href="https://t.me/${esc(S.bot)}?start=${esc(data)}">✈️ ${t('open_tg')}</a>
    <button class="btn ghost" data-act="recheck">${t('verify_done')}</button>`);
  },
  async aifill(b) {
    const text = $('#aitxt').value.trim(); if (!text) return;
    b.disabled = true;
    try {
      const { parsed: p } = await aiCall({ action: 'parse_ticket', text });
      const f = $('form[data-form=ticket]');
      if (!p || !(p.from || p.to || p.date)) { toast(t('ai_fill_none')); return; }
      if (p.from) f.elements.from.value = p.from;
      if (p.to) f.elements.to.value = p.to;
      if (p.date) f.elements.date.value = p.date;
      if (p.pax) f.elements.pax.value = String(p.pax);
    } catch (e) { toast(errMsg(e)); } finally { b.disabled = false; }
  },
  chat() {
    if (!S.chat) S.chat = [];
    openModal(`<h3>💬 ${t('chat_title')}</h3><div class="chatlog" id="chatlog"></div>
    <form class="chatform" data-form="chat"><input name="q" maxlength="500" autocomplete="off" placeholder="${esc(t('chat_ph'))}" required><button class="btn" type="submit">➤</button></form>
    <small>${t('ai_note')}</small>`);
    drawChat();
  },
  async install() {
    if (S.installEvt) { const e = S.installEvt; S.installEvt = null; e.prompt(); const r = await e.userChoice; if (r.outcome === 'accepted') toast(t('install_ok')); render(); return; }
    openModal(`<h3>📲 ${t('install_btn')}</h3><p>${t('install_help')}</p>`);
  },
  async recheck() { await loadProfile(); closeModal(); if (S.profile?.verified) toast('✅ ' + t('verified')); else toast(t('not_verified')); render(); }
};
document.addEventListener('click', e => {
  if (e.target.id === 'modal') return closeModal();
  const tb = e.target.closest('#themeBtn');
  if (tb) { const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme:dark)').matches); S.theme = dark ? 'light' : 'dark'; ls.set('theme', S.theme); drawChrome(); return; }
  const b = e.target.closest('[data-act]'); if (!b || !ACT[b.dataset.act]) return;
  if (b.tagName === 'A') e.preventDefault();
  if (e.target.closest('a[href^="http"]') && b.dataset.act !== 'close') return;
  Promise.resolve(ACT[b.dataset.act](b)).catch(err => toast(errMsg(err)));
});

/* ============ ILOVA SIFATIDA O'RNATISH (PWA) ============ */
function isStandalone() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; });
window.addEventListener('appinstalled', () => { S.installEvt = null; $('#installBtn').hidden = true; });
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });

/* ============ ISHGA TUSHIRISH ============ */
async function render() {
  clearInterval(S.timer);
  const r = location.hash.replace('#/', '').replace('#', '') || 'home';
  S.route = SECS.includes(r) ? r : 'home';
  document.body.dataset.sec = S.route;
  drawChrome();
  const v = $('#view');
  if (!S.countries.length) v.innerHTML = sk(3);
  window.scrollTo(0, 0);
  try { await PAGES[S.route](v); } catch (e) { console.error(e); v.innerHTML = empty('⚠️', errMsg(e)); }
}
async function init() {
  drawChrome();
  try {
    const [c, ci, cfg] = await Promise.all([
      sb.from('countries').select('*').eq('active', true).order('sort'),
      sb.from('cities').select('*').eq('active', true).order('sort'),
      sb.rpc('public_config')]);
    S.countries = c.data || []; S.cities = ci.data || []; S.bot = cfg.data && cfg.data.bot_username || null;
    if (S.country && !country()) S.country = null;
  } catch (e) { console.error(e); }
  sb.auth.getSession().then(({ data }) => { if (data.session) { S.user = data.session.user; return loadProfile(); } }).catch(() => { });
  window.addEventListener('hashchange', render);
  render();
}
init();
