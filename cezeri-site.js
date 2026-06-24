(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let aiData = null;
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
    #offer{display:none!important}.smart-form-title{font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:#2ee6df;font-weight:1000;margin:7px 0 0}.field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.field-grid.full{grid-template-columns:1fr}.field-grid label{display:grid;gap:6px}.field-grid span{font-weight:900;color:#eaffff;font-size:.88rem}.divan-form-card select,.divan-form-card input{width:100%;border:1px solid rgba(128,255,244,.16);background:rgba(255,255,255,.065);color:#fff;border-radius:15px;padding:10px 12px;outline:0}.divan-form-card select option{color:#061516}.service-check-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:2px 0 4px}.service-check-list label,.voice-row{display:flex!important;align-items:center;gap:8px;padding:8px 10px;border-radius:14px;border:1px solid rgba(128,255,244,.16);background:rgba(255,255,255,.055);color:#eaffff;font-size:.82rem;line-height:1.25}.service-check-list input,.voice-row input{width:15px;height:15px;accent-color:#2ee6df}.analysis-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.analysis-tab{border:1px solid rgba(128,255,244,.18);background:rgba(255,255,255,.06);color:#eaffff;border-radius:999px;padding:9px 12px;font-weight:900;cursor:pointer}.analysis-tab.active{background:#2ee6df;color:#041112}.analysis-panel{display:none}.analysis-panel.active{display:block}.brief-list{margin:8px 0 0;padding-left:20px;color:#abc3c4}.brief-list li{margin:5px 0}.mini-kv{display:grid;grid-template-columns:150px 1fr;gap:6px 12px;margin-top:8px}.mini-kv b{color:#fff}.mini-kv span{color:#b9d4d4}.real-team{grid-template-columns:repeat(2,minmax(260px,1fr))!important;max-width:900px;margin-left:0!important}.flag-badge{width:74px;height:52px;min-width:74px;border-radius:14px;display:grid;place-items:center;font-weight:1000;color:#fff;border:1px solid rgba(128,255,244,.25);box-shadow:0 16px 42px rgba(0,0,0,.22)}.flag-badge.tr{background:#e30a17}.flag-badge.tr:before{content:'TR'}.flag-badge.az{background:linear-gradient(#00b5e2 0 33%,#ef3340 33% 66%,#509e2f 66%)}.flag-badge.az:before{content:'AZ'}@media(max-width:820px){.field-grid,.service-check-list,.real-team{grid-template-columns:1fr!important}.mini-kv{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  $$('.nav-cta, a[href="#offer"]').forEach((a) => {
    a.setAttribute('href', '#ai-divan');
    if (a.textContent.trim() === 'Teklif Al') a.textContent = 'AI Divanı + Talep';
  });

  const divanIntro = $('#ai-divan .split-heading p:not(.eyebrow)');
  if (divanIntro) divanIntro.textContent = 'Projenizi anlatın; AI Divanı talebi analiz edip proje özeti, uygulanabilir kapsam ve ekibin geri dönüş brifini hazırlasın.';

  const lastMember = $('.member-card[data-key="vedat"]');
  if (lastMember) lastMember.innerHTML = '<span class="member-symbol initials">CK</span><div><b>Cezeri Kurulu</b><small>Son Karar</small><p>Kapsam, öncelik ve uygulanabilir son karar.</p></div>';

  const divanForm = $('.divan-form-card');
  if (divanForm) {
    divanForm.innerHTML = `
      <div class="smart-form-title">1. Temel Bilgiler</div>
      <div class="field-grid">
        <label><span>Ad Soyad</span><input id="customerName" type="text" placeholder="Müşteri adı" autocomplete="name"></label>
        <label><span>Telefon</span><input id="customerPhone" type="tel" placeholder="05xx xxx xx xx" autocomplete="tel"></label>
        <label><span>İşletme / Marka</span><input id="businessName" type="text" placeholder="Varsa işletme adı"></label>
        <label><span>Sektör</span><input id="businessSector" type="text" placeholder="Örn: mantar üretimi, güzellik salonu"></label>
        <label><span>Şehir / Bölge</span><input id="serviceRegion" type="text" placeholder="Örn: Kocaeli, Gebze, Türkiye geneli"></label>
        <label><span>Hedef Kitle</span><input id="targetAudience" type="text" placeholder="Kimlere ulaşmak istiyorsunuz?"></label>
      </div>
      <div class="smart-form-title">2. Hizmet ve Proje İhtiyacı</div>
      <div class="service-check-list">
        <label><input type="checkbox" name="serviceType" value="Web Sitesi"> Web Sitesi</label>
        <label><input type="checkbox" name="serviceType" value="Logo ve Kurumsal Kimlik"> Logo / Kimlik</label>
        <label><input type="checkbox" name="serviceType" value="Dijital Tasarım"> Dijital Tasarım</label>
        <label><input type="checkbox" name="serviceType" value="Video ve Klip"> Video / Klip</label>
        <label><input type="checkbox" name="serviceType" value="AI Müzik ve Şarkı"> AI Müzik</label>
        <label><input type="checkbox" name="serviceType" value="Sosyal Medya İçeriği"> Sosyal Medya</label>
        <label><input type="checkbox" name="serviceType" value="AI Divanı"> AI Divanı</label>
        <label><input type="checkbox" name="serviceType" value="Diğer"> Diğer</label>
      </div>
      <div class="field-grid full">
        <label><span>Projenizi anlatın</span><textarea id="projectInput" rows="5" placeholder="Ne istiyorsunuz, neyi çözmek istiyorsunuz, müşteriniz ne görmeli?"></textarea></label>
      </div>
      <div class="smart-form-title">3. Tasarım ve İçerik</div>
      <div class="field-grid">
        <label><span>Tasarım tarzı</span><select id="designStyle"><option value="Belirtilmedi">Seçiniz</option><option>Modern</option><option>Kurumsal</option><option>Minimal</option><option>Lüks</option><option>Doğal / samimi</option><option>Genç / dinamik</option><option>Yerel / güven veren</option></select></label>
        <label><span>Renk tercihi</span><input id="colorPreference" type="text" placeholder="Örn: yeşil, siyah-altın, fark etmez"></label>
        <label><span>Logo durumu</span><select id="logoStatus"><option value="Belirtilmedi">Seçiniz</option><option>Logo var</option><option>Logo yok</option><option>Logo yenilensin</option><option>Geçici yazı logo yeterli</option></select></label>
        <label><span>Fotoğraf / içerik</span><select id="materialStatus"><option value="Belirtilmedi">Seçiniz</option><option>Hazır görsellerim var</option><option>Görsel yok, siz hazırlayın</option><option>AI görsel kullanılabilir</option><option>Sonradan göndereceğim</option></select></label>
        <label><span>Örnek site / stil</span><input id="exampleLink" type="text" placeholder="Varsa link, Instagram, örnek marka"></label>
        <label><span>Öncelik</span><select id="projectPriority"><option value="Belirtilmedi">Seçiniz</option><option>Uygun bütçe</option><option>Hızlı teslim</option><option>Profesyonel görünüm</option><option>Satış ve müşteri kazanımı</option><option>Marka algısı</option></select></label>
      </div>
      <div class="smart-form-title">4. Süre ve Geri Dönüş</div>
      <div class="field-grid">
        <label><span>İstenen süre</span><input id="projectDeadline" type="text" placeholder="Örn: acil, 1 hafta, fark etmez"></label>
        <label><span>Bütçe / ek not</span><input id="projectBudget" type="text" placeholder="Varsa bütçe, sınır, not"></label>
        <label><span>Ne zaman ulaşalım?</span><select id="reachTime"><option value="Belirtilmedi">Seçiniz</option><option>Sabah 09:00 - 12:00</option><option>Öğlen 12:00 - 15:00</option><option>Akşamüstü 15:00 - 18:00</option><option>Akşam 18:00 - 21:00</option><option>Fark etmez</option></select></label>
        <label><span>Geri dönüş notu</span><input id="contactNote" type="text" placeholder="Örn: işteyim, mesajla dönün, arayabilirsiniz"></label>
      </div>
      <label class="voice-row"><input id="voiceEnabled" type="checkbox" checked> Divan konuşmaları sesli okunsun</label>
      <div class="divan-actions">
        <button class="btn primary" id="startCouncil" type="button">AI Proje Dosyasını Oluştur</button>
        <button class="btn ghost" id="clearCouncil" type="button">Temizle</button>
      </div>
      <p class="divan-status" id="aiStatus">Bilgileri doldurun; Divan proje dosyasını çıkarıp talebi ekibe iletecek.</p>
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
    const obs = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } }), { threshold: 0.1 });
    revealItems.forEach((x) => obs.observe(x));
  } else revealItems.forEach((x) => x.classList.add('in'));

  function val(id) { return $(`#${id}`)?.value.trim() || ''; }
  function services() { return $$('input[name="serviceType"]:checked').map((x) => x.value); }
  function status(text) { const s = $('#aiStatus'); if (s) s.textContent = text; }
  function html(text) { return String(text || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
  function list(items) { return Array.isArray(items) && items.length ? `<ul class="brief-list">${items.map((x) => `<li>${html(x)}</li>`).join('')}</ul>` : '<p>Belirtilmedi.</p>'; }

  function collectLead() {
    return {
      name: val('customerName'), phone: val('customerPhone'), businessName: val('businessName'), sector: val('businessSector'), region: val('serviceRegion'), targetAudience: val('targetAudience'),
      services: services(), detail: val('projectInput'), designStyle: val('designStyle'), colorPreference: val('colorPreference'), logoStatus: val('logoStatus'), materialStatus: val('materialStatus'), exampleLink: val('exampleLink'),
      deadline: val('projectDeadline'), budget: val('projectBudget'), priority: val('projectPriority'), reachTime: val('reachTime'), contactNote: val('contactNote'),
      decision: finalDecision, customerSummary: aiData?.customerSummary || '', teamBrief: aiData?.teamBrief || '', projectFile: aiData?.projectFile || {}
    };
  }

  function projectText() {
    const lead = collectLead();
    return [
      lead.name ? `Müşteri: ${lead.name}` : '', lead.phone ? `Telefon: ${lead.phone}` : '', lead.businessName ? `İşletme / Marka: ${lead.businessName}` : '', lead.sector ? `Sektör: ${lead.sector}` : '', lead.region ? `Bölge: ${lead.region}` : '', lead.targetAudience ? `Hedef kitle: ${lead.targetAudience}` : '',
      lead.services.length ? `Hizmet türleri: ${lead.services.join(', ')}` : '', lead.detail ? `Proje detayı: ${lead.detail}` : '', lead.designStyle ? `Tasarım tarzı: ${lead.designStyle}` : '', lead.colorPreference ? `Renk tercihi: ${lead.colorPreference}` : '', lead.logoStatus ? `Logo durumu: ${lead.logoStatus}` : '', lead.materialStatus ? `Materyal durumu: ${lead.materialStatus}` : '', lead.exampleLink ? `Örnek / link: ${lead.exampleLink}` : '',
      lead.deadline ? `İstenen süre: ${lead.deadline}` : '', lead.budget ? `Bütçe / ek not: ${lead.budget}` : '', lead.priority ? `Öncelik: ${lead.priority}` : '', lead.reachTime ? `Ulaşmak için uygun zaman: ${lead.reachTime}` : '', lead.contactNote ? `Geri dönüş notu: ${lead.contactNote}` : ''
    ].filter(Boolean).join('\n');
  }

  function log(title, text, final = false) {
    const area = $('#councilLog'); if (!area) return;
    $('.empty-log', area)?.remove();
    const div = document.createElement('div');
    div.className = final ? 'message final' : 'message';
    div.innerHTML = `<strong>${html(title)}</strong><p>${html(text).replace(/\n/g, '<br>')}</p>`;
    area.appendChild(div); area.scrollTop = area.scrollHeight;
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
    if (voice) u.voice = voice; speechSynthesis.speak(u);
  }
  function tone(final = false) {
    try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; const ctx = new AC(); let t = ctx.currentTime + .02; const notes = final ? [440,523,587,659,587,523,494,440] : [392,494,587]; notes.forEach((n) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = final ? 'sawtooth' : 'triangle'; o.frequency.value = n; g.gain.value = final ? .035 : .04; o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + .16); t += .18; }); setTimeout(() => ctx.close(), 2200); } catch (_) {}
  }

  function fallback(text) {
    const l = text.toLocaleLowerCase('tr-TR');
    const urgent = l.includes('acil') || l.includes('hemen');
    const low = l.includes('az bütçe') || l.includes('param yok') || l.includes('uygun bütçe') || l.includes('ucuz');
    const web = l.includes('web') || l.includes('site');
    const pack = urgent || low ? 'Acil MVP Web Paketi' : web ? 'Profesyonel Web Vitrini Paketi' : 'Cezeri Başlangıç Paketi';
    return {
      responses: [
        { key:'cezeri', title:'Cezeri - Strateji ve Kapsam', text:`Talep ${urgent ? 'acil teslim' : 'hızlı değerlendirme'} odaklı görünüyor. İlk aşamada kapsam daraltılıp net bir ${pack} hazırlanmalı.` },
        { key:'mimar', title:'Mimar Sinan - Tasarım ve Marka Dili', text:'Görsel dil temiz, güven veren ve mobilde kolay okunur olmalı. Fotoğraf yoksa ilk fazda sade vitrin ve destekleyici görseller kullanılabilir.' },
        { key:'farabi', title:'Farabi - Teknik Plan', text:'Teknik tarafta hızlı açılan sayfa yapısı, temel SEO, iletişim yönlendirmesi ve ekip bildirimi öncelikli kurulmalı.' },
        { key:'tonyukuk', title:'Tonyukuk - Pazarlama ve Dönüşüm', text:'Ana mesaj ilk ekranda anlaşılmalı. Ziyaretçi ne sunulduğunu ve nasıl iletişime geçeceğini hızlıca görmeli.' },
        { key:'vedat', title:'Cezeri Kurulu - Son Karar', text:`Karar: ${pack}. İlk görüşmede logo, görsel materyal, hedef bölge ve örnek stil netleştirilmeli.` }
      ],
      customerSummary:`Talebiniz analiz edildi. İlk aşamada ${pack} ile hızlı, sade ve güven veren bir dijital vitrin hazırlanması uygun görünüyor. Ekibimiz kapsamı netleştirip sizinle uygun zamanda iletişime geçecek.`,
      teamBrief:`Müşteri talebi hızlı ve pratik çözüm gerektiriyor. Kapsam ilk fazda sade tutulmalı. İlk görüşmede logo, materyal, hedef kitle, örnek tasarım ve net teslim beklentisi sorulmalı.`,
      projectFile:{ projectType:web?'Web sitesi / dijital vitrin':'Dijital hizmet talebi', recommendedPackage:pack, budgetLevel:low?'Ekonomik başlangıç':'Belirtilmedi', urgency:urgent?'Acil':'Normal', scope:['Mobil uyumlu vitrin','Temel içerik düzeni','İletişim yönlendirmesi','Temel SEO'], stages:['Kısa keşif görüşmesi','İçerik ve görsel toplama','Tasarım ve kurulum','Yayın ve kontrol'], missingInfo:['İşletme adı','Logo durumu','Görsel materyaller','Hedef bölge','Örnek stil'], risks:['Kapsam büyürse teslim süresi uzar','Bütçe düşükse ilk faz sade tutulmalı'], upsellOpportunities:['Logo yenileme','Sosyal medya içerikleri','Reklam görseli'], nextStep:'Müşteriyle uygun saatte kısa keşif görüşmesi yapılmalı.'},
      final:`Proje Özeti\nTalep hızlı ve sade bir dijital çözüm gerektiriyor.\n\nÖnerilen Paket\n${pack}\n\nKapsam\nMobil uyumlu vitrin, temel içerik, iletişim yönlendirmesi ve temel SEO.\n\nTeslim Aşamaları\nKeşif, içerik toplama, tasarım/kurulum, yayın kontrolü.\n\nEksik Bilgiler\nLogo, görseller, hedef bölge, örnek stil ve net iletişim bilgileri.\n\nMüşteriye Sonraki Adım\nEkip uygun zamanda iletişime geçip kapsamı netleştirecek.`
    };
  }

  async function callAI(text) {
    try { const r = await fetch('ai-divan.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ project:text }) }); const d = await r.json(); if (d && Array.isArray(d.responses) && d.final) return d; } catch (_) {}
    return fallback(text);
  }
  async function notifyLead() {
    const payload = collectLead();
    const r = await fetch('lead-notify.php', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) throw new Error(d.message || d.first_error || d.error || 'notification_failed');
    return d;
  }

  function renderProjectFile(data) {
    const area = $('#councilLog'); if (!area) return;
    const pf = data.projectFile || {};
    const card = document.createElement('div');
    card.className = 'message final';
    card.innerHTML = `
      <div class="analysis-tabs"><button class="analysis-tab active" data-tab="summary">Proje Özeti</button><button class="analysis-tab" data-tab="file">Proje Dosyası</button><button class="analysis-tab" data-tab="brief">Ekip Brifi</button></div>
      <div class="analysis-panel active" data-panel="summary"><strong>Müşteriye Özet</strong><p>${html(data.customerSummary || data.final).replace(/\n/g,'<br>')}</p></div>
      <div class="analysis-panel" data-panel="file"><strong>AI Proje Dosyası</strong><div class="mini-kv"><b>Proje Tipi</b><span>${html(pf.projectType || 'Belirtilmedi')}</span><b>Önerilen Paket</b><span>${html(pf.recommendedPackage || 'Belirtilmedi')}</span><b>Bütçe Seviyesi</b><span>${html(pf.budgetLevel || 'Belirtilmedi')}</span><b>Aciliyet</b><span>${html(pf.urgency || 'Belirtilmedi')}</span></div><strong>Kapsam</strong>${list(pf.scope)}<strong>Teslim Aşamaları</strong>${list(pf.stages)}<strong>Eksik Bilgiler</strong>${list(pf.missingInfo)}<strong>Riskler / Varsayımlar</strong>${list(pf.risks)}<strong>Geliştirme Fırsatları</strong>${list(pf.upsellOpportunities)}<p><b>Sonraki adım:</b> ${html(pf.nextStep || 'Ekip müşteriyle iletişime geçecek.')}</p></div>
      <div class="analysis-panel" data-panel="brief"><strong>Ekip Brifi</strong><p>${html(data.teamBrief || 'Ekip kapsamı inceleyip müşteriye dönüş yapmalı.').replace(/\n/g,'<br>')}</p></div>`;
    area.appendChild(card);
    card.querySelectorAll('.analysis-tab').forEach((btn) => btn.addEventListener('click', () => {
      card.querySelectorAll('.analysis-tab').forEach((b) => b.classList.remove('active'));
      card.querySelectorAll('.analysis-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active'); card.querySelector(`[data-panel="${btn.dataset.tab}"]`)?.classList.add('active');
    }));
    area.scrollTop = area.scrollHeight;
  }

  async function runCouncil() {
    const start = $('#startCouncil');
    if (val('projectInput').length < 8) { status('Lütfen proje ihtiyacını biraz daha açıklayıcı yazın.'); $('#projectInput')?.focus(); return; }
    notified = false; finalDecision = ''; aiData = null; tone(false); speak('Cezeri AI Divanı başladı. Proje talebi analiz ediliyor.');
    if (start) { start.disabled = true; start.textContent = 'Proje dosyası hazırlanıyor...'; }
    const area = $('#councilLog'); if (area) area.innerHTML = '<div class="empty-log">Talep okunuyor, kapsam çıkarılıyor...</div>';
    status('AI Divanı talebi analiz ediyor ve proje dosyası hazırlıyor...');
    const data = await callAI(projectText()); aiData = data;
    for (const item of data.responses || []) { active(item.key); log(item.title || item.key, item.text || ''); speak(`${item.title || ''}. ${item.text || ''}`); await sleep(1400); }
    active(''); finalDecision = data.final || ''; tone(true); renderProjectFile(data); speak('Proje dosyası hazırlandı. ' + (data.customerSummary || finalDecision), true);
    status('Proje dosyası hazırlandı. Talep ekibe gönderiliyor...');
    try { const notifyResult = await notifyLead(); notified = true; log('Talep Alındı', notifyResult.partial ? `Bilgiler kısmen ekibe iletildi: ${notifyResult.message}.` : 'Bilgiler ekibe iletildi.', true); status('Talebiniz alındı. Cezeri Digital ekibi sizinle iletişime geçecek.'); }
    catch (err) { log('Bildirim Hatası', 'Talep oluşturuldu fakat ekibe iletilirken sorun oluştu. Lütfen daha sonra tekrar deneyin.', true); status('Bildirim gönderilemedi. Sunucu ayarlarını kontrol edin.'); }
    if (start) { start.disabled = false; start.textContent = notified ? 'Yeni Proje Dosyası Oluştur' : 'AI Proje Dosyasını Oluştur'; }
  }

  $('#startCouncil')?.addEventListener('click', runCouncil);
  $('#clearCouncil')?.addEventListener('click', () => location.reload());
})();
