async function fetchBlogCardsData(source) {
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

  return json.data ? json.data : [];
}

/**
 * Loads all blog cards and sort it from newest to oldest
 * @param {String} source Query index link
 * @returns {Array} Sorted blog cards data
 */
export async function getBlogCardsData(source = '/blog/query-index.json') {
  const blogCardsData = await fetchBlogCardsData(source);
  if (blogCardsData?.length) {
    const blogCardsDataWithDate = blogCardsData.map((p) => ({
      ...p,
      image: (p.image && window.location.host) ? `${window.location.origin}${p.image}` : `${window.parent.location.origin}${p.image}`,
      lastModified: new Date(Number(p.lastModified)),
    }));
    blogCardsDataWithDate.sort((a, b) => b.lastModified - a.lastModified);
    return blogCardsDataWithDate;
  }
  return [];
}

/**
 * Loads some count of last blog cards
 * @param {Array} blogCardsData All blog cards data
 * @param {String} template Page template
 * @param {Number} countOfArticles Count of articles
 * @param {Number} offset Articles offset
 * @returns {Array} Latest blog cards data
 */
export async function getLatestBlogCards(
  blogCardsData,
  template = 'blog-page-template',
  countOfArticles = 4,
  offset = 0,
) {
  if (blogCardsData?.length) {
    const filteredPages = blogCardsData
      .filter((page) => page.template === template)
      .filter((page) => page.path !== '/blog/' && page.path !== '/blog/search'); // Todo move it into config
    return filteredPages.slice(offset, offset + countOfArticles);
  }
  return [];
}
