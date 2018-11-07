import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { 
  Home, About, About2, 
  TestPlansManagerContainer, 
  TestPlanDialogContainer  
} from './containers';

const Routes = () => (
  <Switch>
    <Route exact path="/" component={Home} />
    <Route path="/about" component={About} />
    <Route path="/about2" component={About2} />
    <Route path="/TestPlansManager" component={TestPlansManagerContainer} />
    <Route path="/TestPlanDialog" component={TestPlanDialogContainer} />
  </Switch>
);

export default Routes;

// http://localhost:3000/TestPlansManager
// http://localhost:3000/TestPlansDialog