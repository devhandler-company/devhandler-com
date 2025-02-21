export default function decorate(block) {
  const clutchVersion = block.classList.contains('mini')
    ? '<div class="clutch-widget" data-url="https://widget.clutch.co" data-widget-type="1" data-height="40" data-nofollow="true" data-expandifr="true" data-clutchcompany-id="2366887"></div>'
    : '<div class="clutch-widget" data-url="https://widget.clutch.co" data-widget-type="2" data-height="45" data-nofollow="true" data-expandifr="true" data-clutchcompany-id="2366887"></div>';
  block.innerHTML = `<button class="button">${clutchVersion}</button>`;
  block.classList.add('button');
  block.classList.add('to-left');
}
