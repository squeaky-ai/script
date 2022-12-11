import type { Site } from 'types/site';
import type { Feedback } from 'types/feedback';
import type { ConsentConfig } from 'types/consent';

export interface SiteSessionSettings {
  url: string;
  cssSelectorBlacklist: string[];
  anonymiseFormInputs: boolean;
  anonymiseText: boolean;
  ingestEnabled: boolean;
  invalidOrExceededPlan: boolean;
}

export interface SessionConfig {
  siteByUuid?: Site;
  feedback?: Feedback;
  consent: ConsentConfig;
  siteSessionSettings: SiteSessionSettings;
};
