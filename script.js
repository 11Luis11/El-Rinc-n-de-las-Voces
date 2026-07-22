// ============================================================================
// EL RINCÓN DE LAS VOCES — interacciones
// ============================================================================

/* ---------------------------------------------------------------------- *
 * 1) Reproducir el video EN LA MISMA PÁGINA al hacer clic en la miniatura *
 * ---------------------------------------------------------------------- */
document.querySelectorAll('[data-video-frame]').forEach((frame) => {
  const playBtn = frame.querySelector('[data-play-video]');
  const video = frame.querySelector('[data-video]');
  if (!playBtn || !video) return;

  playBtn.addEventListener('click', () => {
    frame.classList.add('is-playing');
    video.play().catch(() => {
      // el navegador bloqueó el autoplay con sonido: se muestran los controles igualmente
    });
  });

  // si el video termina, vuelve a mostrar la miniatura para poder reproducir de nuevo
  video.addEventListener('ended', () => {
    frame.classList.remove('is-playing');
    video.currentTime = 0;
  });
});

/* ---------------------------------------------------------------------- *
 * 2) Aviso "sube aquí" cuando falta una imagen/miniatura                  *
 * ---------------------------------------------------------------------- */
document.querySelectorAll('img[data-fallback-label]').forEach((img) => {
  function showMissing() {
    const label = img.getAttribute('data-fallback-label');
    const frame = img.closest('[data-video-frame]');
    const box = document.createElement('div');
    box.className = 'media-missing';
    box.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2"/>
        <circle cx="9" cy="10" r="1.6" fill="currentColor" stroke="none"/>
        <path d="M21 16l-5.5-5.5L7 19"/>
      </svg>
      <span class="media-missing__label">${label}</span>
      <span class="media-missing__hint">Coloca aquí tu archivo con este nombre, dentro de la carpeta “media”.</span>
    `;
    img.replaceWith(box);

    // si es la miniatura del video, oculta el botón de play hasta que exista la imagen
    if (frame) {
      const playBtn = frame.querySelector('[data-play-video]');
      const badge = frame.querySelector('.evidence-frame__badge');
      const source = frame.querySelector('.evidence-frame__source');
      if (playBtn) playBtn.style.display = 'none';
      if (badge) badge.style.display = 'none';
      if (source) source.style.display = 'none';
    }
  }

  // Caso A: la imagen YA falló antes de que este script se ejecutara
  // (muy común con archivos locales: el error ocurre casi al instante,
  // antes de llegar a leer script.js al final de la página).
  if (img.complete && img.naturalWidth === 0) {
    showMissing();
    return;
  }

  // Caso B: la imagen todavía está cargando y puede fallar más adelante.
  img.addEventListener('error', showMissing, { once: true });
});

/* ---------------------------------------------------------------------- *
 * 3) Riel de expedientes: resalta la pestaña de la sección visible        *
 * ---------------------------------------------------------------------- */
const tabs = Array.from(document.querySelectorAll('[data-tab]'));
const sections = tabs
  .map((tab) => document.querySelector(tab.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        tabs.forEach((tab) => {
          tab.classList.toggle('is-active', tab.getAttribute('href') === id);
        });
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );
  sections.forEach((section) => observer.observe(section));
}

/* ---------------------------------------------------------------------- *
 * 4) Estadísticas: cuentan hacia arriba cuando entran en pantalla         *
 * ---------------------------------------------------------------------- */
const statEls = document.querySelectorAll('[data-stat]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateStat(el) {
  const target = parseFloat(el.getAttribute('data-stat'));
  const suffix = el.getAttribute('data-suffix') || '';
  const numEl = el.querySelector('.stat__num');
  if (!numEl) return;

  // cancela cualquier animación anterior en este mismo elemento
  if (el._statAnimId) cancelAnimationFrame(el._statAnimId);

  if (prefersReducedMotion) {
    numEl.textContent = `${target}${suffix}`;
    return;
  }

  const duration = 900;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = (target * eased).toFixed(1);
    numEl.textContent = `${value}${suffix}`;
    if (progress < 1) el._statAnimId = requestAnimationFrame(tick);
  }
  el._statAnimId = requestAnimationFrame(tick);
}

function resetStat(el) {
  const numEl = el.querySelector('.stat__num');
  if (!numEl) return;
  if (el._statAnimId) cancelAnimationFrame(el._statAnimId);
  numEl.textContent = `0${el.getAttribute('data-suffix') || ''}`;
}

if ('IntersectionObserver' in window && statEls.length) {
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStat(entry.target);
        } else {
          resetStat(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  statEls.forEach((el) => statObserver.observe(el));
} else {
  statEls.forEach(animateStat);
}