export default async function decorate(block) {
  try {
    const getFieldValue = (label) => {
      const row = [...block.children]
        .find((div) => div.children[0]?.textContent.trim().toLowerCase() === label);
      return row?.children[1] || null;
    };

    const normalizeGoogleDocsUrl = (url) => {
      const parsed = new URL(url);
      if (parsed.hostname === 'docs.google.com' && parsed.pathname.includes('/edit')) {
        if (parsed.hash) {
          return parsed.hash.replace(/^#/, '/') || '/';
        }
        return '/view';
      }
      return url;
    };

    // Extract fields
    const headline = getFieldValue('headline')?.querySelector('h2')?.textContent.trim() || '';

    // Clean highlighted text by stripping nested spans and taking only text content
    const highlightedRaw = getFieldValue('highlighted-text')?.querySelector('h2');
    const highlightedText = highlightedRaw?.textContent.trim() || '';

    const description = getFieldValue('text')?.querySelector('p')?.innerHTML || '';
    const originalButton = getFieldValue('button')?.querySelector('a');

    // Build new content container
    const container = document.createElement('div');
    container.className = 'lets-talk-content';

    const title = document.createElement('h2');
    title.className = 'headline';
    title.innerHTML = `${headline} <span class="highlighted">${highlightedText}</span>`;
    container.appendChild(title);

    if (description) {
      const desc = document.createElement('p');
      desc.className = 'description';
      desc.innerHTML = description;
      container.appendChild(desc);
    }

    const wrapper = block.closest('.blog-lets-talk-wrapper');
    let textColor; let backgroundColor; let boldColor; let
      buttonLink;

    if (wrapper) {
      ({
        textColor, backgroundColor, boldColor, buttonLink,
      } = wrapper.dataset);

      if (textColor) {
        block.style.color = textColor;
        title.style.color = textColor;
        container.querySelectorAll('p').forEach((p) => {
          p.style.color = textColor;
        });
      }

      if (backgroundColor) {
        block.style.backgroundColor = backgroundColor;
      }
    }

    // Apply boldColor to .highlighted
    const highlightedSpan = title.querySelector('.highlighted');
    if (highlightedSpan && boldColor) {
      highlightedSpan.style.color = boldColor;
    }

    // Button logic
    let button = originalButton;
    if (button) {
      button.href = normalizeGoogleDocsUrl(button.href);
    } else if (buttonLink) {
      button = document.createElement('a');
      button.href = buttonLink;
      button.textContent = 'Learn more';
    }

    if (button) {
      button.classList.add('cta-button');
      const buttonWrapper = document.createElement('div');
      buttonWrapper.className = 'button-wrapper';
      buttonWrapper.appendChild(button);
      container.appendChild(buttonWrapper);
    }

    block.innerHTML = '';
    block.appendChild(container);
  } catch (error) {
    block.innerHTML = '<p class="error">There was a problem rendering this block.</p>';
  }
}
