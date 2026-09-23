"use client";

import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

import styles from "./dashboard.module.scss";

interface SuiviMissionLocaleCounts {
  counts?: { collab: number; hors_collab: number; tous: number };
}

interface PaginatedTotal {
  pagination?: { total: number };
}

export function CollaborationsMlApercu({ organismeId }: { organismeId: string }) {
  const { data: suivi, isLoading } = useQuery<SuiviMissionLocaleCounts>({
    queryKey: ["organismes", organismeId, "cfa/suivi-mission-locale", "counts"],
    queryFn: () => _get(`/api/v1/organismes/${organismeId}/cfa/suivi-mission-locale`, { params: { limit: 1 } }),
    enabled: !!organismeId,
  });

  const { data: effectifs } = useQuery<PaginatedTotal>({
    queryKey: ["organismes", organismeId, "cfa/effectifs", "total"],
    queryFn: () => _get(`/api/v1/organismes/${organismeId}/cfa/effectifs`, { params: { limit: 1 } }),
    enabled: !!organismeId,
  });

  const { data: ruptures } = useQuery<PaginatedTotal>({
    queryKey: ["organismes", organismeId, "cfa/effectifs-ruptures", "total"],
    queryFn: () => _get(`/api/v1/organismes/${organismeId}/cfa/effectifs-ruptures`, { params: { limit: 1 } }),
    enabled: !!organismeId,
  });

  const counts = suivi?.counts;

  return (
    <section className={styles.ficheCard}>
      <h2 className={styles.ficheCardTitle}>Collaborations Mission Locale</h2>
      {isLoading ? (
        <p className={styles.statTotal}>Chargement des collaborations…</p>
      ) : (
        <>
          <p className={styles.statTotal}>
            <strong>{counts?.tous ?? 0}</strong> jeune{(counts?.tous ?? 0) > 1 ? "s" : ""} suivi
            {(counts?.tous ?? 0) > 1 ? "s" : ""} avec les Missions Locales
          </p>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{effectifs?.pagination?.total ?? 0}</span>
              <span className={styles.statLabel}>effectifs sur l’année en cours</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{ruptures?.pagination?.total ?? 0}</span>
              <span className={styles.statLabel}>effectifs détectés en rupture</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{counts?.collab ?? 0}</span>
              <span className={styles.statLabel}>collaborations envoyées par le CFA</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{counts?.hors_collab ?? 0}</span>
              <span className={styles.statLabel}>jeunes contactés hors collaboration</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
