import { createTag } from "../../scripts/utils.js";

export default function decorate(block) {

  const blockContent = block.firstElementChild.firstElementChild;

  const imageBlock = blockContent.firstElementChild.querySelector("picture");
  const pretitleBlock = blockContent.querySelector("h3");
  const titleBlock = blockContent.querySelector("h2");
  const descriptionBlock = blockContent.querySelector("h4");
  const linkBlock = blockContent.querySelector("p a");

  let teaserImage;

  if (imageBlock) {
    teaserImage = createTag("div", { class: "teaser__image" }, imageBlock);
  }

  const teaserContent = createTag("div", { class: "teaser__content" });

  pretitleBlock &&
    teaserContent.appendChild(
      createTag("div", { class: "teaser__pretitle" }, pretitleBlock.innerHTML)
    );

  titleBlock &&
    teaserContent.appendChild(
      createTag("div", { class: "teaser__title" }, titleBlock.innerHTML)
    );

  descriptionBlock &&
    teaserContent.appendChild(
      createTag(
        "div",
        { class: "teaser__description" },
        descriptionBlock.innerHTML
      )
    );

  if (linkBlock) {
    const link = createTag("a", { class: "teaser__cta" }, linkBlock.innerText);
    link.setAttribute("href", linkBlock.getAttribute("href"));
    teaserContent.appendChild(
      createTag("div", { class: "teaser__cta-container" }, link)
    );
  }

  block.innerHTML = "";
  teaserImage && block.appendChild(teaserImage);
  block.appendChild(teaserContent);
}
