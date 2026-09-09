"use client";

import { MODEL_EXPORT_LAST_UPDATE } from "@/common/utils/exportUtils";

import styles from "./televersement.module.scss";

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
      <p className="fr-text--bold fr-mt-3w">20 champs sont obligatoires pour chaque effectif :</p>
      <div className={styles.obligatoiresGrid}>
        <div>
          <p className="fr-text--bold fr-mt-3w">7 champs concernant l’apprenant :</p>
          <ul>
            <li>Nom de l’apprenant</li>
            <li>Prénom de l’apprenant</li>
            <li>Date de naissance de l’apprenant</li>
            <li>Sexe de l’apprenant</li>
            <li>Email de l’apprenant</li>
            <li>Adresse de résidence de l’apprenant</li>
            <li>Code postal de résidence de l’apprenant</li>
          </ul>
        </div>
        <div>
          <p className="fr-text--bold fr-mt-3w">6 champs concernant l’organisme de formation:</p>
          <ul>
            <li>N° UAI de l’établissement responsable</li>
            <li>SIRET de l’établissement responsable</li>
            <li>N° UAI de l’établissement formateur</li>
            <li>SIRET de l’établissement formateur</li>
            <li>N° UAI du lieu de formation</li>
            <li>SIRET du lieu de formation</li>
          </ul>
        </div>
        <div>
          <p className="fr-text--bold fr-mt-3w">7 champs concernant la formation suivie:</p>
          <ul>
            <li> Année scolaire</li>
            <li>Année de formation concernée</li>
            <li>Code RNCP de la formation</li>
            <li>Date d’inscription en formation</li>
            <li> Date d’entrée en formation</li>
            <li>Date de fin de formation </li>
            <li>Durée théorique de la formation</li>
          </ul>
        </div>
      </div>
      <p className="fr-text--bold fr-mt-3w">
        5 champs sont obligatoires seulement dans le cas où ils sont pertinents car ils dépendent du parcours de
        l’effectif (si l’on a un contrat, il faut mettre la date de contrat, par exemple). Sans eux, le statut de
        l’effectif sera erroné.
      </p>
      <div className={styles.obligatoiresGridTwo}>
        <div>
          <p className="fr-text--bold fr-mt-3w">7 champs concernant l’apprenant :</p>
          <ul>
            <li>Date rupture de formation (si pertinent)</li>
            <li>Date de début du ou des contrats (si pertinent)</li>
            <li>Date de fin du ou des contrats (si pertinent)</li>
            <li>SIRET du ou des employeurs (si pertinent)</li>
            <li>Date de rupture du ou des contrats (si pertinent)</li>
          </ul>
        </div>
      </div>
    </>
  );
}
