import { Visitor } from './visitor';
import { Sentiment } from './sentiment';
import { Nps } from './nps';
import { Recording } from './recording';
import { MagicErasure } from './magic-erasure';
import type { Feedback } from './types/feedback';
import type { FeedbackResponse, SiteSessionSettings } from './types/api';
import type { ExternalAttributes } from './types/visitor';
import type { Site } from './types/site';

export class Squeaky {
  public visitor: Visitor;
  public sentiment: Sentiment;
  public nps: Nps;
  public recording: Recording;
  public magicErasure: MagicErasure;

  private timer!: NodeJS.Timer;
  private pathname: string = location.pathname;

  public constructor(siteId: string) {
    this.visitor = new Visitor(siteId);

    this.recording = new Recording(this.visitor);
    this.sentiment = new Sentiment(this.visitor);
    this.nps = new Nps(this.visitor);
    this.magicErasure = new MagicErasure(this.visitor);

    this.initServices();
    this.pollForPageChanges();
  }

  public identify = (id: string, input: ExternalAttributes = {}) => {
    this.visitor.externalAttributes = { id, ...input };
    this.recording.identify(this.visitor);
  };

  private async initServices() {
    try {
      const res = await this.getSettings();
      if (!res.ok) return;

      const { data }: FeedbackResponse = await res.json();

      const siteSessionSettings: SiteSessionSettings = data?.siteSessionSettings || {
        anonymiseFormInputs: true,
        cssSelectorBlacklist: [],
      };

      if (this.recordingEnabled()) this.recording.init(siteSessionSettings);
      if (data.feedback && this.npsEnabled(data.feedback)) this.nps.init(data.feedback);
      if (data.feedback && this.sentimentEnabled(data.feedback)) this.sentiment.init(data.feedback);
      if (this.magicErasureEnabled(data.siteByUuid)) this.magicErasure.init();
    } catch (error) {
      console.error('[Squeaky] Failed to fetch site configuration', error);
    }
  };

  private async getSettings(): Promise<Response> {
    const { siteId } = this.visitor;

    const query = `
      {
        feedback(siteId: \"${siteId}\") {
          npsEnabled
          npsAccentColor
          npsSchedule
          npsPhrase
          npsFollowUpEnabled
          npsContactConsentEnabled
          npsLayout
          npsExcludedPages
          sentimentEnabled
          sentimentAccentColor
          sentimentExcludedPages
          sentimentLayout
          sentimentDevices
        }
        siteByUuid(siteId: \"${siteId}\") {
          magicErasureEnabled
        }
        siteSessionSettings(siteId: \"${siteId}\") {
          cssSelectorBlacklist
          anonymiseFormInputs
        }
      }
    `;

    return fetch(`${API_SERVER_HOST}/graphql`, {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
    });
  };

  private recordingEnabled() {
    return !this.visitor.bot;
  }

  private npsEnabled(feedback: Feedback): boolean {
    return feedback.npsEnabled; 
  }

  private sentimentEnabled(feedback: Feedback): boolean {
    return feedback.sentimentEnabled && feedback.sentimentDevices.includes(this.visitor.deviceType);
  }

  private magicErasureEnabled(site?: Site) {
    return site?.magicErasureEnabled;
  }

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

        // These may be disabled so skip them
        if (this.nps.initialized) this.nps.onPageChange(location);
        if (this.sentiment.initialized) this.sentiment.onPageChange(location);
      }
    });
  }
}
