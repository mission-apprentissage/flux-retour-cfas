import React from "react";
import { Site, AccountDropdown } from "tabler-react";
import useAuth from "../../../common/hooks/useAuth";
import { useHistory } from "react-router-dom";

export default () => {
  let [auth, setAuth] = useAuth();
  let history = useHistory();
  let logout = () => {
    setAuth(null);
    history.push("/login");
  };

  return (
    <Site.Header>
      <a className="header-brand" href="./index.html">
        <img src="/brand/flux-cfas.png" className="header-brand-img" alt="tabler logo" />
      </a>
      <div className="d-flex order-lg-2 ml-auto">
        <AccountDropdown
          avatarURL="./faces/default.png"
          name={auth.sub}
          description="Administrateur"
          options={[
            { icon: "home", value: "Accueil", to: "/" },
            "divider",
            { icon: "log-out", value: "Déconnexion", to: "/", onClick: { logout } },
          ]}
        />
      </div>
    </Site.Header>
  );
};
