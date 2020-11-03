import React from "react";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import "tabler-react/dist/Tabler.css";

import LoginPage from "./pages/login/LoginPage";
import ResetPasswordPage from "./pages/password/ResetPasswordPage";
import ForgottenPasswordPage from "./pages/password/ForgottenPasswordPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import DashboardDsPage from "./pages/enqueteDs/DashboardDsPage";
import MissingSirensSiretsPage from "./pages/enqueteDs/MissingSirensSiretsPage";
import DashboardTablerPage from "./pages/sample/DashboardTablerPage";
import SamplePage from "./pages/sample/SamplePage";
import HomePage from "./pages/HomePage";

import useAuth from "./common/hooks/useAuth";
import { roles, isUserInRole } from "./common/utils/rolesUtils";

export default () => {
  let [auth] = useAuth();
  return (
    <Router>
      <Switch>
        {getPrivateRouteForRole("/", <DashboardPage />, roles.administrator, auth)}
        {getPrivateRouteForRole("/enquete-ds", <DashboardDsPage />, roles.administrator, auth)}
        {getPrivateRouteForRole("/ds-siret-sirens-manquants", <MissingSirensSiretsPage />, roles.administrator, auth)}

        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/sample" component={SamplePage} />
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
