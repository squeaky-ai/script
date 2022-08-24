import { recordOptions, eventWithTime } from 'rrweb/typings/types';
import type { SiteSessionSettings } from 'types/api';

export const getRrwebConfig = (settings: SiteSessionSettings): recordOptions<eventWithTime> => {
  const blockSelector = settings.cssSelectorBlacklist.length
    ? settings.cssSelectorBlacklist.join(', ')
    : undefined;

  const maskAllInputs = settings.anonymiseFormInputs;

  return {
    blockClass: 'squeaky-hide',
    blockSelector,
    maskTextClass: 'squeaky-mask',
    maskAllInputs,
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
  };
};
