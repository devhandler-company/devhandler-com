// /blocks/blog-hero/blog-hero.js
import { loadFragment } from '../fragment/fragment.js';

/* ---------------------------
   Small helpers (existing)
---------------------------- */
const getPrimarySrc = (pic) => pic?.querySelector('source[srcset]')?.srcset || pic?.querySelector('img')?.src || '';

const getPrimaryType = (pic) => pic?.querySelector('source[type]')?.type || '';

const buildSwitchablePicture = (pics) => {
  const [desktopPic, tabletPic, mobilePic] = pics;
  const picture = document.createElement('picture');

  const BP_DESKTOP = '(min-width: 1024px)';
  const BP_TABLET = '(min-width: 600px)';

  if (desktopPic) {
    const src = getPrimarySrc(desktopPic);
    if (src) {
      const type = getPrimaryType(desktopPic);
      const s = document.createElement('source');
      s.media = BP_DESKTOP;
      if (type) s.type = type;
      s.srcset = src;
      picture.appendChild(s);
    }
  }

  if (tabletPic) {
    const src = getPrimarySrc(tabletPic);
    if (src) {
      const type = getPrimaryType(tabletPic);
      const s = document.createElement('source');
      s.media = BP_TABLET;
      if (type) s.type = type;
      s.srcset = src;
      picture.appendChild(s);
    }
  }

  const fallbackImg = (mobilePic || tabletPic || desktopPic)?.querySelector('img')?.cloneNode(true) || document.createElement('img');

  if (!fallbackImg.src) {
    fallbackImg.src = getPrimarySrc(mobilePic || tabletPic || desktopPic) || '';
  }
  fallbackImg.alt = fallbackImg.alt || '';

  picture.appendChild(fallbackImg);
  return picture;
};

/* ---------------------------
   Search fragment resolver
---------------------------- */
const getSearchPath = (block) => {
  if (block.classList.contains('search-case')) return '/fragments/search-case';
  if (block.classList.contains('search-blog')) return '/fragments/search-blog';
  if (block.classList.contains('search')) return '/fragments/search-blog';
  return '';
};

/* ---------------------------
   Badges (class-driven)
---------------------------- */
const titleizeToken = (t) => t
  .replace(/^badge-/, '')
  .split('-')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ');

/* ---------------------------
   Reveal-in-view
---------------------------- */
const enableReveal = (root) => {
  const els = root.querySelectorAll('.reveal');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => {
      el.dataset.inview = 'true';
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.dataset.inview = 'true';
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );

  els.forEach((el) => io.observe(el));
};

/* ---------------------------
   Parallax translateY
---------------------------- */
const enableParallaxTransform = (block) => {
  if (!block.classList.contains('parallax')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Apply the same tiny parallax shift to all media layers
  const mediaEls = [...block.querySelectorAll('picture, img, video')];
  if (!mediaEls.length) return;

  let ticking = false;
  const maxOffset = 12; // px

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = block.getBoundingClientRect();
      const viewH = Math.max(window.innerHeight, 1);
      const t = (rect.top + rect.height * 0.5 - viewH * 0.5) / (viewH * 0.5);
      const offset = Math.max(-maxOffset, Math.min(maxOffset, -t * maxOffset * 0.5));
      mediaEls.forEach((el) => {
        el.style.transform = `translateY(${offset}px)`;
      });
      ticking = false;
    });
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
};

/* ---------------------------
   Video helpers
---------------------------- */

// Extract authored mp4 URLs. We accept <h1..h6>, <p>, <span>, <code>, etc.
function getAuthoredVideoUrls(root) {
  const nodes = root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,code');
  const urls = [];
  nodes.forEach((n) => {
    const txt = n.textContent?.trim();
    if (txt && /\.mp4(\b|$)/i.test(txt)) {
      urls.push({ el: n, url: txt, id: n.id || '' });
    }
  });

  // classify into desktop/mobile using id/text heuristics
  const out = { desktop: '', mobile: '' };

  urls.forEach(({ url, id }) => {
    const idLC = id.toLowerCase();
    const urlLC = url.toLowerCase();
    if (idLC.includes('desktop') || urlLC.includes('desktop')) out.desktop = url;
    else if (idLC.includes('mobile') || urlLC.includes('mobile')) out.mobile = url;
  });

  // fallback: first -> desktop, second -> mobile
  if (!out.desktop || !out.mobile) {
    const list = urls.map((u) => u.url);
    const [desktop, mobile] = list;

    if (!out.desktop && desktop !== undefined) out.desktop = desktop;
    if (!out.mobile && mobile !== undefined) out.mobile = mobile;
  }

  return out;
}

function buildVideoElement({ poster }) {
  const v = document.createElement('video');
  v.autoplay = true;
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.setAttribute('aria-hidden', 'true');
  if (poster) v.setAttribute('poster', poster);
  // start transparent; will fade in on canplay
  v.style.opacity = '0';
  return v;
}

function chooseVideoSrc({ desktop, mobile }) {
  // Desktop breakpoint (match your picture logic)
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  return (isDesktop ? desktop : mobile) || desktop || mobile || '';
}

function attachVideoSwitching(block, videoEl, sources) {
  if (!sources.desktop && !sources.mobile) return;

  const setSrc = (src) => {
    if (!src) return;
    if (videoEl.currentSrc?.includes(src)) return; // already applied
    videoEl.src = src;
    // Load and try to play
    try {
      videoEl.load();
      const p = videoEl.play();
      if (p && typeof p.then === 'function') p.catch(() => {});
    } catch (e) {
      /* ignore */
    }
  };

  // initial
  setSrc(chooseVideoSrc(sources));

  // switch when breakpoint changes (only if class video-switchable is present)
  if (block.classList.contains('video-switchable')) {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setSrc(chooseVideoSrc(sources));
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else if (mql.addListener) mql.addListener(onChange);
  }

  // pause/resume when tab visibility changes
  const onVis = () => {
    if (document.hidden) {
      try {
        videoEl.pause();
      } catch (e) {
        /* ignore */
      }
    } else {
      try {
        const p = videoEl.play();
        if (p && typeof p.then === 'function') p.catch(() => {});
      } catch (e) {
        /* ignore */
      }
    }
  };
  document.addEventListener('visibilitychange', onVis);
}

/* ---------------------------
   Main decorator
---------------------------- */
export default async function decorate(block) {
  const authoredPictures = [...block.querySelectorAll('picture')];

  // text extraction (optional; keeps existing behavior for title/desc/link)
  const texts = block.querySelectorAll('p');
  const titleText = texts?.[0]?.innerText;
  const descriptionText = texts?.[1]?.innerText;
  const link = texts?.[2]?.querySelector('a');

  // Build switchable Picture (image layer, used as preview/poster)
  let picture;
  if (block.classList.contains('switchable-image') && authoredPictures.length > 1) {
    picture = buildSwitchablePicture(authoredPictures);
  } else {
    [picture] = authoredPictures;
  }

  // Grab video URLs before clearing authored nodes
  const isVideoBlock = block.classList.contains('video');
  const sources = isVideoBlock ? getAuthoredVideoUrls(block) : { desktop: '', mobile: '' };

  // Reset block and place media layers
  block.innerText = '';
  if (picture) block.appendChild(picture);

  // If reduced motion, keep image only
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Build video layer if requested and not reduced motion
  let videoEl = null;
  if (isVideoBlock && !prefersReduce && (sources.desktop || sources.mobile)) {
    const posterUrl = picture?.querySelector('img')?.src || '';
    videoEl = buildVideoElement({ poster: posterUrl });

    // If "video-preview" -> keep image under video and fade video on ready
    // Otherwise we still keep picture for poster + graceful fallback.
    block.appendChild(videoEl);

    // Fade-in once video can play
    const onCanPlay = () => {
      block.classList.add('video-ready');
      videoEl.style.opacity = ''; // let CSS rule manage opacity
      videoEl.removeEventListener('canplay', onCanPlay);
    };
    videoEl.addEventListener('canplay', onCanPlay);

    attachVideoSwitching(block, videoEl, sources);
  }

  // Content container (keeps original behavior)
  const heroContent = document.createElement('div');
  heroContent.classList.add('blog-hero-content');

  const heroOptionalContainer = document.createElement('div');
  heroOptionalContainer.classList.add('blog-hero-optional-container');

  // Heading
  const heading = document.createElement('h1');
  if (descriptionText || link) heading.classList.add('blog-hero-text-short');
  heading.classList.add('reveal');
  heading.innerText = titleText || '';
  heroContent.appendChild(heading);

  // Badges via class names `badge-*`
  const badgeTokens = [...block.classList].filter((c) => c.startsWith('badge-'));
  if (badgeTokens.length) {
    const list = document.createElement('ul');
    list.className = 'blog-hero-badges reveal';
    list.setAttribute('role', 'list');
    badgeTokens.forEach((c) => {
      const li = document.createElement('li');
      li.className = 'badge';
      li.textContent = titleizeToken(c);
      list.appendChild(li);
    });
    heroContent.appendChild(list);
  }

  // Description + CTA
  if (descriptionText) {
    const description = document.createElement('p');
    description.classList.add('blog-hero-text-short', 'reveal');
    description.innerText = descriptionText;
    heroOptionalContainer.appendChild(description);
  }

  if (link) {
    link.classList.add('text-color-blue', 'reveal');
    heroOptionalContainer.appendChild(link);
  }

  heroContent.appendChild(heroOptionalContainer);

  // Search fragment injection (class priority)
  const searchPath = getSearchPath(block);
  if (searchPath) {
    const frag = await loadFragment(searchPath);
    const fragmentRoot = frag?.firstElementChild?.firstElementChild;
    if (fragmentRoot) heroContent.appendChild(fragmentRoot);
  }

  block.appendChild(heroContent);

  // Reveal + Parallax
  enableReveal(block);
  enableParallaxTransform(block);

  // Sticky/parallax DOM wrapping (unchanged)
  if (block.classList.contains('parallax')) {
    const main = block.closest('main');
    const heroCnt = block.closest('.blog-hero-container') || block;

    if (main) main.style.position = 'relative';

    const sections = [...main.querySelectorAll(':scope > .section')];
    const startIdx = sections.findIndex((sec) => sec.contains(heroCnt));
    if (startIdx > -1 && startIdx < sections.length - 1) {
      const wrapper = document.createElement('div');
      wrapper.className = 'parallax-content';
      sections.slice(startIdx + 1).forEach((sec) => wrapper.appendChild(sec));
      heroCnt.insertAdjacentElement('afterend', wrapper);
    }
  }
}
