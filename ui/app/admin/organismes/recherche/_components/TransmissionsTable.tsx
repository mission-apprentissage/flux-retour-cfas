"use client";

import { Table } from "@codegouvfr/react-dsfr/Table";
import { OrganismeSupportInfoJson } from "shared";

import { formatDate } from "@/app/_utils/date.utils";

import { SupportBadge, SupportValue } from "./SupportBadge";

type OrganismeIdentity = Pick<NonNullable<OrganismeSupportInfoJson["tdb"]>, "siret" | "uai">;
type Transmission = OrganismeSupportInfoJson["transmissions"][number];

function OrganismeRef({
  organismeRef,
  self,
}: {
  organismeRef: Transmission["organisme"] | Transmission["source_organisme"] | null | undefined;
  self: OrganismeIdentity;
}) {
  if (!organismeRef) return <SupportValue value={null} />;

  if (organismeRef.siret === self.siret && organismeRef.uai === self.uai) {
    return <SupportBadge value="Cet organisme" />;
  }

  return (
    <SupportValue
      value={`${organismeRef.nom ?? "Organisme inconnu"} (${organismeRef.uai ?? "UAI inconnue"} / ${organismeRef.siret})`}
    />
  );
}

export function TransmissionsTable({
  organisme,
  transmissions,
}: {
  organisme: OrganismeIdentity;
  transmissions: Transmission[];
}) {
  if (transmissions.length === 0) {
    return <p>Aucune transmission enregistrée pour cet organisme.</p>;
  }

  return (
    <Table
      caption={`${transmissions.length} journée${transmissions.length > 1 ? "s" : ""} de transmission`}
      bordered
      headers={["Date", "Total", "En échec", "Réussis", "Formateur", "Transmetteur"]}
      data={transmissions.map((transmission) => [
        formatDate(transmission.date),
        transmission.total,
        transmission.error > 0 ? (
          <SupportBadge key="error" level="error" value={transmission.error} />
        ) : (
          <SupportValue key="error" value={0} />
        ),
        transmission.success,
        <OrganismeRef key="organisme" organismeRef={transmission.organisme} self={organisme} />,
        <OrganismeRef key="source" organismeRef={transmission.source_organisme} self={organisme} />,
      ])}
    />
  );
}
