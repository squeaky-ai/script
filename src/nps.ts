import type { Feedback } from './types/feedback';

export class Nps {
  private settings: Feedback;

  public constructor(settings: Feedback) {
    this.settings = settings;

    if (!this.settings.nps_enabled) {
      return;
    }
  }
}
