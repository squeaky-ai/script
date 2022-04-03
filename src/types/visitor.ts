export interface VisitorObject {
  locale: string;
  device_x: number;
  device_y: number;
  viewport_x: number;
  viewport_y: number;
  referrer: string | null;
  useragent: string;
  timezone: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export type ExternalAttributes = Record<string, string | number>;
