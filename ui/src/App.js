import "tabler-react/dist/Tabler.css";

import React from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";

import { anonymous } from "./common/auth";
import useAuth from "./common/hooks/useAuth";
import { isUserInRole, roles } from "./common/utils/rolesUtils";
import DashboardPage from "./pages/dashboard/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/login/LoginPage";
import ForgottenPasswordPage from "./pages/password/ForgottenPasswordPage";
import ResetPasswordPage from "./pages/password/ResetPasswordPage";
import UserStatsPage from "./pages/user-stats";

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/login" component={LoginPage} />
        <AdminRoute path="/" exact>
          <DashboardPage />
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
