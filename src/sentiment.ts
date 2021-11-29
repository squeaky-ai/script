import type { Feedback } from './types/feedback';

const SENTIMENT_CSS_URL = 'https://cdn.squeaky.ai/g/assets/sentiment.css';
const SMILY_FACE_IMAGE_URL = 'https://cdn.squeaky.ai/g/assets/smiley-face.svg';

export class Sentiment {
  private settings: Feedback;

  public constructor(settings: Feedback) {
    this.settings = settings;

    if (this.settings.sentiment_enabled) {
      this.injectWidget();
    }
  }

  private injectWidget() {
    document.head.appendChild(this.stylesehet);
    document.body.appendChild(this.widget);
  }

  private get widget(): HTMLButtonElement {
    const element = document.createElement('button');

    element.id = 'squeaky__sentiment_open';
    element.classList.add(this.settings.sentiment_layout);
    element.innerHTML = `<img src='${SMILY_FACE_IMAGE_URL}' height='20' width='20' alt='Smiley face' /> Feedback`;

    return element;
  }

  private get stylesehet() {
    const element = document.createElement('link');

    element.rel = 'stylesheet';
    element.type = 'text/css';
    element.href = SENTIMENT_CSS_URL;

    return element;
  }
}
