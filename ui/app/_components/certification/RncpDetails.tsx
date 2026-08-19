"use client";

import { captureException } from "@sentry/nextjs";
import { useQuery } from "@tanstack/react-query";
import type { RncpInfo } from "shared/models/apis/@types/ApiAlternance";

import { niveauFormationByNiveau } from "@/app/_components/certification/niveauxFormation";
import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { _get } from "@/common/httpClient";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";

import styles from "./certification.module.scss";
import { CertificationLabel } from "./CertificationLabel";

export function RncpDetails({ code }: { code: string | null }) {
  const rncpInfoQuery = useQuery(["/api/v1/rncp", code ?? null], async ({ queryKey }) => {
    const [, rncp] = queryKey;
    return rncp ? _get<RncpInfo | null>(`/api/v1/rncp/${rncp}`) : null;
  });

  if (rncpInfoQuery.isLoading) return <p>Chargement…</p>;

  if (rncpInfoQuery.isError) {
    captureException(rncpInfoQuery.error, { extra: { code } });
    return <p>Erreur lors de la récupération des informations RNCP</p>;
  }

  if (!rncpInfoQuery.data) return <p>Fiche RNCP non trouvée</p>;

  const rncp = rncpInfoQuery.data;

  return (
    <dl className={styles.detailsList}>
      <div className={styles.detailsRow}>
        <dt>Code RNCP&nbsp;:</dt>
        <dd>
          <CertificationLabel value={rncp.code_rncp} />
        </dd>
        <dd className={styles.detailsAction}>
          <DsfrLink
            href={`https://www.francecompetences.fr/recherche/rncp/${rncp.code_rncp.substring(4)}`}
            arrow="none"
            size="sm"
            external
          >
            Consulter la fiche
          </DsfrLink>
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Intitulé&nbsp;:</dt>
        <dd>
          <CertificationLabel value={rncp.intitule} />
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Actif&nbsp;:</dt>
        <dd>
          <CertificationLabel value={rncp.actif} level={rncp.actif ? "success" : "error"} />
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Niveau de formation&nbsp;:</dt>
        <dd>
          <CertificationLabel
            value={niveauFormationByNiveau[rncp.niveau ?? ""] ?? "Inconnu"}
            level={rncp.niveau ? "info" : "error"}
          />
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Date fin validité&nbsp;:</dt>
        <dd>
          <CertificationLabel
            value={
              rncp.date_fin_validite_enregistrement
                ? formatDateDayMonthYear(rncp.date_fin_validite_enregistrement)
                : "Inconnu"
            }
          />
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Eligible apprentissage&nbsp;:</dt>
        <dd>
          <CertificationLabel
            value={rncp.eligible_apprentissage}
            level={rncp.eligible_professionnalisation ? "success" : "error"}
          />
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Eligible professionnalisation&nbsp;:</dt>
        <dd>
          <CertificationLabel value={rncp.eligible_professionnalisation} />
        </dd>
      </div>

      <div className={styles.detailsRow}>
        <dt>Codes ROME&nbsp;:</dt>
        {rncp.romes.map((rome) => (
          <dd key={rome.code}>
            <CertificationLabel value={`${rome.code}: ${rome.intitule}`} />
          </dd>
        ))}
      </div>
    </dl>
  );
}
