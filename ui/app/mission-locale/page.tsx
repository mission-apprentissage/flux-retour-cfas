"use client";

import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import Grid from "@mui/material/Grid2";
import { useQuery } from "@tanstack/react-query";
import mime from "mime";
import { useState, useMemo, useCallback } from "react";
import { API_TRAITEMENT_TYPE } from "shared";

import { _get, _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";

import { MLHeader } from "./_components/MLHeader";
import { SearchableTableSection } from "./_components/SearchableTableSection";
import { MonthsData, SelectedSection } from "./_components/types";
import { anchorFromLabel, formatMonthAndYear, getTotalEffectifs, sortDataByMonthDescending } from "./_components/utils";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<SelectedSection>("a-traiter");
  const [activeAnchor, setActiveAnchor] = useState("");

  const { data: effectifsData, isLoading } = useQuery<MonthsData>(
    ["effectifs-per-month"],
    () => _get(`/api/v1/organisation/mission-locale/effectifs-per-month`),
    { keepPreviousData: true }
  );

  const aTraiter = effectifsData?.a_traiter || [];
  const dejaTraite = effectifsData?.traite || [];

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

  // Event Handlers
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

  const handleDownload = useCallback(async () => {
    const type = API_TRAITEMENT_TYPE.A_TRAITER;

    const fileName = `Rupturants_TBA_${new Date().toISOString().split("T")[0]}.xlsx`;
    const { data } = await _getBlob(`/api/v1/organisation/mission-locale/export/effectifs?type=${type}`);
    downloadObject(data, fileName, mime.getType("xlsx") ?? "text/plain");
  }, [selectedSection]);

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

  if (isLoading) {
    return null;
  }

  return (
    <div className="fr-container">
      <MLHeader onDownloadClick={handleDownload} />

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
          {selectedSection === "a-traiter" && (
            <SearchableTableSection
              title="A traiter"
              data={sortedDataATraiter}
              isTraite={false}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          )}

          {selectedSection === "deja-traite" && (
            <SearchableTableSection
              title="Déjà traité"
              data={sortedDataTraite}
              isTraite={true}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          )}
        </Grid>
      </Grid>
    </div>
  );
}
