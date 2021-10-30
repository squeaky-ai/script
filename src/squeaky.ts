import { record, EventType, IncrementalSource } from 'rrweb';
import { eventWithTime } from 'rrweb/typings/types';
import { config } from './config';
import { cssPath } from './utils';
import { Visitor } from './visitor';

interface State {
  previousPath: string;
}

type Identify = Record<string, string | number>;

const THIRTY_MINUTES = 1000 * 60 * 30;

export class Squeaky {
  private visitor: Visitor;
  private state: State;
  private socket!: WebSocket;
  private recording: boolean;
  private cutOffTimer?: NodeJS.Timer;

  public constructor(siteId: string) {
    this.visitor = new Visitor(siteId);
    this.recording = false;
    this.state = { previousPath: location.pathname };

    if (this.visitor.bot) return;

    this.socket = new WebSocket(`${WEBSOCKET_SERVER_HOST}/gateway/in?${this.visitor.params.toString()}`);

    this.socket.addEventListener('open', () => {
      this.init();
      this.setCutOff();
    });
  }

  public identify = async (id: string, input: Identify = {}): Promise<void> => {
    // Let site owners identify visitors by adding 
    // some basic attributes to their visitor record
    if (this.socket.OPEN) {
      return this.setIdentity({ id, ...input });
    }

    // The socket might not be open yet, so wait until
    // it is
    this.socket.addEventListener('open', () => {
      this.setIdentity({ id, ...input });
    });
  };

  private send<T>(key: string, value: T) {
    const payload = JSON.stringify({ key, value });
    this.socket.send(payload);
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
      if (!this.recording) {
        return this.install();
      }
    });
  };

  private install = (): void => {
    this.record();

    if (this.visitor.isNewSession) {
      // Fire this off for the first session to fill in the meta
      // data for the recording
      this.send('recording', {
        type: EventType.Custom,
        data: this.visitor.toObject(),
        timestamp: new Date().valueOf(),
      });
    }
  };

  private record = (): void => {
    this.recording = true;
    record({ ...config, emit: this.onEmit });
  };

  private onEmit = (event: eventWithTime) => {
    if (event.type === EventType.IncrementalSnapshot && event.data.source === IncrementalSource.MouseInteraction) {
      // This is cheaper to do here, and means that we can know about
      // all clicked elements without having to rebuild the entire page
      const node = record.mirror.getNode(event.data.id);
      (event.data as any).selector = cssPath(node) || 'html > body';
    }

    if (location.pathname !== this.state.previousPath) {
      this.setPageView();
    }

    if (this.isUserInteractionEvent(event)) {
      this.setCutOff();
    }

    this.send('event', event);
  };

  private isUserInteractionEvent = (event: eventWithTime): boolean => {
    return event.type === EventType.IncrementalSnapshot && 
          [IncrementalSource.MouseInteraction, IncrementalSource.Scroll].includes(event.data.source);
  };

  private setPageView = (): void => {
    // This is required for single page apps as they don't send a
    // disconnect/connect every time the page changes. If the url
    // has changed then we should let the API know or events
    // will stack up forever!
    this.state.previousPath = location.pathname;

    this.send('pageview', {
      type: EventType.Custom,
      data: { href: location.href },
      timestamp: new Date().valueOf(),
    });
  };

  private setIdentity = (identify: Identify): void => {
    // Fire off the identify event and then set the instance value
    // to null so it doesn't get fired multiple times
    this.send('identify', {
      type: EventType.Custom,
      data: identify,
      timestamp: new Date().valueOf(),
    });
  };

  private setCutOff = () => {
    // If a user does absolutely nothing for 30 minutes
    // then we need to cut them off
    window.clearTimeout(this.cutOffTimer!);
    
    this.cutOffTimer = setTimeout(() => {
      this.socket.close();
    }, THIRTY_MINUTES);
  };
}
