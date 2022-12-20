import './styles/main.scss';
import { Squeaky } from './squeaky';

declare global {
  const PROTOCOL: string;
  const HOST: string;
  const SESSION_CUT_OFF_MS: number;

  interface Window {
    squeaky: Squeaky;
    _sqSettings: {
      site_id: string;
    }
  }
}

// Don't export an ES module or it won't work properly
// Also, don't allow the script to be loaded twice or
// we'll end up with duplicates of everything!
module.exports = window.squeaky || new Squeaky(window._sqSettings.site_id);
