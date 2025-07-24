"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IEffecifMissionLocale,
  IEffectifOrganismeFormation,
  IUpdateMissionLocaleEffectif,
  IUpdateOrganismeFormationEffectif,
  SITUATION_ENUM,
  API_EFFECTIF_LISTE,
  IMissionLocaleEffectifList,
} from "shared";

import { CfaFeedbackForm } from "../cfa/FeedbackForm";

import { EffectifInfo } from "./effectifs/EffectifInfo";
import { FeedbackForm } from "./effectifs/FeedbackForm";
import { PageHeader } from "./effectifs/PageHeader";

function validateCfaForm(cfaFormData: IUpdateOrganismeFormationEffectif): boolean {
  if (typeof cfaFormData.rupture !== "boolean") {
    return false;
  }

  if (cfaFormData.rupture === false) {
    return true;
  }

  if (cfaFormData.rupture === true) {
    if (typeof cfaFormData.acc_conjoint !== "boolean") {
      return false;
    }

    if (cfaFormData.acc_conjoint === false) {
      return true;
    }

    if (cfaFormData.acc_conjoint === true) {
      return Array.isArray(cfaFormData.motif) && cfaFormData.motif.length > 0;
    }
  }

  return false;
}

interface EffectifDetailDisplayProps {
  effectifPayload: IEffecifMissionLocale | IEffectifOrganismeFormation;
  nomListe: IMissionLocaleEffectifList;
  saveStatus: "idle" | "loading" | "success" | "error";
  onSave: (goNext: boolean, formData: IUpdateMissionLocaleEffectif | IUpdateOrganismeFormationEffectif) => void;
  isAdmin?: boolean;
}

export function EffectifDetailDisplay({
  effectifPayload,
  nomListe,
  saveStatus,
  onSave,
  isAdmin = false,
}: EffectifDetailDisplayProps) {
  const { effectif, total, next, previous, currentIndex } = effectifPayload || {};
  const { a_traiter, injoignable } = effectif || {};
  const [isEditable, setIsEditable] = useState(false);

  const pathname = usePathname();
  const isCfaPage = pathname?.startsWith("/cfa/");

  const [formData, setFormData] = useState<IUpdateMissionLocaleEffectif>({
    situation: "" as unknown as SITUATION_ENUM,
    situation_autre: "",
    commentaires: "",
    deja_connu: null,
  });

  const [cfaFormData, setCfaFormData] = useState<IUpdateOrganismeFormationEffectif>({
    rupture: null,
    acc_conjoint: null,
    motif: null,
    commentaires: null,
  });

  useEffect(() => {
    if (effectif) {
      if (!isCfaPage && "situation" in effectif) {
        setFormData({
          situation: effectif.situation?.situation || ("" as unknown as SITUATION_ENUM),
          situation_autre: effectif.situation?.situation_autre || "",
          commentaires: effectif.situation?.commentaires || "",
          deja_connu: typeof effectif.situation?.deja_connu === "boolean" ? effectif.situation.deja_connu : null,
        });
      }

      if (isCfaPage) {
        if ("organisme_data" in effectif) {
          setCfaFormData({
            rupture: effectif.organisme_data?.rupture ?? null,
            acc_conjoint: effectif.organisme_data?.acc_conjoint ?? null,
            motif: effectif.organisme_data?.motif ?? null,
            commentaires: effectif.organisme_data?.commentaires ?? null,
          });
        } else {
          setCfaFormData({
            rupture: null,
            acc_conjoint: null,
            motif: null,
            commentaires: null,
          });
        }
      }
    }
  }, [effectif, isCfaPage]);

  if (!effectif) {
    return <p style={{ marginTop: "1rem" }}>Aucune donnée à afficher.</p>;
  }

  const isFormValid =
    formData.situation !== ("" as unknown as SITUATION_ENUM) &&
    (formData.situation !== SITUATION_ENUM.AUTRE || (formData.situation_autre?.trim() || "") !== "") &&
    formData.deja_connu !== null;

  const isCfaFormValid = validateCfaForm(cfaFormData);

  const isSaving = saveStatus === "loading";
  const hasError = saveStatus === "error";
  const hasSuccess = saveStatus === "success";

  return (
    <>
      <PageHeader
        previous={previous || undefined}
        next={next || undefined}
        total={total}
        currentIndex={currentIndex}
        isLoading={!effectifPayload}
        isATraiter={a_traiter}
      />

      <EffectifInfo effectif={effectif} nomListe={nomListe} isAdmin={isAdmin} setIsEditable={setIsEditable} />

      {(a_traiter || injoignable || isEditable) && !isCfaPage && (
        <FeedbackForm
          formData={formData}
          setFormData={setFormData}
          isFormValid={isFormValid}
          onSave={(goNext) => onSave(goNext, formData)}
          isSaving={isSaving}
          isInjoignable={nomListe === API_EFFECTIF_LISTE.INJOIGNABLE}
          hasSuccess={hasSuccess}
          hasError={hasError}
          isAdmin={isAdmin}
        />
      )}

      {(a_traiter || injoignable || isEditable) && isCfaPage && (
        <CfaFeedbackForm
          formData={cfaFormData}
          setFormData={setCfaFormData}
          isFormValid={isCfaFormValid}
          onSave={(goNext) => onSave(goNext, cfaFormData)}
          isSaving={isSaving}
          hasSuccess={hasSuccess}
          hasError={hasError}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}
