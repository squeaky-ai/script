export {};

declare global {
  interface Window {
    _sqSettings?: {
      interval?: number;
      site_id?: string;
      viewier_id?: string;
      session_id?: string;
      prevState?: string;
    }
  }
}

interface State {
  viewport_x: number;
  viewport_y: number;
  scroll_x: number;
  scroll_y: number;
  mouse_x: number;
  mouse_y: number;
  action: string | null,
  href: string;
  useragent: string;
  locale: string;
  html: string | null;
  timestamp: number;
}

(function main(): void {
  window._sqSettings = window._sqSettings || {};
  window._sqSettings.interval = 100;
  window._sqSettings.prevState = '';
  window._sqSettings.viewier_id = getOrCreateViewierId();
  window._sqSettings.session_id = getOrCreateSessionId();

  if (!window._sqSettings.site_id) {
    console.warn('Squeaky has been incorrectly configured');
    return;
  }

  if (window.navigator.doNotTrack) {
    return;
  }

  const socket = new WebSocket(`wss://gateway.squeaky.ai?site_id=${window._sqSettings.site_id}&viewer_id=${window._sqSettings.viewier_id}&session_id=${window._sqSettings.session_id}`);

  /**
   * Generate an id (that is absolutely not unique
   * so make sure it is scoped to something that is)
   * @returns {string}
   */
  function generateId(): string {
    return (new Date().getTime()).toString(36);
  }

  /**
   * Generate an id that is persists across all of
   * the users sessions
   * @returns {string}
   */
  function getOrCreateViewierId(): string {
    const id = localStorage.getItem('squeaky_viewer_id') || generateId();
    localStorage.setItem('squeaky_viewer_id', id);
    return id;
  }

  /**
   * Generate an id that is used only for this
   * session
   * @returns {string}
   */
  function getOrCreateSessionId(): string {
    const id = sessionStorage.getItem('squeaky_session_id') || generateId();
    sessionStorage.setItem('squeaky_session_id', id);
    return id;
  }

  /**
   * Open a websocket connection
   */
  socket.addEventListener('open', (): void => {
    const state: State = {
      viewport_x: window.innerWidth,
      viewport_y: window.innerHeight,
      scroll_x: window.scrollX,
      scroll_y: window.scrollY,
      mouse_x: 0,
      mouse_y: 0,
      action: null,
      href: location.href,
      useragent: navigator.userAgent,
      locale: navigator.language,
      html: getDomContents(),
      timestamp: (new Date()).valueOf(),
    };

    /**
     * Fired whenever the user interacts with 
     * something, such as clicking, focussing
     * etc.
     * @param {Element} element 
     * @param {string} action 
     * @return {void}
     */
    function registerAction(element: Element, action: string): void {
      let selector = element.nodeName.toLowerCase();
      if (element.id) selector += '#' + element.id;
      if (element.className) selector += '.' + element.className;
      state.action = action + ':' + selector;
    }

    /**
     * Fired every Xms depending on the interval
     * in the config. To minimise the amount of 
     * events that are sent, we should check 
     * against the previous state.
     * @returns {void}
     */
    function ticker(): void {
      if (JSON.stringify(state) === window._sqSettings?.prevState) {
        return;
      }

      const message = JSON.stringify({
        action: 'event',
        payload: state,
      });

      socket.send(message);
      state.action = null;
      state.html = null;
      window._sqSettings!.prevState = JSON.stringify(state);
    }

    /**
     * Get the entire HTML contents include the 
     * doctype
     * @returns {string} 
     */
    function getDomContents(): string {
      return new XMLSerializer().serializeToString(document);
    }

    /**
     * Poll every Xms for changes and call the 
     * ticker function
     */
    let watch = setInterval(ticker, window._sqSettings!.interval);

    /**
     * Update the state when something in the body
     * changes
     */
    const observer = new MutationObserver(() => {
      state.html = getDomContents();
    });

    observer.observe(document.body, { 
      attributes: true, 
      childList: true, 
      subtree: true 
    });

    /**
     * Update the state whenever the users mouse 
     * moves
     */
    window.addEventListener('mousemove', (event: MouseEvent): void => {
      state.mouse_x = event.clientX;
      state.mouse_y = event.clientY; 
    });

    /**
     * Update the state whenever the user scrolls
     */
    window.addEventListener('scroll', (_event: Event): void => {
      state.scroll_x = window.scrollX;
      state.scroll_y = window.scrollY;
    });

    /**
     * Update the state whenver the user clicks,
     * unless the user clicks on one of the excluded
     * elements (as they are likely handles elsewhere)
     */
    window.addEventListener('click', (event: MouseEvent): void => {
      const target = event.target as Element;
      const action = 'click';
      const exclusions = ['input'];

      if (!exclusions.includes(target.nodeName.toLowerCase())) {
        registerAction(target, action);
      }
    });

    /**
     * Update the state whenever the user focuses
     * in on an input
     */
    window.addEventListener('focusin', (event: FocusEvent): void => {
      const action = 'focus';
      const target = event.target as Element;
      registerAction(target, action);
    });
    
    /**
     * Update teh state whenver the user blurs an
     * input
     */
    window.addEventListener('focusout', (event: FocusEvent): void => {
      const action = 'blur';
      const target = event.target as Element;
      registerAction(target, action);
    });

    /**
     * Restart the ticker when the user focuses back
     * in on the page and update the state to show
     * they did it
     */
    window.addEventListener('focus', (): void => {
      const action = 'focus';
      const target = document.body;
      registerAction(target, action);
      clearInterval(watch);
      watch = setInterval(ticker, window._sqSettings!.interval);
    });

    /**
     * Pause the ticker whenver the user blurs the page
     * so we don't spam a bunch of events. We also update
     * the state to show they did it
     */
    window.addEventListener('blur', (): void => {
      const action = 'blur';
      const target = document.body;
      registerAction(target, action);
      clearInterval(watch);
    });
  });
})();