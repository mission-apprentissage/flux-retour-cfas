"use client";

import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useQuery } from "@tanstack/react-query";
import { IOrganisationCreate } from "shared";

import { InfoTransmissionDonnees } from "@/app/_components/organismes/InfoTransmissionDonnees";
import { useAuth } from "@/app/_context/UserContext";
import { _get, _post } from "@/common/httpClient";
import { useOrganisme } from "@/hooks/organismes";

import styles from "./dashboard.module.scss";
import { AlertDuplicatsTag, InfoFiabilisationTag, InfoTransmissionDecaTag } from "./OrganismeStatusTags";

function getListeOrganismesLabel(organisationType?: string): string {
  switch (organisationType) {
    case "TETE_DE_RESEAU":
      return "Les organismes de mon réseau";
    case "DREETS":
    case "DDETS":
    case "ACADEMIE":
      return "Les organismes de mon territoire";
    case "ADMINISTRATEUR":
      return "Tous les organismes";
    default:
      return "Organismes";
  }
}

export function OrganismeFicheHeader({ organismeId }: { organismeId: string }) {
  const { user } = useAuth();
  const organisationType = (user?.organisation as any)?.type;
  const isAdmin = organisationType === "ADMINISTRATEUR";

  const { organisme } = useOrganisme(organismeId);

  const { data: duplicates } = useQuery<any>({
    queryKey: ["organismes", organismeId, "duplicates"],
    queryFn: () => _get(`/api/v1/organismes/${organismeId}/duplicates`),
    enabled: !!organismeId,
  });

  const { data: indicateursEffectifs } = useQuery<any>({
    queryKey: ["organismes", organismeId, "indicateurs/effectifs"],
    queryFn: () => _get(`/api/v1/organismes/${organismeId}/indicateurs/effectifs`, { params: { date: new Date() } }),
    // Seul InfoTransmissionDecaTag les consomme, et il n'est rendu que pour les organismes hors cible de transmission.
    enabled:
      !!organismeId && !!organisme?.permissions?.indicateursEffectifs && organisme?.is_transmission_target === false,
  });

  if (!organisme) return null;

  const organismeNom = organisme.enseigne || organisme.raison_sociale || "Organisme inconnu";

  return (
    <>
      <Breadcrumb
        currentPageLabel={organismeNom}
        segments={[
          { label: "Accueil", linkProps: { href: "/" } },
          { label: getListeOrganismesLabel(organisationType), linkProps: { href: "/organismes" } },
        ]}
      />

      <div className={styles.ficheHeader}>
        <div>
          <p className={styles.ficheSurtitre}>Tableau de bord de l&apos;organisme</p>
          <h1 className={styles.ficheTitre}>{organismeNom}</h1>
          <div className={styles.badgesRow}>
            {organisme.permissions?.infoTransmissionEffectifs && (
              <InfoTransmissionDonnees
                modeBadge
                lastTransmissionDate={organisme.last_transmission_date}
                permissionInfoTransmissionEffectifs={organisme.permissions?.infoTransmissionEffectifs}
              />
            )}
            {!organisme.is_transmission_target && (
              <InfoTransmissionDecaTag
                date={organisme.last_effectifs_deca_update ? new Date(organisme.last_effectifs_deca_update) : undefined}
                indicateursEffectifs={indicateursEffectifs}
              />
            )}
            {organisme.fiabilisation_statut && (
              <InfoFiabilisationTag fiabilisationStatut={organisme.fiabilisation_statut} />
            )}
            {duplicates?.totalItems > 0 && <AlertDuplicatsTag />}
          </div>
        </div>
        {isAdmin && (
          <Button
            priority="tertiary"
            onClick={async () => {
              await _post<IOrganisationCreate>("/api/v1/admin/impersonate", {
                type: "ORGANISME_FORMATION",
                siret: organisme.siret,
                uai: organisme.uai ?? null,
              });
              location.href = "/";
            }}
          >
            Imposture
          </Button>
        )}
      </div>
    </>
  );
}
