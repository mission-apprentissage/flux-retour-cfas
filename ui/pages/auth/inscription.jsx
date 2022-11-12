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
  Spinner,
  Center,
  Heading,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import React, { useState } from "react";
import * as Yup from "yup";
import NavLink from "next/link";
import Head from "next/head";
import { Page } from "../../components/Page/Page";
import generator from "generate-password-browser";

import { _post } from "../../common/httpClient";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";

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

const Register = ({ onSucceeded, ...props }) => {
  const [step, setStep] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
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
    const response = await _post(`/api/v1/auth/siret-adresse`, {
      siret,
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
  };

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
                  <Radio
                    value="employeur"
                    onChange={(e) => {
                      setStep(1);
                      handleChange(e);
                    }}
                    size="lg"
                  >
                    Un employeur
                  </Radio>
                  <Radio
                    value="of"
                    onChange={(e) => {
                      setStep(1);
                      handleChange(e);
                    }}
                    size="lg"
                  >
                    Un OF
                  </Radio>
                </VStack>
              </RadioGroup>
              {errors.type && touched.type && <FormErrorMessage>{errors.type}</FormErrorMessage>}
            </FormControl>
          )}

          {step === 1 && (
            <>
              <Text fontWeight="bold">Vous êtes {values.type === "employeur" ? "un employeur" : "un OF"}</Text>
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
                        {!entrepriseData.data.secretSiret && (
                          <>
                            <Box>{entrepriseData.data.enseigne || entrepriseData.data.entreprise_raison_sociale}</Box>
                            <Box>
                              {entrepriseData.data.numero_voie} {entrepriseData.data.nom_voie}
                            </Box>
                            {entrepriseData.data.complement_adresse && (
                              <Box>{entrepriseData.data.complement_adresse}</Box>
                            )}
                            <Box>
                              {entrepriseData.data.code_postal} {entrepriseData.data.localite}
                            </Box>
                          </>
                        )}
                        {entrepriseData.data.secretSiret && (
                          <>
                            <Box>Votre siret est valide.</Box>
                            <Box>
                              En revanche, en raison de sa nature, nous ne pourrons pas récupérer les informations
                              reliées. (telles que l&apos;adresse et autres données)
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
          )}
          {step === 2 && (
            <>
              <Text fontWeight="bold">Vous êtes {values.type === "employeur" ? "un employeur public." : "un OF"}</Text>
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

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const RegisterPage = () => {
  const styleProps = {
    flexBasis: "50%",
    p: 12,
    justifyContent: "center",
  };

  const [succeeded, setSucceeded] = useState(false);

  return (
    <Page>
      <Head>
        <title>Inscription</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex w="full" maxW="xl" mt={4}>
        {!succeeded && (
          <>
            <Register
              {...styleProps}
              flexDirection="column"
              border="1px solid"
              borderColor="openbluefrance"
              onSucceeded={() => {
                setSucceeded(true);
              }}
            />
          </>
        )}
        {succeeded && (
          <Center w="full" flexDirection="column" border="1px solid" borderColor="openbluefrance" p={12}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/advancedOutline.svg" alt="felicitation" />
            <Heading as="h2" fontSize="2xl" my={[3, 6]}>
              Félicitations, vous venez de créer votre compte !
            </Heading>
            <Text textAlign="center">
              Vous allez recevoir un courriel de confirmation à l&apos;adresse renseignée.
              <br />
              (n&apos;oubliez pas de vérifier vos indésirables).
            </Text>
          </Center>
        )}
      </Flex>
    </Page>
  );
};

export default RegisterPage;
