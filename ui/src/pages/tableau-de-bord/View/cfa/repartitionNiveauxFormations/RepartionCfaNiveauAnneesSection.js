import { Center, HStack, Progress, Skeleton, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import PageSectionTitle from "../../../../../common/components/Page/PageSectionTitle";
import { getPercentage } from "../../../../../common/utils/calculUtils";
import { displayYearLabelized } from "../../../../../common/utils/stringUtils";
import withRepartitionNiveauFormationInCfa from "./withRepartitionNiveauFormationInCfa";

const RepartionCfaNiveauAnneesSection = ({ repartitionEffectifs, loading, error }) => {
  return (
    <>
      <PageSectionTitle>Répartition par niveaux et années de formation</PageSectionTitle>

      {/* No data */}
      {!repartitionEffectifs && !error && (
        <>
          <Table mt="5">
            <Thead>
              <Tr background="orangesoft.300">
                <Th fontWeight="400">Intitulé</Th>
                <Th fontWeight="400">Année</Th>
                <Th fontWeight="400">Apprentis</Th>
                <Th fontWeight="400">Inscrits</Th>
                <Th fontWeight="400">Abandons</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr background="orangesoft.200">
                <Td colSpan="5">
                  <Center h="100px" p={4}>
                    <HStack fontSize="gamma">
                      <i className="ri-error-warning-fill"></i>
                      <Text>Aucune information disponible</Text>
                    </HStack>
                  </Center>
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </>
      )}

      {/* Error  */}
      {error && (
        <Center h="100px" p={4} background="orangesoft.200">
          <HStack fontSize="gamma">
            <i className="ri-error-warning-fill"></i>
            <Text>Erreur - merci de contacter un administrateur</Text>
          </HStack>
        </Center>
      )}

      {/* Loading  */}
      {loading && (
        <>
          <Table mt="5">
            <Thead>
              <Tr background="bluesoft.100">
                <Th
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  Intitulé
                </Th>
                <Th
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  Année
                </Th>
                <Th
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  Apprentis
                </Th>
                <Th
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  Apprenants sans contrat
                </Th>
                <Th
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  Abandons
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr textAlign="left">
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
              </Tr>
              <Tr textAlign="left">
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
              </Tr>
              <Tr textAlign="left">
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
                <Td>
                  <Skeleton width="100%" p={5} />
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </>
      )}

      {/* Data */}
      {repartitionEffectifs && !error && !loading && (
        <>
          <Table mt="5">
            <Thead>
              <Tr background="bluesoft.100">
                <Th
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  Intitulé
                </Th>
                <Th
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  Année
                </Th>
                <Th
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  Apprentis
                </Th>
                <Th
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  Apprenants sans contrat
                </Th>
                <Th
                  textTransform="initial"
                  textColor="grey.600"
                  fontSize="epsilon"
                  fontWeight="400"
                  letterSpacing="0px"
                >
                  Abandons
                </Th>
              </Tr>
            </Thead>
            {repartitionEffectifs.map((item, index) => buildNiveauRows(item, index))}
          </Table>
        </>
      )}
    </>
  );
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
    <Td textColor="black">{displayYearLabelized(formationData.annee)}</Td>

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

RepartionCfaNiveauAnneesSection.propTypes = {
  repartitionEffectifs: PropTypes.arrayOf(
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
  loading: PropTypes.bool,
  error: PropTypes.object,
};
export default withRepartitionNiveauFormationInCfa(RepartionCfaNiveauAnneesSection);
