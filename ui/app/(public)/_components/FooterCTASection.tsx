import { Button } from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

import styles from "./footer-cta-section.module.scss";

type CTA = {
  iconClass: string;
  title: string;
  buttonLabel: string;
  href: string;
};

const CTAS: Array<CTA> = [
  {
    iconClass: "ri-school-line",
    title: "Je suis un établissement de formation (CFA)",
    buttonLabel: "Créer mon compte",
    href: "/cfa",
  },
  {
    iconClass: "fr-icon-community-line",
    title: "Je suis une Mission Locale",
    buttonLabel: "Créer mon compte",
    href: "/missions-locales",
  },
  {
    iconClass: "fr-icon-government-line",
    title: "Je suis un-e référent-e territorial•e",
    buttonLabel: "Obtenir mon accès",
    href: "/territoires",
  },
];

function CTAItem(cta: CTA) {
  return (
    <div key={cta.href} className={styles.ctaItem}>
      <div className={styles.ctaTop}>
        <span className={`${cta.iconClass} ${styles.ctaIcon}`} aria-hidden="true" />
        <h3 className={styles.ctaTitle}>{cta.title}</h3>
      </div>
      <div className={styles.ctaActions}>
        <Button
          className={styles.ctaButton}
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          linkProps={{ href: cta.href, "aria-label": `${cta.buttonLabel} : ${cta.title}` }}
        >
          {cta.buttonLabel}
        </Button>
        <DsfrLink
          className={styles.ctaLink}
          href={cta.href}
          aria-label={`Découvrir les fonctionnalités : ${cta.title}`}
        >
          Découvrir les fonctionnalités
        </DsfrLink>
      </div>
    </div>
  );
}

export function FooterCTASection() {
  return (
    <section className={styles.section}>
      <div className={styles.illustrationBand}>
        <Image
          className={styles.illustration}
          src="/images/home/illustration-footer.png"
          alt=""
          width={1264}
          height={384}
        />
      </div>
      <div className={styles.ctaBand}>
        <h2 className={styles.srOnly}>Rejoindre le service</h2>
        <div className={styles.ctaContainer}>
          {CTAS.map((cta) => (
            <CTAItem key={cta.href} {...cta} />
          ))}
        </div>
      </div>
    </section>
  );
}
