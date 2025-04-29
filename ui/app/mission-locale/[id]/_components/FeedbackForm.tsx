"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { IUpdateMissionLocaleEffectif, SITUATION_ENUM, SITUATION_LABEL_ENUM } from "shared";

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
}: {
  formData: IUpdateMissionLocaleEffectif;
  setFormData: (data: IUpdateMissionLocaleEffectif) => void;
  isFormValid: boolean;
  onSave: (saveNext: boolean) => void;
  isSaving: boolean;
  isInjoignable: boolean;
  hasSuccess: boolean;
  hasError: boolean;
}) {
  const [didChangeSituation, setDidChangeSituation] = useState(false);

  return (
    <>
      <Box p={3} sx={{ border: "1px solid var(--border-default-blue-france)" }}>
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
              label: SITUATION_LABEL_ENUM.PAS_BESOIN_SUIVI,
              nativeInputProps: {
                value: SITUATION_ENUM.PAS_BESOIN_SUIVI,
                checked: formData.situation === SITUATION_ENUM.PAS_BESOIN_SUIVI,
                onChange: () => {
                  setFormData({
                    ...formData,
                    situation: SITUATION_ENUM.PAS_BESOIN_SUIVI,
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
              value: formData.situation_autre,
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
      </Box>
      {hasError && (
        <Typography color="error" sx={{ mt: 2 }}>
          Une erreur est survenue. Veuillez réessayer.
        </Typography>
      )}
      <FormActions
        isFormValid={isFormValid}
        onSave={onSave}
        isSaving={isSaving}
        hasSuccess={hasSuccess}
        didChangeSituation={didChangeSituation}
        isInjoignable={isInjoignable}
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
}: {
  isFormValid: boolean;
  onSave: (saveNext: boolean) => void;
  isSaving: boolean;
  hasSuccess: boolean;
  didChangeSituation: boolean;
  isInjoignable: boolean;
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
    <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
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
    </Stack>
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
        <CircularProgress size="1em" sx={{ mr: 1 }} />
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
