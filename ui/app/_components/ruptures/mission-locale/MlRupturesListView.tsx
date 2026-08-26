"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_EFFECTIF_LISTE } from "shared";

import { MlCard } from "@/app/_components/card/MlCard";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import {
  anchorFromLabel,
  formatMonthAndYear,
  get180DaysAgo,
  matchesPostalCodes,
  PostalCodeOption,
  sortDataByMonthDescending,
} from "@/app/_utils/ruptures.utils";
import { EffectifData, MonthItem, MonthsData } from "@/common/types/ruptures";

import { EffectifsSearchableTable } from "../shared/ui/EffectifsSearchableTable";
import { matchesSearchTerm } from "../shared/utils/searchUtils";

import { DownloadSection } from "./DownloadSection";
import { MlCriteresFilter } from "./liste/MlCriteresFilter";
import { useMlListeFiltres } from "./liste/useMlListeFiltres";
import styles from "./MlRupturesListView.module.css";
import { useMonthDownload } from "./useMonthDownload";

/** Sous-onglets de la liste ruptures : les dossiers actionnables d'un côté, les dossiers clos de l'autre. */
const SOUS_ONGLETS = {
  A_TRAITER: API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER,
  TRAITES: API_EFFECTIF_LISTE.TRAITE,
} as const;

type SousOnglet = (typeof SOUS_ONGLETS)[keyof typeof SOUS_ONGLETS];

/** Les anciens liens (emails de récap) ciblent un statut : « déjà traité » ouvre l'onglet Traités. */
const sousOngletDepuisStatut = (statut: string | null): SousOnglet =>
  statut === "traite" || statut === "traite_prioritaire" ? SOUS_ONGLETS.TRAITES : SOUS_ONGLETS.A_TRAITER;

interface MlRupturesListViewProps {
  data: MonthsData;
  postalCodeOptions?: PostalCodeOption[];
  initialStatut?: string | null;
  initialRuptureDate?: string | null;
}

export function MlRupturesListView({
  data,
  postalCodeOptions = [],
  initialStatut,
  initialRuptureDate,
}: MlRupturesListViewProps) {
  const { downloadMonth, downloadError, setDownloadError } = useMonthDownload();
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const [sousOnglet, setSousOnglet] = useState<SousOnglet>(sousOngletDepuisStatut(initialStatut ?? null));
  const [activeAnchor, setActiveAnchor] = useState("");
  const [anneesOuvertes, setAnneesOuvertes] = useState<string[]>([String(new Date().getFullYear())]);
  const {
    recherche: searchTerm,
    setRecherche: setSearchTerm,
    codesPostaux: selectedPostalCodes,
    changerCodesPostaux: handlePostalCodesChange,
    criteres,
    changerCriteres: setCriteres,
  } = useMlListeFiltres();

  useEffect(() => {
    trackPlausibleEvent("ml_liste_a_traiter_ouverte");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialStatut) setSousOnglet(sousOngletDepuisStatut(initialStatut));
  }, [initialStatut]);

  // Le filtre critères s'applique en amont : la recherche et le filtre villes restent gérés par le tableau.
  const appliquerCriteres = useCallback(
    (months: MonthItem[]): MonthItem[] => {
      if (criteres.length === 0) return months;
      return months.map((month) => ({
        ...month,
        data: month.data.filter((effectif: EffectifData) => criteres.some((critere) => Boolean(effectif[critere]))),
      }));
    },
    [criteres]
  );

  const moisATraiter = useMemo(
    () => appliquerCriteres(sortDataByMonthDescending(data.a_traiter_ou_recontacter || [])),
    [data.a_traiter_ou_recontacter, appliquerCriteres]
  );
  const moisTraites = useMemo(
    () => appliquerCriteres(sortDataByMonthDescending(data.traite || [])),
    [data.traite, appliquerCriteres]
  );

  const estTraites = sousOnglet === SOUS_ONGLETS.TRAITES;
  const moisAffiches = estTraites ? moisTraites : moisATraiter;
  // Les dossiers traités des années repliées ne sont pas rendus : la liste couvre plusieurs années.
  const moisRendus = estTraites
    ? moisAffiches.filter((m) => anneesOuvertes.includes(String(new Date(m.month).getFullYear())))
    : moisAffiches;

  const countVisibleInMonth = useCallback(
    (monthItem: MonthItem) =>
      monthItem.data.filter(
        (effectif) =>
          (!searchTerm || matchesSearchTerm(effectif.nom, effectif.prenom, searchTerm)) &&
          matchesPostalCodes(effectif, selectedPostalCodes)
      ).length,
    [searchTerm, selectedPostalCodes]
  );

  const countVisible = useCallback(
    (months: MonthItem[]) => months.reduce((sum, month) => sum + countVisibleInMonth(month), 0),
    [countVisibleInMonth]
  );

  const totalATraiter = useMemo(() => countVisible(moisATraiter), [moisATraiter, countVisible]);
  const totalTraites = useMemo(() => countVisible(moisTraites), [moisTraites, countVisible]);

  const buildMonthLabel = useCallback(
    (month: string) =>
      month === "plus-de-180-j"
        ? {
            labelElement: (
              <>
                + de 180j | <i>En abandon</i>
              </>
            ),
            labelString: month,
          }
        : { labelElement: formatMonthAndYear(month), labelString: month },
    []
  );

  const handleAnchorClick = useCallback((anchorId: string) => {
    setActiveAnchor(anchorId);
    document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Deep-link ?rupture=<date> : ouvre le mois correspondant (ou le bucket +180j).
  useEffect(() => {
    if (!initialRuptureDate) return;
    const parsed = new Date(initialRuptureDate);
    const ancre = parsed < get180DaysAgo() ? anchorFromLabel("plus-de-180-j") : anchorFromLabel(initialRuptureDate);
    requestAnimationFrame(() => handleAnchorClick(ancre));
  }, [initialRuptureDate, handleAnchorClick]);

  const itemMois = useCallback(
    (monthItem: MonthItem) => {
      const monthCount = countVisibleInMonth(monthItem);
      const { labelElement, labelString } = buildMonthLabel(monthItem.month);
      const anchorId = anchorFromLabel(labelString);
      return {
        text:
          monthCount > 0 ? (
            <strong>
              {labelElement}
              {monthItem.month === "plus-de-180-j" ? "" : ` (${monthCount})`}
            </strong>
          ) : (
            labelElement
          ),
        linkProps: {
          href: `#${anchorId}`,
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            handleAnchorClick(anchorId);
          },
        },
        isActive: activeAnchor === anchorId,
      };
    },
    [countVisibleInMonth, buildMonthLabel, handleAnchorClick, activeAnchor]
  );

  const sideMenuItems = useMemo(() => {
    // Dossiers traités : navigation par année, l'année en cours dépliée, les précédentes au clic.
    if (estTraites) {
      const parAnnee = new Map<string, MonthItem[]>();
      for (const monthItem of moisAffiches) {
        const annee = String(new Date(monthItem.month).getFullYear());
        parAnnee.set(annee, [...(parAnnee.get(annee) ?? []), monthItem]);
      }
      return [...parAnnee.entries()]
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([annee, mois]) => {
          const total = mois.reduce((somme, m) => somme + countVisibleInMonth(m), 0);
          const libelleAnnee = (
            <strong>
              {annee} ({total})
            </strong>
          );

          // Une année dépliée liste ses mois ; une année fermée s'ouvre au clic, le libellé
          // « Afficher {année} » indiquant l'action comme sur la maquette. Le SideMenu DSFR
          // n'ouvre qu'un accordéon à la fois : c'est aussi ce que montre la maquette.
          if (anneesOuvertes.includes(annee)) {
            return { text: libelleAnnee, expandedByDefault: true, items: mois.map(itemMois) };
          }
          return {
            text: (
              <span className={styles.anneeFermee}>
                {libelleAnnee}
                <span className={styles.anneeLienAfficher}>Afficher {annee}</span>
              </span>
            ),
            linkProps: {
              href: "#",
              onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                setAnneesOuvertes((precedentes) => [...precedentes, annee]);
              },
            },
          };
        });
    }
    return moisAffiches.map(itemMois);
  }, [estTraites, moisAffiches, itemMois, countVisibleInMonth, anneesOuvertes]);

  const estVide = moisRendus.every((month) => month.data.length === 0);

  const contenu = (
    <div className="fr-grid-row">
      <div className="fr-col-12 fr-col-md-3">
        <SideMenu
          align="left"
          burgerMenuButtonText="Dans cette rubrique"
          sticky
          items={sideMenuItems}
          style={{ paddingRight: 0 }}
        />
      </div>
      <div className="fr-col-12 fr-col-md-9" style={{ paddingLeft: "2rem" }}>
        {downloadError && (
          <Alert
            severity="error"
            description={downloadError}
            closable
            onClose={() => setDownloadError(null)}
            className="fr-mb-2w"
            small
          />
        )}

        {estVide ? (
          sousOnglet === SOUS_ONGLETS.TRAITES ? (
            <MlCard
              title="Vous n'avez traité aucun dossier pour le moment"
              imageSrc="/images/mission-locale-treated.svg"
              imageAlt="Personnes discutant et travaillant dans un bureau"
            />
          ) : (
            <MlCard
              title="Il n'y a pas de nouveaux jeunes à contacter pour le moment"
              imageSrc="/images/mission-locale-not-treated.svg"
              imageAlt="Personnes discutant et travaillant devant un tableau"
              body={
                <p>
                  <strong>Nous vous invitons à vous reconnecter dans 1 semaine</strong> pour prendre connaissance de
                  nouvelles situations.
                </p>
              }
            />
          )
        ) : (
          <>
            <DownloadSection listType={sousOnglet} />
            <SuspenseWrapper fallback={<TableSkeleton />}>
              <EffectifsSearchableTable
                data={moisRendus}
                isTraite={sousOnglet === SOUS_ONGLETS.TRAITES}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                listType={sousOnglet}
                onDownloadMonth={downloadMonth}
                showVillesFilter
                postalCodeOptions={postalCodeOptions}
                selectedPostalCodes={selectedPostalCodes}
                onPostalCodesChange={handlePostalCodesChange}
                filtresSupplementaires={<MlCriteresFilter value={criteres} onChange={setCriteres} />}
              />
            </SuspenseWrapper>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Tabs
        selectedTabId={sousOnglet}
        onTabChange={(id) => {
          setSousOnglet(id as SousOnglet);
          setActiveAnchor("");
        }}
        tabs={[
          {
            tabId: SOUS_ONGLETS.A_TRAITER,
            label: `À traiter ou recontacter (${totalATraiter})`,
            iconId: "fr-icon-flashlight-fill",
          },
          { tabId: SOUS_ONGLETS.TRAITES, label: `Traités (${totalTraites})`, iconId: "fr-icon-check-line" },
        ]}
      >
        {contenu}
      </Tabs>
    </>
  );
}
