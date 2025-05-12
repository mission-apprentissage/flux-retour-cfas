"use client";

import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { API_EFFECTIF_LISTE } from "shared";

import { PageWithSidebarSkeleton, TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { StartDsfrOnHydration } from "@/app/_dsfr-setup/dsfrProvider";
import { _get } from "@/common/httpClient";

import { MlCard } from "../../_components/card/MlCard";

import { MLHeader } from "./_components/MLHeader";
import { SearchableTableSection } from "./_components/SearchableTableSection";
import { EffectifPriorityData, MonthItem, MonthsData, SelectedSection } from "./_components/types";
import { anchorFromLabel, formatMonthAndYear, getTotalEffectifs, sortDataByMonthDescending } from "./_components/utils";

function groupMonthsOlderThanSixMonths(items: MonthItem[]): MonthItem[] {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const recent: MonthItem[] = [];
  const older: MonthItem[] = [];
  items.forEach((m) => {
    const thisMonth = new Date(m.month);
    if (thisMonth >= cutoff) {
      recent.push(m);
    } else {
      older.push(m);
    }
  });
  const combinedOlderData = older.flatMap((m) => m.data);
  const combinedOlderTreated = older.reduce((sum, m) => sum + (m.treated_count || 0), 0);
  const result = sortDataByMonthDescending(recent);
  if (combinedOlderData.length > 0) {
    result.push({
      month: "plus-de-6-mois",
      treated_count: combinedOlderTreated,
      data: combinedOlderData,
    });
  }
  return result;
}

function EffectifsDataLoader({ children }: { children: (data: MonthsData) => React.ReactNode }) {
  const { data } = useQuery<MonthsData>(
    ["effectifs-per-month"],
    () => _get(`/api/v1/organisation/mission-locale/effectifs-per-month`),
    {
      keepPreviousData: true,
      suspense: true,
      useErrorBoundary: true,
    }
  );
  return <>{children(data || { a_traiter: [], traite: [], prioritaire: [], injoignable: [] })}</>;
}

export default function Page() {
  return (
    <div className="fr-container">
      <StartDsfrOnHydration />
      <MLHeader />
      <SuspenseWrapper
        fallback={<PageWithSidebarSkeleton />}
        errorFallback={
          <div className="fr-alert fr-alert--error">
            <p>Impossible de charger les données. Veuillez réessayer plus tard.</p>
          </div>
        }
      >
        <EffectifsDataLoader>{(data) => <MissionLocaleContent data={data} />}</EffectifsDataLoader>
      </SuspenseWrapper>
    </div>
  );
}

function MissionLocaleContent({ data }: { data: MonthsData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<SelectedSection>("a-traiter");
  const [activeAnchor, setActiveAnchor] = useState("");

  const aTraiter = data?.a_traiter || [];
  const injoignableList = data?.injoignable || [];
  const dejaTraite = data?.traite || [];

  const groupedDataATraiter = useMemo(() => groupMonthsOlderThanSixMonths(aTraiter), [aTraiter]);
  const groupedInjoignable = useMemo(() => sortDataByMonthDescending(injoignableList), [injoignableList]);
  const sortedDataTraite = useMemo(() => sortDataByMonthDescending(dejaTraite), [dejaTraite]);

  const totalToTreat = useMemo(() => getTotalEffectifs(groupedDataATraiter), [groupedDataATraiter]);
  const totalTraite = useMemo(() => getTotalEffectifs(sortedDataTraite), [sortedDataTraite]);
  const totalInjoignable = useMemo(() => getTotalEffectifs(groupedInjoignable), [groupedInjoignable]);

  useMemo(() => {
    if (!activeAnchor) {
      if (selectedSection === "a-traiter" && groupedDataATraiter.length > 0) {
        const firstLabel =
          groupedDataATraiter[0].month === "plus-de-6-mois"
            ? "+ de 6 mois"
            : formatMonthAndYear(groupedDataATraiter[0].month);
        setActiveAnchor(anchorFromLabel(firstLabel));
      } else if (selectedSection === "deja-traite" && sortedDataTraite.length > 0) {
        const label = formatMonthAndYear(sortedDataTraite[0].month);
        setActiveAnchor(anchorFromLabel(label));
      } else if (selectedSection === "injoignable" && groupedInjoignable.length > 0) {
        const label =
          groupedInjoignable[0].month === "plus-de-6-mois"
            ? "+ de 6 mois"
            : formatMonthAndYear(groupedInjoignable[0].month);
        setActiveAnchor(anchorFromLabel(label));
      }
    }
  }, [groupedDataATraiter, sortedDataTraite, groupedInjoignable, selectedSection, activeAnchor]);

  const handleSectionChange = useCallback((newSection: SelectedSection) => {
    setSelectedSection(newSection);
    setActiveAnchor("");
  }, []);

  const handleAnchorClick = useCallback((anchorId: string) => {
    setActiveAnchor(anchorId);
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const sideMenuItems = useMemo(() => {
    const getItems = (items: MonthItem[], section: SelectedSection) => {
      if (selectedSection !== section) return [];
      return items.map((monthItem) => {
        const label = monthItem.month === "plus-de-6-mois" ? "+ de 6 mois" : formatMonthAndYear(monthItem.month);
        const anchorId = anchorFromLabel(label);
        const displayText =
          monthItem.data.length > 0 ? <strong>{`${label} (${monthItem.data.length})`}</strong> : `${label}`;
        return {
          text: displayText,
          linkProps: {
            href: `#${anchorId}`,
            onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              handleAnchorClick(anchorId);
            },
          },
          isActive: activeAnchor === anchorId,
        };
      });
    };

    return [
      {
        text: totalToTreat > 0 ? <strong>{`A traiter (${totalToTreat})`}</strong> : `A traiter (${totalToTreat})`,
        linkProps: {
          href: "#",
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            handleSectionChange("a-traiter");
          },
        },
        isActive: selectedSection === "a-traiter",
        expandedByDefault: selectedSection === "a-traiter",
        items: getItems(groupedDataATraiter, "a-traiter"),
      },
      {
        text:
          totalInjoignable > 0 ? (
            <strong>{`Contactés sans réponse (${totalInjoignable})`}</strong>
          ) : (
            `Contactés sans réponse (${totalInjoignable})`
          ),
        linkProps: {
          href: "#",
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            handleSectionChange("injoignable");
          },
        },
        isActive: selectedSection === "injoignable",
        expandedByDefault: selectedSection === "injoignable",
        items: getItems(groupedInjoignable, "injoignable"),
      },
      {
        text: totalTraite > 0 ? <strong>{`Déjà traité (${totalTraite})`}</strong> : `Déjà traité (${totalTraite})`,
        linkProps: {
          href: "#",
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            handleSectionChange("deja-traite");
          },
        },
        isActive: selectedSection === "deja-traite",
        expandedByDefault: selectedSection === "deja-traite",
        items: getItems(sortedDataTraite, "deja-traite"),
      },
    ];
  }, [
    groupedDataATraiter,
    sortedDataTraite,
    groupedInjoignable,
    totalToTreat,
    totalTraite,
    totalInjoignable,
    activeAnchor,
    selectedSection,
    handleAnchorClick,
    handleSectionChange,
  ]);

  return (
    <Grid container>
      <Grid size={{ xs: 12, md: 3 }}>
        <SideMenu
          align="left"
          burgerMenuButtonText="Dans cette rubrique"
          sticky
          items={sideMenuItems}
          style={{ paddingRight: 0 }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 9 }} pl={{ sx: 0, md: 4 }}>
        {selectedSection === "a-traiter" && groupedDataATraiter.length === 0 && (
          <MlCard
            title="Il n’y pas de nouveaux jeunes à contacter pour le moment"
            imageSrc="/images/mission-locale-not-treated.svg"
            imageAlt="Personnes discutant et travaillant devant un tableau"
            body={
              <Typography>
                <strong>Nous vous invitons à vous reconnecter dans 1 semaine</strong> pour prendre connaissance de
                nouvelles situations.
              </Typography>
            }
          />
        )}
        {selectedSection === "deja-traite" && sortedDataTraite.length === 0 && (
          <MlCard
            title="Vous n’avez traité aucun dossier pour le moment"
            imageSrc="/images/mission-locale-treated.svg"
            imageAlt="Personnes discutant et travaillant dans un bureau"
            body={
              <Typography>
                <strong>Nous vous invitons à consulter</strong>{" "}
                <a
                  className="fr-link fr-icon-arrow-right-line fr-link--icon-right"
                  href="#"
                  onClick={() => {
                    handleSectionChange("a-traiter");
                  }}
                >
                  les dossiers à traiter
                </a>
              </Typography>
            }
          />
        )}
        {selectedSection === "injoignable" && groupedInjoignable.length === 0 && (
          <MlCard
            title="Il n'y a pas de nouveaux jeunes à contacter pour le moment"
            imageSrc="/images/mission-locale-not-treated.svg"
            imageAlt="Personnes parlant au téléphone"
          />
        )}
        {selectedSection === "a-traiter" && groupedDataATraiter.length !== 0 && (
          <SuspenseWrapper fallback={<TableSkeleton />}>
            <SearchableTableSection
              title="A traiter"
              data={groupedDataATraiter}
              priorityData={data.prioritaire as EffectifPriorityData[]}
              isTraite={false}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              handleSectionChange={handleSectionChange}
              listType={API_EFFECTIF_LISTE.A_TRAITER}
            />
          </SuspenseWrapper>
        )}
        {selectedSection === "deja-traite" && sortedDataTraite.length !== 0 && (
          <SuspenseWrapper fallback={<TableSkeleton />}>
            <SearchableTableSection
              title="Déjà traité"
              data={sortedDataTraite}
              isTraite={true}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              listType={API_EFFECTIF_LISTE.TRAITE}
            />
          </SuspenseWrapper>
        )}
        {selectedSection === "injoignable" && groupedInjoignable.length !== 0 && (
          <SuspenseWrapper fallback={<TableSkeleton />}>
            <SearchableTableSection
              title="Contactés sans réponse"
              data={groupedInjoignable}
              isTraite={false}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              listType={API_EFFECTIF_LISTE.INJOIGNABLE}
            />
          </SuspenseWrapper>
        )}
      </Grid>
    </Grid>
  );
}
