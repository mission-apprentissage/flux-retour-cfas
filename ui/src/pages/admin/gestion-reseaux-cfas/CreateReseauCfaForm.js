import { Box, Button, FormControl, FormLabel, Input, ModalBody, ModalFooter, Select, Stack } from "@chakra-ui/react";
import { useFormik } from "formik";
import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";
import * as Yup from "yup";

import { fetchCfa } from "../../../common/api/tableauDeBord";
import { uaiRegex, validateUai } from "../../../common/domain/uai";

const CreateReseauCfaForm = ({ onSubmit, networkList }) => {
  const { values, handleChange, setFieldValue, errors, handleSubmit } = useFormik({
    initialValues: {
      nom_reseau: "",
      nom_etablissement: "",
      uai: "",
    },
    validationSchema: Yup.object().shape({
      nom_reseau: Yup.string().required("Requis"),
      nom_etablissement: Yup.string().required("Requis"),
      uai: Yup.string().matches(uaiRegex, "UAI invalide").required("Requis"),
    }),
    onSubmit: ({ nom_reseau, nom_etablissement, uai }) => {
      onSubmit({ nom_reseau: nom_reseau, nom_etablissement: nom_etablissement, uai: uai });
    },
  });

  const searchEnabled = validateUai(values.uai);

  useQuery(["cfa", values.uai], () => fetchCfa(values.uai), {
    enabled: searchEnabled,
    onSuccess: (data) => {
      setFieldValue("nom_etablissement", data?.libelleLong);
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
  onSubmit: PropTypes.func.isRequired,
};

export default CreateReseauCfaForm;
