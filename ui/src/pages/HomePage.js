import React from "react";
import { Alert, Grid, Header, Page } from "tabler-react";

import LayoutUser from "./layout/LayoutUser";

const HomePage = () => {
  return (
    <LayoutUser>
      <Page>
        <Page.Main>
          <Page.Content>
            <Grid.Row>
              <Grid.Col width={12}>
                <Alert type="warning">
                  <Header.H1>Accueil</Header.H1>
                  <p>Page d&apos;accueil utilisateur.</p>
                </Alert>
              </Grid.Col>
            </Grid.Row>
          </Page.Content>
        </Page.Main>
      </Page>
    </LayoutUser>
  );
};

export default HomePage;
