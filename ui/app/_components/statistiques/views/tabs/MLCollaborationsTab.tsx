"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ORGANISATION_TYPE } from "shared/constants";

import { useAuth } from "@/app/_context/UserContext";

import { CollabMensuelChart } from "../../charts/CollabMensuelChart";
import { DetailsDossiersTraitesPieChart } from "../../charts/DetailsDossiersTraitesPieChart";
import { isLoadingVariation } from "../../hooks/useLoadingVariation";
import { useCollaborationMensuelStats, useCollaborationSegmentStats } from "../../hooks/useStatsQueries";
import { CollabObjectifsBlock } from "../../sections/CollaborationChartBlocks";
import { CollaborationsListCard } from "../../sections/CollaborationsListCard";
import { CollabCfaOrigineTable } from "../../tables/CollabCfaOrigineTable";
import { NoDataMessage } from "../../ui/NoDataMessage";
import { PeriodSelector, type Period } from "../../ui/PeriodSelector";
import { StatsErrorHandler } from "../../ui/StatsErrorHandler";

import styles from "./MLCollaborationsTab.module.css";

interface MLCollaborationsTabProps {
  mlId: string;
  mlDepartement?: string;
  action?: ReactNode;
}

function Carte({ titre, children }: { titre: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.carte}>
      <h3 className={styles.titreCarte}>{titre}</h3>
      {children}
    </section>
  );
}

function Kpi({ label, tooltip, valeur }: { label: string; tooltip?: string; valeur: ReactNode }) {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValeur}>
        {valeur}
        {tooltip && <Tooltip kind="hover" title={tooltip} />}
      </strong>
    </div>
  );
}

const formatJours = (jours: number | null) =>
  jours === null ? "—" : `${jours.toLocaleString("fr-FR")} ${jours > 1 ? "jours" : "jour"}`;

const VUE_PARAM = "collab_vue";

function useVueCollaborations(listeAutorisee: boolean) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const vue = listeAutorisee && searchParams?.get(VUE_PARAM) === "liste" ? "liste" : "chiffres";
  const setVue = (nouvelle: "chiffres" | "liste") => {
    const params = new URLSearchParams(searchParams?.toString());
    if (nouvelle === "liste") params.set(VUE_PARAM, "liste");
    else params.delete(VUE_PARAM);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  return [vue, setVue] as const;
}

/** Même règle que le serveur : pas de liste nominative pour l'ARML, ni pour une DDETS hors de son département. */
const peutVoirListe = (
  organisation: { type?: string; code_departement?: string } | undefined,
  mlDepartement?: string
) =>
  organisation?.type !== ORGANISATION_TYPE.ARML &&
  (organisation?.type !== ORGANISATION_TYPE.DDETS || organisation.code_departement === mlDepartement);

export function MLCollaborationsTab({ mlId, mlDepartement, action }: MLCollaborationsTabProps) {
  const { user } = useAuth();
  const listeAutorisee = peutVoirListe(
    user?.organisation as { type?: string; code_departement?: string },
    mlDepartement
  );
  const [vue, setVue] = useVueCollaborations(listeAutorisee);

  return (
    <div>
      <h2 className={styles.titre}>Suivi des collaborations avec les CFA</h2>
      {listeAutorisee && (
        <SegmentedControl
          hideLegend
          legend="Affichage des collaborations"
          className={styles.bascule}
          segments={[
            {
              label: "Vue chiffrée",
              iconId: "fr-icon-bar-chart-box-line",
              nativeInputProps: { checked: vue === "chiffres", onChange: () => setVue("chiffres") },
            },
            {
              label: "Détails des collaborations",
              iconId: "fr-icon-list-unordered",
              nativeInputProps: { checked: vue === "liste", onChange: () => setVue("liste") },
            },
          ]}
        />
      )}
      {vue === "liste" ? <CollaborationsListCard mlId={mlId} /> : <VueChiffree mlId={mlId} action={action} />}
    </div>
  );
}

function VueChiffree({ mlId, action }: Pick<MLCollaborationsTabProps, "mlId" | "action">) {
  const [period, setPeriod] = useState<Period>("30days");
  const { data, isLoading, isFetching, error } = useCollaborationSegmentStats({ period, mlId });
  const mensuel = useCollaborationMensuelStats({ period, mlId });
  const loadingVariation = isLoadingVariation(isFetching, isLoading);
  const sansCollab = !!data && data.jeunes_envoyes.current === 0 && data.objectifs.total_dossiers === 0;

  return (
    <div>
      <div className={styles.barreOutils}>
        <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
        {action}
      </div>

      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        {sansCollab ? (
          <NoDataMessage message="Aucun dossier de collaboration n'a encore été envoyé à cette Mission Locale." />
        ) : (
          <div className={styles.cartes}>
            <Carte titre="De la demande de collaboration au traitement">
              <div className={styles.kpis}>
                <Kpi label="Total dossiers de collaborations reçus" valeur={data?.jeunes_envoyes.current ?? "—"} />
                <Kpi
                  label="Total dossiers de collaboration traités"
                  valeur={data?.jeunes_contactes.current ?? "—"}
                  tooltip="Un dossier est traité dès qu'une situation est renseignée par la Mission Locale, y compris « à recontacter »."
                />
                <Kpi
                  label="Total jeunes ayant accepté l'accompagnement de la Mission Locale"
                  valeur={data?.jeunes_accompagnement_accepte.current ?? "—"}
                  tooltip="Dossiers pour lesquels un rendez-vous a été pris avec la Mission Locale."
                />
                <Kpi
                  label="Délai moyen de traitement des collaborations"
                  valeur={formatJours(data?.delai_moyen_jours ?? null)}
                  tooltip="Nombre moyen de jours entre l'envoi de la collaboration par le CFA et la première action d'un conseiller de la Mission Locale sur le dossier."
                />
              </div>
            </Carte>

            <Carte titre="Évolution mensuelle">
              <StatsErrorHandler data={mensuel.data} error={mensuel.error} isLoading={mensuel.isLoading}>
                <CollabMensuelChart data={mensuel.data?.mois} loading={mensuel.isLoading} />
              </StatsErrorHandler>
            </Carte>

            <Carte titre="De quels CFA viennent les collaborations ?">
              <CollabCfaOrigineTable mlId={mlId} />
            </Carte>

            {data && (
              <Carte titre="Résultats du traitement des dossiers issus de collaborations CFA">
                <DetailsDossiersTraitesPieChart
                  data={data.resultats}
                  loading={isLoading}
                  loadingVariation={loadingVariation}
                />
                <p className={styles.encart}>
                  <span>Part de jeunes déjà connus des Missions Locales dans les dossiers traités</span>
                  <strong>{data.part_deja_connus} %</strong>
                </p>
              </Carte>
            )}

            {data && <CollabObjectifsBlock data={data} loading={isLoading} className={styles.carte} />}
          </div>
        )}
      </StatsErrorHandler>
    </div>
  );
}
