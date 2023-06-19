import { Box, Center, Container, Heading, Spinner, Text, Tooltip } from "@chakra-ui/react";
import { SortingState } from "@tanstack/react-table";
import { isBefore, subMonths } from "date-fns";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";

import { _get } from "@/common/httpClient";
import { OrganisationType } from "@/common/internal/Organisation";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import { normalize } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import TooltipNatureOrganisme from "@/components/tooltips/TooltipNatureOrganisme";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganismes } from "@/hooks/organismes";
import useAuth from "@/hooks/useAuth";
import NatureOrganismeTag from "@/modules/indicateurs/NatureOrganismeTag";
import NewTable from "@/modules/indicateurs/NewTable";
import { convertPaginationInfosToQuery } from "@/modules/models/pagination";
import { Input } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";
import { ArrowDropRightLine } from "@/theme/components/icons";

function getHeaderTitleFromOrganisationType(type: OrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR":
      return "Mes organismes formateurs";

    case "TETE_DE_RESEAU":
      return "Les organismes de mon réseau";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
      return "Les organismes de mon territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return "Tous les organismes";

    default:
      throw new Error(`Type '${type}' inconnu`);
  }
}

function isSortingState(value: any): value is SortingState {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && "id" in item && "desc" in item);
}

function isMoreThanOrEqualOneMonthAgo(date: Date | string) {
  const oneMonthAgo = subMonths(new Date(), 1);
  const dateAsDate = typeof date === "string" ? new Date(date) : date;
  return isBefore(dateAsDate, oneMonthAgo) || dateAsDate.getTime() === oneMonthAgo.getTime();
}

function MesOrganismes() {
  const title = "Mes organismes";
  const defaultSort: SortingState = [{ desc: false, id: "nom" }];
  const { organisationType } = useAuth();
  const router = useRouter();
  const { isLoading, organismes } = useOrganisationOrganismes();
  const [searchValue, setSearchValue] = useState<string>(String(router.query.search ?? ""));
  const [sort, setSort] = useState<SortingState>(defaultSort);

  // Init search value and sort from query on load.
  useEffect(() => {
    if (!router.isReady) return;
    const search = router.query.search;
    const sort = router.query.sort;
    if (search && search !== searchValue) setSearchValue(search as string);
    if (sort) {
      setSort(defaultSort);
      try {
        const parsedSort = JSON.parse(sort as string);
        if (isSortingState(parsedSort)) setSort(parsedSort);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
  }, [router.isReady]);

  // Update router on search value or sort change.
  useEffect(() => {
    if (!router.isReady) return;
    const query = { search: searchValue ?? undefined, ...convertPaginationInfosToQuery({ sort }) };
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [searchValue, sort, router.isReady]);

  // We need to memorize organismes with normalized names to be avoid running the normalization on each keystroke.
  const organismesWithNormalizedNames = useMemo(() => {
    return (organismes || []).map((organisme) => ({
      ...organisme,
      normalizedName: normalize(organisme.nom || ""),
      normalizedUai: normalize(organisme.uai || ""),
      normalizedCommune: normalize(organisme.adresse?.commune || ""),
    }));
  }, [organismes]);

  // Simple search: filter organismes by name that contains the search value.
  const filteredOrganismes = useMemo(() => {
    if (searchValue.length < 2) return organismes;

    const normalizedSearchValue = normalize(searchValue);
    return organismesWithNormalizedNames.filter(
      (organisme) =>
        organisme.normalizedName.includes(normalizedSearchValue) ||
        organisme.normalizedUai?.startsWith(normalizedSearchValue) ||
        organisme.siret?.startsWith(normalizedSearchValue) ||
        organisme.normalizedCommune.startsWith(normalizedSearchValue)
    );
  }, [organismesWithNormalizedNames, searchValue]);

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          {getHeaderTitleFromOrganisationType(organisationType)}
        </Heading>

        {isLoading && !organismes && (
          <Center>
            <Spinner />
          </Center>
        )}
        {!isLoading && organismes && (
          <>
            <Input
              {...{
                name: "search_organisme",
                fieldType: "text",
                mask: "C",
                maskBlocks: [
                  {
                    name: "C",
                    mask: "Pattern",
                    pattern: "^.*$",
                  },
                ],
                placeholder: "Rechercher un organisme par nom, UAI, SIRET ou ville (indiquez au moins deux caractères)",
                value: searchValue,
                onSubmit: (value: string) => setSearchValue(value.trim()),
              }}
            />

            <NewTable
              mt={4}
              data={filteredOrganismes || []}
              loading={false}
              sortingState={sort}
              onSortingChange={(state) => setSort(state)}
              columns={[
                {
                  header: () => "Nom de l’organisme",
                  accessorKey: "nom",
                  cell: ({ row }) => (
                    <>
                      <Link
                        href={`/organismes/${organismes[row.id]._id}`}
                        display="block"
                        fontSize="1rem"
                        width="var(--chakra-sizes-lg)"
                        title={row.original.nom}
                      >
                        {row.original.nom ?? "Organisme inconnu"}
                      </Link>
                      <Text fontSize="xs" pt={2} color="#777777" whiteSpace="nowrap">
                        UAI : {(row.original as any).uai} - SIRET : {(row.original as any).siret}
                      </Text>
                    </>
                  ),
                },
                {
                  accessorKey: "nature",
                  header: () => (
                    <>
                      Nature
                      <TooltipNatureOrganisme />
                    </>
                  ),
                  cell: ({ getValue }) => <NatureOrganismeTag nature={getValue()} />,
                },
                {
                  accessorKey: "ferme",
                  header: () => (
                    <>
                      État
                      <Tooltip
                        background="bluefrance"
                        color="white"
                        label={
                          <Box padding="1w">
                            <b>État de l’établissement</b>
                            <Text as="p">
                              Indication de l’état administratif du SIRET de l’établissement, tel qu’il est renseigné
                              sur l’INSEE. Si cette information est erronée, merci de leur signaler.
                            </Text>
                          </Box>
                        }
                        aria-label="Indication de l’état administratif du SIRET de l’établissement, tel qu’il est renseigné
                        sur l’INSEE."
                      >
                        <Box
                          as="i"
                          className="ri-information-line"
                          fontSize="epsilon"
                          color="grey.500"
                          marginLeft="1v"
                          verticalAlign="middle"
                        />
                      </Tooltip>
                    </>
                  ),
                  cell: ({ getValue }) => (
                    <div>
                      {getValue() ? (
                        <Text color="flatwarm" fontWeight="bold">
                          Fermé
                        </Text>
                      ) : (
                        <Text>Ouvert</Text>
                      )}
                    </div>
                  ),
                },
                {
                  accessorKey: "last_transmission_date",
                  header: () => "Transmission au tdb",
                  cell: ({ getValue }) => {
                    const lastTransmissionDate = getValue();
                    if (!lastTransmissionDate) return <Text color="tomato">Ne transmet pas</Text>;
                    if (isMoreThanOrEqualOneMonthAgo(lastTransmissionDate)) {
                      return (
                        <Text color="orange">
                          Ne transmet plus <br />
                          depuis le {formatDateNumericDayMonthYear(lastTransmissionDate)}
                        </Text>
                      );
                    }
                    return <Text color="green">{formatDateNumericDayMonthYear(lastTransmissionDate)}</Text>;
                  },
                },
                {
                  accessorKey: "adresse",
                  sortingFn: (a, b) => {
                    const communeA = a.original.adresse?.commune || "";
                    const communeB = b.original.adresse?.commune || "";
                    return communeA.localeCompare(communeB);
                  },
                  header: () => (
                    <>
                      Localisation
                      <Tooltip
                        background="bluefrance"
                        color="white"
                        label={
                          <Box padding="1w">
                            <Text as="p">
                              Nom de la commune, code postal et code commune INSEE de l’établissement qui accueille
                              physiquement les apprentis et les forme.
                            </Text>
                          </Box>
                        }
                        aria-label="Nom de la commune, code postal et code commune INSEE de l’établissement qui accueille
                        physiquement les apprentis et les forme."
                      >
                        <Box
                          as="i"
                          className="ri-information-line"
                          fontSize="epsilon"
                          color="grey.500"
                          marginLeft="1v"
                          verticalAlign="middle"
                        />
                      </Tooltip>
                    </>
                  ),
                  cell: ({ row }) => (
                    <Box>
                      {row.original.adresse?.commune || ""}
                      <Text fontSize="xs" pt={2} color="#777777" whiteSpace="nowrap">
                        {row.original.adresse?.code_postal || ""}
                        {row.original.adresse?.code_insee &&
                        row.original.adresse?.code_postal !== row.original.adresse?.code_insee
                          ? ` (Insee: ${row.original.adresse?.code_insee})`
                          : ""}
                      </Text>
                    </Box>
                  ),
                },
                {
                  accessorKey: "more",
                  enableSorting: false,
                  header: () => "Voir",
                  cell: ({ row }) => (
                    <Link href={`/organismes/${organismes[row.id]._id}`} flexGrow={1}>
                      <ArrowDropRightLine />
                    </Link>
                  ),
                },
              ]}
            />
          </>
        )}
      </Container>
    </SimplePage>
  );
}

export default withAuth(MesOrganismes);
