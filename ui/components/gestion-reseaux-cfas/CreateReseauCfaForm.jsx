import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  ListItem,
  ModalBody,
  ModalFooter,
  Select,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Yup from "yup";

import { fetchSearchCfas } from "../../common/api/tableauDeBord";
import { QUERY_KEYS } from "../../common/constants/queryKeys";
import { siretRegex, validateSiret } from "../../common/domain/siret";
import { uaiRegex, validateUai } from "../../common/domain/uai";

const CreateReseauCfaForm = ({ createReseauCfa, networkList }) => {
  const [listSirets, setListSirets] = useState([]);

  const { values, handleChange, setFieldValue, errors, handleSubmit } = useFormik({
    initialValues: {
      nom_reseau: "",
      nom_etablissement: "",
      uai: "",
      siret: "",
    },
    validationSchema: Yup.object().shape({
      nom_reseau: Yup.string().required("Requis"),
      nom_etablissement: Yup.string().required("Requis"),
      uai: Yup.string().matches(uaiRegex, "UAI invalide").required("Requis"),
      siret: Yup.string().matches(siretRegex, "Siret invalide"),
    }),
    onSubmit: ({ nom_reseau, nom_etablissement, uai, siret }) => {
      createReseauCfa({ nom_reseau, nom_etablissement, uai, siret });
    },
  });

  const searchEnabled = validateUai(values.uai) || validateSiret(values.siret);
  const uaiOrSiret = validateUai(values.uai) ? values.uai : values.siret;

  useQuery([QUERY_KEYS.CFAS, uaiOrSiret], () => fetchSearchCfas({ searchTerm: uaiOrSiret }), {
    enabled: searchEnabled,
    onSuccess: (data) => {
      setFieldValue("nom_etablissement", data[0]?.nom);
      setFieldValue("uai", data[0]?.uai);
      if (data[0]?.sirets.length === 1) {
        setFieldValue("siret", data[0]?.sirets[0]);
      } else {
        setFieldValue("siret", "");
        setListSirets(data[0]?.sirets);
      }
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
          <FormControl isInvalid={errors.siret}>
            <FormLabel color="grey.800">Siret</FormLabel>
            <Input name="siret" value={values.siret} onChange={handleChange} />
            {listSirets?.length > 1 && (
              <Box color="redmarianne">
                <Text>Plusieurs SIRETs ont été trouvés</Text>
                <UnorderedList>
                  {listSirets?.map((siret) => (
                    <ListItem key={siret}>{siret}</ListItem>
                  ))}
                </UnorderedList>
              </Box>
            )}
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
