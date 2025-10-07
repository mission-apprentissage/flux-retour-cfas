"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { usePathname } from "next/navigation";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { API_EFFECTIF_LISTE } from "shared";

import { MlCard } from "@/app/_components/card/MlCard";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import {
  sortDataByMonthDescending,
  getTotalEffectifs,
  formatMonthAndYear,
  anchorFromLabel,
  get180DaysAgo,
} from "@/app/_utils/ruptures.utils";
import { _get } from "@/common/httpClient";
import { MonthItem, MonthsData, SelectedSection, EffectifPriorityData } from "@/common/types/ruptures";

import { EffectifsSearchableTable } from "../shared/ui/EffectifsSearchableTable";
import notificationStyles from "../shared/ui/NotificationBadge.module.css";

import { DownloadSection } from "./DownloadSection";
import { useMonthDownload } from "./useMonthDownload";

interface EffectifsListViewProps {
  data: MonthsData;
  initialStatut?: string | null;
  initialRuptureDate?: string | null;
}

export function EffectifsListView({ data, initialStatut, initialRuptureDate }: EffectifsListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { downloadMonth, downloadError, setDownloadError } = useMonthDownload();

  const getInitialSection = (statut: string | null): SelectedSection => {
    switch (statut) {
      case "a_traiter":
      case "a_traiter_prioritaire":
        return "a-traiter";
      case "injoignable":
      case "injoignable_prioritaire":
        return "injoignable";
      case "traite":
      case "traite_prioritaire":
        return "deja-traite";
      default:
        return "a-traiter";
    }
  };

  const getInitialRuptureDate = (date: string | null): string => {
    if (!date || initialStatut?.endsWith("prioritaire")) return "";
    const parsedDate = new Date(date);
    const cutoff180Days = get180DaysAgo();

    if (parsedDate < cutoff180Days) {
      return "+-de-180j";
    }

    return anchorFromLabel(formatMonthAndYear(date));
  };

  const [selectedSection, setSelectedSection] = useState<SelectedSection>(getInitialSection(initialStatut || null));
  const [activeAnchor, setActiveAnchor] = useState("");

  const pathname = usePathname();
  const isCfaPage = pathname?.startsWith("/cfa");

  const aTraiter = data.a_traiter || [];
  const injoignableList = data.injoignable || [];
  const dejaTraite = data.traite || [];

  const groupedDataATraiter = useMemo(() => sortDataByMonthDescending(aTraiter), [aTraiter]);
  const groupedInjoignable = useMemo(() => sortDataByMonthDescending(injoignableList), [injoignableList]);
  const sortedDataTraite = useMemo(() => sortDataByMonthDescending(dejaTraite), [dejaTraite]);

  const totalToTreat = useMemo(() => getTotalEffectifs(groupedDataATraiter), [groupedDataATraiter]);
  const totalTraite = useMemo(() => getTotalEffectifs(sortedDataTraite), [sortedDataTraite]);
  const totalInjoignable = useMemo(() => getTotalEffectifs(groupedInjoignable), [groupedInjoignable]);

  const countUnreadNotifications = (items: MonthItem[]): number => {
    return items.reduce((total, month) => {
      return total + month.data.filter((effectif) => effectif.unread_by_current_user === true).length;
    }, 0);
  };

  const unreadNotificationsTraite = useMemo(() => {
    return countUnreadNotifications(sortedDataTraite);
  }, [sortedDataTraite]);

  useEffect(() => {
    setTimeout(() => {
      handleAnchorClick(getInitialRuptureDate(initialRuptureDate || null));
    }, 0);
  }, [initialRuptureDate]);

  useEffect(() => {
    if (!activeAnchor) {
      if (selectedSection === "a-traiter" && groupedDataATraiter.length > 0) {
        const firstLabel =
          groupedDataATraiter[0].month === "plus-de-180-j"
            ? "+ de 180j"
            : formatMonthAndYear(groupedDataATraiter[0].month);
        setActiveAnchor(anchorFromLabel(firstLabel));
      } else if (selectedSection === "deja-traite" && sortedDataTraite.length > 0) {
        const label = formatMonthAndYear(sortedDataTraite[0].month);
        setActiveAnchor(anchorFromLabel(label));
      } else if (selectedSection === "injoignable" && groupedInjoignable.length > 0) {
        const label =
          groupedInjoignable[0].month === "plus-de-180-j"
            ? "+ de 180j"
            : formatMonthAndYear(groupedInjoignable[0].month);
        setActiveAnchor(anchorFromLabel(label));
      }
    }
  }, [activeAnchor, selectedSection, groupedDataATraiter, sortedDataTraite, groupedInjoignable]);

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
        const label = monthItem.month === "plus-de-180-j" ? "+ de 180j" : formatMonthAndYear(monthItem.month);
        const anchorId = anchorFromLabel(label);
        const displayText =
          monthItem.data.length > 0 ? <strong>{`${label} (${monthItem.data.length})`}</strong> : label;
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

    const items = [
      {
        text: totalToTreat > 0 ? <strong>{`À traiter (${totalToTreat})`}</strong> : `À traiter (${totalToTreat})`,
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
        text: (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span>
              {totalTraite > 0 ? <strong>{`Déjà traité (${totalTraite})`}</strong> : `Déjà traité (${totalTraite})`}
            </span>
            {isCfaPage && unreadNotificationsTraite > 0 && (
              <span className={notificationStyles.notificationBadge}>
                {unreadNotificationsTraite > 99 ? "99+" : unreadNotificationsTraite}
              </span>
            )}
          </span>
        ),
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
    if (!isCfaPage) {
      items.splice(1, 0, {
        text:
          totalInjoignable > 0 ? (
            <strong>{`À recontacter (${totalInjoignable})`}</strong>
          ) : (
            `À recontacter (${totalInjoignable})`
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
      });
    }
    return items;
  }, [
    selectedSection,
    groupedDataATraiter,
    sortedDataTraite,
    groupedInjoignable,
    handleAnchorClick,
    handleSectionChange,
    activeAnchor,
    totalToTreat,
    totalInjoignable,
    totalTraite,
    isCfaPage,
  ]);

  return (
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
        {selectedSection === "a-traiter" && groupedDataATraiter.length === 0 && (
          <MlCard
            title="Il n’y pas de nouveaux jeunes à contacter pour le moment"
            imageSrc="/images/mission-locale-not-treated.svg"
            imageAlt="Personnes discutant et travaillant devant un tableau"
            body={
              <p>
                <strong>Nous vous invitons à vous reconnecter dans 1 semaine</strong> pour prendre connaissance de
                nouvelles situations.
              </p>
            }
          />
        )}

        {selectedSection === "deja-traite" && sortedDataTraite.length === 0 && (
          <MlCard
            title="Vous n’avez traité aucun dossier pour le moment"
            imageSrc="/images/mission-locale-treated.svg"
            imageAlt="Personnes discutant et travaillant dans un bureau"
            body={
              <p>
                <strong>Nous vous invitons à consulter</strong>{" "}
                <a
                  className="fr-link fr-icon-arrow-right-line fr-link--icon-right"
                  href="#"
                  onClick={() => handleSectionChange("a-traiter")}
                >
                  les dossiers à traiter
                </a>
              </p>
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

        {/* À traiter */}
        {selectedSection === "a-traiter" && groupedDataATraiter.length !== 0 && (
          <>
            <h2 className="fr-h2 fr-text--blue-france fr-mb-2w" style={{ color: "var(--text-label-blue-cumulus)" }}>
              À traiter
            </h2>
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
            {!isCfaPage && <DownloadSection listType={API_EFFECTIF_LISTE.A_TRAITER} />}
            <SuspenseWrapper fallback={<TableSkeleton />}>
              <EffectifsSearchableTable
                data={groupedDataATraiter}
                priorityData={data.prioritaire.effectifs as EffectifPriorityData[]}
                hadEffectifsPrioritaires={data.prioritaire.hadEffectifsPrioritaires}
                isTraite={false}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                handleSectionChange={handleSectionChange}
                listType={API_EFFECTIF_LISTE.A_TRAITER}
                onDownloadMonth={downloadMonth}
              />
            </SuspenseWrapper>
          </>
        )}

        {/* Déjà traité */}
        {selectedSection === "deja-traite" && sortedDataTraite.length !== 0 && (
          <>
            <h2 className="fr-h2 fr-text--blue-france fr-mb-2w" style={{ color: "var(--text-label-blue-cumulus)" }}>
              Déjà traité
            </h2>
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
            {!isCfaPage && <DownloadSection listType={API_EFFECTIF_LISTE.TRAITE} />}
            <SuspenseWrapper fallback={<TableSkeleton />}>
              <EffectifsSearchableTable
                data={sortedDataTraite}
                isTraite={true}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                listType={API_EFFECTIF_LISTE.TRAITE}
                onDownloadMonth={downloadMonth}
              />
            </SuspenseWrapper>
          </>
        )}

        {/* Injoignable */}
        {selectedSection === "injoignable" && groupedInjoignable.length !== 0 && (
          <>
            <h2 className="fr-h2 fr-text--blue-france fr-mb-2w" style={{ color: "var(--text-label-blue-cumulus)" }}>
              À recontacter
            </h2>
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
            {!isCfaPage && <DownloadSection listType={API_EFFECTIF_LISTE.INJOIGNABLE} />}
            <SuspenseWrapper fallback={<TableSkeleton />}>
              <EffectifsSearchableTable
                data={groupedInjoignable}
                priorityData={data.injoignable_prioritaire.effectifs as EffectifPriorityData[]}
                hadEffectifsPrioritaires={data.injoignable_prioritaire.hadEffectifsPrioritaires}
                isTraite={false}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                handleSectionChange={handleSectionChange}
                listType={API_EFFECTIF_LISTE.INJOIGNABLE}
                onDownloadMonth={downloadMonth}
              />
            </SuspenseWrapper>
          </>
        )}
      </div>
    </div>
  );
}
