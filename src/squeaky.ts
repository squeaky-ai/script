import { io, Socket } from 'socket.io-client';
import { record, EventType } from 'rrweb';

interface State {
  previousPath: string;
}

export class Squeaky {
  private site_id: string;
  private socket: Socket;
  private state: State;

  public constructor(site_id: string) {
    this.site_id = site_id;
    this.state = { previousPath: location.pathname };

    this.install();
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

  private onConnected = (): void => {
    record({
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

        if (location.pathname !== this.state.previousPath) {
          // This is required for single page apps as they don't send a
          // disconnect/connect every time the page changes. If the url
          // has changed then we should let the Gateway know or events
          // will stack up forever!
          this.state.previousPath = location.pathname;
          this.socket.emit('snapshot', {
            type: EventType.Meta,
            data: {
              height: window.innerHeight,
              href: location.href,
              locale: navigator.language,
              useragent: navigator.userAgent,
              width: window.innerWidth,
            },
            timestamp: new Date().valueOf(),
          });
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
