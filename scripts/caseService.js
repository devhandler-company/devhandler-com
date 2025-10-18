/* eslint-disable linebreak-style */
// /scripts/caseService.js
async function fetchCaseCardsData(source) {
  const res = await fetch(source);
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading API response', res);
    return null;
  }
  const json = await res.json();
  if (!json) {
    // eslint-disable-next-line no-console
    console.error('empty API response', source);
    return null;
  }
  return json.data ? json.data : [];
}

// eslint-disable-next-line linebreak-style
/**
 * Loads all case cards and sorts newest -> oldest
 * @param {String} source Query index link
 * @returns {Array} Sorted case cards
 */
export async function getCaseCardsData(source = '/cases/query-index.json') {
  const data = await fetchCaseCardsData(source);
  if (data?.length) {
    const mapped = data.map((p) => ({
      ...p,
      image:
                p.image && window.location.host
                  ? `${window.location.origin}${p.image}`
                  : `${window.parent.location.origin}${p.image}`,
      lastModified: new Date(Number(p.lastModified)),
    }));
    mapped.sort((a, b) => b.lastModified - a.lastModified);
    return mapped;
  }
  return [];
}

/**
 * Get subset for listing
 * @param {Array} data All cases data
 * @param {String} template Template filter (default case-page-template)
 * @param {Number} count Count of items
 * @param {Number} offset Offset
 * @returns {Array}
 */
export async function getLatestCaseCards(data, template = 'case-page-template', count = 4, offset = 0) {
  if (data?.length) {
    const filtered = data
      .filter((p) => p.template === template)
      .filter((p) => p.path !== '/cases/' && p.path !== '/cases/search'); // adjust if needed
    return filtered.slice(offset, offset + count);
  }
  return [];
}
