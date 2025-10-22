"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { FTEffectifPageHeader } from "@/app/_components/france-travail/FTEffectifPageHeader";
import { useEffectifDetail, useArborescence } from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import { useFranceTravailQueryParams } from "@/app/_components/france-travail/hooks/useFranceTravailQueryParams";
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
  const params = useParams();
  const { params: queryParams, buildQueryString } = useFranceTravailQueryParams();

  const id = params?.id as string | undefined;
  const codeSecteur = params?.secteurId ? Number(params.secteurId) : null;

  const { data, isLoading, error } = useEffectifDetail(id || null, {
    nom_liste: "a_traiter",
    code_secteur: codeSecteur || 0,
    search: queryParams.search,
    sort: queryParams.sort,
    order: queryParams.order,
  });

  const { data: arborescenceData } = useArborescence();

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
