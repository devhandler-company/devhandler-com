export default function decorate(block) {
  const isDesktopHidden = block.classList.contains('no-desktop-scroll');
  const isMobileHidden = block.classList.contains('no-mobile-scroll');
  Array.from(block.children).forEach((element) => {
    const dupplicate = element.cloneNode(true);
    isDesktopHidden && dupplicate.classList.add('desktop-hidden');
    isMobileHidden && dupplicate.classList.add('mobile-hidden');
    block.appendChild(dupplicate);
  });
}
