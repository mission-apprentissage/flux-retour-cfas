import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Link,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import { useState } from "react";
import * as Yup from "yup";

import { getExistingUser } from "../../../../common/api/partageSimplifieApi.js";
import { CONTACT_ADDRESS, TDB_FAQ_URL } from "../../../../common/constants/productPartageSimplifie.js";
import { REGIONS } from "../../../../common/constants/territoireConstants.js";

// Add sequence mecanism for Yup
Yup.addMethod(Yup.string, "sequence", function (funcList) {
  return this.test(async (value, context) => {
    try {
      for (const func of funcList) {
        await func().validate(value);
      }
    } catch ({ message }) {
      return context.createError({ message });
    }
    return true;
  });
});

const OUTILS_DE_GESTION = [
  {
    nom: "Fichier Excel",
    selected: false,
  },
  {
    nom: "Google Sheets",
    selected: false,
  },
  {
    nom: "CRM Salesforce",
    selected: false,
  },
  {
    nom: "CRM Hubspot",
    selected: false,
  },
  {
    nom: "Notion",
    selected: false,
  },
  {
    nom: "Autre",
    selected: false,
  },
];

const InscriptionForm = ({ onSubmit }) => {
  const [showAutreOutilGestion, setShowAutreOutilGestion] = useState(false);
  const [showErreurEmailExistant, setShowErreurEmailExistant] = useState(false);

  return (
    <Formik
      initialValues={{
        nom: "",
        prenom: "",
        fonction: "",
        email: "",
        telephone: "",
        region: "",
        outils_gestion: [],
        autre_outil_gestion: "",
        is_consentement_ok: false,
      }}
      validationSchema={Yup.object().shape({
        nom: Yup.string().required("Requis"),
        prenom: Yup.string().required("Requis"),
        fonction: Yup.string().required("Requis"),
        email: Yup.string().sequence([
          () => Yup.string().email("Format d'email invalide").required("Requis"), // check email format
          () =>
            Yup.string().test("existence du mail", "", async (value) => {
              // Check email existence in PS
              try {
                const { found } = await getExistingUser(value);
                setShowErreurEmailExistant(found);
                return !found;
              } catch (err) {
                return true;
              }
            }),
        ]),

        telephone: Yup.string(),
        region: Yup.string().required("Requis"),
        is_consentement_ok: Yup.boolean()
          .required(
            "Vous devez consentir à l'utilisation de vos données dans le cadre de la mission du Tableau de bord."
          )
          .oneOf(
            [true],
            "Vous devez consentir à l'utilisation de vos données dans le cadre de la mission du Tableau de bord."
          ),
      })}
      onSubmit={onSubmit}
    >
      {() => {
        return (
          <Form>
            <Stack spacing="2w">
              <Field name="nom">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <Stack spacing="1w">
                      <FormLabel color="grey.800">Nom :</FormLabel>
                      <Input {...field} id={field.name} width="50%" placeholder="" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </Stack>
                  </FormControl>
                )}
              </Field>

              <Field name="prenom">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <Stack spacing="1w">
                      <FormLabel color="grey.800">Prénom :</FormLabel>
                      <Input {...field} id={field.name} width="50%" placeholder="" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </Stack>
                  </FormControl>
                )}
              </Field>

              <Field name="fonction">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <Stack spacing="1w">
                      <FormLabel color="grey.800">Fonction :</FormLabel>
                      <Input {...field} id={field.name} width="50%" placeholder="" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </Stack>
                  </FormControl>
                )}
              </Field>

              <Field name="email">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <Stack spacing="1w">
                      <FormLabel color="grey.800">E-mail :</FormLabel>
                      <Input {...field} id={field.name} width="50%" placeholder="" />
                      {showErreurEmailExistant === false && <FormErrorMessage>{meta.error}</FormErrorMessage>}
                      {showErreurEmailExistant === true && (
                        <div>
                          <Box
                            marginLeft="4w"
                            marginTop="2w"
                            marginBottom="2w"
                            borderLeft="4px solid"
                            borderColor="bluefrance"
                          >
                            <Text color="#ce0500" marginLeft="2w">
                              Il semble qu’un compte soit déjà créé avec cette adresse e-mail. Veuillez contacter
                              l’équipe du Tableau de bord à l’adresse suivante :{" "}
                              <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance">
                                {CONTACT_ADDRESS}
                              </Link>
                            </Text>
                          </Box>
                        </div>
                      )}
                    </Stack>
                  </FormControl>
                )}
              </Field>

              <Field name="telephone">
                {({ field, meta }) => (
                  <FormControl isInvalid={meta.error && meta.touched}>
                    <Stack spacing="1w">
                      <FormLabel color="grey.800">Téléphone :</FormLabel>
                      <Input {...field} id={field.name} width="50%" placeholder="" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </Stack>
                  </FormControl>
                )}
              </Field>

              <Field name="outils_gestion">
                {({ meta }) => (
                  <FormControl isInvalid={meta.error && meta.touched}>
                    <FormLabel marginTop="1w" color="grey.800">
                      Quel outil de gestion utilisez-vous actuellement ?
                    </FormLabel>
                    {OUTILS_DE_GESTION.map((item, index) => (
                      <HStack key={index} marginLeft="1w" spacing="2w" marginTop="2w">
                        <Field
                          style={{
                            transform: "scale(2)",
                            accentColor: "#000091",
                          }}
                          type="checkbox"
                          name="outils_gestion"
                          value={item.nom}
                          onClick={(event) => {
                            if (item.nom === "Autre") setShowAutreOutilGestion(event?.target?.checked || false);
                          }}
                        />
                        <Text>{item.nom}</Text>
                      </HStack>
                    ))}

                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              {showAutreOutilGestion === true && (
                <Field name="autre_outil_gestion">
                  {({ field, meta }) => (
                    <FormControl isInvalid={meta.error && meta.touched}>
                      <Stack spacing="1w">
                        <FormLabel marginTop="1w" color="grey.800">
                          Veuillez préciser lequel (ou lesquels)
                        </FormLabel>
                        <Input {...field} id={field.name} width="50%" placeholder="" />
                        <FormErrorMessage>{meta.error}</FormErrorMessage>
                      </Stack>
                    </FormControl>
                  )}
                </Field>
              )}

              <Field name="region">
                {({ field, meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <FormLabel color="grey.800">Région :</FormLabel>
                    <Select {...field} width="50%">
                      {[{ nom: "Sélectionnez une région" }, ...REGIONS].map((region, index) => (
                        <option key={index} value={region.nom === "Sélectionnez une région" ? null : region.nom}>
                          {region.nom}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <Field name="is_consentement_ok">
                {({ meta }) => (
                  <FormControl isRequired isInvalid={meta.error && meta.touched}>
                    <HStack marginLeft="1w" marginTop="2w">
                      <Field
                        style={{
                          transform: "scale(2)",
                          accentColor: "#000091",
                        }}
                        type="checkbox"
                        name="is_consentement_ok"
                      />
                      <Text>
                        Je consens à ce que mes données soient utilisées dans le cadre de la mission du Tableau de bord.
                      </Text>
                    </HStack>
                    <Text fontSize="omega" marginTop="4w">
                      Le Tableau de bord de l’apprentissage collecte les données des organismes de formation selon le
                      principe de minimisation des données. Pour en savoir plus,{" "}
                      <Link target="_blank" rel="noopener noreferrer" href={TDB_FAQ_URL} color="bluefrance">
                        veuillez consulter la page d’aide du Tableau de bord.
                      </Link>
                    </Text>
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <FormLabel color="grey.800"></FormLabel>

              <Button variant="primary" type="submit" width="30%" marginTop="2w">
                Valider le compte
              </Button>
            </Stack>
          </Form>
        );
      }}
    </Formik>
  );
};

InscriptionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default InscriptionForm;
