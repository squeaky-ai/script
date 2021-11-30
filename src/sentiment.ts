
import type { Visitor } from './visitor';
import type { Feedback } from './types/feedback';

const SENTIMENT_CSS_URL = 'https://cdn.squeaky.ai/g/assets/sentiment.css';
const SMILY_FACE_IMAGE_URL = 'https://cdn.squeaky.ai/g/assets/smiley-face.svg';

export class Sentiment {
  private visitor: Visitor;
  private settings!: Feedback;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
    this.visitor; // TODO
  }

  public init = (settings: Feedback) => {
    this.settings = settings;

    document.head.appendChild(this.stylesheet);
    document.body.appendChild(this.widget);
  };

  private get widget(): HTMLButtonElement {
    const button = document.createElement('button');

    button.id = 'squeaky__sentiment_open';
    button.classList.add(this.settings.sentiment_layout);
    button.style.background = this.settings.sentiment_accent_color;
    button.innerHTML = `<img src='${SMILY_FACE_IMAGE_URL}' height='20' width='20' alt='Smiley face' /> Feedback`;
    button.addEventListener('click', this.handleSentimentOpen);

    return button;
  }

  private get stylesheet(): HTMLLinkElement {
    const stylesheet = document.createElement('link');

    stylesheet.rel = 'stylesheet';
    stylesheet.type = 'text/css';
    stylesheet.href = SENTIMENT_CSS_URL;

    return stylesheet;
  }

  private handleSentimentOpen = (event: MouseEvent): void => {
    const target = event.target as HTMLButtonElement;

    if (target.classList.contains('open')) {
      return this.handleSentimentClose();
    }

    const modal = document.createElement('div');
    
    modal.id = 'squeaky__sentiment_modal';
    modal.classList.add(this.settings.sentiment_layout);

    const button = document.createElement('button');

    button.id = 'squeaky__sentiment_close';
    button.innerText = 'x';
    button.style.background = this.settings.sentiment_accent_color;
    button.addEventListener('click', this.handleSentimentClose);

    modal.appendChild(button);

    target.classList.add('open');

    document.body.appendChild(modal);
  };

  private handleSentimentClose = () => {
    const modal = document.getElementById('squeaky__sentiment_modal');
    
    if (modal) modal.remove();

    const button = document.getElementById('squeaky__sentiment_open');

    if (button) button.classList.remove('open');
  };
}
