import { Tbody } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "../../../../pages/tableau-de-bord/FiltersContext";
import { isDateFuture } from "../../../utils/dateUtils";
import Table from "../Table";
import DepartementRow from "./DepartementRow";

const RepartitionEffectifsParDepartement = ({ repartitionEffectifsParDepartement, loading, error }) => {
  let content = null;
  const filtersContext = useFiltersContext();
  const shouldHideEffectifs = isDateFuture(filtersContext.state.date);
  if (repartitionEffectifsParDepartement) {
    content = (
      <Tbody>
        {repartitionEffectifsParDepartement.map((item) => {
          const { etablissement_num_departement, etablissement_nom_departement, effectifs } = item;
          return (
            <DepartementRow
              key={"departement_" + etablissement_num_departement}
              departementCode={etablissement_num_departement}
              departementNom={etablissement_nom_departement}
              effectifs={effectifs}
            />
          );
        })}
      </Tbody>
    );
  }

  return (
    <>
      {shouldHideEffectifs === true && (
        <Table
          headers={["Département", "apprentis", "inscrits sans contrat", "rupturants", "abandons"]}
          loading={loading}
          error={error}
        >
          {content}
        </Table>
      )}
      {shouldHideEffectifs === false && (
        <Table headers={["Département", "apprentis", "inscrits sans contrat"]} loading={loading} error={error}>
          {content}
        </Table>
      )}
    </>
  );
};

RepartitionEffectifsParDepartement.propTypes = {
  repartitionEffectifsParDepartement: PropTypes.arrayOf(
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

export default RepartitionEffectifsParDepartement;
