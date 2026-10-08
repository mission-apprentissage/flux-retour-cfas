"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import { CollabMensuelChart } from "../../charts/CollabMensuelChart";
import { DetailsDossiersTraitesPieChart } from "../../charts/DetailsDossiersTraitesPieChart";
import { ObjectifsBarChart } from "../../charts/ObjectifsBarChart";
import { SituationsPieChart } from "../../charts/SituationsPieChart";
import { useCfaCollaborations } from "../../hooks/useStatsQueries";
import { NPS_TOOLTIP, NpsJauge } from "../../sections/CfaSatisfactionCard";
import { CfaCollabMlTable } from "../../tables/CfaCollabMlTable";
import { NoDataMessage } from "../../ui/NoDataMessage";
import { StatsErrorHandler } from "../../ui/StatsErrorHandler";

import { Carte, formatJours, Kpi } from "./FicheCollaborations";
import styles from "./FicheCollaborations.module.css";

const SANS_COLLABORATION = "Ce CFA n'a pas fait de collaborations avec les Missions Locales pour le moment.";

export function CfaCollaborationsTab({ organismeId }: { organismeId: string }) {
  return (
    <div>
      <h2 className={styles.titre}>Collaborations avec les Missions Locales</h2>
      <VueChiffree organismeId={organismeId} />
    </div>
  );
}

function VueChiffree({ organismeId }: { organismeId: string }) {
  const { data, isLoading, error } = useCfaCollaborations(organismeId);

  return (
    <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
      {data && data.envoyes === 0 ? (
        <NoDataMessage message={SANS_COLLABORATION} />
      ) : (
        data && (
          <div className={styles.cartes}>
            <Carte titre="De l'envoi par le CFA au rendez-vous en Mission Locale">
              <div className={`${styles.kpis} ${styles.kpis3}`}>
                <Kpi label="Total jeunes envoyés par ce CFA aux Missions Locales" valeur={data.envoyes} />
                <Kpi
                  label="Total jeunes contactés par les Missions Locales"
                  valeur={data.contactes}
                  tooltip="Dossiers pour lesquels la Mission Locale a renseigné une situation, y compris « à recontacter »."
                />
                <Kpi
                  label="Total jeunes ayant accepté l'accompagnement de la Mission Locale"
                  valeur={data.acceptes}
                  tooltip="Dossiers pour lesquels un rendez-vous a été pris avec la Mission Locale."
                />
              </div>
            </Carte>

            <Carte titre="Évolution mensuelle">
              <CollabMensuelChart data={data.mensuel} loading={false} />
            </Carte>

            <Carte titre="À quelles Missions Locales sont envoyées les collaborations ?">
              <CfaCollabMlTable organismeId={organismeId} />
            </Carte>

            <Carte titre="Satisfaction du CFA">
              <div className={styles.satisfaction}>
                <h4 className={styles.sousTitre}>
                  NPS sur la collaboration <Tooltip kind="hover" title={NPS_TOOLTIP} />
                </h4>
                <NpsJauge data={data.nps} avecNombreCfa={false} />
              </div>
            </Carte>

            <Carte titre="Résultats du traitement des dossiers par les Missions Locales">
              <DetailsDossiersTraitesPieChart data={data.resultats} loading={false} />
              <div className={styles.encarts}>
                <p className={styles.encart}>
                  <span>Part de jeunes déjà connus des Missions Locales dans les dossiers traités</span>
                  <strong>{data.part_deja_connus} %</strong>
                </p>
                <p className={styles.encart}>
                  <span>Délai moyen de traitement par les Missions Locales</span>
                  <strong>{formatJours(data.delai_moyen_jours)}</strong>
                </p>
              </div>
            </Carte>

            <Carte titre="La situation du jeune saisie par le CFA">
              <SituationsPieChart data={data.situations} loading={false} />
            </Carte>

            <Carte titre="Les objectifs d'accompagnement sélectionnés par le CFA">
              <p className="fr-text--sm fr-mb-2w">
                Les objectifs d&apos;accompagnement sont cumulatifs : pour un même dossier de jeune, le CFA peut
                sélectionner plusieurs objectifs d&apos;accompagnement par la Mission Locale.
              </p>
              <ObjectifsBarChart data={data.objectifs} loading={false} />
            </Carte>
          </div>
        )
      )}
    </StatsErrorHandler>
  );
}
