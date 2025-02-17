class Accordion {
  constructor(domNode) {
    domNode.classList.add('accordion-item');
    this.heading = domNode.querySelector('h3');

    if (!this.heading) {
      return;
    }
    const headingText = this.heading.innerText;
    const sectionId = `${this.heading.id}-section`;

    this.heading.innerHTML = `
          <button class="accordion-button" type="button" aria-expanded="false" aria-controls="${sectionId}">
            <h3 class="accordion-item-heading">${headingText}</h3>
            <span class="accordion-toggle">
                <span class="accordion-minus"></span>
                <span class="accordion-plus"></span>
            </span>
          </button>
        `;

    this.panel = domNode.querySelector('p');
    if (!this.panel) {
      return;
    }
    this.panel.id = sectionId;
    this.panel.classList.add('accordion-panel');
    this.button = this.heading.querySelector('.accordion-button');
    this.button?.addEventListener('click', this.onButtonClick.bind(this));
    this.isOpen = this.button?.getAttribute('aria-expanded') === 'true';
  }

  onButtonClick() {
    this.isOpen = !this.isOpen;
    this.button?.setAttribute('aria-expanded', this.isOpen);
    this.panel?.classList.toggle('opened', this.isOpen);
  }
}

export default function decorate(block) {
  if (!block) {
    return;
  }

  Array.from(block.children).forEach((domNode) => new Accordion(domNode));
}
