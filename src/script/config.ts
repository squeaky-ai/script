import { recordOptions, eventWithTime } from 'rrweb/typings/types';

export const config: recordOptions<eventWithTime> = {
  blockClass: 'squeaky-hide',
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
};

export const NPS_CSS_URL = 'https://cdn.squeaky.ai/g/assets/nps.css';

export const SENTIMENT_CSS_URL = 'https://cdn.squeaky.ai/g/assets/sentiment.css';
