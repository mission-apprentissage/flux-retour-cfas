"use client";

import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useQuery } from "@tanstack/react-query";
import type { IOrganisationARML } from "shared";

import { RequiredMark } from "@/app/_components/inscription/RequiredMark";
import type { SetOrganisation } from "@/app/_components/inscription/types";
import { _get } from "@/common/httpClient";

export function ARMLSelect({ setOrganisation }: { setOrganisation: SetOrganisation }) {
  const { data: armls } = useQuery<Array<IOrganisationARML>>({
    queryKey: ["arml"],
    queryFn: async () => _get("/api/v1/mission-locale/arml"),
  });

  return (
    <Select
      label={
        <>
          Vous représentez : <RequiredMark />
        </>
      }
      placeholder="Sélectionner une ARML"
      nativeSelectProps={{
        onChange: (event) => {
          const arml = armls?.find(({ _id }) => _id.toString() === event.target.value);
          setOrganisation(arml ?? null);
        },
      }}
      options={(armls ?? [])
        .map((arml) => ({ value: arml._id.toString(), label: arml.nom }))
        .sort((a, b) => a.label.localeCompare(b.label))}
    />
  );
}
