import React from "react";
import { NavLink } from "react-router-dom";
import { Site } from "tabler-react";

import useAuth from "../../../common/hooks/useAuth";
import { isUserInRole, roles } from "../../../common/utils/rolesUtils";

const NavigationMenu = () => {
  let [auth] = useAuth();

  return (
    <Site.Nav>
      <div className="header collapse d-lg-flex p-0" id="headerMenuCollapse">
        <div className="container">
          <div className="row row align-items-center">
            <div className="col-lg-3 ml-auto"></div>
            <div className="col col-lg order-lg-first">
              <ul className="nav nav-tabs border-0 flex-column flex-lg-row">
                <li className="nav-item">
                  <NavLink className="nav-link" to="/" exact={true} activeClassName="active">
                    <i className="fe fe-home"></i> Accueil
                  </NavLink>
                </li>

                {isUserInRole(auth, roles.administrator) && (
                  <>
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/stats/gesti" activeClassName="active">
                        <i className="fe fe-box"></i> Stats Gesti
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/stats/ymag" activeClassName="active">
                        <i className="fe fe-box"></i> Stats Ymag
                      </NavLink>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Site.Nav>
  );
};

export default NavigationMenu;
