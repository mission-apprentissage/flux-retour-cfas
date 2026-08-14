"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DuplicateEffectifGroupPagination, EFFECTIFS_GROUP, getAnneeScolaireFromDate, getStatut } from "shared";

import { EffectifDetail } from "@/app/_components/effectifs/detail/EffectifDetail";
import { FilterCheckboxMenu } from "@/app/_components/filters/FilterCheckboxMenu";
import filterStyles from "@/app/_components/filters/filters.module.scss";
import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PageHeader } from "@/app/_components/page-header/PageHeader";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { DataTable } from "@/app/_components/table/DataTable";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { capitalizeWords } from "@/common/utils/stringUtils";

import styles from "./effectifs-liste.module.scss";

const FILTER_KEYS = ["annee_scolaire", "formation_libelle_long", "statut_courant", "source"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const DEFAULT_LIMIT = 10;
const DEFAULT_SORT: SortingState = [{ id: "annee_scolaire", desc: true }];

const parseArrayParam = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed : [decodeURIComponent(raw)];
  } catch {
    return [decodeURIComponent(raw)];
  }
};

const requiredHeader = (label: string) => (
  <>
    {label} <span className={styles.requiredMark}>*</span>
  </>
);

function CellValue({ effectif, fieldName, value }: { effectif: any; fieldName: string; value: string }) {
  const validationError = effectif.validation_errors?.find((error) => error.fieldName === fieldName);
  if (validationError) {
    return <span className={styles.cellError}>{validationError.inputValue || "VIDE"}</span>;
  }
  return <>{value}</>;
}

function StatutCell({ effectif }: { effectif: any }) {
  const parcours = effectif.statut?.parcours ?? [];
  const now = new Date();
  const current = [...parcours]
    .filter((statut) => new Date(statut.date) <= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .at(-1);

  if (!current) return <span className={styles.statutInconnu}>Aucun statut</span>;

  return (
    <>
      {getStatut(current.valeur)}
      <span className={styles.cellSub}>depuis le {new Date(current.date).toLocaleDateString("fr-FR")}</span>
    </>
  );
}

export function EffectifsListeClient({ organisme, modePublique }: { organisme: Organisme; modePublique: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const [filtersCleared, setFiltersCleared] = useState(false);

  const filters = useMemo(() => {
    const parsed = {} as Record<FilterKey, string[]>;
    let hasAny = false;
    FILTER_KEYS.forEach((key) => {
      const values = parseArrayParam(searchParams?.get(key) ?? null);
      parsed[key] = values;
      if (values.length > 0) hasAny = true;
    });
    // Sans filtre dans l'URL, la page s'ouvre sur l'année scolaire courante (comme la page historique).
    if (!hasAny && !filtersCleared) {
      parsed.annee_scolaire = [getAnneeScolaireFromDate(new Date())];
    }
    return parsed;
  }, [searchParams, filtersCleared]);

  const search = searchParams?.get("search") ?? "";
  const page = Number(searchParams?.get("page") ?? 0);
  const limit = Number(searchParams?.get("limit") ?? DEFAULT_LIMIT);
  const sortId = searchParams?.get("sort") ?? DEFAULT_SORT[0].id;
  const sortOrder = searchParams?.get("order") ?? "desc";

  const [searchValue, setSearchValue] = useState(search);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const pushQuery = (updates: Record<string, string | undefined>, { keepPage = false } = {}) => {
    setFiltersCleared(false);
    const query = new URLSearchParams(searchParams?.toString() ?? "");
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) query.delete(key);
      else query.set(key, value);
    });
    if (!keepPage) query.delete("page");
    const queryString = query.toString();
    router.replace(queryString ? `?${queryString}` : "?", { scroll: false });
  };

  const { data, isLoading, isFetching } = useQuery(
    ["organismes", organisme._id, "effectifs", { page, limit, sortId, sortOrder, search, filters }],
    async () =>
      _get(`/api/v1/organismes/${organisme._id}/effectifs`, {
        params: {
          page,
          limit,
          sort: sortId,
          order: sortOrder,
          search,
          formation_libelle_long: filters.formation_libelle_long,
          statut_courant: filters.statut_courant,
          annee_scolaire: filters.annee_scolaire,
          source: filters.source,
        },
      }),
    { keepPreviousData: true }
  );

  const { data: duplicates } = useQuery(["organismes", organisme._id, "duplicates"], () =>
    _get<DuplicateEffectifGroupPagination>(`/api/v1/organismes/${organisme._id}/duplicates`)
  );

  const availableFilters: Record<string, string[]> = data?.filters ?? {};
  const effectifs: any[] = data?.organismesEffectifs ?? [];
  const total: number = data?.total ?? 0;

  const visibleEffectifs = showOnlyErrors
    ? effectifs.filter((effectif) => effectif.validation_errors?.length > 0)
    : effectifs;

  const rows = visibleEffectifs.map((effectif) => ({
    _id: effectif.id,
    rawData: effectif,
    element: {
      annee_scolaire: <CellValue effectif={effectif} fieldName="annee_scolaire" value={effectif.annee_scolaire} />,
      nom: <CellValue effectif={effectif} fieldName="apprenant.nom" value={effectif.nom} />,
      prenom: <CellValue effectif={effectif} fieldName="apprenant.prenom" value={effectif.prenom} />,
      formation: (
        <span className={styles.formationCell}>
          {effectif.formation?.libelle_long || "Libellé manquant"}
          <span className={styles.cellSub}>
            CFD&nbsp;: {effectif.formation?.cfd} - RNCP&nbsp;: {effectif.formation?.rncp}
          </span>
        </span>
      ),
      source: (
        <CellValue
          effectif={effectif}
          fieldName="source"
          value={effectif.source === "FICHIER" ? capitalizeWords(effectif.source) : effectif.source}
        />
      ),
      statut_courant: <StatutCell effectif={effectif} />,
    },
  }));

  const columns = [
    { label: requiredHeader("Période"), dataKey: "annee_scolaire", width: 120 },
    { label: requiredHeader("Nom"), dataKey: "nom", width: 160 },
    { label: requiredHeader("Prénom"), dataKey: "prenom", width: 160 },
    { label: "Formation", dataKey: "formation", width: 350 },
    {
      label: (
        <>
          {requiredHeader("Source")}{" "}
          <Tooltip
            kind="hover"
            title="Ce champ indique la provenance de la donnée. Par exemple, la donnée est transmise par un ERP ou via un téléversement de fichier Excel, ou encore de plateforme DECA (Dépôt des Contrats d’Alternance)."
          />
        </>
      ),
      dataKey: "source",
      width: 150,
    },
    {
      label: (
        <>
          Statut actuel{" "}
          <Tooltip
            kind="hover"
            title="Un jeune peut être : apprenti en contrat, inscrit sans contrat signé, en rupture de contrat, en fin de formation (diplômé) ou en abandon (a quitté le CFA)."
          />
        </>
      ),
      dataKey: "statut_courant",
      width: 170,
    },
  ];

  const title = modePublique ? "Ses effectifs" : "Mes effectifs";
  const lastPage = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <PageHeader
        title={title}
        action={
          <Button
            priority="secondary"
            iconId="fr-icon-add-line"
            linkProps={{
              href: modePublique ? `/organismes/${organisme._id}/effectifs/televersement` : "/effectifs/televersement",
            }}
          >
            Ajouter via fichier Excel
          </Button>
        }
      />

      <p>
        <DsfrLink href={EFFECTIFS_GROUP} arrow="none" external>
          Signaler une anomalie
        </DsfrLink>
      </p>

      {!modePublique && duplicates && duplicates.totalItems > 0 && (
        <Alert
          severity="warning"
          className="fr-mb-3w"
          title={`Nous avons détecté ${duplicates.totalItems} effectif${duplicates.totalItems > 1 ? "s" : ""} en duplicat.`}
          description={
            <>
              <p>Une action de suppression des doublons d&apos;effectifs est nécessaire.</p>
              <Button
                priority="secondary"
                linkProps={{
                  href: "/effectifs/doublons",
                  onClick: () => trackPlausibleEvent("clic_verifier_doublons_effectifs"),
                }}
              >
                Vérifier et supprimer
              </Button>
            </>
          }
        />
      )}

      <div className={styles.searchPanel}>
        <form
          className={styles.searchRow}
          onSubmit={(event) => {
            event.preventDefault();
            pushQuery({ search: searchValue || undefined });
          }}
        >
          <Input
            label=""
            className={styles.searchInput}
            nativeInputProps={{
              type: "search",
              name: "search_effectifs",
              placeholder: "Rechercher un apprenant",
              value: searchValue,
              onChange: (event) => setSearchValue(event.target.value),
            }}
          />
          <Button type="submit" iconId="fr-icon-search-line" title="Rechercher">
            Rechercher
          </Button>
        </form>

        <div className={styles.filtersRow}>
          <div className={filterStyles.filterPanel}>
            <p className={filterStyles.filterPanelLabel}>FILTRER PAR</p>
            <div className={filterStyles.filterPanelRow}>
              {availableFilters.annee_scolaire && (
                <FilterCheckboxMenu
                  buttonLabel="Année scolaire"
                  options={[...availableFilters.annee_scolaire]
                    .sort((a, b) => b.localeCompare(a))
                    .map((value) => ({ value, label: value }))}
                  value={filters.annee_scolaire}
                  onChange={(values) =>
                    pushQuery({ annee_scolaire: values.length ? JSON.stringify(values) : undefined })
                  }
                />
              )}
              {availableFilters.formation_libelle_long && (
                <FilterCheckboxMenu
                  buttonLabel="Formation"
                  options={[...availableFilters.formation_libelle_long]
                    .sort((a, b) => a.localeCompare(b))
                    .map((value) => ({ value, label: capitalizeWords(value) }))}
                  value={filters.formation_libelle_long}
                  onChange={(values) =>
                    pushQuery({ formation_libelle_long: values.length ? JSON.stringify(values) : undefined })
                  }
                />
              )}
              {availableFilters.statut_courant && (
                <FilterCheckboxMenu
                  buttonLabel="Statut"
                  options={[...availableFilters.statut_courant]
                    .sort((a, b) => a.localeCompare(b))
                    .map((value) => ({ value, label: capitalizeWords(value) }))}
                  value={filters.statut_courant}
                  onChange={(values) =>
                    pushQuery({ statut_courant: values.length ? JSON.stringify(values) : undefined })
                  }
                />
              )}
              {availableFilters.source && (
                <FilterCheckboxMenu
                  buttonLabel="Source de la donnée"
                  options={[...availableFilters.source]
                    .sort((a, b) => a.localeCompare(b))
                    .map((value) => ({ value, label: capitalizeWords(value) }))}
                  value={filters.source}
                  onChange={(values) => pushQuery({ source: values.length ? JSON.stringify(values) : undefined })}
                />
              )}
              <Button
                priority="tertiary no outline"
                size="small"
                onClick={() => {
                  setSearchValue("");
                  setFiltersCleared(true);
                  router.replace("?", { scroll: false });
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>

          <ToggleSwitch
            className={styles.errorsToggle}
            label="Afficher uniquement les données en erreur"
            labelPosition="left"
            showCheckedHint={false}
            checked={showOnlyErrors}
            onChange={setShowOnlyErrors}
          />
        </div>
      </div>

      <p className={styles.resultCount}>{total} apprenant(es) trouvé(es)</p>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          pagination={{ total, page: page + 1, limit, lastPage }}
          onPageChange={(newPage) => pushQuery({ page: `${newPage - 1}` }, { keepPage: true })}
          onPageSizeChange={(newLimit) => pushQuery({ limit: `${newLimit}` })}
          pageSize={limit}
          sorting={[{ id: sortId, desc: sortOrder === "desc" }]}
          onSortingChange={(updater) => {
            const current: SortingState = [{ id: sortId, desc: sortOrder === "desc" }];
            const next =
              typeof updater === "function" ? (updater as (old: SortingState) => SortingState)(current) : updater;
            const [first] = next;
            if (!first) return;
            pushQuery({ sort: first.id, order: first.desc ? "desc" : "asc" });
          }}
          emptyMessage={isFetching ? "Chargement…" : "Aucun effectif à afficher"}
          tableLabel={`Liste des effectifs de ${organisme.raison_sociale ?? "l'organisme"}`}
          expandMode="single"
          renderSubComponent={(rawData) => (
            <EffectifDetail
              effectifId={rawData.id}
              organismeId={organisme._id}
              parcours={rawData.statut?.parcours ?? []}
              transmissionDate={rawData.transmitted_at ?? null}
              validationErrors={rawData.validation_errors ?? []}
            />
          )}
        />
      )}
    </div>
  );
}
