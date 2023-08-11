import { Box, Text, Tooltip } from "@chakra-ui/react";
import { AccessorKeyColumnDef, SortingState } from "@tanstack/react-table";
import { useState } from "react";

import { _get } from "@/common/httpClient";
import { FormationBase } from "@/common/internal/Formation";
import NewTable from "@/modules/indicateurs/NewTable";

import { niveauFormationByNiveau } from "../indicateurs/filters/FiltreFormationNiveau";

const formationsTableColumnsDefs: AccessorKeyColumnDef<FormationBase, any>[] = [
  {
    header: () => "Intitulé et lieu de la formation",
    accessorKey: "intitule_long",
    cell: ({ row }) => (
      <>
        <Text>{row.original.intitule_long}</Text>
        <Text mt={2} color="#3A3A3A">
          {row.original.lieu_formation_adresse}
        </Text>
      </>
    ),
  },
  {
    accessorKey: "cfd",
    header: () => (
      <>
        Code Diplôme
        <Tooltip
          background="bluefrance"
          color="white"
          label={
            <Box padding="1w">
              <b>Code Formation Diplôme (CFD)</b>
              <Text as="p">
                Codification qui concerne l’ensemble des diplômes technologiques et professionnels des ministères
                certificateurs.
              </Text>
              <Text as="p">
                Y sont ajoutés, en tant que de besoin et à la demande des centres de formation par l’apprentissage, les
                autres diplômes et titres inscrits au répertoire national des certifications professionnelles (RNCP),
                dès lors qu’ils sont préparés par la voie de l’apprentissage.
              </Text>
            </Box>
          }
          aria-label="Code Formation Diplôme. Codification qui concerne l’ensemble des diplômes technologiques et professionnels des
                        ministères certificateurs."
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
  },
  {
    accessorKey: "rncp",
    header: () => (
      <>
        Code RNCP
        <Tooltip
          background="bluefrance"
          color="white"
          label={
            <Box padding="1w">
              <b>Répertoire national des certifications professionnelles (RNCP)</b>
              <Text as="p">
                Le Répertoire national des certifications professionnelles (RNCP) sert à tenir à la disposition de tous
                une information constamment à jour sur les diplômes et les titres à finalité professionnelle ainsi que
                sur les certificats de qualification. La mise à jour du RNCP est confiée à France compétences.
              </Text>
            </Box>
          }
          aria-label=" Le Répertoire national des certifications professionnelles (RNCP) sert à tenir à la disposition de tous une information constamment à jour sur les diplômes et les titres à finalité professionnelle ainsi que sur les certificats de qualification."
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
  },
  {
    accessorKey: "duree_formation_theorique",
    header: () => <>Durée (an)</>,
  },
  {
    accessorKey: "niveau",
    header: () => <>Niveau</>,
    cell: ({ row }) => (
      <>
        <Text>{niveauFormationByNiveau[row.original.niveau]}</Text>
      </>
    ),
  },
];

interface FormationsTableProps {
  formations: FormationBase[];
}
function FormationsTable(props: FormationsTableProps) {
  // TODO tri par niveau d'abord
  const defaultSort: SortingState = [{ desc: false, id: "intitule_long" }];
  const [sort, setSort] = useState<SortingState>(defaultSort);

  return (
    <>
      <NewTable
        data={props.formations || []}
        loading={false}
        sortingState={sort}
        onSortingChange={(state) => setSort(state)}
        columns={formationsTableColumnsDefs}
      />
    </>
  );
}

export default FormationsTable;
