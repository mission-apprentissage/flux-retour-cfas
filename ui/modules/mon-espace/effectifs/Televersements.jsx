import React, { useCallback, useState } from "react";
import { useRecoilValue } from "recoil";
import { Box, Button, Flex, Heading, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { Alert, ArrowDropRightLine, InfoLine } from "../../../theme/components/icons";
import UploadFiles from "./engine/TransmissionFichier/components/UploadFiles";
import { useDocuments, useFetchUploads } from "./engine/TransmissionFichier/hooks/useDocuments";
import { _get, _post } from "../../../common/httpClient";
import { organismeAtom } from "../../../hooks/organismeAtoms";
import { ArrowRightLong } from "../../../theme/components/icons";
import { Input } from "./engine/formEngine/components/Input/Input";
import uniq from "lodash.uniq";
import EffectifsTable from "./engine/EffectifsTable";
import { useRouter } from "next/router";

const Televersements = () => {
  useFetchUploads();
  const { documents, uploads, onDocumentsChanged } = useDocuments();
  const [step, setStep] = useState("upload");
  const organisme = useRecoilValue(organismeAtom);
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

  const onDefineFileType = useCallback(
    async (type_document) => {
      if (type_document.length > 4) {
        const { nom_fichier, taille_fichier } = documents.unconfirmed[0];
        const response = await _post(`/api/v1/upload/setDocumentType`, {
          organisme_id: organisme._id,
          type_document,
          nom_fichier,
          taille_fichier,
        });
        onDocumentsChanged(response.documents, response.typesAndMapping);
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

      let newAvailableKeys = { in: [...availableKeys.in], out: [...availableKeys.out] };
      if (prevValue) {
        const prevKeyLocked = newAvailableKeys[part].find((nAK) => nAK.value === prevValue);
        prevKeyLocked.locked = false;
      }
      const keyToLock = newAvailableKeys[part].find((nAK) => nAK.value === value);
      keyToLock.locked = true;
      setAvailableKeys(newAvailableKeys);
    },
    [availableKeys.in, availableKeys.out, lines, requireKeysSettled]
  );

  const onGoToMappingStep = useCallback(async () => {
    setStep("mapping");
    const response = await _get(`/api/v1/upload/analyse?organisme_id=${organisme._id}`);
    setLines(
      Object.values(response.requireKeys).map((requireKey) => ({
        in: { value: "", hasError: false },
        out: { value: requireKey.value, hasError: false },
      }))
    );
    setAvailableKeys({ in: Object.values(response.inputKeys), out: Object.values(response.outputKeys) });
    console.log(response, uploads.typesAndMapping[0].mapping_column);
    setMapping(response);
  }, [organisme._id, uploads?.typesAndMapping]);

  const onGoToPreImportStep = useCallback(async () => {
    setPreEffictifs({ canBeImport: [], canNotBeImport: [] });
    setStep("pre-import");
    const keyToKeyMapping = lines.reduce((acc, line) => {
      return { ...acc, [line.in.value]: line.out.value };
    }, {});
    const { canBeImportEffectifs, canNotBeImportEffectifs } = await _post(`/api/v1/upload/pre-import`, {
      organisme_id: organisme._id,
      mapping: keyToKeyMapping,
    });
    setPreEffictifs({ canBeImport: canBeImportEffectifs, canNotBeImport: canNotBeImportEffectifs });
  }, [lines, organisme._id]);

  const onGoToImportStep = useCallback(async () => {
    setStep("import");
    const response = await _post(`/api/v1/upload/import`, {
      organisme_id: organisme._id,
    });
    console.log(response);
    router.push(`${router.asPath.replace("/televersement", "")}`);
    //onDocumentsChanged(documents, type_document);
  }, [organisme._id, router]);

  return (
    <>
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        {step === "upload" && (
          <>
            <UploadFiles title={`1. Téléverser votre fichier`} />

            <Heading as="h3" flexGrow="1" fontSize="1.2rem" mt={2} mb={5}>
              2. Quel est le modèle de ce fichier ?
            </Heading>
            <HStack justifyContent="center" spacing="4w" border="1px solid" borderColor="bluefrance" mb={8} py={4}>
              <VStack w="33%" h="full" alignItems="baseline">
                <Heading as="h4" fontSize="1rem">
                  Modèle pré-défini:
                </Heading>
                <Text>Que vous avez déjà défini ultérieurement</Text>
                <Input
                  {...{
                    name: `type_document`,
                    fieldType: "select",
                    placeholder: "Séléctionner un modèle de fichier",
                    locked: !documents?.unconfirmed?.length || !uploads?.typesAndMapping?.length,

                    options: uploads?.typesAndMapping?.length
                      ? uploads?.typesAndMapping?.map(({ type_document }) => ({
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
                <Text>vous pouvez choisir le nom que vous souhaitez</Text>
                <Input
                  {...{
                    name: `type_document`,
                    fieldType: "text",
                    placeholder: "type de fichier service insciption",
                    locked: !documents?.unconfirmed?.length,
                  }}
                  onSubmit={(value) => onDefineFileType(value)}
                  value={typeDocument}
                />
              </VStack>
            </HStack>
            <Button onClick={onGoToMappingStep} size={"md"} variant="primary" disabled={typeDocument === ""}>
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
                {Object.values(mapping.requireKeys).map((requireKey, i) => {
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
                    </HStack>
                  );
                })}
              </Box>

              {lines.length < Object.keys(mapping.requireKeys).length + mapping.numberOfNotRequiredFieldsToMap && (
                <Button
                  onClick={() =>
                    setLines((prevLines) => {
                      if (
                        prevLines.length ===
                        Object.keys(mapping.requireKeys).length + mapping.numberOfNotRequiredFieldsToMap
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
                  size={"md"}
                  variant="secondary"
                  disabled={requireKeysSettled.length < Object.keys(mapping.requireKeys).length}
                >
                  + Ajouter une donnée
                </Button>
              )}
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
                        onSubmit={(value) => onLineChange({ line: lineNum, part: "in" }, { value, hasError: false })}
                        w="33%"
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
                        onSubmit={(value) => onLineChange({ line: lineNum, part: "out" }, { value, hasError: false })}
                        w="33%"
                      />
                    </HStack>
                  );
                })}
            </Box>

            <Button onClick={() => setStep("upload")} size={"md"} variant="secondary">
              <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} mr="0.5rem" transform="rotate(180deg)" />
              Étape Précedente
            </Button>
            <Button
              onClick={() => onGoToPreImportStep()}
              size={"md"}
              variant="primary"
              disabled={requireKeysSettled.length < Object.keys(mapping.requireKeys).length}
            >
              Étape suivante
              <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
            </Button>
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
                  columns={["expander", "annee_scolaire", "cfd", "nom", "prenom", "separator", "state"]}
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
