import { Box, Tbody, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { useFiltersContext } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/FiltersContext";
import { isDateFuture } from "@/common/utils/dateUtils";
import Loading from "../../Loading/Loading";
import Table from "../Table";
import EffectifBySiretRow from "./EffectifBySiretRow";

const RepartitionEffectifsParSiret = ({ effectifs, loading, error }) => {
  const filtersContext = useFiltersContext();
  const isPeriodInvalid = isDateFuture(filtersContext.state.date);

  const tableHeader = isPeriodInvalid
    ? ["Nom de l'organisme", "apprentis", "inscrits sans contrat"]
    : ["Nom de l'organisme", "apprentis", "inscrits sans contrat", "rupturants", "abandons"];

  if (loading) return <Loading />;

  if (error) {
    return (
      <Text fontSize="epsilon" color="grey.800">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors du chargement des données
        </Box>
      </Text>
    );
  }

  return (
    <Table headers={tableHeader} loading={loading} error={error}>
      <Tbody>
        {effectifs
          ? effectifs.map((item) => {
              const { siret_etablissement, nom_etablissement, effectifs } = item;
              return (
                <EffectifBySiretRow
                  key={`siret_${siret_etablissement}`}
                  siret_etablissement={siret_etablissement}
                  nom_etablissement={nom_etablissement}
                  effectifs={effectifs}
                  isPeriodInvalid={isPeriodInvalid}
                />
              );
            })
          : null}
      </Tbody>
    </Table>
  );
};

RepartitionEffectifsParSiret.propTypes = {
  effectifs: PropTypes.arrayOf(
    PropTypes.shape({
      siret_etablissement: PropTypes.string.isRequired,
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

export default RepartitionEffectifsParSiret;
