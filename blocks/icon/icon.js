import { createTag } from '../../scripts/utils.js';

export default function decorate(block) {
  const icons = block.querySelectorAll('p:not(:has(sub))');
  if (!icons.length) {
    block.parentNode.remove();
  }
  const mainIcon = icons[0].textContent;
  const hoverIcon = icons[1] ? icons[1].textContent : '';

  const link = block.querySelector('a');
  const tagData = {
    class: 'icon',
    style: `--icon-path: url("${mainIcon}"); --icon-hover-path: url("${hoverIcon || mainIcon}");`,
  };

  const ariaLabel = block.querySelector('sub');

  if (link) {
    tagData.href = link.getAttribute('href');
    tagData['aria-label'] = ariaLabel ? ariaLabel.textContent || 'Icon' : 'Icon';
  }

  const iconTag = createTag(link ? 'a' : 'span', tagData, '');

  block.innerHTML = iconTag.outerHTML;
}
