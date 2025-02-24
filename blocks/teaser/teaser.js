import { createTag } from '../../scripts/utils.js';

function modifyText(block) {
  block.querySelectorAll('strong').forEach((element) => {
    element.replaceWith(
      createTag('span', { class: 'text-color-blue' }, element.innerText),
    );
  });
  block.querySelectorAll('em').forEach((element) => {
    element.replaceWith(
      createTag('span', { class: 'text-color-linear' }, element.innerText),
    );
  });
  return block;
}

export default function decorate(block) {
  const blockContent = block.firstElementChild.firstElementChild;

  const imageBlock = blockContent.firstElementChild.querySelector('picture');
  const pretitleBlock = blockContent.querySelector('h3');
  const titleBlock = blockContent.querySelector('h1') || blockContent.querySelector('h2');
  const descriptionBlock = blockContent.querySelector('h4');
  const video = blockContent.querySelector('h6');
  const linkBlock = blockContent.querySelector('p a');

  const titleElements = blockContent.querySelectorAll('h2');

  let teaserImage;
  let teaserVideo;

  if (block.classList.contains('video') && video) {
    const videoTag = document.createElement('video');
    videoTag.src = video.querySelector('a').href;
    videoTag.playsinline = true;
    videoTag.loop = true;
    videoTag.autoplay = true;
    videoTag.muted = true;
    teaserVideo = createTag('div', { class: 'teaser-video' }, videoTag);
  } else if (imageBlock) {
    teaserImage = createTag('div', { class: 'teaser-image' }, imageBlock);
  }

  const teaserContent = createTag('div', { class: 'teaser-content' });

  if (pretitleBlock) {
    teaserContent.appendChild(createTag('div', { class: 'teaser-pretitle' }, pretitleBlock.innerHTML));
  }

  if (titleBlock) {
    if (titleElements.length <= 1) {
      teaserContent.appendChild(createTag('h1', { class: 'teaser-title' }, modifyText(titleBlock).innerHTML));
    } else {
      let newTitles = '';
      titleElements.forEach((element) => {
        newTitles += modifyText(element).outerHTML;
      });
      const teaserTitlesWrapper = `<div class="teaser-titles-wrapper"><div class="teaser-titles">${newTitles}</div></div>`;
      teaserContent.appendChild(createTag('div', { class: 'multiple-titles' }, teaserTitlesWrapper));
      const divs = Array.from(teaserContent.querySelectorAll('h2'));
      let i = -1;
      setInterval(() => {
        i = (i + 1) % divs.length;
        const y = -(i * divs[0].offsetHeight);
        teaserContent.querySelector('.teaser-titles-wrapper').style.maxHeight = `${divs[i].clientHeight}px`;
        teaserContent.querySelector('.teaser-titles').style.transform = `translateY(${y}px)`;
      }, 2500);
    }
  }

  if (descriptionBlock) {
    teaserContent.appendChild(createTag('div', { class: 'teaser-description' }, descriptionBlock.innerHTML));
  }

  if (linkBlock) {
    const link = createTag('a', { class: 'teaser-cta button' }, linkBlock.innerText);
    link.setAttribute('href', linkBlock.getAttribute('href'));
    teaserContent.appendChild(createTag('div', { class: 'teaser-cta-container' }, link));
  }

  block.innerHTML = '';
  if (teaserImage) block.appendChild(teaserImage);
  if (teaserVideo) block.appendChild(teaserVideo);
  block.appendChild(teaserContent);
}
