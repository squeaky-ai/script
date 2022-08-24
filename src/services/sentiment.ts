import { parseMessage } from 'utils/messages';
import type { Visitor } from 'models/visitor';
import type { Feedback } from 'types/feedback';

export class Sentiment {
  private visitor: Visitor;
  private settings!: Feedback;
  public initialized: boolean = false;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public init = (settings: Feedback) => {
    this.settings = settings;
    this.initialized = true;

    if (!this.excludedPages.includes(location.pathname) && this.settings.sentimentSchedule !== 'custom') {
      this.inject();
    }

    // Listen for the close message so that the iframe
    // can close the parent
    window.addEventListener('message', (event: MessageEvent) => {
      const message = parseMessage(event.data);

      if (message.key === '__squeaky_close_sentiment') {
        this.handleSentimentClose();
      }
    });
  };

  public onPageChange = (location: Location): void => {
    if (!this.excludedPages.includes(location.pathname)) {
      this.inject();
    } else {
      this.destroy();
    }
  };

  public customSentimentTrigger = () => {
    if (this.initialized && this.settings.sentimentSchedule === 'custom') {
      this.inject();
    }
  };

  private inject = () => {
    if (!document.body.contains(this.widget)) {
      document.body.appendChild(this.widget);
    }
  };

  private destroy = () => {
    document.getElementById('squeaky__sentiment_open')?.remove();
  };

  private get excludedPages() {
    return this.settings?.sentimentExcludedPages || [];
  }

  private get widget(): HTMLButtonElement {
    const button = document.createElement('button');

    button.id = 'squeaky__sentiment_open';
    button.classList.add(this.settings.sentimentLayout, 'squeaky-hide');
    button.style.background = this.settings.sentimentAccentColor;
    button.innerHTML = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20'>
        <path d='M12 22a10 10 0 1 1 0-20 10 10 0 1 1 0 20zm-5-9a5 5 0 0 0 5 5 5 5 0 0 0 5-5h-2a3 3 0 0 1-3 3 3 3 0 0 1-3-3H7zm1-2a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 8 8a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 8 11zm8 0a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 16 8a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 16 11z' fill='#fff' opacity='.65' />
      </svg>
      Feedback
    `;
    button.addEventListener('click', this.handleSentimentOpen);

    return button;
  }

  private get modal(): HTMLDivElement {
    const modal = document.createElement('div');
    
    modal.id = 'squeaky__sentiment_modal';
    modal.classList.add(this.settings.sentimentLayout);

    return modal;
  }

  private get iframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');

    iframe.id = 'squeaky__sentiment_frame';
    iframe.src = `${WEB_HOST}/feedback/sentiment?${this.visitor.params.toString()}`;
    iframe.scrolling = 'no';

    return iframe;
  }

  private get closeButton(): HTMLButtonElement {
    const button = document.createElement('button');

    button.id = 'squeaky__sentiment_close';
    button.innerHTML = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16'>
        <path fill='none' d='M0 0h24v24H0z' />
        <path fill='#ffffff' d='M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z'  />
      </svg>
    `;
    button.style.background = this.settings.sentimentAccentColor;
    button.addEventListener('click', this.handleSentimentClose);

    return button;
  }

  private handleSentimentOpen = (event: MouseEvent): void => {
    const target = event.target as HTMLButtonElement;

    if (target.classList.contains('open')) {
      return this.handleSentimentClose();
    }

    const modal = this.modal;

    modal.appendChild(this.closeButton);
    modal.appendChild(this.iframe);

    target.classList.add('open');

    document.body.appendChild(modal);
  };

  private handleSentimentClose = (): void => {
    const modal = document.getElementById('squeaky__sentiment_modal');
    
    if (modal) modal.remove();

    const button = document.getElementById('squeaky__sentiment_open');

    if (button) button.classList.remove('open');
  };
}
