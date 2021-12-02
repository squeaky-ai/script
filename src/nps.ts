
import type { Visitor } from './visitor';
import type { Feedback } from './types/feedback';

const SENTIMENT_FORM_CSS_URL = 'https://cdn.squeaky.ai/g/assets/nps-form.css';

export class Nps {
  private visitor: Visitor;
  private settings!: Feedback;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public init = (settings: Feedback) => {
    this.settings = settings;

    document.head.appendChild(this.stylesheet);
    document.body.appendChild(this.widget);

    this.visitor;
    this.settings;
  };

  private get stylesheet(): HTMLLinkElement {
    const stylesheet = document.createElement('link');

    stylesheet.rel = 'stylesheet';
    stylesheet.type = 'text/css';
    stylesheet.href = SENTIMENT_FORM_CSS_URL;

    return stylesheet;
  }

  private get widget(): HTMLDivElement {
    const div = document.createElement('div');

    div.id = 'squeaky__nps_form';
    div.classList.add(this.settings.nps_layout);

    const wrapper = document.createElement('div');

    wrapper.classList.add('squeaky__nps_wrapper');

    wrapper.appendChild(this.closeButton);
    div.appendChild(wrapper);

    return div;
  }

  private get closeButton(): HTMLButtonElement {
    const button = document.createElement('button');

    button.id = 'squeaky__nps_close';
    button.innerHTML = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16'>
        <path fill='none' d='M0 0h24v24H0z' />
        <path fill='#ffffff' d='M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z'  />
      </svg>
    `;
    button.style.background = this.settings.nps_accent_color;
    button.addEventListener('click', this.handleNpsClose);

    return button;
  }

  private handleNpsClose = () => {
    const form = document.getElementById('squeaky__nps_form');

    if (form) form.remove();
  };
}
