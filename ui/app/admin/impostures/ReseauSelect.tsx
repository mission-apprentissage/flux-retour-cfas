"use client";

import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useQuery } from "@tanstack/react-query";
import type { IReseau } from "shared";

import { RequiredMark } from "@/app/_components/inscription/RequiredMark";
import type { SetOrganisation } from "@/app/_components/inscription/types";
import { _get } from "@/common/httpClient";

export function ReseauSelect({ setOrganisation }: { setOrganisation: SetOrganisation }) {
  const { data: reseaux } = useQuery<IReseau[]>({
    queryKey: ["tete_de_reseaux"],
    queryFn: () => _get("/api/v1/reseaux"),
  });

  return (
    <Select
      label={
        <>
          Vous représentez le réseau : <RequiredMark />
        </>
      }
      placeholder="Sélectionner un réseau"
      nativeSelectProps={{
        onChange: (event) => {
          const reseau = event.target.value;
          setOrganisation(reseau ? { type: "TETE_DE_RESEAU", reseau } : null);
        },
      }}
      options={(reseaux ?? []).map((reseau) => ({ value: reseau.key, label: reseau.nom }))}
    />
  );
}
