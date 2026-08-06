"use client";

import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useRouter, useSearchParams } from "next/navigation";

import { OrganismeSearchForm, type OrganismeSearchKind } from "@/app/_components/inscription/OrganismeSearchForm";
import type { InscriptionFormProps } from "@/app/_components/inscription/types";
import { PAGES } from "@/app/_utils/routes.utils";

import styles from "./inscription-organisation.module.scss";

const SEARCH_KINDS: { value: OrganismeSearchKind; label: string }[] = [
  { value: "uai", label: "UAI" },
  { value: "siret", label: "SIRET" },
];

const isSearchKind = (value: string | null | undefined): value is OrganismeSearchKind =>
  value === "uai" || value === "siret";

export function InscriptionOrganismeFormation({ organisation, setOrganisation }: InscriptionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSelect = searchParams?.get("select");
  const typeOfSearch = isSearchKind(rawSelect) ? rawSelect : undefined;

  const setTypeOfSearch = (kind: OrganismeSearchKind) => {
    router.replace(
      `${PAGES.dynamic.authInscription({ typeOrganisation: "organisme_formation" }).getPath()}?select=${kind}`
    );
    setOrganisation(null);
  };

  return (
    <div>
      <p className={styles.intro}>Vous êtes un CFA ou organisme de formation.</p>

      <RadioButtons
        legend={
          <>
            Au choix, indiquez l’UAI ou le SIRET de votre établissement : <span className={styles.requiredMark}>*</span>
          </>
        }
        name="select"
        orientation="horizontal"
        options={SEARCH_KINDS.map((kind) => ({
          label: kind.label,
          nativeInputProps: {
            value: kind.value,
            checked: typeOfSearch === kind.value,
            onChange: () => setTypeOfSearch(kind.value),
          },
        }))}
      />

      {typeOfSearch && (
        <OrganismeSearchForm
          key={typeOfSearch}
          kind={typeOfSearch}
          organisation={organisation}
          setOrganisation={setOrganisation}
        />
      )}
    </div>
  );
}
