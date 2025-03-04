const getLeftSideContent = (name, text, pictureHtml, index) => {
  const greenClasses = 'block-group developers-body block-group-end desktop-bg-gray-linear border default-padding text-bottom mobile-border-top-none mobile-bg-cyan mobile-border-cyan mobile-color-black block';
  const whiteClasses = 'block-group developers-body block-group-end bg-white border border-white color-black default-padding text-bottom mobile-border-top-none mobile-bg-cyan mobile-border-cyan block';
  return `<div class="section desktop-grid desktop-grid-20-40-40 mobile-grid grid-mobile-reverse mobile-gap-0 mobile-padding-0 block-group-start-container block-group-end-container custom-heading-container image-container"
     data-section-status="loaded" style="">


    <div class="block-group block-group-end full-height stick-left ${index % 4 === 0 ? 'stick-bg-blue' : ''} mobile-hidden block"></div>
    <div class="${index % 4 === 0 ? whiteClasses : greenClasses}">
        <div class="custom-heading-wrapper">
            <div class="h6 margin-bottom-24">
                ${text}
            </div>
        </div>
        <div class="default-content-wrapper"><h3 id="mark-peterson">${name}</h3></div>
    </div>
    <div class="block-group block-group-end block">
        <div class="image-wrapper">
            <div class="image ratio-1-1 mobile-border-none block" data-block-name="image" data-block-status="loaded">
                ${pictureHtml}
                <div class="image-icons"></div>
            </div>
        </div>
    </div>
</div>
    `;
};

const getRightSideContent = (name, text, pictureHtml) => `
  <div class="section desktop-grid desktop-grid-60-40 mobile-grid mobile-gap-0 mobile-padding-0 mobile-margin-top-0 block-group-start-container image-container block-group-end-container custom-heading-container"
     data-section-status="loaded" style="">
    <div class="block-group block-group-end block">
        <div class="image-wrapper">
            <div class="image ratio-3-2 mobile-border-none block" data-block-name="image" data-block-status="loaded">
                ${pictureHtml}
                <div class="image-icons"></div>
            </div>
        </div>
    </div>
    <div class="block-group block-group-end block">
        <div class="developers-body block-group block-group-end text-bottom bg-white border border-white mobile-border-cyan mobile-bg-cyan color-black default-padding full-height mobile-border-top-none block">
            <div class="custom-heading-wrapper">
                <div class="h6 margin-bottom-24">
                    ${text}
                </div>
            </div>
            <div class="default-content-wrapper"><h3 id="alisa-milano">${name}</h3></div>
        </div>
        <div class="block-group block-group-end padding-top-96 stick-right stick-bg-blue mobile-hidden block"></div>
    </div>
</div>
  `;
export default function (block) {
  let finalHtml = '';
  [...block.children].forEach((row, index) => {
    const pictureHtml = row.querySelector('picture').outerHTML;
    const name = row.querySelector('h3').outerHTML;
    const text = [...row.querySelectorAll('p')].map((element) => element.outerHTML).join('');
    // eslint-disable-next-line no-mixed-operators
    finalHtml += (index % 2 === 0 ? getLeftSideContent(name, text, pictureHtml, index) : getRightSideContent(name, text, pictureHtml));
  });
  block.textContent = '';
  block.innerHTML = finalHtml;
}
