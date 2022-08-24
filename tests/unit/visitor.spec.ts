import { Visitor } from '../../src/models/visitor';

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

  describe('.params', () => {
    const seed = 0.6856535641319799;

    beforeAll(() => {
      Math.random = jest.fn(() => seed);
    });

    afterAll(() => {
      localStorage.removeItem('squeaky_visitor_id');
      sessionStorage.removeItem('squeaky_session_id');
    });

    it('returns the params as a URLSearchParams', () => {
      const visitor = new Visitor('site_id');
      const params = visitor.params;

      expect(params).toBeInstanceOf(URLSearchParams);
      expect(params.toString()).toEqual('site_id=site_id&visitor_id=oolup30n8v&session_id=oolup30n8v');
    });
  });

  describe('.toObject', () => {
    beforeAll(() => {
      jest.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
      jest.spyOn(screen, 'width', 'get').mockReturnValue(1024);
      jest.spyOn(screen, 'height', 'get').mockReturnValue(768);
      jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15');
      jest.spyOn(document, 'referrer', 'get').mockReturnValue('https://google.com/');

      window.innerWidth = 1024;
      window.innerHeight = 768;

      window.history.pushState({}, '', '/?utm_campaign=test&utm_content=test&utm_medium=organic&utm_source=google&utm_term=test');
    });

    afterAll(() => {
      window.history.pushState({}, '', '/');
    });

    it('returns everything we need to know about the visitor', () => {
      const visitor = new Visitor('site_id');
      expect(visitor.toObject()).toEqual({
        locale: 'en-GB',
        device_x: 1024,
        device_y: 768,
        viewport_x: 1024,
        viewport_y: 768,
        referrer: 'https://google.com',
        useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15',
        timezone: 'Europe/London',
        utm_campaign: 'test',
        utm_content: 'test',
        utm_medium: 'organic',
        utm_source: 'google',
        utm_term: 'test',
      });
    });
  });

  describe('.deleteSessionId', () => {
    describe('when a session id does not exist', () => {
      it('does nothing', () => {
        const visitor = new Visitor('site_id');
        visitor.deleteSessionId();
        expect(sessionStorage.getItem('squeaky_session_id')).toEqual(null);
      });
    });

    describe('when a session id exists', () => {
      beforeAll(() => {
        sessionStorage.setItem('squeaky_session_id', 'test');
      });

      it('deletes it', () => {
        const visitor = new Visitor('site_id');
        visitor.deleteSessionId();
        expect(sessionStorage.getItem('squeaky_session_id')).toEqual(null);
      });
    });
  });

  describe('.deviceX', () => {
    beforeAll(() => {
      jest.spyOn(screen, 'width', 'get').mockReturnValue(500);
    });

    it('returns the screen width', () => {
      const visitor = new Visitor('site_id');
      expect(visitor.deviceX).toEqual(500);
    });
  });

  describe('.deviceY', () => {
    beforeAll(() => {
      jest.spyOn(screen, 'height', 'get').mockReturnValue(500);
    });

    it('returns the screen height', () => {
      const visitor = new Visitor('site_id');
      expect(visitor.deviceY).toEqual(500);
    });
  });

  describe('.viewportX', () => {
    beforeAll(() => {
      window.innerWidth = 1024;
    });

    it('returns the innerWidth', () => {
      const visitor = new Visitor('site_id');
      expect(visitor.viewportX).toEqual(1024);
    });
  });

  describe('.viewportY', () => {
    beforeAll(() => {
      window.innerHeight = 768;
    });

    it('returns the innerHeight', () => {
      const visitor = new Visitor('site_id');
      expect(visitor.viewportY).toEqual(768);
    });
  });

  describe('.language', () => {
    describe('when the browser reports a language', () => {
      beforeAll(() => {
        jest.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
      });

      it('returns the language', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.language).toEqual('en-GB');
      });
    });

    describe('when the browser does not report a language', () => {
      beforeAll(() => {
        jest.spyOn(navigator, 'language', 'get').mockReturnValue('');
      });

      it('returns a fallback language', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.language).toEqual('zz-ZZ');
      });
    });
  });

  describe('.bot', () => {
    describe('when the browser reports that it is controlled via webdriver', () => {
      beforeAll(() => {
        // This doesn't seem to exist in jest
        (navigator as any).webdriver = true;
      });

      afterAll(() => {
        // This doesn't seem to exist in jest
        (navigator as any).webdriver = false;
      });

      it('returns true', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.bot).toEqual(true);
      });
    });

    describe('when the useragent is suspicious', () => {
      beforeAll(() => {
        jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue('i am a bot');
      });

      it('returns true', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.bot).toEqual(true);
      });
    });

    describe('when the user agent is normal', () => {
      beforeAll(() => {
        jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15');
      });

      it('returns false', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.bot).toEqual(false);
      });
    });
  });

  describe('.useragent', () => {
    const useragent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15';

    beforeAll(() => {
      jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue(useragent);
    });

    it('returns the useragent', () => {
      const visitor = new Visitor('site_id');
      expect(visitor.useragent).toEqual(useragent); 
    });
  });

  describe('.timezone', () => {
    const timezone = 'Europe/London';

    beforeAll(() => {
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        resolvedOptions: () => ({ timeZone: timezone }),
      } as any));
    });

    it('returns the timezone', () => {
      const visitor = new Visitor('site_id');
      expect(visitor.timezone).toEqual(timezone); 
    });
  });

  describe('.referrer', () => {
    describe('when the referrer is empty', () => {
      beforeAll(() => {
        jest.spyOn(document, 'referrer', 'get').mockReturnValue('');
      });

      it('returns null', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.referrer).toEqual(null);
      });
    });

    describe('when the referrer ends with a trailing slash', () => {
      beforeAll(() => {
        jest.spyOn(document, 'referrer', 'get').mockReturnValue('https://google.com/');
      });

      it('returns it without the slash', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.referrer).toEqual('https://google.com');
      });
    });
  });

  describe('.lastEventAt', () => {
    describe('when there is no timestamp saved', () => {
      it('returns null', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.lastEventAt).toEqual(null);
      });
    });

    describe('when there is a timestamp saved', () => {
      beforeAll(() => {
        localStorage.setItem('squeaky_last_event_at', '1649442254433');
      });

      afterAll(() => {
        localStorage.removeItem('squeaky_last_event_at');
      });

      it('returns the timestamp as a number', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.lastEventAt).toEqual(1649442254433);
      });
    });
  });

  describe('.utmSource', () => {
    describe('when there is not a source', () => {
      it('returns null', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.utmSource).toEqual(null);
      });
    });

    describe('when there is a source', () => {
      beforeAll(() => {
        window.history.pushState({}, '', '/?utm_source=google');
      });

      afterAll(() => {
        window.history.pushState({}, '', '');
      });

      it('returns the source', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.utmSource).toEqual('google');
      });
    });
  });

  describe('.utmMedium', () => {
    describe('when there is not a medium', () => {
      it('returns null', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.utmMedium).toEqual(null);
      });
    });

    describe('when there is a medium', () => {
      beforeAll(() => {
        window.history.pushState({}, '', '/?utm_medium=organic');
      });

      afterAll(() => {
        window.history.pushState({}, '', '');
      });

      it('returns the medium', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.utmMedium).toEqual('organic');
      });
    });
  });

  describe('.utmCampaign', () => {
    describe('when there is not a medium', () => {
      it('returns null', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.utmCampaign).toEqual(null);
      });
    });

    describe('when there is a campaign', () => {
      beforeAll(() => {
        window.history.pushState({}, '', '/?utm_campaign=test');
      });

      afterAll(() => {
        window.history.pushState({}, '', '');
      });

      it('returns the campaign', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.utmCampaign).toEqual('test');
      });
    });
  });

  describe('.utmContent', () => {
    describe('when there is not a medium', () => {
      it('returns null', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.utmContent).toEqual(null);
      });
    });

    describe('when there is a content', () => {
      beforeAll(() => {
        window.history.pushState({}, '', '/?utm_content=test');
      });

      afterAll(() => {
        window.history.pushState({}, '', '');
      });

      it('returns the content', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.utmContent).toEqual('test');
      });
    });
  });

  describe('.utmTerm', () => {
    describe('when there is not a medium', () => {
      it('returns null', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.utmTerm).toEqual(null);
      });
    });

    describe('when there is a term', () => {
      beforeAll(() => {
        window.history.pushState({}, '', '/?utm_term=test');
      });

      afterAll(() => {
        window.history.pushState({}, '', '');
      });

      it('returns the term', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.utmTerm).toEqual('test');
      });
    });
  });

  describe('.deviceType', () => {
    describe('when the width is > 1024', () => {
      beforeAll(() => {
        window.innerWidth = 1024;
      });

      afterAll(() => {
        window.innerWidth = 1024;
      });

      it('returns desktop', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.deviceType).toEqual('desktop');
      });
    });

    describe('when the width is < 1024 but > 800', () => {
      beforeAll(() => {
        window.innerWidth = 900;
      });

      afterAll(() => {
        window.innerWidth = 1024;
      });

      it('returns tablet', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.deviceType).toEqual('tablet');
      });
    });

    describe('when the width < 800', () => {
      beforeAll(() => {
        window.innerWidth = 480;
      });

      afterAll(() => {
        window.innerWidth = 1024;
      });

      it('returns mobile', () => {
        const visitor = new Visitor('site_id');
        expect(visitor.deviceType).toEqual('mobile');
      });
    });
  });

  describe('.setLastEventAt', () => {
    const timestamp = 1649443515146;

    beforeAll(() => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date(timestamp));
    });

    it('sets the value to the current timestamp', () => {
      const visitor = new Visitor('site_id');
      visitor.setLastEventAt();
      expect(localStorage.getItem('squeaky_last_event_at')).toEqual(timestamp.toString());
    });
  });
});
