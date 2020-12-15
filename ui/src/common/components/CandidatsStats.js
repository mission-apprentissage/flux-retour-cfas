import PropTypes from "prop-types";
import React from "react";
import { Alert, Grid, Header, StampCard } from "tabler-react";

const CandidatsStats = ({ stats }) => {
  return (
    <>
      <Header.H5>Statistiques Candidats</Header.H5>
      <Alert type="primary" icon="info">
        Statistiques des candidats identifiés dans le système
      </Alert>
      <Grid.Row cards={true}>
        <Grid.Col sm={6} lg={3}>
          <StampCard color="blue" icon="users" header={`${stats.nbCfas} CFAs au total`} footer={"Nb total de CFAs"} />
        </Grid.Col>
      </Grid.Row>
      <Grid.Row cards={true}>
        <Grid.Col sm={6} lg={3}>
          <StampCard
            color="blue"
            icon="users"
            header={`${stats.nbInvalidUais} UAIs invalides au total`}
            footer={"Nb total de UAIs invalides"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={3}>
          <StampCard
            color="blue"
            icon="users"
            header={`${stats.nbDistinctCandidatsTotal} candidats au total`}
            footer={"Nb total de candidats"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={3}>
          <StampCard
            color="blue"
            icon="file-text"
            header={`${stats.nbDistinctCandidatsWithIne} numéros INE distincts`}
            footer={"Nb total de n° INE"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={3}>
          <StampCard
            color="yellow"
            icon="home"
            header={`${stats.nbCandidatsMultiUais} candidats multi-UAIs`}
            footer={"Candidats sur plusieurs UAIs"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={3}>
          <StampCard
            color="yellow"
            icon="award"
            header={`${stats.nbCandidatsMultiCfds} candidats multi-CFD`}
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
            header={`${stats.nbStatutsCandidats} statuts Total`}
            footer={"Total des statuts candidats"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={6}>
          <StampCard
            color="orange"
            icon="alert-circle"
            header={`${stats.nbStatutsSansIne} statuts sans INE`}
            footer={"Numéro INE inconnu"}
          />
        </Grid.Col>
      </Grid.Row>
      <Grid.Row cards={true}>
        <Grid.Col sm={6} lg={3}>
          <StampCard
            color="green"
            icon="user"
            header={`${stats.nbStatutsProspect} statuts Prospect`}
            footer={"Statuts de candidats prospects"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={3}>
          <StampCard
            color="green"
            icon="user-plus"
            header={`${stats.nbStatutsInscrits} statuts Inscrits`}
            footer={"Statuts de candidats inscrits"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={3}>
          <StampCard
            color="blue"
            icon="user-check"
            header={`${stats.nbStatutsApprentis} statuts Apprentis`}
            footer={"Statuts de candidats apprentis"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={3}>
          <StampCard
            color="orange"
            icon="user-x"
            header={`${stats.nbStatutsAbandon} statuts Abandons`}
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
            header={`${stats.nbStatutsCandidatsMisAJour} statuts mis à jour`}
            footer={"Total des statuts mis à jour"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={6}>
          <StampCard
            color="orange"
            icon="x-circle"
            header={`${stats.nbStatutsWithoutHistory} statuts sans mises à jour`}
            footer={"Total des statuts sans mises à jour"}
          />
        </Grid.Col>
      </Grid.Row>
      <Grid.Row cards={true}>
        <Grid.Col sm={6} lg={4}>
          <StampCard
            color="green"
            icon="arrow-down-circle"
            header={`${stats.nbDistinctCandidatsWithChangingStatutProspectInscrit} Prospects vers Inscrits`}
            footer={"Candidats passés de prospect à inscrit"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={4}>
          <StampCard
            color="green"
            icon="arrow-down-circle"
            header={`${stats.nbDistinctCandidatsWithChangingStatutProspectApprenti} Prospects vers Apprentis`}
            footer={"Candidats passés de prospect à apprenti"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={4}>
          <StampCard
            color="green"
            icon="arrow-down-circle"
            header={`${stats.nbDistinctCandidatsWithChangingStatutProspectAbandon} Prospects vers Abandon`}
            footer={"Candidats passés de prospect à abandon"}
          />
        </Grid.Col>
      </Grid.Row>
      <Grid.Row cards={true}>
        <Grid.Col sm={6} lg={4}>
          <StampCard
            color="blue"
            icon="arrow-up-circle"
            header={`${stats.nbDistinctCandidatsWithStatutHistory1} candidats avec 1 maj`}
            footer={"Statut mis à jour 1 fois"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={4}>
          <StampCard
            color="blue"
            icon="arrow-up-circle"
            header={`${stats.nbDistinctCandidatsWithStatutHistory2} candidats avec 2 maj`}
            footer={"Statut mis à jour 2 fois"}
          />
        </Grid.Col>
        <Grid.Col sm={6} lg={4}>
          <StampCard
            color="blue"
            icon="arrow-up-circle"
            header={`${stats.nbDistinctCandidatsWithStatutHistory3} candidats avec 3 maj`}
            footer={"Statut mis à jour 3 fois"}
          />
        </Grid.Col>
      </Grid.Row>
    </>
  );
};

CandidatsStats.propTypes = {
  stats: PropTypes.shape({
    nbDistinctCandidatsTotal: PropTypes.number,
    nbDistinctCandidatsWithIne: PropTypes.number,
    nbCandidatsMultiUais: PropTypes.number,
    nbCandidatsMultiCfds: PropTypes.number,
    nbStatutsCandidats: PropTypes.number,
    nbStatutsSansIne: PropTypes.number,
    nbStatutsProspect: PropTypes.number,
    nbStatutsInscrits: PropTypes.number,
    nbStatutsApprentis: PropTypes.number,
    nbStatutsAbandon: PropTypes.number,
    nbStatutsCandidatsMisAJour: PropTypes.number,
    nbStatutsWithoutHistory: PropTypes.number,
    nbDistinctCandidatsWithChangingStatutProspectInscrit: PropTypes.number,
    nbDistinctCandidatsWithChangingStatutProspectApprenti: PropTypes.number,
    nbDistinctCandidatsWithChangingStatutProspectAbandon: PropTypes.number,
    nbDistinctCandidatsWithStatutHistory1: PropTypes.number,
    nbDistinctCandidatsWithStatutHistory2: PropTypes.number,
    nbDistinctCandidatsWithStatutHistory3: PropTypes.number,
  }).isRequired,
};

export default CandidatsStats;
