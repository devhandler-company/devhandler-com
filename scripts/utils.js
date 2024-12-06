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
