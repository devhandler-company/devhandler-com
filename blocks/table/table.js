function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

function parseSource(block) {
  const rows = [];
  let maxCols = 0;

  [...block.children].forEach((sourceRow) => {
    const cells = [...sourceRow.children];
    const width = cells.reduce((sum, cell) => {
      const span = parseInt(cell.getAttribute('colspan') || cell.getAttribute('data-colspan') || 1, 10);
      return sum + span;
    }, 0);

    rows.push({ cells, width });
    if (width > maxCols) maxCols = width;
  });

  return { rows, maxCols };
}

export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const hasHeader = !block.classList.contains('no-header');
  if (hasHeader) table.append(thead);
  table.append(tbody);

  const { rows, maxCols } = parseSource(block);

  rows.forEach(({ cells, width }, rowIndex) => {
    const tr = document.createElement('tr');
    if (hasHeader && rowIndex === 0) thead.append(tr);
    else tbody.append(tr);

    const needsAutoColspan = cells.length && width < maxCols;

    cells.forEach((sourceCell, colIndex) => {
      const td = buildCell(hasHeader ? rowIndex : rowIndex + 1);

      const explicitColspan = sourceCell.getAttribute('colspan') || sourceCell.getAttribute('data-colspan');
      const explicitRowspan = sourceCell.getAttribute('rowspan') || sourceCell.getAttribute('data-rowspan');
      if (explicitColspan) td.colSpan = parseInt(explicitColspan, 10);
      if (explicitRowspan) td.rowSpan = parseInt(explicitRowspan, 10);

      const align = sourceCell.getAttribute('data-align');
      const valign = sourceCell.getAttribute('data-valign');
      if (align) td.style.textAlign = align;
      if (valign) td.style.verticalAlign = valign;

      td.innerHTML = sourceCell.innerHTML;

      if (needsAutoColspan && colIndex === 0 && !explicitColspan) {
        td.colSpan = (td.colSpan || 1) + (maxCols - width);
      }

      tr.append(td);
    });
  });

  block.innerHTML = '';
  block.append(table);
}
