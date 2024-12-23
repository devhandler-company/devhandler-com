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
    let nextBlock = blockIterator.nextElementSibling;
    while (blockIterator !== blockEnd && blockIterator) {
        newBlock.appendChild(blockIterator);
        blockIterator = nextBlock;
        nextBlock = nextBlock.nextElementSibling;
    }

    return newBlock;
};

export default function decorate(block) {
    let blockId = getBlockIdDefinedByClassName(block);

    const classList = block.classList;
    const blockStart = block.parentNode.parentNode.querySelector(
        `.block-group-start.${BLOCK_GROUP_ID_PREFIX}${blockId}`
    ).parentNode;
    const blockEnd = block.parentNode;
    const newBlock = moveBloksIntoBlockGroup(blockStart, blockEnd);

    classList.forEach((className) => {
        className.indexOf(BLOCK_GROUP_ID_PREFIX) === -1 && newBlock.classList.add(className);
    });

    blockEnd.after(newBlock);
    blockStart.remove();
    blockEnd.remove();
}
