"use client";

import { Table } from "@codegouvfr/react-dsfr/Table";
import { OrganismeSupportInfoJson } from "shared";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate } from "@/app/_utils/date.utils";

import styles from "./formation-details.module.scss";
import { InfoCard, InfoRow } from "./InfoCard";
import { SupportBadge, SupportValue } from "./SupportBadge";

type OrganismeIdentity = Pick<NonNullable<OrganismeSupportInfoJson["tdb"]>, "siret" | "uai">;

function OrganismeRef({
  organismeRef,
  self,
}: {
  organismeRef: OffreFormation["formateur"] | OffreFormation["gestionnaire"] | null | undefined;
  self: OrganismeIdentity;
}) {
  if (!organismeRef) return <SupportValue value={null} />;

  if (organismeRef.siret === self.siret && organismeRef.uai === self.uai) {
    return <SupportBadge value="Cet organisme" />;
  }

  return (
    <SupportValue
      value={`${organismeRef.enseigne ?? organismeRef.raison_sociale ?? "Organisme inconnu"} (${organismeRef.uai ?? "UAI inconnue"} / ${organismeRef.siret})`}
    />
  );
}

export function FormationDetails({
  organisme,
  formation,
}: {
  organisme: OrganismeIdentity;
  formation: Partial<OffreFormation>;
}) {
  const adresse = formation.lieu_formation
    ? [
        formation.lieu_formation.adresse.adresse,
        formation.lieu_formation.adresse.code_postal,
        formation.lieu_formation.adresse.localite,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  return (
    <div className={styles.details}>
      <InfoCard title="Détails de la formation">
        <InfoRow label="Clé ministère éducatif">
          <code className={styles.code}>{formation.cle_ministere_educatif ?? "Non renseignée"}</code>
        </InfoRow>
        <InfoRow label="Date de fermeture du CFD">
          <SupportValue
            value={formation.cfd?.date_fermeture ? formatDate(formation.cfd.date_fermeture) : "Aucune"}
            level={formation.cfd ? "info" : "error"}
          />
        </InfoRow>
        <InfoRow label="Niveau d’entrée obligatoire">
          <SupportValue value={formation.niveau?.entree_obligatoire} />
        </InfoRow>
        <InfoRow label="Durée incohérente">
          {formation.duree?.incoherente ? (
            <SupportBadge level="warning" value="Oui" />
          ) : (
            <SupportValue value={formation.duree ? "Non" : null} />
          )}
        </InfoRow>
        <InfoRow label="Nature">
          <SupportValue value={formation.nature?.libelle} />
          {formation.nature?.code && <SupportBadge value={`Code ${formation.nature.code}`} />}
        </InfoRow>
        <InfoRow label="Onisep">
          {formation.onisep ? (
            <DsfrLink href={formation.onisep.url} arrow="none" external>
              {formation.onisep.intitule}
            </DsfrLink>
          ) : (
            <SupportValue value={null} />
          )}
        </InfoRow>
        <InfoRow label="Entièrement à distance">
          <SupportValue value={formation.entierement_a_distance} />
        </InfoRow>
        <InfoRow label="Responsable">
          <OrganismeRef self={organisme} organismeRef={formation.gestionnaire} />
        </InfoRow>
        <InfoRow label="Formateur">
          <OrganismeRef self={organisme} organismeRef={formation.formateur} />
        </InfoRow>
        <InfoRow label="Lieu de formation">
          <SupportValue value={adresse} />
        </InfoRow>
      </InfoCard>

      {formation.sessions && formation.sessions.length > 0 && (
        <Table
          caption={`${formation.sessions.length} session${formation.sessions.length > 1 ? "s" : ""}`}
          bordered
          headers={["Début", "Fin"]}
          data={formation.sessions.map((session) => [formatDate(session.debut), formatDate(session.fin)])}
        />
      )}

      {formation.rncps && formation.rncps.length > 0 && (
        <Table
          caption={`${formation.rncps.length} fiche${formation.rncps.length > 1 ? "s" : ""} RNCP`}
          bordered
          headers={[
            "Code",
            "Intitulé",
            "Statut",
            "Éligible apprentissage",
            "Éligible professionnalisation",
            "Fin de validité",
          ]}
          data={formation.rncps.map((rncp) => [
            rncp.code,
            rncp.intitule,
            <SupportBadge
              key="statut"
              level={rncp.active_inactive === "ACTIVE" ? "success" : "error"}
              value={rncp.active_inactive === "ACTIVE" ? "Active" : "Inactive"}
            />,
            <SupportBadge
              key="apprentissage"
              level={rncp.eligible_apprentissage ? "success" : "error"}
              value={rncp.eligible_apprentissage ?? false}
            />,
            <SupportBadge
              key="professionnalisation"
              level={rncp.eligible_professionnalisation ? "success" : "error"}
              value={rncp.eligible_professionnalisation ?? false}
            />,
            rncp.date_fin_validite_enregistrement ? formatDate(rncp.date_fin_validite_enregistrement) : "Inconnue",
          ])}
        />
      )}
    </div>
  );
}
