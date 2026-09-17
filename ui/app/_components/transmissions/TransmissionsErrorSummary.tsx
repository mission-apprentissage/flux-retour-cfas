"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { FICHIER_AIDE_DECLARATION_OFA, REFERENTIEL_ONISEP } from "shared";

interface UaiSiretErrorEntry {
  uai: string;
  siret: string;
  effectifCount: number;
}

interface TransmissionsErrorSummaryProps {
  summary: {
    numberErrors?: { total: number };
    lieu?: UaiSiretErrorEntry[];
    formateur?: UaiSiretErrorEntry[];
    responsable?: UaiSiretErrorEntry[];
  };
  isLoading: boolean;
}

export function TransmissionsErrorSummary({ summary, isLoading }: TransmissionsErrorSummaryProps) {
  const hasUaiSiretErrors = Boolean(summary.lieu?.length || summary.formateur?.length || summary.responsable?.length);

  if (!summary.numberErrors || isLoading) {
    return null;
  }

  return (
    <Alert
      severity="error"
      title={`${summary.numberErrors?.total} erreurs ont été détectées.${hasUaiSiretErrors ? " Voici les erreurs les plus récurrentes." : ""}`}
      description={
        <>
          {hasUaiSiretErrors && <p className="fr-text--bold fr-mb-1w">Erreurs sur les couples UAI/SIRET</p>}
          <ul>
            {summary.lieu?.map(({ uai, siret, effectifCount }) => (
              <li key={`lieu${uai}${siret}`}>
                <b>
                  Couple UAI {uai} / SIRET {siret} du lieu de formation
                </b>{" "}
                n&apos;est pas reconnu : {effectifCount} effectifs en erreur
              </li>
            ))}
            {summary.formateur?.map(({ uai, siret, effectifCount }) => (
              <li key={`formateur${uai}${siret}`}>
                <b>
                  Couple UAI {uai} / SIRET {siret} du site formateur
                </b>{" "}
                n&apos;est pas reconnu : {effectifCount} effectifs en erreur
              </li>
            ))}
            {summary.responsable?.map(({ uai, siret, effectifCount }) => (
              <li key={`responsable${uai}${siret}`}>
                <b>
                  Couple UAI {uai} / SIRET {siret} du site responsable
                </b>{" "}
                n&apos;est pas reconnu : {effectifCount} effectifs en erreur
              </li>
            ))}
          </ul>
          {hasUaiSiretErrors && (
            <>
              <p>
                Cette erreur signifie que vous envoyez des effectifs vers un organisme (UAI-SIRET) qui n’existe pas sur
                le Tableau de bord de l’apprentissage.
              </p>
              <p>
                Vérifiez l’UAI-SIRET de votre organisme sur le{" "}
                <a href={REFERENTIEL_ONISEP} target="_blank" rel="noopener noreferrer" className="fr-link">
                  Référentiel UAI-SIRET des OFA-CFA
                </a>{" "}
                et corrigez-les dans votre ERP.
              </p>
              <p>
                Si vous ne trouvez pas votre organisme sur le Référentiel UAI-SIRET, c’est qu’il n’est pas déclaré OFA.
                Si c’est le cas vous devez obligatoirement le déclarer,{" "}
                <a href={FICHIER_AIDE_DECLARATION_OFA} target="_blank" rel="noopener noreferrer" className="fr-link">
                  consultez cette procédure.
                </a>
              </p>
            </>
          )}
        </>
      }
    />
  );
}
