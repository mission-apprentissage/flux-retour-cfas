"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import format from "date-fns/format/index";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IReseau, normalize, UAI_INCONNUE_TAG_FORMAT } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { PAGES } from "@/app/_utils/routes.utils";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminTable } from "@/app/admin/_components/AdminTable";
import { NatureOrganismeTag } from "@/app/admin/_components/NatureOrganismeTag";
import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import {
  OrganismesFiltersQuery,
  filterOrganismesArrayFromOrganismesFilters,
  parseOrganismesFiltersFromQuery,
} from "@/common/filters/organismes-filters";
import { _delete, _get, _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";

import { OrganismeAutocomplete, OrganismeSearchResult } from "./OrganismeAutocomplete";
import styles from "./reseau-organismes.module.scss";

type ReseauWithOrganismes = IReseau & { organismes: Organisme[] };

type OrganismeNormalized = Organisme & {
  normalizedName: string;
  normalizedUai: string;
  normalizedCommune: string;
};

const DEFAULT_PAGE_SIZE = 20;
const MIN_SEARCH_LENGTH = 2;
const SORTABLE_COLUMNS = ["nom", "uai", "siret", "nature", "adresse"];
const DEFAULT_SORTING: SortingState = [{ id: "nom", desc: false }];

const RESEAU_COLUMNS = [
  { label: "Nom de l’organisme", dataKey: "nom", width: "30%" },
  { label: "UAI", dataKey: "uai" },
  { label: "SIRET", dataKey: "siret" },
  { label: "Nature", dataKey: "nature" },
  { label: "Localisation", dataKey: "adresse" },
  { label: "", dataKey: "actions", sortable: false },
];

const addOrganismeModal = createModal({ id: "admin-reseau-add-organisme", isOpenedByDefault: false });
const removeOrganismeModal = createModal({ id: "admin-reseau-remove-organisme", isOpenedByDefault: false });

function parseSortParam(raw: string | null): SortingState {
  if (!raw) return DEFAULT_SORTING;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SORTING;
    const valid = parsed
      .filter((entry) => entry && typeof entry.id === "string" && SORTABLE_COLUMNS.includes(entry.id))
      .map((entry) => ({ id: entry.id as string, desc: Boolean(entry.desc) }));
    return valid.length > 0 ? valid : DEFAULT_SORTING;
  } catch {
    return DEFAULT_SORTING;
  }
}

function toNormalizedOrganisme(organisme: Organisme): OrganismeNormalized {
  return {
    ...organisme,
    normalizedName: normalize(organisme.enseigne ?? organisme.raison_sociale ?? ""),
    normalizedUai: normalize(organisme.uai ?? ""),
    normalizedCommune: normalize(organisme.adresse?.commune ?? ""),
  };
}

export default function ReseauOrganismesClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(() => searchParams?.get("search") ?? "");
  const [sorting, setSorting] = useState<SortingState>(() => parseSortParam(searchParams?.get("sort") ?? null));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedOrganisme, setSelectedOrganisme] = useState<OrganismeSearchResult | null>(null);
  const [organismeToRemove, setOrganismeToRemove] = useState<OrganismeNormalized | null>(null);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; description: string } | null>(null);

  const {
    data: reseau,
    error,
    isLoading,
    refetch,
  } = useQuery<ReseauWithOrganismes, any>(["admin", "reseau", id], ({ signal }) =>
    _get(`/api/v1/admin/reseaux/${id}`, { signal })
  );

  const reseauNom = reseau?.nom ?? "";

  useEffect(() => {
    if (!reseauNom) return;
    document.title = PAGES.dynamic.adminReseau({ id, nom: reseauNom }).getMetadata().title as string;
  }, [id, reseauNom]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("search", searchValue);
    params.set("sort", JSON.stringify(sorting));
    const timer = setTimeout(() => router.replace(`?${params.toString()}`, { scroll: false }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, sorting]);

  const filteredOrganismes = useMemo(() => {
    const normalized = (reseau?.organismes ?? []).map(toNormalizedOrganisme);
    const filters = parseOrganismesFiltersFromQuery(
      Object.fromEntries(searchParams?.entries() ?? []) as unknown as OrganismesFiltersQuery
    );
    const byFilters = filterOrganismesArrayFromOrganismesFilters(normalized, filters);

    if (searchValue.length < MIN_SEARCH_LENGTH) return byFilters;

    const normalizedSearch = normalize(searchValue);
    return byFilters.filter(
      (organisme) =>
        organisme.normalizedName.includes(normalizedSearch) ||
        organisme.normalizedUai?.startsWith(normalizedSearch) ||
        organisme.siret?.startsWith(normalizedSearch) ||
        organisme.normalizedCommune.startsWith(normalizedSearch)
    );
  }, [reseau?.organismes, searchParams, searchValue]);

  const sortedOrganismes = useMemo(() => {
    const [criterion] = sorting.length > 0 ? sorting : DEFAULT_SORTING;
    const direction = criterion.desc ? -1 : 1;
    const sortKey = (organisme: OrganismeNormalized) => {
      switch (criterion.id) {
        case "uai":
          return organisme.normalizedUai;
        case "siret":
          return organisme.siret ?? "";
        case "nature":
          return organisme.nature === "inconnue" ? " " : organisme.nature;
        case "adresse":
          return organisme.normalizedCommune;
        default:
          return organisme.normalizedName;
      }
    };
    return [...filteredOrganismes].sort((a, b) => direction * sortKey(a).localeCompare(sortKey(b)));
  }, [filteredOrganismes, sorting]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, sorting]);

  const hasActiveSearch = searchValue.length >= MIN_SEARCH_LENGTH;
  const lastPage = Math.max(1, Math.ceil(sortedOrganismes.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const pageOrganismes = sortedOrganismes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const { mutateAsync: addOrganisme, isLoading: isAdding } = useMutation(async (organismeId: string) =>
    _put(`/api/v1/admin/reseaux/${id}`, { organismeId })
  );

  const { mutateAsync: removeOrganisme, isLoading: isRemoving } = useMutation(async (organismeId: string) =>
    _delete(`/api/v1/admin/reseaux/${id}/organismes/${organismeId}`)
  );

  const handleAdd = useCallback(async () => {
    if (!selectedOrganisme) return;
    try {
      await addOrganisme(selectedOrganisme._id);
      setFeedback({
        severity: "success",
        description: `L’organisme ${selectedOrganisme.nom || "inconnu"} a été ajouté au réseau ${reseauNom}.`,
      });
      await refetch();
      setSelectedOrganisme(null);
      addOrganismeModal.close();
    } catch {
      setFeedback({ severity: "error", description: "Une erreur est survenue lors de l’ajout de l’organisme." });
    }
  }, [addOrganisme, refetch, reseauNom, selectedOrganisme]);

  const handleRemove = useCallback(async () => {
    if (!organismeToRemove) return;
    try {
      await removeOrganisme(organismeToRemove._id);
      setFeedback({ severity: "success", description: "L’organisme a été supprimé du réseau avec succès." });
      await refetch();
      setOrganismeToRemove(null);
      removeOrganismeModal.close();
    } catch {
      setFeedback({
        severity: "error",
        description: "Une erreur est survenue lors de la suppression de l’organisme.",
      });
    }
  }, [organismeToRemove, refetch, removeOrganisme]);

  const handleExport = useCallback(() => {
    exportDataAsXlsx(
      `tdb-reseau-${reseauNom.toLowerCase()}-organismes-${format(new Date(), "dd-MM-yy")}.xlsx`,
      sortedOrganismes.map((organisme) => convertOrganismeToExport(organisme)),
      organismesExportColumns
    );
  }, [reseauNom, sortedOrganismes]);

  const tableData = pageOrganismes.map((organisme) => ({
    _id: organisme._id,
    rawData: {
      nom: organisme.normalizedName,
      uai: organisme.normalizedUai,
      siret: organisme.siret ?? "",
      nature: organisme.nature === "inconnue" ? " " : organisme.nature,
      adresse: organisme.normalizedCommune,
    },
    element: {
      nom: (
        <DsfrLink href={`/organismes/${organisme._id}`} arrow="none" className={styles.organismeName}>
          {organisme.enseigne ?? organisme.raison_sociale ?? "Organisme inconnu"}
        </DsfrLink>
      ),
      uai: organisme.uai || UAI_INCONNUE_TAG_FORMAT,
      siret: organisme.siret || UAI_INCONNUE_TAG_FORMAT,
      nature: <NatureOrganismeTag nature={organisme.nature} />,
      adresse: (
        <>
          <span className={styles.localisation}>{organisme.adresse?.commune || ""}</span>
          <span className={styles.localisationDetails}>
            {organisme.adresse?.code_postal || ""}
            {organisme.adresse?.code_insee && organisme.adresse?.code_postal !== organisme.adresse?.code_insee
              ? ` (Insee: ${organisme.adresse?.code_insee})`
              : ""}
          </span>
        </>
      ),
      actions: (
        <Button
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-delete-bin-line"
          title={`Supprimer ${organisme.raison_sociale ?? "cet organisme"} du réseau`}
          onClick={() => {
            setOrganismeToRemove(organisme);
            removeOrganismeModal.open();
          }}
        >
          <span className={fr.cx("fr-sr-only")}>Supprimer du réseau</span>
        </Button>
      ),
    },
  }));

  const isAlreadyInReseau = Boolean(selectedOrganisme?.reseaux?.includes(reseau?.key ?? ""));

  return (
    <>
      <AdminPageHeader
        backLink={{ href: PAGES.static.adminReseaux.getPath(), label: "Retour à la liste des réseaux" }}
        title={reseauNom ? `Réseau ${reseauNom}` : "Réseau"}
        intro={
          reseau
            ? hasActiveSearch
              ? `${sortedOrganismes.length} résultat${sortedOrganismes.length > 1 ? "s" : ""} sur ${reseau.organismes.length} organisme${reseau.organismes.length > 1 ? "s" : ""}`
              : `${reseau.organismes.length} organisme${reseau.organismes.length > 1 ? "s" : ""} dans ce réseau`
            : undefined
        }
        action={
          <Button iconId="fr-icon-add-line" onClick={() => addOrganismeModal.open()} disabled={!reseau}>
            Ajouter un organisme
          </Button>
        }
      />

      {feedback && (
        <Alert
          severity={feedback.severity}
          small
          description={feedback.description}
          closable
          onClose={() => setFeedback(null)}
          className={fr.cx("fr-mt-2w")}
        />
      )}

      {error ? (
        <Alert
          severity="error"
          title="Impossible de charger le réseau"
          description="Une erreur est survenue lors du chargement des organismes de ce réseau. Veuillez réessayer ultérieurement."
          className={fr.cx("fr-mt-4w")}
        />
      ) : isLoading ? (
        <TableSkeleton />
      ) : (
        <>
          <div className={styles.searchPanel}>
            <Input
              className={styles.searchField}
              label="Rechercher un organisme"
              hintText="Par nom, UAI, SIRET ou ville (indiquez au moins deux caractères)"
              nativeInputProps={{
                type: "search",
                value: searchValue,
                onChange: (event) => setSearchValue(event.target.value),
              }}
            />
            <Button
              priority="secondary"
              iconId="fr-icon-download-line"
              iconPosition="left"
              onClick={handleExport}
              disabled={sortedOrganismes.length === 0}
              title={
                sortedOrganismes.length === 0
                  ? "Aucun organisme à télécharger"
                  : `Télécharger les ${sortedOrganismes.length} organismes affichés au format Excel`
              }
            >
              Télécharger la liste
            </Button>
          </div>

          <AdminTable
            data={tableData}
            columns={RESEAU_COLUMNS}
            tableLabel={`Organismes du réseau ${reseauNom}`}
            pagination={{ total: sortedOrganismes.length, page: currentPage, limit: pageSize, lastPage }}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSize={pageSize}
            sorting={sorting}
            onSortingChange={setSorting}
            emptyMessage="Aucun organisme ne correspond à votre recherche"
          />
        </>
      )}

      <addOrganismeModal.Component
        title={`Ajouter un organisme au réseau ${reseauNom}`}
        size="large"
        buttons={[
          { children: "Annuler", priority: "secondary" as const, doClosesModal: true },
          {
            children: "Ajouter",
            onClick: handleAdd,
            disabled: !selectedOrganisme || isAdding || isAlreadyInReseau,
            doClosesModal: false,
          },
        ]}
      >
        <OrganismeAutocomplete onSelect={setSelectedOrganisme} />

        {selectedOrganisme && (
          <div className={styles.selectedOrganisme}>
            <dl className={styles.selectedOrganismeList}>
              <dt>Raison sociale</dt>
              <dd className={styles.selectedOrganismeValue}>{selectedOrganisme.nom || "Inconnue"}</dd>
              <dt>UAI</dt>
              <dd className={styles.selectedOrganismeValue}>{selectedOrganisme.uai || "Inconnue"}</dd>
              <dt>SIRET</dt>
              <dd className={styles.selectedOrganismeValue}>{selectedOrganisme.siret || "Inconnue"}</dd>
              <dt>Réseaux</dt>
              <dd className={styles.selectedOrganismeValue}>
                {selectedOrganisme.reseaux?.length ? selectedOrganisme.reseaux.join(", ") : "Aucun"}
              </dd>
            </dl>

            {isAlreadyInReseau ? (
              <p className={styles.alreadyInReseau}>Cet organisme fait déjà partie du réseau {reseauNom}.</p>
            ) : (
              <p className={styles.confirmQuestion}>Êtes-vous sûr.e de vouloir ajouter cet organisme au réseau ?</p>
            )}
          </div>
        )}
      </addOrganismeModal.Component>

      <removeOrganismeModal.Component
        title={`Suppression de l’organisme ${organismeToRemove?.raison_sociale ?? "inconnu"} du réseau`}
        buttons={[
          { children: "Annuler", priority: "secondary" as const, doClosesModal: true },
          { children: "Supprimer", onClick: handleRemove, disabled: isRemoving, doClosesModal: false },
        ]}
      >
        <p>Cette opération est irréversible.</p>
        <p>
          Êtes-vous sûr.e de vouloir supprimer cet organisme du réseau ? Il ne sera plus identifié comme appartenant à
          ce réseau et ne sera plus visible dans l’espace de la tête de réseau.
        </p>
      </removeOrganismeModal.Component>
    </>
  );
}
