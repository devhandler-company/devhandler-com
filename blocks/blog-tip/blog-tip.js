export default function decorate(block) {
    console.log('Decorating blog-tip block (internal structure):', block);

    const TipClasses = {
        BODY: 'tip-body',
        PARAGRAPH: 'tip-paragraph',
        EMPHASIS: 'tip-emphasis',
    };

    const originalRow = block.querySelector(':scope > div');
    const originalContentCell = originalRow?.querySelector(':scope > div');

    if (!originalContentCell) {
        console.warn(
            'Blog Tip Decorate: Could not find the standard AEM content cell (div > div) for block. ' +
            'The block might be empty or have an unexpected structure.',
            block
        );
        return;
    }

    const newContentWrapper = document.createElement('div');
    newContentWrapper.classList.add(TipClasses.BODY);

    while (originalContentCell.firstChild) {
        const node = originalContentCell.firstChild;

        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches('p')) {
                node.classList.add(TipClasses.PARAGRAPH);
            }
            node.querySelectorAll('strong').forEach((strongEl) => {
                strongEl.classList.add(TipClasses.EMPHASIS);
            });
        }
        newContentWrapper.appendChild(node);
    }

    originalRow.remove();
    block.appendChild(newContentWrapper);
    console.log('Blog Tip decoration complete. Final internal structure:', block.innerHTML);
}