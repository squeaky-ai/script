import { parseMessage } from 'utils/messages';
import type { Visitor } from 'models/visitor';
import type { Feedback } from 'types/feedback';

export class Nps {
  private visitor: Visitor;
  private settings!: Feedback;
  public initialized: boolean = false;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public init = (settings: Feedback) => {
    this.settings = settings;

    if (!this.shouldShowVisitor) return;

    this.initialized = true;

    // If the schedule type is custom then we do not inject 
    // until the user triggers it themselves
    if (!this.excludedPages.includes(location.pathname) && this.settings.npsSchedule !== 'custom') {
      this.inject();
    }

    // Listen for the close message so that the iframe
    // can close the parent
    window.addEventListener('message', (event: MessageEvent) => {
      const message = parseMessage(event.data);

      if (message.key === '__squeaky_close_nps') {
        this.handleNpsClose();
      }

      if (message.key === '__squeaky_submit_nps') {
        this.handleNpsSubmit();
      }

      if (message.key === '__squeaky_set_step_nps') {
        this.handleStepChange(message.value.step, message.value.height);
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

  public customNpsTrigger = () => {
    if (this.initialized && this.settings.npsSchedule === 'custom') {
      this.inject();
    }
  };

  private inject = () => {
    if (!document.body.contains(this.widget)) {
      document.body.appendChild(this.widget);
    }
  };

  private destroy = () => {
    document.getElementById('squeaky__nps_form')?.remove();
  };

  private get excludedPages() {
    return this.settings?.npsExcludedPages || [];
  }

  private get widget(): HTMLDivElement {
    const div = document.createElement('div');

    div.id = 'squeaky__nps_form';
    div.classList.add(this.settings.npsLayout, 'squeaky-hide');

    const wrapper = document.createElement('div');

    wrapper.classList.add('squeaky__nps_wrapper');

    wrapper.appendChild(this.closeButton);
    wrapper.appendChild(this.spinner);
    wrapper.appendChild(this.iframe);
    div.appendChild(wrapper);

    return div;
  }

  private get closeButton(): HTMLButtonElement {
    const button = document.createElement('button');

    button.id = 'squeaky__nps_close';
    button.innerHTML = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16'>
        <path fill='none' d='M0 0h24v24H0z' />
        <path fill='#ffffff' d='M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z' />
      </svg>
    `;
    button.style.background = this.settings.npsAccentColor;
    button.addEventListener('click', this.handleNpsClose);

    return button;
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

    iframe.id = 'squeaky__nps_frame';
    iframe.src = `${WEB_HOST}/feedback/nps/?${this.visitor.params.toString()}`;
    iframe.scrolling = 'no';

    iframe.onload = () => {
      const spinner = document.getElementById('spinner');
      if (spinner) spinner.remove();
    };

    return iframe;
  }

  private get shouldShowVisitor(): boolean {
    const now = new Date();
    const date = localStorage.getItem('squeaky_nps_last_submitted_at');

    if (!date) {
      // They've never submitted feedback
      return true;
    }

    if (this.settings.npsSchedule === 'once') {
      // They've submitted feedback before and the
      // schedule is to only show once
      return false;
    }

    if (this.settings.npsSchedule === 'custom') {
      // Entirely up to them when they show it
      return true;
    }

    // Work out if it's been a month since they last
    // submitted feedback
    now.setMonth(now.getMonth() - 1);
    return new Date(date) > now;
  }

  private handleNpsClose = () => {
    this.destroy();
    this.handleNpsSubmit();
  };

  private handleNpsSubmit = () => {
    const now = new Date();
    localStorage.setItem('squeaky_nps_last_submitted_at', now.toISOString());
  };

  private handleStepChange = (step: number, height: number) => {
    const form = document.getElementById('squeaky__nps_form');

    if (!form) return;

    form.style.height = `${height}px`;

    form.classList.forEach(c => { if (c.startsWith('step-')) form.classList.remove(c) });
    form.classList.add(`step-${step}`);
  };
}
