"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Link from "next/link";
import { useState } from "react";
import type { CfaInjoignablesSortBy } from "shared/models/data/nationalStats.model";
import type { ICfaInvitesSortBy } from "shared/models/routes/admin/cfa-invites-sans-collab.api";

import { useCfaInjoignablesExport } from "../hooks/useCfaInjoignablesExport";
import { useCfaInvitesExport } from "../hooks/useCfaInvitesExport";
import { usePageForParams } from "../hooks/usePageForParams";
import { useSortableTable } from "../hooks/useSortableTable";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCfaInjoignablesStats, useCfaInvitesSansCollabStats } from "../hooks/useStatsQueries";
import { Localisation } from "../tables/CfaEtablissementsTable";
import tableStyles from "../tables/CfaEtablissementsTable.module.css";
import { SortableTableHeader } from "../tables/SortableTableHeader";
import { ficheCfaUrl } from "../utils";

import { AlerteCard } from "./AlerteCard";
import styles from "./CfaAlertesSection.module.css";

function sortableHeaders<T extends string>(
  columns: Array<{ column: T; label: string; centered?: boolean }>,
  sort: { sortColumn: T; sortDirection: "asc" | "desc"; handleSort: (column: T) => void }
) {
  return columns.map(({ column, label, centered }) => (
    <SortableTableHeader
      key={column}
      column={column}
      label={label}
      currentSortColumn={sort.sortColumn}
      sortDirection={sort.sortDirection}
      onSort={sort.handleSort}
      centered={centered}
    />
  ));
}

function RaisonSociale({
  organismeId,
  nom,
  uai,
  siret,
}: {
  organismeId: string;
  nom: string | null;
  uai: string | null;
  siret: string;
}) {
  return (
    <div className={tableStyles.nameCell}>
      <span className={tableStyles.name}>{nom ?? "Raison sociale inconnue"}</span>
      <span className={tableStyles.meta}>
        UAI : {uai ?? "—"} · SIRET : {siret}
      </span>
      <Link
        href={ficheCfaUrl(organismeId)}
        className="fr-link fr-link--sm fr-link--icon-right fr-icon-arrow-right-line"
      >
        Voir la fiche
      </Link>
    </div>
  );
}

function CfaInvitesAlerte() {
  const { region } = useStatsFilters();
  const [limit, setLimit] = useState(10);
  const sort = useSortableTable<ICfaInvitesSortBy>("invitations", "desc", {
    columnDefaultDirections: { nom: "asc", localisation: "asc" },
  });
  const params = { region, sort_by: sort.sortColumn, sort_order: sort.sortDirection };
  const [page, setPage] = usePageForParams(params);
  const query = useCfaInvitesSansCollabStats({ ...params, page, limit });
  const exporter = useCfaInvitesExport(params);

  return (
    <AlerteCard
      title={
        <>
          Les CFA ont reçu des invitations des Missions Locales mais n&apos;ont{" "}
          <span className={styles.highlight}>pas encore fait de collaborations</span>
        </>
      }
      query={query}
      loadingRows={query.isLoading || (query.isFetching && query.isPlaceholderData)}
      exporter={exporter}
      headers={sortableHeaders<ICfaInvitesSortBy>(
        [
          { column: "nom", label: "Raison sociale" },
          { column: "compte", label: "Compte TBA", centered: true },
          { column: "localisation", label: "Localisation" },
          { column: "invitations", label: "Invitations reçues", centered: true },
        ],
        sort
      )}
      rows={(query.data?.data ?? []).map((row) => [
        <RaisonSociale
          key="nom"
          organismeId={row.organisme_id}
          nom={row.raison_sociale}
          uai={row.uai}
          siret={row.siret}
        />,
        <div key="compte" className={tableStyles.centeredCell}>
          <Badge as="span" noIcon small severity={row.has_account ? "success" : "error"}>
            {row.has_account ? "Oui" : "Non"}
          </Badge>
        </div>,
        <Localisation key="loc" adresse={row.adresse} />,
        <div key="inv" className={tableStyles.centeredCell}>
          {row.invitations_recues}
        </div>,
      ])}
      page={page}
      onPageChange={setPage}
      limit={limit}
      onLimitChange={setLimit}
    />
  );
}

function CfaInjoignablesAlerte() {
  const { region } = useStatsFilters();
  const [limit, setLimit] = useState(10);
  const sort = useSortableTable<CfaInjoignablesSortBy>("taux", "desc", {
    columnDefaultDirections: { nom: "asc", localisation: "asc" },
  });
  const params = { region, sort_by: sort.sortColumn, sort_order: sort.sortDirection };
  const [page, setPage] = usePageForParams(params);
  const query = useCfaInjoignablesStats({ ...params, page, limit });
  const exporter = useCfaInjoignablesExport(params);

  return (
    <AlerteCard
      title={
        <>
          Les CFA qui envoient des dossiers qui se concluent par un{" "}
          <span className={styles.highlight}>taux élevé de jeunes injoignables</span>
        </>
      }
      query={query}
      loadingRows={query.isLoading || (query.isFetching && query.isPlaceholderData)}
      exporter={exporter}
      headers={sortableHeaders<CfaInjoignablesSortBy>(
        [
          { column: "nom", label: "Raison sociale" },
          { column: "localisation", label: "Localisation" },
          { column: "taux", label: "Taux injoignables", centered: true },
        ],
        sort
      )}
      rows={(query.data?.data ?? []).map((row) => [
        <RaisonSociale key="nom" organismeId={row.organisme_id} nom={row.nom} uai={row.uai} siret={row.siret} />,
        <Localisation key="loc" adresse={row.adresse} />,
        <div
          key="taux"
          className={tableStyles.centeredCell}
          title={`${row.injoignables} injoignables sur ${row.traites} dossiers traités`}
        >
          {row.taux} %
        </div>,
      ])}
      page={page}
      onPageChange={setPage}
      limit={limit}
      onLimitChange={setLimit}
    />
  );
}

export function CfaAlertesSection({ injoignables = false }: { injoignables?: boolean }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <span className={`fr-icon-error-warning-line ${styles.sectionIcon}`} aria-hidden="true" />
        Les alertes à surveiller
      </h3>
      <CfaInvitesAlerte />
      {injoignables && <CfaInjoignablesAlerte />}
    </section>
  );
}
