"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { FormEvent, useEffect, useState } from "react";
import { MOTIFS_DEMANDE_ACTIVATION } from "shared/models/data/demandesActivationCfa.model";
import {
  IDemandeActivationLigne,
  IModificationDemandeActivation,
} from "shared/models/routes/admin/demandes-activation.api";
import { z } from "zod";

import { getServerErrorMessage } from "@/common/rateLimit";

import { nomCfa } from "./libelles";

export const correctionModal = createModal({ id: "demande-activation-correction", isOpenedByDefault: false });

const ID_FORMULAIRE = "demande-activation-correction-formulaire";

const normaliserEmail = (valeur: string) => valeur.toLowerCase().replace(/\s+/g, "");

const normaliserSiret = (valeur: string) => valeur.replace(/\D/g, "");

const erreurEmail = (valeur: string) => {
  const email = normaliserEmail(valeur);
  return email && !z.string().email().safeParse(email).success ? "Adresse e-mail invalide." : null;
};

const erreurSiret = (valeur: string) =>
  valeur.trim() && normaliserSiret(valeur).length !== 14 ? "Le SIRET doit faire 14 chiffres." : null;

export function CorrectionDemandeModal({
  demande,
  corriger,
}: {
  demande: IDemandeActivationLigne | null;
  corriger: (demande: IDemandeActivationLigne, modification: IModificationDemandeActivation) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [siret, setSiret] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    setEmail(demande?.email_corrige ?? "");
    setSiret(demande?.siret_corrige ?? "");
    setErreur(null);
  }, [demande]);

  useIsModalOpen(correctionModal, { onConceal: () => setErreur(null) });

  const erreurDeLEmail = erreurEmail(email);
  const erreurDuSiret = erreurSiret(siret);

  const enregistrer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!demande || erreurDeLEmail || erreurDuSiret) return;
    setEnCours(true);
    setErreur(null);
    try {
      await corriger(demande, {
        email_corrige: normaliserEmail(email) || null,
        siret_corrige: normaliserSiret(siret) || null,
      });
      correctionModal.close();
    } catch (err) {
      setErreur(getServerErrorMessage(err, "La correction a échoué"));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <correctionModal.Component
      title="Corriger la demande"
      buttons={[
        { children: "Annuler", priority: "secondary", doClosesModal: true, disabled: enCours },
        {
          children: "Enregistrer",
          doClosesModal: false,
          disabled: enCours || !!erreurDeLEmail || !!erreurDuSiret,
          nativeButtonProps: { type: "submit", form: ID_FORMULAIRE },
        },
      ]}
    >
      {demande && (
        <form id={ID_FORMULAIRE} onSubmit={enregistrer} noValidate>
          <p className="fr-text--bold fr-mb-1w">{nomCfa(demande)}</p>
          {demande.motifs.length > 0 && (
            <ul className="fr-tags-group" aria-label="Motifs de refus actuels">
              {demande.motifs.map((motif) => (
                <li key={motif}>
                  <Tag small>{MOTIFS_DEMANDE_ACTIVATION[motif].libelle}</Tag>
                </li>
              ))}
            </ul>
          )}

          <fieldset className="fr-fieldset">
            <legend className="fr-fieldset__legend">E-mail</legend>
            <div className="fr-fieldset__element">
              <p className="fr-text--sm fr-mb-1w">
                Saisi dans le formulaire : <strong>{demande.email_saisi || "—"}</strong>
              </p>
            </div>
            <div className="fr-fieldset__element">
              <Input
                label="E-mail corrigé"
                hintText="Laisser vide pour revenir à l'e-mail saisi. Une invitation déjà envoyée à l'ancienne adresse est annulée."
                state={erreurDeLEmail ? "error" : "default"}
                stateRelatedMessage={erreurDeLEmail}
                nativeInputProps={{
                  type: "email",
                  value: email,
                  autoComplete: "off",
                  onChange: (event) => setEmail(event.target.value),
                }}
              />
            </div>
          </fieldset>

          <fieldset className="fr-fieldset">
            <legend className="fr-fieldset__legend">SIRET</legend>
            <div className="fr-fieldset__element">
              <p className="fr-text--sm fr-mb-1w">
                Saisi dans le formulaire : <strong>{demande.siret_saisi_brut || "—"}</strong>
              </p>
            </div>
            {demande.siret_propose && (
              <div className="fr-fieldset__element">
                <p className="fr-text--sm fr-mb-1w">
                  SIRET ouvert de même UAI : <strong>{demande.siret_propose}</strong>
                </p>
                <Button
                  type="button"
                  priority="tertiary"
                  size="small"
                  onClick={() => setSiret(demande.siret_propose ?? "")}
                >
                  Utiliser ce SIRET
                </Button>
              </div>
            )}
            <div className="fr-fieldset__element">
              <Input
                label="SIRET corrigé"
                hintText="14 chiffres. Laisser vide pour revenir au SIRET saisi."
                state={erreurDuSiret ? "error" : "default"}
                stateRelatedMessage={erreurDuSiret}
                nativeInputProps={{
                  value: siret,
                  inputMode: "numeric",
                  onChange: (event) => setSiret(event.target.value),
                }}
              />
            </div>
          </fieldset>

          {erreur && <Alert severity="error" small description={erreur} />}
        </form>
      )}
    </correctionModal.Component>
  );
}
