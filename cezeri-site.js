(() => {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelectorAll('.nav a');
  const year = document.getElementById('year');
  const offerForm = document.getElementById('offerForm');
  const projectType = document.getElementById('projectType');
  const projectMessage = document.getElementById('projectMessage');
  const startCouncil = document.getElementById('startCouncil');
  const clearCouncil = document.getElementById('clearCouncil');
  const projectInput = document.getElementById('projectInput');
  const councilLog = document.getElementById('councilLog');
  const aiStatus = document.getElementById('aiStatus');

  if (year) year.textContent = new Date().getFullYear();

  if (menuToggle && header) {
    menuToggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
    });
    navLinks.forEach((link) => link.addEventListener('click', () => {
      header.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Menüyü aç');
    }));
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('in'));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  function setStatus(text) {
    if (aiStatus) aiStatus.textContent = text;
  }

  function setActiveMember(key) {
    document.querySelectorAll('.member-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.key === key);
    });
  }

  function clearActiveMembers() {
    document.querySelectorAll('.member-card').forEach((card) => card.classList.remove('active'));
  }

  function resetCouncilLog() {
    if (!councilLog) return;
    councilLog.innerHTML = '<div class="empty-log">Divan sonucu burada görünecek.</div>';
  }

  function addMessage(title, text, final = false) {
    if (!councilLog) return;
    const empty = councilLog.querySelector('.empty-log');
    if (empty) empty.remove();
    const item = document.createElement('div');
    item.className = final ? 'message final' : 'message';
    item.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
    councilLog.appendChild(item);
    councilLog.scrollTop = councilLog.scrollHeight;
  }

  function localFallback(text, errorMessage = '') {
    const lower = text.toLocaleLowerCase('tr-TR');
    let paket = 'Cezeri Özel Proje Paketi';
    if (lower.includes('logo')) paket = 'Logo & Marka Kimliği Paketi';
    if (lower.includes('web') || lower.includes('site')) paket = 'Akıllı Web Site Paketi';
    if (lower.includes('sosyal') || lower.includes('instagram')) paket = 'Sosyal Medya Büyüme Paketi';
    if (lower.includes('video') || lower.includes('klip')) paket = 'Video & Klip Üretim Paketi';
    return {
      offline: true,
      errorMessage,
      responses: [
        { key: 'cezeri', title: '⚙️ Cezeri - Baş Mühendis', text: 'Öncelik hızlı açılan, mobil uyumlu ve net iletişime yönlendiren bir sistem olmalı.' },
        { key: 'mimar', title: '🎨 Mimar Sinan - Tasarım Direktörü', text: 'Görsel dil sade, güçlü ve markaya güven veren bir vitrin gibi tasarlanmalı.' },
        { key: 'farabi', title: '💻 Farabi - Yazılım Mimarı', text: 'WhatsApp yönlendirmesi, SEO alanları ve yönetilebilir içerik yapısı kurulmalı.' },
        { key: 'tonyukuk', title: '📢 Tonyukuk - Pazarlama Uzmanı', text: 'Bu proje sadece güzel görünmemeli; ziyaretçiyi müşteriye çevirecek mesajlara sahip olmalı.' },
        { key: 'vedat', title: '👑 Vedat Barut - Kurucu', text: 'Cezeri tarzında modern, dikkat çekici ve satış odaklı bir çalışma hazırlayalım.' }
      ],
      final: `Divan kararı: ${paket} önerildi. İlk adımda ihtiyaç analizi, tasarım yönü, teknik kurulum ve pazarlama mesajı birlikte netleştirilecek.`
    };
  }

  async function callAI(text) {
    const endpoints = ['ai-divan.php', 'divan.php', 'api/ai-divan.php', 'api/divan.php'];
    let lastError = '';
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: text })
        });
        const raw = await response.text();
        let data = null;
        try { data = JSON.parse(raw); } catch (_) {}
        if (response.ok && data && Array.isArray(data.responses) && data.final) return data;
        lastError = data?.error || data?.detail || raw || `HTTP ${response.status}`;
      } catch (error) {
        lastError = error.message || 'Bağlantı hatası';
      }
    }
    return localFallback(text, lastError);
  }

  async function runCouncil() {
    if (!projectInput || !councilLog || !startCouncil) return;
    const text = projectInput.value.trim();
    if (text.length < 8) {
      setStatus('Lütfen proje talebini biraz daha açıklayıcı yaz.');
      projectInput.focus();
      return;
    }
    startCouncil.disabled = true;
    startCouncil.textContent = 'Divan çalışıyor...';
    resetCouncilLog();
    setStatus('AI Divanı proje talebini inceliyor...');

    const data = await callAI(text);
    if (data.offline && data.errorMessage) {
      addMessage('ℹ️ Sistem Notu', `Gerçek AI bağlantısı kurulamadı, demo cevapları gösterildi. Hata: ${data.errorMessage}`);
    }

    const responses = Array.isArray(data.responses) ? data.responses : [];
    for (const item of responses) {
      setActiveMember(item.key);
      setStatus(`${item.title || item.key} görüş bildiriyor...`);
      addMessage(item.title || item.key || 'Divan Üyesi', item.text || '');
      await new Promise((resolve) => setTimeout(resolve, 450));
    }
    clearActiveMembers();
    if (data.final) addMessage('📜 Divan Kararı', data.final, true);
    setStatus('Divan tamamlandı. Sonucu inceleyebilirsiniz.');
    startCouncil.disabled = false;
    startCouncil.textContent = 'Divanı Başlat';
  }

  if (startCouncil) startCouncil.addEventListener('click', runCouncil);
  if (clearCouncil) clearCouncil.addEventListener('click', () => {
    if (projectInput) projectInput.value = '';
    resetCouncilLog();
    clearActiveMembers();
    setStatus('Hazır. Proje detayını yazıp başlatabilirsiniz.');
  });

  if (offerForm) {
    offerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const type = projectType ? projectType.value.trim() : 'Dijital proje';
      const detail = projectMessage ? projectMessage.value.trim() : '';
      const message = [
        'Merhaba Cezeri Digital, teklif almak istiyorum.',
        `Hizmet türü: ${type}`,
        detail ? `Proje detayı: ${detail}` : 'Proje detayı: Görüşmede anlatacağım.'
      ].join('\n');
      window.open(`https://wa.me/905384272486?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    });
  }
})();
