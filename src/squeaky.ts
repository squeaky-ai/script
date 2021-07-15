import * as rrweb from 'rrweb';
import { EventType } from 'rrweb';

export class Squeaky {
  private socket: WebSocket;

  public constructor(siteId: string) {
    const params = new URLSearchParams({
      site_id: siteId,
      viewer_id: this.getOrCreateId('viewer', localStorage),
      session_id: this.getOrCreateId('session', sessionStorage),
    });

    this.socket = new WebSocket(`${WEBSOCKET_SERVER_URL}?${params.toString()}`);
    this.socket.addEventListener('open', this.onConnected);
  }

  public onConnected = (): void => {
    rrweb.record({
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
          console.log(JSON.stringify(event));
        } else {
          this.socket.send(JSON.stringify(event));
        }
      }
    });
  }

  private getOrCreateId(type: 'session' | 'viewer', storage: Storage): string {
    const id = storage.getItem(`squeaky_${type}_id`) || Math.random().toString(36).slice(-6);
    storage.setItem(`squeaky_${type}_id`, id);
    return id;
  }
}
