import './styles/main.scss';
import { Squeaky } from './squeaky';

declare global {
  const WEB_HOST: string;
  const API_SERVER_HOST: string;
  const WEBSOCKET_SERVER_HOST: string;
  const SESSION_CUT_OFF_MS: number;

  interface Window {
    squeaky: Squeaky;
    _sqSettings: {
      site_id: string;
    }
  }
}

// Don't export an ES module or it won't work properly
module.exports = new Squeaky(window._sqSettings.site_id);
