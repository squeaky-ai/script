import { io, Socket } from 'socket.io-client';
import { record, EventType } from 'rrweb';

interface State {
  previousPath: string;
}

export class Squeaky {
  private site_id: string;
  private socket: Socket;
  private stop: Function;
  private state: State;

  public constructor(site_id: string) {
    this.site_id = site_id;
    this.state = { previousPath: '' };

    this.install();
    this.watchForPageChange();
  }

  private install = () => {
    this.socket = io(WEBSOCKET_SERVER_HOST, {
      path: '/gateway/socket',
      query: {
        site_id: this.site_id,
        viewer_id: this.getOrCreateId('viewer', localStorage),
        session_id: this.getOrCreateId('session', sessionStorage),
      },
      transports: ['websocket']
    });

    this.socket.on('connect', this.onConnected);
  };

  private watchForPageChange = () => {
    // Single page apps don't fire a page view and don't
    // disconnect when they nagigate. This causes events
    // to stack up into the hundreds of thousands which
    // the database is not happy with. This fakes the 
    // process and reconnects every page change.
    const observer = new MutationObserver(() => {
      if (location.pathname !== this.state.previousPath) {
        this.state.previousPath = location.pathname;
        this.reconnect();
      }
    });

    // These might not all be necessary but it's cheap
    observer.observe(document.body, {
      characterDataOldValue: true, 
      subtree: true, 
      childList: true, 
      characterData: true
    });
  };

  private reconnect = (): void => {
    this?.stop();
    this.socket.disconnect();
    this.install();
  };

  private onConnected = (): void => {
    this.stop = record({
      maskAllInputs: true,
      slimDOMOptions: {
        script: true,
        comment: true,
      },
      emit: (event) => {
        if (event.type === EventType.Meta) {
          // Super hacky but it's less faff than setting up a custom event
          (event as any).data.locale = navigator.language;
          (event as any).data.useragent = navigator.userAgent;
        }

        if (DEBUG) {
          console.log(event);
        } else {
          this.socket.emit('event', event);
        }
      }
    });
  };

  private getOrCreateId(type: 'session' | 'viewer', storage: Storage): string {
    const id = storage.getItem(`squeaky_${type}_id`) || Math.random().toString(36).slice(-8);
    storage.setItem(`squeaky_${type}_id`, id);
    return id;
  }
}
