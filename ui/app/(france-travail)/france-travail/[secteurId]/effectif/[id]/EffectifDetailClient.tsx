"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
import { formatDate, getAge } from "@/app/_utils/date.utils";
import { formatPhoneNumber } from "@/app/_utils/phone.utils";

import styles from "./EffectifDetailClient.module.css";
import { EffectifFormationInfo } from "./EffectifFormationInfo";
import { FTEffectifForm } from "./FTEffectifForm";

interface EffectifPersonalInfoProps {
  dateNaissance?: string;
  adresse?: { commune?: string; code_postal?: string };
  rqth?: boolean;
}

function EffectifPersonalInfo({ dateNaissance, adresse, rqth }: EffectifPersonalInfoProps) {
  const age = getAge(dateNaissance);
  return (
    <>
      <p className={styles.infoPara}>
        Né(e) le {formatDate(dateNaissance) || "-"}, <b>{age ? `${age} ans` : ""}</b>
      </p>
      <p className={styles.infoPara}>
        <i className={`fr-icon-home-4-line`} />
        Réside à <b>{adresse?.commune || "-"}</b>({adresse?.code_postal || "-"})
      </p>
      <p className={styles.infoPara}>RQTH : {rqth ? "oui" : "non"}</p>
    </>
  );
}

interface EffectifCoordonneesProps {
  telephone?: string;
  courriel?: string;
  responsableMail?: string;
}

function EffectifCoordonnees({ telephone, courriel, responsableMail }: EffectifCoordonneesProps) {
  return (
    <>
      <p className={styles.coordTitle}>Coordonnées</p>
      <p className={styles.infoPara}>
        <span>{formatPhoneNumber(telephone) || "-"}</span> <span>{courriel || "-"}</span>
      </p>
      {responsableMail && (
        <>
          <p className={styles.coordTitle}>Responsable légal</p>
          <p className={styles.infoPara}>
            <span>{responsableMail}</span>
          </p>
        </>
      )}
    </>
  );
}

const SUCCESS_DISPLAY_DURATION = 1000;

export default function EffectifDetailClient() {
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
    () => calculateJoursSansContrat(effectif?.current_status?.date),
    [effectif?.current_status?.date]
  );

  const badgeStyle = useMemo(() => getDureeBadgeProps(joursSansContrat), [joursSansContrat]);

  const secteurs = useMemo(() => {
    if (!arborescenceData || !effectif?.ft_data) return [];
    return mapSecteursFromFtData(effectif.ft_data, arborescenceData.a_traiter.secteurs);
  }, [arborescenceData, effectif?.ft_data]);

  const currentSecteur = useMemo(() => {
    if (!arborescenceData || !codeSecteur) return null;
    return arborescenceData.a_traiter.secteurs.find((s) => s.code_secteur === codeSecteur);
  }, [arborescenceData, codeSecteur]);

  const handleFormSubmit = (
    formData: { situation: FranceTravailSituation; commentaire: string | null },
    saveNext: boolean
  ) => {
    if (!effectif?.id || !codeSecteur) return;

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    setSubmissionState({ isSubmitting: true, hasSuccess: false, hasError: false });

    updateEffectif(
      {
        id: effectif.id,
        commentaire: formData.commentaire,
        situation: formData.situation,
        code_secteur: codeSecteur,
      },
      {
        onSuccess: () => {
          setSubmissionState({ isSubmitting: false, hasSuccess: true, hasError: false });

          const nextId = data?.next?.id;
          navigationTimeoutRef.current = setTimeout(() => {
            if (saveNext && nextId) {
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

  if (!codeSecteur) {
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

  const existingData = effectif.ft_data?.[codeSecteur];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.navigationContainer}>
        <DsfrLink
          href={`/france-travail/${codeSecteur}${buildQueryString(true) ? `?${buildQueryString(true)}` : ""}`}
          className="fr-link--icon-left fr-icon-arrow-left-s-line"
          arrow="none"
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

      <div className={styles.content}>
        <div className={styles.parcoursColumn}>
          <FTEffectifParcours effectif={effectif} codeSecteur={codeSecteur} />
        </div>

        <div className={styles.leftColumn}>
          <div className={styles.headerSection}>
            <h1 className={styles.mainTitle}>
              {effectif.nom} {effectif.prenom}
            </h1>
            <div className={styles.statusBadgeContainer}>
              <span className={styles.statusBadge}>INSCRIT SANS CONTRAT DEPUIS {badgeStyle.label}</span>
            </div>
          </div>

          <div className={styles.infoSection}>
            <EffectifPersonalInfo
              dateNaissance={effectif.date_de_naissance}
              adresse={effectif.adresse}
              rqth={effectif.rqth}
            />
            <EffectifCoordonnees
              telephone={effectif.telephone}
              courriel={effectif.courriel}
              responsableMail={effectif.responsable_mail}
            />
          </div>

          <div className={styles.formationSection}>
            <EffectifFormationInfo
              dateDebut={effectif.current_status?.date}
              badgeStyle={badgeStyle}
              organisme={effectif.organisme}
              formation={effectif.formation}
              secteurs={secteurs}
            />
          </div>
        </div>

        <div className={styles.rightColumn}>
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
