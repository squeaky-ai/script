import './styles/main.scss';

class Sentiment {
  public onRatingInputChange = () => {
    const form = document.querySelector('.form');
    form?.classList.add('add-comment');
  };

  public onConfirmClose = () => {
    const message = JSON.stringify({ 
      key: '__squeaky_close_sentiment', 
      value: {} 
    });

    window.parent.postMessage(message, '*');
  };
}

// Don't export an ES module or it won't work properly
module.exports = new Sentiment();