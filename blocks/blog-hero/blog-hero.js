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
    const imgEl = picture.querySelector('img');
    const url = imgEl?.currentSrc || imgEl?.src;
    if (url) {
      // block.style.backgroundImage = `url("${url}")`;
      block.style.backgroundSize = 'cover';
      block.style.backgroundPosition = 'top';
      block.style.backgroundAttachment = 'fixed';
      block.style.backgroundRepeat = 'no-repeat';
      block.style.filter = 'contrast(1.05) brightness(1.03) saturate(1.1)';

      const setAspectRatioOnResize = () => {
        let w = imgEl.width;
        let h = imgEl.height;
        if ((!w || !h) && imgEl.hasAttribute('width') && imgEl.hasAttribute('height')) {
          w = parseInt(w, 10);
          h = parseInt(h, 10);
        }
        if (window.innerWidth > 1024) {
          block.style.backgroundAttachment = 'fixed';
        }
        if (window.innerWidth <= 1024) {
          block.style.backgroundAttachment = 'scroll';
        }
        if (w > 0 && h > 0 && CSS.supports('aspect-ratio', '1/1')) {
          // block.style.aspectRatio = `${w} / ${h - 60}`;
          // block.style.backgroundSize = `${w}px  ${h}px`;
        }
      };

      const setAspectRatioOnLoad = () => {
        // const w = parseInt(window.innerWidth, 10);
        // const h = parseInt(window.innerHeight, 10);
        if (window.innerWidth > 1024) {
          block.style.backgroundAttachment = 'fixed';
        }
        if (window.innerWidth <= 1024) {
          block.style.backgroundAttachment = 'scroll';
        }
        // block.style.aspectRatio = `${w} / ${h * 0.95}`;
        // block.style.backgroundSize = `${w}px  ${h * 0.95}px`;
      };

      setAspectRatioOnLoad();
      window.addEventListener('resize', setAspectRatioOnResize);
    }
  }
}
