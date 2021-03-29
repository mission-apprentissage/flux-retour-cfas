import { Alert, AlertIcon, Box, HStack, Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { STATUTS_APPRENANTS_INDICATOR_COLORS } from "../../constants/statutsColors";
import { getItemsRate } from "../../utils/calculUtils";
import DoubleStatCard from "../DoubleStatCard";
import PageSectionTitle from "../Page/PageSectionTitle";
import StatCard from "../StatCard";

const GlobalStats = ({ stats, lastImportDates, networksStats }) => {
  return (
    <>
      <Box>
        {lastImportDates && (
          <Stack spacing="2w" mt="3w" mb="3w">
            {lastImportDates.map((item, index) => (
              <Alert key={index} status="info">
                <AlertIcon />
                Dernier import de données de {item.source} réalisé le {item.date}
              </Alert>
            ))}
          </Stack>
        )}
        <PageSectionTitle>Candidats</PageSectionTitle>
        <HStack spacing="2w" mt="3w">
          <StatCard label="Total candidats" stat={stats.nbDistinctCandidatsTotal} background="info" />
          <StatCard background="info" label="Numéros INE distincs" stat={stats.nbDistinctCandidatsWithIne} />
          <StatCard background="info" label="Candidats multi-UAIs avec INE" stat={stats.nbCandidatsMultiUaisWithIne} />
          <StatCard
            background="info"
            label="Candidats multi-UAIs sans INE"
            stat={stats.nbCandidatsMultiUaisWithoutIne}
          />
          <StatCard background="info" label="Candidats multi-CFDs avec INE" stat={stats.nbCandidatsMultiCfdsWithIne} />
          <StatCard
            background="info"
            label="Candidats multi-CFDs sans INE"
            stat={stats.nbCandidatsMultiCfdsWithoutIne}
          />
        </HStack>
        <HStack spacing="2w" mt="3w">
          <StatCard background="warning" label="CFAs distinct Uai total" stat={stats.nbCfasDistinctUai} />
          <StatCard background="warning" label="CFAs distinct Siret total" stat={stats.nbCfasDistinctSiret} />
        </HStack>
      </Box>
      <Box mt="9w">
        <PageSectionTitle>Statuts Candidats</PageSectionTitle>
        <HStack spacing="2w" mt="3w">
          <StatCard background="info" label="Total Statuts" stat={stats.nbStatutsCandidats} />
        </HStack>
        <HStack spacing="2w" mt="3w">
          <StatCard
            label="Statuts Prospect"
            stat={stats.nbStatutsProspect}
            background="bluesoft.200"
            color="grey.800"
            indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.prospects}
          />
          <StatCard
            label="Statuts Inscrit"
            stat={stats.nbStatutsInscrits}
            background="yellowmedium.200"
            color="grey.800"
            indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.inscrits}
          />
          <StatCard
            label="Statuts Apprenti"
            stat={stats.nbStatutsApprentis}
            background="orangemedium.200"
            color="grey.800"
            indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.apprentis}
          />
          <StatCard
            label="Statuts Abandon"
            stat={stats.nbStatutsAbandon}
            background="orangesoft.200"
            color="grey.800"
            indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.abandons}
          />
          <StatCard
            label="Statuts Abandon de Prospects"
            stat={stats.nbStatutsAbandonProspects}
            background="orangesoft.200"
            color="grey.800"
            indicatorColor={STATUTS_APPRENANTS_INDICATOR_COLORS.abandons}
          />
        </HStack>
      </Box>
      <Box mt="9w">
        <PageSectionTitle>Données invalides</PageSectionTitle>
        <HStack spacing="2w" mt="3w">
          <DoubleStatCard
            background="warning"
            label="Statuts valides"
            stat={stats.nbStatutsValid}
            stat2={`${getItemsRate(stats.nbStatutsValid, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
          <DoubleStatCard
            background="warning"
            label="Statuts avec UAI absent ou invalide"
            stat={stats.nbInvalidUais}
            stat2={`${getItemsRate(stats.nbInvalidUais, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
          <DoubleStatCard
            background="warning"
            label="Statuts avec SIRET absent ou invalide"
            stat={stats.nbInvalidSirets}
            stat2={`${getItemsRate(stats.nbInvalidSirets, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
          <DoubleStatCard
            background="warning"
            label="Statuts avec SIRET et UAI absent ou invalide"
            stat={stats.nbInvalidSiretsAndUais}
            stat2={`${getItemsRate(stats.nbInvalidSiretsAndUais, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
          <DoubleStatCard
            background="warning"
            label="Statuts avec CFD absent ou invalide"
            stat={stats.nbInvalidCfds}
            stat2={`${getItemsRate(stats.nbInvalidCfds, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
          <DoubleStatCard
            background="warning"
            label="Statuts avec annee_formation manquante"
            stat={stats.nbStatutsAnneeFormationMissing}
            stat2={`${getItemsRate(stats.nbStatutsAnneeFormationMissing, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
        </HStack>
      </Box>
      <Box mt="9w">
        <PageSectionTitle>Mises à jour statuts</PageSectionTitle>
        <HStack spacing="2w" mt="3w">
          <StatCard background="info" label="Statuts mis à jour" stat={stats.nbStatutsCandidatsMisAJour} />
          <StatCard background="info" label="Statuts sans mise à jour" stat={stats.nbStatutsWithoutHistory} />
        </HStack>
        <HStack spacing="2w" mt="3w">
          <StatCard
            label="Prospect vers Inscrit"
            stat={stats.nbDistinctCandidatsWithChangingStatutProspectInscrit}
            background="success"
          />
          <StatCard
            label="Prospect vers Apprenti"
            stat={stats.nbDistinctCandidatsWithChangingStatutProspectApprenti}
            background="success"
          />
          <StatCard
            label="Prospect vers Abandon"
            stat={stats.nbDistinctCandidatsWithChangingStatutProspectAbandon}
            background="warning"
          />
          <StatCard
            label="Prospect vers Abandon Prospect"
            stat={stats.nbDistinctCandidatsWithChangingStatutProspectAbandonProspect}
            background="warning"
          />
        </HStack>
        <HStack spacing="2w" mt="3w">
          <StatCard label="1 mise à jour" stat={stats.nbDistinctCandidatsWithStatutHistory1} background="info" />
          <StatCard label="2 mises à jour" stat={stats.nbDistinctCandidatsWithStatutHistory2} background="info" />
          <StatCard label="3 mises à jour" stat={stats.nbDistinctCandidatsWithStatutHistory3} background="info" />
        </HStack>
      </Box>
      {networksStats && (
        <Box mt="9w">
          <PageSectionTitle>Stats Statuts Réseaux</PageSectionTitle>
          <HStack spacing="2w" mt="3w">
            {networksStats.map((item, index) => (
              <StatCard key={index} label={item.nomReseau} stat={item.nbStatutsCandidats} background="bluedark.600" />
            ))}
          </HStack>
        </Box>
      )}
    </>
  );
};

GlobalStats.propTypes = {
  stats: PropTypes.shape({
    nbCfasDistinctUai: PropTypes.number,
    nbCfasDistinctSiret: PropTypes.number,
    nbStatutsValid: PropTypes.number,
    nbInvalidUais: PropTypes.number,
    nbInvalidCfds: PropTypes.number,
    nbInvalidSirets: PropTypes.number,
    nbInvalidSiretsAndUais: PropTypes.number,
    nbDistinctCandidatsTotal: PropTypes.number,
    nbDistinctCandidatsWithIne: PropTypes.number,
    nbCandidatsMultiUaisWithIne: PropTypes.number,
    nbCandidatsMultiUaisWithoutIne: PropTypes.number,
    nbCandidatsMultiCfdsWithIne: PropTypes.number,
    nbCandidatsMultiCfdsWithoutIne: PropTypes.number,
    nbStatutsCandidats: PropTypes.number,
    nbStatutsSansIne: PropTypes.number,
    nbStatutsProspect: PropTypes.number,
    nbStatutsInscrits: PropTypes.number,
    nbStatutsApprentis: PropTypes.number,
    nbStatutsAbandon: PropTypes.number,
    nbStatutsAbandonProspects: PropTypes.number,
    nbStatutsCandidatsMisAJour: PropTypes.number,
    nbStatutsWithoutHistory: PropTypes.number,
    nbDistinctCandidatsWithChangingStatutProspectInscrit: PropTypes.number,
    nbDistinctCandidatsWithChangingStatutProspectApprenti: PropTypes.number,
    nbDistinctCandidatsWithChangingStatutProspectAbandon: PropTypes.number,
    nbDistinctCandidatsWithChangingStatutProspectAbandonProspect: PropTypes.number,
    nbDistinctCandidatsWithStatutHistory1: PropTypes.number,
    nbDistinctCandidatsWithStatutHistory2: PropTypes.number,
    nbDistinctCandidatsWithStatutHistory3: PropTypes.number,
    nbStatutsAnneeFormationMissing: PropTypes.number,
  }).isRequired,
  lastImportDates: PropTypes.arrayOf(
    PropTypes.shape({
      source: PropTypes.string,
      date: PropTypes.string,
    }).isRequired
  ),
  networksStats: PropTypes.arrayOf(
    PropTypes.shape({
      nomReseau: PropTypes.string,
      nbStatutsCandidats: PropTypes.number,
    }).isRequired
  ),
};

export default GlobalStats;
