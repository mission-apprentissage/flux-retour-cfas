"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useEffect, useMemo, useState } from "react";
import { ORGANISATION_TYPE } from "shared/constants";
import { ML_SITUATION_DOSSIER, ML_SITUATION_DOSSIER_LABEL } from "shared/constants/missionLocale";
import {
  COLLAB_DOSSIER_RESULTATS,
  COLLAB_DOSSIER_STATUTS,
  type ICollaborationDossierStructure,
} from "shared/models/data/nationalStats.model";

import { TableSkeleton } from "@/app/_components/common/Skeleton";
import { useAuth } from "@/app/_context/UserContext";

import { OverviewCard } from "../cards/OverviewCard";
import { MOTIFS_CONFIG } from "../charts/motifsConfig";
import { DOSSIERS_TRAITES_V2_LABELS } from "../constants";
import { useCollabDossiersExport } from "../hooks/useCollabDossiersExport";
import { useCollabDossiersFilters } from "../hooks/useCollabDossiersFilters";
import { usePageForParams } from "../hooks/usePageForParams";
import { useStatsFilters } from "../hooks/useStatsFilters";
import {
  COLLAB_DOSSIER_STATUT_LABELS,
  type CollaborationDossiersParams,
  useCollaborationDossiers,
} from "../hooks/useStatsQueries";
import { StatsTablePagination } from "../tables/StatsTablePagination";
import { ChecklistFilter } from "../ui/ChecklistFilter";
import { DateRangeFilter } from "../ui/DateRangeFilter";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";
import { TerritoireFilter, useSelectedDepartements } from "../ui/TerritoireFilter";

import { CollaborationDossierItem } from "./CollaborationDossierItem";
import styles from "./CollaborationsListCard.module.css";
import filterStyles from "./SuiviTraitementMLCard.module.css";

const STATUT_OPTIONS = COLLAB_DOSSIER_STATUTS.map((value) => ({ value, label: COLLAB_DOSSIER_STATUT_LABELS[value] }));
const DELAI_OPTIONS = [
  { value: "0_10", label: "0 - 10 jours" },
  { value: "11_20", label: "11 - 20 jours" },
  { value: "21_30", label: "21 - 30 jours" },
  { value: "30_plus", label: "+30 jours" },
];
const SITUATION_OPTIONS = Object.values(ML_SITUATION_DOSSIER).map((value) => ({
  value,
  label: ML_SITUATION_DOSSIER_LABEL[value],
}));
const MOTIF_OPTIONS = MOTIFS_CONFIG.map((motif) => ({ value: motif.key.toUpperCase(), label: motif.label }));
const RESULTAT_OPTIONS = COLLAB_DOSSIER_RESULTATS.map((value) => ({ value, label: DOSSIERS_TRAITES_V2_LABELS[value] }));

const toStructureOptions = (structures: ICollaborationDossierStructure[] = []) =>
  structures.map((structure) => ({
    value: structure.id,
    label: [structure.nom ?? "Nom inconnu", structure.commune].filter(Boolean).join(", "),
  }));

const countLabel = (label: string) => (selected: string[]) =>
  selected.length ? `${label} (${selected.length})` : label;

/** Sans `mlId` ni `cfaId` : liste du territoire. Avec `cfaId` : dossiers envoyés par ce CFA. Avec `mlId` : dossiers reçus par cette Mission Locale (fiche ML). */
export function CollaborationsListCard({ mlId, cfaId }: { mlId?: string; cfaId?: string } = {}) {
  const { region } = useStatsFilters();
  const { user } = useAuth();
  const isDdets = user?.organisation?.type === ORGANISATION_TYPE.DDETS;
  const { filters, setList, setPeriode } = useCollabDossiersFilters();
  const selectedDepartements = useSelectedDepartements(filters.departements);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo<CollaborationDossiersParams>(() => {
    const csv = (values?: string[]) => (values?.length ? values.join(",") : undefined);
    const communs = {
      search: search.length >= 2 ? search : undefined,
      statuts: csv(filters.statuts),
      delais: csv(filters.delais),
      situations: csv(filters.situations),
      motifs: csv(filters.motifs),
      resultats: csv(filters.resultats),
      date_debut: filters.debut,
      date_fin: filters.fin,
    };
    if (mlId) return { ...communs, ml_id: mlId };
    if (cfaId) return { ...communs, cfa_id: cfaId, ml_ids: csv(filters.ml) };
    return {
      ...communs,
      region,
      departements: isDdets ? undefined : csv(selectedDepartements),
      cfa_ids: csv(filters.cfa),
      ml_ids: csv(filters.ml),
    };
  }, [mlId, cfaId, region, search, isDdets, selectedDepartements, filters]);
  const [page, setPage] = usePageForParams(params);
  const { data, isLoading, isFetching, isPlaceholderData, error } = useCollaborationDossiers({
    ...params,
    page,
    limit,
  });
  const exporter = useCollabDossiersExport(params);
  const provenanceCfa: Record<string, string> | null = cfaId
    ? null
    : mlId
      ? { from: "ml", ml_id: mlId }
      : { from: "collaborations" };

  return (
    <OverviewCard
      title={
        mlId
          ? "Liste des collaborations reçues par cette Mission Locale"
          : cfaId
            ? "Liste des collaborations envoyées par ce CFA"
            : "Liste de l'ensemble des collaborations envoyées par les CFA"
      }
      actions={
        <>
          {data && <span className={filterStyles.count}>{data.total.toLocaleString("fr-FR")} dossiers</span>}
          <Button
            iconId="fr-icon-download-line"
            iconPosition="right"
            onClick={exporter.exportData}
            disabled={exporter.isExporting || !data?.total}
          >
            {exporter.isExporting ? "Export en cours..." : "Exporter les données"}
          </Button>
        </>
      }
    >
      <p className={styles.about}>
        <strong>Sur ce tableau :</strong> retrouvez la liste de l&apos;ensemble des dossiers des jeunes pour lesquels
        les CFA ont sollicité une collaboration avec la Mission Locale de rattachement du jeune. Il s&apos;agit de
        données personnelles, privées et sensibles, échangées entre les CFA et les Missions Locales sur la situation du
        jeune : nous vous prions d&apos;être particulièrement vigilant lors de leur consultation et de leur
        exploitation. Chaque export est enregistré.
      </p>
      {exporter.error && (
        <Alert
          severity="error"
          title="Erreur"
          description={exporter.error}
          closable
          onClose={exporter.clearError}
          small
        />
      )}
      <Input
        label="Rechercher une collaboration"
        hideLabel
        nativeInputProps={{
          placeholder: mlId
            ? "Rechercher par nom de CFA, de jeune…"
            : cfaId
              ? "Rechercher par nom de Mission Locale, de jeune…"
              : "Rechercher par nom de Mission Locale, de CFA, de jeune…",
          value: searchInput,
          onChange: (e) => setSearchInput(e.target.value),
          type: "search",
        }}
        className={filterStyles.search}
      />
      <div className={filterStyles.filters}>
        <span className={filterStyles.filtersLabel}>Filtrer</span>
        <DateRangeFilter
          debut={filters.debut}
          fin={filters.fin}
          onChange={setPeriode}
          emptyLabel="Janv. 2026 - aujourd'hui"
        />
        {!isDdets && !mlId && !cfaId && (
          <TerritoireFilter departements={filters.departements} onChange={(codes) => setList("departements", codes)} />
        )}
        <ChecklistFilter
          label="Statut de collaboration"
          options={STATUT_OPTIONS}
          value={filters.statuts ?? []}
          onChange={(values) => setList("statuts", values)}
          getDisplayText={countLabel("Statut de collaboration")}
        />
        <ChecklistFilter
          label="Délai de traitement"
          options={DELAI_OPTIONS}
          value={filters.delais ?? []}
          onChange={(values) => setList("delais", values)}
          getDisplayText={countLabel("Délai de traitement")}
        />
        {!mlId && !cfaId && (
          <ChecklistFilter
            label="CFA émetteur"
            options={toStructureOptions(data?.filtres.cfa)}
            value={filters.cfa ?? []}
            onChange={(values) => setList("cfa", values)}
            searchable
            enableSelectAll
            searchPlaceholder="Rechercher un CFA"
            getDisplayText={countLabel("CFA émetteur")}
          />
        )}
        {!mlId && (
          <ChecklistFilter
            label="ML destinataire"
            options={toStructureOptions(data?.filtres.ml)}
            value={filters.ml ?? []}
            onChange={(values) => setList("ml", values)}
            searchable
            enableSelectAll
            searchPlaceholder="Rechercher une Mission Locale"
            getDisplayText={countLabel("ML destinataire")}
          />
        )}
        <ChecklistFilter
          label="Situation du jeune"
          options={SITUATION_OPTIONS}
          value={filters.situations ?? []}
          onChange={(values) => setList("situations", values)}
          getDisplayText={countLabel("Situation du jeune")}
        />
        <ChecklistFilter
          label="Objectif d'accompagnement"
          options={MOTIF_OPTIONS}
          value={filters.motifs ?? []}
          onChange={(values) => setList("motifs", values)}
          getDisplayText={countLabel("Objectif d'accompagnement")}
        />
        <ChecklistFilter
          label="Résultat contact jeune"
          options={RESULTAT_OPTIONS}
          value={filters.resultats ?? []}
          onChange={(values) => setList("resultats", values)}
          getDisplayText={countLabel("Résultat contact jeune")}
        />
      </div>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        {isLoading || (isFetching && isPlaceholderData) ? (
          <TableSkeleton rows={limit} />
        ) : !data?.data.length ? (
          <p className={styles.empty}>Aucun dossier de collaboration ne correspond à ces critères.</p>
        ) : (
          <>
            <ul className={`fr-raw-list ${styles.list}`}>
              {data.data.map((dossier) => (
                <CollaborationDossierItem key={dossier.id} dossier={dossier} provenanceCfa={provenanceCfa} />
              ))}
            </ul>
            <StatsTablePagination
              page={page}
              totalPages={data.pagination.total_pages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={setLimit}
              label="dossiers de collaboration"
            />
          </>
        )}
      </StatsErrorHandler>
    </OverviewCard>
  );
}
