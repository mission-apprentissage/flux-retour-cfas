"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useQuery } from "@tanstack/react-query";
import type { IMissionLocale } from "api-alternance-sdk";
import { useMemo, useState } from "react";
import { normalize, type IOrganisationMissionLocale } from "shared";

import type { SetOrganisation } from "@/app/_components/inscription/types";
import { _get } from "@/common/httpClient";
import { getApiErrorMessage } from "@/common/rateLimit";

import styles from "./impostures.module.scss";

type MissionLocaleEntry = { organisation: IOrganisationMissionLocale; externalML: IMissionLocale };

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 50;

export function MissionLocaleSearch({ setOrganisation }: { setOrganisation: SetOrganisation }) {
  const [search, setSearch] = useState("");

  const {
    data: missionLocales,
    isLoading,
    error,
  } = useQuery<MissionLocaleEntry[], any>(["admin", "mission-locale"], () => _get("/api/v1/admin/mission-locale"));

  const indexed = useMemo(
    () =>
      (missionLocales ?? []).map((entry) => ({
        entry,
        haystack: normalize(
          `${entry.externalML.nom} ${entry.externalML.localisation.ville} ${entry.externalML.localisation.cp}`
        ),
      })),
    [missionLocales]
  );

  const query = normalize(search.trim());
  const matches = query.length >= MIN_QUERY_LENGTH ? indexed.filter(({ haystack }) => haystack.includes(query)) : [];
  const shown = matches.slice(0, MAX_RESULTS);

  const select = ({ organisation }: MissionLocaleEntry) => {
    const { adresse, ...rest } = organisation;
    setOrganisation(rest);
  };

  if (error) {
    return (
      <Alert
        severity="error"
        title="Impossible de charger les missions locales"
        description={`Détail : ${getApiErrorMessage(error)}`}
      />
    );
  }

  return (
    <>
      <Input
        label="Rechercher une mission locale"
        hintText={
          isLoading
            ? "Chargement de la liste…"
            : `Filtrez par nom, ville ou code postal parmi les ${indexed.length} missions locales (${MIN_QUERY_LENGTH} caractères minimum)`
        }
        nativeInputProps={{
          value: search,
          disabled: isLoading,
          placeholder: "Exemple : Bourg-en-Bresse",
          onChange: (event) => setSearch(event.target.value),
        }}
      />

      {query.length >= MIN_QUERY_LENGTH && (
        <>
          <p className={styles.resultCount}>
            {matches.length === 0
              ? "Aucune mission locale ne correspond à cette recherche."
              : `${matches.length} mission${matches.length > 1 ? "s" : ""} locale${matches.length > 1 ? "s" : ""} trouvée${matches.length > 1 ? "s" : ""}`}
            {matches.length > MAX_RESULTS &&
              ` — seules les ${MAX_RESULTS} premières sont affichées, affinez la recherche.`}
          </p>

          {shown.length > 0 && (
            <ul className={styles.resultList}>
              {shown.map(({ entry }) => (
                <li key={entry.organisation._id.toString()}>
                  <button type="button" className={styles.resultButton} onClick={() => select(entry)}>
                    <span className={styles.resultName}>{entry.externalML.nom}</span>
                    <span className={styles.resultDetail}>
                      {entry.externalML.localisation.ville} — {entry.externalML.localisation.cp}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
