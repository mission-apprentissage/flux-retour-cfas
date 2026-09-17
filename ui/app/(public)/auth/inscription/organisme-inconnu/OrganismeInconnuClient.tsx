"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { useRouter } from "next/navigation";
import { CRISP_FAQ } from "shared";

import { AuthMessageCard } from "../../_components/AuthMessageCard";

const REFERENTIEL_URL = "https://referentiel.apprentissage.onisep.fr/";

export default function OrganismeInconnuClient() {
  const router = useRouter();

  return (
    <AuthMessageCard
      icon="ri-search-line"
      title="Vous ne connaissez ni l’UAI ni le SIRET de votre organisme."
      actions={
        <button
          type="button"
          onClick={() => router.back()}
          className={fr.cx("fr-link", "fr-icon-arrow-left-line", "fr-link--icon-left")}
        >
          Retour à l’étape précédente
        </button>
      }
    >
      <p>
        Vous pouvez le retrouver facilement en consultant le{" "}
        <a href={REFERENTIEL_URL} target="_blank" rel="noopener noreferrer" className={fr.cx("fr-link")}>
          référentiel de l’apprentissage
        </a>
        .
      </p>
      <p>
        Vous pouvez aussi consulter la{" "}
        <a href={CRISP_FAQ} target="_blank" rel="noopener noreferrer" className={fr.cx("fr-link")}>
          FAQ
        </a>{" "}
        du tableau de bord.
      </p>
    </AuthMessageCard>
  );
}
