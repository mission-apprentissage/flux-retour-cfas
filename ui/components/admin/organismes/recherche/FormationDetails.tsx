import { Box, HStack, Link, SimpleGrid, Text } from "@chakra-ui/react";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";
import { IOrganismeJson } from "shared/models/data/organismes.model";

import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import NewTable from "@/modules/indicateurs/NewTable";
import { ExternalLinkLine } from "@/theme/components/icons";

import { CardInfo } from "./CarInfo";
import { Label } from "./Label";

type FormationsDetailsProps = {
  organisme: IOrganismeJson;
  formation: Partial<OffreFormation>;
};

function formatAdresse(adresse: OffreFormation["lieu_formation"]["adresse"]) {
  return [adresse.adresse, adresse.code_postal, adresse.localite].join(" ");
}
type OrganismeRefProps = {
  self: IOrganismeJson;
  organismeRef: OffreFormation["formateur"] | OffreFormation["gestionnaire"] | undefined | null;
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
      {organismeRef.enseigne ?? organismeRef.raison_sociale ?? "Organisme inconnu"}
      {" ("}
      {organismeRef.uai ?? "UAI INCONNUE"}
      {" / "}
      {organismeRef.siret}
      {")"}
    </Text>
  );
}

export function FormationsDetails({ organisme, formation }: FormationsDetailsProps) {
  return (
    <SimpleGrid columns={2} spacing="2" ml="10" mb="10" bg="grey.100">
      <CardInfo title="Détails">
        <HStack>
          <Text fontSize="zeta">Cle Ministère Éducatif :</Text>
          <Label value={formation.cle_ministere_educatif ?? "inconnu"} />
        </HStack>
        <HStack>
          <Text fontSize="zeta">Date de fermeture CFD :</Text>
          {formation.cfd ? (
            <Label
              value={formation.cfd.date_fermeture ? formatDateDayMonthYear(formation.cfd.date_fermeture) : "Non défini"}
            />
          ) : (
            <Label level="error" value={"inconnu"} />
          )}
        </HStack>
        <HStack>
          <Text fontSize="zeta">Niveau Entrée obligatoire:</Text>
          {formation.niveau ? (
            <Label value={formation.niveau.entree_obligatoire ?? "inconnu"} />
          ) : (
            <Label level="error" value={"inconnu"} />
          )}
        </HStack>
        <HStack>
          <Text fontSize="zeta">Durée incohérente:</Text>
          {formation.duree ? (
            <Label level={formation.duree.incoherente ? "warning" : "info"} value={formation.duree.incoherente} />
          ) : (
            <Label level="error" value={"inconnu"} />
          )}
        </HStack>
        <HStack>
          <Text fontSize="zeta">Nature :</Text>
          {formation.nature ? (
            <>
              <Label value={formation.nature.libelle} />
              <Text fontSize="omega">Code</Text>
              <Label value={formation.nature.code ?? ""} />
            </>
          ) : (
            <Label level="error" value={"inconnu"} />
          )}
        </HStack>
        <HStack>
          <Text fontSize="zeta">Onisep :</Text>
          {formation.onisep ? (
            <Link isExternal href={formation.onisep.url}>
              {formation.onisep.intitule}
              <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
            </Link>
          ) : (
            <Label level="error" value={"inconnu"} />
          )}
        </HStack>
        <HStack>
          <Text fontSize="zeta">Entièrement à distance :</Text>
          {formation.entierement_a_distance != null ? (
            <Label value={formation.entierement_a_distance} />
          ) : (
            <Label level="error" value={"inconnu"} />
          )}
        </HStack>
        <HStack>
          <Text fontSize="zeta">Responsable</Text>
          <OrganismeRef self={organisme} organismeRef={formation?.gestionnaire} />
        </HStack>
        <HStack>
          <Text fontSize="zeta">Formateur</Text>
          <OrganismeRef self={organisme} organismeRef={formation?.formateur} />
        </HStack>
        <HStack>
          <Text fontSize="zeta">Lieu de formation :</Text>
          {formation.lieu_formation ? (
            <Label value={formatAdresse(formation.lieu_formation.adresse)} />
          ) : (
            <Label level="error" value={"inconnu"} />
          )}
        </HStack>
      </CardInfo>
      <CardInfo title="Sessions">
        {formation.sessions != null ? (
          <NewTable
            data={formation.sessions}
            columns={[
              {
                accessorKey: "debut",
                cell: ({ row }) => <Label value={formatDateDayMonthYear(row.original.debut)} />,
              },
              {
                accessorKey: "fin",
                cell: ({ row }) => <Label value={formatDateDayMonthYear(row.original.debut)} />,
              },
            ]}
          />
        ) : (
          <Label level="error" value={"inconnu"} />
        )}
      </CardInfo>
      <Box gridColumn="span 2">
        <CardInfo title="RNCPs">
          {formation.rncps != null ? (
            <NewTable
              data={formation.rncps}
              columns={[
                {
                  header: "Code",
                  accessorKey: "code",
                  cell: ({ row }) => <Label value={row.original.code} />,
                },
                {
                  header: "Intitulé",
                  accessorKey: "intitule",
                  cell: ({ row }) => <Text fontSize="zeta">{row.original.intitule}</Text>,
                },
                {
                  header: "Statut",
                  accessorKey: "active_inactive",
                  cell: ({ row }) => (
                    <Label
                      level={row.original.active_inactive === "ACTIVE" ? "success" : "error"}
                      value={row.original.active_inactive}
                    />
                  ),
                },
                {
                  header: "Éligible Apprentissage",
                  accessorKey: "eligible_apprentissage",
                  cell: ({ row }) => (
                    <Label
                      level={row.original.eligible_apprentissage === false ? "error" : "info"}
                      value={row.original.eligible_apprentissage ?? "inconnu"}
                    />
                  ),
                },
                {
                  header: "Fin validité",
                  accessorKey: "date_fin_validite_enregistrement",
                  cell: ({ row }) => <Label value={row.original.date_fin_validite_enregistrement} />,
                },
              ]}
            />
          ) : (
            <Label level="error" value={"inconnu"} />
          )}
        </CardInfo>
      </Box>
    </SimpleGrid>
  );
}
