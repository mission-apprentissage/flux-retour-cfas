"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { API_EFFECTIF_LISTE } from "shared";

import { filterMlEffectifs } from "@/app/_components/ruptures/mission-locale/liste/filterMlEffectifs";
import { useMlListe, useMlVilles } from "@/app/_components/ruptures/mission-locale/liste/hooks";
import { MlListeFilters } from "@/app/_components/ruptures/mission-locale/liste/MlListeFilters";
import { MlListeHeader } from "@/app/_components/ruptures/mission-locale/liste/MlListeHeader";
import { MlListePanel } from "@/app/_components/ruptures/mission-locale/liste/MlListePanel";
import { MlListeSkeleton } from "@/app/_components/ruptures/mission-locale/liste/MlListeSkeleton";
import { useMlListeFiltres } from "@/app/_components/ruptures/mission-locale/liste/useMlListeFiltres";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import type { MlListeEffectif } from "@/common/types/ruptures";

const SOUS_ONGLETS = {
  A_TRAITER: "a-traiter",
  TRAITES: "traites",
} as const;

type SousOnglet = (typeof SOUS_ONGLETS)[keyof typeof SOUS_ONGLETS];

const BLOC_EXPLICATIF = (
  <p className="fr-mb-0">
    {`Un CFA connecté au Tableau de bord peut vous transmettre le dossier d'un jeune qu'il accompagne, en le qualifiant : situation du jeune, objectifs d'accompagnement attendus et freins périphériques identifiés. Vous recevez ainsi plus de contexte qu'une rupture détectée automatiquement, et le CFA est informé dès que vous traitez le dossier.`}
  </p>
);

function MlCollaborationsListes() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filtres = useMlListeFiltres();

  const sousOnglet: SousOnglet =
    searchParams?.get("sous_onglet") === SOUS_ONGLETS.TRAITES ? SOUS_ONGLETS.TRAITES : SOUS_ONGLETS.A_TRAITER;

  // Les deux listes sont chargées ensemble : changer de sous-onglet reste instantané et
  // conserve les filtres, sans re-suspendre la page.
  const { data: aTraiter } = useMlListe(API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER);
  const { data: traites } = useMlListe(API_EFFECTIF_LISTE.COLLAB_TRAITE);
  const { data: villesOptions } = useMlVilles();

  const estTraites = sousOnglet === SOUS_ONGLETS.TRAITES;
  const nomListe = estTraites ? API_EFFECTIF_LISTE.COLLAB_TRAITE : API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER;

  const effectifsFiltres = useMemo(
    () =>
      filterMlEffectifs(estTraites ? traites.effectifs : aTraiter.effectifs, {
        recherche: filtres.recherche,
        codesPostaux: filtres.codesPostaux,
        criteres: filtres.criteres,
      }),
    [estTraites, traites.effectifs, aTraiter.effectifs, filtres.recherche, filtres.codesPostaux, filtres.criteres]
  );

  const changerOnglet = (onglet: SousOnglet) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (onglet === SOUS_ONGLETS.A_TRAITER) {
      params.delete("sous_onglet");
    } else {
      params.set("sous_onglet", onglet);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : (pathname ?? ""), { scroll: false });
  };

  const sousOngletQuery = estTraites ? `&sous_onglet=${SOUS_ONGLETS.TRAITES}` : "";
  const getRowLink = (effectif: MlListeEffectif) =>
    `/mission-locale/${effectif.id}?nom_liste=${nomListe}${filtres.filtresQuery}${sousOngletQuery}`;

  return (
    <>
      <MlListeFilters
        recherche={filtres.recherche}
        onRechercheChange={filtres.setRecherche}
        villesOptions={villesOptions ?? []}
        codesPostaux={filtres.codesPostaux}
        onCodesPostauxChange={filtres.changerCodesPostaux}
        criteres={filtres.criteres}
        onCriteresChange={filtres.changerCriteres}
      />

      <Tabs
        selectedTabId={sousOnglet}
        onTabChange={(id) => changerOnglet(id as SousOnglet)}
        tabs={[
          {
            tabId: SOUS_ONGLETS.A_TRAITER,
            label: `À traiter ou recontacter (${aTraiter.counts.a_traiter_ou_recontacter})`,
            iconId: "fr-icon-flashlight-fill",
          },
          {
            tabId: SOUS_ONGLETS.TRAITES,
            label: `Traités (${aTraiter.counts.traite})`,
            iconId: "fr-icon-check-line",
          },
        ]}
      >
        <MlListePanel
          titre={estTraites ? "Collaborations traitées" : "Collaborations à traiter"}
          nomListe={nomListe}
          effectifs={effectifsFiltres}
          getRowLink={getRowLink}
          filtresActifs={filtres.filtresActifs}
          videTitre={estTraites ? "Aucune collaboration traitée" : "Aucune collaboration à traiter"}
          videSousTitre={
            estTraites
              ? "Les dossiers que vous aurez traités apparaîtront ici."
              : "Les CFA connectés au Tableau de bord ne vous ont envoyé aucun dossier pour le moment."
          }
          videImage={estTraites ? "/images/mission-locale-treated.svg" : "/images/mission-locale-not-treated.svg"}
        />
      </Tabs>
    </>
  );
}

export default function MlCollaborationsClient() {
  return (
    <>
      <MlListeHeader
        titre="Collaborations CFA"
        intro="Retrouvez dans cette liste l'ensemble des dossiers des jeunes qui vous ont été envoyés par les CFA connectés au Tableau de bord. Ces dossiers ont été qualifiés et vous recevez plus de contexte sur la situation du jeune."
        sources="Sources : Demandes de collaborations envoyées par les CFA"
        blocTitre="C'est quoi une collaboration avec un CFA sur le dossier d'un jeune ?"
        blocContenu={BLOC_EXPLICATIF}
      />
      <SuspenseWrapper fallback={<MlListeSkeleton nbOnglets={2} />}>
        <MlCollaborationsListes />
      </SuspenseWrapper>
    </>
  );
}
