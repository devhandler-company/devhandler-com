// eslint-disable-next-line no-unused-vars
const existingHeadingIds = new Set();

function generateCustomId(text = '') {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 25);

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
  const rows = [...block.children];

  let level = 2;
  let id = '';
  let text = '';

  rows.forEach((row) => {
    if (!row || row.children.length < 2) return;

    const key = row.children[0]?.textContent?.trim()?.toLowerCase();
    const valueEl = row.children[1];

    if (!key || !valueEl) return;

    switch (key) {
      case 'level': {
        const lvl = parseInt(valueEl.textContent.trim(), 10);
        level = Number.isNaN(lvl) || lvl < 1 || lvl > 6 ? 2 : lvl;
        break;
      }
      case 'id': {
        const hTag = valueEl.querySelector('h1,h2,h3,h4,h5,h6');
        id = hTag?.id || valueEl.textContent.trim();
        break;
      }
      case 'text': {
        text = valueEl.textContent.trim();
        break;
      }
      default:
        break;
    }
  });

  if (!text) text = 'untitled';

  if (!id) {
    id = generateCustomId(text);
  } else {
    id = generateCustomId(id);
  }

  const heading = document.createElement(`h${level}`);
  heading.id = id;
  heading.textContent = text;

  block.innerHTML = '';
  block.appendChild(heading);
}
