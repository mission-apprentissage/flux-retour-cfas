"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useQueries } from "@tanstack/react-query";
import { CRISP_FAQ, STATUT_FIABILISATION_ORGANISME } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatCivility } from "@/common/utils/stringUtils";

import { CerfaCard } from "./CerfaCard";
import styles from "./dashboard.module.scss";
import { OrganismeIdentite } from "./OrganismeIdentite";
import { SuggestFeature } from "./SuggestFeature";
import { TransmissionOnboarding } from "./TransmissionOnboarding";

interface DashboardOrganismeClientProps {
  organisme: Organisme;
  modePublique: boolean;
}

function useOrganismeData(organisme: Organisme, modePublique: boolean) {
  const organismeId = organisme?._id;
  const permissions = organisme?.permissions;

  return useQueries({
    queries: [
      {
        queryKey: ["organismes", organismeId, "indicateurs/effectifs"],
        queryFn: () =>
          _get(`/api/v1/organismes/${organismeId}/indicateurs/effectifs`, { params: { date: new Date() } }),
        enabled: !!organismeId && !!permissions?.indicateursEffectifs,
      },
      {
        queryKey: ["organismes", organismeId, "duplicates"],
        queryFn: () => _get(`/api/v1/organismes/${organismeId}/duplicates`),
        enabled: !!organismeId,
      },
      {
        queryKey: ["organismes", organismeId, "contacts"],
        queryFn: () => _get(`/api/v1/organismes/${organismeId}/contacts`),
        enabled: !!organismeId && modePublique && !!permissions?.viewContacts,
      },
    ],
  });
}

export function DashboardOrganismeClient({ organisme, modePublique }: DashboardOrganismeClientProps) {
  const { user } = useAuth();
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const organisation = user?.organisation as any;
  const organisationType = organisation?.type;

  const [indicateursEffectifsQuery, duplicatesQuery, contactsQuery] = useOrganismeData(organisme, modePublique);

  if (!organisme) return null;

  const indicateursEffectifs = indicateursEffectifsQuery.data as any;
  const duplicates = duplicatesQuery.data as any;
  const contacts = contactsQuery.data as any[] | undefined;

  const aucunEffectifTransmis = !organisme.first_transmission_date;
  const isFiable = organisme.fiabilisation_statut === STATUT_FIABILISATION_ORGANISME.FIABLE;
  const indicateursEffectifsPartielsMessage =
    organisme.permissions?.indicateursEffectifs && getIndicateursEffectifsPartielsMessage(organisation, organisme);

  return (
    <div>
      <div className={styles.headerBand}>
        <div className="fr-container">
          <div className={styles.headerLayout}>
            <div>
              <h1 className={styles.welcome}>
                <i className="fr-icon-account-circle-fill" aria-hidden="true" />
                Vous êtes sur{" "}
                {modePublique
                  ? "le tableau de bord de"
                  : `votre espace, ${formatCivility((user as any)?.civility)} ${(user as any)?.prenom ?? ""} ${(user as any)?.nom ?? ""}`}
              </h1>

              <p className={styles.organismeName}>
                {organisme.enseigne || organisme.raison_sociale || "Organisme inconnu"}
              </p>

              <OrganismeIdentite
                organisme={organisme}
                modePublique={modePublique}
                organisationType={organisationType}
                indicateursEffectifs={indicateursEffectifs}
                duplicatesCount={duplicates?.totalItems ?? 0}
              />

              {modePublique && organisme.permissions?.viewContacts && contacts && (
                <div className="fr-mt-2w">
                  <p>
                    Responsable identifié de l’établissement&nbsp;:{" "}
                    {contacts.length > 0 ? (
                      <strong>
                        {contacts[0].prenom} {contacts[0].nom?.toUpperCase()}, {contacts[0].fonction} -{" "}
                        {contacts[0].telephone}
                      </strong>
                    ) : (
                      <strong>Inconnu - Compte tableau de bord non créé à ce jour</strong>
                    )}
                  </p>
                  {contacts.length > 0 && (
                    <p>
                      <DsfrLink href={`mailto:${contacts[0].email}`} external>
                        Envoyer un courriel
                      </DsfrLink>
                    </p>
                  )}
                </div>
              )}

              {!isFiable && (
                <Alert
                  severity="warning"
                  className="fr-mt-2w"
                  title="Votre organisme est considéré comme non fiable"
                  description="Vérifiez votre UAI, votre nature et l’état de votre SIRET pour fiabiliser vos données."
                />
              )}
            </div>

            {!modePublique && <CerfaCard organisme={organisme} />}
          </div>
        </div>
      </div>

      <div className="fr-container fr-pt-4w fr-pb-6w">
        {organisme.permissions?.indicateursEffectifs ? (
          <>
            {!modePublique && duplicates && duplicates.totalItems > 0 && (
              <Alert
                severity="warning"
                className="fr-mb-3w"
                title={`Nous avons détecté ${duplicates.totalItems} effectif${duplicates.totalItems > 1 ? "s" : ""} en duplicat.`}
                description={
                  <>
                    <p>Une action de suppression des doublons d’effectifs est nécessaire.</p>
                    <Button
                      priority="secondary"
                      linkProps={{
                        href: "/effectifs/doublons",
                        onClick: () => trackPlausibleEvent("clic_verifier_doublons_effectifs"),
                      }}
                    >
                      Vérifier et supprimer
                    </Button>
                  </>
                }
              />
            )}

            {organisme.has_transmission_errors && (
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
                    pour les identifier et les corriger. Une fois la correction effectuée, revenez dans 24h pour
                    vérifier qu’elles ont disparu.
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

            {!modePublique && !organisme.is_transmission_target && (
              <Alert
                severity="warning"
                className="fr-mb-3w"
                small
                description={
                  <>
                    Votre établissement ne transmet pas encore ses effectifs. Les indicateurs ci-dessous sont issus de
                    DECA (DEpôts des Contrats d’Alternance) et peuvent ne pas refléter la réalité actuelle. Pour
                    afficher des effectifs à jour, veuillez{" "}
                    <DsfrLink href="/parametres" arrow="none">
                      paramétrer
                    </DsfrLink>{" "}
                    votre moyen de transmission. Lire la FAQ{" "}
                    <DsfrLink href={CRISP_FAQ} arrow="none" external>
                      « Comment transmettre ? »
                    </DsfrLink>
                  </>
                }
              />
            )}

            {aucunEffectifTransmis &&
              !modePublique &&
              (!organisme.mode_de_transmission ? (
                <div className={styles.alignRight}>
                  <Button priority="secondary" linkProps={{ href: "/parametres" }}>
                    Paramétrer un moyen de transmission
                  </Button>
                </div>
              ) : (
                organisme.mode_de_transmission === "MANUEL" && (
                  <div className={styles.alignRight}>
                    <Button priority="secondary" linkProps={{ href: "/effectifs/televersement" }}>
                      Ajouter via fichier Excel
                    </Button>
                  </div>
                )
              ))}

            {!modePublique && aucunEffectifTransmis && <TransmissionOnboarding />}

            <SuggestFeature />
          </>
        ) : (
          <Alert severity="warning" small description={getForbiddenErrorText(organisation)} />
        )}
      </div>
    </div>
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
