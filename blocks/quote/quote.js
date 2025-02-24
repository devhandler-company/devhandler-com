import { createTag } from '../../scripts/utils.js';

const getReviews = () => {
  const reviews = createTag('span', { class: 'quote-reviews' }, '');
  for (let index = 0; index < 5; index += 1) {
    const reviewImage = createTag('img', {
      class: 'quote-review',
      alt: 'Quote review icon',
    });
    reviewImage.setAttribute('src', '/icons/review-star.svg');
    reviews.appendChild(reviewImage);
  }
  return reviews;
};

export default function decorate(block) {
  const blockContent = block.firstElementChild.firstElementChild;

  const titleBlock = blockContent.querySelector('h4');
  const afterTitleBlock = blockContent.querySelectorAll('p')[0];
  const descriptionBlock = blockContent.querySelectorAll('p')[1];

  const quoteContent = createTag('div', { class: 'quote-content' });
  const topRow = createTag('div', { class: 'quote-content-top' }, '');
  const topRowLeft = createTag('div', { class: 'quote-content-top-left' }, '');
  const topRowRight = createTag(
    'div',
    { class: 'quote-content-top-right' },
    '',
  );
  topRow.appendChild(topRowLeft);
  topRow.appendChild(topRowRight);

  if (titleBlock) {
    topRowLeft.appendChild(createTag('div', { class: 'quote-title h4' }, titleBlock.innerHTML));
  }

  if (afterTitleBlock) {
    topRowRight.appendChild(
      createTag(
        'span',
        { class: 'quote-aftertitle' },
        afterTitleBlock.innerHTML,
      ),
    );
  }

  topRowRight.appendChild(getReviews());

  quoteContent.appendChild(topRow);

  if (descriptionBlock) {
    const divider = createTag('div', { class: 'quote-divider' }, '');
    const bottomRow = createTag('div', { class: 'quote-content-bottom' }, '');
    bottomRow.appendChild(
      createTag(
        'span',
        { class: 'quote-description' },
        descriptionBlock.innerHTML,
      ),
    );
    quoteContent.appendChild(divider);
    quoteContent.appendChild(bottomRow);
  }

  block.innerHTML = '';
  block.appendChild(quoteContent);
}
