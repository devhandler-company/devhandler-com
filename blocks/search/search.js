import { decorateIcons } from '../../scripts/aem.js';

const searchParams = new URLSearchParams(window.location.search);
let searchBlock;
let searchBoxElement;
let searchResultsElement;
let searchResultIndex;

function highlightTextElements(terms, elements) {
  elements.forEach((element) => {
    if (!element || !element.textContent) return;

    const matches = [];
    const { textContent } = element;
    terms.forEach((term) => {
      let start = 0;
      let offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      while (offset >= 0) {
        matches.push({ offset, term: textContent.substring(offset, offset + term.length) });
        start = offset + term.length;
        offset = textContent.toLowerCase().indexOf(term.toLowerCase(), start);
      }
    });

    if (!matches.length) {
      return;
    }

    matches.sort((a, b) => a.offset - b.offset);
    let currentIndex = 0;
    const fragment = matches.reduce((acc, { offset, term }) => {
      if (offset < currentIndex) return acc;
      const textBefore = textContent.substring(currentIndex, offset);
      if (textBefore) {
        acc.appendChild(document.createTextNode(textBefore));
      }
      const markedTerm = document.createElement('mark');
      markedTerm.textContent = term;
      acc.appendChild(markedTerm);
      currentIndex = offset + term.length;
      return acc;
    }, document.createDocumentFragment());
    const textAfter = textContent.substring(currentIndex);
    if (textAfter) {
      fragment.appendChild(document.createTextNode(textAfter));
    }
    element.innerHTML = '';
    element.appendChild(fragment);
  });
}

export async function fetchData(source) {
  const response = await fetch(source);
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading API response', response);
    return null;
  }

  const json = await response.json();
  if (!json) {
    // eslint-disable-next-line no-console
    console.error('empty API response', source);
    return null;
  }

  return json.data;
}

function renderResult(result, searchTerms, titleTag) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = result.path;
  if (result.title) {
    const title = document.createElement(titleTag);
    title.className = 'search-result-title line-clamp-1';
    const link = document.createElement('a');
    link.href = result.path;
    link.textContent = result.title;
    highlightTextElements(searchTerms, [link]);
    title.append(link);
    a.append(title);
  }
  if (result.description) {
    const description = document.createElement('p');
    description.textContent = result.description;
    description.classList.add('line-clamp-2');
    highlightTextElements(searchTerms, [description]);
    a.append(description);
  }
  li.append(a);
  return li;
}

function clearSearchResults(block) {
  const searchResults = block.querySelector('.search-results');
  searchResults.innerHTML = '';
}

function clearSearch(block) {
  clearSearchResults(block);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = '';
    searchParams.delete('q');
    window.history.replaceState({}, '', url.toString());
  }
}

async function renderResults(block, config, filteredData, searchTerms) {
  clearSearchResults(block);
  const searchResults = block.querySelector('.search-results');
  const headingTag = 'p';

  if (filteredData.length) {
    searchResults.classList.remove('no-results');
    filteredData.forEach((result) => {
      const li = renderResult(result, searchTerms, headingTag);
      searchResults.append(li);
    });
  } else {
    const noResultsMessage = document.createElement('li');
    searchResults.classList.add('no-results');
    noResultsMessage.textContent = config.placeholders?.searchNoResults || 'No results found.';
    searchResults.append(noResultsMessage);
  }
}

function compareFound(hit1, hit2) {
  return hit1.minIdx - hit2.minIdx;
}

function filterData(searchTerms, data) {
  const foundInHeader = [];
  const foundInMeta = [];

  data.forEach((result) => {
    let minIdx = -1;

    searchTerms.forEach((term) => {
      const idx = (result.header || result.title).toLowerCase().indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInHeader.push({ minIdx, result });
      return;
    }

    const metaContents = `${result.title} ${result.description} ${result.path.split('/').pop()}`.toLowerCase();
    searchTerms.forEach((term) => {
      const idx = metaContents.indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInMeta.push({ minIdx, result });
    }
  });

  return [...foundInHeader.sort(compareFound), ...foundInMeta.sort(compareFound)]
    .map((item) => item.result);
}

function openSearchField() {
  searchBlock.classList.add('open');
}

function closeSearchField() {
  searchBlock.classList.remove('open');
}

async function handleSearch(e, block, config) {
  const searchValue = e.target.value;
  searchParams.set('q', searchValue);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
  }

  if (searchValue.length < 3) {
    clearSearch(block);
    return;
  }
  const searchTerms = searchValue
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => !!term);

  const data = await fetchData(config.source);
  const filteredData = filterData(searchTerms, data);
  const dataToDisplay = filteredData.slice(0, 5);
  await renderResults(block, config, dataToDisplay, searchTerms);
}

function searchResultsContainer() {
  const results = document.createElement('ul');
  results.className = 'search-results';
  searchResultsElement = results;

  return results;
}

function searchInput(block, config) {
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.className = 'search-input';
  input.placeholder = 'Search';

  input.addEventListener('input', (e) => {
    handleSearch(e, block, config);
  });

  input.addEventListener('focus', (e) => {
    openSearchField(e);
  });

  input.addEventListener('keyup', (e) => {
    if (e.code === 'Escape') {
      clearSearch(block);
    }
  });

  return input;
}

function searchIcon() {
  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-search');
  return icon;
}

function searchBox(block, config) {
  const box = document.createElement('div');
  box.classList.add('search-box');
  box.append(searchInput(block, config), searchIcon());

  box.addEventListener('click', (e) => {
    openSearchField(e);
  });
  searchBoxElement = box;

  return box;
}

document.addEventListener('keydown', (e) => {
  const len = searchResultsElement.getElementsByTagName('li')?.length;
  if (e.key === 'ArrowDown') {
    if (searchResultIndex == null) {
      searchResultIndex = 0;
    } else {
      searchResultIndex += 1;
    }
    let prevSearchResultIndex = searchResultIndex - 1;
    if (searchResultIndex > len - 1) {
      searchResultIndex = 0;
      prevSearchResultIndex = len - 1;
    }
    searchResultsElement.getElementsByTagName('li')[searchResultIndex].classList.add('selected');
    if (prevSearchResultIndex >= 0) searchResultsElement.getElementsByTagName('li')[prevSearchResultIndex].classList.remove('selected');
  } else if (e.key === 'ArrowUp') {
    if (searchResultIndex == null) {
      searchResultIndex = len;
    } else {
      searchResultIndex -= 1;
    }
    const prevSearchResultIndex = searchResultIndex + 1;

    if (searchResultIndex < 0) {
      searchResultIndex = len - 1;
    }
    searchResultsElement.getElementsByTagName('li')[searchResultIndex].classList.add('selected');
    searchResultsElement.getElementsByTagName('li')[prevSearchResultIndex].classList.remove('selected');
  } else if (e.key === 'Enter' && searchResultIndex != null) {
    window.location.href = searchResultsElement.getElementsByTagName('li')[searchResultIndex]?.firstChild?.href;
  } else if (e.key === 'Enter' && searchResultIndex == null) {
    window.location.href = `/blog/search?q=${searchBoxElement.querySelector('input').value}&page=1&pageSize=9`;
  }
});

window.addEventListener('click', (e) => {
  const isSearchBox = searchBoxElement.contains(e.target);
  if (!isSearchBox) {
    closeSearchField();
  }
});

window.addEventListener('focusout', (e) => {
  const isSearchBox = searchBoxElement.contains(e.target);
  const isSearchResults = searchResultsElement.contains(e.target);
  if (!isSearchBox && !isSearchResults) {
    closeSearchField();
  }
});

/**
 * loads and decorates the search
 * @param {Element} block The search block
 */
export default async function decorate(block) {
  const queryIndex = block.querySelector('p')?.innerText;
  const source = queryIndex || '/query-index.json';
  searchBlock = block;
  block.innerHTML = '';
  block.append(
    searchBox(block, {
      source,
    }),
    searchResultsContainer(block),
  );

  if (searchParams.get('q')) {
    const input = block.querySelector('input');
    input.value = searchParams.get('q');
    input.dispatchEvent(new Event('input'));
  }

  decorateIcons(block);
}
