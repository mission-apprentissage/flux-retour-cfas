"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useState } from "react";
import { IUpdateOrganismeFormationEffectif, ACC_CONJOINT_MOTIF_ENUM } from "shared";

import { Spinner } from "@/app/_components/common/Spinner";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import styles from "./FeedbackForm.module.css";

const MOTIF_LABELS = {
  MOBILITE: "Mobilité",
  LOGEMENT: "Logement",
  SANTE: "Santé",
  FINANCE: "Finance",
  ADMINISTRATIF: "Administratif",
  REORIENTATION: "(Re)orientation scolaire et professionnelle",
  RECHERCHE_EMPLOI: "Recherche d'emploi",
  AUTRE: "Autre",
} as const;

interface CfaFeedbackFormProps {
  formData: IUpdateOrganismeFormationEffectif;
  setFormData: (data: IUpdateOrganismeFormationEffectif) => void;
  isFormValid: boolean;
  onSave: (saveNext: boolean) => void;
  isSaving: boolean;
  hasSuccess: boolean;
  hasError: boolean;
  isAdmin?: boolean;
  hasNext?: boolean;
}

export function CfaFeedbackForm({
  formData,
  setFormData,
  isFormValid,
  onSave,
  isSaving,
  hasSuccess,
  hasError,
  isAdmin,
  hasNext,
}: CfaFeedbackFormProps) {
  const [didChangeRupture, setDidChangeRupture] = useState(false);

  const handleRuptureChange = (rupture: boolean) => {
    setFormData({
      rupture,
    });
    setDidChangeRupture(true);
  };

  const handleAccConjointChange = (acc_conjoint: boolean) => {
    setFormData({
      ...formData,
      acc_conjoint,
    });
  };

  const handleMotifChange = (motifKey: ACC_CONJOINT_MOTIF_ENUM, checked: boolean) => {
    const currentMotifs = formData.motif || [];
    const newMotifs = checked ? [...currentMotifs, motifKey] : currentMotifs.filter((m) => m !== motifKey);

    setFormData({
      ...formData,
      motif: newMotifs,
    });
  };

  const handleCommentChange = (commentaires: string) => {
    setFormData({
      ...formData,
      commentaires,
    });
  };

  return (
    <>
      <div className={styles.container}>
        <RuptureSection formData={formData} onRuptureChange={handleRuptureChange} />

        {formData.rupture === true && (
          <AccompagnementSection
            formData={formData}
            onAccConjointChange={handleAccConjointChange}
            onMotifChange={handleMotifChange}
            onCommentChange={handleCommentChange}
          />
        )}
      </div>

      {hasError && <p className={styles.error}>Une erreur est survenue. Veuillez réessayer.</p>}

      <FormActions
        isFormValid={isFormValid}
        onSave={onSave}
        isSaving={isSaving}
        hasSuccess={hasSuccess}
        didChangeRupture={didChangeRupture}
        isAdmin={isAdmin}
        hasNext={hasNext}
      />
    </>
  );
}

interface RuptureSectionProps {
  formData: IUpdateOrganismeFormationEffectif;
  onRuptureChange: (rupture: boolean) => void;
}

function RuptureSection({ formData, onRuptureChange }: RuptureSectionProps) {
  return (
    <RadioButtons
      legend="Ce jeune est-il toujours en rupture de contrat d'apprentissage ?"
      orientation="horizontal"
      options={[
        {
          label: "Oui",
          nativeInputProps: {
            value: "true",
            checked: formData.rupture === true,
            onChange: () => onRuptureChange(true),
          },
        },
        {
          label: "Non",
          nativeInputProps: {
            value: "false",
            checked: formData.rupture === false,
            onChange: () => onRuptureChange(false),
          },
        },
      ]}
    />
  );
}

interface AccompagnementSectionProps {
  formData: IUpdateOrganismeFormationEffectif;
  onAccConjointChange: (acc_conjoint: boolean) => void;
  onMotifChange: (motifKey: ACC_CONJOINT_MOTIF_ENUM, checked: boolean) => void;
  onCommentChange: (commentaires: string) => void;
}

function AccompagnementSection({
  formData,
  onAccConjointChange,
  onMotifChange,
  onCommentChange,
}: AccompagnementSectionProps) {
  return (
    <>
      <RadioButtons
        legend="Souhaitez-vous démarrer un accompagnement conjoint avec la Mission Locale ?"
        orientation="horizontal"
        options={[
          {
            label: "Oui",
            nativeInputProps: {
              value: "oui",
              checked: formData.acc_conjoint === true,
              onChange: () => onAccConjointChange(true),
            },
          },
          {
            label: "Non",
            nativeInputProps: {
              value: "non",
              checked: formData.acc_conjoint === false,
              onChange: () => onAccConjointChange(false),
            },
          },
        ]}
        style={{ marginTop: fr.spacing("4w") }}
      />

      {formData.acc_conjoint === true && (
        <ProblematiquesSection formData={formData} onMotifChange={onMotifChange} onCommentChange={onCommentChange} />
      )}
    </>
  );
}

interface ProblematiquesSection {
  formData: IUpdateOrganismeFormationEffectif;
  onMotifChange: (motifKey: ACC_CONJOINT_MOTIF_ENUM, checked: boolean) => void;
  onCommentChange: (commentaires: string) => void;
}

function ProblematiquesSection({ formData, onMotifChange, onCommentChange }: ProblematiquesSection) {
  const motifOptions = Object.entries(MOTIF_LABELS).map(([key, label]) => ({
    label,
    nativeInputProps: {
      checked: formData.motif?.includes(key as ACC_CONJOINT_MOTIF_ENUM) || false,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        onMotifChange(key as ACC_CONJOINT_MOTIF_ENUM, e.target.checked),
    },
  }));

  return (
    <div className={styles.section}>
      <Checkbox legend="Pour quelle(s) problématique(s) ?" options={motifOptions} />

      <div className={styles.commentSection}>
        <Input
          label="Avez-vous des commentaires ? (optionnel)"
          hintText="Ce commentaire sera visible par la Mission Locale"
          textArea
          nativeTextAreaProps={{
            value: formData.commentaires || "",
            onChange: (e) => onCommentChange(e.target.value),
            placeholder: "Votre commentaire...",
            rows: 4,
          }}
        />
      </div>
    </div>
  );
}

interface FormActionsProps {
  isFormValid: boolean;
  onSave: (saveNext: boolean) => void;
  isSaving: boolean;
  hasSuccess: boolean;
  didChangeRupture: boolean;
  isAdmin?: boolean;
  hasNext?: boolean;
}

function FormActions({
  isFormValid,
  onSave,
  isSaving,
  hasSuccess,
  didChangeRupture,
  isAdmin,
  hasNext,
}: FormActionsProps) {
  const [selectedButton, setSelectedButton] = useState<"saveAndQuit" | "saveAndNext" | null>(null);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const handleClick = (type: "saveAndQuit" | "saveAndNext", saveNext: boolean) => {
    setSelectedButton(type);
    trackPlausibleEvent("reporting_cfa_effectif");
    onSave(saveNext);
  };

  const disabled = !isFormValid || isSaving || hasSuccess || !didChangeRupture;

  return (
    <div className={styles.actions}>
      <SaveButton
        type="saveAndQuit"
        selectedButton={selectedButton}
        isSaving={isSaving}
        hasSuccess={hasSuccess}
        disabled={disabled}
        onClick={() => handleClick("saveAndQuit", false)}
      >
        Valider et quitter
      </SaveButton>
      {!isAdmin && (
        <SaveButton
          type="saveAndNext"
          selectedButton={selectedButton}
          isSaving={isSaving}
          hasSuccess={hasSuccess}
          disabled={disabled || !hasNext}
          onClick={() => handleClick("saveAndNext", true)}
        >
          Valider et passer au suivant
        </SaveButton>
      )}
    </div>
  );
}

interface SaveButtonProps {
  type: "saveAndQuit" | "saveAndNext";
  selectedButton: "saveAndQuit" | "saveAndNext" | null;
  isSaving: boolean;
  hasSuccess: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SaveButton({ type, selectedButton, isSaving, hasSuccess, disabled, onClick, children }: SaveButtonProps) {
  const showLoader = selectedButton === type && (isSaving || hasSuccess);
  const priority = type === "saveAndQuit" ? "secondary" : "primary";
  const buttonStyle =
    hasSuccess && selectedButton === type ? { background: "var(--background-flat-success)", color: "#fff" } : undefined;

  return (
    <Button priority={priority} disabled={disabled} onClick={onClick} style={buttonStyle}>
      {showLoader ? <ButtonContent isSaving={isSaving} hasSuccess={hasSuccess} defaultLabel={children} /> : children}
    </Button>
  );
}

interface ButtonContentProps {
  isSaving: boolean;
  hasSuccess: boolean;
  defaultLabel: React.ReactNode;
}

function ButtonContent({ isSaving, hasSuccess, defaultLabel }: ButtonContentProps) {
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

  return <>{defaultLabel}</>;
}
