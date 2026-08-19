"use client";

import { captureException } from "@sentry/nextjs";
import { useQuery } from "@tanstack/react-query";
import type { CfdInfo } from "shared/models/apis/@types/ApiAlternance";

import { niveauFormationByNiveau } from "@/app/_components/certification/niveauxFormation";
import { _get } from "@/common/httpClient";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";

import styles from "./certification.module.scss";
import { CertificationLabel } from "./CertificationLabel";

export function CfdDetails({ code }: { code: string | null }) {
  const cfdInfoQuery = useQuery(["/api/v1/cfd", code ?? null], async ({ queryKey }) => {
    const [, cfd] = queryKey;
    return cfd ? _get<CfdInfo | null>(`/api/v1/cfd/${cfd}`) : null;
  });

  if (cfdInfoQuery.isLoading) return <p>Chargement…</p>;

  if (cfdInfoQuery.isError) {
    captureException(cfdInfoQuery.error, { extra: { code } });
    return <p>Erreur lors de la récupération des informations CFD</p>;
  }

  if (!cfdInfoQuery.data) return <p>Diplome CFD non trouvée</p>;

  const cfd = cfdInfoQuery.data;

  return (
    <dl className={styles.detailsList}>
      <div className={styles.detailsRow}>
        <dt>Code diplome&nbsp;:</dt>
        <dd>
          <CertificationLabel value={code} />
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Intitulé&nbsp;:</dt>
        <dd>
          <CertificationLabel value={cfd.intitule_long} />
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Niveau de formation&nbsp;:</dt>
        <dd>
          <CertificationLabel
            value={niveauFormationByNiveau[cfd.niveau ?? ""] ?? "Inconnu"}
            level={cfd.niveau ? "info" : "error"}
          />
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Date ouverture&nbsp;:</dt>
        <dd>
          <CertificationLabel value={cfd.date_ouverture ? formatDateDayMonthYear(cfd.date_ouverture) : "Inconnu"} />
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Date fermeture&nbsp;:</dt>
        <dd>
          <CertificationLabel value={cfd.date_fermeture ? formatDateDayMonthYear(cfd.date_fermeture) : "Inconnu"} />
        </dd>
      </div>
    </dl>
  );
}
