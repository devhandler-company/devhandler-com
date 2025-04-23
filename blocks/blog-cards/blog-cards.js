import { getBlockProperties } from '../../scripts/utils.js';
import {
  getBlogCardsData,
  getLatestBlogCards,
} from '../../scripts/blogService.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateCards from '../cards/cards.js';

export default async function decorate(block) {
  if (block.classList.contains('manual-configuration')) {
    decorateCards(block);
    return;
  }

  const properties = getBlockProperties(block);
  const {
    countOfArticles,
    offset,
    pageTemplate,
    queryIndexLink,
  } = properties;

  block.innerText = '';

  const blogCardsData = await getBlogCardsData(queryIndexLink || undefined);

  const latestCards = await getLatestBlogCards(
    blogCardsData,
    pageTemplate || undefined,
    countOfArticles || undefined,
    offset || undefined,
  );

  if (latestCards?.length) {
    const ul = document.createElement('ul');
    latestCards.forEach(({
      path,
      title,
      image,
      description,
    }) => {
      const li = document.createElement('li');

      const cardImage = document.createElement('div');
      cardImage.className = 'blog-cards-card-image';
      const pictureElement = createOptimizedPicture(image, undefined, false, [
        { width: '750' },
      ]);
      cardImage.appendChild(pictureElement);

      const cardBody = document.createElement('div');
      cardBody.className = 'blog-cards-card-body';
      const titleElement = document.createElement('p');
      titleElement.innerHTML = `<strong>${title}</strong>`;
      const descriptionElement = document.createElement('p');
      descriptionElement.innerText = description;
      const linkElement = document.createElement('p');
      linkElement.innerHTML = `<a href=${path} title="Read more">`;

      cardBody.appendChild(titleElement);
      cardBody.appendChild(descriptionElement);
      cardBody.appendChild(linkElement);

      li.appendChild(cardImage);
      li.appendChild(cardBody);
      ul.appendChild(li);
    });
    block.appendChild(ul);
  }
}
