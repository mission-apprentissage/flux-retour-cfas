import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Box, FormControl, FormErrorMessage, FormLabel, Input, Spinner, Center } from "@chakra-ui/react";
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

export const SiretBlock = ({ onSiretFetched, organismeFormation = false }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [entrepriseData, setEntrepriseData] = useState(null);

  const { values, errors, touched, setFieldValue } = useFormik({ initialValues: { siret: "" } });

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

    setFieldValue("siret", siret);
    setIsFetching(true);
    const [response] = await _post(`/api/v1/auth/uai-siret-adresse`, {
      siret,
      organismeFormation,
    });
    setIsFetching(false);
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
        message: `Le Siret ${siret} est un établissement fermé.`,
      };
    }
    setEntrepriseData(ret);
    onSiretFetched(ret);
  };

  return (
    <>
      <FormControl mt={4} py={2} isRequired isInvalid={errors.siret && touched.siret}>
        <FormLabel>Votre Siret</FormLabel>
        <Input
          id="siret"
          name="siret"
          placeholder="Exemple: 98765432400019"
          onChange={siretLookUp}
          value={values.siret}
          isDisabled={isFetching}
        />
        {errors.siret && touched.siret && <FormErrorMessage>{errors.siret}</FormErrorMessage>}
      </FormControl>
      <Center
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
                {organismeFormation && entrepriseData.data.uai && (
                  <Box mb={5} fontWeight="bold">
                    Votre UAI: {entrepriseData.data.uai}
                  </Box>
                )}
                <Box fontWeight="bold">Votre adresse:</Box>
                {!entrepriseData.data.secretSiret && (
                  <>
                    <Box>{entrepriseData.data.enseigne || entrepriseData.data.entreprise_raison_sociale}</Box>
                    <Box>
                      {entrepriseData.data.numero_voie} {entrepriseData.data.type_voie} {entrepriseData.data.nom_voie}
                    </Box>
                    {entrepriseData.data.complement_adresse && <Box>{entrepriseData.data.complement_adresse}</Box>}
                    <Box>
                      {entrepriseData.data.code_postal} {entrepriseData.data.localite}
                    </Box>
                  </>
                )}
                {entrepriseData.data.secretSiret && (
                  <>
                    <Box>Votre siret est valide.</Box>
                    <Box>
                      En revanche, en raison de sa nature, nous ne pourrons pas récupérer les informations reliées.
                      (telles que l&apos;adresse et autres données)
                    </Box>
                  </>
                )}
              </>
            )}
            {entrepriseData.message && (
              <Box color="error" my={2}>
                {entrepriseData.message}
              </Box>
            )}
          </>
        )}
      </Center>
    </>
  );
};
