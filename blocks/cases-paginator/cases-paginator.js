/* eslint-disable no-use-before-define */
/* Cases Paginator (overlay-free + responsive mobile mode)
 * - Desktop: original mirrored or cards (based on classes)
 * - Mobile (<= 991px): forced cards, 1 column, EXACTLY 2 cards per viewport
 * - Live mode switch on resize; keeps position across modes
 * - Page-lock + snap + queued navigation intact
 * - Direct navigation via curtain animation (no overlays)
 */

export default async function decorate(block) {
  /* ---------- helpers ---------- */
  const MOBILE_MAX = 991;

  const debounce = (fn, ms = 120) => {
    let t = 0;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const isMobile = () => window.innerWidth <= MOBILE_MAX;

  function resetTouchAccum() {
    touchAccum = 0;
    if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = 0;
    }
  }
  function bumpTouchAccum(dy) {
    touchAccum += dy; // signed; downward swipe -> positive
    if (touchTimer) clearTimeout(touchTimer);
    touchTimer = setTimeout(resetTouchAccum, touchInactivityMs);
  }
  function resetWheelAccum() {
    wheelAccum = 0;
    if (wheelTimer) {
      clearTimeout(wheelTimer);
      wheelTimer = 0;
    }
  }
  function bumpWheelAccum(dy) {
    wheelAccum += dy; // signed accumulation (trackpads fine too)
    if (wheelTimer) clearTimeout(wheelTimer);
    wheelTimer = setTimeout(resetWheelAccum, wheelInactivityMs);
  }
  function toCamel(s) {
    return s.toLowerCase().replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  }
  function asBool(v, d = false) {
    if (v == null || v === '') return d;
    return /^(true|1|yes|on)$/i.test(String(v).trim());
  }
  function toNum(v, d = 0) {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? d : n;
  }
  function hasClass(el, t) {
    return [...el.classList].some((c) => c.toLowerCase() === String(t).toLowerCase());
  }
  function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
  function readConfig(blk) {
    const cfg = {};
    [...blk.children].forEach((row) => {
      const [k, v] = row.children;
      if (!k || !v) return;
      const key = toCamel(k.textContent.trim());
      const val = v.textContent.trim();
      if (key === 'classes') val.split(/\s+/).forEach((c) => c && blk.classList.add(c));
      else cfg[key] = val;
    });
    return cfg;
  }
  function isAllToken(v) {
    if (v == null) return false;
    const s = String(v).trim().toLowerCase();
    return s === 'all' || s === '*' || s === '-1';
  }

  /* ---------- config ---------- */
  const cfg = readConfig(block);

  // [Mobile forced settings: ignore configs on mobile]
  const CARDS_PER_SLIDE_MOBILE = 2; // exactly two cards per viewport
  const CARDS_PER_ROW_MOBILE = 1; // one column

  // field mapping
  const FIELDS = {
    title: cfg.titleField || 'title',
    image: cfg.imageField || 'image',
    description: cfg.descriptionField || 'description',
    path: cfg.pathField || 'path',
    template: cfg.templateField || 'template',
  };

  // data + behavior
  const pageTemplate = cfg.pageTemplate || 'case-page-template';
  const indexUrl = cfg.queryIndexLink || '/cases/query-index.json';
  const limitRaw = cfg.countOfArticles;
  const offset = toNum(cfg.offset, 0);
  const fetchAll = isAllToken(limitRaw) || hasClass(block, 'fetch-all');
  const limit = fetchAll ? Infinity : toNum(limitRaw, 6);

  const initialPage = Math.max(1, toNum(cfg.initialPage, 1));
  const overlayCtaText = cfg.overlayCtaText || 'Open case →'; // still used for card CTA text

  // interaction thresholds
  const wheelThreshold = toNum(cfg.wheelThreshold, 360);
  const wheelInactivityMs = toNum(cfg.wheelInactivityMs, 280);
  const touchThresholdPx = toNum(cfg.touchThresholdPx, 140);
  const touchInactivityMs = toNum(cfg.touchInactivityMs, 250);
  const touchMinMovePx = toNum(cfg.touchMinMovePx, 8);

  // switches via rows OR classes
  const showDots = asBool(cfg.showDots, !hasClass(block, 'no-dots')) || hasClass(block, 'show-dots');
  const showNames = asBool(cfg.showNames, !hasClass(block, 'no-names')) || hasClass(block, 'show-names');
  const wheelEnabled = !hasClass(block, 'wheel-off') && asBool(cfg.wheelEnabled, true);
  const keyboardEnabled = !hasClass(block, 'keyboard-off') && asBool(cfg.keyboardEnabled, true);
  const helpersOn = !hasClass(block, 'helpers-off') && asBool(cfg.helpersOn, true);
  const fixedBg = !hasClass(block, 'fixed-bg-off') && asBool(cfg.fixedBg, true);

  // optional top offset (sticky header height in px)
  const lockTopOffset = toNum(cfg.lockTopOffset, 0);

  // desktop "cards" variant via class
  const isCardsLayout = hasClass(block, 'layout-cards') || hasClass(block, 'layout-cards-2col');
  const cardsPerRow = toNum(cfg.cardsPerRow, 2);
  const rowsPerSlide = toNum(cfg.rowsPerSlide, 2);
  const cardsPerSlide = Math.max(1, cardsPerRow * rowsPerSlide);
  const fillLastSlide = asBool(cfg.fillLastSlide, true); // duplicate from start to fill grid

  // helpers to pick mode by viewport
  const usingCards = () => isMobile() || isCardsLayout;
  const itemsPerSlideNow = () => {
    if (isMobile()) return CARDS_PER_SLIDE_MOBILE;
    if (isCardsLayout) return cardsPerSlide;
    return 1;
  };

  // original wide lock band (engages reliably)
  const LOCK_TOP_FRACTION = 0.25;
  const LOCK_BOTTOM_FRACTION = 0.75;

  // clear authoring table
  block.innerHTML = '';

  /* ---------- data (filter out items with no image) ---------- */
  let data = [];
  try {
    const resp = await fetch(new URL(indexUrl, window.location.origin), { credentials: 'same-origin' });
    const json = await resp.json();
    const rows = json.data || json.items || [];

    const hasImage = (r) => {
      const raw = r[FIELDS.image] ?? r.image ?? r.cardImage ?? r.thumbnail;
      const s = raw == null ? '' : String(raw).trim();
      return !!s && s.toLowerCase() !== 'none';
    };

    const filtered = rows
      .filter((r) => (!pageTemplate ? true : (r[FIELDS.template] || '').trim() === pageTemplate))
      .filter(hasImage);

    data = fetchAll ? filtered.slice(0) : filtered.slice(offset, offset + limit);

    // Keep desktop cards full by duplicating to fill last slide if needed
    if (isCardsLayout && fillLastSlide && data.length && cardsPerSlide > 1 && !isMobile()) {
      const remainder = data.length % cardsPerSlide;
      if (remainder !== 0) {
        const missing = cardsPerSlide - remainder;
        const clones = data.slice(0, Math.min(missing, data.length));
        data = data.concat(clones);
      }
    }
  } catch {
    const p = document.createElement('p');
    p.className = 'cases-paginator__error';
    p.textContent = 'Could not load cases.';
    block.append(p);
    return;
  }

  if (!data.length) {
    const p = document.createElement('p');
    p.className = 'cases-paginator__empty';
    p.textContent = 'No cases found.';
    block.append(p);
    return;
  }

  /* ---------- DOM scaffold ---------- */
  const scene = document.createElement('div');
  scene.className = 'cases-scene';
  scene.innerHTML = `
    ${
  helpersOn
    ? `
      <h2 class="heading heading--global">EXPLORE OUR CASES</h2>
      <p class="scroll-down scroll-down--global">scroll cases down</p>
      <p class="click-blocks click-blocks--global">hover cases blocks</p>`
    : ''
}
    <div class="pagination">
      <ul class="page-names"></ul>
      <ul class="page-dots" role="tablist" aria-label="Pagination"></ul>
    </div>`;
  const pageNames = scene.querySelector('.page-names');
  const pageDots = scene.querySelector('.page-dots');

  // Hover title slot
  const hoverNameEl = document.createElement('li');
  hoverNameEl.className = 'hover-title';
  pageNames.append(hoverNameEl);

  // arrays for current build
  let leftEls = [];
  let rightEls = [];
  let slideEls = [];

  // builder utils
  function clearSlidesAndPagination() {
    scene.querySelectorAll('.img-cont, .cards-slide').forEach((n) => n.remove());
    pageDots.innerHTML = '';
    pageNames.querySelectorAll('li:not(.hover-title)').forEach((n) => n.remove());
    leftEls = [];
    rightEls = [];
    slideEls = [];
  }

  function buildMobileSlide(items, slideIdx) {
    const slide = document.createElement('section');
    slide.className = `cards-slide cont-${slideIdx} cards-slide--mobile`;
    slide.dataset.helper = `${-(slideIdx - 1)}`;
    slide.dataset.blocks = String(slideIdx);
    slide.style.setProperty('--cards-per-row', CARDS_PER_ROW_MOBILE);

    const stack = document.createElement('div');
    stack.className = 'mobile-stack';

    const mkCardWrap = (item, pos) => {
      const wrap = document.createElement('div');
      wrap.className = `card-wrap card-wrap--${pos}`;
      if (!item) {
        wrap.innerHTML = '<div class="card-placeholder"></div>';
        return wrap;
      }

      const title = item[FIELDS.title] || `Case ${pos}`;
      const desc = item[FIELDS.description] || '';
      const path = item[FIELDS.path] || '#';
      const img = item[FIELDS.image];

      wrap.innerHTML = `
        <article class="case-card card">
          <a class="card-media" href="${path}" aria-label="${title}">
            <span class="visually-hidden">${title}</span>
          </a>
          <div class="card-body">
            <h3 class="card-title">${title}</h3>
            <p class="card-text">${desc}</p>
            <p class="card-cta"><a class="button" href="${path}">${overlayCtaText}</a></p>
          </div>
        </article>`;
      const media = wrap.querySelector('.card-media');
      if (media && img) media.style.backgroundImage = `url("${img}")`;

      // mobile helpers near the cards
      if (helpersOn) {
        if (pos === 'top') {
          const h = document.createElement('p');
          h.className = 'click-blocks click-blocks--mobile';
          h.textContent = 'hover cases blocks';
          wrap.append(h);
        } else {
          const s = document.createElement('p');
          s.className = 'scroll-down scroll-down--mobile';
          s.textContent = 'scroll cases down';
          wrap.append(s);
        }
      }
      return wrap;
    };

    const first = items[0] || null;
    const second = items[1] || null;

    const midHeading = document.createElement('h2');
    midHeading.className = 'heading heading--mobile';
    midHeading.textContent = 'EXPLORE OUR CASES';

    stack.append(mkCardWrap(first, 'top'), midHeading, mkCardWrap(second, 'bottom'));
    slide.append(stack);
    return slide;
  }

  function buildSlidesForViewport() {
    clearSlidesAndPagination();

    if (!usingCards()) {
      // ===== Desktop MIRRORED =====
      data.forEach((item, i) => {
        const idx = i + 1;
        const title = item[FIELDS.title] || `Case ${idx}`;
        const path = item[FIELDS.path] || '#';
        const img = item[FIELDS.image];

        const left = document.createElement('div');
        left.className = `img-cont left cont-${idx}`;
        left.dataset.helper = `${-(idx - 1)}`;
        left.dataset.blocks = `${idx}`;
        left.style.setProperty('--bg', `url("${img}")`);
        if (!fixedBg) left.style.backgroundAttachment = 'scroll';
        left.dataset.href = path;
        left.setAttribute('role', 'link');
        left.setAttribute('aria-label', title);

        const right = document.createElement('div');
        right.className = `img-cont right cont-${idx}`;
        right.dataset.helper = `${idx - 1}`;
        right.dataset.blocks = `${idx}`;
        right.style.setProperty('--bg', `url("${img}")`);
        if (!fixedBg) right.style.backgroundAttachment = 'scroll';
        right.dataset.href = path;
        right.setAttribute('role', 'link');
        right.setAttribute('aria-label', title);

        scene.append(left, right);
        leftEls.push(left);
        rightEls.push(right);

        if (showNames) {
          const li = document.createElement('li');
          li.dataset.page = String(idx);
          li.textContent = title;
          if (idx === 1) li.classList.add('active');
          pageNames.append(li);
        }
        if (showDots) {
          const li = document.createElement('li');
          li.dataset.page = String(idx);
          li.textContent = '•';
          li.setAttribute('role', 'tab');
          if (idx === 1) li.classList.add('active');
          pageDots.append(li);
        }
      });
    } else {
      // ===== CARDS: desktop grid OR mobile stack =====
      const per = itemsPerSlideNow(); // 2 on mobile; desktop uses config
      const slides = chunk(data, per);

      slides.forEach((items, i) => {
        const slideIdx = i + 1;
        let slide;

        if (isMobile()) {
          slide = buildMobileSlide(items, slideIdx);
        } else {
          // desktop grid
          slide = document.createElement('section');
          slide.className = `cards-slide cont-${slideIdx}`;
          slide.dataset.helper = `${-(slideIdx - 1)}`;
          slide.dataset.blocks = String(slideIdx);
          slide.style.setProperty('--cards-per-row', cardsPerRow);

          const grid = document.createElement('div');
          grid.className = 'cards-grid';

          items.forEach((item, localIndex) => {
            const title = item[FIELDS.title] || `Case ${i}-${localIndex + 1}`;
            const desc = item[FIELDS.description] || '';
            const path = item[FIELDS.path] || '#';
            const img = item[FIELDS.image];

            const card = document.createElement('article');
            card.className = 'case-card card';
            card.innerHTML = `
              <a class="card-media" href="${path}" aria-label="${title}">
                <span class="visually-hidden">${title}</span>
              </a>
              <div class="card-body">
                <h3 class="card-title">${title}</h3>
                <p class="card-text">${desc}</p>
                <p class="card-cta"><a class="button" href="${path}">${overlayCtaText}</a></p>
              </div>`;
            card.querySelector('.card-media').style.backgroundImage = `url("${img}")`;
            grid.append(card);
          });

          slide.append(grid);
        }

        scene.append(slide);
        slideEls.push(slide);

        const firstTitle = items[0]?.[FIELDS.title] || `Slide ${slideIdx}`;
        if (showNames) {
          const li = document.createElement('li');
          li.dataset.page = String(slideIdx);
          li.textContent = firstTitle;
          if (slideIdx === 1) li.classList.add('active');
          pageNames.append(li);
        }
        if (showDots) {
          const li = document.createElement('li');
          li.dataset.page = String(slideIdx);
          li.textContent = '•';
          li.setAttribute('role', 'tab');
          if (slideIdx === 1) li.classList.add('active');
          pageDots.append(li);
        }
      });
    }

    // set a CSS flag for your styles to hide global helpers on mobile
    scene.classList.toggle('is-mobile', isMobile());
  }

  block.append(scene);

  // [ANIMATIONS] Start/stop helper text animations based on viewport.
  const animObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((ent) => {
        scene.dataset.animate = ent.isIntersecting ? 'on' : 'off';
      });
    },
    { threshold: 0.4 },
  );
  animObserver.observe(scene);

  /* ---------- state ---------- */
  const hostSection = block.closest('.section') || block;

  // Build initial slides for current viewport
  buildSlidesForViewport();

  let totalPages = usingCards() ? slideEls.length : data.length;
  let curPage = Math.min(Math.max(1, initialPage), totalPages);
  // keep global anchor to preserve position on resize mode changes
  // eslint-disable-next-line no-unused-vars
  let curItemIndex = (curPage - 1) * itemsPerSlideNow();

  let scrolling = false;
  let lockActive = false;
  let stickyUnlock = false;
  let snapping = false;
  // prevent double navigation during transition
  let isNavigating = false;
  /** queued action to run right after slide animation completes @type {'up'|'down'|null} */
  let queuedAction = null;

  // touch throttle
  let touchStartY = 0;
  let lastTouchNav = 0;
  let wheelAccum = 0;
  let wheelTimer = 0;
  let touchAccum = 0;
  let touchTimer = 0;
  let touchLastY = 0;

  /* ---------- core fns ---------- */
  function updateUIForPage(p) {
    pageDots?.querySelectorAll('li').forEach((li) => li.classList.toggle('active', li.dataset.page === String(p)));
    pageNames?.querySelectorAll('li').forEach((li) => li.classList.toggle('active', li.dataset.page === String(p)));
  }

  function doMargins(p = curPage) {
    scrolling = true;
    if (usingCards()) {
      slideEls.forEach((el) => {
        const mult = parseInt(el.dataset.helper, 10) + p - 1;
        el.style.marginTop = `${mult * 100}vh`;
      });
    } else {
      leftEls.forEach((el) => {
        const mult = parseInt(el.dataset.helper, 10) + p - 1;
        el.style.marginTop = `${mult * 100}vh`;
      });
      rightEls.forEach((el) => {
        const mult = parseInt(el.dataset.helper, 10) - p + 1;
        el.style.marginTop = `${mult * 100}vh`;
      });
    }
    setTimeout(() => {
      scrolling = false;
      maybeRunQueued();
    }, 600);
  }

  function pagination(p) {
    curPage = p;
    curItemIndex = (curPage - 1) * itemsPerSlideNow(); // anchor for future mode switches
    updateUIForPage(p);
  }

  function releaseToNext() {
    disablePageLock();
    stickyUnlock = true;
    const next = hostSection.nextElementSibling;
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' });
  }
  function releaseToPrev() {
    disablePageLock();
    stickyUnlock = true;
    const prev = hostSection.previousElementSibling;
    if (prev) prev.scrollIntoView({ behavior: 'smooth', block: 'end' });
    else window.scrollBy({ top: -window.innerHeight * 0.6, behavior: 'smooth' });
  }

  function navigateUp() {
    if (curPage > 1) {
      pagination(curPage - 1);
      doMargins();
    } else {
      releaseToPrev();
    }
  }
  function navigateDown() {
    if (curPage < totalPages) {
      pagination(curPage + 1);
      doMargins();
    } else {
      releaseToNext();
    }
  }

  function maybeRunQueued() {
    if (!queuedAction) return;
    const action = queuedAction;
    queuedAction = null;
    if (action === 'down') {
      if (curPage < totalPages) navigateDown();
      else releaseToNext();
    } else if (action === 'up') {
      if (curPage > 1) navigateUp();
      else releaseToPrev();
    }
  }

  // snap viewport so scene fills the screen (respect sticky header)
  function snapToBlock(immediate = false) {
    const rect = scene.getBoundingClientRect();
    const target = (window.scrollY || window.pageYOffset) + rect.top - lockTopOffset;
    snapping = true;
    if (immediate) window.scrollTo(0, target);
    else window.scrollTo({ top: target, behavior: 'smooth' });
    setTimeout(
      () => {
        snapping = false;
      },
      immediate ? 50 : 450,
    );
  }

  // Spinning CIRCLE transition: expands to cover the viewport, then navigates
  function navigateWithCurtain(href) {
    if (!href || isNavigating) return;
    isNavigating = true;

    // Respect reduced motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      window.location.href = href;
      return;
    }

    // Compute a circle diameter big enough to cover the viewport diagonal
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const diameter = Math.ceil(Math.hypot(vw, vh)) * 1.12; // +12% for safe coverage

    // Fullscreen overlay container (no CSS dependencies)
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9999',
      pointerEvents: 'auto',
      background: 'transparent', // only the circle is visible
      willChange: 'transform',
    });
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    // The expanding/spinning circle
    const circle = document.createElement('div');
    Object.assign(circle.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: `${diameter}px`,
      height: `${diameter}px`,
      marginLeft: `${-diameter / 2}px`,
      marginTop: `${-diameter / 2}px`,
      borderRadius: '50%',
      background: 'var(--page-transition-bg, #0b0b0b)', // themeable
      transform: 'scale(0) rotate(-540deg)',
      transformOrigin: '50% 50%',
      boxShadow: '0 0 60px rgba(0,0,0,.35) inset, 0 0 40px rgba(0,0,0,.25)',
      willChange: 'transform',
    });
    overlay.appendChild(circle);

    // Optional accent ring for extra motion (themeable via --cases-accent)
    const ring = document.createElement('div');
    const ringSize = Math.min(vw, vh) * 0.38; // visual accent size
    Object.assign(ring.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: `${ringSize}px`,
      height: `${ringSize}px`,
      marginLeft: `${-ringSize / 2}px`,
      marginTop: `${-ringSize / 2}px`,
      borderRadius: '50%',
      border: '3px solid rgba(255,255,255,0.12)',
      borderTopColor: 'var(--cases-accent, #4ce1ba)',
      pointerEvents: 'none',
    });
    overlay.appendChild(ring);

    // Spin the accent ring while the main circle expands
    ring.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
      duration: 900,
      iterations: Infinity,
      easing: 'linear',
    });

    // Expand + spin the main circle to fully cover the viewport, then navigate
    const coverAnim = circle.animate(
      [
        { transform: 'scale(0) rotate(-540deg)' },
        { transform: 'scale(1.08) rotate(0deg)' }, // slight overshoot for snappiness
      ],
      { duration: 650, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', fill: 'forwards' },
    );

    coverAnim.onfinish = () => {
      resetTouchAccum();
      window.location.href = href;
    };
  }

  function inLockBand() {
    const r = block.getBoundingClientRect();
    const topBand = window.innerHeight * LOCK_TOP_FRACTION;
    const botBand = window.innerHeight * LOCK_BOTTOM_FRACTION;
    return r.top <= topBand && r.bottom >= botBand;
  }

  /* ---------- page lock: block page scroll and route to slides ---------- */
  function onGlobalWheel(e) {
    if (!lockActive || snapping || !wheelEnabled) return;
    e.preventDefault();

    // accumulate wheel until threshold reached
    bumpWheelAccum(e.deltaY);
    if (Math.abs(wheelAccum) < wheelThreshold) return;

    const dir = wheelAccum < 0 ? 'up' : 'down';
    resetWheelAccum();

    if (scrolling) {
      queuedAction = dir; // run right after the slide finishes animating
      return;
    }
    if (dir === 'up') navigateUp();
    else navigateDown();
  }
  function onGlobalKeyDown(e) {
    if (!lockActive || snapping || !keyboardEnabled) return;
    const { key } = e;
    if (key === 'ArrowDown' || key === 'PageDown' || key === ' ') {
      e.preventDefault();
      if (scrolling) {
        queuedAction = 'down';
        return;
      }
      navigateDown();
    } else if (key === 'ArrowUp' || key === 'PageUp') {
      e.preventDefault();
      if (scrolling) {
        queuedAction = 'up';
        return;
      }
      navigateUp();
    } else if (key === 'Home') {
      e.preventDefault();
      pagination(1);
      doMargins();
    } else if (key === 'End') {
      e.preventDefault();
      pagination(totalPages);
      doMargins();
    }
  }
  function onTouchStart(e) {
    if (!lockActive) return;
    touchStartY = e.touches[0].clientY;
    touchLastY = touchStartY;
    resetTouchAccum();
  }
  function onTouchMove(e) {
    if (!lockActive || snapping) return;

    const y = e.touches[0].clientY;
    const dy = touchLastY - y; // >0 = moving up finger => page down intent

    if (Math.abs(dy) < touchMinMovePx) return; // ignore tiny jitter
    e.preventDefault(); // we are controlling the scroll while locked

    bumpWheelAccum?.(0); // keep wheel accumulation from interfering
    bumpTouchAccum(dy);
    touchLastY = y;

    // need more swipe distance
    if (Math.abs(touchAccum) < touchThresholdPx) return;

    const dir = touchAccum > 0 ? 'down' : 'up';
    resetTouchAccum();

    const now = Date.now();
    if (now - lastTouchNav < 200) {
      queuedAction = dir;
      return;
    }
    lastTouchNav = now;

    if (scrolling) {
      queuedAction = dir; // run right after slide finishes
      return;
    }
    if (dir === 'down') navigateDown();
    else navigateUp();
  }
  function onTouchEnd() {
    resetTouchAccum();
  }

  function enablePageLock({ snapImmediate = false } = {}) {
    if (lockActive) return;
    snapToBlock(snapImmediate);
    lockActive = true;
    document.body.classList.add('cases-page-locked');
    window.addEventListener('wheel', onGlobalWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onGlobalKeyDown, true);
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    resetWheelAccum();
    resetTouchAccum();
  }
  function disablePageLock() {
    if (!lockActive) return;
    lockActive = false;
    document.body.classList.remove('cases-page-locked');
    window.removeEventListener('wheel', onGlobalWheel, { passive: false });
    window.removeEventListener('touchstart', onTouchStart, { passive: true });
    window.removeEventListener('touchmove', onTouchMove, { passive: false });
    window.removeEventListener('keydown', onGlobalKeyDown, true);
    window.removeEventListener('touchend', onTouchEnd, { passive: true });
    resetWheelAccum();
    resetTouchAccum();
  }

  /* ---------- click navigation (no overlays) ---------- */
  if (!usingCards()) {
    // Click on either left/right image panel -> navigate to its href with curtain
    scene.addEventListener('click', (e) => {
      const pane = e.target.closest('.img-cont');
      if (!pane || !pane.dataset.href) return;
      e.preventDefault();
      navigateWithCurtain(pane.dataset.href);
    });

    // Also support Enter/Space on focused pane
    scene.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const pane = document.activeElement?.closest?.('.img-cont');
      if (!pane || !pane.dataset.href) return;
      e.preventDefault();
      navigateWithCurtain(pane.dataset.href);
    });
  } else {
    // CARDS: clicking media or CTA navigates with a curtain
    scene.addEventListener('click', (e) => {
      const anchor = e.target.closest('.case-card .card-media, .case-card .button');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href) {
        e.preventDefault();
        navigateWithCurtain(href);
      }
    });
  }

  /* ---------- dots click ---------- */
  pageDots?.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-page]');
    if (!li) return;
    if (!lockActive && inLockBand() && !stickyUnlock) enablePageLock();
    const page = parseInt(li.dataset.page, 10);
    pagination(page);
    doMargins(page);
    resetWheelAccum();
    resetTouchAccum();
  });

  /* ---------- viewport gating (original band logic) ---------- */
  function onScrollCheck() {
    const inside = inLockBand();
    if (inside && !lockActive && !stickyUnlock) enablePageLock();
    if (!inside && lockActive) disablePageLock();
    if (!inside && stickyUnlock) stickyUnlock = false;
  }
  window.addEventListener('scroll', onScrollCheck, { passive: true });

  // Live mode switch on resize (preserve position)
  let lastIsMobile = isMobile();
  let lastUsing = usingCards();

  const onResize = debounce(() => {
    const wasMobile = lastIsMobile;
    const wasUsing = lastUsing;
    let prevItems = 1;
    if (wasMobile) {
      prevItems = CARDS_PER_SLIDE_MOBILE;
    } else if (isCardsLayout) {
      prevItems = cardsPerSlide;
    }
    const anchorIndex = (curPage - 1) * prevItems;

    lastIsMobile = isMobile();
    lastUsing = usingCards();

    if (lastIsMobile !== wasMobile || lastUsing !== wasUsing) {
      buildSlidesForViewport();
      totalPages = usingCards() ? slideEls.length : data.length;

      const nowItems = itemsPerSlideNow();
      const newPage = Math.min(Math.max(1, Math.floor(anchorIndex / nowItems) + 1), totalPages);
      pagination(newPage);
      doMargins(newPage);
    }

    if (lockActive) snapToBlock(true);
  }, 150);
  window.addEventListener('resize', onResize);

  /* ---------- init ---------- */
  updateUIForPage(curPage);
  doMargins(curPage);
  if (inLockBand()) enablePageLock({ snapImmediate: true });
  if (document.fonts?.ready) document.fonts.ready.then(() => doMargins(curPage));
}
