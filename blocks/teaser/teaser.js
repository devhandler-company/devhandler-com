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

  let teaserImage;
  let teaserVideo;

  if (block.classList.contains('video') && video) {
    const videoTag = document.createElement('video');
    videoTag.src = video.querySelector('a').href;
    videoTag.playsinline = true;
    videoTag.loop = true;
    videoTag.autoplay = true;
    videoTag.muted = true;
    teaserVideo = createTag('div', { class: 'teaser__video' }, videoTag);
  } else if (imageBlock) {
    teaserImage = createTag('div', { class: 'teaser__image' }, imageBlock);
  }

  const teaserContent = createTag('div', { class: 'teaser__content' });

  pretitleBlock
        && teaserContent.appendChild(createTag('div', { class: 'teaser__pretitle' }, pretitleBlock.innerHTML));

  titleBlock
        && teaserContent.appendChild(createTag('h1', { class: 'teaser__title' }, modifyText(titleBlock).innerHTML));

  descriptionBlock
        && teaserContent.appendChild(createTag('div', { class: 'teaser__description' }, descriptionBlock.innerHTML));

  if (linkBlock) {
    const link = createTag('a', { class: 'teaser__cta button' }, linkBlock.innerText);
    link.setAttribute('href', linkBlock.getAttribute('href'));
    teaserContent.appendChild(createTag('div', { class: 'teaser__cta-container' }, link));
  }

  block.innerHTML = '';
  teaserImage && block.appendChild(teaserImage);
  teaserVideo && block.appendChild(teaserVideo);
  block.appendChild(teaserContent);
}
