import { record, EventType, IncrementalSource } from 'rrweb';
import { eventWithTime } from 'rrweb/typings/types';
import { getRrwebConfig } from './config';
import { cssPath } from './utils/css-path';
import { throttle } from './utils/helpers';
import { Visitor } from './visitor';
import type { SiteSessionSettings } from './types/api';

const MAX_RETRIES = 5;
const ATTRIBUTE_MUTATION_THROTTLE_MS = 5;

export class Recording {
  private socket!: WebSocket;
  private recording: boolean = false;
  private terminated: boolean = false;
  private cutOffTimer?: NodeJS.Timer;
  private visitor: Visitor;
  private retries: number = 0;
  private sessionSettings: SiteSessionSettings = {
    anonymiseFormInputs: true,
    cssSelectorBlacklist: [],
  }
  private stop?: VoidFunction;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public identify = (visitor: Visitor) => {
    this.visitor = visitor;
  };

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
    if (this.socket.OPEN && this.recording) this.socket.send(payload);
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

    this.stop?.();
  };

  private onEmit = (event: eventWithTime) => {
    if (
      event.type === EventType.IncrementalSnapshot && 
      event.data.source === IncrementalSource.Mutation &&
      event.data.adds.length === 0 &&
      event.data.removes.length === 0 &&
      event.data.texts.length === 0
    ) {
      // We don't want to be capturing animations or other spammy dom 
      // updates as it will result in awful playback. Sensible animations
      // will use css transforms instead of updating the dom like crazy.
      // This can result in choppy animmations during playback but I don't
      // think people have any excuse for doing animations this way.
      return this.throttledAnimationSend(event);
    }

    if (
      event.type === EventType.IncrementalSnapshot && 
      event.data.source === IncrementalSource.MouseInteraction
    ) {
      // This is cheaper to do here, and means that we can know about
      // all clicked elements without having to rebuild the entire page
      const node = record.mirror.getNode(event.data.id);
      (event.data as any).selector = cssPath(node) || 'html > body';
      // This is done purely so that we can read clicks easilly later
      // as the page is important
      (event.data as any).href = location.pathname;
    }

    if (event.type === EventType.Meta) {
      this.setPageView(event.data.href);
    }

    if (this.isUserInteractionEvent(event)) {
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

  private throttledAnimationSend = throttle((event: eventWithTime) => {
    this.send('event', event);
  }, ATTRIBUTE_MUTATION_THROTTLE_MS);

  private isUserInteractionEvent = (event: eventWithTime): boolean => {
    return event.type === EventType.IncrementalSnapshot && [
      IncrementalSource.MouseInteraction, 
      IncrementalSource.Scroll
    ].includes(event.data.source);
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
