import { getBlockProperties } from '../../scripts/utils.js';

export default function decorate(block) {
  const componentProperties = getBlockProperties(block);
  block.textContent = componentProperties.Content;
}
