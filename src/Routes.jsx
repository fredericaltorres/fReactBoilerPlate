import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { Home, About, About2, testPlanUI  } from './containers';

const Routes = () => (
  <Switch>
    <Route exact path="/" component={Home} />
    <Route path="/about" component={About} />
    <Route path="/about2" component={About2} />
    <Route path="/testPlanUI" component={testPlanUI} />
  </Switch>
);

export default Routes;
