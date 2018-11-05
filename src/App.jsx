import React from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import Routes from './Routes';

const App = () => (
    <BrowserRouter>
          <main className="container">
              {/* <div>
                  <h2>Multi Users ToDo App with Firebase</h2>
              </div> */}
              {/* <ul className="left">
                  <li>
                      <Link to="/">Home</Link>
                  </li>
                  <li>
                      <Link to="/about">About</Link>
                  </li>
              </ul> */}
              <Routes />
          </main>
    </BrowserRouter>
);

export default App;
