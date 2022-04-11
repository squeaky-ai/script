import type { Site } from './site';
import type { Feedback } from './feedback';

export interface FeedbackResponse {
  data: {
    siteByUuid?: Site;
    feedback: Feedback;
  };
};
