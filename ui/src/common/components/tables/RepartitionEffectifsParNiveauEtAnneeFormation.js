import { Box, HStack, Progress, Table, TableCaption, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { getPercentage } from "../../utils/calculUtils";
import { toPrettyYearLabel } from "../../utils/stringUtils";
import { Pagination, TableSkeleton } from "..";

const TABLE_HEADERS = ["Intitulé", "Année", "Apprentis", "Inscrits", "Abandons"];

const RepartitionEffectifsParNiveauEtAnneeFormation = ({ repartitionEffectifs, loading, error, _setPage }) => {
  if (loading) {
    return <TableSkeleton headers={TABLE_HEADERS} />;
  }

  if (error) {
    return (
      <Text fontSize="epsilon" color="grey.800">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors de la récupération de la répartition par niveaux de formation
        </Box>
      </Text>
    );
  }

  if (repartitionEffectifs) {
    return (
      <Table mt="5">
        <Thead>
          <Tr background="bluesoft.100">
            {TABLE_HEADERS.map((header) => {
              return (
                <Th
                  key={header}
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  {header}
                </Th>
              );
            })}
          </Tr>
        </Thead>
        {repartitionEffectifs.data.map((item, index) => buildNiveauRows(item, index))}
        <TableCaption>
          <Pagination
            pagesQuantity={repartitionEffectifs.total_pages}
            currentPage={repartitionEffectifs.page}
            changePageHandler={(data) => _setPage(data)}
          />
        </TableCaption>
      </Table>
    );
  }

  return null;
};

const buildNiveauRows = (data, index) => (
  <>
    {/* Niveau Header */}
    <Tbody key={"header_" + index}>
      <Tr key={"headerRow_" + index} background="bluesoft.50">
        <Td fontWeight="700" textColor="black">
          {data.niveau.libelle}
        </Td>

        <Td></Td>

        {/* Apprentis Niveau info */}
        {displayNiveauDataForStatut(data.niveau.apprentis, "orangesoft")}

        {/* Inscrits Niveau info */}
        {displayNiveauDataForStatut(data.niveau.inscrits, "pinklight")}

        {/* Abandons Niveau info */}
        {displayNiveauDataForStatut(data.niveau.abandons, "bluedark")}
      </Tr>
    </Tbody>

    {/* Niveau formations detail */}
    <Tbody key={"detail_" + index}>
      {data?.formations?.map((item, index) => buildFormationDetailRow(item, index, data.niveau))}
    </Tbody>
  </>
);

const displayNiveauDataForStatut = (statutData, colorScheme) => (
  <Td>
    <HStack>
      <Progress
        width="50%"
        size="sm"
        colorScheme={colorScheme}
        value={getPercentage(statutData.nbTotalForNiveau, statutData.nbTotal)}
      />{" "}
      <Text color="grey.800" fontSize="gamma" fontWeight="700">
        {statutData.nbTotalForNiveau}
      </Text>
    </HStack>
  </Td>
);

const buildFormationDetailRow = (formationData, index, niveauData) => (
  <Tr key={"detailRow_" + index} textAlign="left">
    <Td textColor="black">{formationData.libelle}</Td>
    <Td textColor="black">{toPrettyYearLabel(formationData.annee)}</Td>

    {/* Apprentis détail */}
    {displayFormationDataForStatut(formationData.apprentis, niveauData.apprentis.nbTotal, "orangesoft")}
    {/* Inscrits détail */}
    {displayFormationDataForStatut(formationData.inscrits, niveauData.inscrits.nbTotal, "pinklight")}
    {/* Abandons détail */}
    {displayFormationDataForStatut(formationData.abandons, niveauData.abandons.nbTotal, "bluedark")}
  </Tr>
);

const displayFormationDataForStatut = (statutData, nbStatutsTotal, colorScheme) => (
  <Td>
    <HStack>
      <Progress
        width="50%"
        size="sm"
        colorScheme={colorScheme}
        value={getPercentage(statutData.nbTotalForNiveau, nbStatutsTotal)}
      />{" "}
      <Text color="grey.800" fontSize="gamma" fontWeight="700">
        {statutData.nbTotalForNiveau > 0 && statutData.nbTotalForNiveau}
      </Text>
    </HStack>
  </Td>
);

RepartitionEffectifsParNiveauEtAnneeFormation.propTypes = {
  repartitionEffectifs: PropTypes.shape({
    page: PropTypes.number.isRequired,
    per_page: PropTypes.number.isRequired,
    pre_page: PropTypes.number,
    next_page: PropTypes.number,
    total: PropTypes.number.isRequired,
    total_pages: PropTypes.number.isRequired,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        niveau: PropTypes.shape({
          libelle: PropTypes.string,
          apprentis: PropTypes.shape({
            nbTotal: PropTypes.number,
            nbTotalForNiveau: PropTypes.number,
          }).isRequired,
          inscrits: PropTypes.shape({
            nbTotal: PropTypes.number,
            nbTotalForNiveau: PropTypes.number,
          }).isRequired,
          abandons: PropTypes.shape({
            nbTotal: PropTypes.number,
            nbTotalForNiveau: PropTypes.number,
          }).isRequired,
        }).isRequired,
        formations: PropTypes.arrayOf(
          PropTypes.shape({
            libelle: PropTypes.string,
            annee: PropTypes.number,
            apprentis: PropTypes.shape({
              nbTotalForNiveau: PropTypes.number,
            }).isRequired,
            inscrits: PropTypes.shape({
              nbTotalForNiveau: PropTypes.number,
            }).isRequired,
            abandons: PropTypes.shape({
              nbTotalForNiveau: PropTypes.number,
            }).isRequired,
          })
        ).isRequired,
      })
    ),
  }),
  loading: PropTypes.bool,
  error: PropTypes.object,
  _setPage: PropTypes.func.isRequired,
};

export default RepartitionEffectifsParNiveauEtAnneeFormation;
