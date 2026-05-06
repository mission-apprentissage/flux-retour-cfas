import { Button } from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PAGES } from "@/app/_utils/routes.utils";

import styles from "./footer-cta-section.module.scss";

type TypeOrganisationInscription = "missions_locales" | "operateur_public" | "organisme_formation";

export function FooterCTASection({ linkInscription }: { linkInscription?: TypeOrganisationInscription }) {
  const inscriptionHref = PAGES.dynamic.authInscription({ typeOrganisation: linkInscription }).getPath();
  return (
    <section className={styles.section}>
      <div className={styles.illustrationBand}>
        <div className={styles.illustrationContainer}>
          <Image
            className={styles.illustration}
            src="/images/home/illustration-footer-cfa-ml.png"
            alt=""
            width={494}
            height={185}
          />
        </div>
      </div>
      <div className={styles.ctaBand}>
        <div className={styles.ctaContainer}>
          <div>
            <p className={styles.subtitle}>
              Les Missions Locales de votre territoire sont prêtes à accompagner vos apprenants en difficulté.
            </p>
            <p className={styles.title}>Commencez à collaborer sur le Tableau de bord de l’apprentissage.</p>
          </div>
          <div className={styles.actions}>
            <Button
              className={styles.primaryButton}
              priority="primary"
              iconId="fr-icon-arrow-right-line"
              iconPosition="right"
              linkProps={{
                href: inscriptionHref,
                "aria-label":
                  "Inscrire mon établissement : Commencez à collaborer sur le Tableau de bord de l’apprentissage.",
              }}
            >
              Inscrire mon établissement
            </Button>
            <DsfrLink
              href={inscriptionHref}
              className={styles.demoLink}
              aria-label="Demander une démo : Commencez à collaborer sur le Tableau de bord de l’apprentissage."
            >
              Demander une démo
            </DsfrLink>
          </div>
        </div>
      </div>
    </section>
  );
}
