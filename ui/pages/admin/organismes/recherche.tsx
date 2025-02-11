import { SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Stack,
  Spinner,
  Text,
  VStack,
  Code,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Container,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Center,
  SimpleGrid,
  Heading,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { CellContext } from "@tanstack/react-table";
import { useFormik } from "formik";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useCallback, useMemo } from "react";
import { OrganismeSupportInfoJson, UAI_INCONNUE_TAG_FORMAT } from "shared";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";
import { z } from "zod";

import { _get, _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { EtablissementInfo } from "@/components/admin/organismes/recherche/EtablissementInfo";
import { FormationsInfo } from "@/components/admin/organismes/recherche/FormationsInfo";
import { FormationsPanel } from "@/components/admin/organismes/recherche/FormationsPanel";
import { Label } from "@/components/admin/organismes/recherche/Label";
import { ReferentielInfo } from "@/components/admin/organismes/recherche/ReferentielInfo";
import { RelatedOrganismePanel } from "@/components/admin/organismes/recherche/RelatedOrganismePanel";
import { TdbInfo } from "@/components/admin/organismes/recherche/TdbInfo";
import { TransmissionsPanel } from "@/components/admin/organismes/recherche/TransmissionsPanel";
import { UsersList } from "@/components/admin/organismes/recherche/UsersList";
import Page from "@/components/Page/Page";
import Table from "@/components/Table/Table";
import withAuth from "@/components/withAuth";
import { AddFill, SubtractLine } from "@/theme/components/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const Organisme = () => {
  const title = "Recherche d'organismes";
  const router = useRouter();
  const q = typeof router.query.q !== "string" ? "" : router.query.q;
  const onSubmit = useCallback(
    (values) => {
      router.push(
        {
          pathname: router.pathname,
          query: values,
        },
        undefined,
        {
          shallow: true,
        }
      );
    },
    [router]
  );

  const validate = useCallback((values) => {
    const validation = z.object({ q: z.string().min(3) }).safeParse(values);
    if (validation.success) return {};
    return validation.error.flatten().fieldErrors;
  }, []);

  const initialErrors = useMemo(() => {
    return validate({ q });
  }, [q, validate]);

  const isValid = useMemo(() => {
    return Object.keys(initialErrors).length === 0;
  }, [initialErrors]);

  const formik = useFormik({
    initialValues: { q },
    initialErrors,
    validate,
    onSubmit,
  });

  const { data, isFetching, isSuccess, error } = useQuery<OrganismeSupportInfoJson[], any>(
    ["organisme", "admin", "search", q],
    ({ signal }) => _get<OrganismeSupportInfoJson[]>(`/api/v1/admin/organismes/search/${q}`, { signal }),
    { enabled: isValid }
  );

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Heading as="h1" mb={8} mt={6}>
        {title}
      </Heading>

      <Container maxW="xl" p="8">
        <Box border="1px solid" borderColor="openbluefrance" p={4} mb="4">
          <VStack mb="4" spacing="8" align="stretch">
            <form onSubmit={formik.handleSubmit}>
              <FormControl isInvalid={Boolean(formik.errors.q)} isDisabled={isFetching} isRequired>
                <FormLabel htmlFor="q">{"Recherche d'organisme par SIRET, UAI ou Nom"}</FormLabel>
                <InputGroup id="q">
                  <Input
                    name="q"
                    type="text"
                    placeholder="Exemple : 98765432400019"
                    value={formik.values.q}
                    onChange={formik.handleChange}
                    flex="1"
                    mr="2"
                    _hover={{ textDecoration: "none" }}
                  />
                  <InputRightElement>
                    <Button backgroundColor="bluefrance" type="submit" isLoading={isFetching}>
                      <SearchIcon textColor="white" />
                    </Button>
                  </InputRightElement>
                </InputGroup>

                {Array.isArray(formik.errors.q) &&
                  formik.errors.q.map((error) => <FormErrorMessage key={error}>{error}</FormErrorMessage>)}
                {typeof formik.errors.q === "string" && (
                  <FormErrorMessage key={formik.errors.q}>{formik.errors.q}</FormErrorMessage>
                )}
              </FormControl>
            </form>
          </VStack>
        </Box>

        <Text>
          <strong>{isSuccess ? data.length : ""} organismes</strong>
        </Text>

        {isFetching && (
          <Center>
            <Spinner />
          </Center>
        )}

        {error && (
          <>
            <Text color="error" my="2">
              {error.prettyMessage}
            </Text>
            <Code whiteSpace="pre">{JSON.stringify(error.json, null, 2)}</Code>
          </>
        )}

        {isSuccess && (
          <Table
            data={data}
            columns={[
              {
                header: () => "Nom de l’organisme",
                accessorKey: "nom",
                cell: ({ row }: CellContext<OrganismeSupportInfoJson, any>) => (
                  <Box fontSize="omega" p="2">
                    {row.original.nom ?? "Organisme inconnu"}
                    <Text fontSize="caption" pt={2} color="#777777" whiteSpace="nowrap">
                      UAI&nbsp;:{" "}
                      {(row.original as any).uai ?? (
                        <Text as="span" color="error">
                          {UAI_INCONNUE_TAG_FORMAT}
                        </Text>
                      )}{" "}
                      - SIRET&nbsp;: {row.original.siret}
                    </Text>
                  </Box>
                ),
              },
              {
                header: () => "Tableau de board",
                accessorKey: "tdb",
                enableSorting: false,
                cell: ({ row }: CellContext<OrganismeSupportInfoJson, any>) => (
                  <Label level={row.original.tdb ? "success" : "error"} value={Boolean(row.original.tdb)} />
                ),
              },
              {
                header: () => "Api Entreprise",
                accessorKey: "apiEntreprise",
                enableSorting: false,
                cell: ({ row }: CellContext<OrganismeSupportInfoJson, any>) => (
                  <Label
                    level={row.original.apiEntreprise ? "success" : "error"}
                    value={Boolean(row.original.apiEntreprise)}
                  />
                ),
              },
              {
                header: () => "Referentiel",
                accessorKey: "referentiel",
                enableSorting: false,
                cell: ({ row }: CellContext<OrganismeSupportInfoJson, any>) => (
                  <Label
                    level={row.original.referentiel ? "success" : "error"}
                    value={Boolean(row.original.referentiel)}
                  />
                ),
              },
              {
                header: () => "Catalogue",
                accessorKey: "formations",
                enableSorting: false,
                cell: ({ row }: CellContext<OrganismeSupportInfoJson, any>) => (
                  <Label
                    level={row.original.formations.length > 0 ? "success" : "error"}
                    value={`${row.original.formations.length} formations`}
                  />
                ),
              },
              {
                header: () => "Etat",
                accessorKey: "etat",
                enableSorting: false,
                cell: ({ row }: CellContext<OrganismeSupportInfoJson, any>) => (
                  <Stack direction="row">
                    {row.original.etat.map((e) => (
                      <Label key={e} level={e === "actif" ? "success" : "error"} value={e} />
                    ))}
                  </Stack>
                ),
              },
              {
                header: () => "Effectifs",
                accessorKey: "effectifs",
                enableSorting: false,
                cell: ({ row }: CellContext<OrganismeSupportInfoJson, any>) => <Label value={row.original.effectifs} />,
              },
              {
                header: () => "Transmissions",
                accessorKey: "transmissions",
                enableSorting: false,
                cell: ({ row }: CellContext<OrganismeSupportInfoJson, any>) => (
                  <Label value={row.original.transmissions.length} />
                ),
              },
              {
                size: 25,
                header: () => " ",
                cell: ({ row }: CellContext<OrganismeSupportInfoJson, any>) => {
                  return row.getCanExpand() ? (
                    <Button
                      onClick={() => {
                        row.toggleExpanded();
                      }}
                      cursor="pointer"
                    >
                      {row.getIsExpanded() ? (
                        <SubtractLine fontSize="12px" color="bluefrance" />
                      ) : (
                        <AddFill fontSize="12px" color="bluefrance" />
                      )}
                    </Button>
                  ) : null;
                },
              },
            ]}
            getRowCanExpand={() => true}
            renderSubComponent={({ row }: CellContext<OrganismeSupportInfoJson, any>) => {
              return (
                <Box p="4" ml="4" mt="-1px" mr="-1px" bg="bluegrey.200">
                  <Tabs>
                    <TabList>
                      <Tab fontWeight="bold">Général</Tab>
                      <Tab fontWeight="bold">Utilisateurs ({row.original.organisation?.users.length ?? 0})</Tab>
                      <Tab fontWeight="bold">
                        Mes Responsables ({row.original.tdb?.organismesResponsables?.length ?? 0})
                      </Tab>
                      <Tab fontWeight="bold">
                        Mes Formateurs ({row.original.tdb?.organismesFormateurs?.length ?? 0})
                      </Tab>
                      <Tab fontWeight="bold">Mes Formations ({row.original.formations.length ?? 0})</Tab>
                      <Tab fontWeight="bold">Mes Transmissions</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
                        <SimpleGrid spacing="2">
                          <EtablissementInfo supportInfo={row.original} />
                          <TdbInfo organisme={row.original.tdb} organisation={row.original.organisation} />
                          <ReferentielInfo organisme={row.original.referentiel} />
                          <FormationsInfo
                            organisme={row.original.tdb}
                            formations={row.original.formations as OffreFormation[]}
                          />
                        </SimpleGrid>
                      </TabPanel>
                      <TabPanel>
                        <UsersList users={row.original.organisation?.users ?? null} />
                      </TabPanel>
                      <TabPanel>
                        <RelatedOrganismePanel
                          type="responsables"
                          organisme={row.original.tdb}
                          formations={row.original.formations as OffreFormation[]}
                        />
                      </TabPanel>
                      <TabPanel>
                        <RelatedOrganismePanel
                          type="formateurs"
                          organisme={row.original.tdb}
                          formations={row.original.formations as OffreFormation[]}
                        />
                      </TabPanel>
                      <TabPanel>
                        <FormationsPanel
                          organisme={row.original.tdb}
                          formations={row.original.formations as OffreFormation[]}
                        />
                      </TabPanel>
                      <TabPanel>
                        <TransmissionsPanel organisme={row.original.tdb} transmissions={row.original.transmissions} />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              );
            }}
          />
        )}
      </Container>
    </Page>
  );
};

export default withAuth(Organisme, ["ADMINISTRATEUR"]);
