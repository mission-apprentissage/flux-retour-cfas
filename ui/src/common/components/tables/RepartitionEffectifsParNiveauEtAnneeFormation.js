import { HStack, Progress, TableCaption, Tbody, Td, Text, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { getPercentage } from "../../utils/calculUtils";
import { toPrettyYearLabel } from "../../utils/stringUtils";
import { Pagination } from "..";
import Table from "./Table";

const RepartitionEffectifsParNiveauEtAnneeFormation = ({ repartitionEffectifs, loading, error, _setPage }) => {
  let content = null;

  if (repartitionEffectifs) {
    content = (
      <>
        {repartitionEffectifs.data.map((item, index) => buildNiveauRows(item, index))}
        <TableCaption>
          <Pagination
            pagesQuantity={repartitionEffectifs.total_pages}
            currentPage={Number(repartitionEffectifs.page)}
            changePageHandler={_setPage}
          />
        </TableCaption>
      </>
    );
  }

  return (
    <Table
      headers={["Intitulé de la formation", "Année", "apprentis", "apprenants sans contrat", "abandons"]}
      loading={loading}
      error={error}
    >
      {content}
    </Table>
  );
};

const buildNiveauRows = (data, index) => (
  <>
    {/* Niveau Header */}
    <Tbody key={"header_" + index}>
      <Tr key={"headerRow_" + index} background="galt">
        <Td fontWeight="700" color="bluefrance">
          Niveau {data.niveau.libelle}
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
    <Td color="grey.800">{formationData.libelle}</Td>
    <Td color="grey.800">{toPrettyYearLabel(formationData.annee)}</Td>

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
