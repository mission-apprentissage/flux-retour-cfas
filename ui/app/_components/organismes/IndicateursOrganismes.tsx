"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { ReactNode } from "react";
import { IOrganismesCount, ORGANISME_INDICATEURS_TYPE, PlausibleGoalType, TypeOrganismesIndicateurs } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { convertOrganismeToExport, organismesExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import { formatNumber } from "@/common/utils/stringUtils";
import { useOrganisationIndicateursOrganismes, useOrganisme } from "@/hooks/organismes";

import styles from "./organismes.module.scss";

const typeToGoalPlausible: { [key: string]: PlausibleGoalType } = {
  [ORGANISME_INDICATEURS_TYPE.SANS_EFFECTIFS]: "telechargement_liste_organismes_sans_effectifs",
  [ORGANISME_INDICATEURS_TYPE.NATURE_INCONNUE]: "telechargement_liste_organismes_nature_inconnue",
  [ORGANISME_INDICATEURS_TYPE.SIRET_FERME]: "telechargement_liste_organismes_siret_ferme",
  [ORGANISME_INDICATEURS_TYPE.UAI_NON_DETERMINE]: "telechargement_liste_organismes_uai_non_determine",
};

function StateIcon({ count }: { count?: number }) {
  return count ? (
    <i className={`fr-icon-alarm-warning-fill ${styles.cardIconAlert}`} aria-hidden="true" />
  ) : (
    <i className={`fr-icon-checkbox-circle-fill ${styles.cardIconOk}`} aria-hidden="true" />
  );
}

function Card({
  label,
  count,
  tooltip,
  icon,
  big = false,
  withDont = true,
  children,
}: {
  label: string;
  count: number;
  tooltip?: ReactNode;
  icon: ReactNode;
  big?: boolean;
  withDont?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={styles.cardBody}>
      {icon}
      <div>
        <p className={styles.cardCountRow}>
          {withDont && <span className={styles.cardDont}>dont</span>}
          <span className={big ? styles.cardCountBig : styles.cardCount}>{formatNumber(count)}</span>
        </p>
        <p className={styles.cardLabel}>
          {label}
          {tooltip ? <Tooltip kind="click" title={tooltip} /> : null}
        </p>
        {children}
      </div>
    </div>
  );
}

function DownloadListLink({ onDownload }: { onDownload: () => void }) {
  return (
    <button type="button" className={`fr-link fr-link--sm ${styles.cardDownloadLink}`} onClick={onDownload}>
      <i className="fr-icon-download-line fr-icon--sm" aria-hidden="true" /> Télécharger la liste
    </button>
  );
}

function Indicateurs({
  data,
  isLoading,
  error,
  downloadOrganismesIndicateurs,
}: {
  data: Partial<IOrganismesCount>;
  isLoading: boolean;
  error: unknown;
  downloadOrganismesIndicateurs: (type: TypeOrganismesIndicateurs) => Promise<void>;
}) {
  if (error) {
    return <p className={styles.indicateursError}>Une erreur est survenue</p>;
  }

  if (isLoading) {
    return (
      <div className={styles.cardsGrid}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`${styles.card} ${i === 0 ? styles.cardBig : ""} ${styles.cardSkeleton}`} />
        ))}
      </div>
    );
  }

  const countSiretFerme = data?.siretFerme || 0;
  const countNatureInconnue = data?.natureInconnue || 0;
  const countSansTransmissions = data?.sansTransmissions || 0;
  const countUaiNonDetermine = data?.uaiNonDeterminee || 0;

  return (
    <div className={styles.cardsGrid}>
      <div className={`${styles.card} ${styles.cardBig}`}>
        <Card
          label="organismes de formation en apprentissage"
          count={data?.organismes ?? 0}
          big
          withDont={false}
          icon={<i className={`fr-icon-building-fill ${styles.cardIconMain}`} aria-hidden="true" />}
        />
        <hr className={styles.cardDivider} />
        <Card
          label="organismes fiables"
          count={data?.fiables ?? 0}
          icon={<StateIcon count={0} />}
          withDont
          tooltip={
            <>
              <p>Est considéré comme fiable un organisme (OFA) :</p>
              <ul>
                <li>qui correspond à un couple UAI-SIRET validé dans le Référentiel UAI-SIRET (ONISEP).</li>
                <li>
                  dont l’état administratif du SIRET de l&apos;établissement, tel qu&apos;il est renseigné sur l’INSEE,
                  est en activité.
                </li>
              </ul>
            </>
          }
        />
      </div>

      <div className={styles.card}>
        <Card
          label="sans effectifs transmis (ou arrêt)"
          count={countSansTransmissions}
          icon={<StateIcon count={countSansTransmissions} />}
        >
          {countSansTransmissions > 0 && (
            <DownloadListLink
              onDownload={() =>
                downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.SANS_EFFECTIFS as "sans_effectifs")
              }
            />
          )}
        </Card>
      </div>

      <div className={styles.card}>
        <Card
          label="avec une nature “inconnue”"
          count={countNatureInconnue}
          icon={<StateIcon count={countNatureInconnue} />}
          tooltip={
            <>
              <p>
                La donnée «&nbsp;Nature&nbsp;» est déduite des relations entre les organismes (base des Carif-Oref). Le{" "}
                <a
                  href="https://catalogue-apprentissage.intercariforef.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link"
                >
                  Catalogue des offres de formations en apprentissage
                </a>{" "}
                identifie trois natures :
              </p>
              <ul>
                <li>Les organismes responsables</li>
                <li>Les organismes responsables et formateur</li>
                <li>Les organismes formateurs</li>
              </ul>
              <p>
                Une nature “inconnue” signifie que l’organisme n’a pas déclaré (ou de manière incomplète) son offre de
                formation dans la base de son Carif-Oref : l’organisme doit référencer ses formations en apprentissage
                auprès du{" "}
                <a
                  href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link"
                >
                  Carif-Oref régional
                </a>{" "}
                ou se rapprocher du{" "}
                <a href="/pdf/Carif-Oref-contacts.pdf" target="_blank" rel="noopener noreferrer" className="fr-link">
                  service dédié aux formations
                </a>
                .
              </p>
            </>
          }
        >
          {countNatureInconnue > 0 && (
            <DownloadListLink
              onDownload={() =>
                downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.NATURE_INCONNUE as "nature_inconnue")
              }
            />
          )}
        </Card>
      </div>

      <div className={styles.card}>
        <Card
          label="avec un Siret fermé"
          count={countSiretFerme}
          icon={<StateIcon count={countSiretFerme} />}
          tooltip={
            <>
              <p>
                Cette information est tirée de la base INSEE. Indication de l’état administratif (en activité ou fermé)
                du Siret de l’établissement, tel qu’il est renseigné sur l’INSEE. Un établissement est affiché
                &quot;Fermé&quot; suite à une cessation d&apos;activité ou un déménagement.
              </p>
              <p>
                En cas de déménagement, une demande d’un nouveau Siret (via le{" "}
                <a href="https://procedures.inpi.fr/?/" target="_blank" rel="noopener noreferrer" className="fr-link">
                  Guichet Unique
                </a>
                ) doit être réalisée et ce dernier doit être communiqué aux différents acteurs publics.
              </p>
              <p>
                En savoir plus sur les démarches à suivre sur la{" "}
                <a href="/referencement-organisme" className="fr-link">
                  page de Référencement
                </a>
                .
              </p>
            </>
          }
        >
          {countSiretFerme > 0 && (
            <DownloadListLink
              onDownload={() => downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.SIRET_FERME as "siret_ferme")}
            />
          )}
        </Card>
      </div>

      <div className={styles.card}>
        <Card
          label="avec une UAI “non déterminée”"
          count={countUaiNonDetermine}
          icon={<StateIcon count={countUaiNonDetermine} />}
          tooltip={
            <ul>
              <li>
                Si l&apos;Unité Administrative Immatriculée (UAI) est répertoriée comme « Non déterminée » alors que
                l&apos;organisme en possède une, veuillez la communiquer en écrivant à{" "}
                <a href="mailto:referentiel-uai-siret@onisep.fr" className="fr-link">
                  referentiel-uai-siret@onisep.fr
                </a>{" "}
                avec la fiche UAI, afin qu&apos;elle soit mise à jour. L&apos;absence de ce numéro bloque
                l&apos;enregistrement des contrats d&apos;apprentissage. L&apos;UAI est recommandée pour être reconnu
                OFA
              </li>
              <li>
                Si l&apos;organisme ne possède pas encore d&apos;UAI, il doit s&apos;adresser aux services du rectorat
                de l&apos;académie où se situe le CFA. Plus d&apos;informations dans la{" "}
                <a href="/referencement-organisme" className="fr-link">
                  page de Référencement
                </a>
                .
              </li>
            </ul>
          }
        >
          {countUaiNonDetermine > 0 && (
            <DownloadListLink
              onDownload={() =>
                downloadOrganismesIndicateurs(ORGANISME_INDICATEURS_TYPE.UAI_NON_DETERMINE as "uai_non_determine")
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export function IndicateursOrganisationsOrganismes() {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const organisationData = useOrganisationIndicateursOrganismes();

  const downloadOrganismesIndicateurs = async (type: TypeOrganismesIndicateurs) => {
    trackPlausibleEvent(typeToGoalPlausible[type]);
    const organismes = await _get(`/api/v1/organisation/organismes/indicateurs/${type}`);
    exportDataAsXlsx(
      `tdb-organismes-${type}.xlsx`,
      organismes.map((organisme) => convertOrganismeToExport(organisme)),
      organismesExportColumns
    );
  };

  return (
    <Indicateurs
      data={organisationData.data || {}}
      isLoading={organisationData.isLoading}
      error={organisationData.error}
      downloadOrganismesIndicateurs={downloadOrganismesIndicateurs}
    />
  );
}

export function IndicateursOrganisme({ organismeId }: { organismeId: string }) {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const organismeData = useOrganisme(organismeId);

  const data = (organismeData.organisme as Organisme & { organismesCount?: IOrganismesCount })?.organismesCount || {};

  const downloadOrganismesIndicateurs = async (type: TypeOrganismesIndicateurs) => {
    trackPlausibleEvent(typeToGoalPlausible[type]);
    const organismes = await _get(`/api/v1/organismes/${organismeId}/indicateurs/organismes/${type}`);
    exportDataAsXlsx(
      `tdb-organismes-${type}.xlsx`,
      organismes.map((organisme) => convertOrganismeToExport(organisme)),
      organismesExportColumns
    );
  };

  return (
    <Indicateurs
      data={data}
      isLoading={organismeData.isLoading}
      error={organismeData.error}
      downloadOrganismesIndicateurs={downloadOrganismesIndicateurs}
    />
  );
}
