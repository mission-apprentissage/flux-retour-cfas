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
  CloseButton,
} from "@chakra-ui/react";
import { _post } from "../../../common/httpClient";
import { SiretBlock } from "./SiretBlock";
import { UaiBlock } from "./UaiBlock";
import { Checkbox } from "../../../theme/components/icons";
import { CONTACT_ADDRESS } from "../../../common/constants/product";
import { useEffect } from "react";

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

export const Inscription = ({ onSucceeded, ...props }) => {
  const [step, setStep] = useState(0);
  const [entrepriseData, setEntrepriseData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (entrepriseData?.step === 2) setStep(2);
  }, [entrepriseData]);

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
    <Box {...props}>
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
              <Box p="2" h="7vh" borderLeft="4px solid #6A6AF4"></Box>
              <Box>
                <Text>Contacter l&apos;équipe :</Text>
                <Link fontWeight={700} href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                  {CONTACT_ADDRESS}
                </Link>{" "}
              </Box>
            </HStack>
          )}
          {step === "dontRecognizeUaiSiret" && (
            <Box mt="2w">
              <Text fontWeight={700}>Vous ne connaissez ni l’UAI ni le Siret de votre organisme.</Text>
              <Text>
                Vous pouvez le retrouver facilement en consultant le{" "}
                <Link
                  href={`https://referentiel.apprentissage.onisep.fr/`}
                  fontWeight={700}
                  color="bluefrance"
                  whiteSpace="nowrap"
                >
                  Référentiel{" "}
                </Link>
                de l’apprentissage ou{" "}
                <Link
                  href={`https://annuaire-entreprises.data.gouv.fr/`}
                  fontWeight={700}
                  color="bluefrance"
                  whiteSpace="nowrap"
                >
                  l’Annuaire{" "}
                </Link>
                des entreprises. Vous pouvez aussi consulter la{" "}
                <Link
                  href={`https://www.notion.so/Documentation-dbb1eddc954441eaa0ba7f5c6404bdc0`}
                  fontWeight={700}
                  color="bluefrance"
                  whiteSpace="nowrap"
                >
                  FAQ
                </Link>{" "}
                du tableau de bord.
              </Text>
              <br />
              <Link
                onClick={() => setStep(0)}
                color="bluefrance"
                borderBottom="1px solid"
                _hover={{ cursor: "pointer", textDecoration: "none", borderBottom: "2px solid" }}
              >
                Retour à l’étape précédente
              </Link>
            </Box>
          )}
          {step === 1 && (
            <>
              <Text fontWeight="bold">
                {values.type === "of" ? (
                  <> Vous êtes un CFA ou organisme de formation.</>
                ) : (
                  <>Vous représentez {typeCompte[values.type].text.toLowerCase()}</>
                )}
              </Text>
              {values.type === "of" ? (
                <UaiBlock
                  {...{ values, errors, touched, setFieldValue }}
                  organismeFormation={values.type === "of"}
                  onFetched={(result) => {
                    setEntrepriseData(result);
                  }}
                />
              ) : (
                <SiretBlock
                  {...{ values, errors, touched, setFieldValue }}
                  organismeFormation={values.type === "of"}
                  onFetched={(result) => {
                    setEntrepriseData(result);
                  }}
                />
              )}
            </>
          )}
          {step === 2 && (
            <>
              <HStack spacing="2" border="1px solid" borderColor="flatsuccess" display={isOpen ? "flex" : "none"}>
                <Box p="2" h="12vh" bg="flatsuccess">
                  <Checkbox color="white" />
                </Box>
                <Box flex="1" alignSelf="start">
                  <Text fontSize="20px" fontWeight="bold" mt="2w">
                    {entrepriseData.data.enseigne || entrepriseData.data.entreprise_raison_sociale}
                  </Text>
                  <Text>
                    Uai : {entrepriseData.data.uai} - SIRET : {entrepriseData.data.siret} (en activite)
                  </Text>
                </Box>
                <Box alignSelf="start" p="2">
                  <CloseButton size="sm" onClick={() => setIsOpen(false)} />
                </Box>
              </HStack>

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
                <FormControl py={2} isRequired isInvalid={errors.nom && touched.nom}>
                  <FormLabel>Votre Nom</FormLabel>
                  <Input id="nom" name="nom" onChange={handleChange} placeholder="Ex : Dupont" value={values.nom} />
                  {errors.nom && touched.nom && <FormErrorMessage>{errors.nom}</FormErrorMessage>}
                </FormControl>
              </HStack>
            </>
          )}
        </Box>
        {step > 0 && (
          <HStack spacing="4w" mt={5}>
            <Button onClick={() => setStep(step - 1)} color="bluefrance" variant="secondary">
              Revenir
            </Button>
            {step === 1 && entrepriseData?.state !== "manyUaiDetected" && (
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
              <Button
                size="md"
                type="submit"
                variant="primary"
                onClick={handleSubmit}
                px={6}
                isDisabled={!entrepriseData || !entrepriseData?.successed}
              >
                Suivant
              </Button>
            )}
          </HStack>
        )}
      </Box>
      <Flex flexGrow={1}>
        <Text mt={8} fontSize="1rem">
          <Link
            href="#"
            borderBottom="1px solid"
            as={NavLink}
            onClick={() => setStep("dontRecognizeUaiSiret")}
            color="bluefrance"
            ml={3}
            _hover={{ textDecoration: "none" }}
          >
            {step !== "dontRecognizeUaiSiret" &&
              entrepriseData?.state === "manyUaiDetected" &&
              "Je ne reconnais pas mon organisme"}
            {values.type === "of" &&
              step !== "dontRecognizeUaiSiret" &&
              entrepriseData?.state !== "manyUaiDetected" &&
              "Je ne connais ni mon UAI ni mon Siret"}
            {values.type === "reseau_of" && "Je connais pas mon Réseau"}
          </Link>
        </Text>
      </Flex>
    </Box>
  );
};
