import { Box, HStack, Input, Text, Tooltip } from "@chakra-ui/react";
import { AccessorKeyColumnDef, SortingState } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { formationsExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { Formation } from "@/common/internal/Formation";
import { formatDate } from "@/common/utils/dateUtils";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { normalize } from "@/common/utils/stringUtils";
import DownloadLinkButton from "@/components/buttons/DownloadLinkButton";
import NewTable from "@/modules/indicateurs/NewTable";
import { ArrowDropRightLine } from "@/theme/components/icons";

export type FormationNormalized = Formation & {
  normalizedName: string;
};

const formationsTableColumnsDefs: AccessorKeyColumnDef<Formation, any>[] = [
  {
    header: () => "Intitulé et lieu de la formation",
    accessorKey: "normalizedName",
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
    accessorKey: "rncp_code",
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
    accessorKey: "duree",
    header: () => <>Durée (an)</>,
  },
  {
    accessorKey: "niveau",
    header: () => <>Niveau</>,
  },
  {
    accessorKey: "more",
    enableSorting: false,
    header: () => "Voir",
    cell: () => (
      <>
        <ArrowDropRightLine />
      </>
    ),
  },
];

interface FormationsTableProps {
  formations: FormationNormalized[];
}
function FormationsTable(props: FormationsTableProps) {
  const defaultSort: SortingState = [{ desc: false, id: "normalizedName" }];
  const [searchValue, setSearchValue] = useState<string>("");
  const [sort, setSort] = useState<SortingState>(defaultSort);

  const filteredFormations = useMemo(() => {
    if (searchValue.length < 2) {
      return props.formations;
    }

    const normalizedSearchValue = normalize(searchValue);
    return props.formations.filter(
      (formation) =>
        formation.normalizedName.includes(normalizedSearchValue) ||
        formation.cfd?.startsWith(normalizedSearchValue) ||
        formation.rncp_code?.startsWith(normalizedSearchValue)
    );
  }, [props.formations, searchValue]);

  return (
    <>
      <HStack mb="4">
        <Input
          type="text"
          name="search_formation"
          placeholder="Rechercher une formation par intitulé, CFD ou RNCP (indiquez au moins deux caractères)"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          flex="1"
          mr="2"
        />

        <DownloadLinkButton
          action={() => {
            exportDataAsXlsx(
              `tdb-formations-${formatDate(new Date(), "dd-MM-yy")}.xlsx`,
              filteredFormations,
              formationsExportColumns
            );
          }}
        >
          Télécharger la liste
        </DownloadLinkButton>
      </HStack>

      <NewTable
        data={filteredFormations || []}
        loading={false}
        sortingState={sort}
        onSortingChange={(state) => setSort(state)}
        columns={formationsTableColumnsDefs}
      />
    </>
  );
}

export default FormationsTable;
