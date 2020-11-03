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

export default () => {
  let [auth] = useAuth();
  return (
    <div className="App">
      <Router>
        <Switch>
          <PrivateRoute exact path="/">
            {isUserInRole(auth, roles.administrator) ? <DashboardPage /> : <HomePage />}
          </PrivateRoute>
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/sample" component={SamplePage} />
          <Route exact path="/enquete-ds/" component={DashboardDsPage} />
          <Route exact path="/enquete-ds/siret-siren-manquants" component={MissingSirensSiretsPage} />
          <Route exact path="/dashboard-tabler" component={DashboardTablerPage} />
          <Route exact path="/reset-password" component={ResetPasswordPage} />
          <Route exact path="/forgotten-password" component={ForgottenPasswordPage} />
        </Switch>
      </Router>
    </div>
  );
};
