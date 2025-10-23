"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { EffectifCoordonnees } from "@/app/_components/france-travail/effectif/EffectifCoordonnees";
import { EffectifPersonalInfo } from "@/app/_components/france-travail/effectif/EffectifPersonalInfo";
import { FTEffectifPageHeader } from "@/app/_components/france-travail/FTEffectifPageHeader";
import { FTEffectifParcours } from "@/app/_components/france-travail/FTEffectifParcours";
import { useEffectifDetail, useArborescence } from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import {
  getDureeBadgeProps,
  calculateJoursSansContrat,
  mapSecteursFromFtData,
  getSecteurLibelle,
  getSituationLabel,
  getFirstNonNullFtData,
} from "@/app/_components/france-travail/utils";
import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { formatDate } from "@/app/_utils/date.utils";

import { EffectifFormationInfo } from "./EffectifFormationInfo";
import styles from "./EffectifTraiteDetailClient.module.css";

export default function EffectifTraiteDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params?.id as string | undefined;
  const search = searchParams?.get("search") || undefined;

  const queryString = useMemo(() => {
    if (!search) return "";
    return `?search=${encodeURIComponent(search)}`;
  }, [search]);

  const buildQueryString = () => queryString;

  const { data, isLoading, error } = useEffectifDetail(id || null, {
    nom_liste: "traite",
    search,
  });

  const { data: arborescenceData } = useArborescence();

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

  const suiviData = useMemo(() => {
    if (!effectif?.ft_data || !arborescenceData) return null;

    const entry = getFirstNonNullFtData(effectif.ft_data);
    if (!entry) return null;

    const [codeSecteur, data] = entry;
    const secteurLibelle = getSecteurLibelle(codeSecteur, arborescenceData.a_traiter.secteurs);

    return {
      dateTraitement: data?.created_at,
      secteur: secteurLibelle,
      situation: data?.situation,
      commentaire: data?.commentaire,
    };
  }, [effectif?.ft_data, arborescenceData]);

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
          href={`/france-travail/deja-traites${queryString}`}
          className="fr-link--icon-left fr-icon-arrow-left-s-line"
          arrow="none"
        >
          <u>Retour à la liste des dossiers traités</u>
        </DsfrLink>

        <FTEffectifPageHeader
          previous={data?.previous}
          next={data?.next}
          total={data?.total}
          currentIndex={data?.currentIndex}
          isLoading={isLoading}
          buildQueryString={buildQueryString}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.parcoursColumn}>
          <FTEffectifParcours effectif={effectif} />
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
              infoParaClassName={styles.infoPara}
            />
            <EffectifCoordonnees
              telephone={effectif.telephone}
              courriel={effectif.courriel}
              responsableMail={effectif.responsable_mail}
              coordTitleClassName={styles.coordTitle}
              infoParaClassName={styles.infoPara}
            />
          </div>

          <div className={styles.formationSection}>
            <EffectifFormationInfo
              dateDebut={effectif.date_inscription}
              badgeStyle={badgeStyle}
              organisme={effectif.organisme}
              formation={effectif.formation}
              secteurs={secteurs}
            />
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.suiviSection}>
            <div className={styles.suiviHeader}>
              <h2 className={styles.suiviTitle}>Suivi France Travail</h2>
              <p className="fr-badge fr-badge--success" aria-label="Effectif traité">
                <span className={styles.badgeText}>TRAITÉ</span>
              </p>
            </div>

            {suiviData && (
              <>
                <p className={styles.suiviSubtitle}>
                  Traité le {formatDate(suiviData.dateTraitement)}, Secteur : <strong>{suiviData.secteur}</strong>
                </p>

                <div className={styles.suiviContent}>
                  <div className={styles.suiviBlock}>
                    <p className={styles.suiviBlockTitle}>Retour sur la prise de contact</p>
                    <div className={styles.suiviValue}>
                      {suiviData.situation ? getSituationLabel(suiviData.situation) : "-"}
                    </div>
                  </div>

                  <div className={styles.suiviBlock}>
                    <p className={styles.suiviBlockTitle}>Commentaire</p>
                    <div className={styles.suiviValue}>{suiviData.commentaire || "-"}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
