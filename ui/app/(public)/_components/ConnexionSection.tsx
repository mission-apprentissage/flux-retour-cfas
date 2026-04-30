import { Button } from "@codegouvfr/react-dsfr/Button";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

import styles from "./connexion-section.module.scss";

type RowAction = { label: string; href: string };

type Row = {
  iconClass: string;
  title: string;
  description: string;
  primary?: RowAction;
  secondary: RowAction;
  variant?: "stats";
};

const ROWS: Row[] = [
  {
    iconClass: "ri-school-line",
    title: "Je suis un établissement de formation",
    description:
      "Accédez à la liste de vos effectifs en rupture et initiez des collaborations avec les Missions Locales de rattachement de vos apprenants.",
    primary: { label: "Créer mon compte", href: "/cfa" },
    secondary: { label: "Découvrir les fonctionnalités", href: "/cfa" },
  },
  {
    iconClass: "fr-icon-community-line",
    title: "Je suis une Mission Locale",
    description:
      "Accédez à la liste des jeunes en rupture de contrat d’apprentissage sur votre territoire et collaborez avec les CFA.",
    primary: { label: "Créer mon compte", href: "/missions-locales" },
    secondary: { label: "Découvrir les fonctionnalités", href: "/missions-locales" },
  },
  {
    iconClass: "fr-icon-government-line",
    title: "Je suis un-e référent-e territorial•e",
    description:
      "Suivez l’activité et la collaboration des CFA et des Missions Locales de votre territoire pour la lutte contre le décrochage de l’apprentissage.",
    primary: { label: "Obtenir mon accès", href: "/territoires" },
    secondary: { label: "Découvrir les fonctionnalités", href: "/territoires" },
  },
  {
    iconClass: "fr-icon-line-chart-line",
    title:
      "+100 accompagnements démarrés chaque semaine grâce à la collaboration des CFA et des Missions Locales sur le service",
    description: "Découvrez les chiffres de l’impact du service Tableau de bord de l’apprentissage.",
    secondary: { label: "Voir les indicateurs d’impact", href: "/impact" },
    variant: "stats",
  },
];

export function ConnexionSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        Le Tableau de bord de l’apprentissage outille les acteurs pour assurer un accompagnement à tous ceux qui en ont
        besoin
      </h2>
      <div className={styles.rows}>
        {ROWS.map((row) => (
          <div key={row.title} className={row.variant === "stats" ? styles.rowStats : styles.row}>
            <div className={styles.rowLeft}>
              <span className={`${row.iconClass} ${styles.rowIcon}`} aria-hidden="true" />
              <div className={styles.rowText}>
                <h3 className={styles.rowTitle}>{row.title}</h3>
                <p className={styles.rowDescription}>{row.description}</p>
              </div>
            </div>
            <div className={styles.rowRight}>
              {row.primary && (
                <Button iconId="fr-icon-arrow-right-line" iconPosition="right" linkProps={{ href: row.primary.href }}>
                  {row.primary.label}
                </Button>
              )}
              <DsfrLink
                href={row.secondary.href}
                className={styles.rowLink}
                aria-label={`${row.secondary.label} : ${row.title}`}
              >
                {row.secondary.label}
              </DsfrLink>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
