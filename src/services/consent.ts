import { parseMessage } from 'utils/messages';
import type { Visitor } from 'models/visitor';
import type { ConsentConfig } from 'types/consent';

export class Consent {
  private visitor: Visitor;
  private settings!: ConsentConfig;
  public initialized: boolean = false;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public init = (settings: ConsentConfig) => {
    this.settings = settings;
    
    this.initialized = true;

    this.inject();

    // Listen for the close message so that the iframe
    // can close the parent
    window.addEventListener('message', (event: MessageEvent) => {
      const message = parseMessage(event.data);

      if (message.key === '__squeaky_accept_consent') {
        this.acceptConsent();
      }

      if (message.key === '__squeaky_reject_consent') {
        this.rejectConsent();
      }

      if (message.key === '__squeaky_set_height_consent') {
        this.handleSetHeight(message.value.height);
      }
    });
  };

  public acceptConsent = () => {
    localStorage.setItem('squeaky_consent', 'true');
    window.squeaky.__initAllServices?.();
    this.destroy();
  };

  public rejectConsent = () => {
    localStorage.setItem('squeaky_consent', 'false');
    this.destroy();
  };

  private inject = () => {
    if (!document.body.contains(this.widget)) {
      document.body.appendChild(this.widget);
    }
  };

  private destroy = () => {
    document.getElementById('squeaky__consent_form')?.remove();
  };

  private get widget(): HTMLDivElement {
    const div = document.createElement('div');

    div.id = 'squeaky__consent_form';
    div.classList.add(this.settings.layout, 'squeaky-hide');

    div.appendChild(this.spinner);
    div.appendChild(this.iframe);

    return div;
  }

  private get spinner(): HTMLDivElement {
    const spinner = document.createElement('div');

    spinner.id = 'spinner';
    spinner.innerHTML = `
      <div class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path fill="#0074E0" d="M18.364 5.636L16.95 7.05A7 7 0 1 0 19 12h2a9 9 0 1 1-2.636-6.364z"/>
        </svg>
      </div>
    `;

    return spinner;
  }

  private get iframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');

    iframe.id = 'squeaky__consent_frame';
    iframe.src = `${WEB_HOST}/feedback/consent?${this.visitor.params.toString()}`;
    iframe.scrolling = 'no';

    iframe.onload = () => {
      const spinner = document.getElementById('spinner');
      if (spinner) spinner.remove();
    };

    return iframe;
  }

  private handleSetHeight = (height: number) => {
    const form = document.getElementById('squeaky__consent_form');

    if (!form) return;

    form.style.height = `${height}px`;
  };
}
