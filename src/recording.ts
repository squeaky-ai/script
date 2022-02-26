import { record, EventType, IncrementalSource } from 'rrweb';
import { eventWithTime } from 'rrweb/typings/types';
import { config } from './config';
import { cssPath } from './utils/css-path';
import { Visitor } from './visitor';

const MAX_RETRIES = 5;

export class Recording {
  private socket!: WebSocket;
  private recording: boolean;
  private terminated: boolean;
  private cutOffTimer?: NodeJS.Timer;
  private stopRecording?: VoidFunction;
  private visitor: Visitor;
  private retries: number = 0;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
    this.recording = false;
    this.terminated = false;

    if (this.visitor.bot) return;

    this.connect();
  }

  public identify = (visitor: Visitor) => {
    this.visitor = visitor;
  };

  public onPageChange = (location: Location): void => {
    this.setPageView(location.href);
  };

  private connect() {
    this.socket = new WebSocket(`${WEBSOCKET_SERVER_HOST}/in?${this.visitor.params.toString()}`);

    this.socket.addEventListener('open', () => {
      this.init();
      this.setCutOff();
    });

    this.socket.addEventListener('close', () => {
      if (this.retries < MAX_RETRIES) {
        setTimeout(() => {
          this.retries++;
          this.connect();
        }, this.retries * 100);
      }
    });
  }

  private send<T>(key: string, value: T) {
    const payload = JSON.stringify({ key, value });
    if (this.socket.OPEN) this.socket.send(payload);
  }

  private init = () => {
    // There's no point in starting the recording if the user is
    // not looking at the page. They might have opened a bunch of
    // tabs in the background, and we're going to have a session
    // with a bunch of dead time at the start
    if (document.hasFocus()) {
      return this.install();
    }

    // If the user does eventually come to the page after being
    // away during the initial load, then we should start the
    // recording only if it hasn't already started
    window.addEventListener('focus', () => {
      if (!this.recording && !this.terminated) {
        return this.install();
      }
    });
  };

  private install = (): void => {
    this.record();
  
    this.send('recording', {
      type: EventType.Custom,
      data: this.visitor.toObject(),
      timestamp: new Date().valueOf(),
    });
  };

  private record = (): void => {
    this.recording = true;
    this.stopRecording = record({ ...config, emit: this.onEmit });
  };

  private onEmit = (event: eventWithTime) => {
    if (event.type === EventType.IncrementalSnapshot && event.data.source === IncrementalSource.MouseInteraction) {
      // This is cheaper to do here, and means that we can know about
      // all clicked elements without having to rebuild the entire page
      const node = record.mirror.getNode(event.data.id);
      (event.data as any).selector = cssPath(node) || 'html > body';
    }

    if (event.type === EventType.Meta) {
      this.setPageView(event.data.href);
    }

    if (this.isUserInteractionEvent(event)) {
      this.setCutOff();
    }

    if (this.visitor.externalAttributes) {
      this.setExternalAttributes();
    }

    this.visitor.setLastEventAt();

    this.send('event', event);
  };

  private isUserInteractionEvent = (event: eventWithTime): boolean => {
    return event.type === EventType.IncrementalSnapshot && 
          [IncrementalSource.MouseInteraction, IncrementalSource.Scroll].includes(event.data.source);
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
}
