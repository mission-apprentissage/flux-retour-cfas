"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Formik, FormikErrors, useFormikContext } from "formik";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ACC_CONJOINT_MOTIF_ENUM, IEffectifMissionLocale } from "shared";
import { CFA_SITUATION_TYPE_ENUM, RQTH_DECLARE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { isMineur } from "@/app/_utils/ruptures.utils";

import { useSubmitCollaborationForm, VerifiedInfo } from "../hooks";
import { ObjectifsSection } from "../sections/ObjectifsSection";
import { FormValues } from "../types";
import { buildAdresseRue, contactErrors, datesRuptureErrors, objectifsErrors } from "../utils";

import { Step1DatesRupture } from "./steps/Step1DatesRupture";
import { Step1MaintienFormation } from "./steps/Step1MaintienFormation";
import { Step1RisqueRupture } from "./steps/Step1RisqueRupture";
import { Step1Situation } from "./steps/Step1Situation";
import { Step3Contact } from "./steps/Step3Contact";
import { StepRecap } from "./steps/StepRecap";
import styles from "./Tunnel.module.css";
import { TunnelLayout } from "./TunnelLayout";
import { StepId, STEP_NUMBER } from "./types";
import { buildTunnelSteps, EMPTY_BRANCH_VALUES } from "./useTunnelSteps";

interface CollaborationTunnelProps {
  effectif: IEffectifMissionLocale["effectif"];
  onSuccess: () => void;
  onCancel: () => void;
}

/** Chemins Formik des champs en erreur, `commentaires_par_motif.<motif>` compris. */
function cheminsDesErreurs(errors: object, prefixe = ""): string[] {
  return Object.entries(errors).flatMap(([cle, valeur]) => {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle;
    return valeur && typeof valeur === "object" ? cheminsDesErreurs(valeur, chemin) : [chemin];
  });
}

/** Manques d'une étape, sous forme de messages : bloque « Continuer » et alimente les erreurs de champ. */
function erreursEtape(step: StepId, values: FormValues): FormikErrors<FormValues> {
  switch (step) {
    case "situation":
      return values.situation_type === null ? { situation_type: "Sélectionnez une situation" } : {};
    case "risqueRupture":
      return values.risque_rupture === null ? { risque_rupture: "Sélectionnez un niveau de risque" } : {};
    case "maintienFormation":
      return values.still_at_cfa === null ? { still_at_cfa: "Ce champ est obligatoire" } : {};
    case "datesRupture":
      return datesRuptureErrors(values);
    case "objectifs":
      return objectifsErrors(values);
    case "contact":
      return contactErrors(values);
    case "recap":
      return {};
  }
}

export function CollaborationTunnel({ effectif, onSuccess, onCancel }: CollaborationTunnelProps) {
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
    return {
      telephone: (effectif.telephone as string) || "",
      courriel: (effectif.courriel as string) || "",
      adresse_rue: buildAdresseRue(adresse),
      adresse_code_postal: String(adresse?.code_postal || ""),
      adresse_commune: String(adresse?.commune || ""),
      formation_libelle: "",
      date_fin_formation: "",
    };
  }, [effectif]);

  return (
    <Formik<FormValues>
      // Sans cela, `errors` reste vide tant que rien n'a changé : rien à révéler au clic.
      validateOnMount
      // Hors branche empruntée, les champs restent vides et bloqueraient l'envoi final.
      validate={(values) =>
        buildTunnelSteps(values).reduce<FormikErrors<FormValues>>(
          (errors, step) => ({ ...errors, ...erreursEtape(step, values) }),
          {}
        )
      }
      initialValues={{
        situation_type: null,
        risque_rupture: null,
        still_at_cfa: null,
        date_rupture: "",
        date_abandon: "",
        motifs: [],
        commentaires_par_motif: {},
        cause_rupture: "",
        referent_type: null,
        referent_details: "",
        verified_info: initialVerifiedInfo,
        rqth_declare: effectif.rqth === true ? RQTH_DECLARE_ENUM.OUI : RQTH_DECLARE_ENUM.NON_RENSEIGNE,
        responsable_legal: { nom: "", telephone: "", courriel: "" },
        note_complementaire: "",
        feedback_note: null,
        feedback_remarque: "",
      }}
      onSubmit={(values) => {
        if (submitMutation.isPending || !values.situation_type) return;

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

        const responsableLegal = Object.fromEntries(
          Object.entries(values.responsable_legal).filter(([, value]) => value.trim())
        );

        const verified_info = {
          ...Object.fromEntries(
            Object.entries(values.verified_info)
              .filter(([, value]) => value?.trim())
              .map(([key, value]) => [key, value.trim()])
          ),
          rqth_declare: values.rqth_declare,
          ...(Object.keys(responsableLegal).length > 0 ? { responsable_legal: responsableLegal } : {}),
        };

        const branche = values.situation_type;

        submitMutation.mutate({
          situation_type: branche,
          motif: values.motifs,
          commentaires_par_motif,
          referent_type: values.referent_type === "other" ? "other" : "me",
          referent_coordonnees: buildReferentCoordonnees(),
          note_complementaire: values.note_complementaire.trim() || undefined,
          verified_info,
          ...(branche === CFA_SITUATION_TYPE_ENUM.EN_CONTRAT
            ? { risque_rupture: values.risque_rupture ?? undefined }
            : {}),
          ...(branche === CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE
            ? {
                still_at_cfa: values.still_at_cfa ?? undefined,
                date_rupture: values.date_rupture,
                cause_rupture: values.cause_rupture.trim(),
                ...(values.still_at_cfa === false ? { date_abandon: values.date_abandon } : {}),
              }
            : {}),
          ...(values.feedback_note !== null
            ? {
                form_feedback: {
                  note: values.feedback_note,
                  ...(values.feedback_remarque.trim() ? { remarque: values.feedback_remarque.trim() } : {}),
                },
              }
            : {}),
        });
      }}
    >
      <TunnelInner
        effectif={effectif}
        onCancel={onCancel}
        isSubmitting={submitMutation.isPending}
        hasError={submitMutation.isError}
        hasSubmittedRef={hasSubmittedRef}
      />
    </Formik>
  );
}

interface TunnelInnerProps {
  effectif: IEffectifMissionLocale["effectif"];
  onCancel: () => void;
  isSubmitting: boolean;
  hasError: boolean;
  hasSubmittedRef: React.MutableRefObject<boolean>;
}

function TunnelInner({ effectif, onCancel, isSubmitting, hasError, hasSubmittedRef }: TunnelInnerProps) {
  const { values, setValues, setFieldTouched, submitForm } = useFormikContext<FormValues>();
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const [currentStep, setCurrentStep] = useState<StepId>("situation");
  const [tentativesBloquees, setTentativesBloquees] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (!hasSubmittedRef.current) {
        trackPlausibleEvent("cfa_form_abandonne");
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tentativesBloquees === 0) return;
    const cible = contentRef.current?.querySelector<HTMLElement>(".fr-input--error, .fr-error-text");
    cible?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (cible instanceof HTMLInputElement || cible instanceof HTMLTextAreaElement) {
      cible.focus({ preventScroll: true });
    }
  }, [tentativesBloquees]);

  const steps = buildTunnelSteps(values);
  const currentIndex = steps.indexOf(currentStep);
  const prenom = effectif.prenom as string;
  const nom = effectif.nom as string;
  const mlName = effectif.mission_locale_organisation?.nom;

  const goNext = () => {
    const next = steps[currentIndex + 1];
    if (next) setCurrentStep(next);
  };
  const goPrev = () => {
    const previous = steps[currentIndex - 1];
    if (previous) setCurrentStep(previous);
  };

  const canContinue = (): boolean => Object.keys(erreursEtape(currentStep, values)).length === 0;

  const onContinuer = () => {
    if (canContinue()) {
      goNext();
      return;
    }
    cheminsDesErreurs(erreursEtape(currentStep, values)).forEach((chemin) => setFieldTouched(chemin, true, false));
    setTentativesBloquees((n) => n + 1);
  };

  const titre = (): ReactNode => {
    switch (STEP_NUMBER[currentStep]) {
      case 1:
        return (
          <>
            La situation de{" "}
            <span className={styles.stepTitleName}>
              {prenom} {nom}
            </span>
          </>
        );
      case 2:
        return "Objectif de l'accompagnement de la Mission Locale";
      default:
        return currentStep === "recap" ? undefined : "Informations de contact du jeune et du CFA";
    }
  };

  const stepContent = () => {
    switch (currentStep) {
      case "situation":
        return (
          <Step1Situation
            onChange={(situationType) => {
              // Changement de branche : les réponses de l'ancienne branche ne doivent pas partir
              // dans le payload, le serveur les refuserait.
              setValues({ ...values, ...EMPTY_BRANCH_VALUES, situation_type: situationType });
            }}
          />
        );
      case "risqueRupture":
        return <Step1RisqueRupture />;
      case "maintienFormation":
        return <Step1MaintienFormation />;
      case "datesRupture":
        return <Step1DatesRupture />;
      case "objectifs":
        return <ObjectifsSection prenom={prenom} />;
      case "contact":
        return <Step3Contact prenom={prenom} nom={nom} isMineur={isMineur(effectif.date_de_naissance)} />;
      case "recap":
        return <StepRecap prenom={prenom} nom={nom} mlName={mlName} />;
    }
  };

  const tips = (): string[] => {
    switch (currentStep) {
      case "situation":
        return [
          "Précisez la situation actuelle du jeune. Cela permet à la Mission Locale de comprendre directement où le jeune en est dans son parcours.",
        ];
      case "risqueRupture":
        return [
          "Cette question permet à la Mission Locale d'évaluer le degré d'urgence de la situation si il s'agit d'une collaboration pour de la prévention de rupture.",
          "Cependant, vous pouvez tout à fait demander une collaboration pour un jeune qui ne présente pas de signaux de rupture mais dont vous savez qu'il a besoin d'un accompagnement complémentaire à celui que vous dispensez au CFA.",
        ];
      case "maintienFormation":
        return [
          "En fonction de la situation administrative si le jeune est encore maintenu en formation ou non, certaines Missions Locales ont des accompagnements ou des dispositifs spécifiques mobilisables.",
        ];
      case "datesRupture":
        return [
          "Quelques mots sur la rupture suffisent à la Mission Locale pour mieux appréhender la situation du jeune au moment où elle prend contact avec lui ou elle pour lui proposer un accompagnement.",
        ];
      case "objectifs":
        return [
          "Ici, sélectionnez le ou les objectifs d'accompagnement qui vous paraissent les plus pertinents en fonction de la situation et des besoins du jeune dans son parcours.",
        ];
      case "contact":
        return [
          "Dernière étape ! Merci de vérifier et compléter les informations de contact du jeune.",
          "Aussi, précisez qui sera le référent ou la référente à contacter dans votre CFA si la Mission Locale a besoin de plus d'informations. Si vous êtes l'interlocuteur principal, merci de sélectionner « Me contacter uniquement ».",
        ];
      case "recap":
        return [
          "✓ Dossier complet ! Vous pouvez toujours modifier votre saisie en revenant en arrière. Sinon, pensez à laisser un message à destination de la personne qui recevra le dossier du jeune à la Mission Locale.",
        ];
    }
  };

  // Libellé de l'étape suivante (1/2/3), pas de l'écran suivant : la barre compte les étapes.
  const nextStepLabel = (): string | undefined => {
    switch (STEP_NUMBER[currentStep]) {
      case 1:
        return "Objectif de l'accompagnement de la Mission Locale";
      case 2:
        return "Informations de contact du jeune";
      default:
        return undefined;
    }
  };

  const footer =
    currentStep === "recap" ? (
      <>
        {hasError && <p className={styles.submitError}>Une erreur est survenue. Veuillez réessayer.</p>}
        <Button
          priority="primary"
          iconId="fr-icon-send-plane-fill"
          iconPosition="right"
          onClick={submitForm}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Envoi en cours..." : "Envoyer à la Mission Locale"}
        </Button>
      </>
    ) : (
      <Button
        priority="primary"
        type="button"
        onClick={onContinuer}
        className={canContinue() ? undefined : styles.buttonFauxDesactive}
        nativeButtonProps={canContinue() ? undefined : { "aria-disabled": true }}
      >
        Continuer
      </Button>
    );

  return (
    <TunnelLayout
      tips={tips()}
      stepNumber={STEP_NUMBER[currentStep]}
      title={titre()}
      nextStepLabel={nextStepLabel()}
      onBack={currentIndex > 0 ? goPrev : undefined}
      backLabel={currentStep === "recap" ? "Modifier la saisie" : "Question précédente"}
      onCancel={onCancel}
      footer={footer}
      contentRef={contentRef}
    >
      {stepContent()}
    </TunnelLayout>
  );
}
