"use client";

import { Suspense } from "react";

import { EncartAdminOrganisme } from "@/app/_components/dashboard/admin/EncartAdminOrganisme";
import { EffectifsListeClient } from "@/app/_components/effectifs/liste/EffectifsListeClient";
import OrganismesListClient from "@/app/_components/organismes/OrganismesListClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import TransmissionsClient from "@/app/_components/transmissions/TransmissionsClient";
import { useOrganisme } from "@/hooks/organismes";

import styles from "./FicheInfosTab.module.css";

export function CfaEffectifsTab({ organismeId }: { organismeId: string }) {
  const { organisme } = useOrganisme(organismeId);
  return organisme ? <EffectifsListeClient organisme={organisme} modePublique /> : <TableSkeleton />;
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
  const { organisme } = useOrganisme(organismeId);
  return (
    <div>
      <h2 className={styles.titre}>Paramètres réservés aux administrateurs TBA</h2>
      {organisme ? <EncartAdminOrganisme organisme={organisme} /> : <TableSkeleton />}
    </div>
  );
}
