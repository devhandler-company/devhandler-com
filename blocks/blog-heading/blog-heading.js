const existingHeadingIds = new Set();

function generateCustomId(text = '') {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);

  let id = base || `heading-${Math.random().toString(36).substring(2, 8)}`;
  let counter = 1;

  while (existingHeadingIds.has(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }

  existingHeadingIds.add(id);
  return id;
}

export default function decorate(block) {
  const rows = Array.from(block.children);
  const data = {};

  rows.forEach((row) => {
    const label = row.children[0]?.textContent?.trim().toLowerCase();
    const valueCell = row.children[1];
    if (!label || !valueCell) return;
    data[label] = valueCell;
  });

  block.innerHTML = '';

  const headingText = data.text?.textContent?.trim() || '';
  const headingLevel = 'h2';
  let headingId = data.id?.querySelector(headingLevel)?.id;

  if (!headingId) {
    headingId = generateCustomId(headingText);
  }

  const headingEl = document.createElement(headingLevel);
  headingEl.id = headingId;

  // Icon (optional, goes inside heading)
  if (data.icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'blog-heading-icon';

    const picture = data.icon.querySelector('picture');
    const svg = data.icon.querySelector('svg');
    const img = data.icon.querySelector('img');

    if (picture) {
      iconSpan.appendChild(picture.cloneNode(true));
    } else if (svg) {
      iconSpan.appendChild(svg.cloneNode(true));
    } else if (img) {
      iconSpan.appendChild(img.cloneNode(true));
    } else {
      iconSpan.textContent = data.icon.textContent.trim();
    }

    headingEl.appendChild(iconSpan);
  }

  // Add heading text after icon
  headingEl.append(`${headingText}`);
  block.appendChild(headingEl);

  // Subtitle
  if (data.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'blog-heading-subtitle';
    subtitleEl.textContent = data.subtitle.textContent.trim();
    block.appendChild(subtitleEl);
  }
}
