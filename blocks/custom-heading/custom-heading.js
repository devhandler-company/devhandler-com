import { createTag, getBlockProperties } from '../../scripts/utils.js';

const processTypedBlock = (element) => {
  const text = element.innerText;
  element.innerText = '';
  let charIndex = 0;

  function typeWriter() {
    if (charIndex < text.length) {
      element.innerHTML += text.charAt(charIndex);
      charIndex += 1;
      setTimeout(typeWriter, 50);
    }
  }
  typeWriter();
};

export default function decorate(block) {
  const properties = getBlockProperties(block);
  const newBlock = createTag(
    properties.tagName,
    {
      class: properties.classList,
    },
    properties.content,
  );

  block.after(newBlock);
  block.remove();

  if (properties.classList.indexOf('typed-text') > -1) {
    processTypedBlock(newBlock);
  }
}
