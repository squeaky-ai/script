import { throttle } from 'lodash';
import { Utils } from './utils';

type InteractionEventType = 'click' | 'hover' | 'focus' | 'blur';

interface ScrollEvent {
  type: 'scroll',
  x: number;
  y: number;
}

interface CursorEvent {
  type: 'mouse',
  x: number;
  y: number;
}

interface InteractionEvent {
  type: InteractionEventType;
  selector: string;
}


type Event = ScrollEvent | CursorEvent | InteractionEvent;

type EventWithTimestamps = Event & { time: number; timestamp: number };

interface State {
  events: EventWithTimestamps[],
  viewport_x: number,
  viewport_y: number,
  path: string,
  locale: string,
  useragent: string
}

class Squeaky {
  private state: State = {
    events: [],
    viewport_x: window.innerWidth,
    viewport_y: window.innerHeight,
    path: location.pathname,
    locale: navigator.language,
    useragent: navigator.userAgent,
  };

  private socket: WebSocket;
  private ticker?: NodeJS.Timer;
  private startedAt = new Date().valueOf();
  private prevState: string = JSON.stringify(this.state);

  /**
   * Connect to the websocket server and attach the socket
   * event handlers
   * @public
   * @param {string} siteId 
   */
  public constructor(siteId: string) {
    const params = new URLSearchParams({
      site_id: siteId,
      viewer_id: this.getOrCreateId('viewer'),
      session_id: this.getOrCreateId('session'),
    });

    this.socket = new WebSocket(`ws://localhost:4000/api/cable?${params.toString()}`);
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
    if (JSON.stringify(this.state) === this.prevState) {
      return;
    }

    this.send(this.state);
    this.state.events = [];
    this.prevState = JSON.stringify(this.state);
  }

  /**
   * Send the websocket event
   * @private
   * @param {State} message 
   * @return {void}
   */
  private send = (message: State): void => {
    console.log(JSON.stringify(message));
    // TODO!
  };

  /**
   * Convenient helper to add something to the events list
   * that adds the timestamps.
   * @private
   * @param {Omit<Event, 'time' | 'timestamp'>} value 
   * @return {void}
   */
  private update = (value: Event): void => {
    const now = new Date().valueOf();

    const event: EventWithTimestamps = {
      ...value,
      time: now - this.startedAt,
      timestamp: now,
    };

    this.state.events.push(event);
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
   * Store an action when the user clicks on something and
   * generate a css selector from the element
   * @private
   * @param {MouseEvent} event
   * @return {void}
   */
  private onClick = (event: MouseEvent): void => {
    this.update({ type: 'click', selector: Utils.getCssPath(event.target as Element) });
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
  private onScroll = throttle((): void => {
    this.update({ type: 'scroll', x: window.scrollX, y: window.scrollY });
  }, 50);

  /**
   * Set the current mouse coordinates with a debounce
   * to reduce some noise
   * @private
   * @return {void}
   */
  private onMouseMove = throttle((event: MouseEvent): void => {
    this.update({ type: 'mouse', x: event.clientX, y: event.clientY });
  }, 50);

  /**
   * Generate a short id if one does not exist in local
   * storage, then store it
   * @private
   * @param {'session' | 'viewer'} type 
   * @returns {string}
   */
  private getOrCreateId(type: 'session' | 'viewer'): string {
    const id = sessionStorage.getItem(`squeaky_${type}_id`) || Math.random().toString(36).slice(-6);
    sessionStorage.setItem(`squeaky_${type}_id`, id);
    return id;
  }
}

new Squeaky('63ff4985-f8aa-4a41-9ca5-16933d95f578');