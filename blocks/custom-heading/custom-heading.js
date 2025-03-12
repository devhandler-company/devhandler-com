import { createTag, getBlockProperties } from '../../scripts/utils.js';

const processTypedBlock = (element) => {
  const containerPlaceholder = document.createElement('div');
  containerPlaceholder.classList.add('typed-text-placeholder');
  containerPlaceholder.innerHTML = element.innerText;
  const text = element.innerText;
  element.innerText = '';

  let charIndex = 0;

  const typedTextContainer = document.createElement('div');
  typedTextContainer.classList.add('typed-text-typing');
  const innerContainer = document.createElement('div');

  innerContainer.classList.add('typed-text-inner-container');
  innerContainer.appendChild(containerPlaceholder);
  innerContainer.appendChild(typedTextContainer);

  element.appendChild(innerContainer);

  function typeWriter() {
    if (charIndex < text.length) {
      typedTextContainer.innerHTML += text.charAt(charIndex);
      charIndex += 1;
      setTimeout(typeWriter, 20);
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
