import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

import { modifyHeaders } from './utils.js';

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

const assignCssVariable = (htmlElement, variableName, variableValue) => {
  if (!variableValue) {
    return;
  }
  htmlElement.style.setProperty(variableName, variableValue);
};

const scrollLeftElements = () => {
  const fromRightElements = document.querySelectorAll('.show-from-left:not(.show-animation-finished)');
  const windowHeight = window.innerHeight;
  fromRightElements.forEach((el) => {
    const elementOffset = el.getBoundingClientRect().y;
    if (elementOffset < windowHeight) {
      el.classList.add('show-animation-finished');
      el.style.left = '0';
    }
  });
};

const processShowFromLeft = () => {
  scrollLeftElements();
  document.addEventListener('scroll', () => {
    scrollLeftElements();
  });
};

const scrollRightElements = () => {
  const fromRightElements = document.querySelectorAll('.show-from-right:not(.show-animation-finished)');
  const windowHeight = window.innerHeight;
  fromRightElements.forEach((el) => {
    const elementOffset = el.getBoundingClientRect().y;
    if (elementOffset < windowHeight) {
      el.classList.add('show-animation-finished');
      el.style.right = '0';
    }
  });
};

const processShowFromRight = () => {
  scrollRightElements();
  document.addEventListener('scroll', () => {
    scrollRightElements();
  });
};

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  decorateSections(main);
  decorateBlocks(main);
  modifyHeaders(main);
  document.querySelectorAll('.section').forEach((section) => {
    const { height, mobileHeight } = section.dataset;
    assignCssVariable(section, '--section-height', height);
    assignCssVariable(section, '--section-mobile-height', mobileHeight || height);
  });

  document.querySelectorAll('.section.bg').forEach((section) => {
    const backgroundHeight = section.dataset.backgroundHeight || '100%';
    const mobilBackgroundHeight = section.dataset.mobileBackgroundHeight || backgroundHeight;
    const backgroundSize = section.dataset.backgroundSize || 'cover';
    const backgroundPosition = section.dataset.backgroundPosition || 'center';
    const { backgroundBottom } = section.dataset;
    const backgroundImage = section.dataset.background ? `url(${section.dataset.background})` : 'none';
    const mobileBackgroundImage = section.dataset.mobileBackground || section.dataset.background ? `url(${section.dataset.mobileBackground || section.dataset.background})` : 'none';
    assignCssVariable(section, '--section-background-image', backgroundImage);
    assignCssVariable(section, '--section-background-height', backgroundHeight);
    assignCssVariable(section, '--section-mobile-background-image', mobileBackgroundImage);
    assignCssVariable(section, '--section-mobile-background-height', mobilBackgroundHeight);
    assignCssVariable(section, '--section-background-size', backgroundSize);
    assignCssVariable(section, '--section-background-position', backgroundPosition);
    assignCssVariable(section, '--section-background-bottom', backgroundBottom);
    assignCssVariable(section, '--section-background-top', backgroundBottom && backgroundBottom.length ? undefined : '0');
  });
}

const setSmoothButtonScroll = (link) => {
  const href = link.getAttribute('href');
  if (href && href.startsWith('#')) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const scrollToElementId = href.replace('#', '');
      const scrollToElement = document.getElementById(scrollToElementId);
      if (!scrollToElement) {
        return;
      }
      scrollToElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }
};

const setSmoothButtonsScroll = () => {
  const links = document.querySelectorAll('a');
  links.forEach(setSmoothButtonScroll);
};

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 1025 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadFonts();
  await loadEager(document);
  setSmoothButtonsScroll();
  await loadLazy(document);
  loadDelayed();
  processShowFromRight();
  processShowFromLeft();
}

loadPage();
