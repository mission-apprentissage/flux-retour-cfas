"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import { Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { IOrganisationARML } from "shared";

import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { LightTable } from "@/app/_components/table/LightTable";
import { _get } from "@/common/httpClient";

export default function Page() {
  const { data: armls = [], isLoading } = useQuery<Array<IOrganisationARML>>(["arml"], async () => {
    const data = await _get("/api/v1/organisation/arml/mls");
    return data.map(({ code_postal, nom, activated_at, stats }) => {
      return {
        code_postal,
        nom,
        a_traiter: stats.a_traiter,
        traite: stats.traite,
        rdv_pris: stats.rdv_pris,
        nouveau_projet: stats.nouveau_projet,
        deja_accompagne: stats.deja_accompagne,
        contacte_sans_retour: stats.contacte_sans_retour,
        coordonnees_incorrectes: stats.coordonnees_incorrectes,
        autre: stats.autre,
        total: stats.total,

        activated_at: activated_at ? (
          new Date(activated_at).toLocaleDateString("fr-FR")
        ) : (
          <Typography color="error">Non activée</Typography>
        ),
      };
    });
  });

  const [searchTerm, setSearchTerm] = useState("");

  const columns = useMemo(
    () => [
      { label: "Code Postal", dataKey: "code_postal", width: 20 },
      { label: "Mission Locale", dataKey: "nom", width: 300 },
      { label: "À traiter", dataKey: "a_traiter", width: 100 },
      { label: "Traitées", dataKey: "traite", width: 100 },
      { label: "Rendez-vous pris", dataKey: "rdv_pris", width: 100 },
      { label: "Nouveau projet", dataKey: "nouveau_projet", width: 100 },
      { label: "Déjà accompagné", dataKey: "deja_accompagne", width: 100 },
      { label: "Contacté sans retour", dataKey: "contacte_sans_retour", width: 100 },
      { label: "Coordonnées incorrectes", dataKey: "coordonnees_incorrectes", width: 100 },
      { label: "Autre", dataKey: "autre", width: 100 },
      { label: "Total", dataKey: "total", width: 100 },
      { label: "Activation", dataKey: "activated_at", width: 100 },
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
              withHeader={true}
            />
          </>
        )}
      </SuspenseWrapper>
    </div>
  );
}
