export default function decorate(block) {
  const picture = block.querySelector("picture");
  block.innerHTML = "";
  block.appendChild(picture);
}
