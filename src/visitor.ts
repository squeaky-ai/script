export interface VisitorObject {
  locale: string;
  device_x: number;
  device_y: number;
  viewport_x: number;
  viewport_y: number;
  referrer: string | null;
  useragent: string;
}

export class Visitor {
  public siteId: string;
  public visitorId: string;
  public sessionId: string;

  public isNewVisitor: boolean;
  public isNewSession: boolean;

  public constructor(siteId: string) {
    const [visitorId, isNewVisitor] = this.getOrCreateId('visitor', localStorage);
    const [sessionId, isNewSession] = this.getOrCreateId('session', sessionStorage);

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
    };
  }

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

  public get referrer(): string | null {
    const referrer = document.referrer;

    // We don't care about referralls from their own site
    if (referrer === '' || referrer.replace('www.', '').startsWith(location.origin.replace('www.', ''))) {
      return null;
    }

    return referrer.replace(/\/$/, '');
  };

  private getOrCreateId(type: 'session' | 'visitor', storage: Storage): [string, boolean] {
    let id = storage.getItem(`squeaky_${type}_id`);

    if (id) {
      return [id, false];
    }

    id = Math.random().toString(36).slice(2);
    storage.setItem(`squeaky_${type}_id`, id);
    return [id, true];
  }
}
