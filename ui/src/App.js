import * as React from "react";
import { BrowserRouter as Router, Route, Switch, useLocation } from "react-router-dom";

import ProtectedRoute from "./common/auth/ProtectedRoute";
import { roles } from "./common/auth/roles";
import { NAVIGATION_PAGES } from "./common/constants/navigationPages";
import Page404 from "./pages/404/Page404";
import GestionReseauxCfasPage from "./pages/admin/gestion-reseaux-cfas/GestionReseauCfaPage";
import GestionUtilisateursPage from "./pages/admin/gestion-utilisateurs/GestionUtilisateursPage";
import CfaPrivatePage from "./pages/app/visualiser-les-indicateurs/cfa-private";
import VisualiserLesIndicateursParFormationPage from "./pages/app/visualiser-les-indicateurs/par-formation";
import VisualiserLesIndicateursParOrganismePage from "./pages/app/visualiser-les-indicateurs/par-organisme";
import VisualiserLesIndicateursParReseauPage from "./pages/app/visualiser-les-indicateurs/par-reseau";
import VisualiserLesIndicateursParTerritoirePage from "./pages/app/visualiser-les-indicateurs/par-territoire";
import VisualiserLesIndicateursPage from "./pages/app/visualiser-les-indicateurs/VisualiserLesIndicateursPage";
import CguPage from "./pages/cgu/CguPage";
import ComprendreLesDonneesPage from "./pages/comprendre-les-donnees/ComprendreLesDonneesPage";
import ExplorerLesIndicateursPage from "./pages/explorer-les-indicateurs/ExplorerLesIndicateursPage";
import { HomePage, PolitiqueDeConfidentialitePage } from "./pages/home/";
import JournalDesEvolutionsPage from "./pages/journal-des-evolutions/JournalDesEvolutionsPage";
import LoginPage from "./pages/login/LoginPage";
import MentionsLegalesPage from "./pages/mentions-legales/MentionsLegalesPage";
import { ModifierMotDePassePage } from "./pages/modifier-mot-de-passe";
import {
  CommentConsulterEtVerifierLesDonneesPage,
  CommentTransmettreVosDonneesPage,
  OrganismeFormationPage,
  SupportPage,
} from "./pages/organisme-formation";
import {
  CommentFonctionneLeTdbPage,
  ContacterLequipeDuTdbPage,
  QuestCeQueLeTdbPage,
  QuestionsReponsesPage,
} from "./pages/questions-reponses/index";
import StatistiquesPage from "./pages/statistiques/StatistiquesPage";

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
        <Route exact path={NAVIGATION_PAGES.Login.path} component={LoginPage} />

        {/* Organisme section & pages */}
        <Route exact path={NAVIGATION_PAGES.OrganismeFormation.path} component={OrganismeFormationPage} />
        <Route
          exact
          path={NAVIGATION_PAGES.OrganismeFormation.transmettre.path}
          component={CommentTransmettreVosDonneesPage}
        />
        <Route
          exact
          path={NAVIGATION_PAGES.OrganismeFormation.consulter.path}
          component={CommentConsulterEtVerifierLesDonneesPage}
        />
        <Route exact path={NAVIGATION_PAGES.OrganismeFormation.aide.path} component={SupportPage} />

        <Route path={NAVIGATION_PAGES.ComprendreLesDonnees.path} exact component={ComprendreLesDonneesPage} />
        <Route path={NAVIGATION_PAGES.ExplorerLesIndicateurs.path} exact component={ExplorerLesIndicateursPage} />
        <Route path={NAVIGATION_PAGES.JournalDesEvolutions.path} exact component={JournalDesEvolutionsPage} />
        <Route path={NAVIGATION_PAGES.MentionsLegales.path} exact component={MentionsLegalesPage} />

        <Route path={NAVIGATION_PAGES.QuestionsReponses.path} exact component={QuestionsReponsesPage} />
        <Route path={NAVIGATION_PAGES.QuestionsReponses.QuestCeQueLeTdb.path} exact component={QuestCeQueLeTdbPage} />
        <Route
          path={NAVIGATION_PAGES.QuestionsReponses.CommentFonctionneLeTdb.path}
          exact
          component={CommentFonctionneLeTdbPage}
        />
        <Route
          path={NAVIGATION_PAGES.QuestionsReponses.ContacterLequipeDuTdb.path}
          exact
          component={ContacterLequipeDuTdbPage}
        />

        {/* Secured By Token Pages */}
        <Route exact path={`${NAVIGATION_PAGES.Cfa.path}/:accessToken`} component={CfaPrivatePage} />
        <Route
          path={NAVIGATION_PAGES.PolitiqueDeConfidentialite.path}
          exact
          component={PolitiqueDeConfidentialitePage}
        />

        <Route path={NAVIGATION_PAGES.CGU.path} exact component={CguPage} />

        {/* Secured By Auth Pages */}
        <ProtectedRoute
          path={NAVIGATION_PAGES.VisualiserLesIndicateurs.path}
          exact
          component={VisualiserLesIndicateursPage}
          authorizedRoles={[roles.administrator, roles.pilot, roles.network]}
        />
        <ProtectedRoute
          path={NAVIGATION_PAGES.VisualiserLesIndicateursParTerritoire.path}
          exact
          component={VisualiserLesIndicateursParTerritoirePage}
          authorizedRoles={[roles.administrator, roles.pilot, roles.network]}
        />
        <ProtectedRoute
          path={NAVIGATION_PAGES.VisualiserLesIndicateursParReseau.path}
          exact
          component={VisualiserLesIndicateursParReseauPage}
          authorizedRoles={[roles.administrator, roles.pilot, roles.network]}
        />
        <ProtectedRoute
          path={NAVIGATION_PAGES.VisualiserLesIndicateursParOrganisme.path}
          exact
          component={VisualiserLesIndicateursParOrganismePage}
          authorizedRoles={[roles.administrator, roles.pilot, roles.network]}
        />
        <ProtectedRoute
          path={NAVIGATION_PAGES.VisualiserLesIndicateursParFormation.path}
          exact
          component={VisualiserLesIndicateursParFormationPage}
          authorizedRoles={[roles.administrator, roles.pilot, roles.network]}
        />

        {/* ADMIN ONLY*/}
        <ProtectedRoute
          path={NAVIGATION_PAGES.GestionUtilisateurs.path}
          exact
          component={GestionUtilisateursPage}
          authorizedRoles={[roles.administrator]}
        />
        <ProtectedRoute
          path={NAVIGATION_PAGES.GestionReseauxCfas.path}
          exact
          component={GestionReseauxCfasPage}
          authorizedRoles={[roles.administrator]}
        />
        {/* Change password */}
        <Route path={NAVIGATION_PAGES.ModifierMotDePasse.path} exact component={ModifierMotDePassePage} />

        {/* Not found page */}
        <Route component={Page404} />
      </Switch>
    </Router>
  );
};

export default App;
