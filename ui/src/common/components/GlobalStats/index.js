import { Alert, AlertIcon, Box, HStack, Stack } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { STATUTS_APPRENANTS_INDICATOR_COLORS } from "../../constants/statutsColors";
import PageSectionTitle from "../PageSectionTitle";
import StatCard from "../StatCard";

const GlobalStats = ({ stats, lastImportDates }) => {
  return (
    <>
      <Box>
        <Stack spacing="2w" mt="3w" mb="3w">
          {lastImportDates.map((item) => (
            <Alert key={item} status="info">
              <AlertIcon />
              Dernier import de données de {item.source} réalisé le {item.date}
            </Alert>
          ))}
        </Stack>
        <PageSectionTitle>Candidats</PageSectionTitle>
        <HStack spacing="2w" mt="3w">
          <StatCard label="Total candidats" stat={stats.nbDistinctCandidatsTotal} background="info" />
          <StatCard background="info" label="Numéros INE distincs" stat={stats.nbDistinctCandidatsWithIne} />
          <StatCard background="info" label="Candidats multi-UAIs" stat={stats.nbCandidatsMultiUais} />
          <StatCard background="info" label="Candidats multi-CFDs" stat={stats.nbCandidatsMultiCfds} />
        </HStack>
        <HStack spacing="2w" mt="3w">
          <StatCard background="warning" label="CFAs au total" stat={stats.nbCfas} />
          <StatCard background="warning" label="UAIs invalides" stat={stats.nbInvalidUais} />
        </HStack>
      </Box>
      <Box mt="9w">
        <PageSectionTitle>Statuts Candidats</PageSectionTitle>
        <HStack spacing="2w" mt="3w">
          <StatCard background="info" label="Total Statuts" stat={stats.nbStatutsCandidats} />
          <StatCard background="info" label="Statuts sans INE" stat={stats.nbStatutsSansIne} />
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
        </HStack>
        <HStack spacing="2w" mt="3w">
          <StatCard label="1 mise à jour" stat={stats.nbDistinctCandidatsWithStatutHistory1} background="info" />
          <StatCard label="2 mises à jour" stat={stats.nbDistinctCandidatsWithStatutHistory2} background="info" />
          <StatCard label="3 mises à jour" stat={stats.nbDistinctCandidatsWithStatutHistory3} background="info" />
        </HStack>
      </Box>
    </>
  );
};

GlobalStats.propTypes = {
  stats: PropTypes.shape({
    nbCfas: PropTypes.number,
    nbInvalidUais: PropTypes.number,
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
  lastImportDates: PropTypes.arrayOf(
    PropTypes.shape({
      source: PropTypes.string,
      date: PropTypes.string,
    }).isRequired
  ),
};

export default GlobalStats;
