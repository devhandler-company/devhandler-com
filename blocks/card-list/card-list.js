export default function decorate(block) {
    Array.from(block.children).forEach((element) => {
        const dupplicate = element.cloneNode(true);
        dupplicate.classList.add('desktop-hidden');
        block.appendChild(dupplicate);
    });
}
