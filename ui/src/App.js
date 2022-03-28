import * as React from "react";
import { BrowserRouter as Router, Route, Switch, useLocation } from "react-router-dom";

import ProtectedRoute from "./common/auth/ProtectedRoute";
import { roles } from "./common/auth/roles";
import { NAVIGATION_PAGES } from "./common/constants/navigationPages";
import GestionUtilisateursPage from "./pages/gestion-utilisateurs/GestionUtilisateursPage";
import { HomePage, ProtectionDonneesPersonnellesPage } from "./pages/home/";
import LoginPage from "./pages/login/LoginPage";
import { ModifierMotDePassePage } from "./pages/modifier-mot-de-passe";
import StatistiquesPage from "./pages/statistiques/StatistiquesPage";
import SupportPage from "./pages/support/SupportPage";
import ComprendreLesDonnees from "./pages/tableau-de-bord/ComprendreLesDonnees";
import TableauDeBordPage from "./pages/tableau-de-bord/TableauDeBordPage";
import CfaPrivatePage from "./pages/tableau-de-bord/views/CfaPrivateView";
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
  }, [location.pathname, location.hash]);
  return null;
};

const App = () => {
  return (
    <Router>
      <ScrollToTopOnRouteChange />
      <Switch>
        {/* Public pages */}
        <Route exact path="/" component={HomePage} />
        <Route exact path={NAVIGATION_PAGES.Statistiques.path} component={StatistiquesPage} />
        <Route exact path={NAVIGATION_PAGES.Support.path} component={SupportPage} />
        <Route exact path={NAVIGATION_PAGES.Login.path} component={LoginPage} />
        <Route
          exact
          path={NAVIGATION_PAGES.TransmettreEtConsulterVosDonnees.path}
          component={TransmettreConsulterVosDonneesPage}
        />
        <Route path={NAVIGATION_PAGES.ConsulterVosDonnees.path} exact component={ConsulterVosDonneesPage} />
        <Route path={NAVIGATION_PAGES.TransmettreVosDonnees.path} exact component={TransmettreVosDonneesPage} />
        <Route path={NAVIGATION_PAGES.ComprendreLesDonnees.path} exact component={ComprendreLesDonnees} />
        <Route path={NAVIGATION_PAGES.ConsulterVosDonnees.path} exact component={ConsulterVosDonneesPage} />

        {/* Secured By Token Pages */}
        <Route exact path={`${NAVIGATION_PAGES.Cfa.path}/:accessToken`} component={CfaPrivatePage} />
        {/* Workaround because we sent some links with /cfas/xxx and others with /cfa/xxx */}
        <Route exact path={`/cfa/:accessToken`} component={CfaPrivatePage} />
        <Route path={NAVIGATION_PAGES.DonneesPersonnelles.path} exact component={ProtectionDonneesPersonnellesPage} />

        {/* Secured By Auth Pages */}
        <ProtectedRoute
          path={NAVIGATION_PAGES.TableauDeBord.path}
          exact
          component={TableauDeBordPage}
          authorizedRoles={[roles.administrator, roles.pilot, roles.network]}
        />

        {/* ADMIN ONLY*/}
        <ProtectedRoute
          path={NAVIGATION_PAGES.GestionUtilisateurs.path}
          exact
          component={GestionUtilisateursPage}
          authorizedRoles={[roles.administrator]}
        />

        {/* Change password */}
        <Route path={NAVIGATION_PAGES.ModifierMotDePasse.path} exact component={ModifierMotDePassePage} />

        {/* Not found page */}
        <Route component={() => <div>404 - Page not found</div>} />
      </Switch>
    </Router>
  );
};

export default App;
