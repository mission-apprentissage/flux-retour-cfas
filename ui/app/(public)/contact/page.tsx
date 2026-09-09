import { fr } from "@codegouvfr/react-dsfr";

import { PAGES } from "@/app/_utils/routes.utils";

import { ContactFaqLink } from "./ContactFaqLink";
import styles from "./page.module.scss";

export const metadata = PAGES.static.contact.getMetadata();

export default function ContactPage() {
  return (
    <main className={fr.cx("fr-container", "fr-py-6w")}>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-9")}>
          <h1 className={styles.title}>Contactez notre équipe support</h1>
          <p>
            Merci de prendre contact avec l’équipe du Tableau de bord de l’apprentissage. Afin que nous puissions vous
            répondre dans les meilleurs délais, veuillez indiquer vos coordonnées et sélectionner ci-dessous le sujet
            pour lequel vous souhaitez nous contacter.
          </p>
          <div className={styles.faqLink}>
            <ContactFaqLink />
          </div>
          <iframe
            title="Contact Form"
            src="https://plugins.crisp.chat/urn:crisp.im:contact-form:0/contact/6d61b7c2-9d92-48dd-b4b9-5c8317f44099"
            referrerPolicy="origin"
            sandbox="allow-forms allow-popups allow-scripts allow-same-origin"
            className={styles.iframe}
          />
        </div>
      </div>
    </main>
  );
}
