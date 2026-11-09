"use client";

import { CATALOGUE_CHAMPS_TELEVERSEMENT, CHAMPS_TELEVERSEMENT_PAR_CLE, GroupeChampTeleversement } from "shared";

import { MODEL_EXPORT_LAST_UPDATE } from "@/common/utils/exportUtils";

import styles from "./televersement.module.scss";

const GROUPES_OBLIGATOIRES: GroupeChampTeleversement[] = ["Apprenant", "Formation", "Établissements"];

const obligatoiresDuGroupe = (groupe: GroupeChampTeleversement) =>
  CATALOGUE_CHAMPS_TELEVERSEMENT.filter((champ) => champ.groupe === groupe && champ.obligation === "obligatoire");

const minusculeInitiale = (texte: string) => texte.charAt(0).toLowerCase() + texte.slice(1);

const pairesUnDesDeux = CATALOGUE_CHAMPS_TELEVERSEMENT.flatMap((champ, index) => {
  const autre = champ.obligation === "un_des_deux" && champ.avec ? CHAMPS_TELEVERSEMENT_PAR_CLE[champ.avec] : null;
  if (!autre || CATALOGUE_CHAMPS_TELEVERSEMENT.indexOf(autre) < index) {
    return [];
  }
  return [`${champ.libelle} ou ${minusculeInitiale(autre.libelle)}`];
});

export function InfoTeleversement() {
  return (
    <>
      <a
        href={`/modele-import-${MODEL_EXPORT_LAST_UPDATE}.xlsx`}
        target="_blank"
        rel="noopener noreferrer"
        className="fr-link"
      >
        <i className="fr-icon-download-line fr-icon--sm" aria-hidden="true" /> Télécharger le modèle Excel
      </a>
      <div className={styles.orangeNote}>
        <p>Vous pouvez directement remplir le fichier-modèle avec vos effectifs. </p>
        <p>Veuillez ne pas modifier l’intitulé des colonnes. </p>
      </div>
      <p className="fr-text--bold fr-mt-3w">Obligatoires pour chaque apprenant :</p>
      <div className={styles.obligatoiresGrid}>
        {GROUPES_OBLIGATOIRES.map((groupe) => (
          <div key={groupe}>
            <p className="fr-text--bold fr-mt-3w">{groupe}</p>
            <ul>
              {obligatoiresDuGroupe(groupe).map((champ) => (
                <li key={champ.cle}>{champ.libelle}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="fr-text--bold fr-mt-3w">Obligatoires, l’un ou l’autre :</p>
      <ul>
        {pairesUnDesDeux.map((paire) => (
          <li key={paire}>{paire}</li>
        ))}
      </ul>
      <p className="fr-text--bold fr-mt-3w">Selon le cas :</p>
      <ul>
        <li>
          La date de début de chaque contrat, dès que sa fin, sa rupture ou sa cause de rupture est renseignée. Sans
          elle, le statut de l’apprenant sera faux.
        </li>
        <li>Gardez la colonne de date de début du contrat, même vide pour les jeunes sans contrat.</li>
      </ul>
    </>
  );
}
