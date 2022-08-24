export interface ConsentConfig {
  layout: ConsentLayout;
  consentMethod: ConsentMethod;
}

type ConsentMethod = 'disabled' | 'api' | 'widget';

type ConsentLayout = 'bottom_left' | 'center' | 'bottom_right';
