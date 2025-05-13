/* eslint-disable no-console */
// --- Helper Functions ---
import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

/**
 * Reads key-value pairs from the block's DOM structure.
 * Expects divs where the first child is the key and the second is the value.
 * Converts kebab-case keys from DOM to camelCase for JS.
 * @param {HTMLElement} block The block element.
 * @returns {object} A configuration object.
 */
function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    if (row.children?.length >= 2) {
      const keyElement = row.children[0];
      const valueElement = row.children[1];
      if (keyElement && valueElement) {
        const key = keyElement.textContent.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const value = valueElement.textContent?.trim() || '';
        config[key] = value;
      }
    }
  });
  return config;
}
/**
 * Highlights search terms within specified DOM elements.
 * (This is your existing highlightTextElements function, slightly refined from the other script
 *  to match your existing one if it was different, or kept if it was the same)
 * @param {string[]} terms Array of search terms.
 * @param {HTMLElement[]} elements Array of elements to highlight within.
 */
const highlightTextElements = (terms, elements) => {
  elements.forEach((element) => {
    if (!element?.textContent || terms.length === 0) return;

    const { textContent } = element; // Use original textContent for finding matches
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    // Create a regex to find all terms, case-insensitive
    // Ensure terms are escaped for regex and handle empty terms
    const validTerms = terms.filter(Boolean).map((term) => term.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    if (validTerms.length === 0) {
      element.textContent = textContent; // No valid terms to highlight
      return;
    }
    const regex = new RegExp(`(${validTerms.join('|')})`, 'gi');
    let match;

    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(textContent)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(
          textContent.substring(lastIndex, match.index),
        ));
      }

      const mark = document.createElement('mark');
      const [matchedSubstring] = match;
      mark.textContent = matchedSubstring;
      fragment.appendChild(mark);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < textContent.length) {
      fragment.appendChild(document.createTextNode(textContent.substring(lastIndex)));
    }

    if (fragment.childNodes.length > 0) {
      element.innerHTML = '';
      element.appendChild(fragment);
    } else {
      element.textContent = textContent;
    }
  });
};

/**
 * Fetches and processes the search index data from the provided URL.
 * @param {string} url The URL of the query index JSON file.
 * @returns {Promise<object[]>} A promise resolving to an array of index items.
 */
const fetchIndexData = async (url) => {
  console.log('Fetching index:', url);
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error(`Failed to fetch index from ${url}. Status: ${resp.status}, Response: ${errorText}`);
      throw new Error(`Fetch error: ${resp.status} from ${url}`);
    }
    const json = await resp.json();
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json)) return json;
    const defaultSheet = json[':default'] || json.default;
    if (defaultSheet && Array.isArray(defaultSheet.data)) {
      return defaultSheet.data;
    }
    const sheetKeys = Object.keys(json);
    const foundKey = sheetKeys.find((key) => json[key] && Array.isArray(json[key].data));
    if (foundKey) {
      return json[foundKey].data;
    }
    console.error(`Index data from ${url} is not in expected format. Received:`, json);
    throw new Error('Invalid index data format');
  } catch (e) {
    console.error(`Exception during fetchIndexData for ${url}: ${e.message}`);
    throw e;
  }
};
// --- End Fetch Logic ---

/**
 * Decorates the search results block.
 * @param {HTMLElement} block The search results block element.
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const defaults = {
    queryIndexLink: '/query-index.json',
    resultsPerPage: 9,
    searchInputPlaceholder: 'Search...',
    noResultsText: 'No results found.',
    paginationPrevLabel: '‹ Previous',
    paginationNextLabel: 'Next ›',
    pageTemplate: '',
    errorText: 'Sorry, there was an error loading search results.',
    initialPromptText: 'Enter a term above to search.',
    loadMoreIncreaseSizeButtonText: '',
    resultsCountText: 'Showing {start}-{end} of {total} results for "{term}"',
    resultsCountTextSingular: 'Showing {total} result for "{term}"',
    resultsCountTextAll: 'Showing all {total} results for "{term}"',
    resultsCountTextNoTerm: 'Showing {start}-{end} of {total} results',
    resultsCountTextNoTermSingular: 'Showing {total} result',
    resultsCountTextNoTermAll: 'Showing all {total} results',
  };

  const finalConfig = { ...defaults, ...config };

  const shouldShowIncreaseSizeButton = !!finalConfig.loadMoreIncreaseSizeButtonText;

  // --- Component State ---
  let fullIndexData = null;
  let currentFilteredData = [];
  let currentPage = 1;
  let currentSearchTerm = '';
  let effectivePageSize = parseInt(finalConfig.resultsPerPage, 10);
  let isLoading = false;
  let isInitialLoad = true;
  let debounceTimer;

  // --- DOM Elements ---
  block.innerHTML = '';
  block.classList.add('search-results-wrapper');

  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-container';

  const searchInputContainer = document.createElement('div');
  searchInputContainer.className = 'search-input-container';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'search-input';
  searchInput.placeholder = finalConfig.searchInputPlaceholder;
  searchInput.setAttribute('aria-label', finalConfig.searchInputPlaceholder);

  const searchIconElement = document.createElement('span');
  searchIconElement.classList.add('icon', 'icon-search');

  const clearButton = document.createElement('button');
  clearButton.className = 'search-clear-button';
  clearButton.type = 'button';
  clearButton.innerHTML = '×';
  clearButton.setAttribute('aria-label', 'Clear search term');
  clearButton.hidden = true;

  searchInputContainer.append(searchInput, clearButton, searchIconElement);

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'search-results-container';
  resultsContainer.setAttribute('aria-live', 'polite');
  resultsContainer.setAttribute('aria-atomic', 'true');

  const searchStatus = document.createElement('div');
  searchStatus.className = 'search-status';
  searchStatus.setAttribute('aria-live', 'assertive');

  const searchResultsInfo = document.createElement('div');
  searchResultsInfo.className = 'search-results-info';
  searchResultsInfo.setAttribute('aria-live', 'polite');

  const searchResultsGrid = document.createElement('ul');
  searchResultsGrid.className = 'search-results-grid';

  const searchPaginationContainer = document.createElement('nav');
  searchPaginationContainer.className = 'search-pagination-container';
  searchPaginationContainer.setAttribute('aria-label', 'Search results pagination');

  resultsContainer.append(searchStatus, searchResultsInfo, searchResultsGrid);
  searchContainer.append(searchInputContainer);
  block.append(searchContainer, resultsContainer, searchPaginationContainer);

  function openSearchField() {
    if (!searchContainer.classList.contains('search-open')) {
      searchContainer.classList.add('search-open');
    }
  }

  /**
     * Closes the search input area by removing the class.
     */
  function closeSearchField() {
    if (searchContainer.classList.contains('search-open')) {
      searchContainer.classList.remove('search-open');
    }
  }

  searchInput.addEventListener('focus', () => {
    openSearchField();
  });

  searchIconElement.addEventListener('click', () => {
    openSearchField();
    searchInput.focus();
  });
  searchInputContainer.addEventListener('click', (e) => {
    if (e.target !== searchInput && e.target !== clearButton && e.target !== searchIconElement) {
      openSearchField();
      searchInput.focus();
    }
  });

  searchInput.addEventListener('keyup', (e) => {
    if (e.code === 'Escape') {
      e.preventDefault();
      if (searchInput.value !== '') {
        clearButton.click();
      } else {
        searchInput.blur();
        closeSearchField();
      }
    }
  });

  window.addEventListener('click', (e) => {
    if (!block.contains(e.target)) {
      closeSearchField();
    }
  });

  block.addEventListener('focusout', (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      closeSearchField();
    }
  });

  // --- Helper Functions (Your existing ones) ---
  const setIsLoadingState = (loading) => {
    isLoading = loading;
    block.classList.toggle('is-loading', loading);
    searchInput.disabled = loading;
    searchStatus.textContent = loading ? 'Loading...' : '';
    searchStatus.style.display = loading ? 'block' : 'none';
    if (!loading) {
      searchInput.disabled = !fullIndexData;
    }
  };

  const filterData = (searchTerm) => {
    if (!fullIndexData) return [];
    const baseData = finalConfig.pageTemplate
      ? fullIndexData.filter((item) => item.template === finalConfig.pageTemplate)
      : fullIndexData;
    const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return baseData;
    return baseData.filter((item) => {
      const searchableText = [item.title, item.description, item.path]
        .filter(Boolean).join(' ').toLowerCase();
      return terms.every((term) => searchableText.includes(term));
    });
  };

  const renderResultsInfo = () => {
    const totalResults = currentFilteredData.length;
    searchResultsInfo.textContent = '';
    searchResultsInfo.style.display = 'none';

    if (isLoading || (isInitialLoad && !currentSearchTerm) || totalResults === 0) {
      return;
    }

    let messageTemplate = '';
    const placeholders = {
      total: totalResults,
      term: currentSearchTerm,
      start: (currentPage - 1) * effectivePageSize + 1,
      end: Math.min(currentPage * effectivePageSize, totalResults),
    };

    if (currentSearchTerm) {
      if (totalResults === 1 && finalConfig.resultsCountTextSingular) {
        messageTemplate = finalConfig.resultsCountTextSingular;
      } else if (placeholders.end >= totalResults && finalConfig.resultsCountTextAll) {
        messageTemplate = finalConfig.resultsCountTextAll;
      } else {
        messageTemplate = finalConfig.resultsCountText;
      }
    } else if (totalResults === 1 && finalConfig.resultsCountTextNoTermSingular) {
      messageTemplate = finalConfig.resultsCountTextNoTermSingular;
    } else if (placeholders.end >= totalResults && finalConfig.resultsCountTextNoTermAll) {
      messageTemplate = finalConfig.resultsCountTextNoTermAll;
    } else {
      messageTemplate = finalConfig.resultsCountTextNoTerm;
    }

    const message = messageTemplate.replace(/\{(\w+)\}/g, (_, key) => placeholders[key] ?? '');
    searchResultsInfo.textContent = message;
    searchResultsInfo.style.display = 'block';
  };

  const renderResultsPage = (resultsToDisplay, searchTerms) => {
    searchResultsGrid.innerHTML = '';

    if (!isLoading && resultsToDisplay.length === 0) {
      if (currentSearchTerm) {
        searchResultsGrid.innerHTML = `<li class="search-no-results">${finalConfig.noResultsText}</li>`;
      } else if (isInitialLoad) {
        searchResultsGrid.innerHTML = `<li class="search-prompt">${finalConfig.initialPromptText}</li>`;
      } else {
        searchResultsGrid.innerHTML = `<li class="search-no-results">${finalConfig.noResultsText}</li>`;
      }
      return;
    }

    resultsToDisplay.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'search-result-card';
      const cardImage = document.createElement('div');
      cardImage.className = 'search-result-card-image';
      if (item.image) {
        cardImage.append(createOptimizedPicture(item.image, item.title || '', false, [{ width: '400' }]));
      }
      const cardBody = document.createElement('div');
      cardBody.className = 'search-result-card-body';
      const titleLink = document.createElement('a');
      titleLink.href = item.path;
      titleLink.className = 'search-result-card-link';
      const titleElement = document.createElement('h3');
      titleElement.className = 'search-result-card-title';
      titleElement.textContent = (item.title || 'Untitled Result').length > 50
        ? `${item.title.slice(0, 50)}...` || 'Untitled Result'
        : item.title || 'Untitled Result';
      titleLink.append(titleElement);
      const descriptionElement = document.createElement('p');
      descriptionElement.className = 'search-result-card-description';
      descriptionElement.textContent = (item.description || 'Result with no description').length > 250
        ? `${item.description.slice(0, 250)}...` || 'Result with no description'
        : item.description || 'Result with no description';
      if (searchTerms.length > 0) {
        highlightTextElements(searchTerms, [titleElement, descriptionElement]);
      }
      cardBody.append(titleLink, descriptionElement);
      const linkElement = document.createElement('p');
      linkElement.classList.add('button-container');
      linkElement.innerHTML = `<a href="${item.path}" title="View result for ${item.title || ''}" class="button secondary">Read More</a>`;
      cardBody.append(linkElement);
      li.append(cardImage, cardBody);
      searchResultsGrid.appendChild(li);
    });
  };

  const renderPagination = (totalResults) => {
    searchPaginationContainer.innerHTML = '';

    const totalPages = Math.ceil(totalResults / effectivePageSize);
    if (totalPages > 1) {
      const createButton = (text, pageNum, isDisabled = false, isCurrent = false, isEllipsis = false, label = '') => {
        if (isEllipsis) {
          const span = document.createElement('span');
          span.className = 'search-pagination-ellipsis';
          span.innerHTML = '…';
          return span;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.disabled = isDisabled || isCurrent;
        button.classList.add('search-pagination-button');
        button.setAttribute('aria-label', label || (isCurrent ? `Page ${pageNum}, current page` : `Go to page ${pageNum}`));
        if (isCurrent) {
          button.classList.add('current');
          button.setAttribute('aria-current', 'page');
        }
        // eslint-disable-next-line no-use-before-define
        button.addEventListener('click', () => navigateToPage(pageNum));
        return button;
      };
      const pagesToShow = new Set([1, totalPages, currentPage]);
      if (currentPage > 1) pagesToShow.add(currentPage - 1);
      if (currentPage < totalPages) pagesToShow.add(currentPage + 1);

      const standardPaginationWrapper = document.createElement('div');
      standardPaginationWrapper.className = 'search-standard-pagination';

      standardPaginationWrapper.append(
        createButton(finalConfig.paginationPrevLabel, currentPage - 1, currentPage === 1, false, false, 'Go to previous page'),
      );
      let lastRenderedPage = 0;
      Array.from(pagesToShow).sort((a, b) => a - b).forEach((page) => {
        if (page > lastRenderedPage + 1) standardPaginationWrapper.append(createButton('', 0, false, false, true));
        standardPaginationWrapper.append(
          createButton(String(page), page, false, page === currentPage),
        );
        lastRenderedPage = page;
      });
      standardPaginationWrapper.append(
        createButton(finalConfig.paginationNextLabel, currentPage + 1, currentPage === totalPages, false, false, 'Go to next page'),
      );
      searchPaginationContainer.append(standardPaginationWrapper);
    }

    if (shouldShowIncreaseSizeButton && effectivePageSize < totalResults) {
      const increaseSizeButton = document.createElement('button');
      increaseSizeButton.type = 'button';
      increaseSizeButton.textContent = finalConfig.loadMoreIncreaseSizeButtonText;
      increaseSizeButton.className = 'search-increase-size-button';
      increaseSizeButton.addEventListener('click', () => {
        const newPageSize = Math.min(
          Math.round(effectivePageSize * 1.5),
          totalResults,
        );
        if (newPageSize > effectivePageSize) {
          // eslint-disable-next-line no-use-before-define
          updateStateAndRender(currentSearchTerm, 1, newPageSize, false);
        }
      });
      searchPaginationContainer.append(increaseSizeButton);
    }
  };

  const updateStateAndRender = (searchTerm, pageNum, pageSize, fromHistory = false) => {
    if (isLoading && !fullIndexData && !fromHistory) return;

    const hasSearchTermChanged = searchTerm !== currentSearchTerm;
    const hasPageSizeChanged = pageSize !== effectivePageSize;

    const wasInitialLoad = isInitialLoad;
    if (!fromHistory) {
      isInitialLoad = false;
    }

    let nextPageNum = pageNum;
    if (hasSearchTermChanged || hasPageSizeChanged) {
      nextPageNum = 1;
    }

    currentSearchTerm = searchTerm;
    currentPage = nextPageNum;
    effectivePageSize = pageSize;

    if (!fromHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchTerm);
      url.searchParams.set('page', String(currentPage));
      url.searchParams.set('pageSize', String(effectivePageSize));
      try {
        window.history.pushState({ searchTerm, page: currentPage, pageSize: effectivePageSize }, '', url.toString());
      } catch (e) {
        console.error('Error pushing state to history:', e);
      }
    }

    if (hasSearchTermChanged || (wasInitialLoad && !fromHistory)) {
      currentFilteredData = filterData(searchTerm);
    }

    const startIndex = (currentPage - 1) * effectivePageSize;
    let resultsToDisplay = currentFilteredData.slice(startIndex, startIndex + effectivePageSize);

    const initialUrlParamsOnLoad = new URLSearchParams(window.location.search);
    if (wasInitialLoad && !fromHistory && searchTerm === '' && !initialUrlParamsOnLoad.has('q')) {
      resultsToDisplay = [];
      if (hasSearchTermChanged || (wasInitialLoad && !fromHistory)) {
        currentFilteredData = [];
      }
    }

    const processedSearchTerms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);

    renderResultsPage(resultsToDisplay, processedSearchTerms);
    renderResultsInfo();
    renderPagination(currentFilteredData.length);

    clearButton.hidden = searchTerm.length === 0;
  };

  const navigateToPage = (pageNum) => {
    if (pageNum !== currentPage && pageNum > 0) {
      updateStateAndRender(currentSearchTerm, pageNum, effectivePageSize, false);
      block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- Event Listeners ---
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.trim();
    clearButton.hidden = searchTerm.length === 0;
    if (searchTerm.length > 0) {
      openSearchField();
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateStateAndRender(searchTerm, 1, effectivePageSize, false);
    }, 300);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounceTimer);
      const searchTerm = searchInput.value.trim();
      updateStateAndRender(searchTerm, 1, effectivePageSize, false);
      closeSearchField();
      searchInput.blur();
    }
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    clearButton.hidden = true;
    clearTimeout(debounceTimer);
    const initialConfigPageSize = parseInt(finalConfig.resultsPerPage, 10);
    updateStateAndRender('', 1, initialConfigPageSize, false);
    searchInput.focus();
    openSearchField();
  });

  window.addEventListener('popstate', (e) => {
    if (!fullIndexData) {
      console.warn('Popstate event occurred before search index was fully loaded.');
      return;
    }
    const state = e.state || {};
    const urlParams = new URLSearchParams(window.location.search);
    const historySearchTerm = state.searchTerm ?? urlParams.get('q') ?? '';
    let historyPage = 1;
    const pageParam = state.page ?? urlParams.get('page');
    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (!Number.isNaN(parsedPage) && parsedPage > 0) historyPage = parsedPage;
    }
    let historyPageSize = parseInt(finalConfig.resultsPerPage, 10);
    const pageSizeParam = state.pageSize ?? urlParams.get('pageSize');
    if (pageSizeParam) {
      const parsedSize = parseInt(pageSizeParam, 10);
      if (!Number.isNaN(parsedSize) && parsedSize > 0) historyPageSize = parsedSize;
    }
    searchInput.value = historySearchTerm;
    if (historySearchTerm) {
      openSearchField();
    } else {
      closeSearchField();
    }
    updateStateAndRender(historySearchTerm, historyPage, historyPageSize, true);
  });

  // --- Initial Load ---
  const initialUrlParams = new URLSearchParams(window.location.search);
  const initialSearchTerm = initialUrlParams.get('q') || '';
  let initialPage = 1;
  const initialPageParam = initialUrlParams.get('page');
  if (initialPageParam) {
    const parsedPage = parseInt(initialPageParam, 10);
    if (!Number.isNaN(parsedPage) && parsedPage > 0) initialPage = parsedPage;
  }
  let initialPageSize = parseInt(finalConfig.resultsPerPage, 10);
  const initialPageSizeParam = initialUrlParams.get('pageSize');
  if (initialPageSizeParam) {
    const parsedSize = parseInt(initialPageSizeParam, 10);
    if (!Number.isNaN(parsedSize) && parsedSize > 0) initialPageSize = parsedSize;
  }

  searchInput.value = initialSearchTerm;
  clearButton.hidden = initialSearchTerm.length === 0;
  isInitialLoad = true;

  setIsLoadingState(true);
  searchStatus.textContent = 'Loading search index...';
  searchStatus.style.display = 'block';

  try {
    fullIndexData = await fetchIndexData(finalConfig.queryIndexLink);
    searchStatus.textContent = '';
    searchStatus.style.display = 'none';
    if (initialSearchTerm) {
      openSearchField();
    }
    updateStateAndRender(initialSearchTerm, initialPage, initialPageSize, false);
  } catch (error) {
    console.error('Top-level error during search setup:', error.message);
    fullIndexData = null;
    currentFilteredData = [];
    searchResultsInfo.textContent = '';
    searchResultsInfo.style.display = 'none';
    searchResultsGrid.innerHTML = '';
    searchPaginationContainer.innerHTML = '';
    searchStatus.textContent = finalConfig.errorText;
    searchStatus.style.display = 'block';
    block.classList.remove('is-loading');
    searchInput.disabled = true;
  } finally {
    setIsLoadingState(false);
    decorateIcons(block);
  }
}
