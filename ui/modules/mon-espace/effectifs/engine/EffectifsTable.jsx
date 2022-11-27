import React, { useEffect, useRef } from "react";
import { Box, Flex, Text, HStack, Button, Tooltip, Circle } from "@chakra-ui/react";
import { useSetRecoilState } from "recoil";
import { useQueryClient } from "@tanstack/react-query";

import Table from "../../../../components/Table/Table";

import { AddFill, Alert, ErrorIcon, InfoLine, SubtractLine, ValidateIcon } from "../../../../theme/components/icons";
import Effectif from "./Effectif";
import { effectifIdAtom } from "./atoms";

const EffectifDetails = ({ row }) => {
  const queryClient = useQueryClient();
  const prevEffectifId = useRef(null);
  const setEffectifId = useSetRecoilState(effectifIdAtom);

  useEffect(() => {
    if (prevEffectifId.current !== row.original.id) {
      prevEffectifId.current = row.original.id;
      setEffectifId(row.original.id);
    }
  }, [queryClient, row, setEffectifId]);

  if (!row.original.id) {
    return null;
  }

  return (
    <Box>
      <Effectif />
    </Box>
  );
};

const EffectifsTable = ({ organismesEffectifs }) => {
  return (
    <Flex flexDir="column" width="100%" my={9}>
      <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%">
        <Box flexBasis={{ base: "auto", md: "auto" }} flexGrow="1">
          <HStack>
            <Text>Grouper par :</Text>
            <Button onClick={() => {}} variant="badgeSelected">
              par formations
              <Circle size="15px" background="white" color="bluefrance" position="absolute" bottom="18px" right="-5px">
                <Box as="i" className="ri-checkbox-circle-line" fontSize="gamma" />
              </Circle>
            </Button>
            <Button onClick={() => {}} variant="badge">
              par années scolaire
            </Button>
          </HStack>
        </Box>

        <Button
          size="md"
          fontSize={{ base: "sm", md: "md" }}
          p={{ base: 2, md: 4 }}
          h={{ base: 8, md: 10 }}
          onClick={() => {}}
          variant="primary"
        >
          + Ajout apprenant(e)
        </Button>
      </Flex>

      <Box mt={10}>
        <HStack>
          <Text fontWeight="bold" textDecoration="underline">
            Conseiller en économie sociale familiale
          </Text>
          <Text>[Code diplôme 26033206]</Text>
        </HStack>
        <Table
          mt={4}
          data={organismesEffectifs}
          columns={{
            expander: {
              size: 25,
              header: () => {
                return <Box>&nbsp;</Box>;
              },
              cell: ({ row, table }) => {
                return row.getCanExpand() ? (
                  <Button
                    onClick={() => {
                      if (table.getIsSomeRowsExpanded() && !row.getIsExpanded()) table.resetExpanded();
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
            annee_scolaire: {
              size: 100,
              header: () => {
                return <Box textAlign="left">Année scolaire</Box>;
              },
              cell: (item) => item.getValue(),
            },
            statut_courant: {
              size: 170,
              header: () => {
                return <Box textAlign="left">Statut courant apprenant(e)</Box>;
              },
              cell: ({ row }) => {
                const { historique_statut } = organismesEffectifs[row.id];
                return (
                  <HStack textAlign="left">
                    <Text fontSize="1rem" fontWeight="bold">
                      {historique_statut[0].valeur_statut}
                    </Text>
                    <Text fontSize="0.8rem">(depuis {historique_statut[0].date_statut})</Text>
                  </HStack>
                );
              },
            },
            nom: {
              header: () => {
                return (
                  <Box textAlign="left">
                    <Tooltip
                      label={<Text>Donnée obligatoire</Text>}
                      aria-label="A tooltip"
                      background="bluefrance"
                      color="white"
                      padding="2w"
                    >
                      <Box>
                        Nom
                        <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
                          *
                        </Box>
                      </Box>
                    </Tooltip>
                  </Box>
                );
              },
              cell: (item) => item.renderValue(),
            },
            prenom: {
              header: () => {
                return (
                  <Box textAlign="left">
                    <Tooltip
                      label={<Text>Donnée obligatoire</Text>}
                      aria-label="A tooltip"
                      background="bluefrance"
                      color="white"
                      padding="2w"
                    >
                      <Box>
                        Prénom
                        <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
                          *
                        </Box>
                      </Box>
                    </Tooltip>
                  </Box>
                );
              },
              cell: (item) => item.renderValue(),
            },
            separator: {
              size: 15,
              minSize: 15,
              header: () => {
                return (
                  <Box bgColor="bluefrance" w="1px">
                    &nbsp;
                  </Box>
                );
              },
              cell: () => {
                return (
                  <Box bgColor="bluefrance" w="1px">
                    &nbsp;
                  </Box>
                );
              },
            },
            source: {
              size: 140,
              header: () => {
                return (
                  <Box textAlign="left">
                    <Tooltip
                      label={<Text>D&rsquo;où vient la donnée? Exemple la transmission a été faite depuis un ERP</Text>}
                      aria-label="A tooltip"
                      background="bluefrance"
                      color="white"
                      padding="2w"
                    >
                      <Box>
                        Source
                        <Text as="span" ml={1}>
                          <InfoLine h="14px" w="14px" color="grey.500" ml="1v" mb="1v" />
                        </Text>
                      </Box>
                    </Tooltip>
                  </Box>
                );
              },
              cell: ({ row }) => {
                const { source } = organismesEffectifs[row.id];
                const sources = {
                  TDB_MANUEL: "Saisie maunelle",
                  TDB_FILE: "Depuis un fichier",
                  ERP: "Transfet automatique",
                };
                return (
                  <HStack textAlign="left">
                    <Text fontSize="1rem">{sources[source]}</Text>
                  </HStack>
                );
              },
            },
            state: {
              size: 110,
              header: () => {
                return (
                  <Box textAlign="left">
                    <Tooltip
                      label={<Text>Si la donnée est suffissant ou en erreur</Text>}
                      aria-label="A tooltip"
                      background="bluefrance"
                      color="white"
                      padding="2w"
                    >
                      <Box pl={5}>
                        État
                        <Text as="span" ml={1}>
                          <InfoLine h="14px" w="14px" color="grey.500" ml="1v" mb="1v" />
                        </Text>
                      </Box>
                    </Tooltip>
                  </Box>
                );
              },
              cell: ({ row }) => {
                const { state } = organismesEffectifs[row.id];
                return (
                  <>
                    {state === "error" && (
                      <HStack color="flaterror" w="full" pl={5}>
                        <ErrorIcon boxSize={4} /> <Text fontSize="1rem">Erreurs</Text>
                      </HStack>
                    )}
                    {state === "missing" && (
                      <HStack color="flatwarm" w="full" pl={5}>
                        <Alert boxSize={4} /> <Text fontSize="1rem">Manquant</Text>
                      </HStack>
                    )}
                    {state === "complete" && (
                      <HStack color="flatsuccess" w="full" pl={5}>
                        <ValidateIcon boxSize={4} /> <Text fontSize="1rem">Complet</Text>
                      </HStack>
                    )}
                  </>
                );
              },
            },
          }}
          getRowCanExpand={() => true}
          renderSubComponent={({ row }) => {
            return <EffectifDetails row={row} />;
          }}
        />
      </Box>
    </Flex>
  );
};

export default EffectifsTable;
