"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { OrganismeSupportInfoJson, UAI_INCONNUE_TAG_FORMAT } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { PAGES } from "@/app/_utils/routes.utils";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminTable } from "@/app/admin/_components/AdminTable";
import { _get } from "@/common/httpClient";

import { SupportBadge, SupportValue } from "./_components/SupportBadge";
import styles from "./recherche.module.scss";

const MIN_SEARCH_LENGTH = 3;

function PresenceBadge({ present }: { present: boolean }) {
  return <SupportBadge level={present ? "success" : "error"} value={present ? "Présent" : "Absent"} />;
}

const RESULTS_COLUMNS = [
  { label: "Nom de l’organisme", dataKey: "nom", sortable: false },
  { label: "Tableau de bord", dataKey: "tdb", sortable: false },
  { label: "Api Entreprise", dataKey: "apiEntreprise", sortable: false },
  { label: "Référentiel", dataKey: "referentiel", sortable: false },
  { label: "Catalogue", dataKey: "formations", sortable: false },
  { label: "État", dataKey: "etat", sortable: false },
  { label: "Effectifs", dataKey: "effectifs", sortable: false },
  { label: "Transmissions", dataKey: "transmissions", sortable: false },
];

function toTableRow(organisme: OrganismeSupportInfoJson, query: string) {
  return {
    _id: `${organisme.siret}-${organisme.uai ?? "sans-uai"}`,
    rawData: { siret: organisme.siret, uai: organisme.uai },
    element: {
      nom: (
        <>
          <DsfrLink
            href={PAGES.dynamic.adminOrganismeSupport({ siret: organisme.siret, uai: organisme.uai, query }).getPath()}
            arrow="none"
            className={styles.organismeName}
          >
            {organisme.nom ?? "Organisme inconnu"}
          </DsfrLink>
          <span className={styles.organismeIds}>
            UAI : {organisme.uai ?? <span className={styles.missingValue}>{UAI_INCONNUE_TAG_FORMAT}</span>} — SIRET :{" "}
            {organisme.siret}
          </span>
        </>
      ),
      tdb: <PresenceBadge present={Boolean(organisme.tdb)} />,
      apiEntreprise: <PresenceBadge present={Boolean(organisme.apiEntreprise)} />,
      referentiel: <PresenceBadge present={Boolean(organisme.referentiel)} />,
      formations: (
        <SupportValue
          value={`${organisme.formations.length} formation${organisme.formations.length > 1 ? "s" : ""}`}
          level={organisme.formations.length > 0 ? "info" : "warning"}
        />
      ),
      etat: (
        <span className={styles.etats}>
          {organisme.etat.map((etat) => (
            <SupportBadge key={etat} level={etat === "actif" ? "success" : "error"} value={etat} />
          ))}
        </span>
      ),
      effectifs: <SupportValue value={organisme.effectifs} />,
      transmissions: <SupportValue value={organisme.transmissions.length} />,
    },
  };
}

export default function RechercheOrganismesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") ?? "";

  const [inputValue, setInputValue] = useState(query);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const isQueryValid = query.length >= MIN_SEARCH_LENGTH;
  const isInputValid = inputValue.trim().length >= MIN_SEARCH_LENGTH;

  const {
    data: organismes,
    error,
    isFetching,
  } = useQuery<OrganismeSupportInfoJson[], any>({
    queryKey: ["admin", "organismes-support", query],
    queryFn: ({ signal }) => _get(`/api/v1/admin/organismes/search/${encodeURIComponent(query)}`, { signal }),
    enabled: isQueryValid,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isInputValid) return;
    router.push(`${PAGES.static.adminOrganismesRecherche.getPath()}?q=${encodeURIComponent(inputValue.trim())}`);
  };

  return (
    <>
      <AdminPageHeader
        title="Recherche d’un organisme"
        intro={
          organismes
            ? `${organismes.length} organisme${organismes.length > 1 ? "s" : ""} pour « ${query} »`
            : "Retrouvez tout ce que les quatre sources savent d’un organisme : tableau de bord, Api Entreprise, référentiel et catalogue."
        }
      />

      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <Input
          className={styles.searchField}
          label="Rechercher par SIRET, UAI ou nom"
          hintText="3 caractères minimum. Exemple : 98765432400019"
          state={inputValue.length > 0 && !isInputValid ? "error" : "default"}
          stateRelatedMessage="Indiquez au moins 3 caractères."
          nativeInputProps={{
            type: "search",
            value: inputValue,
            onChange: (event) => setInputValue(event.target.value),
          }}
        />
        <Button type="submit" iconId="fr-icon-search-line" iconPosition="left" disabled={!isInputValid || isFetching}>
          Rechercher
        </Button>
      </form>

      {error ? (
        <Alert
          severity="error"
          title="La recherche a échoué"
          description={
            <>
              <p>
                Impossible d’interroger les sources pour « {query} ». Veuillez réessayer ultérieurement, et signaler
                l’incident au support si le problème persiste.
              </p>
              <p className={styles.errorDetail}>
                Détail : {error?.prettyMessage ?? error?.message ?? "erreur inconnue"}
                {error?.statusCode ? ` — code ${error.statusCode}` : ""}
              </p>
            </>
          }
        />
      ) : !isQueryValid ? (
        <p className={styles.placeholder}>Lancez une recherche pour afficher les organismes correspondants.</p>
      ) : isFetching ? (
        <TableSkeleton />
      ) : (
        <div className={styles.tableContainer}>
          <AdminTable
            data={(organismes ?? []).map((organisme) => toTableRow(organisme, query))}
            columns={RESULTS_COLUMNS}
            tableLabel={`Organismes correspondant à ${query}`}
            hasPagination={false}
            emptyMessage="Aucun organisme ne correspond à cette recherche."
          />
        </div>
      )}
    </>
  );
}
