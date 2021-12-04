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

  public constructor(siteId: string) {
    this.visitor = new Visitor(siteId);

    this.recording = new Recording(this.visitor);
    this.sentiment = new Sentiment(this.visitor);
    this.nps = new Nps(this.visitor);

    this.getFeedbackSettings();
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
}