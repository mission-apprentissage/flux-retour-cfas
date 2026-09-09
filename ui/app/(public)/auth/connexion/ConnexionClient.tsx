"use client";

import { fr } from "@codegouvfr/react-dsfr";

import {
  formatAdresseShort,
  OnboardingError,
  OnboardingLayout,
  OnboardingSidePanel,
  OnboardingSkeleton,
  useConnexionInvitationInfo,
  type OnboardingMlItem,
} from "@/app/_components/onboarding";
import { PAGES } from "@/app/_utils/routes.utils";

import { AuthCard } from "../_components/AuthCard";

import styles from "./Connexion.module.scss";
import { ConnexionInvitationLoginForm } from "./ConnexionInvitationLoginForm";
import { StandardLoginForm } from "./StandardLoginForm";

const SIDE_PANEL_INTRO =
  "Le Tableau de bord de l'apprentissage : l'outil de collaboration entre les CFA et les Missions Locales pour l'accompagnement des jeunes en rupture de contrat d'apprentissage.";

const SIDE_PANEL_ILLUSTRATION = {
  src: "/images/illu-onboarding.png",
  alt: "Illustration collaboration CFA et Missions Locales",
};

export default function ConnexionClient() {
  const invitation = useConnexionInvitationInfo();

  if (invitation.status === "loading") {
    return <OnboardingSkeleton />;
  }

  if (invitation.status === "error") {
    return (
      <OnboardingError
        description={invitation.message}
        backHref="/auth/connexion"
        backLabel="Continuer vers la connexion classique"
      />
    );
  }

  if (invitation.status === "idle") {
    return (
      <AuthCard
        title="Connectez-vous"
        footer={
          <p className={styles.footerText}>
            Vous n&apos;avez pas encore de compte ?{" "}
            <a className={fr.cx("fr-link")} href={PAGES.dynamic.authInscription().getPath()}>
              Créer un compte
            </a>
          </p>
        }
      >
        <StandardLoginForm />
      </AuthCard>
    );
  }

  const mlItems: OnboardingMlItem[] = invitation.data.missionsLocales.map((ml, idx) => ({
    id: `${ml.nom ?? "ml"}-${idx}`,
    nom: ml.nom ?? "Mission Locale",
    subtext: formatAdresseShort(ml.adresse) || undefined,
  }));

  return (
    <OnboardingLayout
      sidebar={
        <OnboardingSidePanel
          illustration={SIDE_PANEL_ILLUSTRATION}
          intro={SIDE_PANEL_INTRO}
          missionsLocales={mlItems}
          emptyMlMessage="Aucune Mission Locale partenaire n'est encore identifiée sur votre territoire. Vous serez parmi les premiers à pouvoir collaborer dès qu'une rejoindra le service."
        />
      }
      title="Connectez-vous et commencez à collaborer"
    >
      <div className={styles.card}>
        <ConnexionInvitationLoginForm invitation={invitation.data} />
      </div>
    </OnboardingLayout>
  );
}
