import type { VisitorObject, ExternalAttributes, Device } from './types/visitor';

export class Visitor {
  public key: string;
  public siteId: string;
  public visitorId: string;
  public sessionId: string;
  public externalAttributes?: ExternalAttributes;

  public isNewVisitor: boolean;
  public isNewSession: boolean;

  public constructor(siteId: string) {
    const [visitorId, isNewVisitor] = this.getOrCreateId('visitor', localStorage);
    const [sessionId, isNewSession] = this.getOrCreateId('session', sessionStorage);

    this.key = `${siteId}::${visitorId}::${sessionId}`;

    this.siteId = siteId;
    this.visitorId = visitorId;
    this.sessionId = sessionId;
    this.isNewVisitor = isNewVisitor;
    this.isNewSession = isNewSession;
  }

  public get params(): URLSearchParams {
    return new URLSearchParams({
      site_id: this.siteId,
      visitor_id: this.visitorId,
      session_id: this.sessionId,
    });
  }

  public toObject(): VisitorObject {
    return {
      locale: this.language,
      device_x: this.deviceX,
      device_y: this.deviceY,
      viewport_x: this.viewportX,
      viewport_y: this.viewportX,
      referrer: this.referrer,
      useragent: this.useragent,
      timezone: this.timezone,
      utm_campaign: this.utmCampaign,
      utm_content: this.utmContent,
      utm_medium: this.utmMedium,
      utm_source: this.utmSource,
      utm_term: this.utmTerm,
    };
  }

  public deleteSessionId = () => {
    sessionStorage.removeItem('squeaky_session_id');
  };

  public get deviceX(): number {
    return screen.width;
  }

  public get deviceY(): number {
    return screen.height;
  }

  public get viewportX(): number {
    return window.innerWidth;
  }

  public get viewportY(): number {
    return window.innerHeight;
  }

  public get language(): string {
    return navigator.language || (navigator as any).userLanguage || 'zz-ZZ';
  }

  public get bot(): boolean {
    return navigator.webdriver || /bot|crawler|spider|crawling/i.test(this.useragent);
  }

  public get useragent(): string {
    return navigator.userAgent;
  }

  public get timezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  public get referrer(): string | null {
    const referrer = document.referrer;

    // We don't care about referrals from their own site
    if (referrer === '' || referrer.replace('www.', '').startsWith(location.origin.replace('www.', ''))) {
      return null;
    }

    return referrer.replace(/\/$/, '');
  };

  public get lastEventAt(): number | null {
    const timestamp = localStorage.getItem('squeaky_last_event_at');

    if (timestamp) {
      return Number(timestamp);
    }

    return null;
  }

  public get utmSource(): string | null {
    return this.utmParameters.utm_source || null;
  }

  public get utmMedium(): string | null {
    return this.utmParameters.utm_medium || null;
  }

  public get utmCampaign(): string | null {
    return this.utmParameters.utm_campaign || null;
  }

  public get utmContent(): string | null {
    return this.utmParameters.utm_content || null;
  }

  public get utmTerm(): string | null {
    return this.utmParameters.utm_term || null;
  }

  public get deviceType(): Device {
    if (window.innerWidth < 800) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    
    return 'desktop';
  }

  public setLastEventAt = (): void => {
    localStorage.setItem('squeaky_last_event_at', new Date().valueOf().toString());
  };

  private get utmParameters(): Record<string, string> {
    const parameters: Record<string, string> = {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

    const params = new URLSearchParams(location.search);

    params.forEach((value, key) => {
      if (utmKeys.includes(key)) {
        parameters[key] = value;
      }
    });

    return parameters;
  }

  // A user can leave part of the site we are recording, but
  // stay on the same domain, in the same session. For example
  // a user may sign up on squeaky.ai, and be redirected to
  // squeaky.ai/app where we don't record. This means that the
  // session_id is still the same, but there will be a huge
  // time where they are off site. This causes hours inbetween events
  // that all count as the same session and ruin the average time
  // on site stats.
  private get shouldStartNewSession(): boolean {
    const now = new Date().valueOf();

    if (this.lastEventAt === null) {
      return false;
    }

    return (now - this.lastEventAt) > SESSION_CUT_OFF_MS;
  }

  private getOrCreateId(type: 'session' | 'visitor', storage: Storage): [string, boolean] {
    let id = storage.getItem(`squeaky_${type}_id`);

    if (type === 'session' && this.shouldStartNewSession) {
      id = null;
    }

    if (id) {
      return [id, false];
    }

    id = Math.random().toString(36).slice(2);
    storage.setItem(`squeaky_${type}_id`, id);
    return [id, true];
  }
}
