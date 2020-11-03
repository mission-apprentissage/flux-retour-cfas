import React from "react";
import { Site } from "tabler-react";
import useAuth from "../../../common/hooks/useAuth";
import { NavLink } from "react-router-dom";
import { roles, isUserInRole } from "../../../common/utils/rolesUtils";

export default () => {
  let [auth, setAuth] = useAuth();

  return (
    <Site.Nav>
      <div className="row row align-items-center">
        <div className="col-lg-3 ml-auto"></div>
        <div className="col col-lg order-lg-first">
          <ul className="nav nav-tabs border-0 flex-column flex-lg-row">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" exact={true} activeClassName="active">
                <i className="fe fe-box"></i> Accueil
              </NavLink>
            </li>

            {isUserInRole(auth, roles.administrator) && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/enquete-ds" activeClassName="active">
                  <i className="fe fe-box"></i> Enquête DS
                </NavLink>
              </li>
            )}

            <li className="nav-item">
              <NavLink className="nav-link" to="/sample" activeClassName="active">
                <i className="fe fe-check"></i> Page Exemple
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </Site.Nav>
  );
};
