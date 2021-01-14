import * as React from "react";
import { BrowserRouter as Router, Redirect, Route, Switch } from "react-router-dom";

import { anonymous } from "./common/auth";
import useAuth from "./common/hooks/useAuth";
import { isUserAdmin } from "./common/utils/rolesUtils";
import LoginPage from "./pages/login/LoginPage";
import ForgottenPasswordPage from "./pages/password/ForgottenPasswordPage";
import ResetPasswordPage from "./pages/password/ResetPasswordPage";
import GlobalStatsPage from "./pages/stats/GlobalStatsPage";
import UserStatsPage from "./pages/user-stats";

const App = () => {
  const [auth] = useAuth();
  const isAdmin = isUserAdmin(auth);

  return (
    <Router>
      <Switch>
        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/reset-password" component={ResetPasswordPage} />
        <Route exact path="/forgotten-password" component={ForgottenPasswordPage} />

        <PrivateRoute exact path="/">
          <Redirect to={isAdmin ? "/stats" : "/stats/gesti"} />
        </PrivateRoute>

        <AdminRoute path="/stats" exact component={GlobalStatsPage} />
        <PrivateRoute path="/stats/:dataSource" component={UserStatsPage} />

        <Route component={() => <div>404</div>} />
      </Switch>
    </Router>
  );
};

export default App;

const PrivateRoute = (routeProps) => {
  const [auth] = useAuth();
  const notLoggedIn = auth.sub === anonymous.sub;

  return notLoggedIn ? <Redirect to="/login" /> : <Route {...routeProps} />;
};

const AdminRoute = (routeProps) => {
  const [auth] = useAuth();
  const isAdmin = isUserAdmin(auth);

  return <PrivateRoute {...routeProps}>{isAdmin ? null : <Redirect to="/" />}</PrivateRoute>;
};
