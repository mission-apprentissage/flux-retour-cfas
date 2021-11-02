import { Box, Heading, HStack, Skeleton } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { STATUTS_APPRENANTS_INDICATOR_COLORS } from "../../constants/statutsColors";
import { getRoundedPercentage } from "../../utils/calculUtils";
import DoubleStatCard from "../DoubleStatCard";
import Section from "../Section/Section";
import StatCard from "../StatCard";

export const StatsSkeleton = () => {
  return (
    <Section marginBottom="8w">
      <Skeleton startColor="grey.100" endColor="grey.500" height="1.5rem" width="10rem" marginTop="4w" />
      <HStack spacing="2w" mt="3w">
        <Skeleton startColor="grey.100" endColor="grey.400" borderRadius="8px" width="14rem" height="7rem" />
        <Skeleton startColor="grey.100" endColor="grey.400" borderRadius="8px" width="14rem" height="7rem" />
        <Skeleton startColor="grey.100" endColor="grey.400" borderRadius="8px" width="14rem" height="7rem" />
        <Skeleton startColor="grey.100" endColor="grey.400" borderRadius="8px" width="14rem" height="7rem" />
        <Skeleton startColor="grey.100" endColor="grey.400" borderRadius="8px" width="14rem" height="7rem" />
      </HStack>
      <HStack spacing="2w" mt="3w">
        <Skeleton startColor="grey.100" endColor="grey.400" borderRadius="8px" width="14rem" height="7rem" />
        <Skeleton startColor="grey.100" endColor="grey.400" borderRadius="8px" width="14rem" height="7rem" />
      </HStack>
    </Section>
  );
};

const GlobalStats = ({ stats, networksStats }) => {
  return (
    <Section marginBottom="8w">
      <Heading as="h2" variant="h2" marginTop="4w">
        Candidats
      </Heading>
      <HStack spacing="2w" mt="3w">
        <StatCard label="Total candidats" stat={stats.nbDistinctCandidatsTotal} background="info" />
        <StatCard background="info" label="Numéros INE distincs" stat={stats.nbDistinctCandidatsWithIne} />
        <StatCard background="info" label="Candidats multi-UAIs avec INE" stat={stats.nbCandidatsMultiUaisWithIne} />
        <StatCard background="info" label="Candidats multi-UAIs sans INE" stat={stats.nbCandidatsMultiUaisWithoutIne} />
        <StatCard background="info" label="Candidats multi-CFDs avec INE" stat={stats.nbCandidatsMultiCfdsWithIne} />
        <StatCard background="info" label="Candidats multi-CFDs sans INE" stat={stats.nbCandidatsMultiCfdsWithoutIne} />
      </HStack>
      <HStack spacing="2w" mt="3w">
        <StatCard
          background="warning"
          label="Organismes de formation distinct Uai total"
          stat={stats.nbCfasDistinctUai}
        />
        <StatCard
          background="warning"
          label="Organismes de formation distinct Siret total"
          stat={stats.nbCfasDistinctSiret}
        />
      </HStack>
      <Box mt="8w">
        <Heading as="h2" variant="h2">
          Statuts Candidats
        </Heading>

        <HStack spacing="2w" mt="3w">
          <StatCard background="info" label="Total Statuts" stat={stats.nbStatutsCandidats} />
        </HStack>
        <HStack spacing="2w" mt="3w">
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
      <Box mt="8w">
        <Heading as="h2" variant="h2">
          Données invalides
        </Heading>

        <HStack spacing="2w" mt="3w">
          <DoubleStatCard
            background="warning"
            label="Statuts valides"
            stat={stats.nbStatutsValid}
            stat2={`${getRoundedPercentage(stats.nbStatutsValid, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
          <DoubleStatCard
            background="warning"
            label="Statuts avec UAI absent ou invalide"
            stat={stats.nbInvalidUais}
            stat2={`${getRoundedPercentage(stats.nbInvalidUais, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
          <DoubleStatCard
            background="warning"
            label="Statuts avec SIRET absent ou invalide"
            stat={stats.nbInvalidSirets}
            stat2={`${getRoundedPercentage(stats.nbInvalidSirets, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
          <DoubleStatCard
            background="warning"
            label="Statuts avec SIRET et UAI absent ou invalide"
            stat={stats.nbInvalidSiretsAndUais}
            stat2={`${getRoundedPercentage(stats.nbInvalidSiretsAndUais, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
          <DoubleStatCard
            background="warning"
            label="Statuts avec CFD absent ou invalide"
            stat={stats.nbInvalidCfds}
            stat2={`${getRoundedPercentage(stats.nbInvalidCfds, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
          <DoubleStatCard
            background="warning"
            label="Statuts avec annee_formation manquante"
            stat={stats.nbStatutsAnneeFormationMissing}
            stat2={`${getRoundedPercentage(stats.nbStatutsAnneeFormationMissing, stats.nbStatutsCandidats)} %`}
            stat2Label="du total des statuts"
          />
        </HStack>
      </Box>
      <Box mt="8w">
        <Heading as="h2" variant="h2">
          Mises à jour statuts
        </Heading>
        <HStack spacing="2w" mt="3w">
          <StatCard background="info" label="Statuts mis à jour" stat={stats.nbStatutsCandidatsMisAJour} />
          <StatCard background="info" label="Statuts sans mise à jour" stat={stats.nbStatutsWithoutHistory} />
        </HStack>
        <HStack spacing="2w" mt="3w">
          <StatCard label="1 mise à jour" stat={stats.nbDistinctCandidatsWithStatutHistory1} background="info" />
          <StatCard label="2 mises à jour" stat={stats.nbDistinctCandidatsWithStatutHistory2} background="info" />
          <StatCard label="3 mises à jour" stat={stats.nbDistinctCandidatsWithStatutHistory3} background="info" />
        </HStack>
      </Box>
      {networksStats && (
        <Box mt="8w">
          <Heading as="h2" variant="h2">
            Stats Statuts Réseaux
          </Heading>
          <HStack spacing="2w" mt="3w">
            {networksStats.map((item, index) => (
              <StatCard key={index} label={item.nomReseau} stat={item.nbStatutsCandidats} background="bluedark.600" />
            ))}
          </HStack>
        </Box>
      )}
    </Section>
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
    nbStatutsInscrits: PropTypes.number,
    nbStatutsApprentis: PropTypes.number,
    nbStatutsAbandon: PropTypes.number,
    nbStatutsCandidatsMisAJour: PropTypes.number,
    nbStatutsWithoutHistory: PropTypes.number,
    nbDistinctCandidatsWithStatutHistory1: PropTypes.number,
    nbDistinctCandidatsWithStatutHistory2: PropTypes.number,
    nbDistinctCandidatsWithStatutHistory3: PropTypes.number,
    nbStatutsAnneeFormationMissing: PropTypes.number,
  }).isRequired,
  networksStats: PropTypes.arrayOf(
    PropTypes.shape({
      nomReseau: PropTypes.string,
      nbStatutsCandidats: PropTypes.number,
    }).isRequired
  ),
};

export default GlobalStats;
