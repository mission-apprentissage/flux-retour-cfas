import { Box, Tbody, Td, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useState } from "react";

import { getPercentage } from "../../../utils/calculUtils";
import ProgressCell from "../ProgressCell";
import Table from "../Table";
import FormationRows from "./FormationRows";

const RepartitionEffectifsParFormation = ({ repartitionEffectifs, loading, error }) => {
  return (
    <Table headers={["Niveau", "apprentis", "apprenants sans contrat", "abandons"]} loading={loading} error={error}>
      <Tbody>
        {repartitionEffectifs
          ? repartitionEffectifs.map((data) => {
              return (
                <RepartitionParNiveauRow
                  key={data.niveau_formation}
                  niveauFormation={data.niveau_formation}
                  effectifs={data.effectifs}
                />
              );
            })
          : null}
      </Tbody>
    </Table>
  );
};

const RepartitionParNiveauRow = ({ niveauFormation, effectifs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const total = effectifs.apprentis + effectifs.inscrits + effectifs.abandons;
  return (
    <>
      <Tr background="galt">
        <Td color="bluefrance" onClick={() => setIsOpen(!isOpen)} cursor="pointer">
          <Box as="i" className={isOpen ? "ri-subtract-line" : "ri-add-line"} verticalAlign="middle" fontSize="beta" />
          <Box as="span" fontWeight="700" verticalAlign="middle" marginLeft="1w">
            Niveau {niveauFormation}
          </Box>
        </Td>
        <ProgressCell label={effectifs.apprentis} value={getPercentage(effectifs.apprentis, total)} />
        <ProgressCell label={effectifs.inscrits} value={getPercentage(effectifs.inscrits, total)} />
        <ProgressCell label={effectifs.abandons} value={getPercentage(effectifs.abandons, total)} />
      </Tr>
      {isOpen && <FormationRows niveauFormation={niveauFormation} />}
    </>
  );
};

RepartitionParNiveauRow.propTypes = {
  niveauFormation: PropTypes.string.isRequired,
  effectifs: PropTypes.shape({
    apprentis: PropTypes.number.isRequired,
    inscrits: PropTypes.number.isRequired,
    abandons: PropTypes.number.isRequired,
  }).isRequired,
};

RepartitionEffectifsParFormation.propTypes = {
  repartitionEffectifs: PropTypes.arrayOf(
    PropTypes.shape({
      niveauFormation: PropTypes.string.isRequired,
      effectifs: PropTypes.shape({
        apprentis: PropTypes.number.isRequired,
        inscrits: PropTypes.number.isRequired,
        abandons: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired
  ),
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default RepartitionEffectifsParFormation;
