import React from "react";
import { Site, Dropdown } from "tabler-react";
import useAuth from "../../../common/hooks/useAuth";
import { useHistory } from "react-router-dom";

const Header = () => {
  let [auth, setAuth] = useAuth();
  let history = useHistory();
  let logout = () => {
    setAuth(null);
    history.push("/login");
  };

  return (
    <Site.Header>
      {/* Logo */}
      <a className="header-brand" href="/">
        <img src="/brand/flux-cfas.png" className="header-brand-img" alt="tabler logo" />
      </a>

      {/* User Menu */}
      <div className="d-flex order-lg-2 ml-auto">
        <Dropdown
          arrow
          arrowPosition="right"
          trigger={
            <Dropdown.Trigger arrow toggle={false}>
              <span href="#" className="nav-link pr-0 leading-none" data-toggle="dropdown">
                <span className="avatar" style={{ backgroundImage: "url(./faces/default.png)" }}></span>
                <span className="ml-2 d-none d-lg-block">
                  <span className="text-default">{auth.sub}</span>
                  <small className="text-muted d-block mt-1">Administrateur</small>
                </span>
              </span>
            </Dropdown.Trigger>
          }
          position="bottom"
          items={
            <React.Fragment>
              <Dropdown.Item icon="home" to="/">
                Accueil
              </Dropdown.Item>
              <Dropdown.ItemDivider />
              <Dropdown.Item icon="log-out" to="#" onClick={logout}>
                <span href="#" onClick={logout}>
                  Déconnexion
                </span>
              </Dropdown.Item>
            </React.Fragment>
          }
        />
      </div>
    </Site.Header>
  );
};

export default Header;
