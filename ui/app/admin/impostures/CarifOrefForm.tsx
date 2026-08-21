"use client";

import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useState } from "react";
import { REGIONS_SORTED, type IRegionCode } from "shared";

import { RequiredMark } from "@/app/_components/inscription/RequiredMark";
import type { SetOrganisation } from "@/app/_components/inscription/types";

const types = [
  { value: "national", label: "Le réseau national INTERCARIFOREF" },
  { value: "regional", label: "Un CARIF OREF régional" },
] as const;

type TypeCarifOref = (typeof types)[number]["value"];

export function CarifOrefForm({ setOrganisation }: { setOrganisation: SetOrganisation }) {
  const [type, setType] = useState<TypeCarifOref | null>(null);

  return (
    <>
      <RadioButtons
        legend={
          <>
            Vous représentez : <RequiredMark />
          </>
        }
        name="typeCarifOref"
        options={types.map((option) => ({
          label: option.label,
          nativeInputProps: {
            value: option.value,
            checked: type === option.value,
            onChange: () => {
              setType(option.value);
              setOrganisation(option.value === "national" ? { type: "CARIF_OREF_NATIONAL" } : null);
            },
          },
        }))}
      />

      {type === "regional" && (
        <Select
          label={
            <>
              Votre territoire : <RequiredMark />
            </>
          }
          placeholder="Sélectionner un territoire"
          nativeSelectProps={{
            onChange: (event) =>
              setOrganisation(
                event.target.value
                  ? { type: "CARIF_OREF_REGIONAL", code_region: event.target.value as IRegionCode }
                  : null
              ),
          }}
          options={REGIONS_SORTED.map((region) => ({ value: region.code, label: region.nom }))}
        />
      )}
    </>
  );
}
