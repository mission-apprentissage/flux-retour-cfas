import * as React from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";

import useAuth from "./common/hooks/useAuth";
import { isUserAdmin } from "./common/utils/rolesUtils";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import LoginPage from "./pages/login/LoginPage";
import JobEventsPage from "./pages/settings/JobEventsPage";
import GlobalStatsPage from "./pages/stats/GlobalStatsPage";
import TableauDeBordPage from "./pages/tableau-de-bord/TableauDeBordPage";
import UserStatsPage from "./pages/user-stats";

const App = () => {
  const [auth] = useAuth();
  const isAdmin = isUserAdmin(auth);

  return (
    <Router>
      <Switch>
        <Route exact path="/login" component={LoginPage} />

        <PrivateRoute exact path="/">
          <Redirect to={isAdmin ? "/stats" : `/stats/${auth?.sub}`} />
        </PrivateRoute>

        <AdminRoute path="/stats" exact component={GlobalStatsPage} />
        <AdminRoute path="/tableau-de-bord" exact component={TableauDeBordPage} />
        <PrivateRoute path="/stats/:dataSource" component={UserStatsPage} />
        <PrivateRoute path="/analytics/" component={AnalyticsPage} />
        <PrivateRoute path="/settings/jobEvents" component={JobEventsPage} />

        <Route component={() => <div>404</div>} />
      </Switch>
    </Router>
  );
};

export default App;

const PrivateRoute = (routeProps) => {
  const [auth] = useAuth();
  const isLoggedIn = Boolean(auth?.sub);

  return isLoggedIn ? <Route {...routeProps} /> : <Redirect to="/login" />;
};

const AdminRoute = (routeProps) => {
  const [auth] = useAuth();
  const isAdmin = isUserAdmin(auth);

  return <PrivateRoute {...routeProps}>{isAdmin ? null : <Redirect to="/" />}</PrivateRoute>;
};
