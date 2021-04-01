import * as React from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";

import useAuth from "./common/hooks/useAuth";
import { isUserAdmin } from "./common/utils/rolesUtils";
import LoginPage from "./pages/login/LoginPage";
import RechercheUaiPage from "./pages/recherche-uai/RechercheUaiPage";
import CfasReferentielPage from "./pages/settings/cfasReferentiel/CfasReferentielPage";
import JobEventsPage from "./pages/settings/jobEvents/JobEventsPage";
import GlobalStatsPage from "./pages/stats/GlobalStatsPage";
import TableauDeBordPage from "./pages/tableau-de-bord/TableauDeBordPage";
import UserStatsPage from "./pages/user-stats";

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/login" component={LoginPage} />
        <Route path="/tableau-de-bord" exact component={TableauDeBordPage} />

        <Route exact path="/">
          <Redirect to="/tableau-de-bord" />
        </Route>

        <AdminRoute path="/stats" exact component={GlobalStatsPage} />
        <PrivateRoute path="/stats/:dataSource" component={UserStatsPage} />
        <PrivateRoute path="/recherche-uai" component={RechercheUaiPage} />
        <PrivateRoute path="/settings/jobEvents" component={JobEventsPage} />
        <Route path="/referentiel-cfas" component={CfasReferentielPage} />

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
