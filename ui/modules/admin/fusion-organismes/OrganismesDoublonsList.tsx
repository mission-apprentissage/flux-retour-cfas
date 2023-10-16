import { Box, Button, HStack, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { Row } from "@tanstack/react-table";
import React, { Fragment } from "react";

import NewTable from "@/modules/indicateurs/NewTable";
import { Alert, ArrowRightLine } from "@/theme/components/icons";

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
      mt={4}
      data={data || []}
      loading={false}
      variant="third"
      isRowExpanded={true}
      renderSubComponent={RenderSubComponent}
      paginationState={defaultPaginationState}
      columns={[
        {
          header: () => <Text color="gray.500">Nom</Text>,
          accessorKey: "duplicates",
          cell: ({ row }) => (
            <Text fontSize="1rem" pt={2} whiteSpace="nowrap">
              <strong>{Array.from(new Set(row.original?.duplicates?.map((item) => item.nom))).join(" ou ")}</strong>
            </Text>
          ),
          enableSorting: false,
        },
      ]}
    />
  );
};

const RenderSubComponent = (row: Row<DuplicateOrganismeGroup>) => {
  return (
    <Box border="1px" p="12px" borderColor="gray.300">
      <Stack spacing={8} mt={1} ml={10}>
        {row?.original?.duplicates
          // Tri par date de création pour proposition de suppression du moins récent
          ?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((item, index) => (
            <Fragment key={index}>
              <Stack>
                <HStack spacing={4}>
                  <ArrowRightLine />
                  <Text>{item.nom}</Text>
                </HStack>
                <HStack spacing={6}>
                  <Text color={item.uai ? "black" : "gray.500"}>UAI : {item.uai ?? "Inconnu"}</Text>
                  <Text>SIRET : {item.siret}</Text>
                  <Text color={item.nbUsers > 0 ? "black" : "gray.500"}>
                    Compte(s) utilisateur(s) : {item.nbUsers > 0 ? item.nbUsers : "Aucun"}
                  </Text>
                  <Text color={item.effectifs_count > 0 ? "black" : "gray.500"}>
                    Effectifs : {item.effectifs_count > 0 ? item.effectifs_count : "Non déclaré"}
                  </Text>
                  <OrganismeDoublonDetailModalContainer index={index} duplicateDetail={item} />
                  {!item.uai && (
                    <HStack color="warning">
                      <Alert boxSize={4} mt={1} />
                      <Text fontSize="0.7rem"> Etablissement non fiable</Text>
                    </HStack>
                  )}
                </HStack>
              </Stack>
            </Fragment>
          ))}
      </Stack>
    </Box>
  );
};

const OrganismeDoublonDetailModalContainer = ({
  index,
  duplicateDetail,
}: {
  index: number;
  duplicateDetail: DuplicateOrganismeDetail;
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Fragment key={`detailModal_${index}`}>
      <Button size="xs" variant="secondary" onClick={onOpen}>
        <Box as="i" className="ri-eye-line" fontSize="epsilon" mr={2} />
        <Text as="span">Voir les détails</Text>
      </Button>

      <OrganismeDoublonDetailModal isOpen={isOpen} onClose={onClose} duplicateDetail={duplicateDetail} />
    </Fragment>
  );
};

export default OrganismesDoublonsList;
