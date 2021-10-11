import { Redirect, Route } from "react-router";

import useAuth from "../hooks/useAuth";
import { isUserAuthorizedForRoles } from "./roles";

export const ProtectedRoute = (routeProps) => {
  const [auth] = useAuth();
  const loginPath = `/login?redirect=${encodeURIComponent(routeProps.location.pathname)}`;
  return auth?.sub ? <Route {...routeProps} /> : <Redirect to={loginPath} />;
};

export const ProtectedRolesRoute = (routeProps) => {
  const [auth] = useAuth();
  const { authorizedRoles } = routeProps;
  return (
    <ProtectedRoute {...routeProps}>
      {isUserAuthorizedForRoles(auth, authorizedRoles) ? null : <Redirect to="/" />}
    </ProtectedRoute>
  );
};
