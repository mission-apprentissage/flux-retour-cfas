import * as React from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";

import ProtectedRoute from "./common/auth/ProtectedRoute";
import { roles } from "./common/auth/roles";
import LoginPage from "./pages/login/LoginPage";
import GlobalStatsPage from "./pages/stats/GlobalStatsPage";
import ComprendreLesDonnees from "./pages/tableau-de-bord/ComprendreLesDonnees";
import TableauDeBordPage from "./pages/tableau-de-bord/TableauDeBordPage";
import CfaWithoutNetworkPage from "./pages/tableau-de-bord/views/CfaWithoutNetwork/CfaWithoutNetworkPage";
import UserStatsPage from "./pages/user-stats";

const App = () => {
  return (
    <Router>
      <Switch>
        {/* Public pages */}
        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/cfa/:accessToken" component={CfaWithoutNetworkPage} />
        <Route path="/comprendre-donnees" exact component={ComprendreLesDonnees} />

        {/* Protected pages */}
        <Route exact path="/">
          <Redirect to="/tableau-de-bord" />
        </Route>
        <ProtectedRoute
          authorizedRoles={[roles.administrator, roles.pilot, roles.network]}
          path="/tableau-de-bord"
          exact
          component={TableauDeBordPage}
        />
        <ProtectedRoute authorizedRoles={[roles.administrator]} path="/stats" exact component={GlobalStatsPage} />
        <ProtectedRoute authorizedRoles={[roles.administrator]} path="/stats/:dataSource" component={UserStatsPage} />

        {/* NotFound page */}
        <Route component={() => <div>404</div>} />
      </Switch>
    </Router>
  );
};

export default App;
