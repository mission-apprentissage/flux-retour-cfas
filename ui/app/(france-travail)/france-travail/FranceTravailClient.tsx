"use client";

import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";

import { FTHeader } from "@/app/_components/france-travail/FTHeader";

import { SECTEURS_FIXTURES, EFFECTIFS_DEJA_TRAITES } from "./fixtures";
import styles from "./FranceTravailClient.module.css";

type SelectedSection = "a-traiter" | "deja-traite";

export default function FranceTravailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSection, setSelectedSection] = useState<SelectedSection>("a-traiter");
  const [selectedSecteur, setSelectedSecteur] = useState<string | null>(null);

  useEffect(() => {
    const section = searchParams?.get("section") as SelectedSection | null;
    const secteur = searchParams?.get("secteur");

    if (section && (section === "a-traiter" || section === "deja-traite")) {
      setSelectedSection(section);
    }

    if (secteur && SECTEURS_FIXTURES.find((s) => s.id === secteur)) {
      setSelectedSecteur(secteur);
    }
  }, [searchParams]);

  const totalATraiter = useMemo(() => {
    return SECTEURS_FIXTURES.reduce((total, secteur) => total + secteur.count, 0);
  }, []);

  const dejaTraiteCount = EFFECTIFS_DEJA_TRAITES.length;

  const handleSectionChange = (newSection: SelectedSection) => {
    setSelectedSection(newSection);
    setSelectedSecteur(null);
    router.push(`?section=${newSection}`);
  };

  const handleSecteurClick = (secteurId: string) => {
    setSelectedSecteur(secteurId);
    router.push(`?section=a-traiter&secteur=${secteurId}`);
  };

  const sideMenuItems = useMemo(
    () => buildSideMenuItems(),
    [selectedSection, selectedSecteur, totalATraiter, dejaTraiteCount]
  );

  function buildSideMenuItems() {
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
            ? SECTEURS_FIXTURES.map((secteur) => ({
                text: `${secteur.label} (${secteur.count})`,
                linkProps: {
                  href: `#secteur-${secteur.id}`,
                  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    handleSecteurClick(secteur.id);
                  },
                },
                isActive: selectedSecteur === secteur.id,
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
              <FTHeader secteurLabel={SECTEURS_FIXTURES.find((s) => s.id === selectedSecteur)?.label} />
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
