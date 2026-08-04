import { fr } from "@codegouvfr/react-dsfr";

import { PAGES } from "@/app/_utils/routes.utils";

import { AuthMessageCard } from "../../_components/AuthMessageCard";

export const metadata = PAGES.static.authInscriptionReseauAutre.getMetadata();

export default function InscriptionReseauAutrePage() {
  return (
    <main>
      <AuthMessageCard
        icon="ri-time-line"
        tone="warning"
        title="La création de votre compte n’a pu aboutir (pour le moment)."
        actions={
          <a
            href={PAGES.static.home.getPath()}
            className={fr.cx("fr-link", "fr-icon-arrow-left-line", "fr-link--icon-left")}
          >
            Retour à l’accueil
          </a>
        }
      >
        <p>Le réseau indiqué n’est actuellement pas encore référencé sur le tableau de bord.</p>
        <p>
          L’équipe du tableau de bord reviendra vers vous pour investiguer et finaliser la création de votre compte.
        </p>
        <p>Merci de votre patience et de l’intérêt que vous portez au tableau de bord de l’apprentissage.</p>
      </AuthMessageCard>
    </main>
  );
}
