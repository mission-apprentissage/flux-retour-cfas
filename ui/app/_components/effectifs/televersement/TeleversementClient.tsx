"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TD_MANUEL_ELEMENT_LINK } from "shared";

import { _post } from "@/common/httpClient";
import { toEffectifsQueue } from "@/common/utils/televersement";
import useExcelFileProcessor from "@/hooks/useExcelFileProcessor";

import { DocumentsActionButtons } from "./DocumentsActionButtons";
import { FileUpload } from "./FileUpload";
import { InfoBetaPanel } from "./InfoBetaPanel";
import styles from "./televersement.module.scss";
import { TeleversementTable } from "./TeleversementTable";
import { TeleversementValide } from "./TeleversementValide";

const reuploadModal = createModal({
  id: "televersement-nouveau-fichier",
  isOpenedByDefault: false,
});

export default function TeleversementClient({ organismeId, isMine }: { organismeId: string; isMine: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    processedData,
    headers,
    error,
    errorsCount,
    warnings,
    missingHeaders,
    columnsWithErrors,
    showOnlyColumnsAndLinesWithErrors,
    setShowOnlyColumnsAndLinesWithErrors,
    status,
    setStatus,
  } = useExcelFileProcessor(organismeId);

  const handleSubmit = async () => {
    if (errorsCount > 0 || error) {
      setSubmitError("Please fix the errors before submitting.");
      setIsSubmitting(false);
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    const res = await _post(`/api/v1/organismes/${organismeId}/upload/import/v3`, toEffectifsQueue(processedData));
    setStatus(res.error ? "import_failure" : "import_success");
    setIsSubmitting(false);
  };

  if (status === "import_success") return <TeleversementValide isMine={isMine} organismeId={organismeId} />;

  const filteredHeaders =
    showOnlyColumnsAndLinesWithErrors && columnsWithErrors.length
      ? headers?.filter((header) => columnsWithErrors.includes(header))
      : headers;

  return (
    <div>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>
          Import des effectifs{" "}
          <span className={styles.betaBadge}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="/images/eclair.svg" /> version beta
          </span>
        </h1>
        <a href={TD_MANUEL_ELEMENT_LINK} target="_blank" rel="noopener noreferrer" className="fr-link">
          <i className="fr-icon-question-line fr-icon--sm" aria-hidden="true" /> Aide
        </a>
      </div>

      {status === "idle" && (
        <div className={styles.introPanel}>
          <ul>
            <li>
              Déclarez tous vos apprenants <strong>en apprentissage</strong>, y compris les apprentis en contrat, ceux
              dont le contrat a été rompu, les jeunes sans contrat et les cas d&apos;abandon éventuels.
            </li>
            <li>
              Afin de garantir la fraîcheur des données et de permettre un soutien constant de vos apprenants, nous vous
              recommandons de nous transmettre les effectifs <strong>une fois par mois</strong>, de préférence entre le
              1er et le 5 de chaque mois.
            </li>
          </ul>
          <DocumentsActionButtons />
          <InfoBetaPanel />
        </div>
      )}

      {error && <Alert key={error} severity="error" title={error} description="" small closable className="fr-my-3w" />}
      {submitError && <Alert severity="error" title={submitError} description="" small closable className="fr-my-3w" />}

      {status === "validation_success" && (
        <Alert
          severity="success"
          title="Le format de votre fichier a été correctement rempli."
          description={
            <>
              Vous pouvez relire le détail ligne à ligne ci-dessous (et défiler sur la droite). Si vous êtes satisfait,
              vous pouvez valider l’import en cliquant sur le bouton dédié en bas de cette page.{" "}
              <b>Votre fichier n’a pas encore été importé.</b>
            </>
          }
          className="fr-my-3w"
        />
      )}
      {status === "validation_failure" && (
        <Alert
          severity="error"
          title={
            errorsCount === 1
              ? "Une erreur a été détectée dans votre fichier"
              : `${errorsCount} erreurs ont été détectées dans votre fichier.`
          }
          description={
            <>
              <p>
                Vous pouvez voir le détail ligne à ligne ci-dessous. Vous devez modifier votre fichier et
                l&apos;importer à nouveau.
              </p>
              {missingHeaders.length > 0 && (
                <>
                  <p>
                    Les colonnes suivantes sont obligatoires et n’ont pas été trouvées, veuillez vérifier leur présence
                    dans le fichier&nbsp;:
                  </p>
                  <ul>
                    {missingHeaders.map((header) => (
                      <li key={header} className={styles.cellError}>
                        {header}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          }
          className="fr-my-3w"
        />
      )}
      {!!warnings.contratCount && (
        <Alert
          severity="warning"
          title={`${warnings.contratCount}${
            warnings.contratCount === 1
              ? " apprenant n'a aucune date de début et de fin de contrat renseignée."
              : " apprenants n'ont aucune date de début et de fin de contrat renseignée."
          }`}
          description="Nous nous basons sur les dates de contrat, de rupture, de formation et d'exclusion pour déterminer le statut d'un effectif. N'oubliez pas de remplir les dates de contrat quand il y en a un, sans quoi les apprentis passent automatiquement en statut « abandon » 3 mois après leur date d'inscription ou 6 mois après leur date de rupture."
          className="fr-mb-3w"
        />
      )}

      {status === "validation_failure" && (
        <div className={styles.reuploadBar}>
          <ToggleSwitch
            label="Afficher uniquement les lignes et colonnes avec données en erreur"
            checked={showOnlyColumnsAndLinesWithErrors}
            onChange={(checked) => setShowOnlyColumnsAndLinesWithErrors(checked)}
          />
          <Button iconId="fr-icon-upload-2-line" onClick={() => reuploadModal.open()} disabled={isSubmitting}>
            Téléverser un nouveau fichier
          </Button>
        </div>
      )}

      {status === "validation_success" && (
        <div className={styles.submitRow}>
          <Button
            onClick={() => {
              if (errorsCount === 0 && !error) {
                handleSubmit();
              }
            }}
            disabled={isSubmitting}
          >
            Valider l&apos;import
          </Button>
        </div>
      )}

      <div className="fr-mt-3w">
        {processedData && processedData.length > 0 && filteredHeaders && (
          <TeleversementTable
            data={processedData}
            headers={headers}
            columnsWithErrors={columnsWithErrors}
            showOnlyColumnsAndLinesWithErrors={showOnlyColumnsAndLinesWithErrors}
          />
        )}
      </div>

      {status === "idle" && (
        <>
          <FileUpload
            isSubmitting={isSubmitting}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
          />
          <button type="button" className="fr-link" onClick={() => router.back()}>
            <i className="fr-icon-arrow-left-line fr-icon--sm" aria-hidden="true" /> Retour à l’étape précédente
          </button>
        </>
      )}

      {status === "validation_failure" && (
        <reuploadModal.Component title="Téléverser un nouveau fichier" size="large">
          <FileUpload
            isSubmitting={isSubmitting}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
          />
          <DocumentsActionButtons />
        </reuploadModal.Component>
      )}
    </div>
  );
}
