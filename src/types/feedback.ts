export interface Feedback {
  npsAccentColor: string;
  npsEnabled: boolean;
  npsFollowUpEnabled: boolean;
  npsLayout: NpsLayout;
  npsPhrase: string;
  npsSchedule: 'once' | 'monthly' | 'custom';
  npsExcludedPages: string[];
  sentimentAccentColor: string;
  sentimentEnabled: boolean;
  sentimentExcludedPages: string[];
  sentimentLayout: SentimentLayout;
  sentimentDevices: string[];
  sentimentSchedule: 'always' | 'custom';
}

export type NpsLayout = 'full_width' | 'boxed';

export type SentimentLayout = 'right_middle' | 'right_bottom' | 'left_middle' | 'left_bottom';
