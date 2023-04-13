import { Box, Link, Tbody, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useRouter } from "next/router";

import { useFiltersContext } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import { mapNatureOrganismeDeFormation } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-organisme/sections/informations-cfa/CfaInformationSection";
import { isDateFuture } from "@/common/utils/dateUtils";
import { navigateToOrganismePage } from "@/common/utils/routing";
import NatureOrganismeDeFormationWarning from "../NatureOrganismeDeFormationWarning/NatureOrganismeDeFormationWarning";
import NumberValueCell from "./NumberValueCell";
import Table from "./Table";

const RepartitionEffectifsParCfa = ({
  repartitionEffectifsParCfa,
  loading,
  error,
}: {
  repartitionEffectifsParCfa: any[];
  loading: boolean;
  error?: any;
}) => {
  let content: React.ReactNode = null;
  const filtersContext = useFiltersContext();
  const router = useRouter();
  const isPeriodInvalid = isDateFuture(filtersContext.state.date);
  const tableHeader = isPeriodInvalid
    ? ["Nom de l'organisme de formation", "Nature", "apprentis", "inscrits sans contrat"]
    : ["Nom de l'organisme de formation", "Nature", "apprentis", "inscrits sans contrat", "rupturants", "abandons"];
  if (repartitionEffectifsParCfa) {
    content = (
      <Tbody>
        {repartitionEffectifsParCfa.map((item, index) => {
          const {
            uai_etablissement,
            nom_etablissement,
            siret_etablissement,
            nature,
            nature_validity_warning,
            effectifs,
          } = item;
          return (
            <Tr key={`headerRow_${index}`}>
              <Td color="grey.800">
                <Link
                  onClick={() => {
                    navigateToOrganismePage(router, { uai_etablissement, nom_etablissement });
                    window.scrollTo(0, 0);
                  }}
                  color="bluefrance"
                  whiteSpace="pre-line"
                >
                  {nom_etablissement}
                </Link>
                <Box fontSize="omega">
                  UAI : {uai_etablissement} - SIRET : {siret_etablissement || "N/A"}
                </Box>
              </Td>
              <Td color="grey.800">
                {mapNatureOrganismeDeFormation(nature)}{" "}
                {nature_validity_warning && (
                  <span style={{ verticalAlign: "middle" }}>
                    <NatureOrganismeDeFormationWarning />
                  </span>
                )}
              </Td>
              <NumberValueCell value={effectifs.apprentis} />
              <NumberValueCell value={effectifs.inscritsSansContrat} />
              {!isPeriodInvalid && (
                <>
                  <NumberValueCell value={effectifs.rupturants} />
                  <NumberValueCell value={effectifs.abandons} />
                </>
              )}
            </Tr>
          );
        })}
      </Tbody>
    );
  }

  return (
    <Table headers={tableHeader} loading={loading} error={error}>
      {content}
    </Table>
  );
};

RepartitionEffectifsParCfa.propTypes = {
  repartitionEffectifsParCfa: PropTypes.arrayOf(
    PropTypes.shape({
      uai_etablissement: PropTypes.string,
      nom_etablissement: PropTypes.string.isRequired,
      effectifs: PropTypes.shape({
        apprentis: PropTypes.number.isRequired,
        inscritsSansContrat: PropTypes.number.isRequired,
        rupturants: PropTypes.number.isRequired,
        abandons: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired
  ),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default RepartitionEffectifsParCfa;
