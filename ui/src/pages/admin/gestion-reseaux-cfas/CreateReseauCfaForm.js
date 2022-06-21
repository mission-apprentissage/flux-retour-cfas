import { Box, Button, FormControl, FormLabel, Input, ModalBody, ModalFooter, Select, Stack } from "@chakra-ui/react";
import { useFormik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";
import * as Yup from "yup";

import { fetchCfa } from "../../../common/api/tableauDeBord";
import { siretRegex, validateSiret } from "../../../common/domain/siret";
import { uaiRegex, validateUai } from "../../../common/domain/uai";

const CreateReseauCfaForm = ({ createReseauCfa, networkList }) => {
  const { values, handleChange, setFieldValue, errors, handleSubmit } = useFormik({
    initialValues: {
      nom_reseau: "",
      nom_etablissement: "",
      uai: "",
      sirets: "",
    },
    validationSchema: Yup.object().shape({
      nom_reseau: Yup.string().required("Requis"),
      nom_etablissement: Yup.string().required("Requis"),
      uai: Yup.string().matches(uaiRegex, "UAI invalide").required("Requis"),
      sirets: Yup.string().matches(siretRegex, "Siret invalide").required("Requis"),
    }),
    onSubmit: ({ nom_reseau, nom_etablissement, uai, sirets }) => {
      createReseauCfa({ nom_reseau, nom_etablissement, uai, sirets });
    },
  });

  const searchEnabled = validateUai(values.uai) || validateSiret(values.sirets);
  const uaiOrSiret = validateUai(values.uai) ? values.uai : values.sirets;

  useQuery(["cfa", uaiOrSiret], () => fetchCfa(uaiOrSiret), {
    enabled: searchEnabled,
    onSuccess: (data) => {
      setFieldValue("nom_etablissement", data?.libelleLong);
      setFieldValue("uai", data?.uai);
      setFieldValue("sirets", data?.sousEtablissements[0]?.siret_etablissement);
    },
    onError: () => {
      setFieldValue("nom_etablissement", "");
    },
  });

  return (
    <Box>
      <ModalBody paddingX="8w">
        <Stack spacing="2w" paddingY="5w" paddingX="4w" borderColor="bluefrance" border="1px solid">
          <FormControl isRequired isInvalid={errors.nom_reseau}>
            <FormLabel color="grey.800">Nom du reseau</FormLabel>
            <Select
              name="nom_reseau"
              value={values.nom_reseau}
              onChange={handleChange}
              marginTop="1w"
              placeholder="Sélectionnez un réseau"
            >
              {networkList.map(({ nom }) => (
                <option key={nom} value={nom}>
                  {nom}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl isRequired isInvalid={errors.nom_etablissement}>
            <FormLabel color="grey.800">Nom du CFA</FormLabel>
            <Input name="nom_etablissement" value={values.nom_etablissement} onChange={handleChange} />
          </FormControl>
          <FormControl isRequired isInvalid={errors.uai}>
            <FormLabel color="grey.800">UAI</FormLabel>
            <Input name="uai" value={values.uai} onChange={handleChange} />
          </FormControl>
          <FormControl isRequired isInvalid={errors.sirets}>
            <FormLabel color="grey.800">Siret</FormLabel>
            <Input name="sirets" value={values.sirets} onChange={handleChange} />
          </FormControl>
        </Stack>
      </ModalBody>
      <ModalFooter paddingY="3w" marginTop="5w" boxShadow="0px -4px 16px 0px rgba(0, 0, 0, 0.08)">
        <Button onClick={handleSubmit} type="submit" variant="primary">
          Envoyer
        </Button>
      </ModalFooter>
    </Box>
  );
};

CreateReseauCfaForm.propTypes = {
  networkList: PropTypes.array,
  createReseauCfa: PropTypes.func.isRequired,
};

export default CreateReseauCfaForm;
