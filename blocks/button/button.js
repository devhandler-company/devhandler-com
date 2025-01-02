import { createTag } from "../../scripts/utils.js";

export default function decorate(block) {
  const link = block.querySelector("a");
  if (!link) {
    return;
  }

  const href = link.getAttribute("href");
  if (href && href.startsWith("#")) {
      link.addEventListener("click", (event) => {
          event.preventDefault();
          const scrollToElementId = href.replace("#", "");
          const scrollToElement = document.getElementById(scrollToElementId);
          if (!scrollToElement) {
              return;
          }
          scrollToElement.scrollIntoView({
              behavior: "smooth",
          });
      });
      return;
  }

  if (!href || !href.startsWith("#")) {
      return;
  }
}
