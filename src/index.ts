declare global {
  const WEBSOCKET_SERVER_HOST: string;
  const DEBUG: boolean;
  interface Window {
    _sqSettings: {
      site_id: string;
    }
  }
}

import { Squeaky } from './squeaky';

new Squeaky(window._sqSettings.site_id);