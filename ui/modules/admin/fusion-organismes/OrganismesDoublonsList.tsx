import { Box, Button, Flex, HStack, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { Row } from "@tanstack/react-table";
import React, { Fragment } from "react";

import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import NewTable from "@/modules/indicateurs/NewTable";
import { Alert, ArrowRightLine, ExternalLinkLine } from "@/theme/components/icons";

import { DuplicateOrganismeDetail } from "./models/DuplicateOrganismeDetail";
import { DuplicateOrganismeGroup } from "./models/DuplicateOrganismeGroup";
import OrganismeDoublonDetailModal from "./OrganismeDoublonDetailModal";

const defaultPaginationState = {
  pageIndex: 0,
  pageSize: 5,
};

const OrganismesDoublonsList = ({ data }) => {
  return (
    <NewTable
      data={data || []}
      loading={false}
      variant="third"
      expandAllRows={true}
      renderSubComponent={RenderSubComponent}
      paginationState={defaultPaginationState}
      columns={[
        {
          header: () => <></>,
          accessorKey: "duplicates",
          cell: ({ row }) => (
            <HStack spacing={6}>
              <Text fontSize="1rem" pt={-2} whiteSpace="nowrap">
                <strong>{Array.from(new Set(row.original?.duplicates?.map((item) => item.nom))).join(" ou ")}</strong>
              </Text>
              <Link
                href={`https://referentiel.apprentissage.onisep.fr/organismes?text=${row.original?._id.siret}`}
                isExternal
                color="bluefrance"
                fontSize="zeta"
              >
                <Text size="8px" textDecoration="underline">
                  Voir dans le référentiel
                  <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
                </Text>
              </Link>
            </HStack>
          ),
          enableSorting: false,
        },
      ]}
    />
  );
};

const RenderSubComponent = (row: Row<DuplicateOrganismeGroup>) => {
  return (
    <Box border="1px" p="12px" mt="-10px   " borderColor="gray.300">
      <Stack spacing={8} ml={10}>
        {row?.original?.duplicates
          // Tri par date de création pour proposition de suppression du moins récent
          ?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((item, index) => (
            <Fragment key={index}>
              <Stack>
                <HStack spacing={4}>
                  <ArrowRightLine />
                  <Text>{item.raison_sociale || item.enseigne || item.nom}</Text>
                </HStack>
                <HStack spacing={6}>
                  <Text color={item.uai ? "black" : "gray.500"}>UAI : {item.uai ?? "Inconnu"}</Text>
                  <Text>SIRET : {item.siret}</Text>
                  <Text color={item.effectifs_count > 0 ? "black" : "gray.500"}>
                    Effectifs : {item.effectifs_count > 0 ? item.effectifs_count : "Non déclaré"}
                  </Text>

                  {!item.uai && (
                    <HStack color="warning" spacing="1">
                      <Alert boxSize={4} mb="0.1rem" />
                      <Text fontSize="0.8rem">Non fiable</Text>
                    </HStack>
                  )}
                </HStack>
              </Stack>
            </Fragment>
          ))}
        <Flex mt="4">
          {row?.original?.duplicates.length === 2 && (
            <OrganismeDoublonDetailModalContainer duplicatesDetail={row?.original?.duplicates} />
          )}

          {row?.original?.duplicates.length !== 2 && (
            <Ribbons variant="alert" mb={6}>
              <Box ml={3}>
                <Text color="grey.800" fontSize="1.1rem" fontWeight="bold" mr={6} mb={4}>
                  Attention il y a plus de 2 organismes en duplicat, analyse complémentaire nécessaire.
                </Text>
              </Box>
            </Ribbons>
          )}
        </Flex>
      </Stack>
    </Box>
  );
};

const OrganismeDoublonDetailModalContainer = ({
  duplicatesDetail,
}: {
  duplicatesDetail: DuplicateOrganismeDetail[];
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Fragment>
      <Button size="md" variant="secondary" onClick={onOpen}>
        <Box as="i" className="ri-eye-line" fontSize="epsilon" mr={2} />
        <Text as="span">Voir les détails</Text>
      </Button>

      <OrganismeDoublonDetailModal
        isOpen={isOpen}
        onClose={onClose}
        duplicatesDetail={[duplicatesDetail[0], duplicatesDetail[1]]}
      />
    </Fragment>
  );
};

export default OrganismesDoublonsList;
