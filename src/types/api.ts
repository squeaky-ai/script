import type { Feedback } from 'types/feedback';
import type { ConsentConfig } from 'types/consent';

export interface SiteSessionSettings {
  url: string;
  cssSelectorBlacklist: string[];
  anonymiseFormInputs: boolean;
  anonymiseText: boolean;
  ingestEnabled: boolean;
  invalidOrExceededPlan: boolean;
  magicErasureEnabled: boolean;
  feedback?: Feedback;
  consent: ConsentConfig;
}

export interface SessionConfig {
  siteSessionSettings: SiteSessionSettings;
};
