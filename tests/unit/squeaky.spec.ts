import { Nps } from '../../src/nps';
import { Recording } from '../../src/recording';
import { Sentiment } from '../../src/sentiment';
import { Squeaky } from '../../src/squeaky';
import { Visitor } from '../../src/visitor';

global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ data: { feedback: {} } }),
})) as any;

describe('Squeaky', () => {
  describe('constructor', () => {
    it('assigns all the components required for a session', () => {
      const squeaky = new Squeaky('site_id');

      expect(squeaky.visitor).toBeInstanceOf(Visitor);
      expect(squeaky.nps).toBeInstanceOf(Nps);
      expect(squeaky.sentiment).toBeInstanceOf(Sentiment);
      expect(squeaky.recording).toBeInstanceOf(Recording);
    });

    describe('when nps is enabled', () => {
      const mockNpsInit = jest.fn();

      beforeAll(() => {
        (fetch as any).mockImplementation(() => ({ 
          ok: true,
          json: () => Promise.resolve({ 
            data: { 
              feedback: {
                npsEnabled: true,
              } 
            }
          }),
        }));

        Nps.prototype.init = mockNpsInit;
      });

      it('calls the init method on the nps instance', async () => {
        new Squeaky('site_id');

        setTimeout(() => { expect(mockNpsInit).toHaveBeenCalled() }, 0);
      });
    });

    describe('when sentiment is enabled and the device is included', () => {
      const mockSentimentInit = jest.fn();

      beforeAll(() => {
        window.innerWidth = 1280;

        (fetch as any).mockImplementation(() => ({ 
          ok: true,
          json: () => Promise.resolve({ 
            data: { 
              feedback: {
                sentimentEnabled: true,
                sentimentDevices: ['desktop', 'tablet', 'mobile'],
              } 
            }
          }),
        }));

        Sentiment.prototype.init = mockSentimentInit;
      });

      afterAll(() => {
        window.innerWidth = 1024;
      });

      it('calls the init method on the sentiment instance', async () => {
        new Squeaky('site_id');

        setTimeout(() => { expect(mockSentimentInit).toHaveBeenCalled() }, 0);
      });
    });

    describe('when sentiment is enabled and the device is not included', () => {
      const mockSentimentInit = jest.fn();

      beforeAll(() => {
        window.innerWidth = 320;

        (fetch as any).mockImplementation(() => ({ 
          ok: true,
          json: () => Promise.resolve({ 
            data: { 
              feedback: {
                sentimentEnabled: true,
                sentimentDevices: ['desktop', 'tablet'],
              } 
            }
          }),
        }));

        Sentiment.prototype.init = mockSentimentInit;
      });

      afterAll(() => {
        window.innerWidth = 1024;
      });

      it('does not call the init method on the sentiment instance', async () => {
        new Squeaky('site_id');

        setTimeout(() => { expect(mockSentimentInit).not.toHaveBeenCalled() }, 0);
      });
    });

    describe('when the call fails', () => {
      beforeAll(() => {
        (fetch as any).mockImplementation(() => Promise.reject('Oh no!'));
      });

      it('still instantiates the class', () => {
        expect(new Squeaky('site_id')).toBeInstanceOf(Squeaky);
      });
    });
  });

  describe('.identify', () => {
    const squeaky = new Squeaky('site_id');
    const mockRecordingIdentify = jest.fn();

    beforeAll(() => { 
      squeaky.recording.identify = mockRecordingIdentify;
    });

    it('passes the data to the recording instance', () => {
      squeaky.identify('id', {
        firstName: 'Jim',
        lastName: 'Morrison',
      });

      expect(mockRecordingIdentify).toHaveBeenCalledWith(expect.objectContaining({
        externalAttributes: {
          id: 'id',
          firstName: 'Jim',
          lastName: 'Morrison',
        },
      }));
    });
  });
});
