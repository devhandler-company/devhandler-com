const existingHeadingIds = new Set();

/**
 * Generates a sanitized and unique ID from a given heading text.
 * @param {string} text
 * @returns {string}
 */
function generateCustomId(text = '') {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);

  let id = base || `heading-${Math.random().toString(36).substring(2, 8)}`;
  let counter = 1;

  while (existingHeadingIds.has(id)) {
    counter += 1;
    id = `${base}-${counter}`;
  }

  existingHeadingIds.add(id);
  return id;
}

/**
 * Extracts and maps content rows into a key-value object.
 * @param {HTMLElement} block
 * @returns {Record<string, HTMLElement>}
 */
function parseBlockData(block) {
  const data = {};
  Array.from(block.children).forEach((row) => {
    const label = row.children[0]?.textContent?.trim().toLowerCase();
    const value = row.children[1];
    if (label && value) data[label] = value;
  });
  return data;
}

/**
 * Creates a blog heading with optional icon and subtitle.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const data = parseBlockData(block);
  const headingText = data.text?.textContent?.trim() || '';
  const headingLevel = 'h2';

  let headingId = data.id?.querySelector(headingLevel)?.id;
  if (!headingId) headingId = generateCustomId(headingText);

  const headingEl = document.createElement(headingLevel);
  headingEl.id = headingId;

  // Icon (optional)
  if (data.icon) {
    const iconSpan = document.createElement('span');
    iconSpan.className = 'blog-heading-icon';

    const icon = data.icon.querySelector('picture, svg, img');
    if (icon) {
      iconSpan.appendChild(icon.cloneNode(true));
    } else {
      iconSpan.textContent = data.icon.textContent.trim();
    }

    headingEl.appendChild(iconSpan);
  }

  // Text after icon
  headingEl.append(headingText);

  // Clear block and append elements
  block.innerHTML = '';
  block.appendChild(headingEl);

  // Subtitle (optional)
  if (data.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'blog-heading-subtitle';
    subtitleEl.textContent = data.subtitle.textContent.trim();
    block.appendChild(subtitleEl);
  }
}
