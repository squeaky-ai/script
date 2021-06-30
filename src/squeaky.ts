import { cssPath } from '../vendor/css-path';
import { throttle } from '../vendor/throttle';
import { TreeMirrorClient } from '../vendor/mutation-summary';
import type { Event, EventWithTimestamps } from '../types/events';
import type { NodeData, PositionData, AttributeData, TextData } from '../vendor/mutation-summary';

export class Squeaky {
  private client: TreeMirrorClient;
  private events: Event[] = [];
  private socket: WebSocket;
  private ticker?: NodeJS.Timer;
  private startedAt = new Date().valueOf();
  private prevState: string = JSON.stringify(this.events);

  /**
   * Connect to the websocket server and attach the socket
   * event handlers
   * @public
   * @param {string} siteId 
   */
  public constructor(siteId: string) {
    const params = new URLSearchParams({
      site_id: siteId,
      viewer_id: this.getOrCreateId('viewer', localStorage),
      session_id: this.getOrCreateId('session', sessionStorage),
    });

    this.socket = new WebSocket(`${WEBSOCKET_SERVER_URL}?${params.toString()}`);
    this.socket.addEventListener('open', this.onConnected);
    this.socket.addEventListener('close', this.onDisconnected);
  }

  /**
   * Attach all of the event handlers that listen for user
   * events
   * @public
   * @returns {void}
   */
  public install(): void {
    this.client = new TreeMirrorClient(document, {
      initialize: (rootId: number, children: NodeData[]) => {
        this.update({ 
          type: 'snapshot',
          event: 'initialize',
          snapshot: [rootId, children] 
        });
      },

      applyChanged: (removed: NodeData[], addedOrMoved: PositionData[], attributes: AttributeData[], text: TextData[]) => {
        this.update({ 
          type: 'snapshot', 
          event: 'apply_changed',
          snapshot: [removed, addedOrMoved, attributes, text] 
        });
      }
    });

    window.addEventListener('blur', this.onBlur);
    window.addEventListener('focus', this.onFocus);
    window.addEventListener('click', this.onClick);
    window.addEventListener('scroll', this.onScroll);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  /**
   * Remove all of the event handlers that listen for user
   * events
   * @public
   * @returns {void}
   */
  public uninstall(): void {
    this.client?.disconnect();

    window.removeEventListener('blur', this.onBlur, true);
    window.removeEventListener('focus', this.onFocus, true);
    window.removeEventListener('click', this.onClick, true);
    window.removeEventListener('scroll', this.onScroll, true);
    window.removeEventListener('mousemove', this.onMouseMove, true);
  }

  /**
   * First clear the ticker if it is running, then start a
   * new one that runs ever 100ms
   * @private
   * @returns {void}
   */
  private start(): void {
    this.stop();
    this.ticker = setInterval(this.tick, 100);
  }

  /**
   * Stop the ticker if it is running
   * @private
   * @return {void}
   */
  private stop(): void {
    this.ticker && clearInterval(this.ticker);
  }

  /**
   * Tick every Xms and send the websocket event if the state
   * has changed. Reset the events so that we don't send the 
   * same data more than once
   * @private
   * @returns {void}
   */
  private tick = (): void => {
    if (JSON.stringify(this.events) === this.prevState) {
      return;
    }

    this.send(this.events);
    this.events = [];
    this.prevState = JSON.stringify(this.events);
  }

  /**
   * Send the websocket event
   * @private
   * @param {Event[]} events 
   * @return {void}
   */
  private send = (events: Event[]): void => {
    this.socket.send(JSON.stringify({
      action: 'events',
      events
    }));
  };

  /**
   * Convenient helper to add something to the events list
   * that adds the timestamps
   * @private
   * @param {Event} value 
   * @return {void}
   */
  private update = (value: Event): void => {
    const now = new Date().valueOf();

    const event: EventWithTimestamps = {
      ...value,
      time: now - this.startedAt,
      timestamp: now,
    };

    this.events.push(event);
  };

  /**
   * When the webscoket sends a connect message we need to
   * attach all the event handlers and start the ticker
   * @private
   * @return {void}
   */
  private onConnected = (): void => {
    this.install();
    this.start();
    this.onPageView();
  };

  /**
   * When the websocket server sends a disconnect message
   * we need to clean up the event handlers and stop the
   * ticker
   * @private
   * @returns {void}
   */
  private onDisconnected = (): void => {
    this.uninstall();
    this.stop();
  };

  /**
   * Store an action when a page is visited, this should be
   * fired on connection as well as on history change for 
   * single page apps
   * @private
   * @returns {void}
   */
  private onPageView = (): void => {
    this.update({
      type: 'page_view',
      path: location.pathname,
      viewport_x: window.innerWidth,
      viewport_y: window.innerHeight,
      locale: navigator.language,
      useragent: navigator.userAgent,
    });
  };

  /**
   * Store an action when the user clicks on something and
   * generate a css selector from the element
   * @private
   * @param {MouseEvent} event
   * @return {void}
   */
  private onClick = (event: MouseEvent): void => {
    this.update({ type: 'click', selector: cssPath(event.target as Element) });
  };

  /**
   * Store an action when the user blurs the page. Stop the
   * ticker until the user returns
   * @private
   * @return {void}
   */
  private onBlur = (): void => {
    this.update({ type: 'blur', selector: 'window' });
    this.stop();
  };

  /**
   * Store an action when the user focuses in on the page.
   * Restart the ticker.
   * @private
   * @return {void}
   */
  private onFocus = (): void => {
    this.update({ type: 'focus', selector: 'window' });
    this.start();
  };

  /**
   * Set the current scroll position with a debounce
   * to reduce some noise
   * @private
   * @return {void}
   */
  private onScroll = throttle(50, (): void => {
    this.update({ type: 'scroll', x: window.scrollX, y: window.scrollY });
  });

  /**
   * Set the current mouse coordinates with a debounce
   * to reduce some noise
   * @private
   * @return {void}
   */
  private onMouseMove = throttle(50, (event: MouseEvent): void => {
    this.update({ type: 'cursor', x: event.clientX, y: event.clientY });
  });

  /**
   * Generate a short id if one does not exist in local
   * storage, then store it
   * @private
   * @param {'session' | 'viewer'} type 
   * @returns {string}
   */
  private getOrCreateId(type: 'session' | 'viewer', storage: Storage): string {
    const id = storage.getItem(`squeaky_${type}_id`) || Math.random().toString(36).slice(-6);
    storage.setItem(`squeaky_${type}_id`, id);
    return id;
  }
}
