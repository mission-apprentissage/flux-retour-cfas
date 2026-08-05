"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { SUPPORT_PAGE_ACCUEIL, type IOrganisationCreate } from "shared";

import { PAGES } from "@/app/_utils/routes.utils";
import type { CategorieCompteInscription } from "@/modules/auth/inscription/categories";

import styles from "./inscription-organisation.module.scss";
import { InscriptionFranceTravail } from "./InscriptionFranceTravail";
import { InscriptionMissionLocale } from "./InscriptionMissionLocale";
import { InscriptionOperateurPublic } from "./InscriptionOperateurPublic";
import { InscriptionOrganismeFormation } from "./InscriptionOrganismeFormation";
import { InscriptionTeteDeReseau } from "./InscriptionTeteDeReseau";

export default function InscriptionOrganisationClient({
  typeOrganisation,
}: {
  typeOrganisation: CategorieCompteInscription;
}) {
  const router = useRouter();
  const [organisation, setOrganisation] = useState<IOrganisationCreate | null>(null);
  const [hideBackNextButtons, setHideBackNextButtons] = useState(false);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Créer votre compte</h1>

        {typeOrganisation === "autre" && (
          <div className={styles.contactBlock}>
            <p>Contacter l&apos;équipe :</p>
            <a className={fr.cx("fr-link")} href={SUPPORT_PAGE_ACCUEIL} target="_blank" rel="noopener noreferrer">
              Contactez-nous
            </a>
          </div>
        )}

        {typeOrganisation === "organisme_formation" && (
          <Suspense>
            <InscriptionOrganismeFormation organisation={organisation} setOrganisation={setOrganisation} />
          </Suspense>
        )}

        {typeOrganisation === "missions_locales" && <InscriptionMissionLocale setOrganisation={setOrganisation} />}

        {typeOrganisation === "operateur_public" && <InscriptionOperateurPublic setOrganisation={setOrganisation} />}

        {typeOrganisation === "tete_de_reseau" && (
          <InscriptionTeteDeReseau
            organisation={organisation}
            setOrganisation={setOrganisation}
            setHideBackNextButtons={setHideBackNextButtons}
          />
        )}

        {typeOrganisation === "france_travail" && <InscriptionFranceTravail setOrganisation={setOrganisation} />}

        {!hideBackNextButtons && (
          <div className={styles.actions}>
            <Button
              type="button"
              priority="secondary"
              onClick={() => router.push(PAGES.dynamic.authInscription().getPath())}
            >
              Revenir
            </Button>
            <Button
              type="button"
              disabled={!organisation}
              onClick={() => router.push(`/auth/inscription/profil?organisation=${JSON.stringify(organisation)}`)}
            >
              Suivant
            </Button>
          </div>
        )}

        {typeOrganisation === "organisme_formation" && (
          <p className={styles.footerLink}>
            <a className={fr.cx("fr-link")} href={PAGES.static.authInscriptionOrganismeInconnu.getPath()}>
              Vous ne connaissez ni votre UAI ni votre SIRET
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
