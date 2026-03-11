"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

const modal = createModal({
  id: "rupture-info-cfa",
  isOpenedByDefault: false,
});

export function CfaRuptureInfoModal() {
  return (
    <modal.Component
      title="Modifier le statut de rupture"
      buttons={[
        {
          children: "Fermer",
          doClosesModal: true,
          priority: "primary" as const,
        },
      ]}
    >
      <p>
        Pour signaler que cet effectif n&apos;est plus en rupture, veuillez nous contacter à{" "}
        <a href="mailto:tableau-de-bord@apprentissage.beta.gouv.fr">tableau-de-bord@apprentissage.beta.gouv.fr</a> en
        décrivant la situation.
      </p>
    </modal.Component>
  );
}

export { modal as ruptureInfoModal };
