export function cssPath(element: any): string {
  const path = [];

  while (element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();

    if (element.id) {
      selector += `#${element.id}`;
      path.unshift(selector);
      break;
    } else {
      let nth = 1;
      let sibling: Element | null = element;

      while (sibling = sibling!.previousElementSibling) {
        if (sibling.nodeName.toLowerCase() === selector) {
          nth++;
        }
      }

      if (nth !== 1) {
        selector += `:nth-of-type(${nth})`;
      }
    }
    path.unshift(selector);
    element = element.parentNode as Element;
  }
  return path.join(' > ');
}
