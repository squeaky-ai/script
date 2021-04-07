export {};

declare global {
  interface Window {
    _sqSettings?: {
      site_id?: string;
      viewier_id?: string;
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
}

const siteId = window._sqSettings.site_id;
const viewer = window._sqSettings.viewier_id;

if (!siteId || !viewer) {
  console.warn('Squeaky has been incorrectly configured');
}

const socket = new WebSocket(`wss://gateway.squeaky.ai?site_id=${window._sqSettings.site_id}&viewer=${viewer}`);

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
    locale: navigator.language
  };

  function registerAction(element: Element, action: string): void {
    let selector = element.nodeName.toLowerCase();
    if (element.id) selector += '#' + element.id;
    if (element.className) selector += '.' + element.className;
    state.action = action + ':' + selector;
  }

  function ticker(): void {
    socket.send(JSON.stringify({
      action: 'event',
      payload: state
    }));
    state.action = null;
  }

  let watch = setInterval(ticker, 250);

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
    watch = setInterval(ticker, 250);
  });

  window.addEventListener('blur', (): void => {
    const action = 'blur';
    const target = document.body;
    registerAction(target, action);
    clearInterval(watch);
    watch = undefined;
  });
});