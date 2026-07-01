const nav = document.querySelector(".main-nav");
const toggle = document.querySelector(".menu-toggle");
const modal = document.querySelector(".modal");
const modalVideo = modal.querySelector("video");
const closeModal = document.querySelector(".modal-close");
const mainPreview = document.querySelector(".main-preview");
const infoCards = document.querySelectorAll(".info-card");
const floatingPanel = document.querySelector(".floating-panel");
const floatingClose = document.querySelector(".floating-close");
const conceptButtons = document.querySelectorAll(".concept-bar button");
const conceptDetail = document.querySelector(".concept-detail");
const musicToggle = document.querySelector(".music-toggle");
let introMusicPlayed = false;
let audioContext;
let musicNodes = [];

const conceptCopy = {
  sandal: {
    title: "Sandal turu ile göl üstünde teklif",
    text: "Göl kenarı karşılama, masa dekoru, kısa sandal turu ve teklif anı çekimi birlikte planlanır.",
    cta: "Sandal turu için teklif al"
  },
  araba: {
    title: "Klasik araba ile nostaljik giriş",
    text: "Kırmızı halı, özel karşılama, araç başı çekim ve romantik masa konsepti aynı akışta hazırlanır.",
    cta: "Klasik araba paketi"
  },
  hobit: {
    title: "Hobit ev konseptinde masalsı atmosfer",
    text: "Ahşap ev dokusu, sıcak ışıklar, çiçek detayları ve doğal fonla samimi bir teklif sahnesi kurulur.",
    cta: "Hobit ev konsepti"
  },
  karavan: {
    title: "Karavan konseptiyle özgür ve sıcak kurulum",
    text: "Karavan önü dekor, kamp ışıkları, piknik masa düzeni ve doğal çekim alanı birlikte sunulur.",
    cta: "Karavan paketi"
  },
  dekor: {
    title: "Çifte özel dekor ve renk tasarımı",
    text: "Masa, çiçek, ışık, isimli detay ve sürpriz akış tamamen çiftin hikayesine göre kişiselleştirilir.",
    cta: "Özel dekor iste"
  }
};

function playIntroMusic() {
  if (introMusicPlayed) return Promise.resolve();
  introMusicPlayed = true;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return Promise.reject(new Error("AudioContext unavailable"));
  audioContext = audioContext || new AudioCtx();

  return audioContext.resume().then(() => {
    const now = audioContext.currentTime + 0.04;
    const master = audioContext.createGain();
    const delay = audioContext.createDelay();
    const feedback = audioContext.createGain();
    const wet = audioContext.createGain();

    musicNodes.push(master, delay, feedback, wet);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.34, now + 0.14);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 7.8);

    delay.delayTime.value = 0.28;
    feedback.gain.value = 0.18;
    wet.gain.value = 0.18;

    master.connect(audioContext.destination);
    master.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(audioContext.destination);

    const notes = [
      [392.00, 0, 0.95], [523.25, 0.2, 0.92], [659.25, 0.42, 1.05],
      [783.99, 0.9, 1.1], [659.25, 1.45, 1], [587.33, 1.82, 1.1],
      [523.25, 2.22, 1.18], [659.25, 2.86, 1.15], [783.99, 3.22, 1.22],
      [987.77, 3.86, 1.34], [880.00, 4.52, 1.28], [783.99, 5.05, 1.34],
      [1046.5, 5.72, 1.65]
    ];

    notes.forEach(([frequency, offset, duration]) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const shimmer = audioContext.createOscillator();
      const shimmerGain = audioContext.createGain();
      const start = now + offset;

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, start);
      shimmer.type = "triangle";
      shimmer.frequency.setValueAtTime(frequency * 2, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.24, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      shimmerGain.gain.setValueAtTime(0.0001, start);
      shimmerGain.gain.exponentialRampToValueAtTime(0.05, start + 0.04);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.75);

      osc.connect(gain);
      shimmer.connect(shimmerGain);
      gain.connect(master);
      shimmerGain.connect(master);
      osc.start(start);
      shimmer.start(start);
      osc.stop(start + duration + 0.04);
      shimmer.stop(start + duration + 0.04);
      musicNodes.push(osc, shimmer);
    });
  });
}

function updateMusicButton(isPlaying) {
  musicToggle.classList.toggle("playing", isPlaying);
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.textContent = isPlaying ? "♪ Müzik Açık" : "♪ Müzik Aç";
}

setTimeout(() => {
  playIntroMusic().catch(() => {
    introMusicPlayed = false;
    updateMusicButton(false);
  });
}, 350);

function startMusicFromGesture() {
  playIntroMusic()
    .then(() => updateMusicButton(true))
    .catch(() => updateMusicButton(false));
}

musicToggle.addEventListener("click", () => {
  if (musicToggle.classList.contains("playing")) {
    introMusicPlayed = false;
    musicNodes.forEach((node) => {
      try {
        if (node.gain) node.gain.cancelScheduledValues(audioContext.currentTime);
        if (node.gain) node.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
        if (node.stop) node.stop(audioContext.currentTime + 0.12);
      } catch {}
    });
    musicNodes = [];
    updateMusicButton(false);
    return;
  }
  startMusicFromGesture();
});

["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
  window.addEventListener(eventName, () => {
    if (!introMusicPlayed) startMusicFromGesture();
  }, { once: true, passive: true });
});

const mutedVideos = document.querySelectorAll("video[muted]");

mutedVideos.forEach((video) => {
  video.addEventListener("mouseenter", () => video.play().catch(() => {}));
  video.addEventListener("mouseleave", () => {
    if (!video.closest(".hero-video, .video-showcase")) video.pause();
  });
  video.addEventListener("touchstart", () => video.play().catch(() => {}), { passive: true });
});

const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target;
    if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
      video.play().catch(() => {});
    } else if (!video.closest(".hero-video, .video-showcase")) {
      video.pause();
    }
  });
}, { threshold: [0, 0.45] });

mutedVideos.forEach((video) => {
  if (video.closest(".hero-video, .video-showcase")) {
    video.play().catch(() => {});
  } else {
    videoObserver.observe(video);
  }
});

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll(".play-video").forEach((button) => {
  button.addEventListener("click", () => {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    modalVideo.src = button.dataset.video;
    modalVideo.play().catch(() => {});
  });
});

function hideModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.load();
}

closeModal.addEventListener("click", hideModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) hideModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("active")) hideModal();
});

document.querySelectorAll(".video-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".video-tabs button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    mainPreview.src = button.dataset.src;
    document.querySelector(".big-play").dataset.video = button.dataset.src;
    mainPreview.play().catch(() => {});
  });
});

conceptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const data = conceptCopy[button.dataset.concept];
    if (!data) return;
    conceptButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    conceptDetail.querySelector("h2").textContent = data.title;
    conceptDetail.querySelector("p").textContent = data.text;
    conceptDetail.querySelector("a").textContent = data.cta;
    conceptDetail.classList.remove("visible");
    requestAnimationFrame(() => conceptDetail.classList.add("visible"));
  });
});

infoCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    const wasOpen = card.classList.contains("panel-open");
    infoCards.forEach((item) => item.classList.remove("panel-open"));
    card.classList.toggle("panel-open", !wasOpen);
    if (!wasOpen) {
      floatingPanel.querySelector(".floating-icon").textContent = card.dataset.panelIcon || "♡";
      floatingPanel.querySelector("strong").textContent = card.dataset.panelTitle || "Detay";
      floatingPanel.querySelector("p").textContent = card.dataset.panelText || "";
      floatingPanel.querySelector("small").textContent = card.dataset.panelNote || "Bilgi";
      floatingPanel.classList.add("open");
      floatingPanel.setAttribute("aria-hidden", "false");
    } else {
      floatingPanel.classList.remove("open");
      floatingPanel.setAttribute("aria-hidden", "true");
    }
  });

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    card.click();
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".info-card") && !event.target.closest(".floating-panel")) {
    infoCards.forEach((card) => card.classList.remove("panel-open"));
    floatingPanel.classList.remove("open");
    floatingPanel.setAttribute("aria-hidden", "true");
  }
});

floatingClose.addEventListener("click", () => {
  infoCards.forEach((card) => card.classList.remove("panel-open"));
  floatingPanel.classList.remove("open");
  floatingPanel.setAttribute("aria-hidden", "true");
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 40, 240)}ms`;
  observer.observe(item);
});

window.addEventListener("load", () => {
  document.querySelectorAll(".reveal").forEach((item) => {
    if (item.getBoundingClientRect().top < window.innerHeight) item.classList.add("visible");
  });
});
