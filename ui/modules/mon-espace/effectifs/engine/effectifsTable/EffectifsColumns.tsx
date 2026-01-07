import { Box, HStack, ListItem, Text, UnorderedList, VStack } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { getStatut } from "shared";

import { capitalizeWords } from "@/common/utils/stringUtils";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";

const effectifsTableColumnsDefs = [
  {
    accessorKey: "annee_scolaire",
    header: () => (
      <>
        Période{" "}
        <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
          *
        </Box>
      </>
    ),
    cell: ({ row, getValue }) => <ShowErrorInCell item={row.original} fieldName="annee_scolaire" value={getValue()} />,
    size: 120,
  },
  {
    accessorKey: "nom",
    header: () => (
      <>
        Nom{" "}
        <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
          *
        </Box>
      </>
    ),
    cell: ({ row, getValue }) => <ShowErrorInCell item={row.original} fieldName="apprenant.nom" value={getValue()} />,
    size: 160,
  },
  {
    accessorKey: "prenom",
    header: () => (
      <>
        Prénom{" "}
        <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
          *
        </Box>
      </>
    ),
    cell: ({ row, getValue }) => (
      <ShowErrorInCell item={row.original} fieldName="apprenant.prenom" value={getValue()} />
    ),
    size: 160,
  },
  {
    accessorKey: "formation",
    header: () => "Formation",
    cell: ({ row }) => {
      return (
        <VStack alignItems="start" spacing={0} width="340px">
          <Text noOfLines={1}>{row.original?.formation?.libelle_long || "Libellé manquant"}</Text>
          <Text fontSize="xs" color="#777777" whiteSpace="nowrap">
            CFD&nbsp;: {row.original?.formation?.cfd} - RNCP&nbsp;: {row.original?.formation?.rncp}
          </Text>
        </VStack>
      );
    },
    size: 350,
  },
  {
    accessorKey: "source",
    header: () => (
      <>
        Source{" "}
        <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
          *
        </Box>
        <InfoTooltip
          headerComponent={() => "Source de la donnée"}
          contentComponent={() => (
            <Box>
              <Text as="p">
                Ce champ indique la provenance de la donnée. Par exemple, la donnée est transmise par un ERP ou via un
                téléversement de fichier Excel, ou encore de plateforme DECA (Dépôt des Contrats d’Alternance).
              </Text>
            </Box>
          )}
          aria-label="Informations sur la répartition des effectifs au national"
        />
      </>
    ),
    cell: ({ row, getValue }) => (
      <ShowErrorInCell
        item={row.original}
        fieldName="apprenant.prenom"
        value={getValue() === "FICHIER" ? capitalizeWords(getValue()) : getValue()}
      />
    ),
    size: 150,
  },
  {
    accessorKey: "statut_courant",
    header: () => (
      <>
        Statut actuel{" "}
        <InfoTooltip
          headerComponent={() => "Statut actuel"}
          contentComponent={() => (
            <Box>
              <Text as="p">Un jeune peut être :</Text>
              <UnorderedList my={3}>
                <ListItem>apprenti en contrat</ListItem>
                <ListItem>inscrit sans contrat signé</ListItem>
                <ListItem>en rupture de contrat</ListItem>
                <ListItem>en fin de formation (diplômé)</ListItem>
                <ListItem>abandon (a quitté le CFA)</ListItem>
              </UnorderedList>
            </Box>
          )}
          aria-label="Informations sur la répartition des effectifs au national"
        />
      </>
    ),
    cell: ({ row }) => {
      const statut = row.original?.statut;

      if (!statut || !statut.parcours.length) {
        return (
          <Text fontSize="1rem" fontWeight="bold" color="redmarianne">
            Aucun statut
          </Text>
        );
      }

      const now = new Date();
      const current = [...statut.parcours]
        .filter((s) => new Date(s.date) <= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .at(-1);

      if (!current) {
        return (
          <Text fontSize="1rem" fontWeight="bold" color="redmarianne">
            Aucun statut
          </Text>
        );
      }
      return (
        <VStack alignItems="start" spacing={0}>
          <Text>{getStatut(current.valeur)}</Text>
          <Text fontSize="xs" color="#777777" whiteSpace="nowrap">
            depuis le {DateTime.fromISO(current.date).setLocale("fr-FR").toFormat("dd/MM/yyyy")}
          </Text>
        </VStack>
      );
    },
    size: 170,
  },
];

const ShowErrorInCell = ({ item, fieldName, value }) => {
  const { validation_errors } = item;
  const validation_error = validation_errors?.find((e) => e.fieldName === fieldName);
  if (validation_error) {
    return (
      <HStack color="flaterror">
        <Text fontSize="1rem" color="flaterror">
          {validation_error.inputValue || "VIDE"}
        </Text>
      </HStack>
    );
  }
  return value;
};

export default effectifsTableColumnsDefs;
