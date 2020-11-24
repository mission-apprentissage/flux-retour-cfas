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
import DashboardTablerPage from "./pages/sample/DashboardTablerPage";
import SamplePage from "./pages/sample/SamplePage";
import BasicTablePage from "./pages/sample/BasicTablePage";
import BasicBootstrapPage from "./pages/sample/BasicBootstrapPage";
import HomePage from "./pages/HomePage";

import useAuth from "./common/hooks/useAuth";
import { roles, isUserInRole } from "./common/utils/rolesUtils";

export default () => {
  let [auth] = useAuth();
  return (
    <Router>
      <Switch>
        {getPrivateRouteForRole("/", <DashboardPage />, roles.administrator, auth)}
        {getPrivateRouteForRole("/ds-dashboard", <DsDashboardPage />, roles.administrator, auth)}
        {getPrivateRouteForRole("/ds-siret-sirens-manquants", <DsMissingSirensSiretsPage />, roles.administrator, auth)}
        {getPrivateRouteForRole("/ds-commentaires", <DsCommentairesPage />, roles.administrator, auth)}

        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/sample" component={SamplePage} />
        <Route exact path="/basic-table" component={BasicTablePage} />
        <Route exact path="/basic-bootstrap-table" component={BasicBootstrapPage} />
        <Route exact path="/dashboard-tabler" component={DashboardTablerPage} />
        <Route exact path="/reset-password" component={ResetPasswordPage} />
        <Route exact path="/forgotten-password" component={ForgottenPasswordPage} />
      </Switch>
    </Router>
  );
};

function PrivateRoute({ children, ...rest }) {
  let [auth] = useAuth();

  return (
    <Route
      {...rest}
      render={() => {
        return auth.sub !== "anonymous" ? children : <Redirect to="/login" />;
      }}
    />
  );
}

const getPrivateRouteForRole = (route, page, currentRole, auth) => (
  <PrivateRoute exact path={route}>
    {isUserInRole(auth, currentRole) ? page : <HomePage />}
  </PrivateRoute>
);
