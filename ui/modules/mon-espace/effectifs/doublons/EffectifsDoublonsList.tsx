import { Box } from "@chakra-ui/react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import React from "react";
import { DuplicateEffectifGroup, DuplicateEffectifGroupTransformer } from "shared";

import CustomTable from "@/components/Table/CustomTable";

import EffectifsDoublonsDetailTable from "./EffectifsDoublonsDetailTable";

const transformNomPrenomToPascalCase = (nom: string, prenom: string) => {
  const formatName = (str: string) => `${str.charAt(0).toUpperCase()}${str.slice(1).toLowerCase()}`;
  return `${formatName(nom)} ${formatName(prenom)}`;
};

interface EffectifsDoublonsListProps {
  data: any[];
  onPageChange: (newPageIndex: number) => void;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  onPageSizeChange: (newPageSize: number) => void;
}

const EffectifsDoublonsList = ({
  data,
  onPageChange,
  pageIndex,
  pageSize,
  totalPages,
  onPageSizeChange,
}: EffectifsDoublonsListProps) => {
  const transformedData: DuplicateEffectifGroupTransformer[] = data.map((item: DuplicateEffectifGroup) => {
    const mostRecentDuplicate = item.duplicates[0];

    const dateDeNaissanceApprenant = mostRecentDuplicate.apprenant?.date_de_naissance
      ? new Date(mostRecentDuplicate.apprenant.date_de_naissance)
      : "Date de naissance inconnue";

    const dossierCreeLe = new Date(mostRecentDuplicate.created_at);

    return {
      ...item,
      nom_apprenant: mostRecentDuplicate.apprenant?.nom || "",
      prenom_apprenant: mostRecentDuplicate.apprenant?.prenom || "",
      date_de_naissance_apprenant: dateDeNaissanceApprenant,
      code_diplome_apprenant: mostRecentDuplicate.formation?.cfd || "",
      source: mostRecentDuplicate.source,
      dossier_cree_le: dossierCreeLe,
    };
  });

  const columns: ColumnDef<DuplicateEffectifGroupTransformer>[] = [
    {
      accessorKey: "_id.annee_scolaire",
      header: "Année Scolaire",
      cell: (info) => info.getValue(),
    },
    {
      accessorFn: (row) => transformNomPrenomToPascalCase(row.nom_apprenant, row.prenom_apprenant),
      id: "nom_complet",
      header: "Nom de l’apprenant",
      cell: (info) => info.getValue(),
    },
    {
      id: "date_de_naissance_apprenant",
      header: "Date de naissance",
      accessorKey: "date_de_naissance_apprenant",
      cell: (info) => {
        const value = info.getValue();
        if (value instanceof Date) {
          return format(value, "dd/MM/yyyy");
        }
        return value;
      },
    },
    {
      id: "code_diplome_apprenant",
      header: "Code Diplôme",
      accessorKey: "code_diplome_apprenant",
      cell: (info) => info.getValue(),
    },
    {
      id: "occurrences",
      header: "Occurences",
      accessorFn: (row) => row.duplicates.length,
      cell: (info) => info.getValue(),
    },
    {
      id: "source",
      header: "Source",
      accessorKey: "source",
      cell: (info) => info.getValue(),
    },
    {
      id: "dossier_cree_le",
      header: "Dossier créé le",
      accessorKey: "dossier_cree_le",
      cell: (info) => {
        const value = info.getValue();
        if (value instanceof Date) {
          return format(value, "dd/MM/yyyy");
        }
        return value;
      },
    },
  ];

  return (
    <CustomTable
      data={transformedData}
      columns={columns}
      showPagination={true}
      pageCount={totalPages}
      paginationState={{ pageIndex, pageSize }}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      renderRowSubComponent={({ row }) => (
        <Box p="5" borderWidth="1px">
          <EffectifsDoublonsDetailTable data={row} />
        </Box>
      )}
    />
  );
};

export default EffectifsDoublonsList;
