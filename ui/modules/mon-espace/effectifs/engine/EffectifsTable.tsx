import { Box, Text, HStack, Button, Tooltip, UnorderedList, ListItem } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import React, { useEffect, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";

import { ERPS } from "@/common/constants/erps";
import Table from "@/components/Table/Table";
import { AddFill, Alert, InfoLine, SubtractLine, ValidateIcon } from "@/theme/components/icons";

import { effectifIdAtom } from "./atoms";
import Effectif from "./Effectif";
import { effectifStateSelector } from "./formEngine/atoms";

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
        <Text fontSize="1rem" color="flaterror">
          {validation_error.inputValue || "VIDE"}
        </Text>
      </HStack>
    );
  }
  return value;
};

interface EffectifsTableProps {
  organismesEffectifs: any[];
  modeSifa?: boolean;
  effectifsSnapshot?: boolean;
  canEdit?: boolean;
  columns?: string[];
  show?: string;
  searchValue?: string;
  RenderErrorImport?: (data: any) => any; // eslint-disable-line no-unused-vars
  onCountItemsChange?: (count: number) => any; // eslint-disable-line no-unused-vars
}

const EffectifsTable = ({
  organismesEffectifs,
  modeSifa = false,
  effectifsSnapshot = false,
  canEdit = false,
  columns = ["expander", "annee_scolaire", "statut_courant", "nom", "prenom", "separator", "source", "state"],
  show = "normal",
  searchValue,
  RenderErrorImport = () => {},
  onCountItemsChange = () => {},
}: EffectifsTableProps) => {
  const [count, setCount] = useState(organismesEffectifs.length);

  return (
    <Box mt={4}>
      {count > 0 && <Text>{count} apprenant(es)</Text>}
      <Table
        mt={4}
        data={organismesEffectifs}
        searchValue={searchValue}
        onCountItemsChange={(count) => {
          setCount(count);
          onCountItemsChange(count);
        }}
        columns={{
          ...(columns.includes("expander")
            ? {
                expander: {
                  size: 25,
                  header: () => " ",
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
                  header: () => (
                    <>
                      Année scolaire{" "}
                      <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
                        *
                      </Box>
                    </>
                  ),
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
                  size: 120,
                  header: () => (
                    <>
                      Code Formation Diplôme
                      <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
                        *
                      </Box>
                    </>
                  ),
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
          ...(columns.includes("rncp")
            ? {
                rncp: {
                  size: 70,
                  header: () => "Code RNCP",
                  cell: ({ row, getValue }) => {
                    if (show === "errorInCell") {
                      return (
                        <ShowErrorInCell
                          item={organismesEffectifs[row.id]}
                          fieldName="formation.rncp"
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
                  header: () => "Statut courant apprenant(e)",
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
                    const historiqueSorted = historique_statut.sort((a, b) => {
                      return new Date(a.date_statut).getTime() - new Date(b.date_statut).getTime();
                    });
                    const current = [...historiqueSorted].pop();

                    return (
                      <HStack textAlign="left">
                        <Text fontSize="1rem" fontWeight="bold">
                          {statut_text[current.valeur_statut]}
                        </Text>
                        <Text fontSize="0.8rem">
                          (depuis {DateTime.fromISO(current.date_statut).setLocale("fr-FR").toFormat("dd/MM/yyyy")})
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
                  header: () => (
                    <>
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
                    </>
                  ),
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
                  header: () => (
                    <>
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
                    </>
                  ),
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
                  header: () => (
                    <Box bgColor="bluefrance" w="1px">
                      &nbsp;
                    </Box>
                  ),
                  cell: () => (
                    <Box bgColor="bluefrance" w="1px">
                      &nbsp;
                    </Box>
                  ),
                },
              }
            : {}),
          ...(columns.includes("source")
            ? {
                source: {
                  size: 130,
                  header: () => (
                    <>
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
                    </>
                  ),
                  cell: ({ row }) => {
                    const { source } = organismesEffectifs[row.id];
                    const sources = {
                      TDB_MANUEL: "Saisie manuelle",
                      TDB_FILE: "Fichier",
                      ...ERPS.reduce((acc, item) => {
                        acc[item.id] = item.name;
                        return acc;
                      }, {}),
                    };
                    return (
                      <HStack textAlign="left">
                        <Text fontSize="1rem">{sources[source.toUpperCase()] ?? "Fichier"}</Text>
                      </HStack>
                    );
                  },
                },
              }
            : {}),
          ...(columns.includes("action")
            ? {
                action: {
                  size: 90,
                  header: () => (
                    <>
                      <Tooltip
                        label={<Text>Action à faire</Text>}
                        aria-label="A tooltip"
                        background="bluefrance"
                        color="white"
                        padding="2w"
                      >
                        <Box>
                          Action
                          <Text as="span" ml={1}>
                            <InfoLine h="14px" w="14px" color="grey.500" ml="1v" mb="1v" />
                          </Text>
                        </Box>
                      </Tooltip>
                    </>
                  ),
                  cell: ({ row }) => {
                    const { toUpdate } = organismesEffectifs[row.id];

                    return (
                      <HStack textAlign="left">
                        <Text fontSize="1rem">{toUpdate ? "Mise à jour" : "Nouveau"}</Text>
                      </HStack>
                    );
                  },
                },
              }
            : {}),
          ...(columns.includes("error-import")
            ? {
                errorState: {
                  size: 120,
                  header: () => (
                    <>
                      <Tooltip
                        label={<Text>Détails</Text>}
                        aria-label="A tooltip"
                        background="bluefrance"
                        color="white"
                        padding="2w"
                      >
                        <Box>
                          Erreur(s) sur la donnée
                          <Text as="span" ml={1}>
                            <InfoLine h="14px" w="14px" color="grey.500" ml="1v" mb="1v" />
                          </Text>
                        </Box>
                      </Tooltip>
                    </>
                  ),
                  cell: ({ row }) => RenderErrorImport(organismesEffectifs[row.id]),
                },
              }
            : {}),
          ...(columns.includes("state")
            ? {
                state: {
                  size: 200,
                  header: () => (
                    <>
                      <Tooltip
                        label={
                          <Text>
                            {modeSifa
                              ? "Si les données sont suffissantes pour SIFA"
                              : "les données contiennent elles des erreurs"}
                          </Text>
                        }
                        aria-label="A tooltip"
                        background="bluefrance"
                        color="white"
                        padding="2w"
                      >
                        <Box pl={5}>
                          État de la donnée
                          <Text as="span" ml={1}>
                            <InfoLine h="14px" w="14px" color="grey.500" ml="1v" mb="1v" />
                          </Text>
                        </Box>
                      </Tooltip>
                    </>
                  ),
                  cell: ({ row }) => {
                    const { id } = organismesEffectifs[row.id];
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    const { validation_errors, requiredSifa } = useRecoilValue<any>(effectifStateSelector(id)); // Not the best; THIS IS AN EXCEPTION; This should not be reproduce anywhere else

                    const MissingSIFA = ({ requiredSifa }) => {
                      if (!requiredSifa?.length)
                        return (
                          <HStack color="flatsuccess" w="full" pl={5}>
                            <ValidateIcon boxSize={4} /> <Text fontSize="1rem">Complète pour SIFA</Text>
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
                          <HStack color="warning" w="full" pl={5}>
                            <Alert boxSize={4} />{" "}
                            <Text fontSize="1rem">{requiredSifa.length} manquante(s) pour SIFA</Text>
                          </HStack>
                        </Tooltip>
                      );
                    };

                    const ValidationsErrorsInfo = ({ validation_errors }) => {
                      if (!validation_errors?.length) return null;
                      return (
                        <Tooltip
                          label={
                            <Box maxW="350px">
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
                          maxW="350px"
                        >
                          <HStack color="redmarianne" w="full" pl={5}>
                            <Alert boxSize={4} />{" "}
                            <Text fontSize="1rem">{validation_errors.length} erreur(s) de transmission</Text>
                          </HStack>
                        </Tooltip>
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
