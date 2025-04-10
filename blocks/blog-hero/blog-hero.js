export default function decorate(block) {
  const picture = block.querySelector('picture');
  const texts = block.querySelectorAll('p');
  const titleText = texts[0].innerText;
  const descriptionText = texts[1]?.innerText;
  const link = texts[2]?.querySelector('a');

  block.innerText = '';
  block.appendChild(picture);

  const heroTexts = document.createElement('div');
  heroTexts.classList.add('blog-hero-texts');

  const heroOptionalContainer = document.createElement('div');
  heroOptionalContainer.classList.add('blog-hero-optional-container');

  const heading = document.createElement('h1');
  if (descriptionText || link) {
    heading.classList.add('blog-hero-text-short');
  }
  heading.innerText = titleText;
  heroTexts.appendChild(heading);

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
  heroTexts.appendChild(heroOptionalContainer);

  block.appendChild(heroTexts);
}
