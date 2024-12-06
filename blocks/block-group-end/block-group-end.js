import { createTag } from "../../scripts/utils.js";

const BLOCK_GROUP_ID_PREFIX = "block-group-id-";

const getBlockIdDefinedByClassName = (block) => {
  let blockId;
  block.classList.forEach((className) => {
    if (className.startsWith(BLOCK_GROUP_ID_PREFIX)) {
      blockId = className.replace(BLOCK_GROUP_ID_PREFIX, "");
    }
  });
  return blockId;
};

const moveBloksIntoBlockGroup = (blockStart, blockEnd) => {
  const newBlock = createTag("div", { class: "block-group" });

  let blockIterator = blockStart.nextElementSibling;
  while (blockIterator !== blockEnd) {
    newBlock.innerHTML = newBlock.innerHTML + blockIterator.outerHTML;
    const newBlockIterator = blockIterator.nextElementSibling;
    blockIterator.remove();
    blockIterator = newBlockIterator;
  }

  return newBlock;
};

export default function decorate(block) {
  let blockId = getBlockIdDefinedByClassName(block);

  const blockStart = document.querySelector(
    `.block-group-start.${BLOCK_GROUP_ID_PREFIX}${blockId}`
  ).parentNode;
  const blockEnd = block.parentNode;

  const newBlock = moveBloksIntoBlockGroup(blockStart, blockEnd);

  blockEnd.after(newBlock);
  blockStart.remove();
  blockEnd.remove();
}
