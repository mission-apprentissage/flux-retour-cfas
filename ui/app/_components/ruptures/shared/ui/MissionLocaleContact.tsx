"use client";

import { useState } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

import styles from "./EffectifInfoDetails.module.css";

interface MissionLocaleContactProps {
  missionLocaleOrganisation: {
    _id: string;
    nom: string;
    telephone?: string;
    email?: string;
    activated_at?: Date;
  };
}

export function MissionLocaleContact({ missionLocaleOrganisation }: MissionLocaleContactProps) {
  const [contactsOpen, setContactsOpen] = useState(false);

  return (
    <div>
      <p>Dépend de la Mission Locale {missionLocaleOrganisation?.nom}</p>
      <DsfrLink
        href="#"
        arrow="none"
        onClick={(e) => {
          e.preventDefault();
          setContactsOpen((open) => !open);
        }}
        className={`fr-link--icon-right ${contactsOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"}`}
      >
        Contacts de la Mission Locale
      </DsfrLink>

      {contactsOpen && (
        <div className={styles.detailsSection}>
          <div>
            {missionLocaleOrganisation?.telephone && <p>{missionLocaleOrganisation.telephone}</p>}
            {missionLocaleOrganisation?.email && (
              <p>
                <b>{missionLocaleOrganisation.email}</b>
              </p>
            )}
            {!missionLocaleOrganisation?.activated_at && (
              <p
                style={{
                  color: "var(--text-mention-grey)",
                  fontSize: "14px",
                  marginTop: "1rem",
                  lineHeight: "1.4",
                }}
              >
                <b>
                  <i>
                    L&apos;outil est en cours de déploiement. Certaines Missions Locales le prennent progressivement en
                    main, ce qui peut entraîner un léger délai dans le traitement de votre dossier.
                  </i>
                </b>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
