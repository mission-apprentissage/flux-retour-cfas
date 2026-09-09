"use client";

import { useMemo, useState } from "react";
import { OrganismeSupportInfoJson } from "shared";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";

import { AdminTable } from "@/app/admin/_components/AdminTable";

import { FormationDetails } from "./FormationDetails";
import styles from "./formations-table.module.scss";
import { SupportBadge, SupportValue } from "./SupportBadge";

type OrganismeIdentity = Pick<NonNullable<OrganismeSupportInfoJson["tdb"]>, "siret" | "uai">;
type FormationLike = Partial<OffreFormation> & { cle_ministere_educatif: string };

const PAGE_SIZE = 20;
const collator = new Intl.Collator("fr");

function sortFormations(formations: FormationLike[]): FormationLike[] {
  return [...formations].sort((a, b) => {
    if (!a.cfd && !b.cfd) return collator.compare(a.cle_ministere_educatif, b.cle_ministere_educatif);
    if (!a.cfd) return 1;
    if (!b.cfd) return -1;
    if (a.cfd.code !== b.cfd.code) return collator.compare(a.cfd.code, b.cfd.code);
    return collator.compare(a.annee?.num ?? "", b.annee?.num ?? "");
  });
}

function getNature(formation: FormationLike, organisme: OrganismeIdentity) {
  const isResponsable =
    formation.gestionnaire?.siret === organisme.siret && formation.gestionnaire?.uai === organisme.uai;
  const isFormateur = formation.formateur?.siret === organisme.siret && formation.formateur?.uai === organisme.uai;

  if (isResponsable && isFormateur) return "Responsable formateur";
  return isResponsable ? "Responsable" : "Formateur";
}

export function FormationsTable({
  organisme,
  formations,
  withNature = true,
  tableLabel,
}: {
  organisme: OrganismeIdentity;
  formations: FormationLike[];
  withNature?: boolean;
  tableLabel: string;
}) {
  const [page, setPage] = useState(1);

  const columns = useMemo(
    () => [
      { label: "CFD", dataKey: "cfd", sortable: false },
      { label: "RNCP", dataKey: "rncp", sortable: false },
      ...(withNature ? [{ label: "Nature", dataKey: "nature", sortable: false }] : []),
      { label: "Intitulé", dataKey: "intitule", sortable: false },
      { label: "Niveau", dataKey: "niveau", sortable: false },
      { label: "Durée", dataKey: "duree", sortable: false },
      { label: "Année", dataKey: "annee", sortable: false },
    ],
    [withNature]
  );

  const sorted = useMemo(() => sortFormations(formations), [formations]);
  const hasPagination = sorted.length > PAGE_SIZE;
  const lastPage = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const pageFormations = hasPagination ? sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) : sorted;

  const data = pageFormations.map((formation) => ({
    _id: formation.cle_ministere_educatif,
    rawData: { formation },
    element: {
      cfd: (
        <span className={styles.stack}>
          <SupportValue value={formation.cfd?.code} />
          {formation.cfd?.outdated && <SupportBadge level="error" value="Fermé" />}
        </span>
      ),
      rncp:
        formation.rncps && formation.rncps.length > 0 ? (
          <span className={styles.stack}>
            {formation.rncps.map((rncp) => (
              <SupportValue key={rncp.code} value={rncp.code} />
            ))}
          </span>
        ) : (
          <SupportValue value={null} />
        ),
      nature: <SupportBadge value={getNature(formation, organisme)} />,
      intitule: <SupportValue value={formation.intitule_long} />,
      niveau: <SupportValue value={formation.niveau?.libelle} />,
      duree: <SupportValue value={formation.duree?.theorique} />,
      annee: <SupportValue value={formation.annee?.num} />,
    },
  }));

  return (
    <AdminTable
      data={data}
      columns={columns}
      tableLabel={tableLabel}
      hasPagination={hasPagination}
      pagination={hasPagination ? { total: sorted.length, page: currentPage, limit: PAGE_SIZE, lastPage } : null}
      onPageChange={setPage}
      pageSize={PAGE_SIZE}
      expandColumnLabel="Détail de la formation"
      getRowCanExpand={() => true}
      renderSubComponent={(rowData) => <FormationDetails organisme={organisme} formation={rowData.formation} />}
      emptyMessage="Aucune formation au catalogue pour cet organisme"
    />
  );
}
