import { Alert, Box, HStack, ListItem, Text, UnorderedList, VStack } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { useRecoilValue } from "recoil";
import { getStatut } from "shared";

import { capitalizeWords } from "@/common/utils/stringUtils";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { ValidateIcon } from "@/theme/components/icons";

import { effectifStateSelector } from "../../effectifs/engine/formEngine/atoms";

const SIFAeffectifsTableColumnsDefs = ({ modeSifa, organismesEffectifs }) => [
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
            CFD&nbsp;: {row.original?.formation?.cfd} - RNCP&nbsp;: {row.original?.formation?.cfd}
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
    size: 100,
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

      const historiqueSorted = statut.parcours.sort(
        (a, b) => new Date(a.date_statut).getTime() - new Date(b.date_statut).getTime()
      );
      const current = [...historiqueSorted].pop();

      return (
        <VStack alignItems="start" spacing={0}>
          <Text>{getStatut(current.valeur)}</Text>
          <Text fontSize="xs" pt={2} color="#777777" whiteSpace="nowrap">
            depuis le {DateTime.fromISO(current.date).setLocale("fr-FR").toFormat("dd/MM/yyyy")}
          </Text>
        </VStack>
      );
    },
    size: 150,
    enableSorting: false,
  },
  {
    accessorKey: "state",
    header: () => (
      <Box>
        État de la donnée
        <InfoTooltip
          headerComponent={() => <Text>État de la donnée</Text>}
          contentComponent={() => (
            <Box>
              {modeSifa ? (
                <>
                  <Text as="p">
                    Cette colonne indique si les données obligatoires pour l’enquête SIFA sont complètes ou manquantes.
                  </Text>
                  <Text as="p">
                    Si manquante(s), veuillez les compléter à la source (sur votre ERP si votre organisme transmet via
                    API). Les modifications apportées seront visibles dès le lendemain sur cette page.
                  </Text>
                  <Text as="p" mt={3}>
                    <strong>Note :</strong> vous pouvez aussi télécharger le fichier en l’état, mais il faudra compléter
                    les données manquantes sur ce dernier.
                  </Text>
                </>
              ) : (
                <Text as="p">Ce champ indique si les données affichées contiennent des erreurs ou non.</Text>
              )}
            </Box>
          )}
        />
      </Box>
    ),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => {
      const { id } = organismesEffectifs[row.id];
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { validation_errors, requiredSifa } = useRecoilValue<any>(effectifStateSelector(id)); // Not the best; THIS IS AN EXCEPTION; This should not be reproduce anywhere else

      const MissingSIFA = ({ requiredSifa }) => {
        if (!requiredSifa?.length)
          return (
            <HStack color="flatsuccess" w="full">
              <ValidateIcon boxSize={4} /> <Text>Complète pour SIFA</Text>
            </HStack>
          );

        return (
          <Box>
            <HStack color="warning" w="full">
              <Alert boxSize={4} /> <Text>{requiredSifa.length} manquante(s) pour SIFA</Text>
              <InfoTooltip
                headerComponent={() => "Champ(s) manquant(s) :"}
                contentComponent={() => (
                  <Box>
                    <UnorderedList>
                      {requiredSifa.map((fieldName, i) => (
                        <ListItem key={i}>{fieldName}</ListItem>
                      ))}
                    </UnorderedList>
                    <Text as="p" my={3}>
                      Veuillez le(s) corriger/compléter sur&nbsp;:
                    </Text>
                    <UnorderedList>
                      <ListItem>
                        <Text as="p">
                          votre outil de gestion (ex : Gestibase, Ypareo) si vous transmettez par API. La donnée
                          apparaîtra sur le Tableau de bord dans les prochaines 24 heures.
                        </Text>
                      </ListItem>
                      <ListItem>
                        <Text as="p">
                          le Tableau de bord de l’apprentissage si vous avez transmis vos effectifs via fichier Excel.
                        </Text>
                      </ListItem>
                    </UnorderedList>
                  </Box>
                )}
              />
            </HStack>
          </Box>
        );
      };

      const ValidationsErrorsInfo = ({ validation_errors }) => {
        if (!validation_errors?.length) return null;
        return (
          <Box>
            <HStack color="redmarianne" w="full">
              <Alert boxSize={4} /> <Text>{validation_errors.length} erreur(s) de transmission</Text>
            </HStack>
            <InfoTooltip
              contentComponent={() => (
                <Box>
                  <Text fontWeight="bold">Champ(s) en erreur(s) :</Text>
                  <UnorderedList>
                    {validation_errors.map(({ fieldName }, i) => (
                      <ListItem key={i}>{fieldName}</ListItem>
                    ))}
                  </UnorderedList>
                </Box>
              )}
            />
          </Box>
        );
      };

      return (
        <Box py={2}>
          {modeSifa && <MissingSIFA requiredSifa={requiredSifa} />}
          <ValidationsErrorsInfo validation_errors={validation_errors} />
        </Box>
      );
    },
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

export default SIFAeffectifsTableColumnsDefs;
