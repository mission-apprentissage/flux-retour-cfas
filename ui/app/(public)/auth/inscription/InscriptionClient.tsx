"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PAGES } from "@/app/_utils/routes.utils";
import { categoriesCompteInscription, type CategorieCompteInscription } from "@/modules/auth/inscription/categories";

import styles from "./inscription.module.scss";

export default function InscriptionClient() {
  const router = useRouter();
  const [typeOrganisation, setTypeOrganisation] = useState<CategorieCompteInscription | null>(null);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Créer votre compte</h1>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (typeOrganisation) {
              router.push(PAGES.dynamic.authInscription({ typeOrganisation }).getPath());
            }
          }}
        >
          <RadioButtons
            legend="Vous représentez :"
            name="type"
            options={categoriesCompteInscription.map((categorie) => ({
              label: categorie.text,
              nativeInputProps: {
                value: categorie.value,
                checked: typeOrganisation === categorie.value,
                onChange: () => setTypeOrganisation(categorie.value),
              },
            }))}
          />

          <div className={styles.actions}>
            <Button type="submit" disabled={!typeOrganisation} iconId="ri-arrow-right-line" iconPosition="right">
              Continuer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
