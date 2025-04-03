import { Button, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";
import { IOrganismeJson, IRelatedOrganismeJson } from "shared/models/data/organismes.model";

import Table from "@/components/Table/Table";
import { AddFill, SubtractLine } from "@/theme/components/icons";

import { CardInfo } from "./CarInfo";
import { FormationsDetails } from "./FormationDetails";
import { Label } from "./Label";

type RelatedOrganismePanelProps = {
  organisme: IOrganismeJson | null;
  formations: OffreFormation[];
  type: "responsables" | "formateurs";
};

function TextCellComponent({ value }) {
  return (
    <Text fontSize="omega" fontWeight="bold">
      {value ?? ""}
    </Text>
  );
}

type RelatedOrganismeFormationListProps = {
  organisme: IOrganismeJson;
  relatedFormations: Array<OffreFormation | (Partial<OffreFormation> & { cle_ministere_educatif: string })>;
};

function RelatedOrganismeFormationList({ organisme, relatedFormations }: RelatedOrganismeFormationListProps) {
  return (
    <Table
      data={relatedFormations}
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
    />
  );
}

type RelatedOrganismeProps = {
  organisme: IOrganismeJson;
  formations: OffreFormation[];
  relatedOrganisme: IRelatedOrganismeJson;
};

function isFormateur(org: Pick<IOrganismeJson, "uai" | "siret">, formation: OffreFormation) {
  return org.siret === formation.formateur.siret && org.uai === formation.formateur.uai;
}

function isGestionaire(org: Pick<IOrganismeJson, "uai" | "siret">, formation: OffreFormation) {
  return org.siret === formation.gestionnaire.siret && org.uai === formation.gestionnaire.uai;
}

function RelatedOrganisme({ organisme, relatedOrganisme, formations }: RelatedOrganismeProps) {
  const formationByCleMe: Map<unknown, OffreFormation> = useMemo(() => {
    const byCle = new Map();
    for (const formation of formations) {
      byCle.set(formation.cle_ministere_educatif, formation);
    }
    return byCle;
  }, [formations]);

  const relatedFormations = useMemo(() => {
    const result: RelatedOrganismeFormationListProps["relatedFormations"] = formations.filter((f) => {
      return isFormateur(relatedOrganisme, f) || isGestionaire(relatedOrganisme, f);
    });

    const intl = new Intl.Collator("fr");

    result.sort((a, b) => {
      if (!a.cfd && !b.cfd) return intl.compare(a.cle_ministere_educatif, b.cle_ministere_educatif);
      if (!a.cfd) return 1;
      if (!b.cfd) return -1;

      if (a.cfd.code !== b.cfd.code) return intl.compare(a.cfd.code, b.cfd.code);

      return intl.compare(a.annee?.num ?? "", b.annee?.num ?? "");
    });
    return result;
  }, [organisme, relatedOrganisme._id, formationByCleMe]);

  return (
    <CardInfo
      title={`${relatedOrganisme.enseigne ?? relatedOrganisme.raison_sociale ?? ""} (${relatedFormations.length} formations)`}
    >
      <HStack>
        <Text fontSize="zeta">UAI :</Text>
        <Label value={relatedOrganisme.uai ?? ""} />
        <Text fontSize="zeta">SIRET :</Text>
        <Label value={relatedOrganisme.siret ?? ""} />
        {relatedOrganisme.responsabilitePartielle && <Label level="warning" value="Responsable Partiel" />}
      </HStack>
      <Text fontSize="epsilon" fontWeight="bold">
        Formations :
      </Text>
      <RelatedOrganismeFormationList organisme={organisme} relatedFormations={relatedFormations} />
    </CardInfo>
  );
}

export function RelatedOrganismePanel({ organisme, formations, type }: RelatedOrganismePanelProps) {
  const relatedOrganismes = useMemo(() => {
    if (organisme == null) return [];

    if (type === "responsables") {
      return organisme.organismesResponsables ?? [];
    }
    return organisme.organismesFormateurs ?? [];
  }, [organisme]);

  if (organisme == null || relatedOrganismes.length === 0) {
    return null;
  }

  return (
    <SimpleGrid spacing="2">
      {relatedOrganismes.map((relatedOrganisme) => (
        <RelatedOrganisme
          key={String(relatedOrganisme._id ?? "")}
          organisme={organisme}
          formations={formations}
          relatedOrganisme={relatedOrganisme}
        />
      ))}
    </SimpleGrid>
  );
}
