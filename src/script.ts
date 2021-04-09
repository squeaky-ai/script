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
  viewportX: number;
  viewportY: number;
  scrollX: number;
  scrollY: number;
  mouseX: number;
  mouseY: number;
  action: string | null,
  href: string;
  userAgent: string;
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
      viewportX: window.innerWidth,
      viewportY: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      mouseX: 0,
      mouseY: 0,
      action: null,
      href: location.href,
      userAgent: navigator.userAgent,
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
      state.mouseX = event.clientX;
      state.mouseY = event.clientY; 
    });

    window.addEventListener('scroll', (_event: Event): void => {
      state.scrollX = window.scrollX;
      state.scrollY = window.scrollY;
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