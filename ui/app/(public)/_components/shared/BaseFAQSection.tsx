import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Button } from "@codegouvfr/react-dsfr/Button";
import type { ReactNode } from "react";

import styles from "./faq-section.module.scss";

export type Question = { label: string; answer: NonNullable<ReactNode> };

export function BaseFAQSection({ questions }: { questions: Array<Question> }) {
  return (
    <section className={styles.section}>
      <div className={styles.titleBlock}>
        <h2 className={styles.title}>FAQ</h2>
        <p className={styles.subtitle}>Vos questions, nos réponses</p>
      </div>
      <div className={styles.contentBlock}>
        <div className="fr-accordions-group">
          {questions.map((question) => (
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
