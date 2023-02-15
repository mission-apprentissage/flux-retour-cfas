import React, { useEffect } from "react";
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
  Text,
  VStack,
} from "@chakra-ui/react";

import useFetchEtablissements from "@/hooks/useFetchEtablissements";
import { SIRET_REGEX, validateSiret } from "@/common/domain/siret";

export const SiretBlock = ({ onSiretFetched, organismeFormation = false }) => {
  const { values, errors, handleChange } = useFormik({
    validationSchema: Yup.object().shape({
      siret: Yup.string()
        .matches(SIRET_REGEX, {
          message: "SIRET invalide",
          excludeEmptyString: true,
        })
        .required("Le SIRET est obligatoire"),
    }),
    initialValues: { siret: "" },
  });
  const { data: etablissements, isFetching } = useFetchEtablissements(
    validateSiret(values.siret)
      ? {
          siret: values.siret,
          organismeFormation,
        }
      : {}
  );
  const etablissement = etablissements?.[0];
  const isValidEtablissement = etablissement && !etablissement.ferme;

  useEffect(() => {
    etablissement?.siret && onSiretFetched(etablissement);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etablissement?.siret]);

  return (
    <>
      <FormControl mt={4} py={2} isRequired isInvalid={errors.siret}>
        <FormLabel>SIRET de votre organisme</FormLabel>
        <FormHelperText mb={2}>Un SIRET au format valide est composé de 14 chiffres</FormHelperText>
        <Input
          id="siret"
          name="siret"
          placeholder="Exemple: 98765432400019"
          value={values.siret}
          onChange={handleChange}
          isDisabled={isFetching}
        />
        {errors.siret && <FormErrorMessage>{errors.siret}</FormErrorMessage>}
      </FormControl>
      {values.siret && (
        <VStack
          alignItems="baseline"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor={etablissement ? (isValidEtablissement ? "green.500" : "error") : "grey.400"}
          rounded="md"
          minH="50"
          flexDirection="column"
          p={4}
        >
          {isFetching && <Spinner alignSelf="center" />}
          {!isFetching && etablissement && (
            <>
              <VStack alignItems={"baseline"} spacing={1}>
                {organismeFormation && etablissement.uai && (
                  <Text mb={5}>
                    <b>Votre UAI :</b> {etablissement.uai}
                  </Text>
                )}
                <Text fontWeight="bold">Votre adresse :</Text>
                {!etablissement.secretSiret && (
                  <>
                    <Text>{etablissement.enseigne || etablissement.entreprise_raison_sociale}</Text>
                    <Text>
                      {etablissement.numero_voie} {etablissement.type_voie} {etablissement.nom_voie}
                    </Text>
                    {etablissement.complement_adresse && <Text>{etablissement.complement_adresse}</Text>}
                    <Text>
                      {etablissement.code_postal} {etablissement.localite}
                    </Text>
                  </>
                )}
                {etablissement.secretSiret && (
                  <>
                    <Text>Votre siret est valide.</Text>
                    <Text>
                      En revanche, en raison de sa nature, nous ne pourrons pas récupérer les informations reliées.
                      (telles que l&apos;adresse et autres données)
                    </Text>
                  </>
                )}
              </VStack>
              {etablissement.ferme && (
                <Box color="error" my={2}>
                  Le Siret ${values.siret} est un établissement fermé.
                </Box>
              )}
            </>
          )}
        </VStack>
      )}
    </>
  );
};
