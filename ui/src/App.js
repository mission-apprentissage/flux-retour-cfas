import * as React from "react";
import { BrowserRouter as Router, Route, Switch, useLocation } from "react-router-dom";

import ProtectedRoute from "./common/auth/ProtectedRoute";
import { roles } from "./common/auth/roles";
import { navigationPages } from "./common/constants/navigationPages";
import { HomePage, ProtectionDonneesPersonnellesPage } from "./pages/home/";
import LoginPage from "./pages/login/LoginPage";
import ComprendreLesDonnees from "./pages/tableau-de-bord/ComprendreLesDonnees";
import TableauDeBordPage from "./pages/tableau-de-bord/TableauDeBordPage";
import CfaWithoutNetworkPage from "./pages/tableau-de-bord/views/CfaWithoutNetwork";
import {
  ConsulterVosDonneesPage,
  TransmettreConsulterVosDonneesPage,
  TransmettreVosDonneesPage,
} from "./pages/transmettre-consulter-vos-donnees";

const ScrollToTopOnRouteChange = () => {
  const location = useLocation();
  React.useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);
  return null;
};

const App = () => {
  return (
    <Router>
      <ScrollToTopOnRouteChange />
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
        <Route path={navigationPages.DonneesPersonnelles.path} exact component={ProtectionDonneesPersonnellesPage} />

        {/* Secured By Auth Pages */}
        <ProtectedRoute
          path={navigationPages.TableauDeBord.path}
          exact
          component={TableauDeBordPage}
          authorizedRoles={[roles.administrator, roles.pilot, roles.network]}
        />

        {/* Not found page */}
        <Route component={() => <div>404 - Page not found</div>} />
      </Switch>
    </Router>
  );
};

export default App;
