import { getBlockProperties } from '../../scripts/utils.js';
import {
  getBlogCardsData,
  getLatestBlogCards,
} from '../../scripts/blogService.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateCards from '../cards/cards.js';
import tns from '../../scripts/tinySlider.js';

export default async function decorate(block) {
  let carouselId;
  if (block.classList.contains('manual-configuration') && block?.children?.length) {
    carouselId = 'manual-configuration';
    decorateCards(block);
    const ul = block.querySelector('ul');
    if (ul) {
      if (!block.classList.contains('mobile-hidden')) {
        const ulMobile = ul.cloneNode(true);
        ulMobile.classList.add('blog-cards-mobile-content');
        block.appendChild(ulMobile);
      }
      ul.classList.add('blog-cards-content', 'blog-cards-content-manual-configuration');
    }
  } else {
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
      carouselId = offset;
      const ul = document.createElement('ul');
      let ulMobile;
      if (!block.classList.contains('mobile-hidden')) {
        ulMobile = document.createElement('ul');
        ulMobile.classList.add('blog-cards-mobile-content');
        block.appendChild(ulMobile);
      }
      ul.classList.add('blog-cards-content');
      ul.classList.add(`blog-cards-content-${offset}`);
      latestCards.forEach(({
        path,
        title,
        image,
        description,
      }) => {
        const li = document.createElement('li');
        li.classList.add('blog-cards-card');

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
        linkElement.classList.add('button-container');
        linkElement.innerHTML = `<a href=${path} title="Read more" class="button">Read more</a>`;

        cardBody.appendChild(titleElement);
        cardBody.appendChild(descriptionElement);
        cardBody.appendChild(linkElement);

        li.appendChild(cardImage);
        li.appendChild(cardBody);
        ul.appendChild(li);
        if (ulMobile) {
          const liMobile = li.cloneNode(true);
          ulMobile?.appendChild(liMobile);
        }
      });
      block.appendChild(ul);
      if (ulMobile) {
        block.appendChild(ulMobile);
      }
    }
  }

  if (carouselId) {
    tns({
      container: `.blog-cards-content-${carouselId}`,
      items: 1.4,
      responsive: {
        700: {
          items: 1.4,
        },
        1010: {
          items: 2.4,
        },
      },
      slideBy: 'page',
      preventScrollOnTouch: 'force',
      swipeAngle: 45,
      nav: false,
      autoplay: false,
      mouseDrag: true,
      freezable: false,
      controlsText: ['', ''],
    });
  }
}
