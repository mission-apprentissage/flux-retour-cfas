"use client";

import { Suspense, type ReactNode } from "react";

import { EncartAdminOrganisme } from "@/app/_components/dashboard/admin/EncartAdminOrganisme";
import { EffectifsListeClient } from "@/app/_components/effectifs/liste/EffectifsListeClient";
import OrganismesListClient from "@/app/_components/organismes/OrganismesListClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import TransmissionsClient from "@/app/_components/transmissions/TransmissionsClient";
import { useOrganisme } from "@/hooks/organismes";

import { StatsErrorHandler } from "../../ui/StatsErrorHandler";

import styles from "./FicheInfosTab.module.css";

function AvecOrganisme({
  organismeId,
  children,
}: {
  organismeId: string;
  children: (organisme: NonNullable<ReturnType<typeof useOrganisme>["organisme"]>) => ReactNode;
}) {
  const { organisme, isLoading, error } = useOrganisme(organismeId);
  if (isLoading) return <TableSkeleton />;
  return (
    <StatsErrorHandler data={organisme} error={error} isLoading={false}>
      {organisme && children(organisme)}
    </StatsErrorHandler>
  );
}

export function CfaEffectifsTab({ organismeId }: { organismeId: string }) {
  return (
    <AvecOrganisme organismeId={organismeId}>
      {(organisme) => <EffectifsListeClient organisme={organisme} modePublique />}
    </AvecOrganisme>
  );
}

export function CfaTransmissionsTab({ organismeId }: { organismeId: string }) {
  return <TransmissionsClient modePublique organismeId={organismeId} />;
}

export function CfaOrganismesTab({ organismeId }: { organismeId: string }) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <OrganismesListClient modePublique organismeId={organismeId} />
    </Suspense>
  );
}

export function CfaAdminTab({ organismeId }: { organismeId: string }) {
  return (
    <div>
      <h2 className={styles.titre}>Paramètres réservés aux administrateurs TBA</h2>
      <AvecOrganisme organismeId={organismeId}>
        {(organisme) => <EncartAdminOrganisme organisme={organisme} />}
      </AvecOrganisme>
    </div>
  );
}
