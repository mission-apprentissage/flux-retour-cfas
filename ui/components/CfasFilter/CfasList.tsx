import { Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { DEPARTEMENTS_SORTED, REGIONS_SORTED } from "@/common/constants/territoiresConstants";
import { mapNatureOrganismeDeFormation } from "@/modules/mon-espace/landing/visualiser-les-indicateurs/par-organisme/sections/informations-cfa/CfaInformationSection";

const TERRITOIRES_DATA = { regions: REGIONS_SORTED, departements: DEPARTEMENTS_SORTED };

function cellElseNotAvailable(value) {
  return value ? <Td>{value}</Td> : <Td fontStyle="italic">non-renseigné</Td>;
}

const CfasList = ({ cfas, onCfaClick, selectedValue }) => {
  const data = TERRITOIRES_DATA;

  return (
    <TableContainer marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
      <Table variant="primary">
        <Thead>
          <Tr>
            <Th>Nom de l&apos;organisme</Th>
            <Th>Nature</Th>
            <Th>UAI</Th>
            <Th>SIRET(S)</Th>
            <Th>Département</Th>
          </Tr>
        </Thead>
        <Tbody>
          {cfas?.map((cfa, index) => {
            const isRowSelected = selectedValue?.uai_etablissement === cfa.uai_etablissement;
            const departementFromData = data?.departements?.find((item) => item.code === cfa.departement);
            const departementFormatted = departementFromData
              ? `${departementFromData?.nom} (${departementFromData?.code})`
              : "NC";
            return (
              <Tr
                onClick={() => {
                  onCfaClick(cfa);
                }}
                borderLeft={isRowSelected ? "solid 2px" : "none"}
                key={`${cfa.uai_etablissement}_${index}`}
              >
                <Td fontWeight="bold" whiteSpace={"pre-line"}>
                  {cfa.nom_etablissement}
                </Td>
                <Td>{mapNatureOrganismeDeFormation(cfa.nature)}</Td>
                {cellElseNotAvailable(cfa.uai_etablissement)}
                {cellElseNotAvailable(cfa.siret_etablissement)}
                <Td>{departementFormatted}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

CfasList.propTypes = {
  onCfaClick: PropTypes.func.isRequired,
  cfas: PropTypes.arrayOf(
    PropTypes.shape({
      uai_etablissement: PropTypes.string.isRequired,
      nom_etablissement: PropTypes.string.isRequired,
      nature: PropTypes.string,
      departement: PropTypes.string.isRequired,
    }).isRequired
  ),
  selectedValue: PropTypes.shape({
    uai_etablissement: PropTypes.string.isRequired,
    nom_etablissement: PropTypes.string.isRequired,
  }),
};

export default CfasList;
