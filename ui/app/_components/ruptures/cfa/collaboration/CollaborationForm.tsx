"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useFormik } from "formik";
import { useRef, useMemo, useEffect } from "react";
import { ACC_CONJOINT_MOTIF_ENUM, IEffectifMissionLocale } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { formatDate } from "@/app/_utils/date.utils";

import styles from "./CollaborationForm.module.css";
import { CollaborationSidebar } from "./CollaborationSidebar";
import { FREINS_MOTIFS } from "./constants";
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

type FlatErrors = Record<string, string>;

function validate(values: FormValues): FlatErrors {
  const errors: FlatErrors = {};

  if (values.still_at_cfa === null) errors.still_at_cfa = "Requis";
  if (values.motifs.length === 0) errors.motifs = "Sélectionnez au moins un objectif";
  const commentaireErrors: Record<string, string> = {};
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
  if (Object.keys(commentaireErrors).length > 0) {
    (errors as Record<string, unknown>).commentaires_par_motif = commentaireErrors;
  }

  if (!values.cause_rupture.trim()) errors.cause_rupture = "Ce champ est obligatoire";

  if (values.referent_type === null) errors.referent_type = "Veuillez indiquer un contact";
  if (values.referent_type === "other" && !values.referent_details.trim()) {
    errors.referent_details = "Veuillez indiquer les coordonnées du référent";
  }

  const info = values.verified_info;
  if (
    !info.telephone.trim() ||
    !info.adresse_rue.trim() ||
    !info.adresse_code_postal.trim() ||
    !info.adresse_commune.trim() ||
    !info.formation_libelle.trim() ||
    !info.date_fin_formation.trim()
  ) {
    errors.verified_info = "Complétez les informations requises";
  }
  if (info.telephone.trim() && !isValidPhone(info.telephone)) {
    errors.verified_info_telephone = "Numéro de téléphone invalide";
  }
  if (info.courriel.trim() && !isValidEmail(info.courriel)) {
    errors.verified_info_courriel = "Adresse email invalide";
  }

  return errors;
}

interface CollaborationFormProps {
  effectif: IEffectifMissionLocale["effectif"];
  onSuccess: () => void;
  onCancel: () => void;
}

export function CollaborationForm({ effectif, onSuccess, onCancel }: CollaborationFormProps) {
  const { user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const submitMutation = useSubmitCollaborationForm(String(effectif.id), onSuccess);

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

  const formik = useFormik<FormValues>({
    initialValues: {
      still_at_cfa: null,
      motifs: [],
      commentaires_par_motif: {},
      cause_rupture: "",
      referent_type: null,
      referent_details: "",
      verified_info: initialVerifiedInfo,
      note_complementaire: "",
    },
    validate,
    onSubmit: (values) => {
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
    },
  });

  const { values, setFieldValue, submitCount } = formik;
  const errors = formik.errors as FlatErrors;
  const progress = computeProgress(values);
  const isFormValid =
    isSection1Valid(values) && isSection3Valid(values) && isSection4Valid(values) && isSection5Valid(values);

  const showSection3 = isSection1Valid(values);
  const showSection4 = showSection3 && isSection3Valid(values);
  const showSection5 = showSection4 && isSection4Valid(values);
  const showSection6 = showSection5 && isSection5Valid(values);

  useEffect(() => {
    if (showSection3) {
      for (const m of values.motifs) {
        if (
          FREINS_MOTIFS.includes(m) ||
          m === ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI ||
          m === ACC_CONJOINT_MOTIF_ENUM.REORIENTATION
        ) {
          formik.setFieldTouched(`commentaires_par_motif.${m}`, true, false);
        }
      }
    }
  }, [showSection3]);

  useEffect(() => {
    if (showSection5 && values.referent_type === "other") {
      formik.setFieldTouched("referent_details", true, false);
    }
  }, [showSection5]);

  const mlName = effectif.mission_locale_organisation?.nom;
  const prenom = effectif.prenom;

  const handleSubmit = () => {
    formik.handleSubmit();
    if (!isFormValid) {
      requestAnimationFrame(() => {
        const firstError = formRef.current?.querySelector(
          `.${styles.inputError}, .${styles.errorText}, .${styles.infoRequise}`
        );
        firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Button priority="tertiary" iconId="fr-icon-close-line" onClick={onCancel} className={styles.cancelButton}>
          Annuler et quitter
        </Button>
      </div>

      <div className={styles.card}>
        <form
          className={styles.formColumn}
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
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
            <StatusSection
              value={values.still_at_cfa}
              setFieldValue={setFieldValue}
              error={errors.still_at_cfa}
              submitCount={submitCount}
            />
            <ObjectifsSection
              prenom={prenom}
              values={values}
              setFieldValue={setFieldValue}
              error={errors.motifs}
              submitCount={submitCount}
              touchedCommentaires={(formik.touched.commentaires_par_motif as Record<string, boolean>) || {}}
              commentaireErrors={(formik.errors.commentaires_par_motif as Record<string, string>) || {}}
            />
          </div>

          {showSection3 && (
            <CauseRuptureSection
              value={values.cause_rupture}
              setFieldValue={setFieldValue}
              error={errors.cause_rupture}
              submitCount={submitCount}
            />
          )}

          {showSection4 && (
            <ReferentSection
              prenom={prenom}
              values={values}
              setFieldValue={setFieldValue}
              error={errors.referent_type || errors.referent_details}
              submitCount={submitCount}
            />
          )}

          {showSection5 && (
            <VerifiedInfoSection
              verifiedInfo={values.verified_info}
              setFieldValue={setFieldValue}
              submitCount={submitCount}
              fieldErrors={{
                telephone: errors.verified_info_telephone,
                courriel: errors.verified_info_courriel,
              }}
            />
          )}

          {showSection6 && <NoteSection value={values.note_complementaire} setFieldValue={setFieldValue} />}
        </form>

        <CollaborationSidebar
          effectif={effectif}
          progress={progress}
          isValid={isFormValid}
          isLoading={submitMutation.isLoading}
          hasError={submitMutation.isError}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
