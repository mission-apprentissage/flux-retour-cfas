import {
  Box,
  Heading,
  HStack,
  Select,
  Skeleton,
  Stack,
  Table,
  TableCaption,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Page, Pagination, Section } from "../../../common/components";
import withCfasReferentielData from "./withCfasReferentielData";

const CfasReferentielPage = ({
  data,
  regionsData,
  error,
  loading,
  _fetch,
  onConnectionChange,
  onRegionChange,
  defaultSelectedRegionCode,
}) => {
  return (
    <Page>
      <Section backgroundColor="galt" paddingY="4w" boxShadow="inset 0px 12px 12px 0px rgba(30, 30, 30, 0.08)">
        <Heading as="h1" variant="h1">
          Référentiel des organismes de formation
        </Heading>
      </Section>
      <Section marginTop="4w">
        <Stack spacing="4w">
          {regionsData && (
            <Box background="bluegrey.200" padding="4w" width="100%">
              <Stack spacing="2w">
                {/* Filtre Régions */}
                <HStack>
                  <Text>
                    <i className="ri-map-pin-2-fill"></i>
                  </Text>
                  <Text>Région :</Text>
                  <Select
                    defaultValue={defaultSelectedRegionCode}
                    onChange={(e) => onRegionChange(e.target.value)}
                    width="30%"
                  >
                    {regionsData.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.nom}
                      </option>
                    ))}
                  </Select>
                </HStack>

                {/* Filtre Branchement */}
                <HStack>
                  <Text>
                    <i className="ri-plug-line"></i>
                  </Text>
                  <Text>Branchement des données : </Text>
                  <Select defaultValue={-1} onChange={(e) => onConnectionChange(e.target.value)} width="30%">
                    <option value={-1}>-- Peu importe --</option>
                    <option value={1}>Avec branchement des données</option>
                    <option value={0}>Sans branchement des données</option>
                  </Select>
                </HStack>
              </Stack>
            </Box>
          )}

          {/* Error */}
          {error && (
            <Text>
              <p>Erreur lors du chargement des organismes de formation Référentiels</p>
            </Text>
          )}

          {/* Loading */}
          {loading && (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nom de l&apos;organisme de formation</Th>
                  <Th>SIRET</Th>
                  <Th>UAI</Th>
                  <Th>Region</Th>
                  <Th>Branchement Tdb</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Array.from(Array(10), (e, i) => {
                  return (
                    <Tr key={i}>
                      <Td>
                        <Skeleton height="20px" />
                      </Td>
                      <Td>
                        <Skeleton height="20px" />
                      </Td>
                      <Td>
                        <Skeleton height="20px" />
                      </Td>
                      <Td>
                        <Skeleton height="20px" />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}

          {/* Data */}
          {data && !error && !loading && (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nom de l&apos;organisme de formation</Th>
                  <Th>SIRET</Th>
                  <Th>UAI</Th>
                  <Th>Region</Th>
                  <Th>Branchement Tdb</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.cfas.map((cfa) => (
                  <Tr key={cfa._id}>
                    <Td>{cfa.nom}</Td>
                    <Td>{cfa.siret}</Td>
                    <Td>{cfa.uai}</Td>
                    <Td>{cfa.region_nom}</Td>
                    <Td>
                      {cfa.branchement_flux_cfa_erp ? (
                        <Tag colorScheme="green">
                          <i className="ri-thumb-up-line"></i>
                        </Tag>
                      ) : (
                        <Tag colorScheme="red">
                          <i className="ri-close-circle-line"></i>
                        </Tag>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              <TableCaption>
                <Pagination
                  pagesQuantity={data.pagination.nombre_de_page}
                  currentPage={data.pagination.page}
                  changePageHandler={(data) => _fetch(data)}
                />
              </TableCaption>
            </Table>
          )}
        </Stack>
      </Section>{" "}
    </Page>
  );
};

CfasReferentielPage.propTypes = {
  data: PropTypes.object,
  regionsData: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      nom: PropTypes.string.isRequired,
    })
  ),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.object,
  _fetch: PropTypes.func.isRequired,
  onConnectionChange: PropTypes.func.isRequired,
  onRegionChange: PropTypes.func.isRequired,
  defaultSelectedRegionCode: PropTypes.string.isRequired,
};

export default withCfasReferentielData(CfasReferentielPage);
