// eslint-disable-next-line no-unused-vars
const existingHeadingIds = new Set();
function generateId(text = '') {
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

function extractHeadings(scope = document, usedIds = new Set()) {
  const headings = scope.querySelectorAll('h1, h2, h3, h4, h5, h6');
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

function parseManualList(ul) {
  const items = [];

  function traverseList(list, level = 2) {
    [...list.children].forEach((li) => {
      const match = li.textContent.match(/\[(.+?)\]\(#(.+?)\)/);
      if (match) {
        const [, text, id] = match;
        items.push({ text, href: `#${id}`, level });
      }

      const subUl = li.querySelector('ul');
      if (subUl) {
        traverseList(subUl, level + 1);
      }
    });
  }

  traverseList(ul);
  return items;
}

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const config = {};

  rows.forEach((row) => {
    const key = row.children[0]?.textContent?.trim().toLowerCase();
    const value = row.children[1];

    if (key === 'source') {
      config.source = value.textContent.trim().toLowerCase();
    }

    if (key === 'headings') {
      config.headingsList = value.querySelector('ul');
    }
  });

  const usedIds = new Set();
  let items = [];

  switch (config.source) {
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

    case 'manual': {
      if (config.headingsList) {
        items = parseManualList(config.headingsList, usedIds);
      }
      break;
    }

    case 'editable': {
      const manualItems = config.headingsList ? parseManualList(config.headingsList, usedIds) : [];
      const allItems = extractHeadings(document, usedIds);
      const manualIds = new Set(manualItems.map((i) => i.href));
      const uniqueAllItems = allItems.filter((i) => !manualIds.has(i.href));
      items = [...manualItems, ...uniqueAllItems];
      break;
    }

    default:
      break;
  }

  if (items.length) {
    renderList(block, items);
  }
}
