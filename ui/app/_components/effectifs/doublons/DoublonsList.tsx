"use client";

import { format } from "date-fns";
import { DuplicateEffectifDetail, DuplicateEffectifGroup } from "shared";

import { DataTable } from "@/app/_components/table/DataTable";

import { DoublonsDetailTable } from "./DoublonsDetailTable";

const transformNomPrenomToPascalCase = (nom: string, prenom: string) => {
  const formatName = (str: string) => `${str.charAt(0).toUpperCase()}${str.slice(1).toLowerCase()}`;
  return `${formatName(nom)} ${formatName(prenom)}`;
};

const COLUMNS = [
  { label: "Année Scolaire", dataKey: "annee_scolaire", sortable: false },
  { label: "Nom de l’apprenant", dataKey: "nom_complet", sortable: false },
  { label: "Date de naissance", dataKey: "date_de_naissance", sortable: false },
  { label: "Code Diplôme", dataKey: "code_diplome", sortable: false },
  { label: "Occurences", dataKey: "occurrences", sortable: false },
  { label: "Source", dataKey: "source", sortable: false },
  { label: "Dossier créé le", dataKey: "dossier_cree_le", sortable: false },
];

interface DoublonsListProps {
  data: DuplicateEffectifGroup[];
  pagination: { total: number; page: number; limit: number; lastPage: number };
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSize: number;
  onRequestDelete: (duplicate: DuplicateEffectifDetail) => void;
}

export function DoublonsList({
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSize,
  onRequestDelete,
}: DoublonsListProps) {
  const tableData = data.map((item) => {
    const mostRecentDuplicate = item.duplicates[0];
    const dateDeNaissance = mostRecentDuplicate.apprenant?.date_de_naissance
      ? format(new Date(mostRecentDuplicate.apprenant.date_de_naissance), "dd/MM/yyyy")
      : "Date de naissance inconnue";

    return {
      rawData: item,
      element: {
        annee_scolaire: (item as any)._id?.annee_scolaire,
        nom_complet: transformNomPrenomToPascalCase(
          mostRecentDuplicate.apprenant?.nom || "",
          mostRecentDuplicate.apprenant?.prenom || ""
        ),
        date_de_naissance: dateDeNaissance,
        code_diplome: mostRecentDuplicate.formation?.cfd || "",
        occurrences: item.duplicates.length,
        source: mostRecentDuplicate.source,
        dossier_cree_le: format(new Date(mostRecentDuplicate.created_at), "dd/MM/yyyy"),
      },
    };
  });

  return (
    <DataTable
      data={tableData}
      columns={COLUMNS}
      tableLabel="Duplicats d’effectifs"
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      pageSize={pageSize}
      emptyMessage="Aucun duplicat d’effectif à afficher"
      renderSubComponent={(rowData) => <DoublonsDetailTable group={rowData} onRequestDelete={onRequestDelete} />}
    />
  );
}
