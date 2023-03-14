import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/router";
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Spinner,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Button,
  Text,
  VStack,
} from "@chakra-ui/react";

import useFetchEtablissements from "@/hooks/useFetchEtablissements";
import { UAI_REGEX, validateUai } from "@/common/domain/uai";

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

export const UaiBlock = ({ uai, onUaiFetched }) => {
  const router = useRouter();

  const { values, errors, handleChange } = useFormik({
    validationSchema: Yup.object().shape({
      uai: Yup.string()
        .matches(UAI_REGEX, {
          message: "UAI invalide",
          excludeEmptyString: true,
        })
        .required("L'UAI est obligatoire"),
    }),
    initialValues: { uai: uai || "" },
  });
  const { data: etablissements, isFetching } = useFetchEtablissements(
    validateUai(values.uai)
      ? {
          uai: values.uai,
          organismeFormation: true,
          onSuccess: (data) => {
            // si plusieurs etablissement,
            // on laisse l'utilisateur choisir
            if (data.length === 1) {
              onUaiFetched(data[0]);
            }
          },
        }
      : {}
  );

  useEffect(() => {
    if (etablissements?.length === 1) {
      etablissements[0].siret && !etablissements[0].ferme && onUaiFetched(etablissements[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etablissements?.[0].siret]);

  return (
    <>
      <FormControl mt={4} py={2} isRequired isInvalid={errors.uai}>
        <FormLabel>UAI de votre organisme</FormLabel>
        <FormHelperText mb={2}>Une UAI au format valide est composée de 7 chiffres et 1 lettre</FormHelperText>
        <Input
          id="uai"
          name="uai"
          placeholder="Exemple: 9876543A"
          onChange={(value) => {
            router.push({ query: { ...router.query, uai: value.target.value } }, undefined, { shallow: true });
            handleChange(value);
          }}
          value={values.uai}
          isDisabled={isFetching}
        />
        {errors.uai && <FormErrorMessage>{errors.uai}</FormErrorMessage>}
      </FormControl>
      {values.uai && (
        <VStack
          alignItems="baseline"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor={
            etablissements
              ? etablissements.length === 1
                ? "green.500"
                : etablissements.length > 0
                ? "white"
                : !etablissements[0].ferme
                ? "green.500"
                : "error"
              : "white"
          }
          rounded="md"
          minH="50"
          flexDirection="column"
          py={4}
          w="100%"
        >
          {isFetching && <Spinner alignSelf="center" />}
          {!isFetching && etablissements && (
            <>
              {etablissements.length > 1 && (
                <>
                  <Box color="error" my={2}>
                    <Box as="i" className="ri-alert-fill" color="warning" marginRight="1v" />
                    Plusieurs Siret sont identifiés pour cette UAI. Choisissez votre établissement.
                  </Box>
                </>
              )}
              {etablissements && (
                <Accordion allowToggle variant="withBorder" w="100%">
                  {etablissements.map((etablissement, index) => {
                    if (etablissements.length === 1) return <EntrepriseDetails data={etablissement} />;
                    return (
                      <AccordionItem key={index} as="div">
                        <AccordionButton color="bluefrance" w="full">
                          <Box flex="1" textAlign="left">
                            {etablissement.enseigne || etablissement.entreprise_raison_sociale}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          <EntrepriseDetails data={etablissement} />
                          <Button
                            mt="2w"
                            size="md"
                            variant="primary"
                            px={6}
                            onClick={() => onUaiFetched(etablissement)}
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
