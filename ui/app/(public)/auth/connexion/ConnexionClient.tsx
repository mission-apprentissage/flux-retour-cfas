"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Container, Link, Stack, Typography } from "@mui/material";
import NextLink from "next/link";

import {
  formatAdresseShort,
  OnboardingError,
  OnboardingLayout,
  OnboardingSidePanel,
  OnboardingSkeleton,
  useConnexionInvitationInfo,
  type OnboardingMlItem,
} from "@/app/_components/onboarding";

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
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          border: "1px solid",
          borderColor: fr.colors.decisions.border.default.grey.default,
          py: { xs: fr.spacing("6w") },
          px: { xs: fr.spacing("6w") },
          mx: "auto",
          my: { xs: fr.spacing("2w"), md: fr.spacing("4w") },
        }}
      >
        <Typography component="h1" variant="h3" sx={{ mb: fr.spacing("3w") }}>
          Connectez-vous
        </Typography>
        <StandardLoginForm />
        <Stack direction="row" spacing={fr.spacing("1w")} justifyContent="center" sx={{ mt: fr.spacing("8w") }}>
          <Typography>Vous n&apos;avez pas encore de compte ?</Typography>
          <Link component={NextLink} href="/auth/inscription">
            Créer un compte
          </Link>
        </Stack>
      </Container>
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
