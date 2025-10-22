"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useArborescence } from "@/app/_components/france-travail/hooks/useFranceTravailQueries";
import { ISecteurArborescence } from "@/app/_components/france-travail/types";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";

function FTSideMenu({
  secteurs,
  totalATraiter,
  dejaTraiteCount,
  selectedSecteur,
}: {
  secteurs: ISecteurArborescence[];
  totalATraiter: number;
  dejaTraiteCount: number;
  selectedSecteur: number | null;
}) {
  const sideMenuItems = useMemo(() => {
    return [
      {
        text: `À traiter (${totalATraiter})`,
        linkProps: {
          href: "/france-travail",
        },
        isActive: false,
        expandedByDefault: true,
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
      },
    ];
  }, [secteurs, totalATraiter, dejaTraiteCount, selectedSecteur]);

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
    return pathname?.includes("/effectif/");
  }, [pathname]);

  const selectedSecteur = useMemo(() => {
    const match = pathname?.match(/\/france-travail\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [pathname]);

  const { data: arborescenceData, error: arboError, isLoading: arboLoading } = useArborescence();

  const secteurs = arborescenceData?.a_traiter.secteurs ?? [];
  const totalATraiter = arborescenceData?.a_traiter.total ?? 0;
  const dejaTraiteCount = arborescenceData?.traite ?? 0;

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

  if (arboLoading) {
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
          />
        </div>

        <div className="fr-col-12 fr-col-md-9">{children}</div>
      </div>
    </div>
  );
}
