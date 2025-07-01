"use client";

import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { useQuery } from "@tanstack/react-query";
import type { IMissionLocale } from "api-alternance-sdk";
import { useMemo, useState } from "react";
import { IOrganisationMissionLocale } from "shared";

import { LightTable } from "@/app/_components/table/LightTable";
import { _get } from "@/common/httpClient";

export default function MissionLocaleAdminClient() {
  const { data: missionLocales, isLoading } = useQuery<
    { organisation: IOrganisationMissionLocale; externalML: IMissionLocale }[]
  >(["mission-locale"], async () => _get("/api/v1/admin/mission-locale"));

  const [searchTerm, setSearchTerm] = useState("");

  const columns = useMemo(
    () => [
      { label: "ID", dataKey: "id", width: 20 },
      { label: "Nom mission locale", dataKey: "nom", width: 300 },
      { label: "Ville", dataKey: "ville", width: 200 },
      { label: "", dataKey: "icon", width: 10 },
    ],
    []
  );

  const dataRows = useMemo(() => {
    if (!missionLocales) return [];
    return missionLocales.map((ml) => {
      return {
        rawData: {
          nom: ml.externalML.nom,
          ville: ml.externalML.localisation?.ville,
          organisationId: ml.organisation._id,
        },
        element: {
          id: ml.externalML.id,
          nom: ml.externalML.nom,
          ville: ml.externalML.localisation?.ville,
          icon: <i className="fr-icon-arrow-right-line fr-icon--sm" />,
        },
      };
    });
  }, [missionLocales]);

  if (isLoading) {
    return <p>Chargement…</p>;
  }

  return (
    <div>
      <SearchBar
        label="Recherche de mission locale"
        renderInput={({ id, className, placeholder }) => (
          <input
            id={id}
            className={className}
            placeholder={placeholder}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        )}
      />
      <LightTable
        caption={`Tableau des Mission Locales (${dataRows.length})`}
        data={dataRows}
        columns={columns}
        itemsPerPage={10}
        searchTerm={searchTerm}
        searchableColumns={["nom", "ville"]}
        getRowLink={(rowData) => `/admin/mission-locale/${rowData.organisationId}`}
        emptyMessage="Aucune mission locale à afficher"
      />
    </div>
  );
}
