import * as React from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";

import { roles } from "./common/auth/roles";
import { ProtectedRolesRoute, ProtectedRoute } from "./common/auth/routes";
import LoginPage from "./pages/login/LoginPage";
import GlobalStatsPage from "./pages/stats/GlobalStatsPage";
import ComprendreLesDonnees from "./pages/tableau-de-bord/ComprendreLesDonnees";
import TableauDeBordPage from "./pages/tableau-de-bord/TableauDeBordPage";
import UserStatsPage from "./pages/user-stats";

const App = () => {
  return (
    <Router>
      <Switch>
        {/* Public pages */}
        <Route exact path="/login" component={LoginPage} />
        <Route path="/comprendre-donnees" exact component={ComprendreLesDonnees} />

        {/* Secured Tdb Pages */}
        <Route path="/tableau-de-bord" exact component={TableauDeBordPage} />
        <Route exact path="/">
          <Redirect to="/tableau-de-bord" />
        </Route>

        {/* Secured admin pages */}
        <ProtectedRolesRoute authorizedRoles={[roles.administrator]} path="/stats" exact component={GlobalStatsPage} />
        <ProtectedRoute authorizedRoles={[roles.administrator]} path="/stats/:dataSource" component={UserStatsPage} />

        {/* Forbidden page */}
        <Route component={() => <div>404</div>} />
      </Switch>
    </Router>
  );
};

export default App;
