"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  useEffectifDetail,
  useUpdateEffectif,
  useArborescence,
} from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import { useFranceTravailQueryParams } from "@/app/_components/france-travail/hooks/useFranceTravailQueryParams";
import { FranceTravailSituation } from "@/app/_components/france-travail/types";
import {
  getDureeBadgeProps,
  calculateJoursSansContrat,
  mapSecteursFromFtData,
} from "@/app/_components/france-travail/utils";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { formatDate, getAge } from "@/app/_utils/date.utils";
import { formatPhoneNumber } from "@/app/_utils/phone.utils";

import styles from "./EffectifDetailClient.module.css";
import { EffectifFormationInfo } from "./EffectifFormationInfo";

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

export default function EffectifDetailClient() {
  const router = useRouter();
  const params = useParams();
  const { params: queryParams, buildQueryString } = useFranceTravailQueryParams();

  const id = params?.id as string | undefined;
  const codeSecteur = params?.secteurId ? Number(params.secteurId) : null;

  const [_selectedSituation, setSelectedSituation] = useState<FranceTravailSituation | null>(null);
  const [_commentaire, setCommentaire] = useState("");

  const { data, isLoading, error } = useEffectifDetail(id || null, {
    nom_liste: "a_traiter",
    code_secteur: codeSecteur!,
    search: queryParams.search,
    sort: queryParams.sort,
    order: queryParams.order,
  });

  const { mutate: _updateEffectif, isLoading: _isSubmitting } = useUpdateEffectif();
  const { data: arborescenceData } = useArborescence();

  const effectif = data?.effectif;
  const existingData = effectif?.ft_data?.[codeSecteur!];

  const joursSansContrat = useMemo(
    () => calculateJoursSansContrat(effectif?.current_status?.date),
    [effectif?.current_status?.date]
  );

  const badgeStyle = useMemo(() => getDureeBadgeProps(joursSansContrat), [joursSansContrat]);

  const secteurs = useMemo(() => {
    if (!arborescenceData || !effectif?.ft_data) return [];
    return mapSecteursFromFtData(effectif.ft_data, arborescenceData.a_traiter.secteurs);
  }, [arborescenceData, effectif?.ft_data]);

  useEffect(() => {
    if (existingData) {
      setSelectedSituation(existingData.situation);
      setCommentaire(existingData.commentaire || "");
    }
  }, [existingData]);

  /*const _handleSubmit = (quit: boolean = false) => {
    if (!selectedSituation || !id || !codeSecteur) return;

    updateEffectif(
      {
        id: effectif?.id!,
        commentaire: commentaire || null,
        situation: selectedSituation,
        code_secteur: codeSecteur,
      },
      {
        onSuccess: () => {
          if (!quit && data?.next) {
            const queryString = buildQueryString(false);
            router.push(
              `/france-travail/${codeSecteur}/effectif/${data.next.id}${queryString ? `?${queryString}` : ""}`
            );
          } else {
            handleRetour();
          }
        },
      }
    );
  };*/

  const _handleRetour = () => {
    const queryString = buildQueryString(true);
    router.push(`/france-travail/${codeSecteur}${queryString ? `?${queryString}` : ""}`);
  };

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

  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
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
      </div>
    </div>
  );
}
