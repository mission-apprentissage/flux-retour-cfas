import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Radio,
  RadioGroup,
  Text,
  Tooltip,
  useToast,
  VStack,
} from "@chakra-ui/react";
import uniq from "lodash.uniq";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";
import { useSetRecoilState } from "recoil";

import { _get, _post, _put } from "@/common/httpClient";
import { sortByNormalizedLabels } from "@/common/utils/array";
import Ribbons from "@/components/Ribbons/Ribbons";
import useServerEvents from "@/hooks/useServerEvents";
import { ArrowDropRightLine, Bin, ErrorIcon, ValidateIcon, ArrowRightLong } from "@/theme/components/icons";

import { effectifsStateAtom } from "./engine/atoms";
import EffectifsTable from "./engine/EffectifsTable";
import { Input } from "./engine/formEngine/components/Input/Input";
import UploadFiles from "./engine/TransmissionFichier/components/UploadFiles";
import { useDocuments, useFetchUploads } from "./engine/TransmissionFichier/hooks/useDocuments";
import TeleversementInProgress from "./TeleversementInProgress";

const Televersements = ({ organisme }) => {
  const { documents, uploads, onDocumentsChanged } = useDocuments();
  const [step, setStep] = useState("upload");
  useFetchUploads(organisme?._id);
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);
  const [mapping, setMapping] = useState<any>(null);
  const router = useRouter();
  const [lastMessage, resetServerEvent] = useServerEvents();

  const [availableKeys, setAvailableKeys] = useState({
    in: [{ label: "", value: "", locked: false }],
    out: [{ label: "", value: "", locked: false }],
  });
  const [lines, setLines] = useState<any[]>([]);
  const [requireKeysSettled, setRequireKeysSettled] = useState<any[]>([]);

  const [preEffectifs, setPreEffectifs] = useState({ canBeImport: [], canNotBeImport: [] });
  const [typeDocument, setTypeDocument] = useState("");
  const [typeCodeDiplome, setTypeCodeDiplome] = useState("");
  const [savedAsModel, setSavedAsModel] = useState(false);
  const [modelAsChange, setModelAsChange] = useState(false);
  const toast = useToast();

  const [mappingForThisType]: any[] =
    uploads?.models?.filter(({ type_document }) => type_document === typeDocument) || [];

  const onDefineFileType = useCallback(
    async (type_document) => {
      if (type_document?.length >= 4) {
        const { document_id } = documents.unconfirmed[0];
        const response = await _put(`/api/v1/organismes/${organisme._id}/upload/doc/${document_id}/setDocumentType`, {
          type_document,
        });
        onDocumentsChanged(response.documents, response.models);
      }
      setTypeDocument(type_document);
    },
    [documents?.unconfirmed, onDocumentsChanged, organisme._id]
  );

  const onLineChange = useCallback(
    ({ line, part }, { value, hasError, required = false }) => {
      const newLines: any[] = [...lines];
      const prevValue: any = newLines[line][part].value;
      newLines[line][part].value = value;
      newLines[line][part].hasError = hasError;
      setLines(newLines);

      if (required) {
        if (newLines[line].in.value && newLines[line].out.value) {
          const newRequireKeysSettled = [...requireKeysSettled];
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
        const newAvailableKeys = { in: [...availableKeys.in], out: [...availableKeys.out] };
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
      const newAvailableKeys = { in: [...availableKeys.in], out: [...availableKeys.out] };
      const currentInKeyLocked = newAvailableKeys.in.find((nAK) => nAK.value === currentLine.in.value);
      const currentOutKeyLocked = newAvailableKeys.out.find((nAK) => nAK.value === currentLine.out.value);
      if (currentInKeyLocked) currentInKeyLocked.locked = false;
      if (currentOutKeyLocked) currentOutKeyLocked.locked = false;

      const newLines = [...lines];
      if (lineNum > -1) {
        newLines.splice(lineNum, 1);
      }

      setLines(newLines);
      setAvailableKeys(newAvailableKeys);
    },
    [availableKeys.in, availableKeys.out, lines]
  );

  const onGoBackToUpload = useCallback(async () => {
    resetServerEvent();
    setMapping(null);
    setStep("upload");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGoToMappingStep = useCallback(async () => {
    toast.closeAll();
    resetServerEvent();
    setStep("mapping");
    const response: {
      inputKeys: { label: string; value: string }[];
      outputKeys: { label: string; value: string }[];
      requireKeys: { label: string; value: string }[];
    } = await _get(`/api/v1/organismes/${organisme._id}/upload/analyse`);

    const currentAvailableKeys = {
      in: sortByNormalizedLabels(Object.values(response.inputKeys).map((o) => ({ ...o, locked: false }))),
      out: sortByNormalizedLabels(Object.values(response.outputKeys).map((o) => ({ ...o, locked: false }))),
    };

    let initLines: any[] = [];
    // TODO REFACTOR THIS BELOW :vomit:
    if (mappingForThisType?.mapping_column) {
      const { typeCodeDiplome, ...userMapping } = mappingForThisType.mapping_column;
      userMapping[""] = typeCodeDiplome === "CFD" ? "RNCP" : "CFD";
      let remap: any = Object.entries(userMapping).reduce(
        (acc, [key, value]: any) => (key !== "annee_scolaire" ? { ...acc, [value]: key } : acc),
        {}
      );
      const { CFD, RNCP, ...rest } = remap;
      remap = {
        annee_scolaire: "",
        ...(typeCodeDiplome === "CFD"
          ? {
              CFD: CFD,
              "": "RNCP",
            }
          : { "": "CFD", RNCP: RNCP }),
        nom: "nom",
        prenom: "prenom",
        ...rest,
      };

      initLines = Object.entries(remap).map(([key, value]) => {
        return {
          in: { value: key === "annee_scolaire" ? "" : value, hasError: false },
          out: { value: key, hasError: false },
        };
      });

      // TODO check if exist in current mapping

      let reqKeys = Object.values(remap).splice(3, Object.keys(response.requireKeys).length);
      reqKeys = [typeCodeDiplome, ...reqKeys];

      setTypeCodeDiplome(typeCodeDiplome);
      setRequireKeysSettled(reqKeys);
      let error = false;
      for (const value of reqKeys) {
        if (value !== "RNCP" && value !== "CFD") {
          const keyToLock = currentAvailableKeys.in.find((nAK) => nAK.value === value);
          if (keyToLock) {
            keyToLock.locked = true;
          } else {
            error = true;
          }
        }
      }

      if (error) {
        // Model does not match mapping on required field so gracefully reset
        toast({
          title:
            "Le modèle que vous avez choisi ne correspond pas à ce fichier. Veuillez choisir un autre modèle ou en créer un nouveau",
          status: "error",
          duration: 10000,
          isClosable: true,
        });
        onGoBackToUpload();
        return;
      }
    }

    initLines = Object.values(response.requireKeys).map((requireKey: any) => ({
      in: { value: "", hasError: false },
      out: { value: requireKey.value, hasError: false },
    }));

    setAvailableKeys(currentAvailableKeys);
    setLines(initLines);

    setMapping(response);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappingForThisType, organisme._id, toast]);

  const onDefineAsModel = useCallback(async () => {
    const keyToKeyMapping = lines.reduce((acc, line) => {
      if (line.out.value === "annee_scolaire") return { ...acc, annee_scolaire: line.in.value };
      return { ...acc, [line.in.value]: line.out.value };
    }, {});
    await _post(`/api/v1/organismes/${organisme._id}/upload/setModel`, {
      type_document: typeDocument,
      mapping: keyToKeyMapping,
    });
    setSavedAsModel(true);
  }, [lines, organisme._id, typeDocument]);

  const onGoToPreImportStep = useCallback(async () => {
    setPreEffectifs({ canBeImport: [], canNotBeImport: [] });
    setStep("pre-import");
    const keyToKeyMapping = lines.reduce(
      (acc, line) => {
        if (!line.in.value) return acc;
        if (line.out.value === "annee_scolaire") return { ...acc, annee_scolaire: line.in.value };
        return { ...acc, [line.in.value]: line.out.value };
      },
      { typeCodeDiplome }
    );
    const { canBeImportEffectifs, canNotBeImportEffectifs } = await _post(
      `/api/v1/organismes/${organisme._id}/upload/pre-import`,
      keyToKeyMapping
    );

    // eslint-disable-next-line no-undef
    const newEffectifsState = new Map();
    for (const { id, validation_errors } of canBeImportEffectifs) {
      newEffectifsState.set(id, { validation_errors, requiredSifa: [] });
    }
    setCurrentEffectifsState(newEffectifsState);

    setPreEffectifs({
      canBeImport: canBeImportEffectifs,
      canNotBeImport: canNotBeImportEffectifs,
    });
  }, [lines, organisme._id, setCurrentEffectifsState, typeCodeDiplome]);

  const onGoToImportStep = useCallback(async () => {
    setStep("import");
    resetServerEvent();
    await _post(`/api/v1/organismes/${organisme._id}/upload/import`, {});
    router.push(`${router.asPath.replace("/televersement", "").replace("/fichier", "")}`);
    //onDocumentsChanged(documents, type_document);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisme._id, router]);

  return (
    <>
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        {step === "upload" && (
          <>
            <UploadFiles title="1. Importer votre fichier" />

            <Heading as="h3" flexGrow="1" fontSize="1.2rem" mt={2} mb={5}>
              2. Quel est le modèle de correspondance de ce fichier ?
            </Heading>
            <HStack justifyContent="center" spacing="4w" border="1px solid" borderColor="bluefrance" mb={8} py={4}>
              <VStack w="33%" h="full" alignItems="baseline">
                <Heading as="h4" fontSize="1rem">
                  Modèle existant :
                </Heading>
                <Input
                  name="type_document"
                  fieldType="select"
                  placeholder="Sélectionner un modèle de fichier"
                  locked={!(documents?.unconfirmed?.length && uploads?.models?.length)}
                  options={
                    uploads?.models?.length
                      ? uploads?.models?.map(({ type_document }) => ({
                          label: type_document,
                          value: type_document,
                        }))
                      : [{ label: "", value: "" }]
                  }
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
                  name="type_document"
                  fieldType="text"
                  minLength={4}
                  mask="C"
                  maskBlocks={[
                    {
                      name: "C",
                      mask: "Pattern",
                      pattern: "^.*$",
                    },
                  ]}
                  placeholder="Nommez votre fichier"
                  validateMessage="le modèle de fichier doit contenir au moins 4 caractères"
                  locked={!documents?.unconfirmed?.length}
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
              isDisabled={typeDocument === "" || !documents?.unconfirmed?.length}
            >
              Étape suivante
              <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
            </Button>
          </>
        )}
        {step === "mapping" && !mapping && <TeleversementInProgress message={lastMessage} />}
        {step === "mapping" && mapping && lines.length && (
          <>
            <Box my={10}>
              <Box mb={8}>
                <VStack alignItems="middle">
                  <Heading as="h4" flexGrow="1" fontSize="1rem" mb={6}>
                    1. Préciser l&rsquo;année scolaire concernée par ce fichier
                  </Heading>
                  <HStack justifyContent="center" spacing="4w" alignItems="start">
                    <Input
                      name="line0_in"
                      fieldType="select"
                      placeholder="Sélectionner l'année scolaire"
                      options={[
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
                      ]}
                      value={lines[0].in.value}
                      onSubmit={(value) =>
                        onLineChange({ line: 0, part: "in" }, { value, hasError: false, required: true })
                      }
                      w="33%"
                    />
                    <ArrowRightLong boxSize={10} color="bluefrance" />
                    <Input name="line0_out" fieldType="text" locked={true} value="Année scolaire" w="33%" mt={0} />
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
                          <HStack justifyContent="center" spacing="4w" w="100%" alignItems="start">
                            <Input
                              name={`line${2}_in`}
                              fieldType="select"
                              placeholder="Sélectionner une de vos en-têtes"
                              options={availableKeys.in}
                              locked={typeCodeDiplome !== "RNCP"}
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

                          <HStack justifyContent="center" spacing="4w" w="100%" alignItems="start">
                            <Input
                              name={`line${1}_in`}
                              fieldType="select"
                              placeholder="Sélectionner une de vos en-têtes"
                              options={availableKeys.in}
                              locked={typeCodeDiplome !== "CFD"}
                              value={lines[1].in.value}
                              onSubmit={(value) =>
                                onLineChange({ line: 1, part: "in" }, { value, hasError: false, required: true })
                              }
                              w="33%"
                            />
                            <ArrowRightLong boxSize={10} color="bluefrance" />
                            <Input
                              name={`line${1}_out`}
                              fieldType="text"
                              locked
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
              {lines[0].in.value && (lines[1].in.value || lines[2].in.value) && typeCodeDiplome && (
                <>
                  <Heading as="h4" flexGrow="1" fontSize="1rem">
                    3. Choisir vos correspondances pour les colonnes obligatoires Nom et Prénom
                  </Heading>
                  <Box my={8}>
                    {Object.values(mapping.requireKeys).map((requireKey: any, i) => {
                      if (
                        requireKey.value === "annee_scolaire" ||
                        requireKey.value === "CFD" ||
                        requireKey.value === "RNCP"
                      )
                        return; // skip annee_scolaire because it's above

                      return (
                        <HStack justifyContent="center" spacing="4w" key={requireKey.value}>
                          <Input
                            name={`line${i}_in`}
                            fieldType="select"
                            placeholder="Sélectionner une de vos en-têtes"
                            options={availableKeys.in}
                            value={lines[i].in.value}
                            onSubmit={(value) =>
                              onLineChange({ line: i, part: "in" }, { value, hasError: false, required: true })
                            }
                            w="33%"
                          />
                          <ArrowRightLong boxSize={10} color="bluefrance" />
                          <Input name={`line${i}_out`} fieldType="text" locked value={requireKey.label} w="33%" />
                          <Box w="35px">&nbsp;</Box>
                        </HStack>
                      );
                    })}
                  </Box>
                </>
              )}
              {lines[0].in.value && (lines[1].in.value || lines[2].in.value) && typeCodeDiplome && (
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
                          isDisabled={requireKeysSettled.length < Object.keys(mapping.requireKeys).length - 1}
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
                                  name={`line${lineNum}_in`}
                                  fieldType="select"
                                  placeholder="Sélectionner une de vos en-têtes"
                                  options={availableKeys.in}
                                  value={lines[lineNum].in.value}
                                  onSubmit={(value) =>
                                    onLineChange({ line: lineNum, part: "in" }, { value, hasError: false })
                                  }
                                  w="33%"
                                  mb={0}
                                />
                                <ArrowRightLong boxSize={10} color="bluefrance" />
                                <Input
                                  name={`line${lineNum}_out`}
                                  fieldType="select"
                                  placeholder="Sélectionner une de vos en-têtes"
                                  options={availableKeys.out}
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
                  <br /> Cette action remplacera le précédente modèle sauvegarder.
                </Text>
                <HStack>
                  <Button
                    onClick={() => onDefineAsModel()}
                    size={"md"}
                    variant="primary"
                    isDisabled={requireKeysSettled.length < Object.keys(mapping.requireKeys).length || savedAsModel}
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
                Étape précédente
              </Button>

              <Button
                onClick={() => onGoToPreImportStep()}
                size={"md"}
                variant="primary"
                isDisabled={requireKeysSettled.length < Object.keys(mapping.requireKeys).length - 1}
              >
                Étape suivante (Prévisualiser)
                <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
              </Button>
            </HStack>
          </>
        )}
        {step === "pre-import" && !preEffectifs.canBeImport.length && !preEffectifs.canNotBeImport.length && (
          <TeleversementInProgress message={lastMessage} />
        )}
        {step === "pre-import" && (!!preEffectifs.canBeImport.length || !!preEffectifs.canNotBeImport.length) && (
          <Box>
            <Heading textStyle="h4" color="bluesoft.500" mb={5} fontSize="1.5rem">
              Prévisualisation
            </Heading>
            <Box>
              <Text>
                À cette étape, <Text as="strong">vous ne pourrez pas modifier les données</Text>, seulement les
                visualiser.
              </Text>
              <Text color="grey.800" mt={4} textStyle="sm">
                Les champs qui comportaient des informations en erreur suite à une précédente importation seront
                remplacés par les données de l’importation présente, si elles sont détectées comme non erronées par
                notre système.
                <br />
              </Text>
            </Box>
            <Ribbons variant="info" mt="0.5rem">
              <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                Vos données seront importées, selon vos choix ci-dessous :
              </Text>
              <Text color="grey.800" mt={2} textStyle="sm">
                Pour l&rsquo;année annéé scolaire : <Text as="strong">{lines[0].in.value}</Text>
                <br />
              </Text>
              <Text color="grey.800" mt={2} textStyle="sm">
                Code de référence pour les diplôme :{" "}
                <Text as="strong">{typeCodeDiplome === "CFD" ? "Code Formation Diplôme (CFD)" : "Code RNCP"}</Text>
                <br />
              </Text>
            </Ribbons>

            {!!preEffectifs.canNotBeImport.length && (
              <Box my={6}>
                <Ribbons variant="alert" mt="0.5rem">
                  <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                    Les lignes du tableau ci-dessous ne pourront pas être importées car elles contiennent des erreurs.
                  </Text>
                  <Text color="grey.800" mt={2} textStyle="sm">
                    Une fois votre importation terminée, vous pourrez : importer un nouveau fichier corrigé ou ajouter
                    une à une les lignes en question.
                    <br />
                  </Text>
                </Ribbons>

                <EffectifsTable
                  organismesEffectifs={preEffectifs.canNotBeImport}
                  columns={["cfd", "rncp", "nom", "prenom", "separator", "error-import"]}
                  RenderErrorImport={({ error }) => {
                    const errorText = {
                      requiredMissing: {
                        label: "Champ(s) obligatoire(s)",
                        details: "Les champs obligatoires sont erronés ou manquants. (CFD, nom, prénom)",
                      },
                      duplicate: {
                        label: "Doublon",
                        details: "Cette ligne est en double dans votre fichier",
                      },
                      formationNotFound: {
                        label: "Formation non retrouvée",
                        details: "Cette formation n'a pas été retrouvée dans les formations dispensées par l'organisme",
                      },
                    };

                    return (
                      <Tooltip
                        label={
                          <Box maxW="350px">
                            <Text fontWeight="bold">{errorText[error].details}</Text>
                          </Box>
                        }
                        aria-label="A tooltip"
                        background="bluefrance"
                        color="white"
                        padding="2w"
                        maxW="350px"
                      >
                        <HStack textAlign="left" color="red.500">
                          <ErrorIcon boxSize={4} />
                          <Text fontSize="1rem" color="red.500">
                            {errorText[error].label}
                          </Text>
                        </HStack>
                      </Tooltip>
                    );
                  }}
                  show="errorInCell"
                />
              </Box>
            )}

            {!!preEffectifs.canBeImport.length && (
              <Box my={10}>
                <Ribbons variant="warning" mt="0.5rem">
                  <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                    Les lignes du tableau ci-dessous pourront être importées.
                  </Text>
                  <Text mt={2} fontSize="0.9rem" color="grey.800" fontWeight="bold">
                    Attention : Il est possible que des champs non obligatoires soient erronés. Une fois votre
                  </Text>
                  <Text color="grey.800" textStyle="sm">
                    importation terminée, vous pourrez : importer un nouveau fichier corrigé ou les corriger sur votre
                    tableau de bord
                    <br />
                  </Text>
                </Ribbons>
                <EffectifsTable
                  organismesEffectifs={preEffectifs.canBeImport}
                  columns={["expander", "cfd", "rncp", "nom", "prenom", "separator", "action", "state"]}
                  effectifsSnapshot
                />
              </Box>
            )}
            <HStack spacing={4}>
              <Button
                onClick={() => {
                  setStep("mapping");
                }}
                size={"md"}
                variant="secondary"
              >
                <ArrowDropRightLine
                  w={"0.75rem"}
                  h={"0.75rem"}
                  mt={"0.250rem"}
                  mr="0.5rem"
                  transform="rotate(180deg)"
                />
                Étape précédente
              </Button>
              <Button onClick={() => onGoToImportStep()} size={"md"} variant="primary">
                Importer les données
                <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
              </Button>
            </HStack>
          </Box>
        )}
        {step === "import" && (
          <TeleversementInProgress message={lastMessage}>
            <Text fontSize="1rem">Veuillez patienter pendant l&rsquo;importation de votre fichier.</Text>
            <Text fontSize="1rem">
              Une fois cette opération terminée vous serez redirigé automatiquement sur votre tableau d&rsquo;effectif.
            </Text>
          </TeleversementInProgress>
        )}
      </Flex>
    </>
  );
};

export default Televersements;