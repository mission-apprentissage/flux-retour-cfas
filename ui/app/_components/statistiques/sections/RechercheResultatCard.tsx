"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useSearchParams } from "next/navigation";
import { Fragment } from "react";
import type { IRechercheResultat } from "shared/models/data/nationalStats.model";

import { ficheCfaUrl, formatDerniereActivite } from "../utils";

import styles from "./RechercheResultatCard.module.css";

const ouiNon = (value: boolean) => (value ? "Oui" : "Non");

export function RechercheResultatCard({ resultat }: { resultat: IRechercheResultat }) {
  const searchParams = useSearchParams();
  const isCfa = resultat.type === "cfa";
  const ville = [resultat.adresse.code_postal, resultat.adresse.commune].filter(Boolean).join(" ");
  const voie =
    resultat.adresse.complete && ville
      ? resultat.adresse.complete.replace(ville, "").trim()
      : resultat.adresse.complete;

  const indicateurs: Array<[string, string | number]> =
    resultat.type === "cfa"
      ? [
          ["Invitations ML reçues", resultat.invitations_recues],
          ["A un compte TBA", ouiNon(resultat.compte_tba)],
          ["Total collaborations envoyées", resultat.collaborations_envoyees],
          ["Dernière activité", formatDerniereActivite(resultat.derniere_activite)],
        ]
      : [
          ["A un compte TBA", ouiNon(resultat.compte_tba)],
          ["Dossiers ruptures à traiter", resultat.ruptures.a_traiter],
          ["Dossiers ruptures traités", resultat.ruptures.traites],
          ["Dossiers collaborations reçus", resultat.collaborations.recues],
          ["Dossiers collaborations traités", resultat.collaborations.traitees],
          ["Dernière activité", formatDerniereActivite(resultat.derniere_activite)],
        ];

  return (
    <li className={styles.card}>
      <span
        className={`${isCfa ? "ri-school-line" : "fr-icon-map-pin-user-line"} fr-icon--lg ${styles.picto}`}
        aria-hidden="true"
      />
      <div className={styles.identite}>
        <Badge as="span" small noIcon className={isCfa ? "fr-badge--yellow-tournesol" : "fr-badge--purple-glycine"}>
          {isCfa ? "CFA" : "Mission Locale"}
        </Badge>
        <p className={styles.nom}>{resultat.nom ?? "Nom inconnu"}</p>
        <p className={styles.adresse}>
          {voie && `${voie.toUpperCase()} `}
          {ville && <strong>{ville}</strong>}
        </p>
        {resultat.type === "cfa" && (
          <p className={styles.codes}>
            UAI {resultat.uai ?? "—"} SIRET {resultat.siret}
          </p>
        )}
      </div>
      <dl className={styles.indicateurs}>
        {indicateurs.map(([label, valeur]) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{valeur}</dd>
          </Fragment>
        ))}
      </dl>
      <div className={styles.action}>
        {isCfa ? (
          <Button
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
            linkProps={{ href: ficheCfaUrl(resultat.id, { from: "recherche", q: searchParams?.get("q") }) }}
          >
            Détails
          </Button>
        ) : (
          <Button
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
            linkProps={{ href: buildFicheMlUrl(resultat.id, searchParams?.toString()) }}
          >
            Détails
          </Button>
        )}
      </div>
    </li>
  );
}

const buildFicheMlUrl = (mlId: string, rechercheParams = "") => {
  const params = new URLSearchParams(rechercheParams);
  params.set("from", "recherche");
  return `/suivi-des-indicateurs/mission-locale/${mlId}?${params.toString()}`;
};
