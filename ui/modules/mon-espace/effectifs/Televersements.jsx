import React, { useCallback, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Link,
  Radio,
  RadioGroup,
  Spinner,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Alert, ArrowDropRightLine, Bin, InfoLine, ValidateIcon } from "../../../theme/components/icons";
import UploadFiles from "./engine/TransmissionFichier/components/UploadFiles";
import { useDocuments, useFetchUploads } from "./engine/TransmissionFichier/hooks/useDocuments";
import { _get, _post } from "../../../common/httpClient";
import { organismeAtom } from "../../../hooks/organismeAtoms";
import { ArrowRightLong } from "../../../theme/components/icons";
import { Input } from "./engine/formEngine/components/Input/Input";
import uniq from "lodash.uniq";
import EffectifsTable from "./engine/EffectifsTable";
import { useRouter } from "next/router";
import { effectifsStateAtom } from "./engine/atoms";

const Televersements = () => {
  useFetchUploads();
  const { documents, uploads, onDocumentsChanged } = useDocuments();
  const [step, setStep] = useState("landing");
  const organisme = useRecoilValue(organismeAtom);
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);
  const [mapping, setMapping] = useState(null);
  const router = useRouter();

  const [availableKeys, setAvailableKeys] = useState({
    in: [{ label: "", value: "" }],
    out: [{ label: "", value: "" }],
  });
  const [lines, setLines] = useState([]);
  const [requireKeysSettled, setRequireKeysSettled] = useState([]);

  const [preEffictifs, setPreEffictifs] = useState({ canBeImport: [], canNotBeImport: [] });
  const [typeDocument, setTypeDocument] = useState("");
  const [typeCodeDiplome, setTypeCodeDiplome] = useState("");
  const [savedAsModel, setSavedAsModel] = useState(false);
  const [modelAsChange, setModelAsChange] = useState(false);
  const toast = useToast();

  const [mappingForThisType] = uploads?.models?.filter(({ type_document }) => type_document === typeDocument) || [];

  const onDefineFileType = useCallback(
    async (type_document) => {
      if (type_document.length >= 4) {
        const { nom_fichier, taille_fichier } = documents.unconfirmed[0];
        const response = await _post(`/api/v1/upload/setDocumentType`, {
          organisme_id: organisme._id,
          type_document,
          nom_fichier,
          taille_fichier,
        });
        onDocumentsChanged(response.documents, response.models);
      }
      setTypeDocument(type_document);
    },
    [documents?.unconfirmed, onDocumentsChanged, organisme._id]
  );

  const onLineChange = useCallback(
    ({ line, part }, { value, hasError, required = false }) => {
      let newLines = [...lines];
      const prevValue = newLines[line][part].value;
      newLines[line][part].value = value;
      newLines[line][part].hasError = hasError;
      setLines(newLines);

      if (required) {
        if (newLines[line].in.value && newLines[line].out.value) {
          let newRequireKeysSettled = [...requireKeysSettled];
          if (prevValue) {
            const prevIndex = requireKeysSettled.indexOf(prevValue);
            newRequireKeysSettled[prevIndex] = value;
          } else {
            newRequireKeysSettled.push(value);
          }
          setRequireKeysSettled(uniq(newRequireKeysSettled));
        }
      }

      if (line !== 0) {
        // line 0 is anne scolaire
        let newAvailableKeys = { in: [...availableKeys.in], out: [...availableKeys.out] };
        if (prevValue) {
          const prevKeyLocked = newAvailableKeys[part].find((nAK) => nAK.value === prevValue);
          prevKeyLocked.locked = false;
        }
        const keyToLock = newAvailableKeys[part].find((nAK) => nAK.value === value);
        keyToLock.locked = true;
        setAvailableKeys(newAvailableKeys);
        if (mappingForThisType) setModelAsChange(true);
      }
    },
    [availableKeys.in, availableKeys.out, lines, mappingForThisType, requireKeysSettled]
  );

  const removeLine = useCallback(
    ({ lineNum }) => {
      const currentLine = lines[lineNum];
      let newAvailableKeys = { in: [...availableKeys.in], out: [...availableKeys.out] };
      const currentInKeyLocked = newAvailableKeys.in.find((nAK) => nAK.value === currentLine.in.value);
      const currentOutKeyLocked = newAvailableKeys.out.find((nAK) => nAK.value === currentLine.out.value);
      if (currentInKeyLocked) currentInKeyLocked.locked = false;
      if (currentOutKeyLocked) currentOutKeyLocked.locked = false;

      let newLines = [...lines];
      if (lineNum > -1) {
        newLines.splice(lineNum, 1);
      }

      setLines(newLines);
      setAvailableKeys(newAvailableKeys);
    },
    [availableKeys.in, availableKeys.out, lines]
  );

  const onGoBackToUpload = useCallback(async () => {
    setMapping(null);
    setStep("upload");
  }, []);

  const onGoToMappingStep = useCallback(async () => {
    toast.closeAll();
    setStep("mapping");
    const response = await _get(`/api/v1/upload/analyse?organisme_id=${organisme._id}`);

    let currentAvailableKeys = { in: Object.values(response.inputKeys), out: Object.values(response.outputKeys) };

    let initLines = [];
    if (mappingForThisType && mappingForThisType.mapping_column) {
      let { typeCodeDiplome, ...userMapping } = mappingForThisType.mapping_column;
      let indexAnneSco = 0;
      userMapping[""] = typeCodeDiplome === "CFD" ? "RNCP" : "CFD";
      // console.log(userMapping);
      // Object.entries(userMapping)
      // const remap = {
      //   annee_scolaire: "2020-2021",
      //   ...(typeCodeDiplome === "CFD"
      //     ? {
      //         CFD: "CFD",
      //         "": "RNCP",
      //       }
      //     : { "": "CFD", RNCP: "RNCP" }),
      //   nom: "nom",
      //   prenom: "prenom",
      // };
      initLines = Object.entries(userMapping).map(([key, value], i) => {
        if (key === "annee_scolaire") {
          indexAnneSco = i;
          return {
            in: { value: "", hasError: false },
            out: { value: key, hasError: false },
          };
        }
        return {
          in: { value: key, hasError: false },
          out: { value: value, hasError: false },
        };
      });

      // TODO check if exist in current mapping
      let reqKeys = Object.values(userMapping);
      reqKeys.splice(indexAnneSco, 1);

      console.log(reqKeys, initLines, currentAvailableKeys);

      setTypeCodeDiplome(typeCodeDiplome);
      setRequireKeysSettled(reqKeys);
      let error = false;
      for (const value of reqKeys) {
        try {
          const keyToLock = currentAvailableKeys.in.find((nAK) => nAK.value === value);
          keyToLock.locked = true;
        } catch (err) {
          error = true;
        }
      }
      if (error) {
        // Model does not match mapping on required field so gracefully reset
        toast({
          title: `Le modèle que vous avez choisi ne correspond pas à ce fichier. Veuillez choisir un autre modèle ou en créer un nouveau`,
          status: "error",
          duration: 10000,
          isClosable: true,
        });
        onGoBackToUpload();
      }
    } else {
      initLines = Object.values(response.requireKeys).map((requireKey) => ({
        in: { value: "", hasError: false },
        out: { value: requireKey.value, hasError: false },
      }));
    }
    setAvailableKeys(currentAvailableKeys);
    setLines(initLines);

    setMapping(response);
  }, [mappingForThisType, onGoBackToUpload, organisme._id, toast]);

  const onDefineAsModel = useCallback(async () => {
    const keyToKeyMapping = lines.reduce((acc, line) => {
      if (line.out.value === "annee_scolaire") return { ...acc, annee_scolaire: line.in.value };
      return { ...acc, [line.in.value]: line.out.value };
    }, {});
    await _post(`/api/v1/upload/setModel`, {
      organisme_id: organisme._id,
      type_document: typeDocument,
      mapping: keyToKeyMapping,
    });
    setSavedAsModel(true);
  }, [lines, organisme._id, typeDocument]);

  const onGoToPreImportStep = useCallback(async () => {
    setPreEffictifs({ canBeImport: [], canNotBeImport: [], duplicate: [] });
    setStep("pre-import");
    const keyToKeyMapping = lines.reduce(
      (acc, line) => {
        if (!line.in.value) return acc;
        if (line.out.value === "annee_scolaire") return { ...acc, annee_scolaire: line.in.value };
        return { ...acc, [line.in.value]: line.out.value };
      },
      { typeCodeDiplome }
    );
    const { canBeImportEffectifs, canNotBeImportEffectifs, duplicatesEffectifs } = await _post(
      `/api/v1/upload/pre-import`,
      {
        organisme_id: organisme._id,
        mapping: keyToKeyMapping,
      }
    );

    // eslint-disable-next-line no-undef
    const newEffectifsState = new Map();
    for (const { id, validation_errors } of canBeImportEffectifs) {
      newEffectifsState.set(id, { validation_errors, requiredSifa: [] });
    }
    setCurrentEffectifsState(newEffectifsState);

    setPreEffictifs({
      canBeImport: canBeImportEffectifs,
      canNotBeImport: canNotBeImportEffectifs,
      duplicate: duplicatesEffectifs,
    });
  }, [lines, organisme._id, setCurrentEffectifsState, typeCodeDiplome]);

  const onGoToImportStep = useCallback(async () => {
    setStep("import");
    await _post(`/api/v1/upload/import`, {
      organisme_id: organisme._id,
    });
    router.push(`${router.asPath.replace("/televersement", "")}`);
    //onDocumentsChanged(documents, type_document);
  }, [organisme._id, router]);

  return (
    <>
      {step === "landing" && (
        <Flex alignItems="flex-start" mt={8} flexDirection="column">
          <Text>Je n&rsquo;ai pas de fichier. Vous pouvez utiliser notre fichier modèle.</Text>
          <Link href={`/api/v1/upload/model?organisme_id=${organisme._id}`} textDecoration={"underline"} isExternal>
            <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} ml="0.5rem" /> Télécharger le fichier modèle tableau de bord
          </Link>
          <Box mt={10}>
            <Button onClick={() => setStep("upload")} size={"md"} variant="primary">
              Téléverser un fichier
              <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
            </Button>
          </Box>
        </Flex>
      )}
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        {step === "upload" && (
          <>
            <UploadFiles title={`1. Téléverser votre fichier`} />

            <Heading as="h3" flexGrow="1" fontSize="1.2rem" mt={2} mb={5}>
              2. Quel est le modèle de correspondance de ce fichier ?
            </Heading>
            <HStack justifyContent="center" spacing="4w" border="1px solid" borderColor="bluefrance" mb={8} py={4}>
              <VStack w="33%" h="full" alignItems="baseline">
                <Heading as="h4" fontSize="1rem">
                  Modèle existants:
                </Heading>
                <Input
                  {...{
                    name: `type_document`,
                    fieldType: "select",
                    placeholder: "Séléctionner un modèle de fichier",
                    locked: !documents?.unconfirmed?.length || !uploads?.models?.length,

                    options: uploads?.models?.length
                      ? uploads?.models?.map(({ type_document }) => ({
                          label: type_document,
                          value: type_document,
                        }))
                      : [{ label: "", value: "" }],
                  }}
                  value={typeDocument}
                  onSubmit={(value) => onDefineFileType(value)}
                />
              </VStack>

              <Box>Ou</Box>
              <VStack w="33%" alignItems="baseline">
                <Heading as="h4" flexGrow="1" fontSize="1rem">
                  Nouveau modèle de fichier :
                </Heading>
                <Input
                  {...{
                    name: `type_document`,
                    fieldType: "text",
                    minLength: 4,
                    mask: "C",
                    maskBlocks: [
                      {
                        name: "C",
                        mask: "Pattern",
                        pattern: "^.*$",
                      },
                    ],
                    placeholder: "type de fichier service insciption",
                    validateMessage: "le modèle de fichier doit contenir au moins 4 caractéres",
                    locked: !documents?.unconfirmed?.length,
                  }}
                  onSubmit={(value) => onDefineFileType(value)}
                  onError={(value) => onDefineFileType(value)}
                  value={typeDocument}
                />
              </VStack>
            </HStack>
            <Button
              onClick={onGoToMappingStep}
              size={"md"}
              variant="primary"
              disabled={typeDocument === "" || !documents?.unconfirmed?.length}
            >
              Étape suivante
              <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
            </Button>
          </>
        )}
        {step === "mapping" && !mapping && <Spinner />}
        {step === "mapping" && mapping && lines.length && (
          <>
            <Box my={10}>
              <Box mb={8}>
                <VStack alignItems="middle">
                  <Heading as="h4" flexGrow="1" fontSize="1rem" mb={6}>
                    1. Préciser l&rsquo;année scolaire concernée par ce fichier
                  </Heading>
                  <HStack justifyContent="center" spacing="4w">
                    <Input
                      {...{
                        name: `line0_in`,
                        fieldType: "select",
                        placeholder: "Séléctionner l'année scolaire",
                        options: [
                          {
                            label: "2020-2021",
                            value: "2020-2021",
                          },
                          {
                            label: "2021-2022",
                            value: "2021-2022",
                          },
                          {
                            label: "2022-2023",
                            value: "2022-2023",
                          },
                          {
                            label: "2023-2024",
                            value: "2023-2024",
                          },
                          {
                            label: "2024-2025",
                            value: "2024-2025",
                          },
                        ],
                      }}
                      value={lines[0].in.value}
                      onSubmit={(value) =>
                        onLineChange({ line: 0, part: "in" }, { value, hasError: false, required: true })
                      }
                      w="33%"
                    />
                    <ArrowRightLong boxSize={10} color="bluefrance" />
                    <Input
                      {...{
                        name: `line0_out`,
                        fieldType: "text",
                        locked: true,
                      }}
                      value="Année scolaire"
                      w="33%"
                    />
                    <Box w="35px">&nbsp;</Box>
                  </HStack>
                </VStack>
              </Box>
              {lines[0].in.value && (
                <>
                  <Heading as="h4" flexGrow="1" fontSize="1rem">
                    2. Quel est votre code de référence ?
                  </Heading>
                  <Box mb={8}>
                    <VStack justifyContent="center">
                      <RadioGroup value={typeCodeDiplome} w="100%" mt={8}>
                        <VStack alignItems="flex-start">
                          <Flex w="100%">
                            <Radio
                              type="radio"
                              name="civility"
                              value="RNCP"
                              checked={typeCodeDiplome === "RNCP"}
                              onChange={() => {
                                setTypeCodeDiplome("RNCP");
                              }}
                            >
                              Code RNCP de la formation (exemple: RNCP34793)
                            </Radio>
                          </Flex>
                          <HStack justifyContent="center" spacing="4w" w="100%">
                            <Input
                              {...{
                                name: `line${2}_in`,
                                fieldType: "select",
                                placeholder: "Séléctionner une de vos en-têtes",
                                options: availableKeys.in,
                                locked: typeCodeDiplome !== "RNCP",
                              }}
                              value={lines[2].in.value}
                              onSubmit={(value) =>
                                onLineChange({ line: 2, part: "in" }, { value, hasError: false, required: true })
                              }
                              w="33%"
                            />
                            <ArrowRightLong boxSize={10} color="bluefrance" />
                            <Input
                              {...{
                                name: `line${2}_out`,
                                fieldType: "text",
                                locked: true,
                              }}
                              value="Code RNCP de la formation"
                              w="33%"
                            />
                            <Box w="35px">&nbsp;</Box>
                          </HStack>
                          <Flex w="100%" alignItems="center">
                            <Radio
                              type="radio"
                              name="civility"
                              value="CFD"
                              checked={typeCodeDiplome === "CFD"}
                              onChange={() => {
                                setTypeCodeDiplome("CFD");
                              }}
                            >
                              Code Formation Diplôme (exemple: 46T32401)
                            </Radio>
                          </Flex>

                          <HStack justifyContent="center" spacing="4w" w="100%">
                            <Input
                              {...{
                                name: `line${1}_in`,
                                fieldType: "select",
                                placeholder: "Séléctionner une de vos en-têtes",
                                options: availableKeys.in,
                                locked: typeCodeDiplome !== "CFD",
                              }}
                              value={lines[1].in.value}
                              onSubmit={(value) =>
                                onLineChange({ line: 1, part: "in" }, { value, hasError: false, required: true })
                              }
                              w="33%"
                            />
                            <ArrowRightLong boxSize={10} color="bluefrance" />
                            <Input
                              {...{
                                name: `line${1}_out`,
                                fieldType: "text",
                                locked: true,
                              }}
                              value="Code Formation Diplôme"
                              w="33%"
                            />
                            <Box w="35px">&nbsp;</Box>
                          </HStack>
                        </VStack>
                      </RadioGroup>
                    </VStack>
                  </Box>
                </>
              )}
              {(lines[1].in.value || lines[2].in.value) && typeCodeDiplome && (
                <>
                  <Heading as="h4" flexGrow="1" fontSize="1rem">
                    3. Choisir vos correspondances pour les colonnes obligatoires nom et prénom
                  </Heading>
                  <Box my={8}>
                    {Object.values(mapping.requireKeys).map((requireKey, i) => {
                      if (
                        requireKey.value === "annee_scolaire" ||
                        requireKey.value === "CFD" ||
                        requireKey.value === "RNCP"
                      )
                        return; // skip annee_scolaire because it's above

                      return (
                        <HStack justifyContent="center" spacing="4w" key={requireKey.value}>
                          <Input
                            {...{
                              name: `line${i}_in`,
                              fieldType: "select",
                              placeholder: "Séléctionner une de vos en-têtes",
                              options: availableKeys.in,
                            }}
                            value={lines[i].in.value}
                            onSubmit={(value) =>
                              onLineChange({ line: i, part: "in" }, { value, hasError: false, required: true })
                            }
                            w="33%"
                          />
                          <ArrowRightLong boxSize={10} color="bluefrance" />
                          <Input
                            {...{
                              name: `line${i}_out`,
                              fieldType: "text",
                              locked: true,
                            }}
                            value={requireKey.label}
                            w="33%"
                          />
                          <Box w="35px">&nbsp;</Box>
                        </HStack>
                      );
                    })}
                  </Box>
                </>
              )}
              {typeCodeDiplome && (
                <>
                  {!(requireKeysSettled.length < Object.keys(mapping.requireKeys).length - 1) && (
                    <>
                      <Heading as="h4" flexGrow="1" fontSize="1rem">
                        4. Choisir vos correspondances pour d&rsquo;autres colonnes que vous souhaitez importer
                        (optionnel)
                      </Heading>
                      {lines.length <
                        Object.keys(mapping.requireKeys).length - 1 + mapping.numberOfNotRequiredFieldsToMap && (
                        <Button
                          onClick={() =>
                            setLines((prevLines) => {
                              if (
                                prevLines.length ===
                                Object.keys(mapping.requireKeys).length - 1 + mapping.numberOfNotRequiredFieldsToMap
                              )
                                return prevLines;
                              return [
                                ...prevLines,
                                {
                                  in: { value: "", hasError: false },
                                  out: { value: "", hasError: false },
                                },
                              ];
                            })
                          }
                          mt={3}
                          size={"md"}
                          variant="secondary"
                          disabled={requireKeysSettled.length < Object.keys(mapping.requireKeys).length - 1}
                        >
                          + Ajouter une donnée
                        </Button>
                      )}
                      <Box my={8}>
                        {Array(lines.length - Object.keys(mapping.requireKeys).length)
                          .fill(null)
                          .map((f, i) => {
                            const lineNum = i + Object.keys(mapping.requireKeys).length;
                            return (
                              <HStack justifyContent="center" spacing="4w" key={lineNum}>
                                <Input
                                  {...{
                                    name: `line${lineNum}_in`,
                                    fieldType: "select",
                                    placeholder: "Séléctionner une de vos en-têtes",
                                    options: availableKeys.in,
                                  }}
                                  value={lines[lineNum].in.value}
                                  onSubmit={(value) =>
                                    onLineChange({ line: lineNum, part: "in" }, { value, hasError: false })
                                  }
                                  w="33%"
                                  mb={0}
                                />
                                <ArrowRightLong boxSize={10} color="bluefrance" />
                                <Input
                                  {...{
                                    name: `line${lineNum}_out`,
                                    fieldType: "select",
                                    placeholder: "Séléctionner une de vos en-têtes",
                                    options: availableKeys.out,
                                  }}
                                  value={lines[lineNum].out.value}
                                  onSubmit={(value) =>
                                    onLineChange({ line: lineNum, part: "out" }, { value, hasError: false })
                                  }
                                  w="33%"
                                  mb={0}
                                />
                                <Box
                                  w="35px"
                                  p={1}
                                  mt="8px !important"
                                  _hover={{ cursor: "pointer" }}
                                  onClick={() => removeLine({ lineNum })}
                                >
                                  <Bin color="redmarianne" cursor="pointer" />
                                </Box>
                              </HStack>
                            );
                          })}
                      </Box>
                    </>
                  )}
                </>
              )}
            </Box>
            {lines[0].in.value && modelAsChange && mappingForThisType && !mappingForThisType.lock && (
              <VStack mb={8} alignItems="flex-start" border="1px solid" borderColor="bluefrance" p={2}>
                <Heading as="h4" flexGrow="1" fontSize="1rem">
                  Sauvegarder les modifcations du modéle (optionnel)
                </Heading>
                <Text>
                  Sauvegarder ces correspondances comme modèle pour les prochains téléversements.
                  <br /> Cette action remplacera le précedente modèle sauvegarder.
                </Text>
                <HStack>
                  <Button
                    onClick={() => onDefineAsModel()}
                    size={"md"}
                    variant="primary"
                    disabled={requireKeysSettled.length < Object.keys(mapping.requireKeys).length || savedAsModel}
                  >
                    Sauvegarder
                  </Button>
                  {savedAsModel && <ValidateIcon color="flatsuccess" boxSize={4} />}
                </HStack>
              </VStack>
            )}
            <HStack>
              <Button onClick={onGoBackToUpload} size={"md"} variant="secondary">
                <ArrowDropRightLine
                  w={"0.75rem"}
                  h={"0.75rem"}
                  mt={"0.250rem"}
                  mr="0.5rem"
                  transform="rotate(180deg)"
                />
                Étape précedente
              </Button>

              <Button
                onClick={() => onGoToPreImportStep()}
                size={"md"}
                variant="primary"
                disabled={requireKeysSettled.length < Object.keys(mapping.requireKeys).length - 1}
              >
                Étape suivante (Prévisualiser)
                <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
              </Button>
            </HStack>
          </>
        )}
        {step === "pre-import" && !preEffictifs.canBeImport.length && !preEffictifs.canNotBeImport.length && (
          <Spinner />
        )}
        {step === "pre-import" && (!!preEffictifs.canBeImport.length || !!preEffictifs.canNotBeImport.length) && (
          <Box>
            <Heading textStyle="h2" color="grey.800" mb={5}>
              Prévisualisation:
            </Heading>
            {!!preEffictifs.canNotBeImport.length && (
              <Box my={6}>
                <Heading as="h4" flexGrow="1" fontSize="1rem" color="red.500" mb={5}>
                  Lignes en erreurs
                </Heading>
                <HStack color="red.500" w="full" pl={5}>
                  <Alert boxSize={4} />
                  <Text fontSize="1rem">
                    Les lignes ci-dessous ne pourront pas être importées car des champs obligatoires sont erronés ou
                    manquants:
                  </Text>
                </HStack>

                <EffectifsTable
                  organismesEffectifs={preEffictifs.canNotBeImport}
                  columns={["annee_scolaire", "cfd", "nom", "prenom"]}
                  show="errorInCell"
                />
              </Box>
            )}
            {!!preEffictifs.duplicate.length && (
              <Box my={6}>
                <Heading as="h4" flexGrow="1" fontSize="1rem" color="red.500" mb={5}>
                  Doublons dans le fichier
                </Heading>
                <HStack color="red.500" w="full" pl={5}>
                  <Alert boxSize={4} />
                  <Text fontSize="1rem">
                    Les lignes ci-dessous sont des doublons.Elles ne pourront pas être importées.
                  </Text>
                </HStack>

                <EffectifsTable
                  organismesEffectifs={preEffictifs.duplicate}
                  columns={["annee_scolaire", "cfd", "nom", "prenom"]}
                  show="errorInCell"
                />
              </Box>
            )}
            {!!preEffictifs.canBeImport.length && (
              <Box my={10}>
                <HStack color="bluefrance" w="full" pl={5}>
                  <InfoLine h="14px" boxSize={4} />
                  <Text fontSize="1rem">
                    Les lignes ci-dessous pourront être importées. Il se peut que des champs non obligatoires sont
                    erronés:
                  </Text>
                </HStack>
                <EffectifsTable
                  organismesEffectifs={preEffictifs.canBeImport}
                  columns={["expander", "annee_scolaire", "cfd", "nom", "prenom", "separator", "action", "state"]}
                  effectifsSnapshot
                />
              </Box>
            )}
            <Button
              onClick={() => {
                setStep("mapping");
              }}
              size={"md"}
              variant="secondary"
            >
              <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} mr="0.5rem" transform="rotate(180deg)" />
              Étape Précedente
            </Button>
            <Button onClick={() => onGoToImportStep()} size={"md"} variant="primary">
              Importer les données
              <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
            </Button>
          </Box>
        )}
        {step === "import" && (
          <>
            <Spinner />
            <Text fontSize="1rem">Veuillez patienter pendant l&rsquo;importation de votre fichier.</Text>
            <Text fontSize="1rem">
              Une fois cette opération terminée vous serez redirigé automatiquement sur votre tableau d&rsquo;effectif.
            </Text>
          </>
        )}
      </Flex>
    </>
  );
};

export default Televersements;
