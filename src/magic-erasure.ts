type Draggable = {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  mousedown: boolean;
}

export class MagicErasure {
  private draggable: Draggable = {
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    mousedown: false,
  };

  public init = () => {
    this.inject();
  };

  private inject = () => {
    if (!document.body.contains(this.widget)) {
      document.body.appendChild(this.widget);
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

  private get modal(): HTMLDivElement {
    const modal = document.createElement('div');
    
    modal.id = 'squeaky__magic_erasure_modal';

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
    iframe.src = `${WEB_HOST}/app/widget/magic-erasure`;

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
      element.style.top = `${element.offsetTop - posY}px`;
      element.style.left = `${element.offsetLeft - posX}px`;
    }
  };

  private handleMagicErasureOpen = (): void => {
    if (document.getElementById('squeaky__magic_erasure_modal')) {
      return this.handleMagicErasureClose();
    }

    document.body.appendChild(this.modal);
  };

  private handleMagicErasureClose = (): void => {
    const modal = document.getElementById('squeaky__magic_erasure_modal');
    
    if (modal) modal.remove();
  };
}
