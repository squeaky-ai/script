import './styles/main.scss';

declare global {
  interface Window {
    showFollowUpQuestion: boolean;
    showContactConsentQuestion: boolean;
  }
}

class Nps {
  private step: number = 0;

  public onRatingInputChange = () => {
    if (!window.showFollowUpQuestion) {
      return this.submitForm();
    }

    this.setStep(1);
  };

  public onSubmitButtonClick = () => {
    if (this.step === 1 && !window.showContactConsentQuestion) {
      return this.submitForm();
    }

    if (this.step === 2 && this.form.contact.value === '0') {
      return this.submitForm();
    }

    if (this.step === 3) {
      return this.submitForm();
    }

    this.setStep(this.step + 1);
  };

  public onConfirmClose = () => {
    const message = JSON.stringify({ 
      key: '__squeaky_close_nps', 
      value: {} 
    });

    window.parent.postMessage(message, '*');
  };

  public submitForm = () => {
    const message = JSON.stringify({ 
      key: '__squeaky_submit_nps', 
      value: {}, 
    });

    window.parent.postMessage(message, '*');

    document.body.style.display = 'none';

    this.setStep(4);
    this.form.submit();
  };

  public setStep = (step: number) => {
    if (this.step >= step) return;

    this.step = step;

    const message = JSON.stringify({ 
      key: '__squeaky_set_step_nps', 
      value: { step }, 
    });

    window.parent.postMessage(message, '*');
    this.wrapper.classList.add(`step-${step}`);
  };

  private get form(): HTMLFormElement {
    return document.querySelector('.form')!;
  }

  private get wrapper(): HTMLDivElement {
    return document.querySelector('.squeaky')!;
  }
}

// Don't export an ES module or it won't work properly
module.exports = new Nps();
