import { recordOptions, eventWithTime } from 'rrweb/typings/types';

export const getRrwebConfig = (
  overrides: Partial<recordOptions<eventWithTime>>
): recordOptions<eventWithTime> => ({
  blockClass: 'squeaky-hide',
  blockSelector: undefined,
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
