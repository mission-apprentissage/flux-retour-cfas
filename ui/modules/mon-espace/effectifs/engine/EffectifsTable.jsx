import React, { useEffect, useRef } from "react";
import { Box, Flex, Text, HStack, Button, Tooltip, Circle, useDisclosure } from "@chakra-ui/react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useQueryClient } from "@tanstack/react-query";

import Table from "../../../../components/Table/Table";

import {
  AddFill,
  Alert,
  DownloadLine,
  ErrorIcon,
  InfoLine,
  SubtractLine,
  ValidateIcon,
} from "../../../../theme/components/icons";
import Effectif from "./Effectif";
import { effectifIdAtom } from "./atoms";
import { hasContextAccessTo } from "../../../../common/utils/rolesUtils";
import { organismeAtom } from "../../../../hooks/organismeAtoms";
import AjoutApprenantModal from "./AjoutApprenantModal";
import { DateTime } from "luxon";

const EffectifDetails = ({ row, modeSifa = false }) => {
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
      <Effectif modeSifa={modeSifa} />
    </Box>
  );
};

const EffectifsTable = ({ organismesEffectifs, modeSifa = false }) => {
  const organisme = useRecoilValue(organismeAtom);
  const ajoutModal = useDisclosure();

  return (
    <Flex flexDir="column" width="100%" my={10}>
      <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" alignItems="flex-start">
        <Box flexBasis={{ base: "auto", md: "auto" }} flexGrow="1">
          <HStack>
            <Text>Grouper par :</Text>
            <Button onClick={() => alert("TODO NOT YET")} variant="badgeSelected">
              par formations
              <Circle size="15px" background="white" color="bluefrance" position="absolute" bottom="18px" right="-5px">
                <Box as="i" className="ri-checkbox-circle-line" fontSize="gamma" />
              </Circle>
            </Button>
            <Button onClick={() => alert("TODO NOT YET")} variant="badge">
              par années scolaire
            </Button>
          </HStack>
          <HStack mt={10}>
            <Text>Voir :</Text>
            <Button onClick={() => alert("TODO NOT YET")} variant="badgeSelected">
              Tous les effectifs
              <Circle size="15px" background="white" color="bluefrance" position="absolute" bottom="18px" right="-5px">
                <Box as="i" className="ri-checkbox-circle-line" fontSize="gamma" />
              </Circle>
            </Button>
            <Button
              onClick={() => alert("TODO NOT YET")}
              variant="badge"
              bg="none"
              borderWidth="1px"
              borderColor="bluefrance"
            >
              Seulement les erreurs
            </Button>
          </HStack>
        </Box>
        <HStack spacing={4}>
          {!modeSifa && hasContextAccessTo(organisme, "organisme/page_effectifs/telecharger") && (
            <Button size="md" onClick={() => alert("TODO NOT YET")} variant="secondary">
              <DownloadLine />
              <Text as="span" ml={2}>
                Télécharger
              </Text>
            </Button>
          )}
          {modeSifa && hasContextAccessTo(organisme, "organisme/page_sifa2/telecharger") && (
            <Button
              size="md"
              onClick={() => alert(`/api/v1/organisme/sifa/export-csv-list?organisme_id=${organisme._id}`)}
              variant="secondary"
            >
              <DownloadLine />
              <Text as="span" ml={2}>
                Télécharger SIFA
              </Text>
            </Button>
          )}
          {!modeSifa &&
            hasContextAccessTo(organisme, "organisme/page_effectifs/ajout_apprenant") &&
            organisme.mode_de_transmission === "FICHIERS" && (
              <>
                <Button
                  size="md"
                  fontSize={{ base: "sm", md: "md" }}
                  p={{ base: 2, md: 4 }}
                  h={{ base: 8, md: 10 }}
                  onClick={() => alert("TODO NOT YET")}
                  variant="primary"
                >
                  Historique des téleversements
                </Button>
                <AjoutApprenantModal size="md" isOpen={ajoutModal.isOpen} onClose={ajoutModal.onClose} />
              </>
            )}
          {!modeSifa &&
            hasContextAccessTo(organisme, "organisme/page_effectifs/ajout_apprenant") &&
            organisme.mode_de_transmission !== "API" && (
              <>
                <Button
                  size="md"
                  fontSize={{ base: "sm", md: "md" }}
                  p={{ base: 2, md: 4 }}
                  h={{ base: 8, md: 10 }}
                  onClick={ajoutModal.onOpen}
                  variant="primary"
                >
                  + Nouvelle·au apprenant(e)
                </Button>
                <AjoutApprenantModal size="md" isOpen={ajoutModal.isOpen} onClose={ajoutModal.onClose} />
              </>
            )}
        </HStack>
      </Flex>

      <Box mt={10}>
        <HStack>
          <Text fontWeight="bold" textDecoration="underline">
            Conseiller en économie sociale familiale
          </Text>
          <Text>[Code diplôme 26033206] - hardcodé TODO</Text>
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

                const statut_text = {
                  2: "Inscrit",
                  3: "En contrat",
                  0: "Abandon",
                };

                if (!historique_statut.length) {
                  return (
                    <Text fontSize="1rem" fontWeight="bold" color="redmarianne">
                      Aucun statut
                    </Text>
                  );
                }
                return (
                  <HStack textAlign="left">
                    <Text fontSize="1rem" fontWeight="bold">
                      {statut_text[historique_statut[0].valeur_statut]}
                    </Text>
                    <Text fontSize="0.8rem">
                      (depuis{" "}
                      {DateTime.fromISO(historique_statut[0].date_statut).setLocale("fr-FR").toFormat("dd/MM/yyyy")})
                    </Text>
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
              size: 110,
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
              size: 130,
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
              size: 180,
              header: () => {
                return (
                  <Box textAlign="left">
                    <Tooltip
                      label={<Text>Si les données sont suffissantes pour SIFA2</Text>}
                      aria-label="A tooltip"
                      background="bluefrance"
                      color="white"
                      padding="2w"
                    >
                      <Box pl={5}>
                        État de la données
                        <Text as="span" ml={1}>
                          <InfoLine h="14px" w="14px" color="grey.500" ml="1v" mb="1v" />
                        </Text>
                      </Box>
                    </Tooltip>
                  </Box>
                );
              },
              cell: () => {
                const fakeState = ["complete_sifa", "missing_sifa", ""];
                const random = Math.floor(Math.random() * fakeState.length);
                const state = modeSifa ? fakeState[random] : ""; //organismesEffectifs[row.id];

                return (
                  <>
                    {state === "error" && (
                      <HStack color="flaterror" w="full" pl={5}>
                        <ErrorIcon boxSize={4} /> <Text fontSize="1rem">Erreurs</Text>
                      </HStack>
                    )}
                    {state === "missing_sifa" && (
                      <HStack color="flatwarm" w="full" pl={5}>
                        <Alert boxSize={4} /> <Text fontSize="1rem">Manquantes pour SIFA2 (fake)</Text>
                      </HStack>
                    )}
                    {state === "complete_sifa" && (
                      <HStack color="flatsuccess" w="full" pl={5}>
                        <ValidateIcon boxSize={4} /> <Text fontSize="1rem">Complètes pour SIFA2 (fake)</Text>
                      </HStack>
                    )}
                  </>
                );
              },
            },
          }}
          getRowCanExpand={() => true}
          renderSubComponent={({ row }) => {
            return <EffectifDetails row={row} modeSifa={modeSifa} />;
          }}
        />
      </Box>
    </Flex>
  );
};

export default EffectifsTable;
