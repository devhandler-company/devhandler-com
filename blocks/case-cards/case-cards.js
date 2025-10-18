/* eslint-disable linebreak-style */
/* eslint-disable no-param-reassign */
import { getBlockProperties } from '../../scripts/utils.js';
import { getCaseCardsData, getLatestCaseCards } from '../../scripts/caseService.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateCards from '../cards/cards.js';
import tns from '../../scripts/tinySlider.js';

/**
 * Reveal-in-view (fade/slide in) for LIs
 */
function enableReveal(listRoot) {
  const items = listRoot.querySelectorAll('li');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((li) => li.classList.add('reveal'));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal');
          obs.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );

  items.forEach((li) => io.observe(li));
}

/**
 * Extract autoplay interval from block classes.
 * Example: <div class="block case-cards autoplay-3000"> => 3000ms
 */
function getAutoplayIntervalFromClasses(block) {
  const cls = [...block.classList].find((c) => /^autoplay-\d+$/.test(c));
  return cls ? Math.max(600, parseInt(cls.split('-')[1], 10)) : 5000;
}

/**
 * Setup autoplay for a given slider (desktop only).
 * It finds tinySlider’s generated controls and clicks "next" on a timer.
 * Pauses on hover/focus/drag/touch and when document is hidden.
 */
function setupAutoplayForSlider(block, ulSelector, intervalMs) {
  const mql = window.matchMedia('(min-width: 700px)');
  let cleanupFns = [];
  let intervalId = null;

  const getOuterWrapper = () => {
    const ul = block.querySelector(ulSelector);
    if (!ul) return null;
    const ow = ul.closest('.tns-outer');
    return ow || null;
  };

  const getNextButton = (outerWrapper) => outerWrapper?.querySelector('.tns-controls [data-controls="next"]') || null;

  const pause = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const resume = () => {
    if (document.hidden) return;
    if (!mql.matches) return; // only on desktop where slider is visible
    const outerWrapper = getOuterWrapper();
    const nextBtn = getNextButton(outerWrapper);
    if (!outerWrapper || !nextBtn) return;
    pause(); // clear any existing
    intervalId = setInterval(() => {
      // guard against DOM changes
      const ow = getOuterWrapper();
      const nb = getNextButton(ow);
      if (!ow || !nb) {
        pause();
        return;
      }
      nb.click();
    }, intervalMs);
  };

  const attachHoverFocusPause = () => {
    const ow = getOuterWrapper();
    if (!ow) return;

    const onEnter = () => pause();
    const onLeave = () => resume();
    ow.addEventListener('mouseenter', onEnter);
    ow.addEventListener('mouseleave', onLeave);
    ow.addEventListener('focusin', onEnter);
    ow.addEventListener('focusout', onLeave);

    cleanupFns.push(() => {
      ow.removeEventListener('mouseenter', onEnter);
      ow.removeEventListener('mouseleave', onLeave);
      ow.removeEventListener('focusin', onEnter);
      ow.removeEventListener('focusout', onLeave);
    });

    // Pause during pointer interaction on the slide track as well
    const track = ow.querySelector('.tns-slider') || ow;
    const onDown = () => pause();
    const onUp = () => resume();
    track.addEventListener('mousedown', onDown);
    track.addEventListener('mouseup', onUp);
    track.addEventListener('touchstart', onDown, { passive: true });
    track.addEventListener('touchend', onUp);

    cleanupFns.push(() => {
      track.removeEventListener('mousedown', onDown);
      track.removeEventListener('mouseup', onUp);
      track.removeEventListener('touchstart', onDown, { passive: true });
      track.removeEventListener('touchend', onUp);
    });
  };

  const attachVisibilityListener = () => {
    const onVis = () => (document.hidden ? pause() : resume());
    document.addEventListener('visibilitychange', onVis);
    cleanupFns.push(() => document.removeEventListener('visibilitychange', onVis));
  };

  const start = () => {
    // tinySlider builds controls immediately; still, wrap in rAF to ensure DOM is ready
    requestAnimationFrame(() => {
      const ow = getOuterWrapper();
      const nb = getNextButton(ow);
      if (!ow || !nb) return;
      attachHoverFocusPause();
      attachVisibilityListener();
      resume();
    });
  };

  const stop = () => {
    pause();
    cleanupFns.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        /* ignore */
      }
    });
    cleanupFns = [];
  };

  const onViewportChange = () => {
    stop();
    if (mql.matches) start();
  };

  // boot & observe viewport changes
  onViewportChange();
  if (mql.addEventListener) {
    mql.addEventListener('change', onViewportChange);
    cleanupFns.push(() => mql.removeEventListener('change', onViewportChange));
  } else if (mql.addListener) {
    mql.addListener(onViewportChange);
    cleanupFns.push(() => mql.removeListener(onViewportChange));
  }

  // return a tiny cleanup in case you ever need it
  return () => stop();
}

/**
 * Build a single LI card
 */
function buildCaseCard({
  path, title, image, description,
}) {
  const li = document.createElement('li');

  const a = document.createElement('a');
  a.classList.add('case-cards-card');
  a.href = path;

  const cardImage = document.createElement('div');
  cardImage.className = 'case-cards-card-image';
  const picture = createOptimizedPicture(image, title || '', false, [{ width: '750' }]);
  cardImage.appendChild(picture);

  const cardBody = document.createElement('div');
  cardBody.className = 'case-cards-card-body';

  const titleEl = document.createElement('p');
  titleEl.innerHTML = `<strong>${title || ''}</strong>`;

  const descEl = document.createElement('p');
  descEl.innerText = description || '';

  const linkEl = document.createElement('p');
  linkEl.classList.add('button-container');
  linkEl.innerHTML = "<span class='button'>Read case</span>";

  cardBody.appendChild(titleEl);
  cardBody.appendChild(descEl);
  cardBody.appendChild(linkEl);

  a.appendChild(cardImage);
  a.appendChild(cardBody);
  li.appendChild(a);
  return li;
}

export default async function decorate(block) {
  let carouselId;
  const autoplayInterval = getAutoplayIntervalFromClasses(block);

  // ---------- MANUAL MODE ----------
  if (block.classList.contains('manual-configuration') && block?.children?.length) {
    carouselId = 'manual-configuration';

    // Convert authored table -> UL/LIs (reuses your cards decorator)
    decorateCards(block);

    const ul = block.querySelector('ul');
    if (ul) {
      if (!block.classList.contains('mobile-hidden')) {
        const ulMobile = ul.cloneNode(true);
        ulMobile.classList.add('case-cards-mobile-content');
        block.appendChild(ulMobile);
      }
      ul.classList.add('case-cards-content', 'case-cards-content-manual-configuration');
      enableReveal(ul);
    }
  } else {
    // ---------- AUTO MODE ----------
    const properties = getBlockProperties(block);
    const countOfCases = Number(properties.countOfCases || properties.countOfArticles || 4);
    const offset = Number(properties.offset || 0);
    const pageTemplate = properties.pageTemplate || 'case-page-template';
    const queryIndexLink = properties.queryIndexLink || '/cases/query-index.json';

    block.innerText = '';

    const caseCardsData = await getCaseCardsData(queryIndexLink);
    const latestCards = await getLatestCaseCards(caseCardsData, pageTemplate, countOfCases, offset);

    if (latestCards?.length) {
      carouselId = offset || 'auto';

      const ul = document.createElement('ul');
      let ulMobile;

      if (!block.classList.contains('mobile-hidden')) {
        ulMobile = document.createElement('ul');
        ulMobile.classList.add('case-cards-mobile-content');
        block.appendChild(ulMobile);
      }

      ul.classList.add('case-cards-content');
      ul.classList.add(`case-cards-content-${carouselId}`);

      latestCards.forEach((card) => {
        const li = buildCaseCard(card);
        ul.appendChild(li);
        if (ulMobile) ulMobile.appendChild(li.cloneNode(true));
      });

      block.appendChild(ul);
      if (ulMobile) block.appendChild(ulMobile);

      enableReveal(ul);
    }
  }

  // ---------- SLIDER INIT (desktop) ----------
  if (carouselId !== undefined && carouselId !== null) {
    // Use the same config family as blog-cards, but we won’t rely on library autoplay.
    tns({
      container: `.case-cards-content-${carouselId}`,
      items: 1.4,
      responsive: {
        700: { items: 1.4 },
        1010: { items: 2.4 },
      },
      slideBy: 'page',
      preventScrollOnTouch: 'force',
      swipeAngle: 45,
      nav: false,
      autoplay: false, // not supported in your version — we’ll handle autoplay ourselves
      mouseDrag: true,
      freezable: false,
      controlsText: ['', ''],
      // keep loop default behavior from your tinySlider build
    });

    // ---------- AUTOPLAY VIA DOM ----------
    // After tns initializes, the DOM will have .tns-outer with controls.
    // We hook into that and click "next" on a timer.
    const ulSelector = `.case-cards-content-${carouselId}`;
    setupAutoplayForSlider(block, ulSelector, autoplayInterval);
  }
}
