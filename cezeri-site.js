(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let finalDecision = '';
  let notified = false;
  let voice = null;

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const header = $('.site-header');
  const menuToggle = $('.menu-toggle');
  if (header && menuToggle) {
    menuToggle.addEventListener('click', () => {
      const open = header.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    $$('.nav a').forEach((a) => a.addEventListener('click', () => header.classList.remove('open')));
  }

  const style = document.createElement('style');
  style.textContent = `
    #offer{display:none!important}.service-check-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:2px 0 4px}.service-check-list label,.voice-row{display:flex;align-items:center;gap:9px;padding:11px 12px;border-radius:16px;border:1px solid rgba(128,255,244,.16);background:rgba(255,255,255,.055);color:#eaffff;font-size:.92rem;line-height:1.3}.service-check-list input,.voice-row input{width:17px;height:17px;accent-color:#2ee6df}.divan-form-card input{width:100%;border:1px solid rgba(128,255,244,.16);background:rgba(255,255,255,.065);color:#fff;border-radius:18px;padding:14px 16px;outline:0}.divan-form-card input:focus,.divan-form-card textarea:focus{border-color:rgba(46,230,223,.65);box-shadow:0 0 0 4px rgba(46,230,223,.12)}.real-team{grid-template-columns:repeat(2,minmax(260px,1fr))!important;max-width:900px;margin-left:0!important}.flag-badge{width:74px;height:52px;min-width:74px;border-radius:14px;display:grid;place-items:center;font-weight:1000;color:#fff;border:1px solid rgba(128,255,244,.25);box-shadow:0 16px 42px rgba(0,0,0,.22)}.flag-badge.tr{background:#e30a17}.flag-badge.tr:before{content:'TR'}.flag-badge.az{background:linear-gradient(#00b5e2 0 33%,#ef3340 33% 66%,#509e2f 66%)}.flag-badge.az:before{content:'AZ'}@media(max-width:820px){.service-check-list,.real-team{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);

  $$('.nav-cta, a[href="#offer"]').forEach((a) => {
    a.setAttribute('href', '#ai-divan');
    if (a.textContent.trim() === 'Teklif Al') a.textContent = 'AI Divanı + Talep';
  });

  const divanIntro = $('#ai-divan .split-heading p:not(.eyebrow)');
  if (divanIntro) divanIntro.textContent = 'Proje fikrinizi yazın; Cezeri, Mimar Sinan, Farabi, Tonyukuk ve Cezeri Kurulu ayrı ayrı yorumlasın, en sonda divan kararı çıksın.';

  const lastMember = $('.member-card[data-key="vedat"]');
  if (lastMember) {
    lastMember.innerHTML = '<span class="member-symbol initials">CK</span><div><b>Cezeri Kurulu</b><small>Son Karar</small><p>Kapsam, öncelik ve uygulanabilir son karar.</p></div>';
  }

  const divanForm = $('.divan-form-card');
  if (divanForm) {
    divanForm.innerHTML = `
      <label for="customerName">Ad Soyad</label>
      <input id="customerName" type="text" placeholder="Müşteri adı" autocomplete="name">
      <label for="customerPhone">Telefon</label>
      <input id="customerPhone" type="tel" placeholder="05xx xxx xx xx" autocomplete="tel">
      <label>Hizmet türü listesi</label>
      <div class="service-check-list">
        <label><input type="checkbox" name="serviceType" value="Web Sitesi"> Web Sitesi</label>
        <label><input type="checkbox" name="serviceType" value="Logo ve Kurumsal Kimlik"> Logo ve Kurumsal Kimlik</label>
        <label><input type="checkbox" name="serviceType" value="Dijital Tasarım"> Dijital Tasarım</label>
        <label><input type="checkbox" name="serviceType" value="Video ve Klip"> Video ve Klip</label>
        <label><input type="checkbox" name="serviceType" value="AI Müzik ve Şarkı"> AI Müzik ve Şarkı</label>
        <label><input type="checkbox" name="serviceType" value="Sosyal Medya İçeriği"> Sosyal Medya İçeriği</label>
        <label><input type="checkbox" name="serviceType" value="AI Divanı"> AI Divanı</label>
        <label><input type="checkbox" name="serviceType" value="Diğer"> Diğer</label>
      </div>
      <label for="projectInput">Müşteri ne istiyor?</label>
      <textarea id="projectInput" rows="6" placeholder="Örn: Güzellik salonum için modern, mobil uyumlu, hızlı açılan bir web sitesi istiyorum."></textarea>
      <label for="projectDeadline">İstenen süre</label>
      <input id="projectDeadline" type="text" placeholder="Örn: 1 hafta içinde / acil / fark etmez">
      <label for="projectBudget">Bütçe veya ek not</label>
      <input id="projectBudget" type="text" placeholder="Varsa bütçe, renk isteği, örnek site, not vb.">
      <label class="voice-row"><input id="voiceEnabled" type="checkbox" checked> Divan konuşmaları sesli okunsun</label>
      <div class="divan-actions">
        <button class="btn primary" id="startCouncil" type="button">AI Divanı Başlat ve Talebi Gönder</button>
        <button class="btn ghost" id="clearCouncil" type="button">Temizle</button>
      </div>
      <p class="divan-status" id="aiStatus">Ses açık. Bilgileri doldurun; divan kararından sonra talep ekibe otomatik gider.</p>
    `;
  }

  const teamGrid = $('.team-grid');
  if (teamGrid) {
    teamGrid.classList.add('real-team');
    teamGrid.innerHTML = `
      <article class="team-card founder reveal in"><span class="flag-badge tr" aria-label="Türk Bayrağı"></span><div><h3>Vedat Barut</h3><p>Grafiker, Web Geliştirme Uzmanı, Yazılımcı ve Oyun Geliştirici.</p></div></article>
      <article class="team-card reveal in"><span class="flag-badge az" aria-label="Azerbaycan Bayrağı"></span><div><h3>Yasir Elesgerov</h3><p>Ekip arkadaşı, üretim desteği ve dijital proje geliştirme.</p></div></article>
    `;
  }

  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    revealItems.forEach((x) => obs.observe(x));
  } else revealItems.forEach((x) => x.classList.add('in'));

  function val(id) { return $(`#${id}`)?.value.trim() || ''; }
  function services() { return $$('input[name="serviceType"]:checked').map((x) => x.value); }
  function status(text) { const s = $('#aiStatus'); if (s) s.textContent = text; }
  function html(text) { return String(text || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
  function projectText() {
    return [
      val('customerName') ? `Müşteri: ${val('customerName')}` : '',
      val('customerPhone') ? `Telefon: ${val('customerPhone')}` : '',
      services().length ? `Hizmet türleri: ${services().join(', ')}` : '',
      val('projectInput') ? `Proje detayı: ${val('projectInput')}` : '',
      val('projectDeadline') ? `İstenen süre: ${val('projectDeadline')}` : '',
      val('projectBudget') ? `Bütçe / ek not: ${val('projectBudget')}` : ''
    ].filter(Boolean).join('\n');
  }

  function log(title, text, final = false) {
    const area = $('#councilLog');
    if (!area) return;
    $('.empty-log', area)?.remove();
    const div = document.createElement('div');
    div.className = final ? 'message final' : 'message';
    div.innerHTML = `<strong>${html(title)}</strong><p>${html(text).replace(/\n/g, '<br>')}</p>`;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }
  function active(key) { $$('.member-card').forEach((c) => c.classList.toggle('active', c.dataset.key === key)); }

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    const all = speechSynthesis.getVoices();
    voice = all.find((v) => /^tr/i.test(v.lang) && /male|erkek|murat|ahmet|emre|tolga/i.test(v.name)) || all.find((v) => /^tr/i.test(v.lang)) || all[0] || null;
  }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function speak(text, final = false) {
    if (!$('#voiceEnabled')?.checked || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel(); loadVoices();
    const u = new SpeechSynthesisUtterance(String(text || '').replace(/[⚙️🎨💻📢👑📜ℹ️]/g, '').replace(/\s+/g, ' '));
    u.lang = 'tr-TR'; u.rate = final ? 0.86 : 0.9; u.pitch = final ? 0.72 : 0.78; u.volume = 1;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }
  function tone(final = false) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = new AC(); let t = ctx.currentTime + .02;
      const notes = final ? [440,523,587,659,587,523,494,440] : [392,494,587];
      notes.forEach((n) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = final ? 'sawtooth' : 'triangle'; o.frequency.value = n; g.gain.value = final ? .035 : .04; o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + .16); t += .18; });
      setTimeout(() => ctx.close(), 2200);
    } catch (_) {}
  }

  function fallback(text) {
    let pack = 'Cezeri Özel Proje Paketi';
    const l = text.toLocaleLowerCase('tr-TR');
    if (l.includes('logo')) pack = 'Logo ve Marka Kimliği Paketi';
    if (l.includes('web') || l.includes('site')) pack = 'Akıllı Web Site Paketi';
    if (l.includes('video') || l.includes('klip')) pack = 'Video ve Klip Üretim Paketi';
    return { responses: [
      { key:'cezeri', title:'Cezeri - Baş Mühendis', text:'Sistem hızlı, mobil uyumlu ve net iletişim odaklı kurulmalı.' },
      { key:'mimar', title:'Mimar Sinan - Tasarım Direktörü', text:'Görsel dil sade, güçlü ve markaya güven veren bir vitrin gibi olmalı.' },
      { key:'farabi', title:'Farabi - Yazılım Mimarı', text:'Altyapı, performans ve ekip bildirimi sorunsuz kurulmalı.' },
      { key:'tonyukuk', title:'Tonyukuk - Pazarlama Uzmanı', text:'Mesajlar ziyaretçiyi müşteriye çevirecek şekilde yazılmalı.' },
      { key:'vedat', title:'Cezeri Kurulu - Son Karar', text:'Modern, dikkat çekici ve satış odaklı bir paket hazırlanmalı.' }
    ], final:`Divan kararı: ${pack} önerildi. Tasarım, teknik kurulum ve pazarlama mesajı birlikte hazırlanacak.` };
  }

  async function callAI(text) {
    try {
      const r = await fetch('ai-divan.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ project:text }) });
      const d = await r.json();
      if (d && Array.isArray(d.responses) && d.final) return d;
    } catch (_) {}
    return fallback(text);
  }
  async function notifyLead() {
    const payload = { name:val('customerName'), phone:val('customerPhone'), services:services(), detail:val('projectInput'), deadline:val('projectDeadline'), budget:val('projectBudget'), decision:finalDecision };
    const r = await fetch('lead-notify.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) throw new Error(d.message || d.first_error || d.error || 'notification_failed');
    return d;
  }
  async function runCouncil() {
    const start = $('#startCouncil');
    if (val('projectInput').length < 8) { status('Lütfen müşterinin ne istediğini biraz daha açıklayıcı yaz.'); $('#projectInput')?.focus(); return; }
    notified = false; finalDecision = ''; tone(false); speak('Cezeri AI Divanı başladı. Proje talebi inceleniyor.');
    if (start) { start.disabled = true; start.textContent = 'Divan çalışıyor...'; }
    const area = $('#councilLog'); if (area) area.innerHTML = '<div class="empty-log">Divan sonucu burada görünecek.</div>';
    status('AI Divanı proje talebini inceliyor...');
    const data = await callAI(projectText());
    for (const item of data.responses || []) { active(item.key); log(item.title || item.key, item.text || ''); speak(`${item.title || ''}. ${item.text || ''}`); await sleep(1700); }
    active(''); finalDecision = data.final || ''; tone(true); log('Divan Kararı', finalDecision, true); speak('Divan kararı. ' + finalDecision, true);
    status('Divan tamamlandı. Talep ekibe gönderiliyor...');
    try {
      const notifyResult = await notifyLead();
      notified = true;
      const text = notifyResult.partial ? `Bilgiler kısmen ekibe iletildi: ${notifyResult.message}.` : 'Bilgiler ekibe iletildi.';
      log('Talep Alındı', text, true);
      status('Talebiniz alındı. Cezeri Digital ekibi sizinle iletişime geçecek.');
    } catch (err) {
      log('Bildirim Hatası', 'Talep oluşturuldu fakat ekibe iletilirken sorun oluştu. Lütfen daha sonra tekrar deneyin.', true);
      status('Bildirim gönderilemedi. Sunucu ayarlarını kontrol edin.');
    }
    if (start) { start.disabled = false; start.textContent = notified ? 'Tekrar Gönder / Yeniden Başlat' : 'AI Divanı Başlat ve Talebi Gönder'; }
  }

  $('#startCouncil')?.addEventListener('click', runCouncil);
  $('#clearCouncil')?.addEventListener('click', () => location.reload());
})();
