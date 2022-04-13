import { clamp } from './utils/maths';
import { cssPath } from './utils/css-path';
import type { Visitor } from './visitor';
import type { SqueakyMagicErasureMessage } from './types/message';

const WIDGET_WIDTH = 320;
const WIDGET_HEIGHT = 512;

type Draggable = {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  mousedown: boolean;
}

export class MagicErasure {
  private open: boolean = false;
  private visitor: Visitor;

  private draggable: Draggable = {
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    mousedown: false,
  };

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public init = () => {
    this.inject();

    document.addEventListener('click', this.handleElementClick);
    document.addEventListener('mouseout', this.handleElementMouseOut);
    document.addEventListener('mouseover', this.handleElementMouseOver);
  };

  private inject = () => {
    if (!document.body.contains(this.widget)) {
      document.body.appendChild(this.widget);
      document.body.appendChild(this.highlighter);
    }
  };

  private get widget(): HTMLButtonElement {
    const button = document.createElement('button');

    button.id = 'squeaky__magic_erasure_open';
    button.classList.add('squeaky-hide');
    button.innerHTML = `
      <svg width="23" height="32" viewBox="0 0 29 41" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.3862 29.6553L1.35907e-06 40.52L0 0.52002L8.35497 8.84296C6.9927 10.1938 6.14951 12.0637 6.14951 14.1298C6.14951 18.2495 9.50208 21.5892 13.6377 21.5892C15.7117 21.5892 17.5888 20.7493 18.9448 19.3922L29 29.4088L12.3862 29.6553ZM16.8268 17.2823L10.473 10.9528C9.65271 11.7637 9.14478 12.8876 9.14478 14.1298C9.14478 16.6016 11.1563 18.6054 13.6377 18.6054C14.8846 18.6054 16.0128 18.0994 16.8268 17.2823Z" fill="#FBC73B"/>
        <path d="M7.68684 26.9494C7.68684 28.2182 6.65438 29.2467 5.38078 29.2467C4.10717 29.2467 3.07471 28.2182 3.07471 26.9494C3.07471 25.6807 4.10717 24.6522 5.38078 24.6522C6.65438 24.6522 7.68684 25.6807 7.68684 26.9494Z" fill="#FBC73B"/>
        <path d="M6.14941 14.1297C6.14941 12.0636 6.9926 10.1937 8.35487 8.8429L10.4728 10.9527C9.65257 11.7636 9.14468 12.8876 9.14468 14.1297C9.14468 16.6015 11.1562 18.6054 13.6376 18.6054C14.8845 18.6054 16.0127 18.0994 16.8267 17.2823L18.9447 19.3921C17.5887 20.7492 15.7116 21.5891 13.6376 21.5891C9.50198 21.5891 6.14941 18.2494 6.14941 14.1297Z" fill="#001A39"/>
        <path d="M7.68684 26.9494C7.68684 28.2182 6.65438 29.2467 5.38078 29.2467C4.10717 29.2467 3.07471 28.2182 3.07471 26.9494C3.07471 25.6807 4.10717 24.6522 5.38078 24.6522C6.65438 24.6522 7.68684 25.6807 7.68684 26.9494Z" fill="#001A39"/>
      </svg>
    `;
    button.addEventListener('click', this.handleMagicErasureOpen);

    return button;
  }

  private get highlighter(): HTMLDivElement {
    const highligher = document.createElement('div');

    highligher.id = 'squeaky__magic_erasure_highlighter';
    highligher.classList.add('squeaky-hide');
    highligher.style.display = 'none';

    return highligher;
  }

  private setHighlighterDisplay(display: 'block' | 'none') {
    const highlighter = document.getElementById('squeaky__magic_erasure_highlighter');

    if (highlighter) {
      highlighter.style.display = display;
    }
  }

  private get modal(): HTMLDivElement {
    const modal = document.createElement('div');
    
    modal.id = 'squeaky__magic_erasure_modal';
    modal.classList.add('squeaky-hide');

    const drag = document.createElement('button');

    drag.id = 'squeaky__magic_erasure_drag';

    drag.innerHTML = `
      <div class="drag-handle">
        <span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span>
      </div>
    `;

    drag.addEventListener('mousedown', this.handleMagicErasureMouseDown);

    modal.appendChild(drag);
    modal.appendChild(this.iframe);

    return modal;
  }

  private get iframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');

    iframe.id = 'squeaky__magic_erasure_frame';
    iframe.src = `${WEB_HOST}/app/widget/magic-erasure?${this.visitor.params.toString()}`;

    return iframe;
  }

  private handleMagicErasureMouseDown = (event: MouseEvent) => {
    event.preventDefault();

    const element = document.getElementById('squeaky__magic_erasure_modal');

    if (element) {
      this.draggable.offsetX = event.clientX;
      this.draggable.offsetY = event.clientY;
      this.draggable.mousedown = true;

      document.addEventListener('mouseup', this.handleMagicErasueMouseUp);
      document.addEventListener('mousemove', this.handleMagicErasureMouseMove);
    }
  };

  private handleMagicErasueMouseUp = () => {
    this.draggable.mousedown = false;

    document.removeEventListener('mouseup', this.handleMagicErasueMouseUp, true);
    document.removeEventListener('mousemove', this.handleMagicErasureMouseMove, true);
  };

  private handleMagicErasureMouseMove = (event: MouseEvent) => {
    event.preventDefault();

    if (!this.draggable.mousedown) return;
    
    const posX = this.draggable.offsetX - event.clientX;
    const posY = this.draggable.offsetY - event.clientY;

    this.draggable.offsetX = event.clientX;
    this.draggable.offsetY = event.clientY;

    const element = document.getElementById('squeaky__magic_erasure_modal');

    if (element) {
      const x = clamp(element.offsetLeft - posX, 0, window.innerWidth - WIDGET_WIDTH);
      const y = clamp(element.offsetTop - posY, 0, window.innerHeight - WIDGET_HEIGHT);

      element.style.top = `${y}px`;
      element.style.left = `${x}px`;
    }
  };

  private handleMagicErasureOpen = (): void => {
    if (this.open) {
      return this.handleMagicErasureClose();
    }

    this.open = true;
    this.setHighlighterDisplay('block');

    document.body.appendChild(this.modal);
  };

  private handleMagicErasureClose = (): void => {
    this.open = false;

    const modal = document.getElementById('squeaky__magic_erasure_modal');

    this.setHighlighterDisplay('none');
    
    if (modal) modal.remove();
  };

  private handleElementMouseOver = (event: MouseEvent) => {
    if (!this.open) return;

    let element = event.target as Element;
    
    // These things should be ignored, we don't show body in the
    // heatmaps and we don't want them to be able to hide it!
    if (this.shouldIgnoreElement(element)) {
      return;
    }

    // The elements inside the svg always seem to take the focus
    // so use the parent svg if it's one of the children
    if (element.closest('svg')) {
      element = element.closest('svg') || element;
    }

    const { width, height, top, left } = element.getBoundingClientRect();
    const highligter = document.querySelector<HTMLDivElement>('#squeaky__magic_erasure_highlighter');

    if (!highligter) return;

    highligter.style.display = 'block';

    // Position the highlighter on top of the target element.
    // The reason for doing is this way is that we don't have
    // to modify the css of the element on the page, which
    // could potentially break. Also it means we don't need to
    // fight overflow stuff
    highligter.style.cssText = `
      height: ${height}px;
      left: ${left + window.scrollX}px; 
      top: ${top + window.scrollY}px;
      width: ${width}px;
    `;

    const selectorText = `${cssPath(element)} - ${Math.floor(height)} x ${Math.floor(width)}`;
    highligter.setAttribute('data-selector', selectorText);
  };

  private handleElementMouseOut = () => {
    const highligter = document.querySelector<HTMLDivElement>('#squeaky__magic_erasure_highlighter');

    if (!highligter) return;

    // Reset all the styles, this keeps the element but means
    // it is hidden so it doesn't need to be added/removed
    // constantly
    highligter.style.cssText = '';
    highligter.style.display = 'none';
  };

  private handleElementClick = (event: MouseEvent) => {
    const element = event.target as HTMLElement;

    if (!this.open) return;
    if (this.shouldIgnoreElement(element)) return;

    // If the user choses to select an <a> tag, we don't
    // want it going off to that page
    event.preventDefault();
    event.stopPropagation();

    const iframe = document.querySelector<HTMLIFrameElement>('#squeaky__magic_erasure_frame');

    const isHidden = element.getAttribute('data-squeaky-hidden') === 'true';

    if (isHidden) {
      element.removeAttribute('data-squeaky-hidden');
      element.style.opacity = '1';
    } else {
      element.setAttribute('data-squeaky-hidden', 'true');
      element.style.opacity = '.125';
    }

    const message: SqueakyMagicErasureMessage = {
      action: isHidden ? 'delete' : 'create',
      selector: cssPath(element)
    };

    // Post a message to the iframe containing the css
    // selector so that the app can pick it up and post
    // it off to the API and update the UI.
    iframe?.contentWindow?.postMessage(JSON.stringify(message), '*');
  };

  private shouldIgnoreElement(element: Element) {
    // These things should be ignored, we don't show body in the
    // heatmaps and we don't want them to be able to hide it!
    return (
      element.nodeName.toLowerCase() === 'body' ||
      element.nodeName.toLowerCase() === 'html' ||
      element.id?.startsWith('squeaky__') || 
      element.closest('.squeaky-hide')
    );
  }
}
