import { Box, Button, Divider, HStack, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { Row } from "@tanstack/react-table";
import React from "react";

import { DuplicateEffectif } from "@/common/types/duplicatesEffectifs";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import { toPascalCase } from "@/common/utils/stringUtils";
import NewTable from "@/modules/indicateurs/NewTable";
import { Alert, ArrowRightLine } from "@/theme/components/icons";

import EffectifDoublonDetailModal from "./EffectifDoublonDetailModal";

const transformNomPrenomToPascalCase = (row) =>
  `${toPascalCase(row.original?._id?.prenom_apprenant)} ${toPascalCase(row.original?._id?.nom_apprenant)}`;

const defaultPaginationState = {
  pageIndex: 0,
  pageSize: 5,
};

const EffectifsDoublonsList = ({ data }) => {
  return (
    <NewTable
      mt={4}
      data={data || []}
      loading={false}
      variant="third"
      isRowExpanded={true}
      renderSubComponent={RenderSubComponent}
      paginationState={defaultPaginationState}
      renderDivider={() => <Divider marginTop="2px" orientation="horizontal" verticalAlign="middle" opacity="1" />}
      columns={[
        {
          header: () => "Année scolaire",
          accessorKey: "_id",
          cell: ({ row }) => (
            <Text fontSize="1rem" pt={2} whiteSpace="nowrap">
              {row.original?._id?.annee_scolaire}
            </Text>
          ),
        },
        {
          header: () => "Nom de l'apprenant",
          accessorKey: "_id",
          cell: ({ row }) => (
            <Text fontSize="1rem" pt={2} whiteSpace="nowrap">
              {transformNomPrenomToPascalCase(row)}
            </Text>
          ),
        },
        {
          header: () => "Né.e le",
          accessorKey: "_id",
          cell: ({ row }) => (
            <Text fontSize="1rem" pt={2} whiteSpace="nowrap">
              {`Né.e le ${formatDateDayMonthYear(row.original?._id?.date_de_naissance_apprenant)}`}
            </Text>
          ),
        },
        {
          header: () => "Code formation diplôme",
          accessorKey: "_id",
          cell: ({ row }) => (
            <Text fontSize="1rem" pt={2} whiteSpace="nowrap">
              {`CFD : ${row.original?._id?.formation_cfd}`}
            </Text>
          ),
        },
        {
          header: () => "Nombre de duplicats",
          accessorKey: "_id",
          cell: ({ row }) => (
            <HStack>
              <Alert mt={2} />
              <Text
                fontSize="1rem"
                pt={2}
                whiteSpace="nowrap"
              >{`${row?.original?.duplicatesIds.length} duplicats`}</Text>
            </HStack>
          ),
        },
      ]}
    />
  );
};

const RenderSubComponent = (row: Row<DuplicateEffectif>) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Stack spacing={6} mt={4} mb={4} ml={10}>
      {row?.original?.duplicatesIds.map((item, index) => (
        <>
          <HStack spacing={4} key={index}>
            <ArrowRightLine />
            <Text>
              <b>{`${transformNomPrenomToPascalCase(row)}`}</b>
            </Text>
            <Text>
              <i>{`version ${index + 1} (${item})`}</i>
            </Text>

            <Button size="xs" variant="secondary" onClick={onOpen}>
              <Box as="i" className="ri-eye-line" fontSize="epsilon" mr={2} />
              <Text as="span">Voir en détail</Text>
            </Button>

            <Button size="xs" variant="secondary" onClick={() => {}}>
              <Box as="i" className="ri-delete-bin-7-line" fontSize="epsilon" mr={2} />
              <Text as="span">Supprimer le duplicat</Text>
            </Button>
          </HStack>
          <EffectifDoublonDetailModal
            title="Modal test"
            isOpen={isOpen}
            onClose={onClose}
            canBeClosed={false}
            bgOverlay="rgba(0, 0, 0, 0.28)"
            currentEffectifId={item}
            currentApprenantNomPrenom={transformNomPrenomToPascalCase(row)}
          />
        </>
      ))}
    </Stack>
  );
};

export default EffectifsDoublonsList;
