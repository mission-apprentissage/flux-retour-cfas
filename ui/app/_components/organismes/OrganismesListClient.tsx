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
import { useOrganisationOrganisme, useOrganisationOrganismes, useOrganismesNormalizedLists } from "@/hooks/organismes";

import { IndicateursOrganisationsOrganismes, IndicateursOrganisme } from "./IndicateursOrganismes";
import styles from "./organismes.module.scss";
import { OrganismesFaq } from "./OrganismesFaq";
import { OrganismesTableClient } from "./OrganismesTableClient";

function getHeaderTitleFromOrganisationType(type?: IOrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION":
      return "Mes organismes";
    case "TETE_DE_RESEAU":
      return "Les organismes de mon réseau";
    case "DREETS":
    case "DDETS":
    case "ACADEMIE":
      return "Les organismes de mon territoire";
    case "ADMINISTRATEUR":
      return "Tous les organismes";
    default:
      return "Mes organismes";
  }
}

interface OrganismesListClientProps {
  modePublique?: boolean;
  organismeId?: string;
}

export default function OrganismesListClient({ modePublique = false, organismeId }: OrganismesListClientProps) {
  const { user } = useAuth();
  const organisationType = user?.organisation?.type as IOrganisationType | undefined;

  const { organisme: ownOrganisme } = useOrganisationOrganisme(
    !modePublique && organisationType === "ORGANISME_FORMATION"
  );
  const { organismes: organisationOrganismes } = useOrganisationOrganismes(!modePublique);
  const { data: organismesPubliques } = useQuery<Organisme[]>({
    queryKey: ["organismes", organismeId, "organismes"],
    queryFn: () => _get(`/api/v1/organismes/${organismeId}/organismes`),
    enabled: modePublique && !!organismeId,
  });

  const organismes = modePublique ? organismesPubliques : organisationOrganismes;

  const prominentOrganismeId = modePublique ? organismeId : ownOrganisme?._id;

  const organismesNormalized = useOrganismesNormalizedLists(organismes ?? []);
  const allOrganismes = useMemo(() => {
    if (!prominentOrganismeId) return organismesNormalized.allOrganismes;
    return organismesNormalized.allOrganismes.map((organisme) =>
      organisme._id === prominentOrganismeId ? { ...organisme, prominent: true } : organisme
    );
  }, [organismesNormalized.allOrganismes, prominentOrganismeId]);

  if (!organismes) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title={modePublique ? "Ses organismes" : getHeaderTitleFromOrganisationType(organisationType)}
        intro={
          <>
            Retrouvez ci-dessous les <b>{organismesNormalized.allOrganismes.length}</b> établissements{" "}
            {organisationType === "ORGANISME_FORMATION" ? (
              <>sous votre gestion et la nature de chacun.</>
            ) : organisationType === "TETE_DE_RESEAU" ? (
              <>de votre réseau, ainsi que le nombre de formations dispensées par chacun.</>
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
        showFilterNature
        showFilterTransmission
        showFilterQualiopi
        showFilterLocalisation
        showFilterEtat
        showFilterUai
      />

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
                Notre équipe vous accompagne dans le déploiement du Tableau de bord de l’apprentissage. Nous organisons
                des webinaires réguliers avec les CFA de votre{" "}
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
    </div>
  );
}
