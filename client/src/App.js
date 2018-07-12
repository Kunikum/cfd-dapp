import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Switch,
} from 'react-router-dom';

import CfdDashboard from './CfdDashboard';
import PriceOracleDashboard from './PriceOracleDashboard';

import './css/oswald.css';
import './css/open-sans.css';
import './css/pure-min.css';
import './App.css';


// import route Components here
const App = () => (
  <Router>
    <div className="App">
      <div className="navbar pure-menu pure-menu-horizontal">
        <ul className="pure-menu-list">
          <li className="pure-menu-item">
            <Link to="/" className="pure-menu-link">
              CFD Dashboard
            </Link>
          </li>
          <li className="pure-menu-item">
            <Link to="/price-oracle" className="pure-menu-link">
              Price Oracle
            </Link>
          </li>
        </ul>
      </div>
      <div className="container">
        <main>
          <Switch>
            <Route path="/" exact component={CfdDashboard} />
            <Route path="/price-oracle" component={PriceOracleDashboard} />
          </Switch>
        </main>
      </div>
    </div>
  </Router>
);
export default App;
