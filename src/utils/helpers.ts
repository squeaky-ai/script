export function throttle(callback: Function, wait: number) {
  let lastTime: number;
  let inThrottle: boolean;
  let lastCallback: NodeJS.Timeout;

  return function(this: any, ...args: any) {
    const context = this;

    if (!inThrottle) {
      callback.apply(context, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastCallback);

      lastCallback = setTimeout(() => {
        if (Date.now() - lastTime >= wait) {
          callback.apply(context, args);
          lastTime = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastTime), 0));
    }
  };
}
