"use client";

import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useState } from "react";
import { IOrganisme, IEffectifMissionLocale, IEffectifOrganismeFormation } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

import { MOTIF_LABELS } from "../constants";

import styles from "./Feedback.module.css";

type EffectifWithContacts = (IEffectifMissionLocale["effectif"] | IEffectifOrganismeFormation["effectif"]) & {
  organisme?: {
    contacts_from_referentiel?: IOrganisme["contacts_from_referentiel"];
  };
  contacts_tdb?: Array<{
    email?: string;
    telephone?: string;
    nom?: string;
    prenom?: string;
    fonction?: string;
  }>;
};

interface ProblematiquesJeuneProps {
  organismeData: {
    motif?: string[] | null;
    commentaires?: string | null;
  };
  effectif?: EffectifWithContacts;
  showContacts?: boolean;
}

export function ProblematiquesJeune({ organismeData, effectif, showContacts = true }: ProblematiquesJeuneProps) {
  const [contactsOpen, setContactsOpen] = useState(false);

  return (
    <div className={styles.effectifFeedbackContainer}>
      <div className="fr-mb-2v">
        <b>Problématiques rencontrées par le jeune :</b>
      </div>
      <div className="fr-mb-2v">
        {organismeData?.motif?.map((motif, index) => (
          <Tag key={index} className={styles.effectifFeedbackTag}>
            <b>{MOTIF_LABELS[motif] || motif}</b>
          </Tag>
        ))}
      </div>
      {organismeData.commentaires ? (
        <div className="fr-mb-2v fr-mt-4v">
          <b>Commentaires de l&apos;organisme de formation</b>
          <div className="fr-mb-2v fr-mt-4v">{organismeData.commentaires}</div>
        </div>
      ) : null}

      {showContacts && (
        <>
          <div className="fr-mt-4v">
            <DsfrLink
              href="#"
              arrow="none"
              onClick={(e) => {
                e.preventDefault();
                setContactsOpen((open) => !open);
              }}
              className={`fr-link--icon-right ${contactsOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"}`}
            >
              Contacts du CFA
            </DsfrLink>
          </div>

          {contactsOpen && (
            <div className="fr-mt-2v">
              {effectif?.organisme?.contacts_from_referentiel?.map((contact, idx) => (
                <p key={`ref-${idx}`} className="fr-mb-1v">
                  Email : {contact.email || "non renseigné"}
                </p>
              ))}
              {effectif?.contacts_tdb?.map(({ email, telephone, nom, prenom, fonction }, idx) => (
                <div key={`tdb-${idx}`} className="fr-mb-1v fr-mt-4v">
                  <p className="fr-mb-0">
                    <b>
                      {nom} {prenom} {fonction ? `(${fonction})` : ""}
                    </b>
                  </p>
                  {email && <p className="fr-mb-0">Email : {email}</p>}
                  {telephone && <p className="fr-mb-1v">Téléphone : {telephone}</p>}
                </div>
              ))}
              {!effectif?.organisme?.contacts_from_referentiel?.length && !effectif?.contacts_tdb?.length && (
                <p className="fr-text--sm" style={{ color: "#666", fontStyle: "italic" }}>
                  Aucun contact disponible
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
