import * as React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import ProtectedRoute from "./common/auth/ProtectedRoute";
import { roles } from "./common/auth/roles";
import { navigationPages } from "./common/constants/navigationPages";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/login/LoginPage";
import GlobalStatsPage from "./pages/stats/GlobalStatsPage";
import ComprendreLesDonnees from "./pages/tableau-de-bord/ComprendreLesDonnees";
import TableauDeBordPage from "./pages/tableau-de-bord/TableauDeBordPage";
import CfaWithoutNetworkPage from "./pages/tableau-de-bord/views/CfaWithoutNetwork";
import {
  ConsulterVosDonneesPage,
  TransmettreConsulterVosDonneesPage,
  TransmettreVosDonneesPage,
} from "./pages/transmettre-consulter-vos-donnees";
import UserStatsPage from "./pages/user-stats";

const App = () => {
  return (
    <Router>
      <Switch>
        {/* Public pages */}
        <Route exact path="/" component={HomePage} />
        <Route exact path={navigationPages.Login.path} component={LoginPage} />
        <Route
          exact
          path={navigationPages.TransmettreEtConsulterVosDonnees.path}
          component={TransmettreConsulterVosDonneesPage}
        />
        <Route path={navigationPages.ConsulterVosDonnees.path} exact component={ConsulterVosDonneesPage} />
        <Route path={navigationPages.TransmettreVosDonnees.path} exact component={TransmettreVosDonneesPage} />
        <Route path={navigationPages.ComprendreLesDonnees.path} exact component={ComprendreLesDonnees} />
        <Route path={navigationPages.ConsulterVosDonnees.path} exact component={ConsulterVosDonneesPage} />

        {/* Secured By Token Pages */}
        <Route exact path={`${navigationPages.Cfa.path}/:accessToken`} component={CfaWithoutNetworkPage} />

        {/* Secured By Auth Pages */}
        <ProtectedRoute
          path={navigationPages.TableauDeBord.path}
          exact
          component={TableauDeBordPage}
          authorizedRoles={[roles.administrator, roles.pilot, roles.network]}
        />
        <ProtectedRoute
          authorizedRoles={[roles.administrator]}
          path={navigationPages.Stats.path}
          exact
          component={GlobalStatsPage}
        />
        <ProtectedRoute
          authorizedRoles={[roles.administrator]}
          path={`${navigationPages.Stats.path}/:dataSource`}
          component={UserStatsPage}
        />

        {/* Not found page */}
        <Route component={() => <div>404 - Page not found</div>} />
      </Switch>
    </Router>
  );
};

export default App;
