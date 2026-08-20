"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Formik, useFormikContext } from "formik";
import { useEffect, useMemo, useRef, useState } from "react";
import { ACC_CONJOINT_MOTIF_ENUM, IEffectifMissionLocale } from "shared";
import { CFA_SITUATION_TYPE_ENUM, RQTH_DECLARE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import { useSubmitCollaborationForm, VerifiedInfo } from "../hooks";
import { ObjectifsSection } from "../sections/ObjectifsSection";
import { FormValues } from "../types";
import {
  buildAdresseRue,
  isContactValid,
  isDatesRuptureValid,
  isObjectifsValid,
  isRentreeSansContratValid,
} from "../utils";

import { Step1DatesRupture } from "./steps/Step1DatesRupture";
import { Step1MaintienFormation } from "./steps/Step1MaintienFormation";
import { Step1RentreeSansContrat } from "./steps/Step1RentreeSansContrat";
import { Step1RisqueRupture } from "./steps/Step1RisqueRupture";
import { Step1Situation } from "./steps/Step1Situation";
import { Step3Contact } from "./steps/Step3Contact";
import { StepRecap } from "./steps/StepRecap";
import styles from "./Tunnel.module.css";
import { TunnelLayout } from "./TunnelLayout";
import { StepId, STEP_NUMBER } from "./types";
import { buildTunnelSteps, EMPTY_BRANCH_VALUES } from "./useTunnelSteps";

const isMineur = (dateDeNaissance: unknown): boolean => {
  if (!dateDeNaissance) return false;
  const majorite = new Date(dateDeNaissance as string);
  majorite.setFullYear(majorite.getFullYear() + 18);
  return majorite > new Date();
};

interface CollaborationTunnelProps {
  effectif: IEffectifMissionLocale["effectif"];
  onSuccess: () => void;
  onCancel: () => void;
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
      initialValues={{
        situation_type: null,
        risque_rupture: null,
        still_at_cfa: null,
        date_rupture: "",
        date_abandon: "",
        date_debut_formation: "",
        recherche_entreprise: "",
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
          ...(branche === CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT
            ? {
                date_debut_formation: values.date_debut_formation,
                recherche_entreprise: values.recherche_entreprise.trim(),
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
  const { values, setValues, submitForm } = useFormikContext<FormValues>();
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const [currentStep, setCurrentStep] = useState<StepId>("situation");

  useEffect(() => {
    return () => {
      if (!hasSubmittedRef.current) {
        trackPlausibleEvent("cfa_form_abandonne");
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = buildTunnelSteps(values);
  const currentIndex = steps.indexOf(currentStep);
  const prenom = effectif.prenom as string;
  const nom = effectif.nom as string;
  const mlName = effectif.mission_locale_organisation?.nom;
  const sansContrat = values.situation_type === CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT;

  const goNext = () => {
    const next = steps[currentIndex + 1];
    if (next) setCurrentStep(next);
  };
  const goPrev = () => {
    const previous = steps[currentIndex - 1];
    if (previous) setCurrentStep(previous);
  };

  const canContinue = (): boolean => {
    switch (currentStep) {
      case "situation":
        return values.situation_type !== null;
      case "risqueRupture":
        return values.risque_rupture !== null;
      case "maintienFormation":
        return values.still_at_cfa !== null;
      case "datesRupture":
        return isDatesRuptureValid(values);
      case "rentreeSansContrat":
        return isRentreeSansContratValid(values);
      case "objectifs":
        return isObjectifsValid(values);
      case "contact":
        return isContactValid(values);
      case "recap":
        return true;
    }
  };

  const titre = (): string | undefined => {
    switch (STEP_NUMBER[currentStep]) {
      case 1:
        return `La situation de ${prenom} ${nom}`;
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
      case "rentreeSansContrat":
        return <Step1RentreeSansContrat prenom={prenom} />;
      case "objectifs":
        return <ObjectifsSection prenom={prenom} sansContrat={sansContrat} />;
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
          "Cette question permet à la Mission Locale le degré d'urgence de la situation si il s'agit d'une collaboration pour de la prévention de rupture.",
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
      case "rentreeSansContrat":
        return [
          "La date de début de formation permet à la Mission Locale de savoir combien de temps il reste au jeune dans le délai de 90 jours prévu par le dispositif de l'apprentissage pour trouver une entreprise après la rentrée en CFA.",
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
        <Button priority="primary" onClick={submitForm} disabled={isSubmitting}>
          {isSubmitting ? "Envoi en cours..." : "Envoyer le dossier"}
        </Button>
      </>
    ) : (
      <Button priority="primary" onClick={goNext} disabled={!canContinue()}>
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
    >
      {stepContent()}
    </TunnelLayout>
  );
}
