import { createTag, getBlockProperties } from "../../scripts/utils.js";

export default function decorate(block) {
    const properties = getBlockProperties(block);
    const newBlock = createTag(
        properties.tagName,
        {
            class: properties.classList,
        },
        properties.content
    );

    block.after(newBlock);
    block.remove();
}
