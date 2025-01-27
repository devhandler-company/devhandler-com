export default function decorate(block) {
    Array.from(block.children).forEach((element) => {
        block.appendChild(element.cloneNode(true));
    })
}
