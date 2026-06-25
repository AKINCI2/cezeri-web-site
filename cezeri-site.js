(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let aiData = null;
  let finalDecision = '';
  let notified = false;
  let voice = null;

  function trackEvent(name, params = {}) {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, { event_category: 'cezeri_site', ...params });
    } catch (_) {}
  }

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

  $$('.nav a, .hero-actions a, .panel-footer a, .footer-inner a, .service-card a').forEach((a) => {
    a.addEventListener('click', () => trackEvent('nav_click', { link_text: a.textContent.trim().slice(0, 60), link_url: a.getAttribute('href') || '' }));
  });

  const inlineStyle = document.createElement('style');
  inlineStyle.textContent = `
    #offer{display:none!important}.service-check-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:2px 0 4px}.service-check-list label,.voice-row{display:flex!important;align-items:center;gap:8px;padding:9px 11px;border-radius:14px;border:1px solid rgba(128,255,244,.16);background:rgba(255,255,255,.055);color:#eaffff;font-size:.84rem;line-height:1.25}.service-check-list input,.voice-row input{width:15px;height:15px;accent-color:#2ee6df}.smart-form-title{font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:#2ee6df;font-weight:1000;margin:7px 0 0}.field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.field-grid.full{grid-template-columns:1fr}.field-grid label{display:grid;gap:6px}.field-grid span{font-weight:900;color:#eaffff;font-size:.88rem}.divan-form-card select,.divan-form-card input{width:100%;border:1px solid rgba(128,255,244,.16);background:rgba(255,255,255,.065);color:#fff;border-radius:15px;padding:11px 13px;outline:0}.divan-form-card select option{color:#061516}.analysis-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.analysis-tab{border:1px solid rgba(128,255,244,.18);background:rgba(255,255,255,.06);color:#eaffff;border-radius:999px;padding:9px 12px;font-weight:900;cursor:pointer}.analysis-tab.active{background:#2ee6df;color:#041112}.analysis-panel{display:none}.analysis-panel.active{display:block}.brief-list{margin:8px 0 0;padding-left:20px;color:#abc3c4}.brief-list li{margin:5px 0}.mini-kv{display:grid;grid-template-columns:150px 1fr;gap:6px 12px;margin-top:8px}.mini-kv b{color:#fff}.mini-kv span{color:#b9d4d4}@media(max-width:820px){.field-grid,.service-check-list{grid-template-columns:1fr!important}.mini-kv{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(inlineStyle);

  function ensureServiceLinks() {
    const cards = $$('.service-card');
    const targets = {
      'Video & Klip': 'tanitim-reklam-video/',
      'AI Müzik & Jingle': 'ai-muzik-jingle/'
    };
    cards.forEach((card) => {
      const title = $('h3', card)?.textContent.trim();
      const href = targets[title];
      if (!href || $('a', card)) return;
      const children = Array.from(card.childNodes);
      const a = document.createElement('a');
      a.href = href;
      a.style.color = 'inherit';
      a.style.textDecoration = 'none';
      children.forEach((node) => a.appendChild(node));
      card.appendChild(a);
    });
  }
  ensureServiceLinks();

  const divanIntro = $('#ai-divan .split-heading p:not(.eyebrow)');
  if (divanIntro) divanIntro.textContent = 'Projenizi anlatın; sistem talebinizi özetler, kapsamı çıkarır ve ekibe uygulanabilir bir brif olarak iletir.';

  const lastMember = $('.member-card[data-key="vedat"]');
  if (lastMember) lastMember.innerHTML = '<span class="member-symbol initials">CK</span><div><b>Cezeri Kurulu</b><small>Son Karar</small><p>Kapsam, öncelik ve uygulanabilir karar.</p></div>';

  const divanForm = $('.divan-form-card');
  if (divanForm) {
    divanForm.innerHTML = `
      <div class="smart-form-title">1. Temel Bilgiler</div>
      <div class="field-grid">
        <label><span>Ad Soyad</span><input id="customerName" type="text" placeholder="Adınız soyadınız" autocomplete="name"></label>
        <label><span>Telefon</span><input id="customerPhone" type="tel" placeholder="05xx xxx xx xx" autocomplete="tel"></label>
        <label><span>İşletme / Marka</span><input id="businessName" type="text" placeholder="Varsa marka veya işletme adı"></label>
        <label><span>Sektör</span><input id="businessSector" type="text" placeholder="Örn: üretim, güzellik, restoran, danışmanlık"></label>
        <label><span>Hizmet Bölgesi</span><input id="serviceRegion" type="text" placeholder="Şehir, ilçe veya Türkiye geneli"></label>
        <label><span>Hedef Kitle</span><input id="targetAudience" type="text" placeholder="Kimlere ulaşmak istiyorsunuz?"></label>
      </div>
      <div class="smart-form-title">2. Hizmet İhtiyacı</div>
      <div class="service-check-list">
        <label><input type="checkbox" name="serviceType" value="Web Sitesi"> Web Sitesi</label>
        <label><input type="checkbox" name="serviceType" value="Logo ve Kurumsal Kimlik"> Logo / Kimlik</label>
        <label><input type="checkbox" name="serviceType" value="Sosyal Medya İçeriği"> Sosyal Medya</label>
        <label><input type="checkbox" name="serviceType" value="Dijital Tasarım"> Dijital Tasarım</label>
        <label><input type="checkbox" name="serviceType" value="Tanıtım ve Reklam Videosu"> Tanıtım / Reklam Video</label>
        <label><input type="checkbox" name="serviceType" value="AI Müzik ve Jingle"> AI Müzik / Jingle</label>
        <label><input type="checkbox" name="serviceType" value="SEO ve Ölçüm"> SEO / Ölçüm</label>
        <label><input type="checkbox" name="serviceType" value="Diğer"> Diğer</label>
      </div>
      <div class="field-grid full"><label><span>Projenizi anlatın</span><textarea id="projectInput" rows="5" placeholder="Ne üretilecek, hangi hedef için kullanılacak, müşteriniz ne görmeli?"></textarea></label></div>
      <div class="smart-form-title">3. Tasarım ve İçerik</div>
      <div class="field-grid">
        <label><span>Tasarım tarzı</span><select id="designStyle"><option value="Belirtilmedi">Seçiniz</option><option>Modern ve sade</option><option>Kurumsal</option><option>Premium / lüks</option><option>Doğal / samimi</option><option>Genç / dinamik</option><option>Yerel / güven veren</option></select></label>
        <label><span>Renk tercihi</span><input id="colorPreference" type="text" placeholder="Varsa renk veya örnek marka"></label>
        <label><span>Logo durumu</span><select id="logoStatus"><option value="Belirtilmedi">Seçiniz</option><option>Logo var</option><option>Logo yok</option><option>Logo yenilensin</option><option>İlk etapta yazı logo yeterli</option></select></label>
        <label><span>Fotoğraf / içerik</span><select id="materialStatus"><option value="Belirtilmedi">Seçiniz</option><option>Hazır görsellerim var</option><option>Görsel yok, hazırlanmalı</option><option>AI / stok görsel kullanılabilir</option><option>Sonradan göndereceğim</option></select></label>
        <label><span>Örnek site / stil</span><input id="exampleLink" type="text" placeholder="Varsa link, Instagram veya örnek marka"></label>
        <label><span>Öncelik</span><select id="projectPriority"><option value="Belirtilmedi">Seçiniz</option><option>Uygun bütçe</option><option>Hızlı teslim</option><option>Profesyonel görünüm</option><option>Satış ve müşteri kazanımı</option><option>Marka algısı</option></select></label>
      </div>
      <div class="smart-form-title">4. Süre ve Geri Dönüş</div>
      <div class="field-grid">
        <label><span>İstenen süre</span><input id="projectDeadline" type="text" placeholder="Örn: acil, 1 hafta, fark etmez"></label>
        <label><span>Bütçe / ek not</span><input id="projectBudget" type="text" placeholder="Varsa bütçe aralığı veya not"></label>
        <label><span>Ne zaman ulaşalım?</span><select id="reachTime"><option value="Belirtilmedi">Seçiniz</option><option>Sabah 09:00 - 12:00</option><option>Öğlen 12:00 - 15:00</option><option>Akşamüstü 15:00 - 18:00</option><option>Akşam 18:00 - 21:00</option><option>Fark etmez</option></select></label>
        <label><span>Geri dönüş notu</span><input id="contactNote" type="text" placeholder="Örn: arayabilirsiniz, mesajla dönün"></label>
      </div>
      <label class="voice-row"><input id="voiceEnabled" type="checkbox" checked> Divan konuşmaları sesli okunsun</label>
      <div class="divan-actions"><button class="btn primary" id="startCouncil" type="button">Proje Analizi Oluştur</button><button class="btn ghost" id="clearCouncil" type="button">Temizle</button></div>
      <p class="divan-status" id="aiStatus">Bilgileri doldurun; talep analiz edilip ekibe iletilecek.</p>`;
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
    const video = l.includes('video') || l.includes('tanıtım') || l.includes('reklam');
    const music = l.includes('müzik') || l.includes('jingle') || l.includes('şarkı');
    const web = l.includes('web') || l.includes('site');
    const pack = video ? 'Tanıtım ve Reklam Video Paketi' : music ? 'AI Müzik ve Jingle Paketi' : urgent || low ? 'Acil MVP Paketi' : web ? 'Profesyonel Web Vitrini Paketi' : 'Dijital Başlangıç Paketi';
    return {
      responses: [
        { key:'cezeri', title:'Cezeri - Kapsam Analizi', text:`Talep ${urgent ? 'hızlı teslim' : 'planlı çalışma'} odaklı görünüyor. İlk aşamada hedef netleştirilmeli ve ${pack} kapsamında sade, ölçülebilir bir başlangıç yapılmalı.` },
        { key:'mimar', title:'Mimar Sinan - Tasarım Yaklaşımı', text:'Görsel dil güven veren, sade ve kullanılacağı platforma uygun olmalı. Marka dili net değilse kontrollü renk paleti ve temiz tipografiyle ilerlenmeli.' },
        { key:'farabi', title:'Farabi - Teknik Plan', text:'Hız, mobil uyum, temel SEO, ölçüm altyapısı ve talebin ekibe eksiksiz brif olarak iletilmesi öncelikli olmalı.' },
        { key:'tonyukuk', title:'Tonyukuk - Dönüşüm Planı', text:'Mesaj kısa, açık ve hedefe yönelik olmalı. Gereksiz iddia yerine güven veren ve müşteriyi aksiyona çağıran metinler kullanılmalı.' },
        { key:'vedat', title:'Cezeri Kurulu - Son Karar', text:`Karar: ${pack}. İlk görüşmede hedef, örnek stil, içerik durumu, teslim beklentisi ve bütçe netleştirilmeli.` }
      ],
      customerSummary:`Talebiniz analiz edildi. İlk aşamada ${pack} ile sade, hızlı ve güven veren bir dijital başlangıç yapılması uygun görünüyor. Ekibimiz kapsamı netleştirip sizinle uygun zamanda iletişime geçecek.`,
      teamBrief:`Talep ilk fazda sade kapsamla ele alınmalı. Seçilen hizmetler, logo durumu, tasarım tercihi, içerik durumu ve geri dönüş saati mutlaka dikkate alınmalı.`,
      projectFile:{ projectType:video?'Tanıtım / reklam video':music?'AI müzik / jingle':web?'Web sitesi / dijital vitrin':'Dijital hizmet talebi', recommendedPackage:pack, budgetLevel:low?'Ekonomik başlangıç':'Belirtilmedi', urgency:urgent?'Acil':'Normal', scope:['Net mesaj kurgusu','Görsel/işitsel dil','İletişim yönlendirmesi','Temel SEO ve ölçüm'], stages:['Kısa keşif görüşmesi','İçerik ve materyal toplama','Üretim','Yayın ve kontrol'], missingInfo:['Marka adı','Logo durumu','Görsel veya ses materyalleri','Hedef kitle','Örnek stil'], risks:['Kapsam büyürse teslim süresi uzar','Bütçe düşükse ilk faz sade tutulmalı'], nextStep:'Müşteriyle uygun saatte kısa keşif görüşmesi yapılmalı.'},
      final:`Proje Özeti\nTalep için sade ve ölçülebilir bir dijital başlangıç önerilir.\n\nÖnerilen Paket\n${pack}\n\nKapsam\nNet mesaj, görsel/işitsel dil, iletişim yönlendirmesi, temel SEO ve ölçüm.\n\nTeslim Aşamaları\nKeşif, içerik toplama, üretim ve yayın kontrolü.\n\nEksik Bilgiler\nMarka adı, logo, görseller/ses materyalleri, hedef kitle ve örnek stil.\n\nSonraki Adım\nEkip uygun zamanda iletişime geçip kapsamı netleştirecek.`
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
      <div class="analysis-tabs"><button class="analysis-tab active" data-tab="summary">Proje Özeti</button><button class="analysis-tab" data-tab="file">Proje Dosyası</button></div>
      <div class="analysis-panel active" data-panel="summary"><strong>Özet</strong><p>${html(data.customerSummary || data.final).replace(/\n/g,'<br>')}</p></div>
      <div class="analysis-panel" data-panel="file"><strong>Proje Dosyası</strong><div class="mini-kv"><b>Proje Tipi</b><span>${html(pf.projectType || 'Belirtilmedi')}</span><b>Önerilen Paket</b><span>${html(pf.recommendedPackage || 'Belirtilmedi')}</span><b>Bütçe Seviyesi</b><span>${html(pf.budgetLevel || 'Belirtilmedi')}</span><b>Aciliyet</b><span>${html(pf.urgency || 'Belirtilmedi')}</span></div><strong>Kapsam</strong>${list(pf.scope)}<strong>Teslim Aşamaları</strong>${list(pf.stages)}<strong>Eksik Bilgiler</strong>${list(pf.missingInfo)}<p><b>Sonraki adım:</b> ${html(pf.nextStep || 'Ekip müşteriyle iletişime geçecek.')}</p></div>`;
    area.appendChild(card);
    card.querySelectorAll('.analysis-tab').forEach((btn) => btn.addEventListener('click', () => {
      card.querySelectorAll('.analysis-tab').forEach((b) => b.classList.remove('active'));
      card.querySelectorAll('.analysis-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active'); card.querySelector(`[data-panel="${btn.dataset.tab}"]`)?.classList.add('active');
      trackEvent('ai_result_tab_click', { tab_name: btn.dataset.tab || '' });
    }));
    area.scrollTop = area.scrollHeight;
  }

  async function runCouncil() {
    const start = $('#startCouncil');
    if (val('projectInput').length < 8) { status('Lütfen proje ihtiyacını biraz daha açıklayıcı yazın.'); $('#projectInput')?.focus(); return; }
    trackEvent('ai_divan_start', { selected_services: services().join(', ') || 'none' });
    notified = false; finalDecision = ''; aiData = null; tone(false); speak('Proje analizi başladı. Talep değerlendiriliyor.');
    if (start) { start.disabled = true; start.textContent = 'Analiz hazırlanıyor...'; }
    const area = $('#councilLog'); if (area) area.innerHTML = '<div class="empty-log">Talep okunuyor, kapsam çıkarılıyor...</div>';
    status('Talep analiz ediliyor ve proje özeti hazırlanıyor...');
    const data = await callAI(projectText()); aiData = data;
    trackEvent('ai_project_file_created', { recommended_package: data.projectFile?.recommendedPackage || 'unknown' });
    for (const item of data.responses || []) { active(item.key); log(item.title || item.key, item.text || ''); speak(`${item.title || ''}. ${item.text || ''}`); await sleep(1200); }
    active(''); finalDecision = data.final || ''; tone(true); renderProjectFile(data); speak('Proje özeti hazırlandı. ' + (data.customerSummary || finalDecision), true);
    status('Proje özeti hazırlandı. Talep ekibe gönderiliyor...');
    try { const notifyResult = await notifyLead(); notified = true; trackEvent('lead_sent_to_team', { sent_count: notifyResult.sent || 0, total_count: notifyResult.total || 0, selected_services: services().join(', ') || 'none' }); log('Talep Alındı', notifyResult.partial ? `Bilgiler kısmen ekibe iletildi: ${notifyResult.message}.` : 'Bilgiler ekibe iletildi.', true); status('Talebiniz alındı. Cezeri Digital ekibi sizinle iletişime geçecek.'); }
    catch (err) { trackEvent('lead_send_error', { error_message: String(err.message || err).slice(0, 120) }); log('Bildirim Hatası', 'Talep oluşturuldu fakat ekibe iletilirken sorun oluştu. Lütfen daha sonra tekrar deneyin.', true); status('Bildirim gönderilemedi. Sunucu ayarlarını kontrol edin.'); }
    if (start) { start.disabled = false; start.textContent = notified ? 'Yeni Analiz Oluştur' : 'Proje Analizi Oluştur'; }
  }

  $('#startCouncil')?.addEventListener('click', runCouncil);
  $('#clearCouncil')?.addEventListener('click', () => location.reload());
})();
