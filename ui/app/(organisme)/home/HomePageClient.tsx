"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { DashboardOrganismeClient } from "@/app/_components/dashboard/DashboardOrganismeClient";
import { DashboardTransverseClient } from "@/app/_components/dashboard/DashboardTransverseClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { useAuth } from "@/app/_context/UserContext";
import { useOrganisationOrganisme } from "@/hooks/organismes";

function DashboardOwnOrganisme() {
  const { organisme } = useOrganisationOrganisme();

  if (!organisme) {
    return (
      <div className="fr-container fr-pt-3w fr-pb-6w">
        <TableSkeleton />
      </div>
    );
  }

  return <DashboardOrganismeClient organisme={organisme} modePublique={false} />;
}

export default function HomePageClient() {
  const { user } = useAuth();
  const router = useRouter();
  const organisationType = (user?.organisation as any)?.type;

  useEffect(() => {
    if (organisationType === "ACADEMIE") {
      router.push("/voeux-affelnet");
    }
  }, [organisationType, router]);

  switch (organisationType) {
    case "ORGANISME_FORMATION":
      return <DashboardOwnOrganisme />;
    case "TETE_DE_RESEAU":
    case "DREETS":
    case "DDETS":
    case "ADMINISTRATEUR":
      return <DashboardTransverseClient />;
    default:
      return null;
  }
}
