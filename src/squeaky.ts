import { Visitor } from './visitor';
import { Sentiment } from './sentiment';
import { Nps } from './nps';
import { Recording } from './recording';
import type { FeedbackResponse } from './types/feedback';
import type { ExternalAttributes } from './types/visitor';

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
      const query = `
        {
          feedback(siteId: \"${this.visitor.siteId}\") {
            npsEnabled
            npsAccentColor
            npsSchedule
            npsPhrase
            npsFollowUpEnabled
            npsContactConsentEnabled
            npsLayout
            sentimentEnabled
            sentimentAccentColor
            sentimentExcludedPages
            sentimentLayout
          }
        }
      `;

      const res = await fetch(`${API_SERVER_HOST}/graphql`, {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: {
          'content-type': 'application/json'
        }
      });
  
      if (!res.ok) return;

      const { data }: FeedbackResponse = await res.json();

      if (data.feedback.npsEnabled) this.nps.init(data.feedback);
      if (data.feedback.sentimentEnabled) this.sentiment.init(data.feedback);
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
      if (location.pathname !== this.pathname) {
        this.pathname = location.pathname;

        this.recording.onPageChange(location);
        this.sentiment.onPageChange(location);
      }
    });
  }
}
