import { Box, Button, Divider, HStack, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { Row } from "@tanstack/react-table";
import React, { Fragment } from "react";

import { formatDateDayMonthYear, prettyPrintDate } from "@/common/utils/dateUtils";
import { toPascalCase } from "@/common/utils/stringUtils";
import NewTable from "@/modules/indicateurs/NewTable";
import { DuplicateEffectifGroup } from "@/modules/mon-espace/effectifs/doublons/models/DuplicateEffectifGroup";
import { Alert, ArrowRightLine } from "@/theme/components/icons";

import EffectifDoublonDetailModal from "./EffectifDoublonDetailModal";
import { DuplicateEffectifDetail } from "./models/DuplicateEffectifDetail";

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
      renderDivider={() => <Divider orientation="horizontal" verticalAlign="middle" opacity="1" />}
      columns={[
        {
          header: () => "Année scolaire",
          accessorKey: "_id",
          cell: ({ row }) => (
            <Text fontSize="1rem" pt={2} whiteSpace="nowrap">
              {row.original?._id?.annee_scolaire}
            </Text>
          ),
          enableSorting: false,
        },
        {
          header: () => "Nom de l'apprenant",
          accessorKey: "_id",
          cell: ({ row }) => (
            <Text fontSize="1rem" pt={2} whiteSpace="nowrap">
              {transformNomPrenomToPascalCase(row)}
            </Text>
          ),
          enableSorting: false,
        },
        {
          header: () => "Né.e le",
          accessorKey: "_id",
          cell: ({ row }) => (
            <Text fontSize="1rem" pt={2} whiteSpace="nowrap">
              {`Né.e le ${formatDateDayMonthYear(row.original?._id?.date_de_naissance_apprenant)}`}
            </Text>
          ),
          enableSorting: false,
        },
        {
          header: () => "Code formation diplôme",
          accessorKey: "_id",
          cell: ({ row }) => (
            <Text fontSize="1rem" pt={2} whiteSpace="nowrap">
              {`CFD : ${row.original?._id?.formation_cfd}`}
            </Text>
          ),
          enableSorting: false,
        },
        {
          header: () => "Nombre d'occurences",
          accessorKey: "_id",
          cell: ({ row }) => (
            <HStack>
              <Alert mt={2} />
              <Text fontSize="1rem" pt={2} whiteSpace="nowrap">
                {row?.original?.duplicates.length}
              </Text>
            </HStack>
          ),
          enableSorting: false,
        },
      ]}
    />
  );
};

const RenderSubComponent = (row: Row<DuplicateEffectifGroup>) => {
  return (
    <Stack spacing={1} mt={-2} ml={10}>
      {row?.original?.duplicates
        // Tri par date de création pour proposition de suppression du moins récent
        ?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((item, index) => (
          <Fragment key={index}>
            <HStack spacing={4}>
              <ArrowRightLine />
              <Text>
                <b>{`${transformNomPrenomToPascalCase(row)}`}</b>
              </Text>
              <Text>
                <i>{`créé le ${prettyPrintDate(item.created_at)}`}</i>
              </Text>
              <Text>
                <i>
                  ERP source : <b>{item.source}</b>
                </i>
              </Text>

              <EffectifDoublonDetailModalContainer index={index} duplicateDetail={item} />

              {index === 0 && (
                <HStack color="warning">
                  <Alert boxSize={4} mt={1} />
                  <Text fontSize="0.7rem"> Duplicat le plus ancien (à supprimer éventuellement)</Text>
                </HStack>
              )}
            </HStack>
          </Fragment>
        ))}
    </Stack>
  );
};

const EffectifDoublonDetailModalContainer = ({
  index,
  duplicateDetail,
}: {
  index: number;
  duplicateDetail: DuplicateEffectifDetail;
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Fragment key={`detailModal_${index}`}>
      <Button size="xs" variant="secondary" onClick={onOpen}>
        <Box as="i" className="ri-eye-line" fontSize="epsilon" mr={2} />
        <Text as="span">Voir en détail</Text>
      </Button>

      <EffectifDoublonDetailModal isOpen={isOpen} onClose={onClose} duplicateDetail={duplicateDetail} />
    </Fragment>
  );
};

export default EffectifsDoublonsList;
