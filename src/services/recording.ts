import actioncable from 'actioncable';
import { record, EventType } from 'rrweb';
import { eventWithTime } from 'rrweb/typings/types';
import { getRrwebConfig } from 'config';
import { cssPath, getNodeInnerText, getCoordinatesOfNode } from 'utils/css-path';
import { Visitor } from 'models/visitor';
import { throttle } from '../utils/helpers';
import { Logger } from 'utils/logger';
import { isClickEvent, isPageViewEvent, isMouseMoveEvent, isUserInteractionEvent, isScrollEvent, isMutationEvent, isProbablyJustAnimatingSomething } from 'utils/events';
import type { SiteSessionSettings } from 'types/api';
import type { ExternalAttributes } from 'types/visitor';

const MAX_RETRIES = 5;
const ATTRIBUTE_MUTATION_THROTTLE_MS = 50;

export class Recording {
  private recording: boolean = false;
  private terminated: boolean = false;
  private cutOffTimer?: NodeJS.Timer;
  private visitor: Visitor;
  private retries: number = 0;
  private sessionSettings!: SiteSessionSettings;
  private stop?: VoidFunction;

  private consumer!: actioncable.Cable;
  private subscription!: actioncable.Channel & actioncable.CreateMixin;

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

    this.consumer = actioncable.createConsumer(`${WSS_HOST}/api/in?${this.visitor.params.toString()}`);

    this.subscription = this.consumer.subscriptions.create('EventChannel', {
      connected: () => {
        this.startRecording();
        this.setCutOff();
      },

      disconnected: () => {
        this.onUninstall();
      },
    });

    window.addEventListener('error', this.handleError);
  };

  private send<T>(key: string, value: T) {
    if (this.recording) {
      this.subscription.perform('event', { key, value });
    }
  }

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
      Logger.error('Failed to stop recording', error);
    }
  };

  private onEmit = (event: eventWithTime) => {
    if (isMutationEvent(event)) {
      // Nothing is added or removed, only modified. This is hopefully
      // an animation or something and we can throttle them
      if (isProbablyJustAnimatingSomething(event)) {
        return this.throttledAnimationSend(event);
      }
    }

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
    }

    if (this.visitor.externalAttributes) {
      this.setExternalAttributes();
    }

    if (!isMutationEvent(event)) {
      this.visitor.setLastEventAt();
    }

    this.send('event', event);
  };

  private throttledAnimationSend = throttle((event: eventWithTime) => {
    this.send('event', event);
  }, ATTRIBUTE_MUTATION_THROTTLE_MS);

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

    this.consumer.disconnect();
    this.recording = false;
    this.terminated = true;

    if (this.stopRecording) this.stopRecording();

    // If you don't delete the session then it will keep
    // adding to the old one when they return
    this.visitor.deleteSessionId();
    (window as any).squeaky = null;
  };

  private setCutOff = () => {
    window.clearTimeout(this.cutOffTimer!);
    
    this.cutOffTimer = setTimeout(() => {
      Logger.debug('Checking inactivity status...');

      if (this.visitor.shouldStartNewSession) {
        Logger.info('Terminating session due to inactivity');
        return this.terminateSession();
      }

      this.setCutOff();
    }, 10000);
  };

  private onUninstall = () => {
    if (this.retries < MAX_RETRIES && !this.terminated) {
      setTimeout(() => {
        this.retries++;
        this.init(this.sessionSettings);
      }, this.retries * 100);
    }
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
