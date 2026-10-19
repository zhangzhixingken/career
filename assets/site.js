const $ = (s) => document.querySelector(s);
const nav = (active = 'career', isHome = false) => `<nav class="site-nav portfolio-nav" aria-label="Main navigation"><a class="logo" href="${isHome ? 'https://www.zhixingzhang.com/' : '/'}">Zhixing Zhang</a><ul class="nav-links"><li><a href="https://www.zhixingzhang.com/arts.html">Arts</a></li><li><a class="${active === 'career' ? 'is-active' : ''}" href="/">Career</a></li><li><a class="${active === 'about' ? 'is-active' : ''}" href="/about/">About</a></li><li><a href="https://www.zhixingzhang.com/contact.html">Contact</a></li></ul><div class="nav-docs" aria-label="Social media"><a class="nav-instagram" href="https://www.instagram.com/zhixing_gallery/" target="_blank" rel="noopener" aria-label="Visit Zhixing Zhang’s Instagram"><span class="nav-instagram-icon" aria-hidden="true"></span></a></div></nav>`;

// [title, discipline, media, href, type, poster, tone]
const featured = [
  ['MINGDE 2021', 'event · design · video', 'mingde-2021/mingde-2021-hero.mp4', '/mingde-2021/', 'video', 'assets/pv/mingde-2021.jpg'],
  ['Brewing Shanghai', 'design', 'assets/pv/brewing-shanghai.jpg', '/brewing-shanghai/', 'image'],
  ['Commercial Photography', 'photography', 'assets/pv/commercial-photography.jpg', '/commercial-photography/', 'image'],
  ['Departures', 'AIGC', 'departures/media/hero.mp4', '/departures/', 'video', 'departures/media/hero-poster.jpg'],
  ['MAPStudio Branding', 'design', 'assets/pv/mapstudio-branding.jpg', '/mapstudio-branding/', 'image', '', 'light']
];

function home() {
  document.body.classList.add('career-home');
  const cards = featured.map(([title, discipline, source, href, type, poster, tone], index) => {
    const media = type === 'video'
      ? `<video class="pv-work-image pv-work-video" src="${source}" poster="${poster}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`
      : `<img class="pv-work-image" src="${source}" alt="${title}" draggable="false"${index ? ' loading="lazy"' : ''}>`;
    return `<a class="pv-work-card${tone === 'light' ? ' is-light' : ''}" href="${href}" draggable="false" data-slide="${index}" aria-label="${title}, ${discipline}"><span class="pv-work-media">${media}<span class="pv-work-shade"></span><span class="pv-work-copy"><span class="pv-work-title">${title}</span><span class="pv-work-discipline">${discipline}</span></span></span></a>`;
  }).join('');
  const progress = featured.map((_, index) => `<button class="pv-progress-step${index === 0 ? ' is-active' : ''}" type="button" data-slide-target="${index}" aria-label="Show project ${index + 1}"><span></span></button>`).join('');
  $('#app').innerHTML = `<main class="pv-home">${nav('career', true)}<section class="pv-carousel-shell" aria-label="Selected career work"><div class="pv-work-list" tabindex="0">${cards}</div><div class="pv-progress" style="--steps:${featured.length}">${progress}</div><div class="pv-carousel-footer" aria-hidden="true"></div></section></main>`;
  setupHomeCarousel(featured.length);
}

function setupHomeCarousel(total) {
  const track = $('.pv-work-list');
  const steps = [...document.querySelectorAll('.pv-progress-step')];
  let active = 0;
  let timer;
  let pointerStart = 0;
  let scrollStart = 0;
  let dragDistance = 0;
  let dragged = false;
  let pointerDown = false;
  let pressedLink = null;

  const update = (index, shouldScroll = true) => {
    active = (index + total) % total;
    steps.forEach((step, i) => {
      step.classList.remove('is-active');
      step.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
    void steps[active].offsetWidth;
    steps[active].classList.add('is-active');
    if (shouldScroll) track.scrollTo({ left: active * track.clientWidth, behavior: 'smooth' });
  };

  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => update(active + 1), 6000);
  };

  steps.forEach((step, i) => step.addEventListener('click', () => { update(i); restart(); }));
  track.addEventListener('scroll', () => {
    window.requestAnimationFrame(() => {
      if (pointerDown) return;
      const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      if (index !== active) { update(index, false); restart(); }
    });
  }, { passive: true });
  track.addEventListener('dragstart', (event) => event.preventDefault());
  track.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointerDown = true;
    pointerStart = event.clientX;
    scrollStart = track.scrollLeft;
    dragDistance = 0;
    dragged = false;
    pressedLink = event.target.closest('.pv-work-card');
    track.setPointerCapture(event.pointerId);
    track.classList.add('is-dragging');
    window.clearInterval(timer);
  });
  track.addEventListener('pointermove', (event) => {
    if (!pointerDown || !track.hasPointerCapture(event.pointerId)) return;
    const delta = event.clientX - pointerStart;
    dragDistance = Math.max(dragDistance, Math.abs(delta));
    if (dragDistance > 5) dragged = true;
    if (dragged) event.preventDefault();
    track.scrollLeft = scrollStart - delta;
  });
  const finishDrag = (event, cancelled = false) => {
    if (!pointerDown) return;
    pointerDown = false;
    const delta = event.clientX - pointerStart;
    const totalMovement = Math.max(
      dragDistance,
      Math.abs(delta),
      Math.abs(track.scrollLeft - scrollStart)
    );
    const shouldOpen = !cancelled && totalMovement <= 5 && pressedLink;
    const threshold = Math.min(80, track.clientWidth * .08);
    const direction = delta < 0 ? 1 : -1;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    const target = !cancelled && Math.abs(delta) >= threshold
      ? active + direction
      : Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    update(target);
    restart();
    if (shouldOpen) window.location.assign(pressedLink.href);
    pressedLink = null;
  };
  track.addEventListener('pointerup', (event) => finishDrag(event));
  track.addEventListener('pointercancel', (event) => finishDrag(event, true));
  track.addEventListener('lostpointercapture', (event) => {
    if (pointerDown) finishDrag(event, true);
  });
  track.addEventListener('click', (event) => {
    event.preventDefault();
  }, true);
  track.addEventListener('keydown', (event) => {
    const link = event.target.closest('.pv-work-card');
    if (link && event.key === 'Enter') window.location.assign(link.href);
  });
  window.addEventListener('resize', () => update(active, false), { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? window.clearInterval(timer) : restart());
  restart();
}

home();
