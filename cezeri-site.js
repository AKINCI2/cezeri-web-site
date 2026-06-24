(() => {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelectorAll('.nav a');
  const year = document.getElementById('year');
  const offerForm = document.getElementById('offerForm');
  const projectType = document.getElementById('projectType');
  const projectMessage = document.getElementById('projectMessage');

  if (year) year.textContent = new Date().getFullYear();

  if (menuToggle && header) {
    menuToggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        header.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Menüyü aç');
      });
    });
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
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('in'));
  }

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
      const url = `https://wa.me/905384272486?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
})();
