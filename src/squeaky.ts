import { record, EventType } from 'rrweb';
import { createConsumer, Subscription, Consumer } from '@rails/actioncable';

interface State {
  previousPath: string;
}

interface IdentifyInput {
  [key: string]: string | number;
}

export class Squeaky {
  private site_id: string;
  private subscription: Subscription<Consumer>;
  private state: State;

  public constructor(site_id: string) {
    this.site_id = site_id;
    this.state = { previousPath: location.pathname };

    const params = new URLSearchParams({
      site_id: this.site_id,
      visitor_id: this.getOrCreateId('visitor', localStorage),
      session_id: this.getOrCreateId('session', sessionStorage),
    });

    const consumer = createConsumer(`${WEBSOCKET_SERVER_HOST}/api/gateway?${params.toString()}`);
    
    this.subscription = consumer.subscriptions.create({ channel: 'EventChannel' }, {
      connected: () => {
        this.record();
      }
    });
  }

  public identify = async (id: string, input: IdentifyInput = {}): Promise<void> => {
    // Let site owners identify visitors by adding 
    // some basic attributes to their visitor record
    this.subscription.perform('identify', {
      payload: {
        id,
        ...input,
      }
    });
  };

  private record = (): void => {
    record({
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
          this.subscription.perform('pageview', {
            payload: { 
              type: EventType.Custom,
              data: {
                href: location.href
              },
              timestamp: new Date().valueOf(),
            }
          });
        }

        if (DEBUG) {
          console.log(event);
        } else {
          this.subscription.perform('event', { payload: event });
        }
      },
      blockClass: 'squeaky-hide',
      maskTextClass: 'squeaky-mask',
      maskAllInputs: true,
      slimDOMOptions: {
        script: true,
        comment: true,
      },
      sampling: {
        mouseInteraction: {
          MouseUp: false,
          MouseDown: false,
          Click: true,
          ContextMenu: false,
          DblClick: true,
          Focus: true,
          Blur: true,
          TouchStart: true,
          TouchEnd: true,
        }
      }
    });
  };

  private getOrCreateId(type: 'session' | 'visitor', storage: Storage): string {
    const id = storage.getItem(`squeaky_${type}_id`) || Math.random().toString(36).slice(2);
    storage.setItem(`squeaky_${type}_id`, id);
    return id;
  }
}
