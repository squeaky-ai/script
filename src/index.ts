declare global {
  const API_SERVER_HOST: string;
  const WEBSOCKET_SERVER_HOST: string;

  interface Window {
    squeaky: Squeaky;
    _sqSettings: {
      site_id: string;
    }
  }
}

import { Squeaky } from './squeaky';

// Don't export an ES module or it won't work properly
module.exports = new Squeaky(window._sqSettings.site_id);
