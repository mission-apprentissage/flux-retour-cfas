"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { SUPPORT_PAGE_ACCUEIL } from "shared";

import { _post } from "@/common/httpClient";

import styles from "./activation-client.module.scss";
import { AuthMessageCard } from "./AuthMessageCard";

const REDIRECT_DELAY_MS = 2500;

type AccountStatus = "CONFIRMED" | "PENDING_ADMIN_VALIDATION" | "PENDING_EMAIL_VALIDATION";

type ActivationResponse = {
  account_status?: AccountStatus;
  validationByGestionnaire?: boolean;
};

function useActivation(activationToken: string | null) {
  const { data, isLoading, isError } = useQuery<ActivationResponse, Error>({
    queryKey: ["useActivation", activationToken],
    queryFn: async () => {
      if (!activationToken) {
        throw new Error("Missing activation token");
      }
      return await _post("/api/v1/auth/activation", { activationToken });
    },
    enabled: Boolean(activationToken),
    retry: false,
  });

  return {
    isLoading,
    isError,
    account_status: data?.account_status,
    validationByGestionnaire: data?.validationByGestionnaire,
  };
}

const homeLink = (
  <a href="/" className={`${fr.cx("fr-link", "fr-link--icon-left", "fr-icon-arrow-left-line")}`}>
    Retour à l&apos;accueil
  </a>
);

export default function ActivationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activationToken = searchParams?.get("activationToken") ?? null;

  const { isLoading, isError, account_status, validationByGestionnaire } = useActivation(activationToken);

  useEffect(() => {
    if (account_status === "CONFIRMED") {
      const timeout = setTimeout(() => router.push("/auth/connexion"), REDIRECT_DELAY_MS);
      return () => clearTimeout(timeout);
    }
  }, [account_status, router]);

  if (!activationToken || isError) {
    return (
      <AuthMessageCard
        icon="fr-icon-close-circle-fill"
        tone="error"
        title="Ce lien n’est plus valide"
        actions={
          <>
            <Button linkProps={{ href: SUPPORT_PAGE_ACCUEIL, target: "_blank", rel: "noopener noreferrer" }}>
              Contacter le support
            </Button>
            <Button priority="secondary" linkProps={{ href: "/auth/connexion" }}>
              Aller à la connexion
            </Button>
          </>
        }
        footer={homeLink}
      >
        <p>
          Le lien d’activation a expiré ou a déjà été utilisé. Contactez-nous en précisant votre adresse courriel pour
          qu’un administrateur puisse vous aider.
        </p>
      </AuthMessageCard>
    );
  }

  if (isLoading) {
    return (
      <AuthMessageCard
        icon={<span className={styles.loadingSpinner} aria-hidden />}
        title="Confirmation de votre compte"
        footer={homeLink}
      >
        <p role="status" aria-live="polite">
          Nous validons votre lien d’activation, merci de patienter quelques instants…
        </p>
      </AuthMessageCard>
    );
  }

  if (account_status === "PENDING_ADMIN_VALIDATION") {
    return (
      <AuthMessageCard icon="fr-icon-time-line" title="Votre compte est en attente de validation" footer={homeLink}>
        <p>
          Pour des raisons de sécurité, un{" "}
          <strong>{validationByGestionnaire ? "gestionnaire de votre organisation" : "administrateur"}</strong> va
          examiner votre demande.
        </p>
        <Alert
          className={styles.alert}
          severity="info"
          small
          description="Vous serez notifié(e) par courriel dès que votre demande sera validée. Pensez à vérifier vos courriers indésirables."
        />
      </AuthMessageCard>
    );
  }

  if (account_status === "CONFIRMED") {
    return (
      <AuthMessageCard
        icon="fr-icon-checkbox-circle-fill"
        tone="success"
        title="Votre compte est validé"
        footer={homeLink}
      >
        <p>Bienvenue sur le Tableau de bord de l’apprentissage.</p>
        <p className={styles.redirectRow} role="status" aria-live="polite">
          <span className={styles.redirectSpinner} aria-hidden />
          Redirection vers la page de connexion…
        </p>
      </AuthMessageCard>
    );
  }

  return (
    <AuthMessageCard icon="fr-icon-time-line" title="Confirmation de votre compte" footer={homeLink}>
      <p>Votre demande a bien été prise en compte.</p>
    </AuthMessageCard>
  );
}
