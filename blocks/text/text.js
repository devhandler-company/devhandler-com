const getBlockProperties = (block) => {
  const propertiesMap = {};
  [...block.children].forEach((row) => {
    propertiesMap[row.firstElementChild.textContent] =
      row.lastElementChild.textContent;
  });
  return propertiesMap;
};

export default function decorate(block) {
  const componentProperties = getBlockProperties(block);
  block.textContent = componentProperties.Content;
}
