"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";

import { FTHeader } from "@/app/_components/france-travail/FTHeader";
import { useArborescence } from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";

import styles from "./FranceTravailClient.module.css";

type SelectedSection = "a-traiter" | "deja-traite";

export default function FranceTravailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSection, setSelectedSection] = useState<SelectedSection>("a-traiter");
  const [selectedSecteur, setSelectedSecteur] = useState<number | null>(null);

  const { data: arborescenceData, isLoading, error } = useArborescence();

  const secteurs = arborescenceData?.a_traiter.secteurs ?? [];
  const totalATraiter = arborescenceData?.a_traiter.total ?? 0;
  const dejaTraiteCount = arborescenceData?.traite ?? 0;

  const secteurCodes = useMemo(() => secteurs.map((s) => s.code_secteur), [secteurs]);

  useEffect(() => {
    const section = searchParams?.get("section") as SelectedSection | null;
    const secteur = searchParams?.get("secteur");

    if (section && (section === "a-traiter" || section === "deja-traite")) {
      setSelectedSection(section);
    }

    if (secteur) {
      const codeSecteur = Number(secteur);
      if (secteurCodes.includes(codeSecteur)) {
        setSelectedSecteur(codeSecteur);
      }
    }
  }, [searchParams, secteurCodes]);

  const handleSectionChange = (newSection: SelectedSection) => {
    setSelectedSection(newSection);
    setSelectedSecteur(null);
    router.push(`?section=${newSection}`);
  };

  const handleSecteurClick = (codeSecteur: number) => {
    setSelectedSecteur(codeSecteur);
    router.push(`?section=a-traiter&secteur=${codeSecteur}`);
  };

  const sideMenuItems = useMemo(() => {
    return [
      {
        text: `À traiter (${totalATraiter})`,
        linkProps: {
          href: "#a-traiter",
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            handleSectionChange("a-traiter");
          },
        },
        isActive: selectedSection === "a-traiter",
        expandedByDefault: selectedSection === "a-traiter",
        items:
          selectedSection === "a-traiter"
            ? secteurs.map((secteur) => ({
                text: `${secteur.libelle_secteur} (${secteur.count})`,
                linkProps: {
                  href: `#secteur-${secteur.code_secteur}`,
                  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    handleSecteurClick(secteur.code_secteur);
                  },
                },
                isActive: selectedSecteur === secteur.code_secteur,
              }))
            : [],
      },
      {
        text: `Déjà traités (${dejaTraiteCount})`,
        linkProps: {
          href: "#deja-traites",
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            handleSectionChange("deja-traite");
          },
        },
        isActive: selectedSection === "deja-traite",
        expandedByDefault: false,
      },
    ];
  }, [selectedSection, selectedSecteur, totalATraiter, dejaTraiteCount, secteurs]);

  if (isLoading) {
    return <PageWithSidebarSkeleton />;
  }

  if (error) {
    return (
      <div className="fr-container" style={{ ...fr.spacing("padding", { topBottom: "10v" }) }}>
        <Alert
          severity="error"
          title="Erreur de chargement"
          description="Impossible de charger les secteurs d'activité. Veuillez réessayer ultérieurement."
        />
      </div>
    );
  }

  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col-12 fr-col-md-4">
          <SideMenu
            align="left"
            burgerMenuButtonText="Dans cette rubrique"
            sticky={false}
            items={sideMenuItems}
            style={{ maxHeight: "none", overflow: "visible" }}
          />
        </div>

        <div className={`fr-col-12 fr-col-md-8`}>
          {selectedSection === "a-traiter" && !selectedSecteur && (
            <>
              <FTHeader />
              <div className={styles.emptyStateContainer}>
                <div className={styles.emptyStateImageWrapper}>
                  <Image
                    src="/images/france-travail-select-secteur.png"
                    alt="Illustration - Sélectionner un secteur d'activité"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </div>
            </>
          )}

          {selectedSection === "a-traiter" && selectedSecteur && (
            <>
              <FTHeader secteurLabel={secteurs.find((s) => s.code_secteur === selectedSecteur)?.libelle_secteur} />
            </>
          )}

          {selectedSection === "deja-traite" && (
            <>
              <FTHeader />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
