"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { PAGES } from "@/app/_utils/routes.utils";
import { _post } from "@/common/httpClient";

import { AuthMessageCard } from "../_components/AuthMessageCard";

export default function RefusInvitationClient() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams?.get("invitationToken") ?? null;

  useEffect(() => {
    if (!invitationToken) {
      return;
    }

    _post(`/api/v1/invitations/${invitationToken}/reject`).catch(() => {});
  }, [invitationToken]);

  return (
    <AuthMessageCard
      icon="ri-user-unfollow-line"
      title="Vous ne donnez pas suite à l’invitation."
      actions={
        <Button priority="secondary" linkProps={{ href: PAGES.dynamic.authInscription().getPath() }}>
          Créer mon compte
        </Button>
      }
    >
      <p>La personne à l’origine de l’invitation sera informée par email.</p>
      <p>Si vous changez d’avis, cliquez sur le bouton ci-dessous.</p>
    </AuthMessageCard>
  );
}
