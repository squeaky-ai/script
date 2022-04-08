import { Visitor } from './visitor';

describe('Visitor', () => {
  describe('constructor', () => {
    describe('when the visitor is new', () => {
      const seed = 0.94650188893523;

      beforeAll(() => {
        Math.random = jest.fn(() => seed);
      });

      afterAll(() => {
        localStorage.removeItem('squeaky_visitor_id');
        sessionStorage.removeItem('squeaky_session_id');
      });

      it('creates a new visitor and session id', () => {
        const visitor = new Visitor('site_id');

        expect(visitor.isNewVisitor).toEqual(true);
        expect(visitor.isNewSession).toEqual(true);

        expect(visitor.visitorId).toEqual('y2nzpstozup');
        expect(visitor.sessionId).toEqual('y2nzpstozup');

        expect(visitor.key).toEqual('site_id::y2nzpstozup::y2nzpstozup');
      });
    });

    describe('when the visitor is existing but it is a new session', () => {
      const seed = 0.533014828068594;

      beforeAll(() => {
        Math.random = jest.fn(() => seed);
        localStorage.setItem('squeaky_visitor_id', 'y2nzpstozup');
      });

      afterAll(() => {
        localStorage.removeItem('squeaky_visitor_id');
        sessionStorage.removeItem('squeaky_session_id');
      });

      it('creates a new visitor and session id', () => {
        const visitor = new Visitor('site_id');

        expect(visitor.isNewVisitor).toEqual(false);
        expect(visitor.isNewSession).toEqual(true);

        expect(visitor.visitorId).toEqual('y2nzpstozup');
        expect(visitor.sessionId).toEqual('j6sc8ekd9m');

        expect(visitor.key).toEqual('site_id::y2nzpstozup::j6sc8ekd9m');
      });
    });

    describe('when the visitor is existing but and it is not a new session', () => {
      const seed = 0.8004654844642498;

      beforeAll(() => {
        Math.random = jest.fn(() => seed);
        localStorage.setItem('squeaky_visitor_id', 'y2nzpstozup');
        sessionStorage.setItem('squeaky_session_id', 'j6sc8ekd9m');
      });

      afterAll(() => {
        localStorage.removeItem('squeaky_visitor_id');
        sessionStorage.removeItem('squeaky_session_id');
      });

      it('creates a new visitor and session id', () => {
        const visitor = new Visitor('site_id');

        expect(visitor.isNewVisitor).toEqual(false);
        expect(visitor.isNewSession).toEqual(false);

        expect(visitor.visitorId).toEqual('y2nzpstozup');
        expect(visitor.sessionId).toEqual('j6sc8ekd9m');

        expect(visitor.key).toEqual('site_id::y2nzpstozup::j6sc8ekd9m');
      });
    });
  });
});
