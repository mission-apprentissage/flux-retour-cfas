"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode } from "react";
import { IOrganismesCount } from "shared";

import { convertOrganismesFiltersToQuery, OrganismesFilters } from "@/common/filters/organismes-filters";
import { Organisme } from "@/common/internal/Organisme";
import { formatNumber } from "@/common/utils/stringUtils";
import { useOrganisationIndicateursOrganismes, useOrganisme } from "@/hooks/organismes";

import styles from "./organismes.module.scss";

const FILTRES_ANOMALIES: Record<string, Partial<OrganismesFilters>> = {
  sans_effectifs: { transmission: ["jamais", "arrete"] },
  nature_inconnue: { nature: ["inconnue"] },
  siret_ferme: { ferme: [true] },
  uai_non_determine: { etatUAI: [false] },
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

function FilterListLink({ onFilter }: { onFilter: () => void }) {
  return (
    <button type="button" className={`fr-link fr-link--sm ${styles.cardDownloadLink}`} onClick={onFilter}>
      Voir dans la liste <i className="fr-icon-arrow-right-line fr-icon--sm" aria-hidden="true" />
    </button>
  );
}

function Indicateurs({
  data,
  isLoading,
  error,
}: {
  data: Partial<IOrganismesCount>;
  isLoading: boolean;
  error: unknown;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Applique le filtre de l'anomalie en conservant la recherche et le tri en cours, et en revenant en page 1.
  const applyFilter = (type: keyof typeof FILTRES_ANOMALIES) => {
    const query = new URLSearchParams({
      ...(searchParams?.get("search") ? { search: searchParams.get("search") as string } : {}),
      ...(searchParams?.get("sort") ? { sort: searchParams.get("sort") as string } : {}),
      ...(convertOrganismesFiltersToQuery(FILTRES_ANOMALIES[type]) as Record<string, string>),
    });
    router.replace(`?${query.toString()}`, { scroll: false });
  };

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
          {countSansTransmissions > 0 && <FilterListLink onFilter={() => applyFilter("sans_effectifs")} />}
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
          {countNatureInconnue > 0 && <FilterListLink onFilter={() => applyFilter("nature_inconnue")} />}
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
          {countSiretFerme > 0 && <FilterListLink onFilter={() => applyFilter("siret_ferme")} />}
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
          {countUaiNonDetermine > 0 && <FilterListLink onFilter={() => applyFilter("uai_non_determine")} />}
        </Card>
      </div>
    </div>
  );
}

export function IndicateursOrganisationsOrganismes() {
  const organisationData = useOrganisationIndicateursOrganismes();

  return (
    <Indicateurs
      data={organisationData.data || {}}
      isLoading={organisationData.isLoading}
      error={organisationData.error}
    />
  );
}

export function IndicateursOrganisme({ organismeId }: { organismeId: string }) {
  const organismeData = useOrganisme(organismeId);

  const data = (organismeData.organisme as Organisme & { organismesCount?: IOrganismesCount })?.organismesCount || {};

  return <Indicateurs data={data} isLoading={organismeData.isLoading} error={organismeData.error} />;
}
