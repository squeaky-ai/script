declare global {
  const WEBSOCKET_SERVER_URL: string;
  interface Window {
    _sqSettings: {
      site_id: string;
    }
  }
}

import { Squeaky } from './script';

new Squeaky(window._sqSettings.site_id);
