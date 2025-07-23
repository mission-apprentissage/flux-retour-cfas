"use client";

import { useEffect, useState } from "react";
import {
  IEffecifMissionLocale,
  IUpdateMissionLocaleEffectif,
  SITUATION_ENUM,
  API_EFFECTIF_LISTE,
  IMissionLocaleEffectifList,
} from "shared";

import { EffectifInfo } from "./effectifs/EffectifInfo";
import { FeedbackForm } from "./effectifs/FeedbackForm";
import { PageHeader } from "./effectifs/PageHeader";

interface MissionLocaleEffectifDisplayProps {
  effectifPayload: IEffecifMissionLocale;
  nomListe: IMissionLocaleEffectifList;
  saveStatus: "idle" | "loading" | "success" | "error";
  onSave: (goNext: boolean, formData: IUpdateMissionLocaleEffectif) => void;
  isAdmin?: boolean;
}

export function MissionLocaleEffectifDisplay({
  effectifPayload,
  nomListe,
  saveStatus,
  onSave,
  isAdmin = false,
}: MissionLocaleEffectifDisplayProps) {
  const { effectif, total, next, previous, currentIndex } = effectifPayload || {};
  const { a_traiter, injoignable } = effectif || {};
  const [isEditable, setIsEditable] = useState(false);

  const [formData, setFormData] = useState<IUpdateMissionLocaleEffectif>({
    situation: "" as unknown as SITUATION_ENUM,
    situation_autre: "",
    commentaires: "",
    deja_connu: null,
  });

  useEffect(() => {
    if (effectif) {
      setFormData({
        situation: effectif.situation?.situation || ("" as unknown as SITUATION_ENUM),
        situation_autre: effectif.situation?.situation_autre || "",
        commentaires: effectif.situation?.commentaires || "",
        deja_connu: typeof effectif.situation?.deja_connu === "boolean" ? effectif.situation.deja_connu : null,
      });
    }
  }, [effectif]);

  if (!effectif) {
    return <p style={{ marginTop: "1rem" }}>Aucune donnée à afficher.</p>;
  }

  const isFormValid =
    formData.situation !== ("" as unknown as SITUATION_ENUM) &&
    (formData.situation !== SITUATION_ENUM.AUTRE || (formData.situation_autre?.trim() || "") !== "") &&
    formData.deja_connu !== null;

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

      {(a_traiter || injoignable || isEditable) && (
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
    </>
  );
}
