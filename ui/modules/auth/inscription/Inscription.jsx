import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import generator from "generate-password-browser";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  VStack,
  HStack,
  Input,
  Link,
  Text,
  RadioGroup,
  Radio,
  Heading,
} from "@chakra-ui/react";
import { _post } from "../../../common/httpClient";
import { CONTACT_ADDRESS } from "../../../common/constants/product";
import { InscriptionOF } from "./InscriptionOF";
import { InscriptionPilot } from "./InscriptionPilot";
import { InscriptionReseau } from "./InscriptionReseau";
import Ribbons from "../../../components/Ribbons/Ribbons";

const typeCompte = {
  of: {
    text: "Un CFA ou organisme de formation",
    value: "of",
  },
  pilot: {
    text: "Un opérateur public (DREETS, DEETS, DRAAF, Académie, Conseil régional...)",
    value: "pilot",
  },
  reseau_of: {
    text: "Un réseau d'organismes de formation",
    value: "reseau_of",
  },
  autre: {
    text: "Autre",
    value: "autre",
  },
};

const Inscription = ({ onSucceeded, ...props }) => {
  const [step, setStep] = useState(0);
  const [entrepriseData, setEntrepriseData] = useState(null);
  const [typeOfSearch, setTypeOfSearch] = useState("");

  const { values, handleChange, handleSubmit, errors, touched, setFieldValue, setErrors } = useFormik({
    initialValues: {
      type: "",
      email: "",
      siret: "",
      uai: "",
      nom: "",
      civility: "",
      prenom: "",
      organismes_appartenance: "",
    },
    validationSchema: Yup.object().shape({
      type: Yup.string().required("Requis"),
      email: Yup.string().email("Format d'email invalide").required("Votre email est obligatoire"),
      siret: Yup.string()
        .matches(new RegExp("^([0-9]{14}|[0-9]{9} [0-9]{4})$"), {
          message: `n'est pas un SIRET valide`,
          excludeEmptyString: true,
        })
        .required("Le siret est obligatoire"),
      uai: Yup.string(),
      organismes_appartenance: Yup.string(),
      nom: Yup.string().required("Votre nom est obligatoire"),
      civility: Yup.string().required("Votre civilité est obligatoire"),
      prenom: Yup.string().required("Votre prénom est obligatoire"),
    }),
    onSubmit: async (values) => {
      // eslint-disable-next-line no-undef, no-async-promise-executor
      try {
        const newTmpPassword = generator.generate({
          length: 12,
          numbers: true,
          lowercase: true,
          uppercase: true,
          strict: true,
        });
        const result = await _post("/api/v1/auth/register", { ...values, password: newTmpPassword });
        if (result.succeeded) {
          onSucceeded();
        }
      } catch (e) {
        if (e.messages?.message === "email already in use") {
          setErrors({ email: "Ce courriel est déjà utilisé." });
        } else {
          console.error(e);
        }
      }
    },
  });
  return (
    <Box {...props} flexDirection="column" p={12}>
      <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
        Créer votre compte
      </Heading>
      <Box>
        <Box>
          {step === 0 && (
            <FormControl py={2} isRequired isInvalid={errors.type && touched.type}>
              <FormLabel>Je représente :</FormLabel>
              <RadioGroup id="type" name="type" value={values.type} mt={8}>
                <VStack alignItems="baseline" fontSize="1.2rem" spacing={8}>
                  {Object.values(typeCompte).map((item, i) => {
                    return (
                      <Radio
                        key={i}
                        value={item.value}
                        onChange={(e) => {
                          setStep(item.value === "autre" ? 0 : 1);
                          handleChange(e);
                        }}
                        size="lg"
                      >
                        {item.text}
                      </Radio>
                    );
                  })}
                </VStack>
              </RadioGroup>
              {errors.type && touched.type && <FormErrorMessage>{errors.type}</FormErrorMessage>}
            </FormControl>
          )}
          {values.type === "autre" && (
            <HStack ml="4w" mt="2w">
              <Box p="2" h="7vh" borderLeft="4px solid #6A6AF4" />
              <Box>
                <Text>Contacter l&apos;équipe :</Text>
                <Link fontWeight={700} href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                  {CONTACT_ADDRESS}
                </Link>{" "}
              </Box>
            </HStack>
          )}
          {step === 1 && (
            <>
              {values.type === "of" && (
                <InscriptionOF
                  typeOfSearch={typeOfSearch}
                  setTypeOfSearch={setTypeOfSearch}
                  onEndOfSpecific={(result) => {
                    result.data?.uai && setFieldValue("uai", result.data.uai);
                    result.data?.siret && setFieldValue("siret", result.data.siret);
                    setFieldValue("organismes_appartenance", "ORGANISME_FORMATION");
                    setEntrepriseData(result);
                  }}
                />
              )}
              {values.type === "pilot" && (
                <InscriptionPilot
                  onEndOfSpecific={({ organismes_appartenance, result }) => {
                    result.data?.siret && setFieldValue("siret", result.data.siret);
                    setFieldValue("organismes_appartenance", organismes_appartenance);
                    setEntrepriseData(result);
                  }}
                />
              )}
              {values.type === "reseau_of" && (
                <InscriptionReseau
                  onEndOfSpecific={(result) => {
                    result.data?.siret && setFieldValue("siret", result.data.siret);
                    setFieldValue("organismes_appartenance", "TETE_DE_RESEAU");
                    setEntrepriseData(result);
                  }}
                />
              )}
            </>
          )}
          {step === 2 && (
            <>
              <Ribbons variant="success" mt="0.5rem">
                <Box ml={3} color="grey.800">
                  <Text fontSize="20px" fontWeight="bold">
                    {entrepriseData.data.enseigne || entrepriseData.data.entreprise_raison_sociale}
                  </Text>
                  {values.type === "of" && (
                    <Text>
                      Uai : {entrepriseData.data.uai} - SIRET : {entrepriseData.data.siret} (en activité)
                    </Text>
                  )}
                  {values.type !== "of" && <Text>SIRET : {entrepriseData.data.siret} (en activité)</Text>}
                </Box>
              </Ribbons>

              <FormControl mt={4} py={2} isRequired isInvalid={errors.email && touched.email}>
                <FormLabel>Votre courriel</FormLabel>
                <Input
                  id="email"
                  name="email"
                  placeholder="Exemple : jeandupont@mail.com"
                  onChange={handleChange}
                  value={values.email}
                />
                {errors.email && touched.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
              </FormControl>
              <FormControl py={2} mt={5} isRequired isInvalid={errors.civility && touched.civility}>
                <RadioGroup value={values.civility}>
                  <HStack>
                    <Radio
                      type="radio"
                      name="civility"
                      value={"Monsieur"}
                      checked={values.civility !== "Madame"}
                      onChange={handleChange}
                    >
                      Monsieur
                    </Radio>
                    <Radio
                      type="radio"
                      name="civility"
                      value="Madame"
                      checked={values.civility === "Madame"}
                      onChange={handleChange}
                      ml="2.5rem !important"
                    >
                      Madame
                    </Radio>
                  </HStack>
                  {errors.civility && touched.civility && <FormErrorMessage>{errors.civility}</FormErrorMessage>}
                </RadioGroup>
              </FormControl>
              <HStack spacing={8}>
                <FormControl py={2} isRequired isInvalid={errors.prenom && touched.prenom}>
                  <FormLabel>Votre prénom</FormLabel>
                  <Input
                    id="prenom"
                    name="prenom"
                    onChange={handleChange}
                    placeholder="Ex : Jean"
                    value={values.prenom}
                  />
                  {errors.prenom && touched.prenom && <FormErrorMessage>{errors.prenom}</FormErrorMessage>}
                </FormControl>
                <FormControl py={2} isRequired isInvalid={errors.nom && touched.nom}>
                  <FormLabel>Votre nom</FormLabel>
                  <Input id="nom" name="nom" onChange={handleChange} placeholder="Ex : Dupont" value={values.nom} />
                  {errors.nom && touched.nom && <FormErrorMessage>{errors.nom}</FormErrorMessage>}
                </FormControl>
              </HStack>
            </>
          )}
        </Box>
        {step > 0 && (
          <HStack gap="24px" mt={5}>
            <Button
              onClick={() => {
                if (typeOfSearch) {
                  setTypeOfSearch("");
                  return;
                }
                if (step === 1) {
                  setFieldValue("type", "");
                }
                setStep(step - 1);
              }}
              color="bluefrance"
              variant="secondary"
            >
              Revenir
            </Button>
            {step === 1 && (
              <Button
                size="md"
                variant="primary"
                onClick={() => setStep(2)}
                px={6}
                isDisabled={!(entrepriseData?.successed)}
              >
                Suivant
              </Button>
            )}
            {step === 2 && (
              <Button
                size="md"
                type="submit"
                variant="primary"
                onClick={handleSubmit}
                px={6}
                isDisabled={!(entrepriseData?.successed)}
              >
                S&rsquo;inscrire
              </Button>
            )}
          </HStack>
        )}
      </Box>
    </Box>
  );
};

export default Inscription;
