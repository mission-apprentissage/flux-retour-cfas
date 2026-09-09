"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";

import styles from "./televersement.module.scss";

export function FileUpload({
  isSubmitting,
  getRootProps,
  getInputProps,
  isDragActive,
}: {
  isSubmitting: boolean;
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
}) {
  return (
    <>
      <p className="fr-text--bold fr-text--lg">Sélectionner un document à importer</p>
      <div className="fr-mt-1w">
        <p className="fr-mb-0">Sélectionner un fichier contenant vos effectifs à importer (maximum 2000).</p>
        <p>Si vous utilisez plusieurs fichiers, merci d’importer vos documents un par un.</p>
      </div>
      <div {...getRootProps({ className: `${styles.uploadZone} ${isDragActive ? styles.uploadZoneActive : ""}` })}>
        {isSubmitting ? (
          <div className={styles.uploadSpinner}>
            <p>Veuillez patienter quelques secondes</p>
          </div>
        ) : (
          <>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Glissez et déposez ici ...</p>
            ) : (
              <>
                <i className="fr-icon-upload-2-line fr-icon--lg" aria-hidden="true" />
                <p className="fr-mb-0">Glissez le fichier dans cette zone ou cliquez sur le bouton</p>
                <p>pour ajouter un document Excel (xlsx) depuis votre disque dur</p>
                <Button priority="secondary" className="fr-mt-2w">
                  Ajouter un document
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
