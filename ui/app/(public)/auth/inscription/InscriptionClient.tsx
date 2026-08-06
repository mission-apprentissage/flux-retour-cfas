"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PAGES } from "@/app/_utils/routes.utils";
import { categoriesCompteInscription, type CategorieCompteInscription } from "@/modules/auth/inscription/categories";

import { AuthCard } from "../_components/AuthCard";

import styles from "./inscription.module.scss";

export default function InscriptionClient() {
  const router = useRouter();
  const [typeOrganisation, setTypeOrganisation] = useState<CategorieCompteInscription | null>(null);

  return (
    <AuthCard
      title="Créer votre compte"
      step={{ current: 1, total: 3, title: "Type d’organisation", nextTitle: "Votre organisation" }}
      footer={
        <p>
          Vous avez déjà un compte ?{" "}
          <a className={fr.cx("fr-link")} href={PAGES.static.authConnexion.getPath()}>
            Se connecter
          </a>
        </p>
      }
    >
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
            hintText: categorie.hint,
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
    </AuthCard>
  );
}
