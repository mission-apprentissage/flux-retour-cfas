"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useQueries } from "@tanstack/react-query";
import { STATUT_FIABILISATION_ORGANISME } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";

import { EncartAdminOrganisme } from "./admin/EncartAdminOrganisme";
import { CollaborationsMlApercu } from "./CollaborationsMlApercu";
import styles from "./dashboard.module.scss";
import { IndicateursApercu } from "./IndicateursApercu";
import { OrganismeIdentite } from "./OrganismeIdentite";
import { OrganismeNavTabs } from "./OrganismeNavTabs";
import { SuggestFeature } from "./SuggestFeature";

interface DashboardOrganismeClientProps {
  organisme: Organisme;
}

function useOrganismeData(organisme: Organisme) {
  const organismeId = organisme?._id;
  const permissions = organisme?.permissions;

  return useQueries({
    queries: [
      {
        queryKey: ["organismes", organismeId, "indicateurs/effectifs"],
        queryFn: () =>
          _get(`/api/v1/organismes/${organismeId}/indicateurs/effectifs`, { params: { date: new Date() } }),
        // Les indicateurs ne sont rendus que par IndicateursApercu, remplacé par les collaborations ML dès que manageEffectifs.
        enabled: !!organismeId && !!permissions?.indicateursEffectifs && !permissions?.manageEffectifs,
      },
      {
        queryKey: ["organismes", organismeId, "contacts"],
        queryFn: () => _get(`/api/v1/organismes/${organismeId}/contacts`),
        enabled: !!organismeId && !!permissions?.viewContacts,
      },
    ],
  });
}

export function DashboardOrganismeClient({ organisme }: DashboardOrganismeClientProps) {
  const { user } = useAuth();
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const organisation = user?.organisation as any;
  const organisationType = organisation?.type;
  const isAdmin = organisationType === "ADMINISTRATEUR";

  const [indicateursEffectifsQuery, contactsQuery] = useOrganismeData(organisme);

  if (!organisme) return null;

  const indicateursEffectifs = indicateursEffectifsQuery.data as any;
  const contacts = contactsQuery.data as any[] | undefined;

  const isFiable = organisme.fiabilisation_statut === STATUT_FIABILISATION_ORGANISME.FIABLE;
  const indicateursEffectifsPartielsMessage =
    organisme.permissions?.indicateursEffectifs && getIndicateursEffectifsPartielsMessage(organisation, organisme);

  const pageContent = (
    <>
      {!isFiable && (
        <Alert
          severity="warning"
          className="fr-mb-3w"
          title="Cet organisme est considéré comme non fiable"
          description="Vérifiez l'UAI, la nature et l'état du SIRET pour fiabiliser ses données."
        />
      )}

      {organisme.permissions?.indicateursEffectifs && (
        <>
          {organisme.has_transmission_errors && !isAdmin && (
            <Alert
              severity="warning"
              className="fr-mb-3w"
              title={`Bonjour, des erreurs ont été détectées dans vos données${
                organisme.transmission_errors_date
                  ? ` le ${new Date(organisme.transmission_errors_date).toLocaleDateString()}`
                  : ""
              }`}
              description={
                <>
                  Consultez votre{" "}
                  <DsfrLink
                    href="/transmissions"
                    arrow="none"
                    onClick={() => trackPlausibleEvent("televersement_clic_rapport_transmission")}
                  >
                    rapport de transmission
                  </DsfrLink>{" "}
                  pour les identifier et les corriger. Une fois la correction effectuée, revenez dans 24h pour vérifier
                  qu’elles ont disparu.
                </>
              }
            />
          )}

          {indicateursEffectifsPartielsMessage && (
            <Alert
              severity="warning"
              className="fr-mb-3w"
              small
              description={`Veuillez noter que certaines formations gérées par cet organisme se situent en dehors de votre ${indicateursEffectifsPartielsMessage}, ce qui peut expliquer l’affichage partiel de données.`}
            />
          )}
        </>
      )}

      <div className={styles.ficheGrid}>
        <section className={styles.ficheCard}>
          <h2 className={styles.ficheCardTitle}>Identité</h2>
          <OrganismeIdentite
            organisme={organisme}
            contacts={organisme.permissions?.viewContacts ? contacts : undefined}
          />
        </section>

        {organisme.permissions?.manageEffectifs ? (
          <CollaborationsMlApercu organismeId={organisme._id} />
        ) : organisme.permissions?.indicateursEffectifs ? (
          <IndicateursApercu indicateurs={indicateursEffectifs} isLoading={indicateursEffectifsQuery.isLoading} />
        ) : (
          <section className={styles.ficheCard}>
            <Alert severity="warning" small description={getForbiddenErrorText(organisation)} />
          </section>
        )}
      </div>

      {organisme.permissions?.indicateursEffectifs && !isAdmin && <SuggestFeature />}

      {isAdmin && <EncartAdminOrganisme organisme={organisme} />}
    </>
  );

  return (
    <OrganismeNavTabs organismeId={organisme._id} activeTab="apercu">
      {pageContent}
    </OrganismeNavTabs>
  );
}

function getForbiddenErrorText(organisation: any): string {
  switch (organisation?.type) {
    case "ORGANISME_FORMATION":
      return "Vous n'avez pas accès aux données de cet organisme.";
    case "TETE_DE_RESEAU":
      return "Vous n'avez pas accès aux données de cet organisme car il n'est pas dans votre réseau.";
    case "DREETS":
      return "Vous n'avez pas accès aux données de cet organisme car il n'est pas dans votre région.";
    case "DDETS":
      return "Vous n'avez pas accès aux données de cet organisme car il n'est pas dans votre département.";
    case "ACADEMIE":
      return "Vous n'avez pas accès aux données de cet organisme car il n'est pas dans votre académie.";
    default:
      return "";
  }
}

/**
 * Retourne le type de restriction si l'organisme contient au moins un organisme formateur
 * hors du territoire / réseau de l'utilisateur authentifié.
 */
function getIndicateursEffectifsPartielsMessage(organisation: any, organisme: Organisme): false | string {
  if (!organisme?.organismesFormateurs || organisme.organismesFormateurs.length === 0) return false;

  switch (organisation?.type) {
    case "TETE_DE_RESEAU":
      return organisme.organismesFormateurs.some((item) => !item.reseaux?.includes(organisation.reseau)) && "réseau";
    case "DREETS":
      return (
        organisme.organismesFormateurs.some((item) => !item.region?.includes(organisation.code_region)) && "région"
      );
    case "DDETS":
      return (
        organisme.organismesFormateurs.some((item) => !item.departement?.includes(organisation.code_departement)) &&
        "département"
      );
    case "ACADEMIE":
      return (
        organisme.organismesFormateurs.some((item) => !item.academie?.includes(organisation.code_academie)) &&
        "académie"
      );
    default:
      return false;
  }
}
