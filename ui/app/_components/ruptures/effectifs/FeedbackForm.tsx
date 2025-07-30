"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useState } from "react";
import { IUpdateMissionLocaleEffectif, SITUATION_ENUM, SITUATION_LABEL_ENUM } from "shared";

import { Spinner } from "@/app/_components/common/Spinner";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

export function FeedbackForm({
  formData,
  setFormData,
  isFormValid,
  onSave,
  isSaving,
  isInjoignable,
  hasSuccess,
  hasError,
  isAdmin,
}: {
  formData: IUpdateMissionLocaleEffectif;
  setFormData: (data: IUpdateMissionLocaleEffectif) => void;
  isFormValid: boolean;
  onSave: (saveNext: boolean) => void;
  isSaving: boolean;
  isInjoignable: boolean;
  hasSuccess: boolean;
  hasError: boolean;
  isAdmin?: boolean;
}) {
  const [didChangeSituation, setDidChangeSituation] = useState(false);

  return (
    <>
      <div
        style={{
          padding: "24px",
          border: "1px solid var(--border-default-blue-france)",
        }}
      >
        <RadioButtons
          legend="Quel est votre retour sur la prise de contact ?"
          orientation="vertical"
          options={[
            {
              label: SITUATION_LABEL_ENUM.RDV_PRIS,
              nativeInputProps: {
                value: SITUATION_ENUM.RDV_PRIS,
                checked: formData.situation === SITUATION_ENUM.RDV_PRIS,
                onChange: () => {
                  setFormData({
                    ...formData,
                    situation: SITUATION_ENUM.RDV_PRIS,
                  });
                  setDidChangeSituation(true);
                },
              },
            },
            {
              label: SITUATION_LABEL_ENUM.NOUVEAU_PROJET,
              hintText: "Ex : en contrat d’apprentissage, CDD, CDI, en formation initiale",
              nativeInputProps: {
                value: SITUATION_ENUM.NOUVEAU_PROJET,
                checked: formData.situation === SITUATION_ENUM.NOUVEAU_PROJET,
                onChange: () => {
                  setFormData({
                    ...formData,
                    situation: SITUATION_ENUM.NOUVEAU_PROJET,
                  });
                  setDidChangeSituation(true);
                },
              },
            },
            {
              label: SITUATION_LABEL_ENUM.DEJA_ACCOMPAGNE,
              hintText: "Ex : Contrat d’engagement jeune (CEJ)",
              nativeInputProps: {
                value: SITUATION_ENUM.DEJA_ACCOMPAGNE,
                checked: formData.situation === SITUATION_ENUM.DEJA_ACCOMPAGNE,
                onChange: () => {
                  setFormData({
                    ...formData,
                    situation: SITUATION_ENUM.DEJA_ACCOMPAGNE,
                  });
                  setDidChangeSituation(true);
                },
              },
            },
            ...(isInjoignable
              ? []
              : [
                  {
                    label: SITUATION_LABEL_ENUM.CONTACTE_SANS_RETOUR,
                    nativeInputProps: {
                      value: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
                      checked: formData.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR,
                      onChange: () => {
                        setFormData({
                          ...formData,
                          situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
                        });
                        setDidChangeSituation(true);
                      },
                    },
                  },
                ]),
            {
              label: SITUATION_LABEL_ENUM.COORDONNEES_INCORRECT,
              nativeInputProps: {
                value: SITUATION_ENUM.COORDONNEES_INCORRECT,
                checked: formData.situation === SITUATION_ENUM.COORDONNEES_INCORRECT,
                onChange: () => {
                  setFormData({
                    ...formData,
                    situation: SITUATION_ENUM.COORDONNEES_INCORRECT,
                  });
                  setDidChangeSituation(true);
                },
              },
            },
            {
              label: SITUATION_LABEL_ENUM.AUTRE,
              nativeInputProps: {
                value: SITUATION_ENUM.AUTRE,
                checked: formData.situation === SITUATION_ENUM.AUTRE,
                onChange: () => {
                  setFormData({
                    ...formData,
                    situation: SITUATION_ENUM.AUTRE,
                  });
                  setDidChangeSituation(true);
                },
              },
            },
          ]}
        />
        {formData.situation === SITUATION_ENUM.AUTRE && (
          <Input
            label="Merci de préciser"
            nativeInputProps={{
              value: formData.situation_autre ?? undefined,
              onChange: (e) =>
                setFormData({
                  ...formData,
                  situation_autre: e.target.value,
                }),
            }}
            style={{ marginBottom: fr.spacing("4w") }}
          />
        )}
        <RadioButtons
          legend="Ce jeune était-il déjà connu de votre Mission Locale ?"
          orientation="horizontal"
          options={[
            {
              label: "Oui",
              nativeInputProps: {
                value: "oui",
                checked: formData.deja_connu === true,
                onChange: () =>
                  setFormData({
                    ...formData,
                    deja_connu: true,
                  }),
              },
            },
            {
              label: "Non",
              nativeInputProps: {
                value: "non",
                checked: formData.deja_connu === false,
                onChange: () =>
                  setFormData({
                    ...formData,
                    deja_connu: false,
                  }),
              },
            },
          ]}
        />
        <Input
          label="Avez-vous des commentaires ? (optionnel)"
          textArea
          nativeTextAreaProps={{
            rows: 3,
            value: formData.commentaires,
            onChange: (e) =>
              setFormData({
                ...formData,
                commentaires: e.target.value,
              }),
          }}
          style={{ fontWeight: "bold" }}
        />
      </div>
      {hasError && (
        <p style={{ color: "red", marginTop: "16px", margin: 0 }}>Une erreur est survenue. Veuillez réessayer.</p>
      )}
      <FormActions
        isFormValid={isFormValid}
        onSave={onSave}
        isSaving={isSaving}
        hasSuccess={hasSuccess}
        didChangeSituation={didChangeSituation}
        isInjoignable={isInjoignable}
        isAdmin={isAdmin}
      />
    </>
  );
}

function FormActions({
  isFormValid,
  onSave,
  isSaving,
  hasSuccess,
  didChangeSituation,
  isInjoignable,
  isAdmin,
}: {
  isFormValid: boolean;
  onSave: (saveNext: boolean) => void;
  isSaving: boolean;
  hasSuccess: boolean;
  didChangeSituation: boolean;
  isInjoignable: boolean;
  isAdmin?: boolean;
}) {
  const [selectedButton, setSelectedButton] = useState<"saveAndQuit" | "saveAndNext" | null>(null);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const handleClick = (type: "saveAndQuit" | "saveAndNext", saveNext: boolean) => {
    setSelectedButton(type);
    trackPlausibleEvent("reporting_mission_locale_effectif");
    onSave(saveNext);
  };

  const disabled = !isFormValid || isSaving || hasSuccess || (isInjoignable && !didChangeSituation);

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "16px" }}>
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
          disabled={disabled}
          onClick={() => handleClick("saveAndNext", true)}
        >
          Valider et passer au suivant
        </SaveButton>
      )}
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
  children,
}: {
  type: "saveAndQuit" | "saveAndNext";
  selectedButton: "saveAndQuit" | "saveAndNext" | null;
  isSaving: boolean;
  hasSuccess: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const showLoader = selectedButton === type && (isSaving || hasSuccess);
  const priority = type === "saveAndQuit" ? "secondary" : "primary";
  const buttonStyle =
    hasSuccess && selectedButton === type ? { background: "var(--background-flat-success)", color: "#fff" } : undefined;

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
