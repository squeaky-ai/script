export type Message = 
  SqueakyUnknownMessage |
  SqueakyCloseNpsMessage |
  SqueakySubmitNpsMessage |
  SqueakySetNpsStepMessage |
  SqueakyCloseSentimentMessage;

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
  };
}

export type SqueakyCloseSentimentMessage = {
  key: '__squeaky_close_sentiment';
  value: {};
}