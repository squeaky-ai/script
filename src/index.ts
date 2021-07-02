declare global {
  const WEBSOCKET_SERVER_URL: string;
  const DEBUG: boolean;
  interface Window {
    _sqSettings: {
      site_id: string;
    }
  }
}

import { Squeaky } from './squeaky';

new Squeaky(window._sqSettings.site_id);
