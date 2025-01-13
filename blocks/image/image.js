import { createTag } from "../../scripts/utils.js";

export default function decorate(block) {
    const picture = block.querySelector("picture");
    const icons = getIconsTag(block);
    block.innerHTML = "";
    block.appendChild(picture);
    icons && block.appendChild(icons);
}

const getIconsTag = (block) => {
    const icons = [];
    for (let i = 1; i < block.children.length; i++) {
        const iconContainer = block.children[i];
        icons.push(buildIcon(iconContainer));
    }
    let iconsTag;
    if (icons) {
        iconsTag = createTag("div", { class: "image-icons" }, "");
        icons.forEach((icon) => iconsTag.appendChild(icon));
    }
    return iconsTag;
};

const buildIcon = (iconContainer) => {
    const icons = iconContainer.querySelectorAll("p:not(:has(sub))");
    const mainIcon = icons[0].textContent;
    const hoverIcon = icons[1] ? icons[1].textContent : "";

    const link = iconContainer.querySelector("a");
    let tagData = {
        class: "image-icon",
        style: `--image-icon-path: url("${mainIcon}"); --image-icon-hover-path: url("${hoverIcon || mainIcon}");`,
    };

    const ariaLabel = iconContainer.querySelector("sub");

    if (link) {
        tagData.href = link.getAttribute("href");
        tagData["aria-label"] = ariaLabel ? ariaLabel.textContent || "Icon" : "Icon";
    }

    const iconTag = createTag(link ? "a" : "span", tagData, "");
    return iconTag;
};
