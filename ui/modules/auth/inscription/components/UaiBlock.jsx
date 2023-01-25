import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Spinner,
  Center,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Button,
  Text,
  VStack,
} from "@chakra-ui/react";

import { _post } from "../../../../common/httpClient";

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

const EntrepriseDetails = ({ data }) => {
  return (
    <VStack alignItems={"baseline"} spacing={1} paddingX={4}>
      {data.uai && (
        <Text>
          UAI : <b>{data.uai}</b>
        </Text>
      )}
      {data.siren && (
        <Text>
          SIREN : <b>{data.siren}</b>
        </Text>
      )}
      {data.siret && (
        <Text>
          SIRET : <b>{data.siret}</b>
        </Text>
      )}
      {!data.secretSiret && (
        <>
          <Text>
            Raison sociale : <b>{data.enseigne || data.entreprise_raison_sociale}</b>
          </Text>
          <Text>
            Adresse :
            <b>
              {[
                data.numero_voie,
                data.type_voie,
                data.nom_voie,
                data.complement_adresse,
                data.code_postal,
                data.localite,
              ]
                .filter((o) => o)
                .join(" ")}
            </b>
          </Text>
        </>
      )}
      {data.secretSiret && (
        <>
          <Box>Votre siret est valide.</Box>
          <Box>
            En revanche, en raison de sa nature, nous ne pourrons pas récupérer les informations reliées. (telles que
            l&apos;adresse et autres données)
          </Box>
        </>
      )}
    </VStack>
  );
};

export const UaiBlock = ({ onUaiFetched }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [entrepriseData, setEntrepriseData] = useState(null);

  const { values, errors, touched, setFieldValue } = useFormik({ initialValues: { uai: "" } });

  const uaiLookUp = async (e) => {
    const uai = e.target.value;
    setEntrepriseData(null);
    const validationSchema = Yup.object().shape({
      uai: Yup.string()
        .matches(new RegExp("^([0-9]{7}[A-Z]{1})$"), {
          message: `n'est pas un UAI valide`,
          excludeEmptyString: true,
        })
        .required("L'uai est obligatoire"),
    });

    const { isValid } = await validate(validationSchema, { uai });
    if (!isValid) {
      return setFieldValue("uai", uai);
    }

    setFieldValue("uai", uai);
    setIsFetching(true);
    const results = await _post(`/api/v1/auth/uai-siret-adresse`, {
      uai,
      organismeFormation: true,
    });
    setIsFetching(false);

    const formatItemResponse = (response) => {
      let ret = {
        successed: true,
        data: response.result,
        message: null,
      };
      if (Object.keys(response.result).length === 0) {
        ret = {
          successed: false,
          data: null,
          message: response.messages.error,
        };
      }
      if (response.result.ferme) {
        ret = {
          successed: false,
          data: null,
          message: `L'établissement fermé.`,
        };
      }
      return ret;
    };

    if (results.length > 1) {
      let formatedResults = [];
      for (const result of results) {
        const response = formatItemResponse(result);
        if (response.successed) formatedResults.push(response);
      }
      if (formatedResults.length > 1) {
        setEntrepriseData({
          successed: true,
          data: formatedResults,
          multiple: true,
          message: `Plusieurs Siret sont identifiés pour cette UAI. Choisissez votre établissement.`,
        });
      } else {
        setEntrepriseData(formatedResults[0]);
        onUaiFetched(formatedResults[0]);
      }
    } else {
      const [response] = results;
      const result = formatItemResponse(response);
      setEntrepriseData(result);
      onUaiFetched(result);
    }
  };

  return (
    <>
      <FormControl mt={4} py={2} isRequired isInvalid={errors.uai && touched.uai}>
        <FormLabel>UAI de votre organisme</FormLabel>
        <FormHelperText mb={2}>Une UAI au format valide est composée de 7 chiffres et 1 lettre</FormHelperText>
        <Input
          id="uai"
          name="uai"
          placeholder="Exemple: 9876543A"
          onChange={uaiLookUp}
          value={values.uai}
          isDisabled={isFetching}
        />
        {errors.uai && touched.uai && <FormErrorMessage>{errors.uai}</FormErrorMessage>}
      </FormControl>
      {values.uai && (
        <VStack
          alignItems="baseline"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor={
            entrepriseData
              ? entrepriseData.multiple
                ? "white"
                : entrepriseData.successed
                ? "green.500"
                : "error"
              : "grey.400"
          }
          rounded="md"
          minH="50"
          flexDirection="column"
          py={4}
          w="100%"
        >
          {isFetching && <Spinner alignSelf="center" />}
          {!isFetching && entrepriseData && (
            <>
              {entrepriseData.data && !entrepriseData.multiple && <EntrepriseDetails data={entrepriseData.data} />}
              {entrepriseData.message && (
                <>
                  <Box color="error" my={2}>
                    <Box as="i" className="ri-alert-fill" color="warning" marginRight="1v" />
                    {entrepriseData.message}
                  </Box>
                </>
              )}
              {entrepriseData.data && entrepriseData.multiple && (
                <Accordion allowToggle variant="withBorder" w="100%">
                  {entrepriseData.data.map((item, index) => {
                    return (
                      <AccordionItem key={index}>
                        <AccordionButton color="bluefrance" w="full">
                          <Box flex="1" textAlign="left">
                            {item.data.enseigne || item.data.entreprise_raison_sociale}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          <EntrepriseDetails data={item.data} />
                          <Button
                            mt="2w"
                            size="md"
                            variant="primary"
                            px={6}
                            onClick={() => {
                              setEntrepriseData(entrepriseData.data[index]);
                              onUaiFetched(entrepriseData.data[index]);
                            }}
                          >
                            Ceci est mon organisme
                          </Button>
                        </AccordionPanel>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </>
          )}
        </VStack>
      )}
    </>
  );
};
