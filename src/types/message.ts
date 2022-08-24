export type Message = 
  SqueakyUnknownMessage |
  SqueakyCloseNpsMessage |
  SqueakySubmitNpsMessage |
  SqueakySetNpsStepMessage |
  SqueakyCloseSentimentMessage |
  SqueakyAcceptConsent |
  SqueakyRejectConsent |
  SqueakySetHeightConsent;

export type SqueakyUnknownMessage = {
  key: '__squeaky_unknown',
  value: {};
}

export type SqueakyCloseNpsMessage = {
  key: '__squeaky_close_nps';
  value: {};
}

export type SqueakySubmitNpsMessage = {
  key: '__squeaky_submit_nps';
  value: {};
}

export type SqueakySetNpsStepMessage = {
  key: '__squeaky_set_step_nps';
  value: {
    step: number;
    height: number;
  };
}

export type SqueakyCloseSentimentMessage = {
  key: '__squeaky_close_sentiment';
  value: {};
}

export type SqueakyMagicErasureMessage = {
  action: 'create' | 'delete' | 'load';
  selector: string;
}

export type SqueakyAcceptConsent = {
  key: '__squeaky_accept_consent';
  value: {};
}

export type SqueakyRejectConsent = {
  key: '__squeaky_reject_consent';
  value: {};
}

export type SqueakySetHeightConsent = {
  key: '__squeaky_set_height_consent';
  value: {
    height: number;
  };
}
