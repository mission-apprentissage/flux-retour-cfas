"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_EFFECTIF_LISTE } from "shared";

import { MlCard } from "@/app/_components/card/MlCard";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import {
  anchorFromLabel,
  estMoisRecent,
  filtrerMoisATraiter,
  formatMoisAbrege,
  matchesPostalCodes,
  moisToutTraitesDepuis,
  PostalCodeOption,
  sortDataByMonthDescending,
} from "@/app/_utils/ruptures.utils";
import { EffectifData, MonthItem, MonthsData } from "@/common/types/ruptures";

import { EffectifsSearchableTable } from "../shared/ui/EffectifsSearchableTable";
import { matchesSearchTerm } from "../shared/utils/searchUtils";

import { MlListeDownloadButton } from "./liste/MlListeDownloadButton";
import { MlListeFilters } from "./liste/MlListeFilters";
import tabsStyles from "./liste/MlTabs.module.css";
import { useMlListeFiltres } from "./liste/useMlListeFiltres";
import styles from "./MlRupturesListView.module.css";

/** Sous-onglets de la liste ruptures : les dossiers actionnables d'un côté, les dossiers clos de l'autre. */
const SOUS_ONGLETS = {
  A_TRAITER: API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER,
  TRAITES: API_EFFECTIF_LISTE.TRAITE,
} as const;

type SousOnglet = (typeof SOUS_ONGLETS)[keyof typeof SOUS_ONGLETS];

const AUCUN_MOIS: ReadonlySet<string> = new Set();

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
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const [sousOnglet, setSousOnglet] = useState<SousOnglet>(sousOngletDepuisStatut(initialStatut ?? null));
  const [activeAnchor, setActiveAnchor] = useState("");
  const [anneesOuvertes, setAnneesOuvertes] = useState<string[]>([String(new Date().getFullYear())]);
  const [anciensOuverts, setAnciensOuverts] = useState(false);
  const [ancreApresBascule, setAncreApresBascule] = useState<string | null>(null);
  const {
    recherche: searchTerm,
    setRecherche: setSearchTerm,
    codesPostaux: selectedPostalCodes,
    changerCodesPostaux: handlePostalCodesChange,
    criteres,
    changerCriteres: setCriteres,
    reinitialiserFiltres,
    filtresActifs,
  } = useMlListeFiltres();

  useEffect(() => {
    trackPlausibleEvent("ml_liste_a_traiter_ouverte");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialStatut) setSousOnglet(sousOngletDepuisStatut(initialStatut));
  }, [initialStatut]);

  // Le filtre critères retire les dossiers en amont ; recherche et villes filtrent à l'affichage.
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

  const moisToutTraites = useMemo(
    () => moisToutTraitesDepuis(data.a_traiter_ou_recontacter ?? []),
    [data.a_traiter_ou_recontacter]
  );

  const estTraites = sousOnglet === SOUS_ONGLETS.TRAITES;
  // Le Set ne décrit que la liste à traiter, et sous filtre annoncer « tout est traité » serait faux.
  const moisToutTraitesAffiches = estTraites || filtresActifs ? AUCUN_MOIS : moisToutTraites;
  const moisAffiches = estTraites ? moisTraites : moisATraiter;
  // La liste ne rend que ce que la navigation montre : années repliées côté traités, mois de plus
  // d'un an côté à traiter.
  const moisRendus = useMemo(
    () =>
      estTraites
        ? moisAffiches.filter((m) => anneesOuvertes.includes(String(new Date(m.month).getFullYear())))
        : filtrerMoisATraiter(moisAffiches, moisToutTraitesAffiches, anciensOuverts),
    [estTraites, moisAffiches, anneesOuvertes, moisToutTraitesAffiches, anciensOuverts]
  );

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
  const totalAffiche = estTraites ? totalTraites : totalATraiter;

  const handleAnchorClick = useCallback((anchorId: string) => {
    setActiveAnchor(anchorId);
    document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!initialRuptureDate) return;
    requestAnimationFrame(() => handleAnchorClick(anchorFromLabel(initialRuptureDate)));
  }, [initialRuptureDate, handleAnchorClick]);

  // La bascule d'onglet remonte le panneau : l'ancre visée n'existe qu'au rendu suivant.
  useEffect(() => {
    if (!ancreApresBascule) return;
    handleAnchorClick(ancreApresBascule);
    setAncreApresBascule(null);
  }, [ancreApresBascule, handleAnchorClick]);

  const allerVersTraites = useCallback((month: string) => {
    setSousOnglet(SOUS_ONGLETS.TRAITES);
    const annee = String(new Date(month).getFullYear());
    setAnneesOuvertes((precedentes) => (precedentes.includes(annee) ? precedentes : [...precedentes, annee]));
    setAncreApresBascule(anchorFromLabel(month));
  }, []);

  const itemMois = useCallback(
    (monthItem: MonthItem) => {
      const monthCount = countVisibleInMonth(monthItem);
      const anchorId = anchorFromLabel(monthItem.month);
      const toutTraite = !estTraites && moisToutTraites.has(monthItem.month);
      // Un mois dont le bloc n'est pas rendu (masqué par un filtre) n'a rien vers quoi naviguer.
      const aUnBloc = estTraites || monthItem.data.length > 0 || moisToutTraitesAffiches.has(monthItem.month);
      return {
        text: (
          <span className={`${styles.moisItem} ${toutTraite ? styles.moisToutTraite : ""}`}>
            <span>
              {formatMoisAbrege(monthItem.month)}
              {!toutTraite && ` (${monthCount})`}
            </span>
            {toutTraite && (
              <Tooltip
                kind="hover"
                title="Vous avez traité tous les dossiers de jeunes en difficulté reçus sur ce mois."
              >
                <i className="fr-icon-checkbox-circle-fill fr-icon--sm" aria-label="Mois entièrement traité" />
              </Tooltip>
            )}
          </span>
        ),
        linkProps: {
          href: aUnBloc ? `#${anchorId}` : "#",
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            if (aUnBloc) handleAnchorClick(anchorId);
          },
        },
        isActive: aUnBloc && activeAnchor === anchorId,
      };
    },
    [countVisibleInMonth, handleAnchorClick, activeAnchor, estTraites, moisToutTraites, moisToutTraitesAffiches]
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
    // À traiter : les douze derniers mois, puis un regroupement dépliable pour les plus anciens.
    const recents = moisAffiches.filter(({ month }) => estMoisRecent(month));
    const anciens = moisAffiches.filter(({ month }) => !estMoisRecent(month));
    if (anciens.length === 0) return recents.map(itemMois);

    const totalAnciens = anciens.reduce((somme, m) => somme + countVisibleInMonth(m), 0);
    const libelleAnciens = <strong>Il y a + d&apos;1 an ({totalAnciens})</strong>;

    return [
      ...recents.map(itemMois),
      anciensOuverts
        ? { text: libelleAnciens, expandedByDefault: true, items: anciens.map(itemMois) }
        : {
            text: (
              <span className={styles.anneeFermee}>
                {libelleAnciens}
                <span className={styles.anneeLienAfficher}>Afficher plus</span>
              </span>
            ),
            linkProps: {
              href: "#",
              onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                setAnciensOuverts(true);
              },
            },
          },
    ];
  }, [estTraites, moisAffiches, itemMois, countVisibleInMonth, anneesOuvertes, anciensOuverts]);

  const estVide = moisRendus.every((month) => month.data.length === 0 && !moisToutTraitesAffiches.has(month.month));

  const contenu = (
    <div className="fr-grid-row">
      <div className="fr-col-12 fr-col-md-3">
        <SideMenu
          align="left"
          burgerMenuButtonText="Dans cette rubrique"
          sticky
          classes={{ root: styles.moisNav }}
          items={sideMenuItems}
        />
      </div>
      <div className={`fr-col-12 fr-col-md-9 ${styles.colonneListe}`}>
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
            <div className={styles.panneauEntete}>
              <h2 className={styles.panneauTitre}>{estTraites ? "Dossiers traités" : "À traiter"}</h2>
              <div className={styles.panneauActions}>
                <span className={styles.panneauCompteur}>
                  {totalAffiche} jeune{totalAffiche > 1 ? "s" : ""}
                </span>
                <MlListeDownloadButton nomListe={sousOnglet} onError={setDownloadError} />
              </div>
            </div>
            <SuspenseWrapper fallback={<TableSkeleton />}>
              <EffectifsSearchableTable
                data={moisRendus}
                isTraite={sousOnglet === SOUS_ONGLETS.TRAITES}
                searchTerm={searchTerm}
                listType={sousOnglet}
                selectedPostalCodes={selectedPostalCodes}
                onVoirDossiersTraites={allerVersTraites}
              />
            </SuspenseWrapper>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <MlListeFilters
        recherche={searchTerm}
        onRechercheChange={setSearchTerm}
        villesOptions={postalCodeOptions}
        codesPostaux={selectedPostalCodes}
        onCodesPostauxChange={handlePostalCodesChange}
        criteres={criteres}
        onCriteresChange={setCriteres}
        onReinitialiser={reinitialiserFiltres}
      />
      <Tabs
        className={tabsStyles.tabs}
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
