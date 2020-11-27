import React from "react";
import { Site, Nav } from "tabler-react";
import useAuth from "../../common/hooks/useAuth";
import { useHistory } from "react-router-dom";
import packageJson from "../../../package.json";
import { NavLink } from "react-router-dom";

const LayoutUser = (props) => {
  let [auth, setAuth] = useAuth();
  let history = useHistory();
  let logout = () => {
    setAuth(null);
    history.push("/login");
  };

  return (
    <Site className="flex-fill">
      <Site.Header>
        <a className="header-brand" href="./index.html">
          <img src="/brand/flux-cfas.png" className="header-brand-img" alt="tabler logo" />
        </a>
        <div className="d-flex order-lg-2 ml-auto">
          <Nav.Item hasSubNav value={auth.sub}>
            <a className="dropdown-item" onClick={logout}>
              Déconnexion
            </a>
          </Nav.Item>
        </div>
      </Site.Header>

      <Site.Nav>
        <div className="row row align-items-center">
          <div className="col-lg-3 ml-auto"></div>
          <div className="col col-lg order-lg-first">
            <ul className="nav nav-tabs border-0 flex-column flex-lg-row">
              <li className="nav-item">
                <NavLink className="nav-link" to="/" activeClassName="active">
                  <i className="fe fe-home"></i> Accueil
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </Site.Nav>

      {props.children}

      {/* Footer Menu */}
      <footer className="footer">
        <div className="container">
          <div className="row align-items-center flex-row-reverse">
            <div className="col-auto ml-lg-auto">
              <div className="row align-items-center">
                <div className="col-auto">
                  <ul className="list-inline list-inline-dots mb-0">
                    <li className="list-inline-item">
                      <a href="https://mission-apprentissage.gitbook.io/" target="_blank">
                        Documentation
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="col-auto">
                  <a
                    href="https://github.com/mission-apprentissage/flux-retour-cfas"
                    target="_blank"
                    className="btn btn-outline-primary btn-sm"
                  >
                    Code source
                  </a>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-auto mt-3 mt-lg-0 text-center">
              <a href="https://beta.gouv.fr/startups/apprentissage.html" target="_blank">
                Mission Nationale pour l'apprentissage
              </a>{" "}
              - © {`${new Date().getFullYear()}`} - Version {packageJson.version}
            </div>
          </div>
        </div>
      </footer>
    </Site>
  );
};

export default LayoutUser;
