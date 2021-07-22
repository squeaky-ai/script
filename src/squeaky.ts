import { io, Socket } from 'socket.io-client';
import { record, EventType } from 'rrweb';

export class Squeaky {
  private socket: Socket;

  public constructor(site_id: string) {
    this.socket = io(WEBSOCKET_SERVER_HOST, {
      path: '/gateway/socket',
      query: {
        site_id,
        viewer_id: this.getOrCreateId('viewer', localStorage),
        session_id: this.getOrCreateId('session', sessionStorage),
      },
      transports: ['websocket']
    });

    this.socket.on('connect', this.onConnected);
  }

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
