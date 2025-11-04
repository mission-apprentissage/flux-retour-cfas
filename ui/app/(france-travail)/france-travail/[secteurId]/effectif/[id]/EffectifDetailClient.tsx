"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { TOUS_LES_SECTEURS_CODE } from "shared/constants/franceTravail";

import { EffectifCoordonnees } from "@/app/_components/france-travail/effectif/EffectifCoordonnees";
import sharedStyles from "@/app/_components/france-travail/effectif/EffectifDetail.module.css";
import { EffectifFormationInfo } from "@/app/_components/france-travail/effectif/EffectifFormationInfo";
import { EffectifPersonalInfo } from "@/app/_components/france-travail/effectif/EffectifPersonalInfo";
import { FTEffectifPageHeader } from "@/app/_components/france-travail/FTEffectifPageHeader";
import { FTEffectifParcours } from "@/app/_components/france-travail/FTEffectifParcours";
import {
  useEffectifDetail,
  useArborescence,
  useUpdateEffectif,
} from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import { useFranceTravailQueryParams } from "@/app/_components/france-travail/hooks/useFranceTravailQueryParams";
import { FranceTravailSituation } from "@/app/_components/france-travail/types";
import {
  getDureeBadgeProps,
  calculateJoursSansContrat,
  mapSecteursFromFtData,
} from "@/app/_components/france-travail/utils";
import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import styles from "./EffectifDetailClient.module.css";
import { FTEffectifForm } from "./FTEffectifForm";

const SUCCESS_DISPLAY_DURATION = 1000;

export default function EffectifDetailClient() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const router = useRouter();
  const params = useParams();
  const { params: queryParams, buildQueryString } = useFranceTravailQueryParams();

  const id = params?.id as string | undefined;
  const codeSecteur = params?.secteurId ? Number(params.secteurId) : null;

  const [submissionState, setSubmissionState] = useState<{
    isSubmitting: boolean;
    hasSuccess: boolean;
    hasError: boolean;
  }>({
    isSubmitting: false,
    hasSuccess: false,
    hasError: false,
  });

  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isLoading, error } = useEffectifDetail(id || null, {
    nom_liste: "a_traiter",
    code_secteur: codeSecteur || 0,
    search: queryParams.search,
    sort: queryParams.sort,
    order: queryParams.order,
  });

  const { data: arborescenceData } = useArborescence();
  const { mutate: updateEffectif } = useUpdateEffectif();

  const effectif = data?.effectif;

  const joursSansContrat = useMemo(
    () => calculateJoursSansContrat(effectif?.date_inscription),
    [effectif?.date_inscription]
  );

  const badgeStyle = useMemo(() => getDureeBadgeProps(joursSansContrat), [joursSansContrat]);

  const secteurs = useMemo(() => {
    if (!arborescenceData || !effectif?.ft_data) return [];
    return mapSecteursFromFtData(effectif.ft_data, arborescenceData.a_traiter.secteurs);
  }, [arborescenceData, effectif?.ft_data]);

  const currentSecteur = useMemo(() => {
    if (!arborescenceData || codeSecteur === null) return null;
    if (codeSecteur === TOUS_LES_SECTEURS_CODE) {
      return { code_secteur: TOUS_LES_SECTEURS_CODE, libelle_secteur: "Tous les secteurs", count: 0 };
    }
    return arborescenceData.a_traiter.secteurs.find((s) => s.code_secteur === codeSecteur);
  }, [arborescenceData, codeSecteur]);

  const lastTrackedEffectifIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (effectif && effectif.id !== lastTrackedEffectifIdRef.current) {
      trackPlausibleEvent("isc_fiche_jeune_ouverte");
      lastTrackedEffectifIdRef.current = effectif.id;
    }
  }, [effectif?.id]);

  const handleFormSubmit = (
    formData: { situation: FranceTravailSituation; commentaire: string | null },
    saveNext: boolean
  ) => {
    if (!effectif?.id || codeSecteur === null) return;

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    setSubmissionState({ isSubmitting: true, hasSuccess: false, hasError: false });

    const submitCodeSecteur =
      codeSecteur === TOUS_LES_SECTEURS_CODE ? Number(Object.keys(effectif.ft_data || {})[0] || 0) : codeSecteur;

    updateEffectif(
      {
        id: effectif.id,
        commentaire: formData.commentaire,
        situation: formData.situation,
        code_secteur: submitCodeSecteur,
      },
      {
        onSuccess: () => {
          trackPlausibleEvent(saveNext ? "isc_fiche_validee_suivant" : "isc_fiche_validee_quitter");

          setSubmissionState({ isSubmitting: false, hasSuccess: true, hasError: false });

          const nextId = data?.next?.id;
          navigationTimeoutRef.current = setTimeout(() => {
            if (!nextId) {
              router.push("/france-travail");
              return;
            }

            if (saveNext) {
              const queryString = buildQueryString(false);
              router.push(`/france-travail/${codeSecteur}/effectif/${nextId}${queryString ? `?${queryString}` : ""}`);
            } else {
              const queryString = buildQueryString(true);
              router.push(`/france-travail/${codeSecteur}${queryString ? `?${queryString}` : ""}`);
            }
          }, SUCCESS_DISPLAY_DURATION);
        },
        onError: (error) => {
          console.error("Erreur lors de la mise à jour de l'effectif France Travail:", error);
          setSubmissionState({ isSubmitting: false, hasSuccess: false, hasError: true });
        },
      }
    );
  };

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  if (codeSecteur === null) {
    return <Alert severity="error" title="Secteur invalide" description="Le code secteur est manquant ou invalide." />;
  }

  if (error) {
    return <Alert severity="error" title="Erreur" description="Impossible de charger les détails de l'effectif." />;
  }

  if (isLoading) {
    return <PageWithSidebarSkeleton />;
  }

  if (!effectif) {
    return (
      <Alert
        severity="error"
        title="Effectif introuvable"
        description="Cet effectif n'existe pas ou n'est plus disponible."
      />
    );
  }

  const existingDataKey =
    codeSecteur === TOUS_LES_SECTEURS_CODE ? Number(Object.keys(effectif.ft_data || {})[0] || 0) : codeSecteur;
  const existingData = effectif.ft_data?.[existingDataKey];

  return (
    <div className={sharedStyles.pageContainer}>
      <div className={sharedStyles.navigationContainer}>
        <DsfrLink
          href={`/france-travail/${codeSecteur}${buildQueryString(true) ? `?${buildQueryString(true)}` : ""}`}
          className="fr-link--icon-left fr-icon-arrow-left-s-line"
          arrow="none"
          onClick={() => {
            trackPlausibleEvent("isc_retour_liste_secteur");
          }}
        >
          <u>
            Retour à la liste secteur <strong>{currentSecteur?.libelle_secteur || codeSecteur}</strong>
          </u>
        </DsfrLink>

        <FTEffectifPageHeader
          previous={data?.previous}
          next={data?.next}
          total={data?.total}
          currentIndex={data?.currentIndex}
          isLoading={isLoading}
          codeSecteur={codeSecteur}
          buildQueryString={buildQueryString}
        />
      </div>

      <div className={sharedStyles.content}>
        <div className={sharedStyles.parcoursColumn}>
          <FTEffectifParcours effectif={effectif} codeSecteur={codeSecteur} />
        </div>

        <div className={sharedStyles.leftColumn}>
          <div className={sharedStyles.headerSection}>
            <h1 className={sharedStyles.mainTitle}>
              {effectif.nom} {effectif.prenom}
            </h1>
            <div className={sharedStyles.statusBadgeContainer}>
              <span className={sharedStyles.statusBadge}>INSCRIT SANS CONTRAT DEPUIS {badgeStyle.label}</span>
            </div>
          </div>

          <div className={sharedStyles.infoSection}>
            <EffectifPersonalInfo
              dateNaissance={effectif.date_de_naissance}
              adresse={effectif.adresse}
              rqth={effectif.rqth}
              infoParaClassName={sharedStyles.infoPara}
            />
            <EffectifCoordonnees
              telephone={effectif.telephone}
              courriel={effectif.courriel}
              rqth={effectif.rqth}
              referentHandicap={effectif.referent_handicap}
              coordTitleClassName={sharedStyles.coordTitle}
              infoParaClassName={sharedStyles.infoPara}
            />
          </div>

          <div className={sharedStyles.formationSection}>
            <EffectifFormationInfo
              dateDebut={effectif.date_inscription}
              badgeStyle={badgeStyle}
              organisme={effectif.organisme}
              formation={effectif.formation}
              secteurs={secteurs}
            />
          </div>
        </div>

        <div className={sharedStyles.rightColumn}>
          <div className={styles.formSection}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Suivi France Travail</h2>
              <p className="fr-badge fr-badge--yellow-tournesol" aria-label="Effectif à traiter">
                <i className="fr-icon-flashlight-fill fr-icon--sm" />
                <span style={{ marginLeft: "5px" }}>À TRAITER</span>
              </p>
            </div>
            <FTEffectifForm
              initialSituation={existingData?.situation || null}
              initialCommentaire={existingData?.commentaire || null}
              onSubmit={handleFormSubmit}
              isSaving={submissionState.isSubmitting}
              hasSuccess={submissionState.hasSuccess}
              hasError={submissionState.hasError}
              hasNext={!!data?.next}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
