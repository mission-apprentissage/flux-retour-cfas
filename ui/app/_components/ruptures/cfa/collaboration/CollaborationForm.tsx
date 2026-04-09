"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Formik, useFormikContext, FormikErrors } from "formik";
import { useRef, useMemo, useEffect } from "react";
import { ACC_CONJOINT_MOTIF_ENUM, IEffectifMissionLocale } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { formatDate } from "@/app/_utils/date.utils";

import styles from "./CollaborationForm.module.css";
import { CollaborationSidebar } from "./CollaborationSidebar";
import { FREINS_MOTIFS, VERIFIED_FIELDS } from "./constants";
import { useSubmitCollaborationForm, VerifiedInfo } from "./hooks";
import { CauseRuptureSection } from "./sections/CauseRuptureSection";
import { NoteSection } from "./sections/NoteSection";
import { ObjectifsSection } from "./sections/ObjectifsSection";
import { ReferentSection } from "./sections/ReferentSection";
import { StatusSection } from "./sections/StatusSection";
import { VerifiedInfoSection } from "./sections/VerifiedInfoSection";
import { FormValues } from "./types";
import {
  buildAdresseRue,
  isSection1Valid,
  isSection3Valid,
  isSection4Valid,
  isSection5Valid,
  isValidPhone,
  isValidEmail,
  computeProgress,
} from "./utils";

function validate(values: FormValues): FormikErrors<FormValues> {
  const errors: FormikErrors<FormValues> = {};

  if (values.still_at_cfa === null) errors.still_at_cfa = "Ce champ est obligatoire";
  if (values.motifs.length === 0) errors.motifs = "Sélectionnez au moins un objectif";

  const commentaireErrors: Partial<Record<ACC_CONJOINT_MOTIF_ENUM, string>> = {};
  for (const m of FREINS_MOTIFS) {
    if (values.motifs.includes(m) && !values.commentaires_par_motif[m]?.trim()) {
      commentaireErrors[m] = "Précisez le contexte pour la Mission Locale";
    }
  }
  if (
    values.motifs.includes(ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI) &&
    !values.commentaires_par_motif[ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]?.trim()
  ) {
    commentaireErrors[ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI] = "Précisez votre demande d'aide";
  }
  if (
    values.motifs.includes(ACC_CONJOINT_MOTIF_ENUM.REORIENTATION) &&
    !values.commentaires_par_motif[ACC_CONJOINT_MOTIF_ENUM.REORIENTATION]?.trim()
  ) {
    commentaireErrors[ACC_CONJOINT_MOTIF_ENUM.REORIENTATION] = "Précisez la situation de réorientation";
  }
  if (Object.keys(commentaireErrors).length > 0) {
    errors.commentaires_par_motif = commentaireErrors;
  }

  if (!values.cause_rupture.trim()) errors.cause_rupture = "Ce champ est obligatoire";

  if (values.referent_type === null) errors.referent_type = "Veuillez indiquer un contact";
  if (values.referent_type === "other" && !values.referent_details.trim()) {
    errors.referent_details = "Veuillez indiquer les coordonnées du référent";
  }

  const info = values.verified_info;
  const infoErrors: FormikErrors<VerifiedInfo> = {};
  if (!info.telephone.trim()) infoErrors.telephone = "Ce champ est obligatoire";
  else if (!isValidPhone(info.telephone)) infoErrors.telephone = "Numéro de téléphone invalide";
  if (info.courriel.trim() && !isValidEmail(info.courriel)) infoErrors.courriel = "Adresse email invalide";
  if (!info.adresse_rue.trim()) infoErrors.adresse_rue = "Ce champ est obligatoire";
  if (!info.adresse_code_postal.trim()) infoErrors.adresse_code_postal = "Ce champ est obligatoire";
  if (!info.adresse_commune.trim()) infoErrors.adresse_commune = "Ce champ est obligatoire";
  if (!info.formation_libelle.trim()) infoErrors.formation_libelle = "Ce champ est obligatoire";
  if (!info.date_fin_formation.trim()) infoErrors.date_fin_formation = "Ce champ est obligatoire";
  if (Object.keys(infoErrors).length > 0) {
    errors.verified_info = infoErrors;
  }

  return errors;
}

function useAutoTouchFields(
  showSection3: boolean,
  showSection4: boolean,
  showSection5: boolean,
  showSection6: boolean
) {
  const { values, setFieldTouched } = useFormikContext<FormValues>();

  useEffect(() => {
    if (showSection3) {
      setFieldTouched("still_at_cfa", true, false);
      setFieldTouched("motifs", true, false);
      for (const m of values.motifs) {
        if (
          FREINS_MOTIFS.includes(m) ||
          m === ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI ||
          m === ACC_CONJOINT_MOTIF_ENUM.REORIENTATION
        ) {
          setFieldTouched(`commentaires_par_motif.${m}`, true, false);
        }
      }
    }
    if (showSection4) {
      setFieldTouched("cause_rupture", true, false);
    }
    if (showSection5) {
      setFieldTouched("referent_type", true, false);
      if (values.referent_type === "other") {
        setFieldTouched("referent_details", true, false);
      }
    }
    if (showSection6) {
      for (const field of VERIFIED_FIELDS) {
        if (field.isAddress) {
          setFieldTouched("verified_info.adresse_rue", true, false);
          setFieldTouched("verified_info.adresse_code_postal", true, false);
          setFieldTouched("verified_info.adresse_commune", true, false);
        } else {
          setFieldTouched(`verified_info.${field.key}`, true, false);
        }
      }
    }
  }, [showSection3, showSection4, showSection5, showSection6, values.motifs, values.referent_type, setFieldTouched]);
}

interface CollaborationFormProps {
  effectif: IEffectifMissionLocale["effectif"];
  onSuccess: () => void;
  onCancel: () => void;
}

export function CollaborationForm({ effectif, onSuccess, onCancel }: CollaborationFormProps) {
  const { user } = useAuth();
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const hasSubmittedRef = useRef(false);
  const submitMutation = useSubmitCollaborationForm(String(effectif.id), () => {
    hasSubmittedRef.current = true;
    trackPlausibleEvent("cfa_form_dossier_envoye");
    onSuccess();
  });

  const initialVerifiedInfo = useMemo<VerifiedInfo>(() => {
    const adresse = effectif.adresse as Record<string, unknown> | null | undefined;
    const formation = effectif.formation as Record<string, unknown> | null | undefined;
    return {
      telephone: (effectif.telephone as string) || "",
      courriel: (effectif.courriel as string) || "",
      adresse_rue: buildAdresseRue(adresse),
      adresse_code_postal: String(adresse?.code_postal || ""),
      adresse_commune: String(adresse?.commune || ""),
      formation_libelle: String(formation?.libelle_long || ""),
      date_fin_formation: formatDate(formation?.date_fin as Date | string | null | undefined),
    };
  }, [effectif]);

  return (
    <Formik<FormValues>
      initialValues={{
        still_at_cfa: null,
        motifs: [],
        commentaires_par_motif: {},
        cause_rupture: "",
        referent_type: null,
        referent_details: "",
        verified_info: initialVerifiedInfo,
        note_complementaire: "",
      }}
      validate={validate}
      onSubmit={(values) => {
        if (submitMutation.isLoading) return;
        if (values.still_at_cfa === null || values.referent_type === null) return;

        const commentaires_par_motif: Partial<Record<ACC_CONJOINT_MOTIF_ENUM, string>> = {};
        for (const [key, value] of Object.entries(values.commentaires_par_motif)) {
          if (value?.trim()) {
            commentaires_par_motif[key as ACC_CONJOINT_MOTIF_ENUM] = value.trim();
          }
        }

        const buildReferentCoordonnees = (): string => {
          if (values.referent_type === "me") {
            const civilite = user?.civility === "Madame" ? "Mme" : "M.";
            const fullName = [civilite, user?.prenom, user?.nom?.toUpperCase()].filter(Boolean).join(" ");
            return [fullName, user?.telephone, user?.email].filter(Boolean).join("\n");
          }
          return values.referent_details.trim();
        };

        const verified_info = Object.fromEntries(
          Object.entries(values.verified_info)
            .filter(([, value]) => value?.trim())
            .map(([key, value]) => [key, value.trim()])
        ) as VerifiedInfo;

        submitMutation.mutate({
          still_at_cfa: values.still_at_cfa,
          motif: values.motifs,
          commentaires_par_motif,
          cause_rupture: values.cause_rupture.trim(),
          referent_type: values.referent_type,
          referent_coordonnees: buildReferentCoordonnees(),
          note_complementaire: values.note_complementaire.trim() || undefined,
          verified_info,
        });
      }}
    >
      <CollaborationFormInner
        effectif={effectif}
        onCancel={onCancel}
        submitMutation={submitMutation}
        hasSubmittedRef={hasSubmittedRef}
      />
    </Formik>
  );
}

interface CollaborationFormInnerProps {
  effectif: IEffectifMissionLocale["effectif"];
  onCancel: () => void;
  submitMutation: { isLoading: boolean; isError: boolean };
  hasSubmittedRef: React.MutableRefObject<boolean>;
}

function CollaborationFormInner({ effectif, onCancel, submitMutation, hasSubmittedRef }: CollaborationFormInnerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  useEffect(() => {
    return () => {
      if (!hasSubmittedRef.current) {
        trackPlausibleEvent("cfa_form_abandonne");
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { values, submitCount, submitForm, handleSubmit } = useFormikContext<FormValues>();

  const progress = computeProgress(values);
  const isFormValid =
    isSection1Valid(values) && isSection3Valid(values) && isSection4Valid(values) && isSection5Valid(values);

  const showSection3 = isSection1Valid(values);
  const showSection4 = showSection3 && isSection3Valid(values);
  const showSection5 = showSection4 && isSection4Valid(values);
  const showSection6 = showSection5 && isSection5Valid(values);

  useAutoTouchFields(showSection3, showSection4, showSection5, showSection6);

  const mlName = effectif.mission_locale_organisation?.nom;
  const prenom = effectif.prenom;

  useEffect(() => {
    if (submitCount > 0 && !isFormValid) {
      const firstError = formRef.current?.querySelector(`.fr-error-text, .fr-input--error, .${styles.infoRequise}`);
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [submitCount, isFormValid]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Button priority="tertiary" iconId="fr-icon-close-line" onClick={onCancel} className={styles.cancelButton}>
          Annuler et quitter
        </Button>
      </div>

      <div className={styles.card}>
        <form className={styles.formColumn} ref={formRef} onSubmit={handleSubmit}>
          <h1 className={styles.title}>
            Aidez{" "}
            <span className={styles.titleHighlight}>
              {mlName ? `la Mission locale ${mlName}` : "la Mission Locale"}
            </span>{" "}
            à comprendre la situation de{" "}
            <span className={styles.titleHighlight}>
              {prenom} {effectif.nom}
            </span>
          </h1>

          <div className={styles.sectionBox}>
            <StatusSection />
            <ObjectifsSection prenom={prenom} />
          </div>

          {showSection3 && <CauseRuptureSection />}

          {showSection4 && <ReferentSection prenom={prenom} />}

          {showSection5 && <VerifiedInfoSection />}

          {showSection6 && <NoteSection />}
        </form>

        <CollaborationSidebar
          effectif={effectif}
          progress={progress}
          isLoading={submitMutation.isLoading}
          hasError={submitMutation.isError}
          onSubmit={submitForm}
        />
      </div>
    </div>
  );
}
