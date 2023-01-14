import React, { useState } from "react";
import * as Yup from "yup";
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Spinner,
  Center,
  Text,
  Radio,
  RadioGroup,
  Stack,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Button,
} from "@chakra-ui/react";
import { CrossError } from "../../../theme/components/icons";

const validate = async (validationSchema, obj) => {
  let isValid = false;
  let error = null;
  try {
    await validationSchema.validate(obj);
    isValid = true;
  } catch (err) {
    error = err;
  }
  return { isValid, error };
};

export const UaiBlock = ({ values, errors, touched, setFieldValue, onFetched }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [entrepriseData, setEntrepriseData] = useState(null);
  const [value, setValue] = useState("");
  const [state, setState] = useState("waitUaiValidation");

  const uaiLookUp = async (e) => {
    const uai = e.target.value;
    setEntrepriseData(null);
    const validationSchema = Yup.object().shape({
      uai: Yup.string()
        .matches(new RegExp("^([0-9]{7}[A-Z]{1})$"), {
          message: `n'est pas un uai valide`,
          excludeEmptyString: true,
        })
        .required("Le siret est obligatoire"),
    });

    const { isValid } = await validate(validationSchema, { uai });
    if (!isValid) {
      return setFieldValue("uai", uai);
    }

    setFieldValue("uai", uai);
    setIsFetching(true);
    const uaiObject = [
      {
        uai: "1234567A",
        enseigne: "Institut Supérieur du Vin",
        raison_sociale: "UAI2",
        siren: "UAI3",
        siret: "UAI4",
        forme_juridique: "UAI5",
        complement_adresse: "UAI6",
        numero_voie: "UAI7",
        type_voie: "UAI8",
        nom_voie: "UAI9",
        code_postal: "UAI10",
        localite: "UAI11",
        code_insee_localite: "UAI12",
      },
      {
        uai: "Institut National de Formation et de Recherches sur l’Éducation Permanente INFREP",
        enseigne: "UAI1",
        raison_sociale: "UAI2",
        siren: "UAI3",
        siret: "UAI4",
        forme_juridique: "UAI5",
        complement_adresse: "UAI6",
        numero_voie: "UAI7",
        type_voie: "UAI8",
        nom_voie: "UAI9",
        code_postal: "UAI10",
        localite: "UAI11",
        code_insee_localite: "UAI12",
      },
    ];
    // const uaiObject = {};
    // const uaiObject = {
    //   uai: "1234567A",
    //   enseigne: "UAI1",
    //   raison_sociale: "UAI2",
    //   siren: "UAI3",
    //   siret: "UAI4",
    //   forme_juridique: "UAI5",
    //   complement_adresse: "UAI6",
    //   numero_voie: "UAI7",
    //   type_voie: "UAI8",
    //   nom_voie: "UAI9",
    //   code_postal: "UAI10",
    //   localite: "UAI11",
    //   code_insee_localite: "UAI12",
    // };
    const response = uaiObject;

    setIsFetching(false);
    let ret = {
      successed: true,
      data: uaiObject,
      message: null,
    };
    if (response.length > 1) {
      ret = {
        successed: true,
        data: uaiObject,
        state: "manyUaiDetected",
        message: `Plusieurs Siret sont identifiés pour cette UAI. Choisissez votre établissement.`,
      };
      setState("manyUaiDetected");
    } else if (Object.keys(response).length === 0) {
      ret = {
        successed: false,
        data: null,
        // message: response.messages.error,
        message: `L'Uai ${uai} n'est pas valide.`,
      };
      setState("invalidUai");
    } else setState("validatedUai");
    if (response?.result?.ferme) {
      ret = {
        successed: false,
        data: null,
        message: `L'Uai ${uai} est un établissement fermé.`,
      };
    }
    setEntrepriseData(ret);
    onFetched(ret);
  };

  const siretLookUp = async (e) => {
    const siret = e.target.value;
    setEntrepriseData(null);
    const validationSchema = Yup.object().shape({
      siret: Yup.string()
        .matches(new RegExp("^([0-9]{14}|[0-9]{9} [0-9]{4})$"), {
          message: `n'est pas un siret valide`,
          excludeEmptyString: true,
        })
        .required("Le siret est obligatoire"),
    });

    const { isValid } = await validate(validationSchema, { siret });
    if (!isValid) {
      return setFieldValue("siret", siret);
    }
    // const uaiObject = {};
    const siretObject = {
      uai: "1234567A",
      enseigne: "UAI1",
      raison_sociale: "UAI2",
      siren: "UAI3",
      siret: "UAI4",
      forme_juridique: "UAI5",
      complement_adresse: "UAI6",
      numero_voie: "UAI7",
      type_voie: "UAI8",
      nom_voie: "UAI9",
      code_postal: "UAI10",
      localite: "UAI11",
      code_insee_localite: "UAI12",
    };

    setFieldValue("siret", siret);
    setIsFetching(true);
    const response = siretObject;
    setIsFetching(false);
    let ret = {
      successed: true,
      data: response,
      message: null,
    };
    setState("validatedSiret");
    if (Object.keys(response).length === 0) {
      ret = {
        successed: false,
        data: null,
        message: response?.messages?.error,
      };
      setState("invalidSiret");
    }
    if (response?.result?.ferme) {
      ret = {
        successed: false,
        data: null,
        message: `Le Siret ${siret} est un établissement fermé.`,
      };
    }
    setEntrepriseData(ret);
    onFetched(ret);
  };

  const stateUai = {
    waitUaiValidation: {
      label: "Votre UAI",
      borderBottomColor: "grey.800",
      color: "grey.800",
    },
    validatedUai: {
      label: "UAI de votre établissement",
      borderBottomColor: "flatsuccess",
      color: "flatsuccess",
    },
    invalidUai: {
      label: "UAI de votre établissement",
      borderBottomColor: "flaterror",
      color: "flaterror",
    },
    manyUaiDetected: {
      label: "UAI de votre établissement",
      borderBottomColor: "flaterror",
      color: "flaterror",
    },
  };

  const stateSiret = {
    waitUaiValidation: {
      label: "Votre SIRET",
      borderBottomColor: "grey.800",
      color: "grey.800",
    },
    validatedSiret: {
      label: "SIRET de votre établissement",
      borderBottomColor: "flatsuccess",
      color: "flatsuccess",
    },
    invalidSiret: {
      label: "SIRET de votre établissement",
      borderBottomColor: "flaterror",
      color: "flaterror",
    },
  };
  return (
    <>
      {state === "waitUaiValidation" && (
        <Box mt="2w">
          <Text fontSize={15}>Au choix, indiquez l’UAI ou SIRET de votre établissement :</Text>
          <RadioGroup onChange={setValue} value={value}>
            <Stack direction="row">
              <Radio value="uai">UAI</Radio>
              <Radio value="siret">SIRET</Radio>
            </Stack>
          </RadioGroup>
        </Box>
      )}
      {value === "uai" && (
        <FormControl mt={4} py={2} isRequired isInvalid={errors.uai && touched.uai}>
          <FormLabel color={stateUai[state].color}>{stateUai[state].label}</FormLabel>
          <Input
            id="uai"
            name="uai"
            borderBottomColor={stateUai[state]?.borderBottomColor}
            placeholder="Exemple: 9876543A"
            onChange={uaiLookUp}
            value={values.uai}
            isDisabled={isFetching}
          />
          {(state === "invalidUai" || state === "manyUaiDetected") && (
            <HStack fontSize="12px" mt="4">
              <CrossError mt="0.5" />
              <Text color="flaterror">
                {state === "invalidUai" && "Cette UAI n’existe pas. Veuillez vérifier à nouveau."}
                {state === "manyUaiDetected" &&
                  "Plusieurs Siret sont identifiés pour cette UAI. Choisissez votre établissement."}
              </Text>
            </HStack>
          )}
          {errors.uai && touched.uai && <FormErrorMessage>{errors.uai}</FormErrorMessage>}
        </FormControl>
      )}
      {value === "siret" && (
        <FormControl mt={4} py={2} isRequired isInvalid={errors.siret && touched.siret}>
          <FormLabel color={stateSiret[state]?.color}>{stateSiret[state]?.label}</FormLabel>
          <Input
            id="siret"
            name="siret"
            borderBottomColor={stateSiret[state]?.borderBottomColor}
            placeholder="Exemple: 98765432400019"
            onChange={siretLookUp}
            value={values.siret}
            isDisabled={isFetching}
          />
          {state === "invalidSiret" && (
            <HStack fontSize="12px" mt="4">
              <CrossError mt="0.5" />
              <Text color="flaterror">Cette Siret n’existe pas. Veuillez vérifier à nouveau.</Text>
            </HStack>
          )}
          {errors.siret && touched.siret && <FormErrorMessage>{errors.siret}</FormErrorMessage>}
        </FormControl>
      )}
      {entrepriseData && (
        <>
          {state === "manyUaiDetected" ? (
            <>
              <Accordion allowToggle variant="withBorder">
                {entrepriseData.data.map((item, index) => (
                  <AccordionItem key={index}>
                    <AccordionButton color="bluefrance">
                      <Box flex="1" textAlign="left">
                        {item.enseigne || item.entreprise_raison_sociale}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <Box>
                        UAI : <strong> {item.uai}</strong>
                      </Box>
                      <Box>
                        Nature : <strong> {item.nature}</strong>
                      </Box>
                      <Box>
                        SIREN : <strong> {item.siren}</strong>
                      </Box>
                      <Box>
                        SIRET : <strong>{item.siret}</strong>
                      </Box>
                      <Box>
                        Raison sociale : <strong> {item.enseigne || item.entreprise_raison_sociale}</strong>
                      </Box>
                      <Box>
                        Réseau : <strong> {item.reseau}</strong>
                      </Box>
                      <Box>
                        Adresse : <strong> {item.adresse}</strong>
                      </Box>
                      <Box>
                        Région : <strong> {item.region}</strong>
                      </Box>
                      <Box>
                        Académie : <strong> {item.academie}</strong>
                      </Box>

                      <Button
                        mt="2w"
                        size="md"
                        variant="primary"
                        px={6}
                        onClick={() => {
                          const ret = {
                            successed: true,
                            data: item,
                            message: null,
                            step: 2,
                          };
                          setState("validatedUai");
                          setEntrepriseData(ret);
                          onFetched(ret);
                        }}
                      >
                        Ceci est mon organisme
                      </Button>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          ) : (
            <Center
              display={state === "invalidUai" || state === "invalidSiret" ? "none" : "flex"}
              borderWidth="2px"
              borderStyle="dashed"
              borderColor={entrepriseData ? (entrepriseData.successed ? "green.500" : "error") : "grey.400"}
              rounded="md"
              minH="50"
              flexDirection="column"
              p={4}
            >
              {isFetching && <Spinner />}
              {!isFetching && entrepriseData && (
                <>
                  {entrepriseData.data && (
                    <>
                      <Box fontWeight="bold"> Organisme de formation identifié :</Box>
                      {!entrepriseData.data.secretSiret && (
                        <>
                          <Box>{entrepriseData.data.enseigne || entrepriseData.data.entreprise_raison_sociale}</Box>
                          <Box>
                            {entrepriseData.data.numero_voie} {entrepriseData.data.nom_voie}
                          </Box>
                          {entrepriseData.data.complement_adresse && (
                            <Box>{entrepriseData.data.complement_adresse}</Box>
                          )}
                          <Box>
                            {entrepriseData.data.code_postal} {entrepriseData.data.localite}
                          </Box>
                          <Box>
                            UAI : {entrepriseData.data.uai} - SIRET : {entrepriseData.data.siret} (en activité)
                          </Box>
                        </>
                      )}
                      {entrepriseData.data.secretSiret && (
                        <>
                          <Box>Votre siret est valide.</Box>
                          <Box>
                            En revanche, en raison de sa nature, nous ne pourrons pas récupérer les informations
                            reliées. (telles que l&apos;adresse et autres données)
                          </Box>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </Center>
          )}
        </>
      )}
    </>
  );
};
