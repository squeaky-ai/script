import { Visitor } from 'models/visitor';
import { Sentiment } from 'services/sentiment';
import { Nps } from 'services/nps';
import { Recording } from 'services/recording';
import { MagicErasure } from 'services/magic-erasure';
import { Consent } from 'services/consent';
import { Api } from './api';
import { Logger } from 'utils/logger';
import type { Feedback } from 'types/feedback';
import type { ExternalAttributes } from 'types/visitor';
import type { SiteSessionSettings } from 'types/api';

export class Squeaky {
  public visitor: Visitor;
  public sentiment: Sentiment;
  public nps: Nps;
  public recording: Recording;
  public magicErasure: MagicErasure;
  public consent: Consent;

  private timer!: ReturnType<typeof setTimeout>;
  private pathname: string = location.pathname;

  public __initAllServices?: VoidFunction;
  public debugLoggingEnabled: boolean = false;

  public constructor(siteId: string) {
    this.visitor = new Visitor(siteId);

    this.recording = new Recording(this.visitor);
    this.sentiment = new Sentiment(this.visitor);
    this.nps = new Nps(this.visitor);
    this.magicErasure = new MagicErasure(this.visitor);
    this.consent = new Consent(this.visitor);

    // Exit as early as possible
    if (this.visitor.consent === false) return;

    this.initServices();
    this.pollForPageChanges();
  }

  public identify = (id: string, input: ExternalAttributes = {}) => {
    if (!id) return;
    this.visitor.externalAttributes = { id, ...input };
    this.recording.identify(this.visitor);
  };

  public addEvent = (name: string, input: ExternalAttributes = {}) => {
    if (!name) return;
    this.recording.addEvent({ name, ...input });
  }

  public addPageView = () => {
    this.recording.onPageChange(location);
  };

  public showNpsSurvey = () => {
    if (!this.nps.initialized) return;
    this.nps.customNpsTrigger();
  };

  public showSentimentSurvey = () => {
    if (!this.sentiment.initialized) return;
    this.sentiment.customSentimentTrigger();
  };

  public acceptConsent = () => {
    this.consent.acceptConsent();
  };

  public rejectConsent = () => {
    this.consent.rejectConsent();
  };

  private async initServices() {
    try {
      const data = await (new Api(this.visitor)).getSessionConfig();

      // This check also happens on the backend but it saves us a request
      if (!this.shouldInitServices(data.siteSessionSettings)) return;

      // Store this function in the scope so it can be called at
      // a later date once the visitor has given consent
      this.__initAllServices = () => {
        if (this.recordingEnabled()) this.recording.init(data.siteSessionSettings);
        if (data.siteSessionSettings.magicErasureEnabled) this.magicErasure.init();
        if (data.siteSessionSettings.feedback && this.npsEnabled(data.siteSessionSettings.feedback)) this.nps.init(data.siteSessionSettings.feedback);
        if (data.siteSessionSettings.feedback && this.sentimentEnabled(data.siteSessionSettings.feedback)) this.sentiment.init(data.siteSessionSettings.feedback);
      };

      // If the visitor has previously consented, or gaining consent is
      // disabled then init everything immediately
      if (this.visitor.consent || data.siteSessionSettings.consent.consentMethod === 'disabled') {
        return this.__initAllServices();
      }

      // They've opened to use our widget to gain consent, so init that
      // service
      if (data.siteSessionSettings.consent.consentMethod === 'widget') {
        return this.consent.init(data.siteSessionSettings.consent);
      }
    } catch (error) {
      Logger.error('Failed to fetch site configuration', error);
    }
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

  private shouldInitServices(settings: SiteSessionSettings): boolean {
    return (
      settings.ingestEnabled && 
      !settings.invalidOrExceededPlan &&
      settings.url.replace('www.', '') === location.origin.replace('www.', '')
    );
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
