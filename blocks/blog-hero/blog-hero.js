import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const picture = block.querySelector('picture');
  const texts = block.querySelectorAll('p');
  const titleText = texts?.[0]?.innerText;
  const descriptionText = texts?.[1]?.innerText;
  const link = texts?.[2]?.querySelector('a');

  block.innerText = '';
  block.appendChild(picture);

  const heroContent = document.createElement('div');
  heroContent.classList.add('blog-hero-content');

  const heroOptionalContainer = document.createElement('div');
  heroOptionalContainer.classList.add('blog-hero-optional-container');

  const heading = document.createElement('h1');
  if (descriptionText || link) {
    heading.classList.add('blog-hero-text-short');
  }
  heading.innerText = titleText || '';
  heroContent.appendChild(heading);

  if (descriptionText) {
    const description = document.createElement('p');
    description.classList.add('blog-hero-text-short');
    description.innerText = descriptionText;
    heroOptionalContainer.appendChild(description);
  }
  if (link) {
    link.classList.add('text-color-blue');
    heroOptionalContainer.appendChild(link);
  }
  heroContent.appendChild(heroOptionalContainer);

  if (block.classList.contains('search')) {
    const searchFragment = loadFragment('/fragments/search-blog');
    heroContent.appendChild(searchFragment?.firstElementChild?.firstElementChild);
  }

  block.appendChild(heroContent);

  if (block.classList.contains('parallax')) {
    const main = block.closest('main');
    const heroCnt = block.closest('.blog-hero-container') || block;

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
