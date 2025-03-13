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

  let datablockImage;
  let datablockVideo;
  let videoTag;

  if (block.classList.contains('video') && video) {
    videoTag = document.createElement('video');
    videoTag.setAttribute('playsinline', true);
    videoTag.loop = true;
    videoTag.autoplay = true;
    videoTag.muted = true;
    datablockVideo = createTag('div', { class: 'datablock-video' }, videoTag);
  } else if (imageBlock) {
    datablockImage = createTag('div', { class: 'datablock-image' }, imageBlock);
  }

  const datablockContent = createTag('div', { class: 'datablock-content' });

  if (pretitleBlock) {
    datablockContent.appendChild(createTag('div', { class: 'datablock-pretitle' }, pretitleBlock.innerHTML));
  }

  if (titleBlock) {
    if (titleElements.length <= 1) {
      datablockContent.appendChild(createTag('h1', { class: 'datablock-title' }, modifyText(titleBlock).innerHTML));
    } else {
      let newTitles = '';
      titleElements.forEach((element) => {
        newTitles += modifyText(element).outerHTML;
      });
      const datablockTitlesWrapper = `<div class="datablock-titles-wrapper"><div class="datablock-titles">${newTitles}</div></div>`;
      datablockContent.appendChild(createTag('div', { class: 'multiple-titles' }, datablockTitlesWrapper));
      const divs = Array.from(datablockContent.querySelectorAll('h2'));
      let i = -1;
      setInterval(() => {
        i = (i + 1) % divs.length;
        const y = -(i * divs[0].offsetHeight);
        datablockContent.querySelector('.datablock-titles-wrapper').style.maxHeight = `${divs[i].clientHeight}px`;
        datablockContent.querySelector('.datablock-titles').style.transform = `translateY(${y}px)`;
      }, 2500);
    }
  }

  if (descriptionBlock) {
    datablockContent.appendChild(createTag('div', { class: 'datablock-description' }, descriptionBlock.innerHTML));
  }

  if (linkBlock) {
    const link = createTag('a', { class: 'datablock-cta button' }, linkBlock.innerText);
    link.setAttribute('href', linkBlock.getAttribute('href'));
    datablockContent.appendChild(createTag('div', { class: 'datablock-cta-container' }, link));
  }

  block.innerHTML = '';
  if (datablockImage) block.appendChild(datablockImage);
  if (datablockVideo) block.appendChild(datablockVideo);
  block.appendChild(datablockContent);
  if (datablockVideo) {
    setTimeout(() => {
      videoTag.src = video.querySelector('a').href;
    }, 0);
  }
}
