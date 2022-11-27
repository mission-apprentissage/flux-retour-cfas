import React, { useState } from "react";
import NavLink from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import generator from "generate-password-browser";
import {
  Flex,
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
import { SiretBlock } from "./SiretBlock";

const typeCompte = {
  pilot: {
    text: "Un Pilot (Dreets)",
    value: "pilot",
  },
  of: {
    text: "Un Organisme de Formation",
    value: "of",
  },
  reseau_of: {
    text: "Une tête de réseau OF",
    value: "reseau_of",
  },
  erp: {
    text: " Un logiciel de gestion",
    value: "erp",
  },
};

export const Inscription = ({ onSucceeded, ...props }) => {
  const [step, setStep] = useState(0);
  const [entrepriseData, setEntrepriseData] = useState(null);

  const { values, handleChange, handleSubmit, errors, touched, setFieldValue, setErrors } = useFormik({
    initialValues: {
      type: "",
      email: "",
      siret: "",
      nom: "",
      civility: "",
      prenom: "",
    },
    validationSchema: Yup.object().shape({
      type: Yup.string().required("Requis"),
      email: Yup.string().email("Format d'email invalide").required("Votre email est obligatoire"),
      siret: Yup.string()
        .matches(new RegExp("^([0-9]{14}|[0-9]{9} [0-9]{4})$"), {
          message: `n'est pas un siret valide`,
          excludeEmptyString: true,
        })
        .required("Le siret est obligatoire"),
      nom: Yup.string().required("Votre nom est obligatoire"),
      civility: Yup.string().required("Votre civilité est obligatoire"),
      prenom: Yup.string().required("Votre prénom est obligatoire"),
    }),
    onSubmit: (values) => {
      // eslint-disable-next-line no-undef, no-async-promise-executor
      return new Promise(async (resolve) => {
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
          if (e.messages?.details?.message === "email already in use") {
            setErrors({ email: "Ce courriel est déjà utilisé." });
          } else {
            console.error(e);
          }
        }
        resolve("onSubmitHandler publish complete");
      });
    },
  });

  return (
    <Flex {...props}>
      <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
        Je n&apos;ai pas encore de compte
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
                          setStep(1);
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

          {step === 1 && (
            <>
              <Text fontWeight="bold">Vous représentez {typeCompte[values.type].text.toLowerCase()}</Text>
              <SiretBlock
                {...{ values, errors, touched, setFieldValue }}
                organismeFormation={values.type === "of"}
                onFetched={(result) => {
                  setEntrepriseData(result);
                }}
              />
            </>
          )}
          {step === 2 && (
            <>
              <Text fontWeight="bold">Vous représentez {typeCompte[values.type].text.toLowerCase()}</Text>
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
                <FormControl py={2} isRequired isInvalid={errors.nom && touched.nom}>
                  <FormLabel>Votre Nom</FormLabel>
                  <Input id="nom" name="nom" onChange={handleChange} placeholder="Ex : Dupont" value={values.nom} />
                  {errors.nom && touched.nom && <FormErrorMessage>{errors.nom}</FormErrorMessage>}
                </FormControl>

                <FormControl py={2} isRequired isInvalid={errors.prenom && touched.prenom}>
                  <FormLabel>Votre Prénom</FormLabel>
                  <Input
                    id="prenom"
                    name="prenom"
                    onChange={handleChange}
                    placeholder="Ex : Jean"
                    value={values.prenom}
                  />
                  {errors.prenom && touched.prenom && <FormErrorMessage>{errors.prenom}</FormErrorMessage>}
                </FormControl>
              </HStack>
            </>
          )}
        </Box>
        {step > 0 && (
          <HStack spacing="4w" mt={5}>
            <Link onClick={() => setStep(step - 1)} color="bluefrance">
              {"< Précedent"}
            </Link>

            {step === 1 && (
              <Button
                size="md"
                variant="primary"
                onClick={() => setStep(2)}
                px={6}
                isDisabled={!entrepriseData || !entrepriseData?.successed}
              >
                Suivant
              </Button>
            )}
            {step === 2 && (
              <Button size="lg" type="submit" variant="primary" onClick={handleSubmit} px={6}>
                S&apos;inscrire
              </Button>
            )}
          </HStack>
        )}
      </Box>
      <Flex flexGrow={1}>
        <Text mt={8} fontSize="1rem">
          <Link href="/auth/connexion" as={NavLink} color="bluefrance" ml={3}>
            &gt; J&apos;ai déjà un compte
          </Link>
        </Text>
      </Flex>
    </Flex>
  );
};
