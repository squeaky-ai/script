export interface VisitorObject {
  locale: string;
  device_x: number;
  device_y: number;
  viewport_x: number;
  viewport_y: number;
  referrer: string | null;
  useragent: string;
}

export type ExternalAttributes = Record<string, string | number>;
