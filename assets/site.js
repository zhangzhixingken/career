const $ = (s) => document.querySelector(s);
const img = (n, alt = '') => `<img loading="lazy" src="assets/work/work-${String(n).padStart(2, '0')}.webp" alt="${alt}">`;
const languageSwitch = () => `<div class="language-switch" aria-label="Language"><button type="button" class="is-active" data-language="en" aria-pressed="true">EN</button><span>/</span><button type="button" data-language="zh" aria-pressed="false">中</button></div>`;
const nav = () => `<nav class="site-nav portfolio-nav" aria-label="Main navigation"><a class="logo" href="https://www.zhixingzhang.com/">Zhixing Zhang</a><ul class="nav-links"><li><a href="https://www.zhixingzhang.com/arts.html">Arts</a></li><li><a class="is-active" href="/">Career</a></li><li><a href="/about/">About</a></li><li><a href="https://www.zhixingzhang.com/contact.html">Contact</a></li></ul><div class="nav-docs" aria-label="Social media"><a class="nav-instagram" href="https://www.instagram.com/zhixing_gallery/" target="_blank" rel="noopener" aria-label="Visit Zhixing Zhang’s Instagram"><span class="nav-instagram-icon" aria-hidden="true"></span></a></div></nav>`;
const detailNav = () => `<header class="detail-nav"><a href="/">ZHIXINGZHANG</a><a class="nav-practice" href="https://www.zhixingzhang.com/">Main Practice ↗</a>${languageSwitch()}</header>`;
const footer = (href, label) => `<a class="detail-next" href="${href}"><div><small>Next project</small><strong>${label}</strong></div><span>↗</span></a><footer class="detail-footer"><span>Zhixing Zhang © 2026</span><a href="/">Back to index ↑</a></footer>`;
const gallery = (numbers, label) => `<div class="detail-gallery">${numbers.map((n, i) => `<figure>${img(n, `${label} ${i + 1}`)}</figure>`).join('')}</div>`;
const projects = [
  ['Graduation Feature Opening', 'AIGC · After Effects', 2, '/aigc/'], ['Event Photography', 'Institutional Photography', 3, '/photography/#event'], ['Graduation Banquet', 'Experience Design · 2022', 4, '/event-experience/graduation-banquet/'], ['Stillness', 'Artistic Photography', 5, '/photography/#artistic'], ['Place & Identity', 'Institutional Photography', 6, '/photography/#institutional'], ['Visual Systems', 'Key Visual · Branding', 7, '/visual-design/#key-visual'], ['Objects', '3D Design', 12, '/visual-design/#objects'], ['MINGDE 2021', 'Key Visual · Event', 1, '/event-experience/mingde-2021/']
];
const card = ([title, meta, image, href]) => `<a class="index-project-card" href="${href}"><div class="project-card-image">${img(image, title)}</div><div class="project-card-copy"><h3>${title}</h3><p>${meta}</p><span>↗</span></div></a>`;
const category = (title, intro, href, list) => `<section class="category-block"><header class="category-heading"><div><h2>${title}</h2><p>${intro}</p></div><a href="${href}">View all <span>↗</span></a></header><div class="project-card-grid count-${list.length}">${list.map(card).join('')}</div></section>`;

function home() {
  document.body.classList.add('career-home');
  const featured = [
    ['MINGDE 2021', 'event design', 'mingde-2021/mingde-2021-hero.mp4', '/mingde-2021/', 'video'],
    ['Brewing Shanghai', 'product design', 'assets/pv/brewing-shanghai.jpg', '/visual-design.html#branding'],
    ['commercial photography', 'photography', 'assets/pv/commercial-photography.jpg', '/photography.html#institutional']
  ];
  const cards = featured.map(([title, discipline, source, href, type], index) => {
    const media = type === 'video'
      ? `<video class="pv-work-image pv-work-video" src="${source}" poster="assets/pv/mingde-2021.jpg" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`
      : `<img class="pv-work-image" src="${source}" alt="${title}" draggable="false">`;
    return `<a class="pv-work-card" href="${href}" draggable="false" data-slide="${index}" aria-label="${title}, ${discipline}"><span class="pv-work-media">${media}<span class="pv-work-shade"></span><span class="pv-work-copy"><span class="pv-work-title">${title}</span><span class="pv-work-discipline">${discipline}</span></span></span></a>`;
  }).join('');
  const progress = featured.map(([, , ,], index) => `<button class="pv-progress-step${index === 0 ? ' is-active' : ''}" type="button" data-slide-target="${index}" aria-label="Show project ${index + 1}"><span></span></button>`).join('');
  $('#app').innerHTML = `<main class="pv-home">${nav()}<section class="pv-carousel-shell" aria-label="Selected career work"><div class="pv-work-list" tabindex="0">${cards}</div><div class="pv-carousel-footer"><div class="pv-progress">${progress}</div></div></section></main>`;
  setupHomeCarousel(featured.length);
}

function setupHomeCarousel(total) {
  const track = $('.pv-work-list');
  const steps = [...document.querySelectorAll('.pv-progress-step')];
  let active = 0;
  let timer;
  let pointerStart = 0;
  let scrollStart = 0;
  let dragged = false;
  let pointerDown = false;
  let suppressClick = false;

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
    dragged = false;
    track.setPointerCapture(event.pointerId);
    track.classList.add('is-dragging');
    window.clearInterval(timer);
  });
  track.addEventListener('pointermove', (event) => {
    if (!pointerDown || !track.hasPointerCapture(event.pointerId)) return;
    const delta = event.clientX - pointerStart;
    if (Math.abs(delta) > 5) dragged = true;
    if (dragged) event.preventDefault();
    track.scrollLeft = scrollStart - delta;
  });
  const finishDrag = (event, cancelled = false) => {
    if (!pointerDown) return;
    pointerDown = false;
    const delta = event.clientX - pointerStart;
    const threshold = Math.min(80, track.clientWidth * .08);
    const direction = delta < 0 ? 1 : -1;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    const target = !cancelled && Math.abs(delta) >= threshold
      ? active + direction
      : Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    suppressClick = dragged;
    update(target);
    restart();
    window.setTimeout(() => { suppressClick = false; dragged = false; }, 0);
  };
  track.addEventListener('pointerup', (event) => finishDrag(event));
  track.addEventListener('pointercancel', (event) => finishDrag(event, true));
  track.addEventListener('lostpointercapture', (event) => {
    if (pointerDown) finishDrag(event, true);
  });
  track.addEventListener('click', (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  window.addEventListener('resize', () => update(active, false), { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? window.clearInterval(timer) : restart());
  restart();
}

const groups = {
  photography: [['event', '01', 'Event Photography', 'People<br>in motion', 'Responsive coverage of speakers, workshops, ceremonies, and community events. I look for gestures, exchanges, and decisive moments that communicate both the programme and its atmosphere.', [3,9,32,33,34,35]], ['institutional', '02', 'Institutional & Architecture', 'Place<br>& identity', 'Large-format institutional imagery for brochures and communications: campus exteriors, architectural atmosphere, Shanghai landmarks, and everyday student life.', [6,10,21,22,40,43]], ['artistic', '03', 'Artistic Practice', 'Stillness<br>& distance', 'A slower image practice concerned with cinematic stillness, the distance between people, urban solitude, and the emotional charge of constructed space.', [5,14,15,23,31,48]]],
  visual: [['key-visual','01','MINGDE 2021 Key Visual','One event,<br>one visual world','A complete sports-games identity developed across logo, typography, colour, venue graphics, flags, banners, credentials, and ceremony applications.',[1,44,23,13,24]],['credentials','02','Volunteer Credentials','Roles become<br>instantly legible','A colour-coded credential family for volunteers, broadcasters, photographers, and operational teams.',[39,38,28,46,51]],['branding','03','MAPStudio Identity','A studio<br>finds its voice','A flexible identity for a student creative organisation, combining a dimensional MAP symbol with a warm hand-drawn verbal system.',[12,36,40,10,27]],['brochure','04','MAPStudio Brochure','History becomes<br>a designed narrative','An independently delivered publication—from concept and content hierarchy through layout and print.',[7,16,35,47]],['objects','05','3D Logo & Objects','Graphics<br>become objects','Fusion 360 modelling and Adobe Dimension rendering translated the identity from flat graphics into dimensional marks and physical brand objects.',[12,36,40,10]]]
};
function practice(type) {
  const photo = type === 'photography'; const data = groups[type]; const title = photo ? 'Photo<span>graphy</span>' : 'Visual<span>Systems</span>'; const kicker = photo ? 'Photography · Image-making · Editorial · Documentation' : 'Key Visual & Branding · Identity · Print · Objects · Applications';
  $('#app').innerHTML = `<main class="detail-page ${photo ? 'photo-page' : 'visual-page'}">${detailNav(photo ? 'Photography' : '2D & 3D Visual Design')}<section class="practice-hero ${photo ? '' : 'visual-hero'}"><div class="practice-kicker"><span>${kicker.split(' · ')[0]}</span><span>${kicker.split(' · ').slice(1).join(' · ')}</span></div><h1>${title}</h1><div class="practice-summary"><p>${photo ? 'Photography as communication, atmosphere, and evidence — from fast-moving institutional events to architecture, student life, and an independent artistic practice.' : 'Graphic and spatial assets designed as connected systems—from MINGDE 2021’s event identity to MAPStudio’s logo, brochure, credentials, merchandise, and dimensional applications.'}</p><div>${photo ? 'Event photography<br>Institutional & architecture<br>Artistic photography' : 'Key visual systems<br>Identity & publication design<br>Campaign applications<br>3D modelling & objects'}</div></div></section><div class="practice-cover">${img(photo ? 3 : 7)}<span>Selected work · Zhixing Zhang</span></div><nav class="practice-subnav">${data.map(x => `<a href="#${x[0]}">${x[2]}</a>`).join('')}</nav>${data.map(x => `<section class="practice-section" id="${x[0]}"><header><span>${x[1]} / ${x[2]}</span><div><h2>${x[3]}</h2><p>${x[4]}</p></div></header>${gallery(x[5],x[2])}</section>`).join('')}${footer(photo ? '/event-experience/' : '/photography/', photo ? 'Event & Experience Design' : 'Photography')}</main>`;
}

function aigc() {
  const steps = [['01','Define the visual grammar'],['02','Build a reference system'],['03','Test consistency'],['04','Refine manually'],['05','Sequence for motion'],['06','Deliver across media']];
  $('#app').innerHTML = `<main class="detail-page aigc-page">${detailNav('AI Generated Content')}<section class="practice-hero aigc-hero"><div class="practice-kicker"><span>Animation & Video · 2025</span><span>Recraft · Adobe After Effects</span></div><h1>Graduation<span>Opening</span></h1><div class="practice-summary"><p>A 30-second opening animation created for NYU Shanghai’s graduation feature series, combining a controlled AI illustration system with motion design and branded storytelling.</p><div>Role · AIGC & Motion Designer<br>Client · NYU Shanghai<br>Format · 30-second title sequence</div></div></section><div class="practice-cover">${img(2)}<span>Graduation title sequence · controlled illustration system</span></div><section class="case-facts"><div><small>Year</small>2025</div><div><small>Duration</small>30 seconds</div><div><small>Generation</small>Recraft</div><div><small>Motion</small>After Effects</div><div><small>Output</small>Social campaign</div></section><section class="method-section aigc-method"><header><span>Workflow</span><h2>Control,<br>not chance</h2></header><div class="method-grid">${steps.map(x=>`<article><span>${x[0]}</span><h3>${x[1]}</h3><p>Build a controlled system of palette, texture, composition, subject scale, and continuity so images stay stable across the whole campaign.</p></article>`).join('')}</div></section><section class="practice-section" id="images"><header><span>Generated Image System</span><div><h2>One world,<br>many scenes</h2><p>The same visual grammar remains stable across landmarks, landscapes, travel imagery, atmospheric transitions, and formats.</p></div></header>${gallery([2,17,18,19,20,21],'AI image')}</section><section class="motion-section"><div><span>Motion Translation</span><h2>Images<br>become time.</h2></div><p>The illustration system was sequenced through pacing, spatial transitions, typography, and compositing in After Effects.</p><div class="motion-strip">${[17,18,20].map(n=>`<figure>${img(n)}</figure>`).join('')}</div><a class="motion-link" href="https://www.bilibili.com/video/BV1YKKbzYEcV/">Watch the published animation ↗</a></section>${footer('/visual-design/','2D & 3D Visual Design')}</main>`;
}

const eventSteps = [['01','Frame the idea'],['02','Align people'],['03','Make it feasible'],['04','Design the journey'],['05','Deliver live'],['06','Extend the story']];
function events() { $('#app').innerHTML = `<main class="detail-page event-page">${detailNav('Event & Experience Design')}<section class="practice-hero event-hero"><div class="practice-kicker"><span>Event & Experience</span><span>Strategy · Production · Guest Journey</span></div><h1>Event<span>Design</span></h1><div class="practice-summary"><p>I design events as complete experiences: the concept people understand, the space they enter, the sequence they move through, and the images they remember afterward.</p><div>Creative direction<br>Vendor & budget management<br>Spatial, visual & guest experience</div></div></section><div class="practice-cover">${img(4)}<span>Graduation Banquet · environment and guest experience</span></div><section class="case-index"><header><span>Selected case studies</span><div><h2>From idea<br>to memory</h2><p>Each case study shows the full chain of work: inspiration, stakeholder alignment, risk, budgeting, vendor coordination, team leadership, visual identity, live execution, and post-event communication.</p></div></header><div class="case-cards"><a href="/event-experience/mingde-2021/">${img(1)}<div><small>Sports Games · 2021</small><h3>MINGDE<br>2021</h3><p>Bringing the emotional logic of an Olympic opening ceremony into a high-school sports day—safely, affordably, and as one coherent visual system.</p><span>Open complete case study ↗</span></div></a><a href="/event-experience/graduation-banquet/">${img(4)}<div><small>Graduation Experience · 2022</small><h3>Graduation<br>Banquet</h3><p>Designing atmosphere, hospitality, food, table details, programme rhythm, photography, film, and editorial communication as one guest journey.</p><span>Open complete case study ↗</span></div></a></div></section><section class="method-section"><header><span>Working model</span><h2>Entire<br>project</h2></header><div class="method-grid">${eventSteps.map(x=>`<article><span>${x[0]}</span><h3>${x[1]}</h3><p>Move a clear creative direction through stakeholders, operations, guest experience, live production, and post-event storytelling.</p></article>`).join('')}</div></section>${footer('/aigc/','AI Generated Content')}</main>`; }

const caseData = {
 mingde: {title:'MINGDE<br>2021', label:'Case Study · MINGDE 2021', color:'mingde-case', hero:1, summary:'Translating the emotional logic of an Olympic opening ceremony into a high-school sports day — from the first improbable idea to approval, identity, objects, light, live direction, and documentation.', facts:['Director & Creative Lead','Campus Olympics × Art Festival','Organisers, creatives & vendors','Safety, trust & budget','Identity, ceremony, objects & media'], impact:'Idea to<br>live moment.', next:'/event-experience/graduation-banquet/', nextLabel:'Graduation Banquet 2022', chapters:[['01','Inspiration','The starting point was the Olympic flame: not simply fire as spectacle, but the way an opening ceremony turns a crowd into participants in one shared moment.','I asked whether that anticipation and collective memory could exist inside a school sports day.',[1,24]],['02','The hard question','The idea immediately created understandable resistance: a school cannot casually use open flame, a complex ceremony can disrupt the sports schedule, and an experimental object can appear expensive or operationally fragile.','The real design problem was making an unfamiliar proposal legible to leadership and translating safety concerns into requirements.',[]],['03','Stakeholder alignment','I reframed the proposal around outcomes leadership could evaluate: a stronger opening moment, one coherent identity, and a memorable shared experience.','The question shifted from “Can a school light a fire?” to “How can we preserve the meaning of the flame safely?”',[7,39]],['04','Team, vendors & budget','I organized planning, creative production, operations, and documentation so they could move in parallel while staying visually aligned.','Vendor briefs specified dimensions, materials, deadlines, and acceptable substitutions; I negotiated cost-driving details and maintained fallback options.',[13,8]],['05','Experience journey','Social communication built recognition before arrival; banners and credentials established the world at the venue; the programme gradually increased attention.','A 50m × 15m Arduino-controlled LED installation and rehearsed transitions turned the concept into a safe, coordinated live moment.',[24,44]],['06','Editorial afterlife','The project continued through event photography, image selection, video editing, and social publishing.','Documentation was treated as an extension of the design system, communicating atmosphere, audience, objects, and ceremony.',[]]]},
 banquet: {title:'Graduation<br>Banquet', label:'Case Study · Graduation Banquet', color:'banquet-case', hero:4, summary:'Designing a dinner as a complete guest journey — atmosphere, hospitality, table details, food, ceremony, documentation, and the editorial story that remained afterward.', facts:['Experience & Visual Design','Graduation Dinner','School teams, dining & vendors','Hospitality & atmosphere','Live event, photo, film & editorial'], impact:'Every detail<br>welcomes.', next:'/event-experience/mingde-2021/', nextLabel:'MINGDE 2021', chapters:[['01','Experience brief','A graduation banquet is neither a formal ceremony nor an ordinary meal. It needs to carry pride and closure while allowing students, teachers, and guests to feel relaxed.','I defined the emotional arc first: arrival and recognition, ease and conversation, collective reflection, celebration, and a warm final memory.',[4,14]],['02','From mood to plan','Warm low light, candle points, restrained table styling, and a clear room composition transformed a familiar school dining space into an environment that felt temporary and special.','I mapped invitation, arrival, seating, sightlines, circulation, stage focus, service movement, programme pacing, food, conversation, and departure as one journey.',[]],['03','Departments & suppliers','The experience depended on partners whose priorities were operational: dining, facilities, suppliers, and school stakeholders.','I translated the visual idea into practical requests, compared vendors and substitutions, negotiated cost-sensitive items, and protected the details guests would notice most.',[14,15]],['04','Hospitality details','Candlelight changed the perception of the room; tableware and drinks contributed color and tactility; apple juice recalled from a shared factory visit became collective memory.','Together these choices reduced formality, encouraged conversation, and made guests feel the evening had been designed specifically for them.',[4,29]],['05','Run of show','Arrival allowed guests to settle; food and conversation established comfort; speeches and collective moments appeared after the room had emotionally warmed.','The full rhythm connected welcome and seating, service and social time, screen content and speeches, shared memories, photography, celebration, and departure.',[]],['06','Editorial afterlife','Afterward, I organized photography, selected and edited images, shaped video material, and designed the editorial and social presentation.','The publication reconstructed the experience through room, detail, gesture, food, and collective moments.',[4,29]]]}
};
function caseStudy(kind) { const d=caseData[kind]; $('#app').innerHTML = `<main class="detail-page case-page ${d.color}">${detailNav(d.label)}<section class="case-hero"><div><span>Event & Experience Design · ${kind==='mingde'?'2021':'2022'}</span><h1>${d.title}</h1><p>${d.summary}</p></div>${img(d.hero)}</section><section class="case-facts">${d.facts.map((f,i)=>`<div><small>${['Role','Concept','Partners','Focus','Output'][i]}</small>${f}</div>`).join('')}</section><article class="case-story">${d.chapters.map(c=>`<section><h2><span>${c[0]}</span>${c[1]}</h2><div><p>${c[2]}</p><p>${c[3]}</p>${c[4].length?`<div class="case-visuals">${c[4].map(n=>img(n,c[1])).join('')}</div>`:''}</div></section>`).join('')}</article><section class="case-impact"><h2>${d.impact}</h2><p>${d.summary}</p></section>${footer(d.next,d.nextLabel)}</main>`; }

({home, photography:()=>practice('photography'), visual:()=>practice('visual'), aigc, events, mingde:()=>caseStudy('mingde'), banquet:()=>caseStudy('banquet')}[window.CAREER_PAGE] || home)();
const localRoutes = {
  '/': 'index.html', '/aigc/': 'aigc.html', '/photography/': 'photography.html',
  '/visual-design/': 'visual-design.html', '/event-experience/': 'event-experience.html',
  '/event-experience/mingde-2021/': 'mingde-2021.html', '/event-experience/graduation-banquet/': 'graduation-banquet.html'
};
document.querySelectorAll('a[href^="/"]').forEach((link) => {
  const href = link.getAttribute('href');
  const [path, hash = ''] = href.split('#');
  if (localRoutes[path]) link.setAttribute('href', `${localRoutes[path]}${hash ? `#${hash}` : ''}`);
});
document.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => {
  const language = button.dataset.language;
  document.documentElement.lang = language === 'zh' ? 'zh-Hans' : 'en';
  document.querySelectorAll('[data-language]').forEach((item) => {
    const active = item.dataset.language === language;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  localStorage.setItem('career-language', language);
}));
