import React, { useEffect, useRef } from "react";
import { Box, Text, HStack, Button, Tooltip, UnorderedList, ListItem } from "@chakra-ui/react";
import { useSetRecoilState } from "recoil";
import { useQueryClient } from "@tanstack/react-query";

import Table from "../../../../components/Table/Table";

import { AddFill, Alert, ErrorIcon, InfoLine, SubtractLine, ValidateIcon } from "../../../../theme/components/icons";
import Effectif from "./Effectif";
import { effectifIdAtom } from "./atoms";
import { DateTime } from "luxon";

const EffectifDetails = ({ row, modeSifa = false, canEdit = false, effectifsSnapshot = false }) => {
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
      <Effectif modeSifa={modeSifa} canEdit={canEdit} effectifsSnapshot={effectifsSnapshot} />
    </Box>
  );
};

const ShowErrorInCell = ({ item, fieldName, value }) => {
  const { validation_errors } = item;
  const validation_error = validation_errors.find((e) => e.fieldName === fieldName);
  if (validation_error) {
    return (
      <HStack color="flaterror">
        <ErrorIcon boxSize={4} />
        <Text fontSize="1rem" color="flaterror" fontWeight="bold">
          {validation_error.inputValue || "VIDE"}
        </Text>
      </HStack>
    );
  }
  return value;
};

const EffectifsTable = ({
  organismesEffectifs,
  modeSifa = false,
  effectifsSnapshot = false,
  canEdit = false,
  columns = ["expander", "annee_scolaire", "statut_courant", "nom", "prenom", "separator", "source", "state"],
  show = "normal",
}) => {
  return (
    <Box mt={4}>
      <Text>Nombre total d&rsquo;effectifs : {organismesEffectifs.length}</Text>
      <Table
        mt={4}
        data={organismesEffectifs}
        columns={{
          ...(columns.includes("expander")
            ? {
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
              }
            : {}),
          ...(columns.includes("annee_scolaire")
            ? {
                annee_scolaire: {
                  size: 100,
                  header: () => {
                    return (
                      <Box textAlign="left">
                        Année scolaire{" "}
                        <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
                          *
                        </Box>
                      </Box>
                    );
                  },
                  cell: ({ row, getValue }) => {
                    if (show === "errorInCell") {
                      return (
                        <ShowErrorInCell
                          item={organismesEffectifs[row.id]}
                          fieldName="annee_scolaire"
                          value={getValue()}
                        />
                      );
                    }
                    return getValue();
                  },
                },
              }
            : {}),
          ...(columns.includes("cfd")
            ? {
                cfd: {
                  size: 150,
                  header: () => {
                    return (
                      <Box textAlign="left">
                        Code Formation Diplôme
                        <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
                          *
                        </Box>
                      </Box>
                    );
                  },
                  cell: ({ row, getValue }) => {
                    if (show === "errorInCell") {
                      return (
                        <ShowErrorInCell
                          item={organismesEffectifs[row.id]}
                          fieldName="formation.cfd"
                          value={getValue()}
                        />
                      );
                    }
                    return getValue();
                  },
                },
              }
            : {}),
          ...(columns.includes("statut_courant")
            ? {
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
                          {DateTime.fromISO(historique_statut[0].date_statut).setLocale("fr-FR").toFormat("dd/MM/yyyy")}
                          )
                        </Text>
                      </HStack>
                    );
                  },
                },
              }
            : {}),
          ...(columns.includes("nom")
            ? {
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
                  cell: ({ row, getValue }) => {
                    if (show === "errorInCell") {
                      return (
                        <ShowErrorInCell
                          item={organismesEffectifs[row.id]}
                          fieldName="apprenant.nom"
                          value={getValue()}
                        />
                      );
                    }
                    return getValue();
                  },
                },
              }
            : {}),
          ...(columns.includes("prenom")
            ? {
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
                  cell: ({ row, getValue }) => {
                    if (show === "errorInCell") {
                      return (
                        <ShowErrorInCell
                          item={organismesEffectifs[row.id]}
                          fieldName="apprenant.prenom"
                          value={getValue()}
                        />
                      );
                    }
                    return getValue();
                  },
                },
              }
            : {}),
          ...(columns.includes("separator")
            ? {
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
              }
            : {}),
          ...(columns.includes("source")
            ? {
                source: {
                  size: 130,
                  header: () => {
                    return (
                      <Box textAlign="left">
                        <Tooltip
                          label={
                            <Text>D&rsquo;où vient la donnée? Exemple la transmission a été faite depuis un ERP</Text>
                          }
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
              }
            : {}),
          ...(columns.includes("state")
            ? {
                state: {
                  size: 180,
                  header: () => {
                    return (
                      <Box textAlign="left">
                        <Tooltip
                          label={
                            <Text>
                              {modeSifa
                                ? "Si les données sont suffissantes pour SIFA2"
                                : "les données contiennent elles des erreurs"}
                            </Text>
                          }
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
                  cell: ({ row }) => {
                    if (modeSifa) {
                      const { requiredSifa } = organismesEffectifs[row.id];
                      if (!requiredSifa?.length)
                        return (
                          <HStack color="flatsuccess" w="full" pl={5}>
                            <ValidateIcon boxSize={4} /> <Text fontSize="1rem">Complètes pour SIFA</Text>
                          </HStack>
                        );

                      return (
                        <Tooltip
                          label={
                            <Box>
                              <Text fontWeight="bold">Champ(s) manquant(s) :</Text>
                              <UnorderedList>
                                {requiredSifa.map((fieldName, i) => (
                                  <ListItem key={i}>{fieldName}</ListItem>
                                ))}
                              </UnorderedList>
                            </Box>
                          }
                          aria-label="A tooltip"
                          background="bluefrance"
                          color="white"
                          padding="2w"
                        >
                          <HStack color="flatwarm" w="full" pl={5}>
                            <Alert boxSize={4} /> <Text fontSize="1rem">Manquantes pour SIFA</Text>
                          </HStack>
                        </Tooltip>
                      );
                    }
                    const { validation_errors } = organismesEffectifs[row.id];

                    if (!validation_errors?.length) return null;

                    return (
                      <Tooltip
                        label={
                          <Box>
                            <Text fontWeight="bold">Champ(s) en erreur(s) :</Text>
                            <UnorderedList>
                              {validation_errors.map(({ fieldName }, i) => (
                                <ListItem key={i}>{fieldName}</ListItem>
                              ))}
                            </UnorderedList>
                          </Box>
                        }
                        aria-label="A tooltip"
                        background="bluefrance"
                        color="white"
                        padding="2w"
                      >
                        <HStack color="flatwarm" w="full" pl={5}>
                          <Alert boxSize={4} /> <Text fontSize="1rem">Erreur(s) détectée(s)</Text>
                        </HStack>
                      </Tooltip>
                    );
                  },
                },
              }
            : {}),
        }}
        getRowCanExpand={() => true}
        renderSubComponent={({ row }) => {
          return (
            <EffectifDetails row={row} modeSifa={modeSifa} canEdit={canEdit} effectifsSnapshot={effectifsSnapshot} />
          );
        }}
      />
    </Box>
  );
};

export default EffectifsTable;
