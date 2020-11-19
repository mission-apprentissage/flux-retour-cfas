import React from "react";
import { Page, Header, Icon, Grid, Card, Table, Alert, StampCard } from "tabler-react";
import { useFetch } from "../../common/hooks/useFetch";
import Layout from "../layout/Layout";

export default () => {
  const [data, loading] = useFetch("api/stats");

  return (
    <Layout>
      <Page>
        <Page.Main>
          <Page.Content title="Tableau de bord">
            {loading && "Chargement des données..."}
            {data && (
              <>
                {/* Stats Candidats */}
                <Header.H5>Statistiques Candidats</Header.H5>
                <Alert type="primary" icon="info">
                  Statistiques des candidats identifiés dans le système
                </Alert>
                <Grid.Row cards={true}>
                  <Grid.Col sm={6} lg={3}>
                    <StampCard
                      color="blue"
                      icon="users"
                      header={`${data.stats.nbCfas} CFAs au total`}
                      footer={"Nb total de CFAs"}
                    />
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row cards={true}>
                  <Grid.Col sm={6} lg={3}>
                    <StampCard
                      color="blue"
                      icon="users"
                      header={`${data.stats.nbDistinctCandidatsTotal} candidats au total`}
                      footer={"Nb total de candidats"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={3}>
                    <StampCard
                      color="blue"
                      icon="file-text"
                      header={`${data.stats.nbDistinctCandidatsWithIne} numéros INE distincts`}
                      footer={"Nb total de n° INE"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={3}>
                    <StampCard
                      color="yellow"
                      icon="home"
                      header={`${data.stats.nbCandidatsMultiUais} candidats multi-UAIs`}
                      footer={"Candidats sur plusieurs UAIs"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={3}>
                    <StampCard
                      color="yellow"
                      icon="award"
                      header={`${data.stats.nbCandidatsMultiCfds} candidats multi-CFD`}
                      footer={"Candidats sur plusieurs CFD"}
                    />
                  </Grid.Col>
                </Grid.Row>

                {/* Stats Statuts Candidats */}
                <Header.H5>Statistiques Statuts Candidats</Header.H5>
                <Alert type="primary" icon="info">
                  Statistiques des statuts bruts identifiés dans le système
                </Alert>
                <Grid.Row cards={true}>
                  <Grid.Col sm={6} lg={6}>
                    <StampCard
                      color="red"
                      icon="bar-chart"
                      header={`${data.stats.nbStatutsCandidats} statuts Total`}
                      footer={"Total des statuts candidats"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={6}>
                    <StampCard
                      color="orange"
                      icon="alert-circle"
                      header={`${data.stats.nbStatutsSansIne} statuts sans INE`}
                      footer={"Numéro INE inconnu"}
                    />
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row cards={true}>
                  <Grid.Col sm={6} lg={3}>
                    <StampCard
                      color="green"
                      icon="user"
                      header={`${data.stats.nbStatutsProspect} statuts Prospect`}
                      footer={"Statuts de candidats prospects"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={3}>
                    <StampCard
                      color="green"
                      icon="user-plus"
                      header={`${data.stats.nbStatutsInscrits} statuts Inscrits`}
                      footer={"Statuts de candidats inscrits"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={3}>
                    <StampCard
                      color="blue"
                      icon="user-check"
                      header={`${data.stats.nbStatutsApprentis} statuts Apprentis`}
                      footer={"Statuts de candidats apprentis"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={3}>
                    <StampCard
                      color="orange"
                      icon="user-x"
                      header={`${data.stats.nbStatutsAbandon} statuts Abandons`}
                      footer={"Statuts de candidats en abandon"}
                    />
                  </Grid.Col>
                </Grid.Row>

                {/* Stats Mises à jour */}
                <Header.H5>Statistiques Mises à jour</Header.H5>
                <Alert type="primary" icon="info">
                  Statistiques des mises à jour des statuts
                </Alert>
                <Grid.Row cards={true}>
                  <Grid.Col sm={6} lg={6}>
                    <StampCard
                      color="red"
                      icon="arrow-down-circle"
                      header={`${data.stats.nbStatutsCandidatsMisAJour} statuts mis à jour`}
                      footer={"Total des statuts mis à jour"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={6}>
                    <StampCard
                      color="orange"
                      icon="x-circle"
                      header={`${data.stats.nbStatutsWithoutHistory} statuts sans mises à jour`}
                      footer={"Total des statuts sans mises à jour"}
                    />
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row cards={true}>
                  <Grid.Col sm={6} lg={4}>
                    <StampCard
                      color="green"
                      icon="arrow-down-circle"
                      header={`${data.stats.nbDistinctCandidatsWithChangingStatutProspectInscrit} Prospects vers Inscrits`}
                      footer={"Candidats passés de prospect à inscrit"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={4}>
                    <StampCard
                      color="green"
                      icon="arrow-down-circle"
                      header={`${data.stats.nbDistinctCandidatsWithChangingStatutProspectApprenti} Prospects vers Apprentis`}
                      footer={"Candidats passés de prospect à apprenti"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={4}>
                    <StampCard
                      color="green"
                      icon="arrow-down-circle"
                      header={`${data.stats.nbDistinctCandidatsWithChangingStatutProspectAbandon} Prospects vers Abandon`}
                      footer={"Candidats passés de prospect à abandon"}
                    />
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row cards={true}>
                  <Grid.Col sm={6} lg={4}>
                    <StampCard
                      color="blue"
                      icon="arrow-up-circle"
                      header={`${data.stats.nbDistinctCandidatsWithStatutHistory1} candidats avec 1 maj`}
                      footer={"Statut mis à jour 1 fois"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={4}>
                    <StampCard
                      color="blue"
                      icon="arrow-up-circle"
                      header={`${data.stats.nbDistinctCandidatsWithStatutHistory2} candidats avec 2 maj`}
                      footer={"Statut mis à jour 2 fois"}
                    />
                  </Grid.Col>
                  <Grid.Col sm={6} lg={4}>
                    <StampCard
                      color="blue"
                      icon="arrow-up-circle"
                      header={`${data.stats.nbDistinctCandidatsWithStatutHistory3} candidats avec 3 maj`}
                      footer={"Statut mis à jour 3 fois"}
                    />
                  </Grid.Col>
                </Grid.Row>
              </>
            )}
          </Page.Content>
        </Page.Main>
      </Page>
    </Layout>
  );
};

const getUaisNbStatutsRepartition = (title, repartitionData) => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Table>
        <Table.Header>
          <Table.ColHeader>UAI</Table.ColHeader>
          <Table.ColHeader>Nb de statuts</Table.ColHeader>
        </Table.Header>
        <Table.Body>
          {repartitionData.map((value) => {
            return (
              <Table.Row>
                <Table.Col>{value.uai_etablissement}</Table.Col>
                <Table.Col>{value.nbStatutsCandidats}</Table.Col>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Card>
  );
};
