import React from "react";
import { Page, Site, Nav } from "tabler-react";
import { useFetch } from "../common/hooks/useFetch";

export default () => {
  const [data, loading] = useFetch("api/statsDs");

  return (
    <Site>
      <Site.Header>
        Flux Retour Cfas
        <div className="d-flex order-lg-2 ml-auto">
          <Nav.Item hasSubNav icon="user">
            <a className="dropdown-item">Déconnexion</a>
          </Nav.Item>
        </div>
      </Site.Header>
      <Page>
        <Page.Main>
          <Page.Content title="Tableau de bord - Enquete Ds"></Page.Content>
        </Page.Main>
      </Page>
    </Site>
  );
};
