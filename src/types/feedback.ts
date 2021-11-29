export interface Feedback {
  nps_accent_color: string;
  nps_enabled: boolean;
  nps_follow_up_enabled: boolean;
  nps_layout: NpsLayout;
  nps_phrase: string;
  nps_schedule: 'once' | 'monthly';
  sentiment_accent_color: string;
  sentiment_enabled: boolean;
  sentiment_excluded_pages: string[];
  sentiment_layout: SentimentLayout;
}

export type NpsLayout = 'full_width' | 'boxed';

export type SentimentLayout = 'right_middle' | 'right_bottom' | 'left_middle' | 'left_bottom';
