"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";

import { useAuth } from "@/app/_context/UserContext";
import { PAGES } from "@/app/_utils/routes.utils";
import { _get, _post } from "@/common/httpClient";

import styles from "./connexion-api.module.scss";

const SUPPORT_EMAIL = "tableau-de-bord@apprentissage.beta.gouv.fr";

const zConnexionApiQuery = z.strictObject({
  siret: z.string(),
  uai: z.string(),
  erp: z.string(),
  api_key: z.string().optional(),
});

type ConnexionApiQuery = z.output<typeof zConnexionApiQuery>;

const parametresPath = (erp: string) => `/parametres?erpV3=${encodeURIComponent(erp)}`;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <Card title="Connexion à votre ERP">
      <p role="status" aria-live="polite">
        {label}
      </p>
    </Card>
  );
}

function NotConnected() {
  const [originConnexionUrl, setOriginConnexionUrl] = useLocalStorage("originConnexionUrl", "");

  useEffect(() => {
    if (originConnexionUrl !== window.location.href) {
      setOriginConnexionUrl(window.location.href);
    }
  }, [originConnexionUrl, setOriginConnexionUrl]);

  return (
    <Card title="Bienvenue sur le tableau de bord">
      <p>
        Connectez-vous ou créez un compte pour relier votre ERP au tableau de bord de l’apprentissage. Vous reviendrez
        ici automatiquement.
      </p>
      <div className={styles.actions}>
        <Button linkProps={{ href: PAGES.static.authConnexion.getPath() }}>Se connecter</Button>
        <Button priority="secondary" linkProps={{ href: PAGES.dynamic.authInscription().getPath() }}>
          Créer un compte
        </Button>
      </div>
    </Card>
  );
}

function VerifyUser({ organismeId, query }: { organismeId: string; query: ConnexionApiQuery }) {
  const { data, error } = useQuery<{ message?: string }, any>(
    ["verify-user", organismeId],
    () => _post(`/api/v1/organismes/${organismeId}/verify-user`, query),
    { retry: false }
  );

  useEffect(() => {
    if (error?.statusCode === 403) {
      _post("/api/v1/auth/logout").finally(() => {
        window.location.href = "/";
      });
      return;
    }
    if (data?.message === "success") {
      window.location.href = parametresPath(query.erp);
    }
  }, [error, data, query.erp]);

  if (error?.statusCode === 403) {
    return (
      <Card title="Connexion à votre ERP">
        <Alert
          severity="error"
          title="Vous n’avez pas les droits pour accéder à cette page"
          description="La clé API transmise ne correspond pas à celle de votre organisme. Vous allez être déconnecté."
        />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Connexion à votre ERP">
        <Alert
          severity="error"
          title="La configuration n’a pas pu être vérifiée"
          description={`Merci d’envoyer un message à notre équipe de support à l’adresse ${SUPPORT_EMAIL}.`}
        />
      </Card>
    );
  }

  return <Pending label="Vérification de votre configuration…" />;
}

function ConfiguredOrganisme({ query }: { query: ConnexionApiQuery }) {
  const router = useRouter();
  const { data: organisme, isLoading } = useQuery<{ _id: string; api_key?: string }, any>(
    ["organisation/organisme"],
    () => _get("/api/v1/organisation/organisme")
  );

  const noApiKeyToVerify = !query.api_key;

  useEffect(() => {
    if (noApiKeyToVerify) {
      router.push(parametresPath(query.erp));
    }
  }, [noApiKeyToVerify, router, query.erp]);

  if (noApiKeyToVerify) {
    return <Pending label="Redirection vers vos paramètres…" />;
  }

  if (isLoading || !organisme) {
    return <Pending label="Récupération de votre organisme…" />;
  }

  return <VerifyUser organismeId={organisme._id} query={query} />;
}

export default function ConnexionApiClient() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const validation = zConnexionApiQuery.safeParse(Object.fromEntries(searchParams?.entries() ?? []));

  if (!user) {
    return <NotConnected />;
  }

  if (user.account_status !== "CONFIRMED") {
    return (
      <Card title="Connexion à votre ERP">
        <Alert
          severity="info"
          title="Votre compte est en cours de validation"
          description="Vous pourrez relier votre ERP dès que votre compte aura été validé."
        />
      </Card>
    );
  }

  if (user.organisation?.type !== "ORGANISME_FORMATION") {
    return (
      <Card title="Connexion à votre ERP">
        <Alert
          severity="error"
          title="Vous n’avez pas les droits pour accéder à cette page"
          description="Cette page est réservée aux organismes de formation."
        />
      </Card>
    );
  }

  if (!validation.success) {
    return (
      <Card title="Connexion à votre ERP">
        <Alert
          severity="error"
          title="Un problème de configuration a été détecté"
          description={`Le lien fourni par votre ERP est incomplet. Merci d’envoyer un message à notre équipe de support à l’adresse ${SUPPORT_EMAIL}.`}
        />
      </Card>
    );
  }

  return <ConfiguredOrganisme query={validation.data} />;
}
