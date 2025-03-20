"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import mime from "mime";
import { API_TRAITEMENT_TYPE } from "shared";

import { _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";

type MLHeaderProps = {
  onDownloadClick?: () => void;
};

export const MLHeader = ({ onDownloadClick }: MLHeaderProps) => {
  const handleDownload = async () => {
    if (onDownloadClick) {
      onDownloadClick();
      return;
    }

    // Default download handler
    const fileName = `Rupturants_TBA_${new Date().toISOString().split("T")[0]}.xlsx`;
    const { data } = await _getBlob(
      `/api/v1/organisation/mission-locale/export/effectifs?type=${API_TRAITEMENT_TYPE.A_TRAITER}`
    );
    downloadObject(data, fileName, mime.getType("xlsx") ?? "text/plain");
  };

  return (
    <>
      <Alert
        closable
        description="Nous vous mettons à disposition les contacts des jeunes et leur CFA : vous êtes encouragé à les contacter. Ne partagez pas ces listes."
        onClose={function noRefCheck() {}}
        severity="warning"
        title=""
        classes={{
          root: "fr-mb-3w",
        }}
      />

      <div className="fr-grid-row fr-grid-row--gutters fr-mb-1w fr-items-center">
        <div className="fr-col">
          <h1 className="fr-h1" style={{ color: "var(--text-title-blue-france)" }}>
            Liste des jeunes en ruptures de contrat
          </h1>
          <p className="fr-text--sm fr-text--bold fr-mb-1w">
            Nous affichons sur le TBA tous les jeunes ayant un statut de rupture, en les classant par date de rupture
            (du plus récent au plus ancien).
          </p>
          <p className="fr-text--xs">
            Sources : CFA et{" "}
            <a
              href="https://efpconnect.emploi.gouv.fr/auth/realms/efp/protocol/cas/login?TARGET=https%3A%2F%2Fdeca.alternance.emploi.gouv.fr%3A443%2Fdeca-app%2F"
              target="_blank"
              rel="noopener external"
            >
              DECA
            </a>
          </p>
        </div>
        <div
          className="fr-col-auto fr-text-align--right"
          style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
        >
          <Button iconId="ri-arrow-right-line" iconPosition="right" onClick={handleDownload}>
            Télécharger la liste
          </Button>
        </div>
      </div>
      <p className="fr-hr"></p>
    </>
  );
};
