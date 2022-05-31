import type { Site } from './site';
import type { Feedback } from './feedback';

export interface SiteSessionSettings {
  cssSelectorBlacklist: string[];
  anonymiseFormInputs: boolean;
}

export interface FeedbackResponse {
  data: {
    siteByUuid?: Site;
    feedback?: Feedback;
    siteSessionSettings?: SiteSessionSettings;
  };
};
