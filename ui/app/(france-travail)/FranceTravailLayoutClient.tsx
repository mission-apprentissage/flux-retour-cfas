"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useArborescence, useMoisTraites } from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import { ISecteurArborescence, IMoisTraite } from "@/app/_components/france-travail/types";
import { formatMoisLabel } from "@/app/_components/france-travail/utils/dateFormatting";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";

function FTSideMenu({
  secteurs,
  totalATraiter,
  dejaTraiteCount,
  selectedSecteur,
  moisList,
  selectedMois,
  isDejaTraitesPage,
}: {
  secteurs: ISecteurArborescence[];
  totalATraiter: number;
  dejaTraiteCount: number;
  selectedSecteur: number | null;
  moisList: IMoisTraite[];
  selectedMois: string | null;
  isDejaTraitesPage: boolean;
}) {
  const sideMenuItems = useMemo(() => {
    return [
      {
        text: `À traiter (${totalATraiter})`,
        linkProps: {
          href: "/france-travail",
        },
        isActive: false,
        expandedByDefault: !isDejaTraitesPage,
        items: secteurs.map((secteur) => ({
          text: `${secteur.libelle_secteur} (${secteur.count})`,
          linkProps: {
            href: `/france-travail/${secteur.code_secteur}`,
          },
          isActive: secteur.code_secteur === selectedSecteur,
        })),
      },
      {
        text: `Déjà traités (${dejaTraiteCount})`,
        linkProps: {
          href: "/france-travail/deja-traites",
        },
        isActive: false,
        expandedByDefault: isDejaTraitesPage,
        items: moisList.map((mois) => ({
          text: `${formatMoisLabel(mois.mois)} (${mois.count})`,
          linkProps: {
            href: `/france-travail/deja-traites?mois=${mois.mois}`,
          },
          isActive: selectedMois !== null && selectedMois === mois.mois,
        })),
      },
    ];
  }, [secteurs, totalATraiter, dejaTraiteCount, selectedSecteur, moisList, selectedMois, isDejaTraitesPage]);

  return (
    <SideMenu
      align="left"
      burgerMenuButtonText="Dans cette rubrique"
      sticky={false}
      items={sideMenuItems}
      style={{ maxHeight: "none", overflow: "visible" }}
    />
  );
}

export function FranceTravailLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isEffectifDetailPage = useMemo(() => {
    return pathname?.includes("/effectif/") ?? false;
  }, [pathname]);

  const isDejaTraitesPage = useMemo(() => {
    return pathname?.includes("/deja-traites") ?? false;
  }, [pathname]);

  const selectedSecteur = useMemo(() => {
    const match = pathname?.match(/\/france-travail\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [pathname]);

  const selectedMois = useMemo(() => {
    if (!pathname?.includes("/deja-traites")) return null;
    const urlParams = new URLSearchParams(pathname.split("?")[1] || "");
    return urlParams.get("mois");
  }, [pathname]);

  const { data: arborescenceData, error: arboError, isLoading: arboLoading } = useArborescence();
  const { data: moisData, isLoading: moisLoading } = useMoisTraites();

  const secteurs = arborescenceData?.a_traiter.secteurs ?? [];
  const totalATraiter = arborescenceData?.a_traiter.total ?? 0;
  const dejaTraiteCount = arborescenceData?.traite ?? 0;
  const moisList = moisData?.mois ?? [];

  if (isEffectifDetailPage) {
    return <div className="fr-container">{children}</div>;
  }

  if (arboError) {
    return (
      <div className="fr-container" style={{ ...fr.spacing("padding", { topBottom: "10v" }) }}>
        <Alert
          severity="error"
          title="Erreur de chargement"
          description="Impossible de charger le menu des secteurs. Veuillez réessayer ultérieurement."
        />
      </div>
    );
  }

  if (arboLoading || (isDejaTraitesPage && moisLoading)) {
    return <PageWithSidebarSkeleton />;
  }

  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col-12 fr-col-md-3">
          <FTSideMenu
            secteurs={secteurs}
            totalATraiter={totalATraiter}
            dejaTraiteCount={dejaTraiteCount}
            selectedSecteur={selectedSecteur}
            moisList={moisList}
            selectedMois={selectedMois}
            isDejaTraitesPage={isDejaTraitesPage}
          />
        </div>

        <div className="fr-col-12 fr-col-md-9">{children}</div>
      </div>
    </div>
  );
}
