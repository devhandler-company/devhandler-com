import { createTag } from "../../scripts/utils.js";

export default function decorate(block) {
  const link = block.querySelector("a");
  if (!link) {
    return;
  }

  const href = link.getAttribute("href");

  if (!href || !href.startsWith("#")) {
    return;
  }

  link.addEventListener("click", (e) => {
    e.preventDefault();
  });
}
