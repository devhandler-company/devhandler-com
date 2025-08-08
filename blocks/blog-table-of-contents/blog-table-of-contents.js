/**
 * @fileoverview Table of Contents (ToC) generator supporting multiple content sources.
 * Supports dynamic and manual modes with accessibility and ID conflict prevention.
 */

// Track all generated heading IDs to ensure uniqueness.
const usedHeadingIds = new Set();

/**
 * Generates a sanitized and unique ID from a given string.
 * @param {string} text
 * @returns {string}
 */
function generateId(text = '') {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);

  let id = base || `heading-${Math.random().toString(36).substring(2, 8)}`;
  let counter = 1;

  while (usedHeadingIds.has(id)) {
    counter += 1;
    id = `${base}-${counter}`;
  }

  usedHeadingIds.add(id);
  return id;
}

/**
 * Builds a nested unordered list from heading items.
 * @param {{text: string, href: string, level: number}[]} items
 * @returns {HTMLUListElement}
 */
function buildNestedList(items) {
  const root = document.createElement('ul');
  root.classList.add('table-of-contents', 'toc-list');

  const stack = [{ level: items[0].level, list: root }];

  items.forEach(({ text, href, level }) => {
    const li = document.createElement('li');
    li.className = `toc-item toc-level-${level}`;

    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    link.className = 'toc-link';
    li.appendChild(link);

    if (level > stack[stack.length - 1].level) {
      const subList = document.createElement('ul');
      subList.className = `toc-list toc-level-${level}`;
      stack[stack.length - 1].list.lastElementChild?.appendChild(subList);
      stack.push({ level, list: subList });
    } else {
      while (stack.length && level < stack[stack.length - 1].level) {
        stack.pop();
      }

      if (level !== stack[stack.length - 1].level) {
        const fallbackList = document.createElement('ul');
        fallbackList.className = `toc-list toc-level-${level}`;
        stack[stack.length - 1].list.appendChild(fallbackList);
        stack.push({ level, list: fallbackList });
      }
    }

    stack[stack.length - 1].list.appendChild(li);
  });

  return root;
}

/**
 * Renders the ToC in the provided container.
 * @param {HTMLElement} container
 * @param {ReturnType<typeof extractHeadings>} items
 */
function renderList(container, items) {
  if (!items.length) return;

  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Table of Contents';
  title.className = 'toc-title';
  title.id = generateId('table-of-contents');

  const tocList = buildNestedList(items);
  container.appendChild(title);
  container.appendChild(tocList);
}

/**
 * @param {ParentNode}  scope
 * @param {Set<string>} ids
 * @param {string}      [selector='h2, h3, h4, h5, h6']
 * @param {string}      [excludeSelector='']
 */
function extractHeadings(
  scope = document,
  ids = usedHeadingIds,
  selector = 'h2, h3, h4, h5, h6',
  excludeSelector = '',
) {
  const headings = scope.querySelectorAll(selector);
  const items = [];

  headings.forEach((heading) => {
    if (excludeSelector && heading.closest(excludeSelector)) return;

    const level = parseInt(heading.tagName[1], 10);
    const text = heading.textContent.trim();
    let { id } = heading;

    if (!id) {
      id = generateId(text);
      heading.id = id;
    }

    ids.add(id);
    items.push({ text, href: `#${id}`, level });
  });

  return items;
}

/**
 * Normalizes href into valid hash link.
 * @param {string} href
 * @returns {string}
 */
function normalizeHref(href = '') {
  try {
    const url = new URL(href, window.location.href);
    return url.hash || `#${generateId(href)}`;
  } catch {
    return href.startsWith('#') ? href : `#${href}`;
  }
}

/**
 * Parses a manually authored nested list of links.
 * @param {HTMLUListElement} ul
 * @returns {{text: string, href: string, level: number}[]}
 */
function parseManualList(ul) {
  const items = [];

  const traverse = (list, level = 2) => {
    [...list.children].forEach((li) => {
      const a = li.querySelector(':scope > a');
      if (a) {
        items.push({
          text: a.textContent.trim(),
          href: normalizeHref(a.getAttribute('href')),
          level,
        });
      }

      const subList = li.querySelector(':scope > ul');
      if (subList) traverse(subList, level + 1);
    });
  };

  traverse(ul);
  return items;
}

/**
 * Initializes ToC in the provided block.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const source = block.className
    .split(/\s+/)
    .find((cls) => [
      'heading-blocks',
      'all-headings',
      'manual',
      'editable',
      'section-blocks',
      'nav-links',
      'h2-only',
      'inline-markers',
      'external-json',
    ].includes(cls)) || 'all-headings';

  const items = [];
  const ids = new Set();

  try {
    switch (source) {
      case 'heading-blocks': {
        const headings = document.querySelectorAll(
          '.blog-heading h1, .blog-heading h2, .blog-heading h3, .blog-heading h4, .blog-heading h5, .blog-heading h6',
        );
        headings.forEach((heading) => {
          const level = parseInt(heading.tagName[1], 10);
          const text = heading.textContent.trim();
          let { id } = heading;
          if (!id) {
            id = generateId(text);
            heading.id = id;
          }
          ids.add(id);
          items.push({ text, href: `#${id}`, level });
        });
        break;
      }

      case 'all-headings': {
        items.push(...extractHeadings(document, ids, undefined, '.blog-lets-talk'));
        break;
      }

      case 'manual':
      case 'editable': {
        const ul = block.querySelector('ul');
        const manualItems = ul ? parseManualList(ul) : [];
        if (source === 'editable') {
          const allItems = extractHeadings(document, ids);
          const manualIds = new Set(manualItems.map((i) => i.href));
          const unique = allItems.filter((i) => !manualIds.has(i.href));
          items.push(...manualItems, ...unique);
        } else {
          items.push(...manualItems);
        }
        break;
      }

      case 'section-blocks': {
        document.querySelectorAll('.section').forEach((section) => {
          const heading = section.querySelector('h2, h3, h4, h5, h6');
          if (heading) {
            const level = parseInt(heading.tagName[1], 10);
            const text = heading.textContent.trim();
            let { id } = heading;
            if (!id) {
              id = generateId(text);
              heading.id = id;
            }
            ids.add(id);
            items.push({ text, href: `#${id}`, level });
          }
        });
        break;
      }

      case 'nav-links': {
        document.querySelectorAll('.nav a, .toc-links a').forEach((link) => {
          const text = link.textContent.trim();
          const href = link.getAttribute('href') || '';
          items.push({ text, href, level: 2 });
        });
        break;
      }

      case 'h2-only': {
        items.push(...extractHeadings(document, ids, 'h2'));
        break;
      }

      case 'inline-markers': {
        const start = document.querySelector('<!-- toc-start -->');
        const end = document.querySelector('<!-- toc-end -->');
        if (start && end) {
          const range = document.createRange();
          range.setStartAfter(start);
          range.setEndBefore(end);
          const fragment = range.cloneContents();
          items.push(...extractHeadings(fragment, ids));
        }
        break;
      }

      case 'external-json': {
        const jsonScript = document.querySelector('script[type="application/json"].toc-data');
        if (jsonScript) {
          const json = JSON.parse(jsonScript.textContent);
          items.push(...(json.items || []));
        }
        break;
      }

      default:
        items.push(...extractHeadings(document, ids));
    }
  } catch (error) {
    return;
  }

  if (items.length) renderList(block, items);
}
