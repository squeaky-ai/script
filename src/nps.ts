
import type { Visitor } from './visitor';
import type { Feedback } from './types/feedback';

export class Nps {
  private visitor: Visitor;
  private settings!: Feedback;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public init = (settings: Feedback) => {
    this.settings = settings;

    this.visitor;
    this.settings;
  };
}
