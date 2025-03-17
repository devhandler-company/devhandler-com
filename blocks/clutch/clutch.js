export default function decorate(block) {
  const clutchVersion = block.classList.contains('mini')
    ? '<div class="clutch-widget" data-url="https://widget.clutch.co" data-widget-type="1" data-height="40" data-nofollow="true" data-expandifr="true" data-clutchcompany-id="2366887"><iframe sandbox id="iframe-0.027646867814427933" width="100%" src="https://www.devhandler.com/clutch-widget-mini" height="40px" scrolling="no" style="border: none; overflow: hidden; display: block; height: 40px;" title="[iFrameSizer]iframe-0.027646867814427933:40:148:init1"></iframe></div>'
    : '<div class="clutch-widget" data-url="https://widget.clutch.co" data-widget-type="2" data-height="45" data-nofollow="true" data-expandifr="true" data-clutchcompany-id="2366887"><iframe sandbox id="iframe-0.21521029878143394" width="100%" src="https://www.devhandler.com/clutch-widget" height="45px" scrolling="no" style="border: none; overflow: hidden; display: block; height: 44px;" title="[object Object]2"></iframe></div>';
  block.innerHTML = `<a href="https://clutch.co/profile/devhandler" target="_blank" aria-label="Review on clutch" class="button">${clutchVersion}</a>`;
  block.classList.add('button');
  block.classList.add('to-left');
}
