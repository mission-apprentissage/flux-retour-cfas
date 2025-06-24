"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { IOrganisationARML } from "shared";

import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { LightTable } from "@/app/_components/table/LightTable";
import { _get } from "@/common/httpClient";

export default function Page() {
  const { data: armls = [], isLoading } = useQuery<Array<IOrganisationARML>>(["arml"], async () =>
    _get("/api/v1/organisation/arml/mls")
  );

  const [searchTerm, setSearchTerm] = useState("");

  const columns = useMemo(
    () => [
      { label: "Code Postal", dataKey: "code_postal", width: 20 },
      { label: "Mission Locale", dataKey: "nom", width: 300 },
    ],
    []
  );

  return (
    <div className="fr-container">
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        {isLoading && !armls ? (
          <p>Chargement…</p>
        ) : (
          <>
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
              caption={`Tableau des Mission Locales (${armls.length})`}
              data={armls.map((element) => ({ element, rawData: element }))}
              columns={columns}
              itemsPerPage={10}
              searchTerm={searchTerm}
              searchableColumns={["nom"]}
              emptyMessage="Aucune mission locale à afficher"
            />
          </>
        )}
      </SuspenseWrapper>
    </div>
  );
}
