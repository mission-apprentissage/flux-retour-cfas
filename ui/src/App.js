import React from "react";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import "tabler-react/dist/Tabler.css";

import LoginPage from "./pages/login/LoginPage";
import ResetPasswordPage from "./pages/password/ResetPasswordPage";
import ForgottenPasswordPage from "./pages/password/ForgottenPasswordPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import DsDashboardPage from "./pages/ds/DsDashboardPage";
import DsMissingSirensSiretsPage from "./pages/ds/DsMissingSirensSiretsPage";
import DsCommentairesPage from "./pages/ds/DsCommentairesPage";
import HomePage from "./pages/HomePage";

import useAuth from "./common/hooks/useAuth";
import { roles, isUserInRole } from "./common/utils/rolesUtils";
import { anonymous } from "./common/auth";
import UserStatsPage from "./pages/user-stats";

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/login" component={LoginPage} />
        <AdminRoute path="/" exact>
          <DashboardPage />
        </AdminRoute>
        <AdminRoute path="/ds-dashboard" exact>
          <DsDashboardPage />
        </AdminRoute>
        <AdminRoute path="/ds-siret-sirens-manquants" exact>
          <DsMissingSirensSiretsPage />
        </AdminRoute>
        <AdminRoute path="/ds-commentaires" exact>
          <DsCommentairesPage />
        </AdminRoute>

        <PrivateRoute path="/stats/:dataSource" component={UserStatsPage} />

        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/reset-password" component={ResetPasswordPage} />
        <Route exact path="/forgotten-password" component={ForgottenPasswordPage} />

        <Route exact path="/statuts-candidats/stats" />
      </Switch>
    </Router>
  );
};

export default App;

const PrivateRoute = ({ children, ...rest }) => {
  const [auth] = useAuth();

  return <Route {...rest}>{auth.sub === anonymous.sub ? <Redirect to="/login" /> : children}</Route>;
};

const AdminRoute = ({ children, ...rest }) => {
  const [auth] = useAuth();

  return <PrivateRoute {...rest}>{isUserInRole(auth, roles.administrator) ? children : <HomePage />}</PrivateRoute>;
};
