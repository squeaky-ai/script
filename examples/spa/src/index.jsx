import React from 'react';
import ReactDOM from 'react-dom';

import { BrowserRouter, Switch, Route, Link } from 'react-router-dom';

const App = () => (
  <BrowserRouter>
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/users">Users</Link>
          </li>
        </ul>
      </nav>

      <Switch>
        <Route path="/about">
          <h1>About</h1>
          <p>This is the about page</p>
        </Route>
        <Route path="/users">
          <h1>Users</h1>
          <p>This is the users page</p>
        </Route>
        <Route path="/">
          <h1>Home</h1>
          <p>This is the home page</p>
        </Route>
      </Switch>
    </div>
  </BrowserRouter>
);

ReactDOM.render(
  <App />,
  document.getElementById('main')
);
