"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { CRISP_FAQ, IOrganisationType, SUPPORT_PAGE_ACCUEIL } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PageHeader } from "@/app/_components/page-header/PageHeader";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { useAuth } from "@/app/_context/UserContext";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import {
  useOrganisationIndicateursOrganismes,
  useOrganisationOrganisme,
  useOrganisationOrganismes,
  useOrganismesNormalizedLists,
} from "@/hooks/organismes";

import { IndicateursOrganisationsOrganismes, IndicateursOrganisme } from "./IndicateursOrganismes";
import styles from "./organismes.module.scss";
import { OrganismesFaq } from "./OrganismesFaq";
import { OrganismesTableClient } from "./OrganismesTableClient";
import { getOrganismesListTitle } from "./titre-liste";

interface OrganismesListClientProps {
  modePublique?: boolean;
  organismeId?: string;
}

export default function OrganismesListClient({ modePublique = false, organismeId }: OrganismesListClientProps) {
  const { user } = useAuth();
  const organisationType = user?.organisation?.type as IOrganisationType | undefined;

  // Pour les administrateurs (11 000+ organismes), la liste est paginée côté serveur ;
  // les autres profils conservent le chargement complet de leur périmètre.
  const isServerList = !modePublique && organisationType === "ADMINISTRATEUR";

  const { organisme: ownOrganisme } = useOrganisationOrganisme(
    !modePublique && organisationType === "ORGANISME_FORMATION"
  );
  const { organismes: organisationOrganismes } = useOrganisationOrganismes(!modePublique && !isServerList);
  const { data: organismesPubliques } = useQuery<Organisme[]>({
    queryKey: ["organismes", organismeId, "organismes"],
    queryFn: () => _get(`/api/v1/organismes/${organismeId}/organismes`),
    enabled: modePublique && !!organismeId,
  });
  const indicateursOrganismes = useOrganisationIndicateursOrganismes(isServerList);

  const organismes = modePublique ? organismesPubliques : organisationOrganismes;

  const prominentOrganismeId = modePublique ? organismeId : ownOrganisme?._id;

  const organismesNormalized = useOrganismesNormalizedLists(organismes ?? []);
  const allOrganismes = useMemo(() => {
    if (!prominentOrganismeId) return organismesNormalized.allOrganismes;
    return organismesNormalized.allOrganismes.map((organisme) =>
      organisme._id === prominentOrganismeId ? { ...organisme, prominent: true } : organisme
    );
  }, [organismesNormalized.allOrganismes, prominentOrganismeId]);

  const totalOrganismes = isServerList
    ? (indicateursOrganismes.data?.organismes ?? 0)
    : organismesNormalized.allOrganismes.length;

  if (!isServerList && !organismes) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title={modePublique ? "Ses organismes" : getOrganismesListTitle(organisationType)}
        titleAs={modePublique ? "h2" : "h1"}
        intro={
          <>
            Retrouvez ci-dessous {totalOrganismes > 1 ? "les" : "le"} <b>{totalOrganismes.toLocaleString("fr-FR")}</b>{" "}
            établissement{totalOrganismes > 1 ? "s" : ""}{" "}
            {modePublique ? (
              <>rattaché{totalOrganismes > 1 ? "s" : ""} à cet organisme.</>
            ) : organisationType === "ORGANISME_FORMATION" ? (
              <>sous votre gestion et la nature de chacun.</>
            ) : organisationType === "TETE_DE_RESEAU" ? (
              <>de votre réseau, ainsi que le nombre de formations dispensées par chacun.</>
            ) : organisationType === "ADMINISTRATEUR" ? (
              <>recensés sur le tableau de bord.</>
            ) : (
              <>de votre territoire.</>
            )}
          </>
        }
      />
      <p className={styles.sources}>
        Sources :{" "}
        <a
          href="https://catalogue-apprentissage.intercariforef.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="fr-link"
        >
          Catalogue des offres de formations en apprentissage
        </a>{" "}
        et{" "}
        <a
          href="https://referentiel.apprentissage.onisep.fr/"
          target="_blank"
          rel="noopener noreferrer"
          className="fr-link"
        >
          Référentiel UAI-SIRET des OFA-CFA
        </a>
      </p>
      {organisationType === "ORGANISME_FORMATION" && (
        <>
          <p>Cliquez sur un organisme pour voir en détails les formations dont vous avez la gestion.</p>
          <p>Si des informations vous semblent erronées, veuillez suivre les démarches ci-dessous.</p>
        </>
      )}
      {organisationType === "TETE_DE_RESEAU" && (
        <>
          <p>Cliquez sur un organisme pour voir en détails les formations dont il a la gestion.</p>
          <p>Si des informations vous semblent erronées, veuillez suivre les démarches ci-dessous.</p>
        </>
      )}

      {modePublique && organismeId ? (
        <IndicateursOrganisme organismeId={organismeId} />
      ) : (
        <IndicateursOrganisationsOrganismes />
      )}

      <OrganismesTableClient
        organismes={allOrganismes}
        serverSide={isServerList}
        totalPerimetre={totalOrganismes}
        showFilterNature
        showFilterTransmission
        showFilterQualiopi
        showFilterLocalisation
        showFilterEtat
        showFilterUai
      />

      {organisationType !== "ADMINISTRATEUR" && (
        <div className={styles.faqSection}>
          <div className={styles.faqMain}>
            <h2 className={styles.sectionTitle}>Des anomalies ? Voici les démarches à suivre.</h2>
            <p>Certains organismes de la liste ci-dessus peuvent présenter une ou plusieurs anomalies à corriger.</p>

            <OrganismesFaq organisationType={organisationType} />

            <div className="fr-callout fr-mt-3w">
              <h3 className="fr-callout__title">Vous ne trouvez pas la réponse à vos questions ?</h3>
              <p className="fr-callout__text">
                <a href={CRISP_FAQ} target="_blank" rel="noopener noreferrer" className="fr-link fr-mr-3w">
                  Aide
                </a>
                <DsfrLink href="/referencement-organisme">Voir la page de référencement</DsfrLink>
              </p>
            </div>
          </div>
          <div className={styles.faqAside}>
            {organisationType !== "ORGANISME_FORMATION" && (
              <div className="fr-callout">
                <h3 className="fr-callout__title">Le saviez-vous ?</h3>
                <p className="fr-callout__text">
                  Notre équipe vous accompagne dans le déploiement du Tableau de bord de l’apprentissage. Nous
                  organisons des webinaires réguliers avec les CFA de votre{" "}
                  {organisationType === "TETE_DE_RESEAU" ? <>réseau</> : <>territoire</>}.{" "}
                  <a href={SUPPORT_PAGE_ACCUEIL} target="_blank" rel="noopener noreferrer" className="fr-link">
                    Contactez-nous
                  </a>{" "}
                  !
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
