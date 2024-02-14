import { Text } from "@chakra-ui/react";
import { OrganismeSupportInfo } from "shared";
import { OrganismeJson } from "shared/models/data/@types/Organisme";

import NewTable from "@/modules/indicateurs/NewTable";

import { Label } from "./Label";

type TransmissionsPanelProps = {
  organisme: OrganismeJson | null;
  transmissions: OrganismeSupportInfo["transmissions"];
};

type OrganismeRefProps = {
  self: OrganismeJson;
  organismeRef:
    | OrganismeSupportInfo["transmissions"][number]["source_organisme"]
    | OrganismeSupportInfo["transmissions"][number]["organisme"]
    | undefined
    | null;
};

function OrganismeRef({ organismeRef, self }: OrganismeRefProps) {
  if (organismeRef == null) {
    return <Label level="error" value={"inconnu"} />;
  }

  if (organismeRef.siret === self.siret && organismeRef.uai === self.uai) {
    return <Label value="Moi" />;
  }

  return (
    <Text fontSize="zeta" p="2">
      {organismeRef.nom ?? "Organisme inconnu"}
      {" ("}
      {organismeRef.uai ?? "UAI INCONNUE"}
      {" / "}
      {organismeRef.siret}
      {")"}
    </Text>
  );
}

export function TransmissionsPanel({ organisme, transmissions }: TransmissionsPanelProps) {
  if (organisme == null) return null;

  return (
    <NewTable
      data={transmissions}
      columns={[
        {
          header: "Date",
          accessorKey: "date",
          cell: ({ row }) => <Label value={row.original.date} />,
        },
        {
          header: "Total",
          accessorKey: "total",
          cell: ({ row }) => <Label value={row.original.total} />,
        },
        {
          header: "Error",
          accessorKey: "error",
          cell: ({ row }) => <Label value={row.original.error} />,
        },
        {
          header: "Success",
          accessorKey: "success",
          cell: ({ row }) => <Label value={row.original.success} />,
        },
        {
          size: 500,
          header: "Formateur",
          accessorKey: "organisme",
          cell: ({ row }) => <OrganismeRef organismeRef={row.original.organisme} self={organisme} />,
        },
        {
          size: 500,
          header: "Transmetteur",
          accessorKey: "source_organisme",
          cell: ({ row }) => <OrganismeRef organismeRef={row.original.source_organisme} self={organisme} />,
        },
      ]}
    />
  );
}
