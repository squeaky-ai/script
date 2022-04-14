import { recordOptions, eventWithTime } from 'rrweb/typings/types';

export const getRrwebConfig = (
  overrides: Partial<recordOptions<eventWithTime>>
): recordOptions<eventWithTime> => ({
  blockClass: 'squeaky-hide',
  blockSelector: 'html>body>main>form>img, html>body>main>form>h1',
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
  },
  ...overrides,
});
