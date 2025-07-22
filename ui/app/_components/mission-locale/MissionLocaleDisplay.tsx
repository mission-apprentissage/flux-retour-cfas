"use client";

import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { API_EFFECTIF_LISTE } from "shared";

import { MlCard } from "@/app/_components/card/MlCard";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";

import { MonthItem, MonthsData, SelectedSection, EffectifPriorityData } from "../../../common/types/ruptures";
import {
  groupMonthsOlderThanSixMonths,
  sortDataByMonthDescending,
  getTotalEffectifs,
  formatMonthAndYear,
  anchorFromLabel,
} from "../../_utils/ruptures.utils";
import { SearchableTableSection } from "../ruptures/SearchableTableSection";

export function MissionLocaleDisplay({ data }: { data: MonthsData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<SelectedSection>("a-traiter");
  const [activeAnchor, setActiveAnchor] = useState("");

  const aTraiter = data.a_traiter || [];
  const injoignableList = data.injoignable || [];
  const dejaTraite = data.traite || [];

  const groupedDataATraiter = useMemo(() => groupMonthsOlderThanSixMonths(aTraiter), [aTraiter]);
  const groupedInjoignable = useMemo(() => sortDataByMonthDescending(injoignableList), [injoignableList]);
  const sortedDataTraite = useMemo(() => sortDataByMonthDescending(dejaTraite), [dejaTraite]);

  const totalToTreat = useMemo(() => getTotalEffectifs(groupedDataATraiter), [groupedDataATraiter]);
  const totalTraite = useMemo(() => getTotalEffectifs(sortedDataTraite), [sortedDataTraite]);
  const totalInjoignable = useMemo(() => getTotalEffectifs(groupedInjoignable), [groupedInjoignable]);

  useEffect(() => {
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
        const label = monthItem.month === "plus-de-6-mois" ? "+ de 6 mois" : formatMonthAndYear(monthItem.month);
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

        {/* A traiter */}
        {selectedSection === "a-traiter" && groupedDataATraiter.length !== 0 && (
          <SuspenseWrapper fallback={<TableSkeleton />}>
            <SearchableTableSection
              title="A traiter"
              data={groupedDataATraiter}
              priorityData={data.prioritaire.effectifs as EffectifPriorityData[]}
              hadEffectifsPrioritaires={data.prioritaire.hadEffectifsPrioritaires}
              isTraite={false}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              handleSectionChange={handleSectionChange}
              listType={API_EFFECTIF_LISTE.A_TRAITER}
            />
          </SuspenseWrapper>
        )}

        {/* Déjà traité */}
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

        {/* Injoignable */}
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
      </div>
    </div>
  );
}
