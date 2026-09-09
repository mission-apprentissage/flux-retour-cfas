"use client";

import { OrganismeSupportInfoJson } from "shared";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";

import { formatDate } from "@/app/_utils/date.utils";
import { NatureOrganismeTag } from "@/app/admin/_components/NatureOrganismeTag";

import { InfoCard, InfoRow } from "./InfoCard";
import styles from "./source-cards.module.scss";
import { SupportBadge, SupportValue } from "./SupportBadge";

function TagList({ values, emptyLabel, level }: { values: string[]; emptyLabel: string; level?: "warning" }) {
  if (values.length === 0) {
    return level === "warning" ? <SupportBadge level="warning" value={emptyLabel} /> : <SupportValue value={null} />;
  }

  return (
    <ul className={styles.tags}>
      {values.map((value) => (
        <li key={value}>
          <SupportBadge value={value} />
        </li>
      ))}
    </ul>
  );
}

export function TdbCard({
  organisme,
  organisation,
}: {
  organisme: OrganismeSupportInfoJson["tdb"];
  organisation: OrganismeSupportInfoJson["organisation"];
}) {
  if (!organisme) {
    return (
      <InfoCard title="Tableau de bord">
        <InfoRow label="Organisme">
          <SupportBadge level="error" value="Non trouvé" />
        </InfoRow>
      </InfoCard>
    );
  }

  const users = organisation?.users ?? [];
  const derniereConnexion = users
    .map((user) => user.last_connection)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);

  return (
    <InfoCard title="Tableau de bord">
      <InfoRow label="Nom">
        <SupportValue value={organisme.nom} level={organisme.nom ? "info" : "error"} />
      </InfoRow>
      <InfoRow label="Réseaux">
        <TagList values={organisme.reseaux ?? []} emptyLabel="Aucun" />
      </InfoRow>
      <InfoRow label="OPCOs">
        <TagList values={organisme.opcos ?? []} emptyLabel="Aucun" level="warning" />
      </InfoRow>
      <InfoRow label="Utilisateurs">
        <SupportValue value={users.length} />
      </InfoRow>
      <InfoRow label="Dernière connexion">
        <SupportValue value={derniereConnexion ? formatDate(derniereConnexion) : "Jamais"} />
      </InfoRow>
      <InfoRow label="Fiabilisation">
        <SupportBadge
          level={organisme.fiabilisation_statut === "FIABLE" ? "success" : "error"}
          value={organisme.fiabilisation_statut === "FIABLE" ? "Fiable" : "Non fiable"}
        />
      </InfoRow>
    </InfoCard>
  );
}

export function TransmissionCard({ organisme }: { organisme: OrganismeSupportInfoJson["tdb"] }) {
  if (!organisme) return null;

  return (
    <InfoCard title="Transmission">
      <InfoRow label="ERPs">
        <TagList values={organisme.erps ?? []} emptyLabel="Aucun" level="warning" />
      </InfoRow>
      <InfoRow label="Première transmission">
        <SupportValue
          value={organisme.first_transmission_date ? formatDate(organisme.first_transmission_date) : "Jamais"}
          level={organisme.first_transmission_date ? "info" : "error"}
        />
      </InfoRow>
      <InfoRow label="Dernière transmission">
        <SupportValue
          value={organisme.last_transmission_date ? formatDate(organisme.last_transmission_date) : "Jamais"}
          level={organisme.last_transmission_date ? "info" : "error"}
        />
      </InfoRow>
      <InfoRow label="Version d’API">
        <SupportBadge
          level={organisme.api_version === "v3" ? "success" : "error"}
          value={organisme.api_version ?? "Aucune"}
        />
      </InfoRow>
    </InfoCard>
  );
}

export function ReferentielCard({ organisme }: { organisme: OrganismeSupportInfoJson["referentiel"] }) {
  if (!organisme) {
    return (
      <InfoCard title="Référentiel">
        <InfoRow label="Organisme">
          <SupportBadge level="error" value="Non trouvé" />
        </InfoRow>
      </InfoCard>
    );
  }

  return (
    <InfoCard title="Référentiel">
      <InfoRow label="UAI">
        <SupportValue value={organisme.uai} level={organisme.uai ? "info" : "error"} />
      </InfoRow>
      <InfoRow label="SIRET">
        <SupportValue value={organisme.siret} />
      </InfoRow>
      <InfoRow label="Raison sociale">
        <SupportValue value={organisme.raison_sociale} />
      </InfoRow>
      <InfoRow label="Enseigne">
        <SupportValue value={organisme.enseigne} />
      </InfoRow>
      <InfoRow label="État administratif">
        <SupportBadge
          level={organisme.etat_administratif === "actif" ? "success" : "error"}
          value={organisme.etat_administratif ?? "Inconnu"}
        />
      </InfoRow>
      <InfoRow label="Adresse">
        <SupportValue value={organisme.adresse?.label} level={organisme.adresse?.label ? "info" : "error"} />
      </InfoRow>
    </InfoCard>
  );
}

export function FormationsCard({
  organisme,
  formations,
}: {
  organisme: OrganismeSupportInfoJson["tdb"];
  formations: OffreFormation[];
}) {
  if (!organisme) return null;

  const nature = organisme.nature ?? "inconnue";
  const formateurs = organisme.organismesFormateurs ?? [];
  const responsables = organisme.organismesResponsables ?? [];
  const formateursPartiels = formateurs.filter((formateur) => formateur.responsabilitePartielle).length;
  const responsablesPartiels = responsables.filter((responsable) => responsable.responsabilitePartielle).length;

  return (
    <InfoCard title="Réseau de formations">
      <InfoRow label="Nature">
        <NatureOrganismeTag nature={nature} />
      </InfoRow>
      <InfoRow label="Formateurs">
        <SupportValue value={formateurs.length} />
        {formateursPartiels > 0 && (
          <SupportBadge
            level="warning"
            value={`dont ${formateursPartiels} partiel${formateursPartiels > 1 ? "s" : ""}`}
          />
        )}
      </InfoRow>
      <InfoRow label="Responsables">
        <SupportValue value={responsables.length} />
        {responsablesPartiels > 0 && (
          <SupportBadge
            level="warning"
            value={`dont ${responsablesPartiels} partiel${responsablesPartiels > 1 ? "s" : ""}`}
          />
        )}
      </InfoRow>
      <InfoRow label="Formations au catalogue">
        <SupportValue value={formations.length} level={formations.length === 0 ? "warning" : "info"} />
      </InfoRow>
    </InfoCard>
  );
}
