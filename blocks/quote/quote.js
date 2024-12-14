import { createTag } from "../../scripts/utils.js";

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

  titleBlock &&
    topRowLeft.appendChild(
      createTag("h4", { class: "quote__title" }, titleBlock.innerHTML)
    );

  afterTitleBlock &&
    topRowRight.appendChild(
      createTag(
        "span",
        { class: "quote__aftertitle" },
        afterTitleBlock.innerHTML
      )
    );

  quoteContent.appendChild(topRow);

  if (descriptionBlock) {
    const bottomRow = createTag("div", { class: "quote__content-bottom" }, "");
    bottomRow.appendChild(
      createTag(
        "span",
        { class: "quote__description" },
        descriptionBlock.innerHTML
      )
    );
    quoteContent.appendChild(bottomRow);
  }

  block.innerHTML = "";
  block.appendChild(quoteContent);
}
