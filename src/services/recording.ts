import { Consumer, Subscription, createConsumer } from '@rails/actioncable';
import { record, EventType } from 'rrweb';
import { eventWithTime } from 'rrweb/typings/types';
import { getRrwebConfig } from 'config';
import { cssPath, getNodeInnerText, getCoordinatesOfNode } from 'utils/css-path';
import { Visitor } from 'models/visitor';
import { throttle } from '../utils/helpers';
import { isClickEvent, isPageViewEvent, isMouseMoveEvent, isUserInteractionEvent, isScrollEvent, isMutationEvent, isProbablyJustAnimatingSomething, isSnapshotEvent } from 'utils/events';
import type { SiteSessionSettings } from 'types/api';
import type { ExternalAttributes } from 'types/visitor';

const ATTRIBUTE_MUTATION_THROTTLE_MS = 50;

export class Recording {
  private visitor: Visitor;
  private sessionSettings!: SiteSessionSettings;
  private stop?: VoidFunction;

  private consumer!: Consumer;
  private subscription!: Subscription<Consumer>;

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

    this.consumer = createConsumer(`${WSS_HOST}/in?${this.visitor.params.toString()}`);

    this.subscription = this.consumer.subscriptions.create('EventChannel', {
      connected: () => {
        this.install();
      },

      disconnected: () => {
        this.uninstall();
      },

      rejected: () => {
        this.uninstall();
      },
    });

    window.addEventListener('error', this.handleError);
  };

  private send<T>(key: string, value: T) {
    this.subscription.perform('event', { key, value });
  }

  private ping() {
    this.subscription.perform('ping', {});
  }

  private install = (): void => {
    const config = getRrwebConfig(this.sessionSettings);

    this.stop = record({ ...config, emit: this.onEmit });
  
    this.send('recording', {
      type: EventType.Custom,
      data: this.visitor.toObject(),
      timestamp: new Date().valueOf(),
    });
  };

  private onEmit = (event: eventWithTime) => {
    if (!this.sessionSettings.recordingsEnabled && isSnapshotEvent(event)) {
      // Recordings are disabled for this site so it's as waste of 
      // time recording the page data
      return;
    }

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
      this.ping();
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

  private uninstall = () => {
    this.stop?.();
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
