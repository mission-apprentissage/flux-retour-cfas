import PropTypes from "prop-types";
import { Redirect, Route } from "react-router";

import useAuth from "../hooks/useAuth";
import { hasUserRoles } from "./roles";

const ProtectedRoute = ({ authorizedRoles = [], ...routeProps }) => {
  const [auth] = useAuth();
  const isLoggedIn = Boolean(auth?.sub);

  if (!isLoggedIn) {
    const loginPath = `/login?redirect=${encodeURIComponent(routeProps.location.pathname)}`;
    return <Redirect to={loginPath} />;
  }

  return hasUserRoles(auth, authorizedRoles) ? <Route {...routeProps} /> : <div>403 not authorized</div>;
};

ProtectedRoute.propTypes = {
  authorizedRoles: PropTypes.arrayOf(PropTypes.string.isRequired),
};

export default ProtectedRoute;
