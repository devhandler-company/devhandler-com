export function createTag(tag, attributes = {}, content) {
  const element = document.createElement(tag);
  if (content instanceof HTMLElement) {
    element.appendChild(content);
  } else if (content) {
    element.innerHTML = content;
  }

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}


export function modifyHeaders(block) {
  block
    .querySelectorAll(".section .default-content-wrapper > h2 > strong")
    .forEach((element) => {
      element.replaceWith(
        createTag("span", { class: "text-color-blue" }, element.innerText)
      );
    });
  block
    .querySelectorAll(".section .default-content-wrapper > h2 > em")
    .forEach((element) => {
      element.replaceWith(
        createTag("span", { class: "text-color-linear" }, element.innerText)
      );
    });
  return block;
}

export const getBlockProperties = (block) => {
    const propertiesMap = {};
    [...block.children].forEach((row) => {
        propertiesMap[row.firstElementChild.textContent] = row.lastElementChild.textContent;
    });
    return propertiesMap;
};