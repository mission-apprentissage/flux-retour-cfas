"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { normalize, UAI_INCONNUE_TAG_FORMAT, type IOrganismeJson, type IUsersMigrationJson } from "shared";
import type {
  IArchivableOrganismeJson,
  IArchivableOrganismesResponseJson,
} from "shared/models/routes/admin/organismes.api";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { formatDate } from "@/app/_utils/date.utils";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminTable } from "@/app/admin/_components/AdminTable";
import { AdminUsersTable } from "@/app/admin/_components/AdminUsersTable";
import { NatureOrganismeTag } from "@/app/admin/_components/NatureOrganismeTag";
import {
  EtatOrganismeBadge,
  FiabilisationBadge,
  ReferentielBadge,
} from "@/app/admin/_components/OrganismeStatusBadges";
import { TransmissionTag } from "@/app/admin/_components/TransmissionTag";
import { _get } from "@/common/httpClient";

import styles from "./gestion-organismes.module.scss";

const DEFAULT_PAGE_SIZE = 20;
const MIN_SEARCH_LENGTH = 2;

const RATTACHEMENT_FILTERS = {
  tous: { label: "Tous les organismes", matches: () => true },
  utilisateurs: { label: "Ayant des utilisateurs", matches: (row: RowDetail) => row.users.length > 0 },
  delegations: { label: "Ayant des délégations", matches: (row: RowDetail) => row.delegations.length > 0 },
  duplicats: { label: "Ayant des duplicats", matches: (row: RowDetail) => row.duplicats.length > 0 },
  aucun: {
    label: "Sans aucun rattachement",
    matches: (row: RowDetail) => row.users.length + row.delegations.length + row.duplicats.length === 0,
  },
} as const;

type RattachementFilter = keyof typeof RATTACHEMENT_FILTERS;

interface RowDetail {
  delegations: IOrganismeJson[];
  users: IUsersMigrationJson[];
  duplicats: IOrganismeJson[];
}

const ORGANISMES_COLUMNS = [
  { label: "Nom de l’organisme", dataKey: "nom" },
  { label: "Transmission (réception)", dataKey: "transmission" },
  { label: "Transmission (délégations)", dataKey: "delegations" },
  { label: "Fiable", dataKey: "fiabilisation" },
  { label: "Nature", dataKey: "nature" },
  { label: "État", dataKey: "etat" },
  { label: "Effectifs en cours", dataKey: "effectifs_current_year_count" },
  { label: "Effectifs au total", dataKey: "effectifs_count" },
  { label: "Utilisateurs", dataKey: "users" },
  { label: "Duplicats", dataKey: "duplicats" },
];

const numberFormatter = new Intl.NumberFormat("fr-FR");

function plural(count: number) {
  return count > 1 ? "s" : "";
}

function hasDetail(rowData: { detail: RowDetail }) {
  return (
    rowData.detail.delegations.length > 0 || rowData.detail.users.length > 0 || rowData.detail.duplicats.length > 0
  );
}

function Count({ value }: { value: number }) {
  return <span className={value === 0 ? styles.zero : undefined}>{numberFormatter.format(value)}</span>;
}

function OrganismeIdentity({ organisme }: { organisme: IOrganismeJson }) {
  const nom = organisme.nom ?? "Organisme inconnu";

  return (
    <>
      {organisme._id ? (
        <DsfrLink href={`/organismes/${organisme._id}`} arrow="none" className={styles.organismeName}>
          {nom}
        </DsfrLink>
      ) : (
        <span className={styles.organismeName}>{nom}</span>
      )}
      <span className={styles.organismeIds}>
        UAI : {organisme.uai ?? <span className={styles.missingValue}>{UAI_INCONNUE_TAG_FORMAT}</span>} — SIRET :{" "}
        {organisme.siret}
      </span>
    </>
  );
}

function DelegationsTable({ organismes }: { organismes: IOrganismeJson[] }) {
  return (
    <Table
      caption={`${organismes.length} organisme${plural(organismes.length)} dont cet organisme transmet les effectifs`}
      bordered
      headers={["Organisme", "Transmission", "Fiable", "État", "Effectifs en cours", "Effectifs au total"]}
      data={organismes.map((organisme) => [
        <OrganismeIdentity key="identite" organisme={organisme} />,
        <TransmissionTag key="transmission" lastTransmissionDate={organisme.last_transmission_date} />,
        <FiabilisationBadge key="fiabilisation" statut={organisme.fiabilisation_statut} />,
        <EtatOrganismeBadge key="etat" ferme={organisme.ferme} />,
        <Count key="effectifs-en-cours" value={organisme.effectifs_current_year_count ?? 0} />,
        <Count key="effectifs-total" value={organisme.effectifs_count ?? 0} />,
      ])}
    />
  );
}

function DuplicatsTable({ organismes }: { organismes: IOrganismeJson[] }) {
  return (
    <Table
      caption={`${organismes.length} organisme${plural(organismes.length)} partageant le même SIRET`}
      bordered
      headers={[
        "Organisme",
        "Transmission",
        "Référentiel",
        "Nature",
        "Fiable",
        "État",
        "Effectifs en cours",
        "Effectifs au total",
      ]}
      data={organismes.map((organisme) => [
        <OrganismeIdentity key="identite" organisme={organisme} />,
        <TransmissionTag key="transmission" lastTransmissionDate={organisme.last_transmission_date} />,
        <ReferentielBadge key="referentiel" statut={organisme.est_dans_le_referentiel} />,
        <NatureOrganismeTag key="nature" nature={organisme.nature ?? "inconnue"} />,
        <FiabilisationBadge key="fiabilisation" statut={organisme.fiabilisation_statut} />,
        <EtatOrganismeBadge key="etat" ferme={organisme.ferme} />,
        <Count key="effectifs-en-cours" value={organisme.effectifs_current_year_count ?? 0} />,
        <Count key="effectifs-total" value={organisme.effectifs_count ?? 0} />,
      ])}
    />
  );
}

function toTableRow(organisme: IArchivableOrganismeJson) {
  const delegations = organisme.organismes_transmis;
  const duplicats = organisme.organismes_duplicats;
  const users = organisme.users;
  const lastDelegationDate = delegations
    .map((delegation) => delegation.last_transmission_date)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);

  return {
    _id: String(organisme._id),
    rawData: {
      nom: normalize(organisme.nom ?? ""),
      transmission: organisme.last_transmission_date ? new Date(organisme.last_transmission_date).getTime() : 0,
      delegations: delegations.length,
      fiabilisation: organisme.fiabilisation_statut ?? "",
      nature: organisme.nature ?? "",
      etat: organisme.ferme ? 1 : 0,
      effectifs_current_year_count: organisme.effectifs_current_year_count ?? 0,
      effectifs_count: organisme.effectifs_count ?? 0,
      users: users.length,
      duplicats: duplicats.length,
      detail: { delegations, users, duplicats },
      uai: normalize(organisme.uai ?? ""),
      siret: organisme.siret ?? "",
    },
    element: {
      nom: <OrganismeIdentity organisme={organisme} />,
      transmission: <TransmissionTag lastTransmissionDate={organisme.last_transmission_date} />,
      delegations:
        delegations.length === 0 ? (
          <span className={styles.zero}>Aucune</span>
        ) : (
          <span className={styles.delegations}>
            <Badge severity="info" small>
              {delegations.length} délégation{plural(delegations.length)}
            </Badge>
            {lastDelegationDate && <span className={styles.delegationsDate}>Le {formatDate(lastDelegationDate)}</span>}
          </span>
        ),
      fiabilisation: <FiabilisationBadge statut={organisme.fiabilisation_statut} />,
      nature: <NatureOrganismeTag nature={organisme.nature ?? "inconnue"} />,
      etat: <EtatOrganismeBadge ferme={organisme.ferme} />,
      effectifs_current_year_count: <Count value={organisme.effectifs_current_year_count ?? 0} />,
      effectifs_count: <Count value={organisme.effectifs_count ?? 0} />,
      users: <Count value={users.length} />,
      duplicats: <Count value={duplicats.length} />,
    },
  };
}

function mergeOrganismesByIdentity(organismes: IArchivableOrganismesResponseJson) {
  const byOrganisme = new Map<string, IArchivableOrganismeJson>();

  for (const organisme of organismes) {
    const id = String(organisme._id);
    const known = byOrganisme.get(id);

    if (!known) {
      byOrganisme.set(id, organisme);
      continue;
    }

    const knownUserIds = new Set(known.users.map((user) => String(user._id)));
    byOrganisme.set(id, {
      ...known,
      users: [...known.users, ...organisme.users.filter((user) => !knownUserIds.has(String(user._id)))],
    });
  }

  return [...byOrganisme.values()];
}

function formatErrorDetail(error: any) {
  const serverMessage = typeof error?.messages === "string" ? error.messages : error?.messages?.message;
  const message = serverMessage ?? error?.prettyMessage ?? error?.message ?? "erreur inconnue";

  return [message, error?.statusCode ? `code ${error.statusCode}` : null].filter(Boolean).join(" — ");
}

export default function GestionOrganismesClient() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState("");
  const [rattachementFilter, setRattachementFilter] = useState<RattachementFilter>("tous");

  const {
    data: organismes,
    error,
    isLoading,
  } = useQuery<IArchivableOrganismesResponseJson, any>({
    queryKey: ["admin", "organismes-archivables"],
    queryFn: ({ signal }) => _get("/api/v1/admin/organismes/archivables", { signal }),
  });

  const rows = useMemo(() => mergeOrganismesByIdentity(organismes ?? []).map(toTableRow), [organismes]);

  const filteredRows = useMemo(() => {
    const search = normalize(searchValue.trim());
    const hasSearch = search.length >= MIN_SEARCH_LENGTH;
    const { matches } = RATTACHEMENT_FILTERS[rattachementFilter];

    return rows.filter(
      ({ rawData }) =>
        matches(rawData.detail) &&
        (!hasSearch ||
          rawData.nom.includes(search) ||
          rawData.uai.startsWith(search) ||
          rawData.siret.startsWith(search))
    );
  }, [rows, searchValue, rattachementFilter]);

  const sortedRows = useMemo(() => {
    const [criterion] = sorting;
    if (!criterion) return filteredRows;

    const direction = criterion.desc ? -1 : 1;
    return [...filteredRows].sort((a, b) => {
      const left = a.rawData[criterion.id];
      const right = b.rawData[criterion.id];
      if (typeof left === "number" && typeof right === "number") return direction * (left - right);
      return direction * String(left ?? "").localeCompare(String(right ?? ""));
    });
  }, [filteredRows, sorting]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, rattachementFilter, sorting]);

  const lastPage = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const isFiltered = searchValue.trim().length >= MIN_SEARCH_LENGTH || rattachementFilter !== "tous";

  return (
    <>
      <AdminPageHeader
        title="Organismes absents du référentiel"
        intro={
          organismes
            ? isFiltered
              ? `${numberFormatter.format(sortedRows.length)} résultat${plural(sortedRows.length)} sur ${numberFormatter.format(rows.length)} organisme${plural(rows.length)}`
              : rows.length > 1
                ? `${numberFormatter.format(rows.length)} organismes ne figurent pas dans le référentiel Onisep et sont candidats à l’archivage`
                : `${rows.length} organisme ne figure pas dans le référentiel Onisep et est candidat à l’archivage`
            : undefined
        }
      />

      {error ? (
        <Alert
          severity="error"
          title="Impossible de charger les organismes"
          description={
            <>
              <p>
                Le chargement des organismes absents du référentiel a échoué. Veuillez réessayer ultérieurement, et
                signaler l’incident au support si le problème persiste.
              </p>
              <p className={styles.errorDetail}>Détail : {formatErrorDetail(error)}</p>
            </>
          }
        />
      ) : isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <div className={styles.controls}>
            <Input
              className={styles.searchField}
              label="Rechercher un organisme"
              hintText="Nom, UAI ou SIRET (2 caractères minimum)"
              nativeInputProps={{
                type: "search",
                value: searchValue,
                onChange: (event) => setSearchValue(event.target.value),
              }}
            />
            <Select
              className={styles.filterField}
              label="Rattachements"
              hint="Utilisateurs, délégations, duplicats"
              nativeSelectProps={{
                value: rattachementFilter,
                onChange: (event) => setRattachementFilter(event.target.value as RattachementFilter),
              }}
            >
              {Object.entries(RATTACHEMENT_FILTERS).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.tableContainer}>
            <AdminTable
              data={pageRows}
              columns={ORGANISMES_COLUMNS}
              tableLabel="Organismes absents du référentiel"
              pagination={{ total: sortedRows.length, page: currentPage, limit: pageSize, lastPage }}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSize={pageSize}
              sorting={sorting}
              onSortingChange={setSorting}
              expandColumnLabel="Délégations, utilisateurs et duplicats"
              getRowCanExpand={hasDetail}
              renderSubComponent={(rowData) => (
                <div className={styles.detail}>
                  {rowData.detail.delegations.length > 0 && (
                    <DelegationsTable organismes={rowData.detail.delegations} />
                  )}
                  {rowData.detail.users.length > 0 && (
                    <AdminUsersTable
                      users={rowData.detail.users}
                      caption={`${rowData.detail.users.length} utilisateur${plural(rowData.detail.users.length)} rattaché${plural(rowData.detail.users.length)} à cet organisme`}
                    />
                  )}
                  {rowData.detail.duplicats.length > 0 && <DuplicatsTable organismes={rowData.detail.duplicats} />}
                </div>
              )}
              emptyMessage={
                isFiltered
                  ? "Aucun organisme ne correspond à votre recherche."
                  : "Aucun organisme absent du référentiel : il n’y a rien à traiter."
              }
            />
          </div>
        </>
      )}
    </>
  );
}
