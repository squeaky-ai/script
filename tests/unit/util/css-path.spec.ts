import { cssPath } from '../../../src/utils/css-path';

describe('css-path', () => {
  describe('when the nested selectors have no classes or ids', () => {
    it('returns the selector', () => {
      const body = document.createElement('body');

      body.innerHTML = `
        <div class="header">
          <menu id="navigation">
            <ul>
              <li>
                <a href="/">
                  Home
                </a>
              </li>
            </ul>
          </menu>
        </div>
      `;

      const node = body.querySelector('a');
      const path = cssPath(node);

      expect(path).toEqual('menu#navigation > ul > li > a');
    });
  });

  describe('when the element has siblings', () => {
    it('returns the selector', () => {
      const body = document.createElement('body');

      body.innerHTML = `
        <main id="content">
          <h1>This is the title</h1>
          <p>This is the paragraph</p>
          <div class="cta">
            <button class="cta-cancel">
              Cancel
            </button>
            <button class="cta-confirm">
              Confirm
            </button>
          </div>
        </main>
      `;

      const node = body.querySelector('.cta-confirm');
      const path = cssPath(node);

      expect(path).toEqual('main#content > div > button:nth-of-type(2)');
    });
  });

  describe('when the element has an id', () => {
    it('returns the selector', () => {
      const body = document.createElement('body');

      body.innerHTML = `
        <aside id="sidebar">
          <div class="links">
            <nav>
              <a href="/" id="home-link">
                Home
              </a>
            </nav>
          </div>
        </aside>
      `;

      const node = body.querySelector('a');
      const path = cssPath(node);

      expect(path).toEqual('a#home-link');
    });
  });
});
