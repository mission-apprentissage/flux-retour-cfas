"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useMemo } from "react";
import { API_EFFECTIF_LISTE } from "shared";

import { filterMlEffectifs } from "@/app/_components/ruptures/mission-locale/liste/filterMlEffectifs";
import { useMlListe, useMlVilles } from "@/app/_components/ruptures/mission-locale/liste/hooks";
import { MlListeFilters } from "@/app/_components/ruptures/mission-locale/liste/MlListeFilters";
import { MlListeHeader } from "@/app/_components/ruptures/mission-locale/liste/MlListeHeader";
import { MlListePanel } from "@/app/_components/ruptures/mission-locale/liste/MlListePanel";
import { MlListeSkeleton } from "@/app/_components/ruptures/mission-locale/liste/MlListeSkeleton";
import tabsStyles from "@/app/_components/ruptures/mission-locale/liste/MlTabs.module.css";
import { useMlListeFiltres } from "@/app/_components/ruptures/mission-locale/liste/useMlListeFiltres";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import type { MlListeEffectif } from "@/common/types/ruptures";

const NOM_LISTE = API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER;

const BLOC_EXPLICATIF = (
  <>
    <p className="fr-mb-1w">Nous affichons dans cette liste :</p>
    <ul className="fr-mb-0">
      <li>
        <strong>CFA</strong> : les jeunes qui vous ont été adressés manuellement par un utilisateur du service dans un
        CFA ;
      </li>
      <li>
        <strong>SOUHAITE UN RDV</strong> : les jeunes qui ont répondu “Je souhaite un RDV avec la Mission Locale” à
        notre maraude numérique par message ;
      </li>
      <li>
        <strong>MINEUR</strong> : les jeunes en obligation de formation (16 à 18 ans) ;
      </li>
      <li>
        <strong>RQTH</strong> : les jeunes en situation de handicap.
      </li>
    </ul>
  </>
);

function MlPrioritairesListe() {
  const filtres = useMlListeFiltres();
  const { data } = useMlListe(NOM_LISTE, filtres.tri);
  const { data: villesOptions } = useMlVilles();

  const effectifsFiltres = useMemo(
    () =>
      filterMlEffectifs(data.effectifs, {
        recherche: filtres.recherche,
        codesPostaux: filtres.codesPostaux,
        criteres: filtres.criteres,
      }),
    [data.effectifs, filtres.recherche, filtres.codesPostaux, filtres.criteres]
  );

  // Les filtres suivent vers la fiche pour le retour à la liste. Le précédent/suivant, calculé
  // côté serveur, ne connaît que les villes : les critères ne le restreignent pas.
  const getRowLink = (effectif: MlListeEffectif) =>
    `/mission-locale/${effectif.id}?nom_liste=${NOM_LISTE}${filtres.filtresQuery}`;

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
        className={tabsStyles.tabs}
        tabs={[
          {
            tabId: NOM_LISTE,
            label: `À traiter ou recontacter (${data.counts.a_traiter_ou_recontacter})`,
            iconId: "fr-icon-flashlight-fill",
          },
        ]}
        selectedTabId={NOM_LISTE}
        onTabChange={() => undefined}
      >
        <MlListePanel
          titre="Dossiers prioritaires à traiter ou à recontacter"
          nomListe={NOM_LISTE}
          effectifs={effectifsFiltres}
          getRowLink={getRowLink}
          filtresActifs={filtres.filtresActifs}
          videTitre="Aucun dossier prioritaire à traiter"
          videSousTitre="Tous les dossiers prioritaires ont été traités."
          videImage="/images/mission-locale-treated.svg"
          tri={filtres.tri}
          onTri={filtres.changerTri}
        />
      </Tabs>
    </>
  );
}

export default function MlPrioritairesClient() {
  return (
    <>
      <MlListeHeader
        titre="Dossiers prioritaires à traiter"
        intro="Retrouvez dans cette liste l'ensemble des dossiers à traiter en priorité."
        sources="Sources : Les ERP des CFA, DECA, les collaborations envoyées par les CFA"
        blocTitre="Qui sont les jeunes affichés dans cette liste ?"
        blocContenu={BLOC_EXPLICATIF}
      />
      <SuspenseWrapper fallback={<MlListeSkeleton nbOnglets={1} />}>
        <MlPrioritairesListe />
      </SuspenseWrapper>
    </>
  );
}
