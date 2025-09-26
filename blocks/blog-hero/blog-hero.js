import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const authoredPictures = [...block.querySelectorAll('picture')];

  const texts = block.querySelectorAll('p');
  const titleText = texts?.[0]?.innerText;
  const descriptionText = texts?.[1]?.innerText;
  const link = texts?.[2]?.querySelector('a');

  const getPrimarySrc = (pic) => {
    const s = pic?.querySelector('source[srcset]');
    return s?.srcset || pic?.querySelector('img')?.src || '';
  };
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

    const fallbackImg = (mobilePic || tabletPic || desktopPic)?.querySelector('img')?.cloneNode(true)
            || document.createElement('img');

    if (!fallbackImg.src) fallbackImg.src = getPrimarySrc(mobilePic || tabletPic || desktopPic) || '';
    fallbackImg.alt = fallbackImg.alt || '';

    picture.appendChild(fallbackImg);
    return picture;
  };

  let picture;
  if (block.classList.contains('switchable-image') && authoredPictures.length > 1) {
    picture = buildSwitchablePicture(authoredPictures);
  } else {
    [picture] = authoredPictures;
  }

  block.innerText = '';
  if (picture) block.appendChild(picture);

  const heroContent = document.createElement('div');
  heroContent.classList.add('blog-hero-content');

  const heroOptionalContainer = document.createElement('div');
  heroOptionalContainer.classList.add('blog-hero-optional-container');

  const heading = document.createElement('h1');
  if (descriptionText || link) heading.classList.add('blog-hero-text-short');
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
    const searchFragment = await loadFragment('/fragments/search-blog');
    heroContent.appendChild(searchFragment?.firstElementChild?.firstElementChild);
  }

  block.appendChild(heroContent);

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
