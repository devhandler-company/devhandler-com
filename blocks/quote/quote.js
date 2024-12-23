import { createTag } from "../../scripts/utils.js";

const getReviews = () => {
  const reviews = createTag("span", { class: "quote__reviews" }, "");
  for (let index = 0; index < 5; index++) {
    const reviewImage = createTag("img", {
      class: "quote__review",
      alt: "Quote review icon",
    });
    reviewImage.setAttribute("src", "/icons/review-star.svg");
    reviews.appendChild(reviewImage);
  }
  return reviews;
};

export default function decorate(block) {
  const blockContent = block.firstElementChild.firstElementChild;

  const titleBlock = blockContent.querySelector("h4");
  const afterTitleBlock = blockContent.querySelectorAll("p")[0];
  const descriptionBlock = blockContent.querySelectorAll("p")[1];

  const quoteContent = createTag("div", { class: "quote__content" });
  const topRow = createTag("div", { class: "quote__content-top" }, "");
  const topRowLeft = createTag("div", { class: "quote__content-top-left" }, "");
  const topRowRight = createTag(
    "div",
    { class: "quote__content-top-right" },
    ""
  );
  topRow.appendChild(topRowLeft);
  topRow.appendChild(topRowRight);

  titleBlock && topRowLeft.appendChild(createTag("div", { class: "quote__title h4" }, titleBlock.innerHTML));

  afterTitleBlock &&
    topRowRight.appendChild(
      createTag(
        "span",
        { class: "quote__aftertitle" },
        afterTitleBlock.innerHTML
      )
    );

  topRowRight.appendChild(getReviews());

  quoteContent.appendChild(topRow);

  if (descriptionBlock) {
    const divider = createTag("div", { class: "quote__divider" }, "");
    const bottomRow = createTag("div", { class: "quote__content-bottom" }, "");
    bottomRow.appendChild(
      createTag(
        "span",
        { class: "quote__description" },
        descriptionBlock.innerHTML
      )
    );
    quoteContent.appendChild(divider);
    quoteContent.appendChild(bottomRow);
  }

  block.innerHTML = "";
  block.appendChild(quoteContent);
}
