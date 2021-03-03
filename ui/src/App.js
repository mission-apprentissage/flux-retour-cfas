import * as React from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";

import { anonymous } from "./common/auth";
import useAuth from "./common/hooks/useAuth";
import { isUserAdmin } from "./common/utils/rolesUtils";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import LoginPage from "./pages/login/LoginPage";
import GlobalStatsPage from "./pages/stats/GlobalStatsPage";
import TableauDeBordDetailCfaPage from "./pages/tableau-de-bord/TableauDeBordDetailCfaPage";
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
          <Redirect to={isAdmin ? "/stats" : `/stats/${auth.sub}`} />
        </PrivateRoute>

        <AdminRoute path="/stats" exact component={GlobalStatsPage} />
        <AdminRoute path="/tableau-de-bord" exact component={TableauDeBordPage} />
        <AdminRoute path="/tableau-de-bord/centre-de-formation/:siret" exact component={TableauDeBordDetailCfaPage} />
        <PrivateRoute path="/stats/:dataSource" component={UserStatsPage} />
        <PrivateRoute path="/analytics/" component={AnalyticsPage} />

        <Route component={() => <div>404</div>} />
      </Switch>
    </Router>
  );
};

export default App;

const PrivateRoute = (routeProps) => {
  const [auth] = useAuth();
  const notLoggedIn = auth.sub === anonymous.sub;

  return notLoggedIn ? <Redirect to="/login" /> : <Route {...routeProps} />;
};

const AdminRoute = (routeProps) => {
  const [auth] = useAuth();
  const isAdmin = isUserAdmin(auth);

  return <PrivateRoute {...routeProps}>{isAdmin ? null : <Redirect to="/" />}</PrivateRoute>;
};
