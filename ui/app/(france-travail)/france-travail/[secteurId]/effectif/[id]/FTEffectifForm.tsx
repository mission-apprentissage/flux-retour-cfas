"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useState } from "react";

import { Spinner } from "@/app/_components/common/Spinner";
import { SITUATION_OPTIONS, parseLabelWithBold } from "@/app/_components/france-travail/constants";
import { FranceTravailSituation } from "@/app/_components/france-travail/types";

import styles from "./FTEffectifForm.module.css";

interface FTEffectifFormProps {
  initialSituation?: FranceTravailSituation | null;
  initialCommentaire?: string | null;
  onSubmit: (data: { situation: FranceTravailSituation; commentaire: string | null }, saveNext: boolean) => void;
  isSaving: boolean;
  hasSuccess: boolean;
  hasError: boolean;
  hasNext: boolean;
}

export function FTEffectifForm({
  initialSituation,
  initialCommentaire,
  onSubmit,
  isSaving,
  hasSuccess,
  hasError,
  hasNext,
}: FTEffectifFormProps) {
  const [selectedSituation, setSelectedSituation] = useState<FranceTravailSituation | null>(initialSituation || null);
  const [commentaire, setCommentaire] = useState(initialCommentaire || "");
  const [showValidation, setShowValidation] = useState(false);

  const isFormValid = selectedSituation !== null && commentaire.trim().length > 0;
  const isCommentaireInvalid = showValidation && selectedSituation !== null && commentaire.trim().length === 0;

  const handleSubmit = (saveNext: boolean) => {
    if (!selectedSituation) return;
    onSubmit({ situation: selectedSituation, commentaire: commentaire.trim() || null }, saveNext);
  };

  return (
    <>
      <div className={styles.formContainer}>
        <fieldset className="fr-fieldset">
          <legend className="fr-fieldset__legend fr-text--regular" id="radio-legend">
            Quel est votre retour sur la prise de contact ?
          </legend>
          <div className="fr-fieldset__content">
            {SITUATION_OPTIONS.map((option) => {
              const { prefix, bold, suffix } = parseLabelWithBold(option.label);
              return (
                <div key={option.value} className={styles.radioOption}>
                  <div className="fr-radio-group">
                    <input
                      type="radio"
                      id={`radio-${option.value}`}
                      name="situation"
                      value={option.value}
                      checked={selectedSituation === option.value}
                      onChange={() => setSelectedSituation(option.value)}
                    />
                    <label className="fr-label" htmlFor={`radio-${option.value}`}>
                      <span>
                        {prefix}
                        {bold && <strong>{bold}</strong>}
                        {suffix}
                      </span>
                      {option.hintText && <span className="fr-hint-text">{option.hintText}</span>}
                    </label>
                  </div>
                  {selectedSituation === option.value && (
                    <div className={styles.textareaWrapper}>
                      <Input
                        label="Détaillez (requis)"
                        textArea
                        state={isCommentaireInvalid ? "error" : "default"}
                        stateRelatedMessage={isCommentaireInvalid ? "Le commentaire est requis" : undefined}
                        nativeTextAreaProps={{
                          rows: 4,
                          value: commentaire,
                          onChange: (e) => {
                            setCommentaire(e.target.value);
                            if (showValidation && e.target.value.trim().length > 0) {
                              setShowValidation(false);
                            }
                          },
                          onBlur: () => setShowValidation(true),
                          required: true,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      </div>

      {hasError && <p className={styles.errorMessage}>Une erreur est survenue. Veuillez réessayer.</p>}

      <FormActions
        isFormValid={isFormValid}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        hasSuccess={hasSuccess}
        hasNext={hasNext}
      />
    </>
  );
}

function FormActions({
  isFormValid,
  onSubmit,
  isSaving,
  hasSuccess,
  hasNext,
}: {
  isFormValid: boolean;
  onSubmit: (saveNext: boolean) => void;
  isSaving: boolean;
  hasSuccess: boolean;
  hasNext: boolean;
}) {
  const [selectedButton, setSelectedButton] = useState<"saveAndQuit" | "saveAndNext" | null>(null);

  const handleClick = (type: "saveAndQuit" | "saveAndNext", saveNext: boolean) => {
    setSelectedButton(type);
    onSubmit(saveNext);
  };

  const disabled = !isFormValid || isSaving || hasSuccess;
  const disabledNext = disabled || !hasNext;
  return (
    <div className={styles.formActions}>
      <SaveButton
        type="saveAndNext"
        selectedButton={selectedButton}
        isSaving={isSaving}
        hasSuccess={hasSuccess}
        disabled={disabledNext}
        onClick={() => handleClick("saveAndNext", true)}
        priority="primary"
      >
        Valider et passer au suivant
      </SaveButton>
      <SaveButton
        type="saveAndQuit"
        selectedButton={selectedButton}
        isSaving={isSaving}
        hasSuccess={hasSuccess}
        disabled={disabled}
        onClick={() => handleClick("saveAndQuit", false)}
        priority="secondary"
      >
        Valider et quitter
      </SaveButton>
    </div>
  );
}

function SaveButton({
  type,
  selectedButton,
  isSaving,
  hasSuccess,
  disabled,
  onClick,
  priority,
  children,
}: {
  type: "saveAndQuit" | "saveAndNext";
  selectedButton: "saveAndQuit" | "saveAndNext" | null;
  isSaving: boolean;
  hasSuccess: boolean;
  disabled: boolean;
  onClick: () => void;
  priority: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const showLoader = selectedButton === type && (isSaving || hasSuccess);
  const buttonStyle = {
    width: "100%",
    justifyContent: "center",
    ...(hasSuccess && selectedButton === type ? { background: "var(--background-flat-success)", color: "#fff" } : {}),
  };

  return (
    <Button priority={priority} disabled={disabled} onClick={onClick} style={buttonStyle}>
      {showLoader ? renderButtonContent({ isSaving, hasSuccess, defaultLabel: children }) : children}
    </Button>
  );
}

function renderButtonContent({
  isSaving,
  hasSuccess,
  defaultLabel,
}: {
  isSaving: boolean;
  hasSuccess: boolean;
  defaultLabel: React.ReactNode;
}) {
  if (isSaving) {
    return (
      <>
        <Spinner size="1rem" color="currentColor" style={{ marginRight: "0.5rem" }} />
        En cours...
      </>
    );
  }
  if (hasSuccess) {
    return (
      <>
        <i className="fr-icon-check-line" style={{ marginRight: "0.5rem" }} />
        Enregistré
      </>
    );
  }
  return defaultLabel;
}
