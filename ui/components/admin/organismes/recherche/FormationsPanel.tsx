import { Button, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";
import { OrganismeJson } from "shared/models/data/@types/Organisme";

import Table from "@/components/Table/Table";
import { AddFill, SubtractLine } from "@/theme/components/icons";

import { FormationsDetails } from "./FormationDetails";
import { Label } from "./Label";

type FormationsPanelProps = {
  organisme: OrganismeJson | null;
  formations: OffreFormation[];
};

function TextCellComponent({ value }) {
  return (
    <Text fontSize="zeta" fontWeight="bold">
      {value ?? ""}
    </Text>
  );
}

function getNature(formation: OffreFormation, organisme: OrganismeJson) {
  const isResponsable =
    formation.gestionnaire.siret === organisme.siret && formation.gestionnaire.uai === organisme.uai;
  const isFormateur = formation.formateur.siret === organisme.siret && formation.formateur.uai === organisme.uai;

  if (isResponsable && isFormateur) return "Responsable Formateur";

  return isResponsable ? "Responsable" : "Formateur";
}

export function FormationsPanel({ organisme, formations }: FormationsPanelProps) {
  const sortedFormations = useMemo(() => {
    const intl = new Intl.Collator("fr");

    const result = [...formations];
    result.sort((a, b) => {
      if (!a.cfd && !b.cfd) return intl.compare(a.cle_ministere_educatif, b.cle_ministere_educatif);
      if (!a.cfd) return 1;
      if (!b.cfd) return -1;

      if (a.cfd.code !== b.cfd.code) return intl.compare(a.cfd.code, b.cfd.code);

      return intl.compare(a.annee?.num ?? "", b.annee?.num ?? "");
    });
    return result;
  }, [formations]);

  if (organisme == null) return null;

  return (
    <Table
      data={sortedFormations}
      columns={[
        {
          header: "CFD",
          accessorKey: "cfd",
          cell: ({ row }) => (
            <>
              <Label value={row.original.cfd?.code ?? "inconnu"} />
              {row.original.cfd?.outdated && <Label level={"error"} value={"fermé"} />}
            </>
          ),
        },
        {
          header: "RNCP",
          accessorKey: "rncps",
          cell: ({ row }) => <>{row.original.rncps?.map((rncp) => <Label key={rncp.code} value={rncp.code} />)}</>,
        },
        {
          header: "Nature",
          cell: ({ row }) => <Label value={getNature(row.original, organisme)} />,
        },
        {
          size: 500,
          header: "Intitulé",
          accessorKey: "intitule",
          cell: ({ row }) => <TextCellComponent value={row.original.intitule_long ?? "inconnu"} />,
        },
        {
          header: "Niveau",
          accessorKey: "niveau",
          cell: ({ row }) => <Label value={row.original.niveau?.libelle ?? "inconnu"} />,
        },
        {
          size: 70,
          header: "Durée",
          accessorKey: "duree",
          cell: ({ row }) => <Label value={row.original.duree?.theorique ?? "inconnu"} />,
        },
        {
          size: 70,
          header: "Année",
          accessorKey: "annee",
          cell: ({ row }) => <Label value={row.original.annee?.num ?? "inconnu"} />,
        },
        {
          size: 25,
          header: () => " ",
          cell: ({ row }) => {
            return row.getCanExpand() ? (
              <Button
                onClick={() => {
                  row.toggleExpanded();
                }}
                cursor="pointer"
              >
                {row.getIsExpanded() ? (
                  <SubtractLine fontSize="12px" color="bluefrance" />
                ) : (
                  <AddFill fontSize="12px" color="bluefrance" />
                )}
              </Button>
            ) : null;
          },
        },
      ]}
      getRowCanExpand={() => true}
      renderSubComponent={({ row }) => {
        return <FormationsDetails organisme={organisme} formation={row.original} />;
      }}
      pagination={{ limit: 50 }}
    />
  );
}
