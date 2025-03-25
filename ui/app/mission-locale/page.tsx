"use client";

import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";

import { PageWithSidebarSkeleton, TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get, _getBlob } from "@/common/httpClient";

import { MlCard } from "../_components/card/MlCard";

import { MLHeader } from "./_components/MLHeader";
import { SearchableTableSection } from "./_components/SearchableTableSection";
import { MonthsData, SelectedSection } from "./_components/types";
import { anchorFromLabel, formatMonthAndYear, getTotalEffectifs, sortDataByMonthDescending } from "./_components/utils";

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

  return <>{children(data || { a_traiter: [], traite: [] })}</>;
}

function MissionLocaleContent({ data }: { data: MonthsData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<SelectedSection>("a-traiter");
  const [activeAnchor, setActiveAnchor] = useState("");

  const aTraiter = data?.a_traiter || [];
  const dejaTraite = data?.traite || [];

  const sortedDataATraiter = useMemo(() => sortDataByMonthDescending(aTraiter), [aTraiter]);
  const sortedDataTraite = useMemo(() => sortDataByMonthDescending(dejaTraite), [dejaTraite]);

  const totalToTreat = useMemo(() => getTotalEffectifs(sortedDataATraiter), [sortedDataATraiter]);
  const totalTraite = useMemo(() => getTotalEffectifs(sortedDataTraite), [sortedDataTraite]);

  useMemo(() => {
    if (!activeAnchor) {
      if (selectedSection === "a-traiter" && sortedDataATraiter.length > 0) {
        const label = formatMonthAndYear(sortedDataATraiter[0].month);
        setActiveAnchor(anchorFromLabel(label));
      } else if (selectedSection === "deja-traite" && sortedDataTraite.length > 0) {
        const label = formatMonthAndYear(sortedDataTraite[0].month);
        setActiveAnchor(anchorFromLabel(label));
      }
    }
  }, [sortedDataATraiter, sortedDataTraite, selectedSection, activeAnchor]);

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
    const getItems = (data: any[], section: SelectedSection) => {
      if (selectedSection !== section) return [];

      return data.map((monthItem) => {
        const label = formatMonthAndYear(monthItem.month);
        const anchorId = anchorFromLabel(label);
        return {
          text: `${label} (${monthItem.data.length})`,
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
        text: `A traiter (${totalToTreat})`,
        linkProps: {
          href: "#",
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            handleSectionChange("a-traiter");
          },
        },
        isActive: selectedSection === "a-traiter",
        expandedByDefault: selectedSection === "a-traiter",
        items: getItems(sortedDataATraiter, "a-traiter"),
      },
      {
        text: `Déjà traité (${totalTraite})`,
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
    sortedDataATraiter,
    sortedDataTraite,
    totalToTreat,
    totalTraite,
    activeAnchor,
    selectedSection,
    handleAnchorClick,
    handleSectionChange,
  ]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4} size={3}>
        <SideMenu
          align="left"
          burgerMenuButtonText="Dans cette rubrique"
          sticky
          items={sideMenuItems}
          style={{ paddingRight: 0 }}
        />
      </Grid>

      <Grid item xs={12} md={8} size={9} pl={4}>
        {selectedSection === "a-traiter" && sortedDataATraiter.length === 0 && (
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

        {selectedSection === "a-traiter" && (
          <SuspenseWrapper fallback={<TableSkeleton />}>
            <SearchableTableSection
              title="A traiter"
              data={sortedDataATraiter}
              isTraite={false}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              handleSectionChange={handleSectionChange}
            />
          </SuspenseWrapper>
        )}

        {selectedSection === "deja-traite" && (
          <SuspenseWrapper fallback={<TableSkeleton />}>
            <SearchableTableSection
              title="Déjà traité"
              data={sortedDataTraite}
              isTraite={true}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </SuspenseWrapper>
        )}
      </Grid>
    </Grid>
  );
}

export default function Page() {
  return (
    <div className="fr-container">
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
