export default function decorate(block) {
  const isDesktopHidden = block.classList.contains('no-desktop-scroll');
  const isMobileHidden = block.classList.contains('no-mobile-scroll');
  Array.from(block.children).forEach((element) => {
    const dupplicate = element.cloneNode(true);
    if (isDesktopHidden) {
      dupplicate.classList.add('desktop-hidden');
    }
    if (isMobileHidden) {
      dupplicate.classList.add('mobile-hidden');
    }
    block.appendChild(dupplicate);
  });
  if (block.classList.contains('images')) {
    block.querySelectorAll('img').forEach((element) => {
      element.width = '300';
      element.height = '100';
    });
  }
}
