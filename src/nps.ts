import { parseMessage } from './utils/messages';
import type { Visitor } from './visitor';
import type { Feedback } from './types/feedback';

export class Nps {
  private visitor: Visitor;
  private settings!: Feedback;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public init = (settings: Feedback) => {
    this.settings = settings;

    if (!this.shouldShowVisitor) return;

    document.body.appendChild(this.widget);

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
        this.handleStepChange(message.value.step);
      }
    });
  };

  private get widget(): HTMLDivElement {
    const div = document.createElement('div');

    div.id = 'squeaky__nps_form';
    div.classList.add(this.settings.npsLayout, 'squeaky-hide');

    const wrapper = document.createElement('div');

    wrapper.classList.add('squeaky__nps_wrapper');

    wrapper.appendChild(this.closeButton);
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
        <path fill='#ffffff' d='M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z'  />
      </svg>
    `;
    button.style.background = this.settings.npsAccentColor;
    button.addEventListener('click', this.handleNpsClose);

    return button;
  }

  private get iframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');

    iframe.id = 'squeaky__nps_frame';
    iframe.src = `${WEB_HOST}/feedback/nps?${this.visitor.params.toString()}`;
    iframe.scrolling = 'no';

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

    // Work out if it's been a month since they last
    // submitted feedback
    now.setMonth(now.getMonth() - 1);
    return new Date(date) > now;
  }

  private handleNpsClose = () => {
    const form = document.getElementById('squeaky__nps_form');

    if (form) form.remove();

    this.handleNpsSubmit();
  };

  private handleNpsSubmit = () => {
    const now = new Date();
    localStorage.setItem('squeaky_nps_last_submitted_at', now.toISOString());
  };

  private handleStepChange = (step: number) => {
    const form = document.getElementById('squeaky__nps_form');

    if (!form) return;

    form.classList.forEach(c => { if (c.startsWith('step-')) form.classList.remove(c) });
    form.classList.add(`step-${step}`);
  };
}
