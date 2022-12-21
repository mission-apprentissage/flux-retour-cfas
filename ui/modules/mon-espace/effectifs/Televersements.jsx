import React, { useCallback, useState } from "react";
import { useRecoilValue } from "recoil";
import { Box, Button, Flex, HStack, Spinner } from "@chakra-ui/react";
import { ArrowDropRightLine } from "../../../theme/components/icons";
import UploadFiles from "./engine/TransmissionFichier/components/UploadFiles";
import { useDocuments, useFetchUploads } from "./engine/TransmissionFichier/hooks/useDocuments";
import { _get, _post } from "../../../common/httpClient";
import { organismeAtom } from "../../../hooks/organismeAtoms";
import { ArrowRightLong } from "../../../theme/components/icons";
import { Input } from "./engine/formEngine/components/Input/Input";
import uniq from "lodash.uniq";

const Televersements = () => {
  useFetchUploads();
  const { documents } = useDocuments();
  const [step, setStep] = useState("upload");
  const organisme = useRecoilValue(organismeAtom);
  const [mapping, setMapping] = useState(null);

  const [availableKeys, setAvailableKeys] = useState({
    in: [{ label: "", value: "" }],
    out: [{ label: "", value: "" }],
  });
  const [lines, setLines] = useState([]);
  const [requireKeysSettled, setRequireKeysSettled] = useState([]);

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
    setMapping(response);
  }, [organisme._id]);

  const onGoToImportStep = useCallback(async () => {
    setStep("import");
    const keyToKeyMapping = lines.reduce((acc, line) => {
      return { ...acc, [line.in.value]: line.out.value };
    }, {});
    const response = await _post(`/api/v1/upload/import`, {
      organisme_id: organisme._id,
      mapping: keyToKeyMapping,
    });
    console.log(response);
    //onDocumentsChanged(documents, type_document);
  }, [lines, organisme._id]);

  return (
    <>
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        {step === "upload" && (
          <>
            <UploadFiles title={`Téléverser vos fichiers`} />

            <Button
              onClick={onGoToMappingStep}
              size={"md"}
              variant="primary"
              disabled={!documents?.unconfirmed?.length}
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

            <Button
              onClick={() => onGoToImportStep()}
              size={"md"}
              variant="primary"
              disabled={requireKeysSettled.length < Object.keys(mapping.requireKeys).length}
            >
              Étape suivante
              <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
            </Button>
          </>
        )}
        {step === "import" && (
          <>
            IMPORT
            <Button onClick={() => {}} size={"md"} variant="primary">
              Étape suivante
              <ArrowDropRightLine w={"0.75rem"} h={"0.75rem"} mt={"0.250rem"} ml="0.5rem" />
            </Button>
          </>
        )}
      </Flex>
    </>
  );
};

export default Televersements;
