import React from "react";
import { Site, Nav } from "tabler-react";
import useAuth from "../common/hooks/useAuth";
import { useHistory } from "react-router-dom";

export default (props) => {
  let [auth, setAuth] = useAuth();
  let history = useHistory();
  let logout = () => {
    setAuth(null);
    history.push("/login");
  };

  return (
    <Site>
      <Site.Header>
        Template App
        <div className="d-flex order-lg-2 ml-auto">
          <Nav.Item hasSubNav value={auth.sub} icon="user">
            <a className="dropdown-item" onClick={logout}>
              Déconnexion
            </a>
          </Nav.Item>
        </div>
      </Site.Header>
      {props.children}
    </Site>
  );
};
