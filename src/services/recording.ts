import { record, EventType } from 'rrweb';
import { eventWithTime } from 'rrweb/typings/types';
import { getRrwebConfig } from 'config';
import { cssPath, getNodeInnerText, getCoordinatesOfNode } from 'utils/css-path';
import { Visitor } from 'models/visitor';
import { isClickEvent, isPageViewEvent, isMouseMoveEvent, isUserInteractionEvent, isScrollEvent } from 'utils/events';
import type { SiteSessionSettings } from 'types/api';
import type { ExternalAttributes } from 'types/visitor';

const MAX_RETRIES = 5;

export class Recording {
  private socket!: WebSocket;
  private recording: boolean = false;
  private terminated: boolean = false;
  private cutOffTimer?: NodeJS.Timer;
  private visitor: Visitor;
  private retries: number = 0;
  private sessionSettings!: SiteSessionSettings;
  private stop?: VoidFunction;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public identify = (visitor: Visitor) => {
    this.visitor = visitor;
  };

  public addEvent = (event: ExternalAttributes) => {
    this.send('custom', { 
      type: EventType.Custom,
      data: {
        ...event, 
        href: location.pathname,
      },
      timestamp: new Date().valueOf(),
    });
  }

  public onPageChange = (location: Location): void => {
    this.setPageView(location.href);
  };

  public init = (sessionSettings: SiteSessionSettings) => {
    this.sessionSettings = sessionSettings;
    this.socket = new WebSocket(`${WEBSOCKET_SERVER_HOST}/in?${this.visitor.params.toString()}`);

    this.socket.addEventListener('open', () => {
      this.install();
      this.setCutOff();
    });

    this.socket.addEventListener('close', () => {
      if (this.retries < MAX_RETRIES) {
        setTimeout(() => {
          this.retries++;
          this.init(sessionSettings);
        }, this.retries * 100);
      }
    });

    window.addEventListener('error', this.handleError);
  };

  private send<T>(key: string, value: T) {
    const payload = JSON.stringify({ key, value });
    if (this.socket?.readyState === 1 && this.recording) this.socket.send(payload);
  }

  private install = () => {
    // There's no point in starting the recording if the user is
    // not looking at the page. They might have opened a bunch of
    // tabs in the background, and we're going to have a session
    // with a bunch of dead time at the start
    if (document.hasFocus()) {
      this.startRecording();
    }

    // If the user blurs the page we should stop the recording as
    // for pages with animations, we'll be collecting thousands of
    // events
    window.addEventListener('blur', () => {
      if (this.recording && !this.terminated) {
        this.stopRecording();
      }
    });

    // If the user does eventually come to the page after being
    // away during the initial load, then we should start the
    // recording only if it hasn't already started
    window.addEventListener('focus', () => {
      if (!this.recording && !this.terminated) {
        this.startRecording();
      }
    });
  };

  private startRecording = (): void => {
    this.recording = true;

    const config = getRrwebConfig(this.sessionSettings);

    this.stop = record({ ...config, emit: this.onEmit });
  
    this.send('recording', {
      type: EventType.Custom,
      data: this.visitor.toObject(),
      timestamp: new Date().valueOf(),
    });
  };

  private stopRecording = (): void => {
    this.recording = false;

    try {
      this.stop?.();
    } catch(error) {
      console.error('[Squeaky] Failed to stop recording', error);
    }
  };

  private onEmit = (event: eventWithTime) => {
    if (isClickEvent(event)) {
      // This is cheaper to do here, and means that we can know about
      // all clicked elements without having to rebuild the entire page
      const node = record.mirror.getNode(event.data.id);
      const selector = cssPath(node) || 'html > body';

      event.data.selector = selector;
      // This is done purely so that we can read clicks easilly later
      // as the page is important
      event.data.href = location.pathname;
      // This is to allow us to add events based on text content as there
      // is no other way to associate the click with it's context
      event.data.text = getNodeInnerText(node);
      // This is to allow us to do accurate heatmaps as we can use the
      // selector and the relative position to accurately place the blob
      // even when the screen size is different
      const [x, y] = getCoordinatesOfNode(selector);
      event.data.relativeToElementX = Number(event.data.x - x);
      event.data.relativeToElementY = Number(event.data.y - y);
    }

    if (isPageViewEvent(event)) {
      this.setPageView(event.data.href);
    }

    if (isScrollEvent(event)) {
      event.data.href = location.pathname;
    }

    if (isMouseMoveEvent(event)) {
      event.data.href = location.pathname;
      event.data.positions = event.data.positions.map(p => ({ 
        ...p,
        absoluteX: p.x + window.scrollX,
        absoluteY: p.y + window.scrollY 
      }));
    }

    if (isUserInteractionEvent(event)) {
      this.setCutOff();
      // This belongs here because we don't want animations and other
      // continuous page updates stamping the recordings
      this.visitor.setLastEventAt();
    }

    if (this.visitor.externalAttributes) {
      this.setExternalAttributes();
    }

    this.send('event', event);
  };

  private setPageView = (href: string): void => {
    this.send('pageview', {
      type: EventType.Custom,
      data: { href },
      timestamp: new Date().valueOf(),
    });
  };

  private setExternalAttributes = (): void => {
    if (!this.visitor.externalAttributes) return;

    this.send('identify', {
      type: EventType.Custom,
      data: this.visitor.externalAttributes,
      timestamp: new Date().valueOf(),
    });

    delete this.visitor.externalAttributes;
  };

  private terminateSession = () => {
    this.send('inactivity', {
      type: EventType.Custom,
      data: {},
      timestamp: new Date().valueOf(),
    });

    this.socket.close();
    this.terminated = true;

    if (this.stopRecording) this.stopRecording();

    // If you don't delete the session then it will keep
    // adding to the old one when they return
    this.visitor.deleteSessionId();
    (window as any).squeaky = null;
  };

  private setCutOff = () => {
    // If a user does absolutely nothing for 30 minutes
    // then we need to cut them off
    window.clearTimeout(this.cutOffTimer!);
    
    this.cutOffTimer = setTimeout(() => {
      this.terminateSession();
    }, SESSION_CUT_OFF_MS);
  };

  private handleError = (error: ErrorEvent) => {
    this.send('error', {
      type: EventType.Custom,
      data: {
        line_number: error.lineno,
        col_number: error.colno,
        message: error.message,
        stack: error.error.stack,
        filename: error.filename,
        href: location.pathname,
      },
      timestamp: new Date().valueOf(),
    });
  };
}
