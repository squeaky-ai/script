import { Visitor } from './visitor';
import { Sentiment } from './sentiment';
import { Nps } from './nps';
import { Recording } from './recording';
import type { Feedback } from '../types/feedback';
import type { ExternalAttributes } from '../types/visitor';

export class Squeaky {
  public visitor: Visitor;
  public sentiment: Sentiment;
  public nps: Nps;
  public recording: Recording;

  private timer!: NodeJS.Timer;
  private pathname: string = location.pathname;

  public constructor(siteId: string) {
    this.visitor = new Visitor(siteId);

    this.recording = new Recording(this.visitor);
    this.sentiment = new Sentiment(this.visitor);
    this.nps = new Nps(this.visitor);

    this.getFeedbackSettings();
    this.pollForPageChanges();
  }

  public identify = (id: string, input: ExternalAttributes = {}) => {
    this.visitor.externalAttributes = { id, ...input };
    this.recording.identify(this.visitor);
  };

  private async getFeedbackSettings() {
    try {
      const res = await fetch(`${API_SERVER_HOST}/feedback?${this.visitor.params.toString()}`);
  
      if (!res.ok) return;

      const data: Feedback = await res.json();

      if (data.nps_enabled) this.nps.init(data);
      if (data.sentiment_enabled) this.sentiment.init(data);
    } catch (error) {
      console.error(error);
    }
  };

  private poll(callback: Function, interval = 500): void {
    window.clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      callback();
      this.poll(callback, interval);
    }, interval);
  }

  private pollForPageChanges(): void {
    this.poll(() => {
      console.log(location.pathname, this.pathname);
      if (location.pathname !== this.pathname) {
        this.pathname = location.pathname;
        console.log('Page changed to ', this.pathname);

        this.recording.onPageChange(location);
        this.sentiment.onPageChange(location);
      }
    });
  }
}
