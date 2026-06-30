const body = document.body;
const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");

const detailMap = {
  dugun: {
    kicker: "Düğün Organizasyonu",
    title: "Hayalinizdeki düğünü kusursuz bir akışla tasarlıyoruz.",
    img: "assets/venue-stairs.png",
    text: "Mekan süslemesi, masa düzeni, çiçek tasarımı, gelin yolu ve etkinlik günü operasyonu tek bir zarif konseptte birleşir.",
    items: ["Konsept ve renk paleti", "Masa ve çiçek dekorasyonu", "Gelin-damat giriş akışı", "Fotoğraf köşesi tasarımı"],
  },
  nisan: {
    kicker: "Nişan Organizasyonu",
    title: "Söz ve nişan törenlerine özel zarif detaylar.",
    img: "assets/rings.png",
    text: "Aile davetlerinin samimi atmosferini koruyan, aynı zamanda fotoğraf değeri yüksek şık bir tören kurgusu hazırlanır.",
    items: ["Nişan masası", "Yüzük tepsisi ve aksesuarlar", "Karşılama alanı", "Seremoni akış planı"],
  },
  kurumsal: {
    kicker: "Kurumsal Etkinlikler",
    title: "Marka prestijini yükselten profesyonel etkinlik deneyimi.",
    img: "assets/stair-moment.png",
    text: "Lansman, toplantı, bayi buluşması ve şirket kutlamalarında marka kimliğine uygun sahne ve davet atmosferi oluşturulur.",
    items: ["Marka renk entegrasyonu", "Protokol akışı", "Sahne ve karşılama düzeni", "Fotoğraf/video alanı"],
  },
  kina: {
    kicker: "Kına & Özel Davet",
    title: "Eğlenceli, sıcak ve unutulmaz özel davetler.",
    img: "assets/couple-dance.png",
    text: "Kına, doğum günü, mezuniyet ve özel kutlamalar için davetin enerjisine göre dekorasyon ve operasyon desteği sağlanır.",
    items: ["Tema ve dekor seçimi", "Müzik ve akış önerisi", "Misafir karşılama", "Detay masa tasarımı"],
  },
  dekor: {
    kicker: "Dekorasyon",
    title: "Mekanı özel bir hikayeye dönüştüren event design.",
    img: "assets/venue-stairs.png",
    text: "Çiçek, kumaş, masa, ışık ve obje seçimleri bütüncül bir tasarım diliyle bir araya getirilir.",
    items: ["Moodboard hazırlığı", "Çiçek ve kumaş seçimi", "Giriş alanı tasarımı", "Masa üstü detayları"],
  },
  fotograf: {
    kicker: "Fotoğraf & Video",
    title: "Davet hikayenizi profesyonel medya diliyle kaydediyoruz.",
    img: "assets/rings.png",
    text: "Hazırlık, detay çekimleri, seremoni, ilk dans ve davet finali için fotoğraf ve video prodüksiyonu planlanır.",
    items: ["Hazırlık çekimi", "Reels/video planı", "Detay ve dekor çekimi", "Teslim formatı danışmanlığı"],
  },
  sahne: {
    kicker: "Sahne & Işık",
    title: "Atmosferi yükselten sahne ve ışık kurgusu.",
    img: "assets/venue-stairs.png",
    text: "İlk dans, konuşma, lansman, pasta ve final anları için ışık ve sahne geçişleri davet akışına göre hazırlanır.",
    items: ["İlk dans ışığı", "Sahne yerleşimi", "Konuşma alanı", "Final efekti planı"],
  },
  danismanlik: {
    kicker: "Planlama Danışmanlığı",
    title: "Bütçe, takvim ve tedarik sürecini profesyonel plana dönüştürüyoruz.",
    img: "assets/stair-moment.png",
    text: "Etkinlik öncesi tüm kararları kolaylaştıran, net bir yapılacaklar takvimi ve tedarikçi koordinasyonu sunulur.",
    items: ["Bütçe planı", "Tedarikçi listesi", "Etkinlik takvimi", "Gün akışı dokümanı"],
  },
  konsept: {
    kicker: "Konsept Tasarımı",
    title: "Davetiniz için özel bir görsel dünya kuruyoruz.",
    img: "assets/venue-stairs.png",
    text: "Renk, çiçek, kumaş, masa üstü, giriş alanı ve fotoğraf köşesi tek bir moodboard etrafında tasarlanır.",
    items: ["Moodboard", "Renk paleti", "Çiçek ve obje seçimi", "Fotoğraf köşesi"],
  },
  mekan: {
    kicker: "Mekan Deneyimi",
    title: "Misafirin mekana adım attığı andan finale kadar her temas noktası planlanır.",
    img: "assets/stair-moment.png",
    text: "Karşılama, yönlendirme, masa düzeni, seremoni ve final alanları davet akışına göre düzenlenir.",
    items: ["Karşılama alanı", "Yönlendirme", "Masa planı", "Seremoni aksı"],
  },
  operasyon: {
    kicker: "Akış & Operasyon",
    title: "Etkinlik günü görünmeyen tüm operasyonu biz yönetiyoruz.",
    img: "assets/couple-dance.png",
    text: "Kurulumdan final anına kadar ekip, tedarikçi, sahne, müzik ve servis akışı tek merkezden koordine edilir.",
    items: ["Kurulum planı", "Ekip koordinasyonu", "Seremoni akışı", "Final kontrolü"],
  },
  standart: {
    kicker: "Standart Paket",
    title: "Kompakt davetler için şık başlangıç paketi.",
    img: "assets/rings.png",
    text: "Temel dekorasyon ve organizasyon yönetimiyle sade ama özenli bir davet atmosferi hazırlanır.",
    items: ["Mekan süslemesi", "Temel dekorasyon", "Organizasyon yönetimi", "Müzik sistemi"],
  },
  premium: {
    kicker: "Premium Paket",
    title: "En çok tercih edilen tam organizasyon paketi.",
    img: "assets/couple-dance.png",
    text: "Dekorasyon, profesyonel fotoğraf, canlı müzik ve mekan tasarımıyla daha kapsamlı bir davet deneyimi sunar.",
    items: ["Özel dekorasyon", "Profesyonel fotoğraf", "Canlı müzik", "Mekan tasarımı"],
  },
  vip: {
    kicker: "VIP Paket",
    title: "Yüksek detaylı, uçtan uca lüks organizasyon.",
    img: "assets/venue-stairs.png",
    text: "Full organizasyon, özel ışık, lüks dekorasyon ve etkinlik süresince kapsamlı destek isteyen davetler için hazırlanır.",
    items: ["Lüks dekorasyon", "Full organizasyon", "Özel ışık gösterisi", "7/24 destek"],
  },
};

const modal = document.querySelector("[data-modal]");
const modalImg = document.querySelector("[data-modal-img]");
const modalKicker = document.querySelector("[data-modal-kicker]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");
const modalList = document.querySelector("[data-modal-list]");

function lockPage(locked) {
  body.classList.toggle("locked", locked);
}

function openDetail(key) {
  const detail = detailMap[key];
  if (!detail) return;
  modalImg.src = detail.img;
  modalKicker.textContent = detail.kicker;
  modalTitle.textContent = detail.title;
  modalText.textContent = detail.text;
  modalList.innerHTML = detail.items.map((item) => `<li>${item}</li>`).join("");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  lockPage(true);
}

function closeDetail() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  lockPage(false);
}

document.querySelectorAll("[data-detail]").forEach((item) => {
  item.addEventListener("click", () => openDetail(item.dataset.detail));
});

document.querySelectorAll("[data-modal-close]").forEach((item) => {
  item.addEventListener("click", closeDetail);
});

document.querySelectorAll("[data-service-filter]").forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    const filter = filterButton.dataset.serviceFilter;
    document.querySelectorAll("[data-service-filter]").forEach((button) => button.classList.toggle("is-active", button === filterButton));
    document.querySelectorAll("[data-service-group]").forEach((card) => {
      card.classList.toggle("is-hidden", filter !== "all" && card.dataset.serviceGroup !== filter);
    });
  });
});

const lightbox = document.querySelector("[data-lightbox]");
const lightboxImg = document.querySelector("[data-lightbox-img]");

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lockPage(false);
}

document.querySelectorAll("[data-gallery]").forEach((item) => {
  item.addEventListener("click", () => {
    lightboxImg.src = item.dataset.gallery;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    lockPage(true);
  });
});

document.querySelector("[data-lightbox-close]").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

const videoModal = document.querySelector("[data-video-modal]");
const videoHeading = document.querySelector("[data-video-heading]");

function openVideo(title = "Tanıtım videosu alanı") {
  videoHeading.textContent = title;
  videoModal.classList.add("is-open");
  videoModal.setAttribute("aria-hidden", "false");
  lockPage(true);
}

function closeVideo() {
  videoModal.classList.remove("is-open");
  videoModal.setAttribute("aria-hidden", "true");
  lockPage(false);
}

document.querySelectorAll("[data-video-open]").forEach((item) => {
  item.addEventListener("click", () => openVideo(item.dataset.videoTitle || "Tanıtım videosu alanı"));
});

document.querySelectorAll("[data-video-close]").forEach((item) => {
  item.addEventListener("click", closeVideo);
});

menuToggle.addEventListener("click", () => {
  const opened = header.classList.toggle("is-open");
  menuToggle.setAttribute("aria-label", opened ? "Menüyü kapat" : "Menüyü aç");
});

nav.addEventListener("click", (event) => {
  if (event.target.tagName === "A") header.classList.remove("is-open");
});

window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 36);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeDetail();
  closeLightbox();
  closeVideo();
});

document.querySelector("[data-contact-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const message = [
    "Merhaba Mill Event House, web sitenizden ulaşıyorum.",
    `Ad Soyad: ${formData.get("name")}`,
    `Etkinlik Türü: ${formData.get("event")}`,
    `Mesaj: ${formData.get("message") || "Detayları görüşmek istiyorum."}`,
  ].join("\n");

  window.open(`https://api.whatsapp.com/send?phone=905078725821&text=${encodeURIComponent(message)}`, "_blank", "noreferrer");
});
