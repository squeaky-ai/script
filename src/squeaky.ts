import { record, EventType } from 'rrweb';
import { config } from './config';

interface State {
  previousPath: string;
}

interface IdentifyInput {
  [key: string]: string | number;
}

export class Squeaky {
  private state: State;
  private site_id: string;
  private socket: WebSocket;
  private recording: boolean;

  public constructor(site_id: string) {
    this.site_id = site_id;
    this.recording = false;
    this.state = { previousPath: location.pathname };

    const params = new URLSearchParams({
      site_id: this.site_id,
      visitor_id: this.getOrCreateId('visitor', localStorage),
      session_id: this.getOrCreateId('session', sessionStorage),
    });

    this.socket = new WebSocket(`${WEBSOCKET_SERVER_HOST}/gateway/in?${params.toString()}`);
    
    this.socket.onopen = () => this.install();
  }

  public identify = async (id: string, input: IdentifyInput = {}): Promise<void> => {
    // Let site owners identify visitors by adding 
    // some basic attributes to their visitor record
    this.send('identify', { id, ...input });
  };

  private send<T>(key: string, value: T) {
    const payload = JSON.stringify({ key, value });
    this.socket.send(payload);
  }

  private install = () => {
    // There's no point in starting the recording if the user is
    // not looking at the page. They might have opened a bunch of
    // tabs in the background, and we're going to have a session
    // with a bunch of dead time at the start
    if (document.hasFocus()) {
      this.record();
    }

    // If the user does eventually come to the page after being
    // away during the initial load, then we should start the
    // recording only if it hasn't already started
    window.addEventListener('focus', () => {
      if (!this.recording) {
        this.record();
      }
    });
  };

  private record = (): void => {
    this.recording = true;

    record({
      ...config,
      emit: (event) => {
        if (event.type === EventType.Meta) {
          // Super hacky but it's less faff than setting up a custom event
          (event as any).data.locale = navigator.language;
          (event as any).data.useragent = navigator.userAgent;
        }

        if (location.pathname !== this.state.previousPath) {
          // This is required for single page apps as they don't send a
          // disconnect/connect every time the page changes. If the url
          // has changed then we should let the API know or events
          // will stack up forever!
          this.state.previousPath = location.pathname;
          this.send('pageview', {
            type: EventType.Custom,
            data: {
              href: location.href
            },
            timestamp: new Date().valueOf(),
          });
        }

        this.send('event', event);
      },
    });
  };

  private getOrCreateId(type: 'session' | 'visitor', storage: Storage): string {
    const id = storage.getItem(`squeaky_${type}_id`) || Math.random().toString(36).slice(2);
    storage.setItem(`squeaky_${type}_id`, id);
    return id;
  }
}
