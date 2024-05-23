import { Box, Text, HStack, Button, UnorderedList, ListItem } from "@chakra-ui/react";
import { DateTime } from "luxon";
import React, { useState } from "react";
import { useRecoilValue } from "recoil";
import { ERPS, getStatut } from "shared";

import Table from "@/components/Table/Table";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { AddFill, Alert, SubtractLine, ValidateIcon } from "@/theme/components/icons";

import EffectifTableDetails from "./EffectifsTableDetails";
import { effectifStateSelector } from "./formEngine/atoms";

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
  canEdit?: boolean;
  columns?: string[];
  show?: string;
  searchValue?: string;
  RenderErrorImport?: (data: any) => any;
  onCountItemsChange?: (count: number) => any;
  triggerExpand: any;
  onTriggerExpand: any;
  tableId: string;
}

const EffectifsTable = ({
  organismesEffectifs,
  modeSifa = false,
  canEdit = false,
  columns = ["expander", "annee_scolaire", "statut_courant", "nom", "prenom", "separator", "source", "state"],
  show = "normal",
  searchValue,
  RenderErrorImport = () => {},
  onCountItemsChange = () => {},
  triggerExpand,
  onTriggerExpand,
  tableId,
}: EffectifsTableProps) => {
  const [count, setCount] = useState(organismesEffectifs.length);

  return (
    <Box mt={4}>
      {count > 0 && <Text>{count} apprenant(es)</Text>}
      <Table
        mt={4}
        tableId={tableId}
        data={organismesEffectifs}
        searchValue={searchValue}
        onCountItemsChange={(count) => {
          setCount(count);
          onCountItemsChange(count);
        }}
        triggerExpand={triggerExpand}
        columns={{
          ...(columns.includes("expander")
            ? {
                expander: {
                  size: 25,
                  header: () => " ",
                  cell: ({ row }) => {
                    return row.getCanExpand() ? (
                      <Button
                        onClick={() => {
                          onTriggerExpand({ tableId: tableId, rowId: row.id });
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
                    const statut = organismesEffectifs[row.id]?.statut;

                    if (!statut || !statut.parcours.length) {
                      return (
                        <Text fontSize="1rem" fontWeight="bold" color="redmarianne">
                          Aucun statut
                        </Text>
                      );
                    }
                    const historiqueSorted = statut.parcours.sort((a, b) => {
                      return new Date(a.date_statut).getTime() - new Date(b.date_statut).getTime();
                    });
                    const current = [...historiqueSorted].pop();

                    return (
                      <HStack textAlign="left">
                        <Text fontSize="1rem" fontWeight="bold">
                          {getStatut(current.valeur)}
                        </Text>
                        <Text fontSize="0.8rem">
                          (depuis {DateTime.fromISO(current.date).setLocale("fr-FR").toFormat("dd/MM/yyyy")})
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
                    <Box>
                      Nom{" "}
                      <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
                        *
                      </Box>
                    </Box>
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
                    <Box>
                      Prénom{" "}
                      <Box as="span" role="presentation" aria-hidden="true" color="red.500" ml={1}>
                        *
                      </Box>
                    </Box>
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
                    <Box>
                      Source
                      <InfoTooltip
                        contentComponent={() => (
                          <Text>D&rsquo;où vient la donnée? Exemple la transmission a été faite depuis un ERP</Text>
                        )}
                      />
                    </Box>
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
                    <Box>
                      Action
                      <InfoTooltip contentComponent={() => <Text>Action à faire</Text>} />
                    </Box>
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
                    <Box>
                      Erreur(s) sur la donnée
                      <InfoTooltip contentComponent={() => <Text>Détails</Text>} />
                    </Box>
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
                    <Box>
                      État de la donnée
                      <InfoTooltip
                        contentComponent={() => (
                          <Text>
                            {modeSifa
                              ? "Si les données sont suffissantes pour SIFA"
                              : "les données contiennent elles des erreurs"}
                          </Text>
                        )}
                      />
                    </Box>
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
                        <Box>
                          <HStack color="warning" w="full" pl={5}>
                            <Alert boxSize={4} />{" "}
                            <Text fontSize="1rem">{requiredSifa.length} manquante(s) pour SIFA</Text>
                          </HStack>
                          <InfoTooltip
                            contentComponent={() => (
                              <Box>
                                <Text fontWeight="bold">Champ(s) manquant(s) :</Text>
                                <UnorderedList>
                                  {requiredSifa.map((fieldName, i) => (
                                    <ListItem key={i}>{fieldName}</ListItem>
                                  ))}
                                </UnorderedList>
                              </Box>
                            )}
                          />
                        </Box>
                      );
                    };

                    const ValidationsErrorsInfo = ({ validation_errors }) => {
                      if (!validation_errors?.length) return null;
                      return (
                        <Box>
                          <HStack color="redmarianne" w="full" pl={5}>
                            <Alert boxSize={4} />{" "}
                            <Text fontSize="1rem">{validation_errors.length} erreur(s) de transmission</Text>
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
              }
            : {}),
        }}
        getRowCanExpand={() => true}
        renderSubComponent={({ row }) => {
          return <EffectifTableDetails row={row} modeSifa={modeSifa} canEdit={canEdit} />;
        }}
      />
    </Box>
  );
};

export default EffectifsTable;
