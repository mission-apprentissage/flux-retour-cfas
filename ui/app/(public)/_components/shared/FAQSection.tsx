import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Button } from "@codegouvfr/react-dsfr/Button";
import type { ReactNode } from "react";

import styles from "./faq-section.module.scss";

type Question = { label: string; answer: NonNullable<ReactNode> };

const QUESTIONS: Array<Question> = [
  {
    label: "Comment fonctionne le Tableau de bord ?",
    answer: (
      <>
        <p>
          Le Tableau de bord de l’apprentissage est un outil partagé entre les CFA, les Missions Locales et les acteurs
          territoriaux pour faciliter l’accompagnement des jeunes en rupture.
        </p>
        <p>
          <strong>Pour les CFA :</strong>
        </p>
        <ul>
          <li>Ils identifient rapidement les jeunes en rupture parmi leurs effectifs.</li>
          <li>Ils peuvent identifier et solliciter la bonne Mission Locale pour chaque jeune.</li>
          <li>
            Ils suivent l’avancement et les actions réalisées par les Missions Locales via une fiche navette interactive
            partagée.
          </li>
        </ul>
        <p>
          <strong>Pour les Missions Locales :</strong>
        </p>
        <ul>
          <li>
            Elles accèdent à une liste de jeunes en rupture sur leur territoire :
            <ul>
              <li>via les dossiers transmis par les CFA,</li>
              <li>et via les données DECA pour les CFA non connectés.</li>
            </ul>
          </li>
          <li>
            Elles contactent les jeunes et renseignent les actions réalisées (contact, rendez-vous, suite donnée).
          </li>
        </ul>
        <p>
          <strong>Pour les acteurs territoriaux :</strong>
        </p>
        <ul>
          <li>
            Ils suivent l’activité sur leur territoire : jeunes en rupture, dossiers transmis, jeunes contactés,
            rendez-vous pris.
          </li>
          <li>Ils identifient les CFA engagés et accompagnent le déploiement du service.</li>
        </ul>
        <p>
          <strong>Notre mission :</strong> accélérer et optimiser la collaboration entre les CFA et les Missions Locales
          pour assurer un accompagnement coordonné pour chaque jeune dans une situation à risque dans son parcours
          d’apprentissage.
        </p>
      </>
    ),
  },
  {
    label: "Comment les Missions Locales accompagnent les jeunes en rupture ?",
    answer: "TODO: rédiger la réponse.",
  },
  {
    label: "Comment fonctionne une collaboration entre CFA et Missions Locales ?",
    answer: "TODO: rédiger la réponse.",
  },
  {
    label: "Pourquoi les jeunes en rupture de contrat et pas tous les apprenants ?",
    answer: "TODO: rédiger la réponse.",
  },
  {
    label: "D’où vient la source de données des listes du Tableau de bord ? Est-elle à jour ?",
    answer: "TODO: rédiger la réponse.",
  },
  {
    label: "Je veux bénéficier du Tableau de bord pour mon établissement (CFA) comment faire ?",
    answer: "TODO: rédiger la réponse.",
  },
  {
    label: "Je veux utiliser le Tableau de bord dans ma Mission Locale, comment faire ?",
    answer: "TODO: rédiger la réponse.",
  },
  {
    label:
      "Je veux accéder au suivi des activités de collaborations entre les CFA et les Missions Locales sur mon territoire",
    answer: "TODO: rédiger la réponse.",
  },
  {
    label: "Comment est mesuré l’impact du service du Tableau de bord ?",
    answer: "TODO: rédiger la réponse.",
  },
];

export function FAQSection() {
  return (
    <section className={styles.section}>
      <div className={styles.titleBlock}>
        <h2 className={styles.title}>FAQ</h2>
        <p className={styles.subtitle}>Vos questions, nos réponses</p>
      </div>
      <div className={styles.contentBlock}>
        <div className="fr-accordions-group">
          {QUESTIONS.map((question) => (
            <Accordion key={question.label} label={question.label}>
              {question.answer}
            </Accordion>
          ))}
        </div>
        <aside className={styles.help}>
          <div className={styles.helpBorder} aria-hidden="true" />
          <div className={styles.helpContent}>
            <h3 className={styles.helpTitle}>Vous n’avez pas trouvé la réponse à votre question ?</h3>
            <p className={styles.helpDescription}>
              N’hésitez pas à consulter notre Centre d’aide pour découvrir les articles rédigés par l’équipe du service.
              <br />
              Nous restons disponibles, contactez-nous directement.
            </p>
            <div className={styles.helpButtons}>
              <Button
                priority="primary"
                iconId="fr-icon-external-link-line"
                iconPosition="right"
                linkProps={{
                  href: "https://aide.cfas.apprentissage.beta.gouv.fr",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  title: "Consulter le centre d’aide - nouvelle fenêtre",
                }}
              >
                Consulter le centre d’aide
              </Button>
              <Button priority="secondary" linkProps={{ href: "/contact" }}>
                Contacter l’équipe du service
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
