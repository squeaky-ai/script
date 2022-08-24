import type { Site } from 'types/site';
import type { Feedback } from 'types/feedback';
import type { ConsentConfig } from 'types/consent';

export interface SiteSessionSettings {
  cssSelectorBlacklist: string[];
  anonymiseFormInputs: boolean;
}

export interface SessionConfig {
  siteByUuid?: Site;
  feedback?: Feedback;
  consent: ConsentConfig;
  siteSessionSettings: SiteSessionSettings;
};
