import { Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const FormationsList = ({ formations, onFormationClick, selectedValue }) => {
  return (
    <TableContainer marginTop="1w" textAlign="left" maxHeight="18rem" overflowY="scroll">
      <Table variant="primary">
        <Thead>
          <Tr>
            <Th>Libellé de la formation</Th>
            <Th>CFD</Th>
            <Th>RNCP</Th>
            <Th>Date de validité du CFD</Th>
          </Tr>
        </Thead>
        <Tbody>
          {formations?.map((formation) => {
            const isRowSelected = formation.cfd === selectedValue?.cfd;
            const cfdStartDate = formation.cfd_start_date
              ? new Date(formation.cfd_start_date).toLocaleDateString()
              : null;
            const cfdEndDate = formation.cfd_end_date ? new Date(formation.cfd_end_date).toLocaleDateString() : null;

            return (
              <Tr
                onClick={() => {
                  onFormationClick(formation);
                }}
                borderLeft={isRowSelected ? "solid 2px" : "none"}
                key={formation.cfd}
              >
                <Td maxWidth="550px" overflow="scroll">
                  {formation.libelle || "N/A"}
                </Td>
                <Td>{formation.cfd}</Td>
                <Td>{formation.rncp}</Td>
                {cfdStartDate && cfdEndDate ? (
                  <Td>{`Du ${cfdStartDate} au ${cfdEndDate}`}</Td>
                ) : (
                  <Td fontStyle="italic">N/A</Td>
                )}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

FormationsList.propTypes = {
  onFormationClick: PropTypes.func.isRequired,
  formations: PropTypes.arrayOf(
    PropTypes.shape({
      cfd: PropTypes.string.isRequired,
      libelle: PropTypes.string.isRequired,
    }).isRequired
  ),
  selectedValue: PropTypes.shape({
    cfd: PropTypes.string.isRequired,
    libelle: PropTypes.string.isRequired,
  }),
};

export default FormationsList;
