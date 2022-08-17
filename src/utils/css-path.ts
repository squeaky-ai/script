export function cssPath(element: any): string | null {
  try {
    const path = [];

    if (!element) return null;

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
  } catch {
    return null;
  }
}

export function getNodeInnerText(node: any): string | null {
  try {
    if (
      node?.firstElementChild === null && 
      node?.firstChild?.nodeType === Node.TEXT_NODE
    ) {
      // The use case is targeted at buttons and links and
      // whatnot, and if they have more than 50 chars then
      // that is their fault
      return (node.innerText || '').slice(0, 50);
    }

    // If the element doesn't directly contain text then
    // we don't care. If we just added all .innerText then
    // clicking on the body would store the whole pages
    // text
    return null;
  } catch {
    return null;
  }
}
