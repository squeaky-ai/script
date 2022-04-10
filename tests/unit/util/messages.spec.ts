import { parseMessage } from '../../../src/utils/messages';

describe('messages', () => {
  describe('parseMessage', () => {
    describe('when the message is valid JSON', () => {
      it('returns the message', () => {
        expect(parseMessage('{"foo":"bar"}')).toEqual({ foo: 'bar' });
      });
    });

    describe('when the message is not valid JSON', () => {
      it('returns the fallback', () => {
        expect(parseMessage('<sdfsdf@@')).toEqual({ key: '__squeaky_unknown', value: {} });
      });
    });
  });
});
