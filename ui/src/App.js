import React from "react";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Layout from "./pages/Layout";
import "tabler-react/dist/Tabler.css";
import DashboardPage from "./pages/DashboardPage";
import DashboardDsPage from "./pages/DashboardDsPage";
import DashboardTablerPage from "./pages/DashboardTablerPage";
import SamplePage from "./pages/SamplePage";
import useAuth from "./common/hooks/useAuth";
import HomePage from "./pages/HomePage";
import ResetPasswordPage from "./pages/password/ResetPasswordPage";
import ForgottenPasswordPage from "./pages/password/ForgottenPasswordPage";
import { administrator } from "./common/utils/roles";
import { some } from "lodash";

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
            <Layout>
              {auth && auth.permissions && some(auth.permissions, (item) => administrator.includes(item)) ? (
                <DashboardPage />
              ) : (
                <HomePage />
              )}
            </Layout>
          </PrivateRoute>
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/sample" component={SamplePage} />
          <Route exact path="/dashboard-ds" component={DashboardDsPage} />
          <Route exact path="/dashboard-tabler" component={DashboardTablerPage} />
          <Route exact path="/reset-password" component={ResetPasswordPage} />
          <Route exact path="/forgotten-password" component={ForgottenPasswordPage} />
        </Switch>
      </Router>
    </div>
  );
};
