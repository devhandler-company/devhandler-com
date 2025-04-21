// eslint-disable-next-line no-unused-vars
const existingHeadingIds = new Set();
function generateId(text = '') {
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

function buildNestedList(items) {
  const root = document.createElement('ul');
  root.classList.add('table-of-contents', 'toc-list');

  const stack = [{ level: items[0].level, list: root }];

  items.forEach(({ text, href, level }) => {
    const li = document.createElement('li');
    li.classList.add('toc-item', `toc-level-${level}`);

    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    a.classList.add('toc-link');
    li.appendChild(a);

    if (level > stack[stack.length - 1].level) {
      const newSubList = document.createElement('ul');
      newSubList.classList.add('toc-list');
      newSubList.classList.add(`toc-level-${level}`);
      stack[stack.length - 1].list.lastElementChild.appendChild(newSubList);
      stack.push({ level, list: newSubList });
    } else {
      while (stack.length && level < stack[stack.length - 1].level) {
        stack.pop();
      }

      if (level !== stack[stack.length - 1].level) {
        const newList = document.createElement('ul');
        newList.classList.add('toc-list');
        newList.classList.add(`toc-level-${level}`);
        stack[stack.length - 1].list.appendChild(newList);
        stack.push({ level, list: newList });
      }
    }

    stack[stack.length - 1].list.appendChild(li);
  });

  return root;
}

function renderList(container, items) {
  if (!items.length) return;

  container.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Table of Contents';
  title.classList.add('toc-title');
  title.id = generateId('table-of-contents', new Set());

  const tocList = buildNestedList(items);

  container.appendChild(title);
  container.appendChild(tocList);
}

function extractHeadings(scope = document, usedIds = new Set(), selector = 'h2, h3, h4, h5, h6') {
  const headings = scope.querySelectorAll(selector);
  const items = [];

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1], 10);
    const text = heading.textContent.trim();
    let { id } = heading;

    if (!id) {
      id = generateId(text, usedIds);
      heading.id = id;
    }

    usedIds.add(id);
    items.push({ text, href: `#${id}`, level });
  });

  return items;
}

function normalizeHref(href = '') {
  try {
    const url = new URL(href, window.location.href);
    return url.hash || `#${generateId(href)}`; // fallback if no hash
  } catch {
    // Not a valid URL, assume it's a simple hash or ID
    return href.startsWith('#') ? href : `#${href}`;
  }
}

function parseManualList(ul) {
  const items = [];

  function traverseList(list, level = 2) {
    [...list.children].forEach((li) => {
      const a = li.querySelector(':scope > a');
      if (a) {
        const text = a.textContent.trim();
        const rawHref = a.getAttribute('href') || '';
        const href = normalizeHref(rawHref);
        items.push({ text, href, level });
      }

      const subUl = li.querySelector(':scope > ul');
      if (subUl) {
        traverseList(subUl, level + 1);
      }
    });
  }

  traverseList(ul);
  return items;
}

export default function decorate(block) {
  const classList = block.className.split(/\s+/);
  const sourceClass = classList.find((cls) => [
    'heading-blocks',
    'all-headings',
    'manual',
    'editable',
    'section-blocks',
    'nav-links',
    'h2-only',
    'inline-markers',
    'external-json',
  ].includes(cls));
  const source = sourceClass || 'all-headings';

  const usedIds = new Set();
  let items = [];

  switch (source) {
    case 'heading-blocks': {
      const headingBlocks = document.querySelectorAll(
        '.blog-heading h1, .blog-heading h2, .blog-heading h3, .blog-heading h4, .blog-heading h5, .blog-heading h6',
      );
      headingBlocks.forEach((heading) => {
        const level = parseInt(heading.tagName[1], 10);
        const text = heading.textContent.trim();
        let { id } = heading;

        if (!id) {
          id = generateId(text, usedIds);
          heading.id = id;
        }

        usedIds.add(id);
        items.push({ text, href: `#${id}`, level });
      });
      break;
    }

    case 'all-headings': {
      items = extractHeadings(document, usedIds);
      break;
    }

    case 'manual':
    case 'editable': {
      const ul = block.querySelector('ul');
      const manualItems = ul ? parseManualList(ul) : [];

      if (source === 'editable') {
        const allItems = extractHeadings(document, usedIds);
        const manualIds = new Set(manualItems.map((i) => i.href));
        const uniqueAllItems = allItems.filter((i) => !manualIds.has(i.href));
        items = [...manualItems, ...uniqueAllItems];
      } else {
        items = manualItems;
      }
      break;
    }

    case 'section-blocks': {
      const sections = document.querySelectorAll('.section');
      sections.forEach((section) => {
        const heading = section.querySelector('h2, h3, h4, h5, h6');
        if (heading) {
          const level = parseInt(heading.tagName[1], 10);
          const text = heading.textContent.trim();
          let { id } = heading;
          if (!id) {
            id = generateId(text, usedIds);
            heading.id = id;
          }
          usedIds.add(id);
          items.push({ text, href: `#${id}`, level });
        }
      });
      break;
    }

    case 'nav-links': {
      const links = document.querySelectorAll('.nav a, .toc-links a');
      links.forEach((link) => {
        const text = link.textContent.trim();
        const href = link.getAttribute('href');
        items.push({ text, href, level: 2 });
      });
      break;
    }

    case 'h2-only': {
      items = extractHeadings(document, usedIds, 'h2');
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
        items = extractHeadings(fragment, usedIds);
      }
      break;
    }

    case 'external-json': {
      const jsonMeta = document.querySelector('script[type="application/json"].toc-data');
      if (jsonMeta) {
        try {
          const data = JSON.parse(jsonMeta.textContent);
          items = data.items || [];
        } catch (e) {
          break;
        }
      }
      break;
    }

    default:
      items = extractHeadings(document, usedIds);
  }

  if (items.length) {
    renderList(block, items);
  }
}
