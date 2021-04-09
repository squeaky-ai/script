export {};

declare global {
  interface Window {
    _sqSettings?: {
      interval?: number;
      site_id?: string;
      viewier_id?: string;
      session_id?: string;
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
  html: string;
}

(function main() {
  function generateId(): string {
    return (new Date().getTime()).toString(36);
  }

  function getOrCreateViewierId(): string {
    const id = localStorage.getItem('squeaky_viewer_id') || generateId();
    localStorage.setItem('squeaky_viewer_id', id);
    return id;
  }

  function getOrCreateSessionId(): string {
    const id = sessionStorage.getItem('squeaky_session_id') || generateId();
    sessionStorage.setItem('squeaky_session_id', id);
    return id;
  }

  window._sqSettings = window._sqSettings || {};
  window._sqSettings.interval = 100;
  window._sqSettings.viewier_id = getOrCreateViewierId();
  window._sqSettings.session_id = getOrCreateSessionId();

  if (!window._sqSettings.site_id) {
    console.warn('Squeaky has been incorrectly configured');
    return;
  }

  const socket = new WebSocket(`wss://gateway.squeaky.ai?site_id=${window._sqSettings.site_id}&viewer_id=${window._sqSettings.viewier_id}&session_id=${window._sqSettings.session_id}`);

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
    };

    function registerAction(element: Element, action: string): void {
      let selector = element.nodeName.toLowerCase();
      if (element.id) selector += '#' + element.id;
      if (element.className) selector += '.' + element.className;
      state.action = action + ':' + selector;
    }

    function ticker(): void {
      const message = JSON.stringify({
        action: 'event',
        payload: Object.assign({}, state, { html: getDomContents() })
      });

      socket.send(message);
      state.action = null;
    }

    function getDomContents(): string {
      return new XMLSerializer().serializeToString(document);
    }

    let watch = setInterval(ticker, window._sqSettings!.interval);

    window.addEventListener('mousemove', (event: MouseEvent): void => {
      state.mouse_x = event.clientX;
      state.mouse_y = event.clientY; 
    });

    window.addEventListener('scroll', (_event: Event): void => {
      state.scroll_x = window.scrollX;
      state.scroll_y = window.scrollY;
    });

    window.addEventListener('click', (event: MouseEvent): void => {
      const target = event.target as Element;
      const action = 'click';
      const exclusions = ['input'];

      if (!exclusions.includes(target.nodeName.toLowerCase())) {
        registerAction(target, action);
      }
    });

    window.addEventListener('focusin', (event: FocusEvent): void => {
      const action = 'focus';
      const target = event.target as Element;
      registerAction(target, action);
    });
    
    window.addEventListener('focusout', (event: FocusEvent): void => {
      const action = 'blur';
      const target = event.target as Element;
      registerAction(target, action);
    });

    window.addEventListener('focus', (): void => {
      const action = 'focus';
      const target = document.body;
      registerAction(target, action);
      clearInterval(watch);
      watch = setInterval(ticker, window._sqSettings!.interval);
    });

    window.addEventListener('blur', (): void => {
      const action = 'blur';
      const target = document.body;
      registerAction(target, action);
      clearInterval(watch);
    });
  });
})();