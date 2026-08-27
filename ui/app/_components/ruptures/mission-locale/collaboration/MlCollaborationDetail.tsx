"use client";

import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { API_EFFECTIF_LISTE, IEffectifMissionLocale } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { triQueryDepuisUrl } from "@/app/_utils/ruptures.utils";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";
import { PageHeader } from "../../shared/ui/PageHeader";

import { MlCollaborationColumn } from "./MlCollaborationColumn";
import localStyles from "./MlCollaborationDetail.module.css";
import { MlEffectifInfoColumn } from "./MlEffectifInfoColumn";
import { MlSuiviDossierColumn } from "./MlSuiviDossierColumn";

const styles = withSharedStyles(localStyles);

function getMlListInfo(
  effectif: IEffectifMissionLocale["effectif"],
  nomListe: API_EFFECTIF_LISTE | null,
  codePostal?: string | null,
  /** Vue d'où provient le dossier : la liste fusionnée alimente les vues prioritaires ET ruptures. */
  origine?: string | null,
  criteres?: string | null,
  sousOnglet?: string | null,
  triQuery?: string
): { label: string; href: string } {
  const statut: API_EFFECTIF_LISTE =
    nomListe ??
    (effectif.injoignable
      ? API_EFFECTIF_LISTE.INJOIGNABLE
      : effectif.a_traiter
        ? API_EFFECTIF_LISTE.A_TRAITER
        : API_EFFECTIF_LISTE.TRAITE);

  // Conserve les filtres actifs au retour à la liste via le fil d'Ariane.
  const cpQuery = codePostal ? `&cp=${codePostal}` : "";
  const filtresQuery = `${cpQuery}${criteres ? `&criteres=${criteres}` : ""}${triQuery ?? ""}`;
  const href = `/mission-locale/ruptures?statut=${statut}${filtresQuery}`;

  switch (statut) {
    case API_EFFECTIF_LISTE.INJOIGNABLE:
    case API_EFFECTIF_LISTE.INJOIGNABLE_PRIORITAIRE:
      return { label: "Dossiers à recontacter", href };
    case API_EFFECTIF_LISTE.TRAITE:
    case API_EFFECTIF_LISTE.TRAITE_PRIORITAIRE:
      return { label: "Dossiers déjà traités", href };
    case API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER:
      return origine === "ruptures"
        ? { label: "Liste des jeunes en rupture", href }
        : {
            label: "Dossiers prioritaires à traiter",
            href: `/mission-locale${filtresQuery ? `?${filtresQuery.slice(1)}` : ""}`,
          };
    case API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER:
    case API_EFFECTIF_LISTE.COLLAB_TRAITE: {
      const traites = sousOnglet === "traites" || statut === API_EFFECTIF_LISTE.COLLAB_TRAITE;
      const query = `${traites ? "sous_onglet=traites" : ""}${filtresQuery}`.replace(/^&/, "");
      return {
        label: traites ? "Collaborations CFA traitées" : "Collaborations CFA",
        href: `/mission-locale/collaborations${query ? `?${query}` : ""}`,
      };
    }
    default:
      return { label: "Dossiers à traiter", href };
  }
}

interface MlCollaborationDetailProps {
  data: IEffectifMissionLocale;
}

export function MlCollaborationDetail({ data }: MlCollaborationDetailProps) {
  const { effectif, previous, next, total, currentIndex } = data;
  const searchParams = useSearchParams();
  const nomListeParam = searchParams?.get("nom_liste");
  // On valide la valeur du query param contre l'enum : une valeur inattendue produirait un back-link cassé.
  const nomListe = (Object.values(API_EFFECTIF_LISTE) as string[]).includes(nomListeParam ?? "")
    ? (nomListeParam as API_EFFECTIF_LISTE)
    : null;
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const collabReceived = !!effectif.organisme_data?.acc_conjoint;
  const pageRef = useRef<HTMLDivElement>(null);

  const codePostal = searchParams?.get("cp");
  const origine = searchParams?.get("origine");
  const criteres = searchParams?.get("criteres");
  const sousOnglet = searchParams?.get("sous_onglet");
  const { label: listLabel, href: listHref } = getMlListInfo(
    effectif,
    nomListe,
    codePostal,
    origine,
    criteres,
    sousOnglet,
    triQueryDepuisUrl(searchParams?.get("tri"), searchParams?.get("ordre"))
  );

  // Dépend de effectif.id : la navigation Précédent/Suivant change l'[id] sans démonter le composant
  // (data servie depuis le cache react-query), il faut donc re-scroller et re-tracker à chaque dossier.
  useEffect(() => {
    pageRef.current?.scrollIntoView({ behavior: "instant" });
    trackPlausibleEvent("ml_fiche_ouverte", undefined, {
      effectifId: String(effectif.id),
      collaboration: collabReceived,
    });
  }, [effectif.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={pageRef} className={`${styles.page} ${styles.detailPage}`}>
      <Breadcrumb
        currentPageLabel={`${effectif.prenom} ${effectif.nom}`}
        segments={[
          {
            label: listLabel,
            linkProps: {
              href: listHref,
              onClick: () => trackPlausibleEvent("ml_fiche_retour_liste"),
            },
          },
        ]}
        className={localStyles.breadcrumb}
      />

      <div className={styles.detailNav}>
        <PageHeader
          previous={previous || undefined}
          next={next || undefined}
          total={total}
          currentIndex={currentIndex}
        />
      </div>

      <div className={styles.columns}>
        <MlEffectifInfoColumn effectif={effectif} />
        <MlCollaborationColumn effectif={effectif} />
        <MlSuiviDossierColumn effectif={effectif} />
      </div>
    </div>
  );
}
