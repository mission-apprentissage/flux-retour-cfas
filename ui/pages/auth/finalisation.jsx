import {
  Flex,
  Box,
  Button,
  Text,
  Heading,
  FormControl,
  FormLabel,
  RadioGroup,
  VStack,
  Radio,
  FormErrorMessage,
  Center,
  Grid,
  Checkbox,
  Spinner,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import React, { useCallback, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import uniq from "lodash.uniq";

import Page from "@/components/Page/Page";

import useToken from "@/hooks/useToken";
import useAuth from "@/hooks/useAuth";
import { _get, _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import { CONTACT_ADDRESS } from "@/common/constants/product";
import { ACADEMIES, REGIONS, DEPARTEMENTS } from "@/common/constants/territoiresConstants";
import { Check } from "../../theme/components/icons";
import { RESEAUX_CFAS } from "@/common/constants/networksConstants";
import { Input } from "@/modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";

const ACADEMIES_SORTED = Object.values(ACADEMIES).sort((a, b) => Number(a.code) - Number(b.code));
const REGIONS_SORTED = REGIONS.sort((a, b) => Number(a.code) - Number(b.code));
const DEPARTEMENTS_SORTED = DEPARTEMENTS.sort((a, b) => Number(a.code) - Number(b.code));

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const MultipleCheckBox = ({ title, name, choices, onChange }) => {
  const { values, handleChange } = useFormik({
    initialValues: {
      [name]: [],
    },
  });

  const handleChanges = useCallback(
    (e) => {
      handleChange(e);
      const {
        target: { value },
      } = e;
      let newValues = values[name];
      if (newValues.includes(value)) {
        newValues.splice(newValues.indexOf(value), 1);
      } else {
        newValues = uniq([...newValues, value]);
      }
      onChange(newValues);
    },
    [handleChange, name, onChange, values]
  );

  return (
    <FormControl py={2}>
      <FormLabel>{title}</FormLabel>
      <Center w="100%">
        <Grid templateColumns="repeat(6, 1fr)" gap={2} border="1px solid" borderColor="bluefrance" p={2} w="100%">
          {choices.map((choice, i) => {
            return (
              <Checkbox
                key={i}
                name={name}
                onChange={handleChanges}
                value={`${choice.value}`}
                isChecked={values[name].includes(`${choice.value}`)}
                icon={<Check />}
              >
                {choice.label}
              </Checkbox>
            );
          })}
        </Grid>
      </Center>
    </FormControl>
  );
};

const Finalize = () => {
  const [auth, setAuth] = useAuth();
  const [, setToken] = useToken();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = "Finalisation de votre inscription";

  const {
    handleSubmit: handleDemandeAcces,
    handleChange,
    errors,
    touched,
    values: valuesAccess,
    setFieldValue,
    setErrors,
  } = useFormik({
    initialValues: {
      type: "",
      // codes_region: "",
      // codes_academie: "",
      // codes_departement: "",
    },
    validationSchema: Yup.object().shape({
      type: Yup.string()
        .matches(/(organisme.admin|organisme.member|organisme.readonly|organisme.statsonly)/)
        .required("Requis"),
    }),
    onSubmit: (values) => {
      setIsSubmitting(true);
      // eslint-disable-next-line no-undef, no-async-promise-executor
      return new Promise(async (resolve) => {
        try {
          const result = await _post("/api/v1/auth/demande-acces", values);
          if (result.loggedIn) {
            const user = await _get("/api/v1/session/current");
            setAuth(user);
            setToken(result.token);
          }
        } catch (e) {
          if (e.messages.message === "No organisme found") {
            setErrors({
              type: `Une erreur technique est survenue. Nous n'avons pas pu retrouver l'organisme. Merci de bien vouloir contacter l'équipe du tableau de bord ${CONTACT_ADDRESS}`,
            });
          } else {
            console.error(e);
            setErrors({
              type: "Une erreur technique est survenue.",
            });
          }
        }
        setIsSubmitting(false);
        resolve("onSubmitHandler publish complete");
      });
    },
  });

  const { handleSubmit } = useFormik({
    initialValues: {},
    onSubmit: (values) => {
      // eslint-disable-next-line no-undef, no-async-promise-executor
      return new Promise(async (resolve) => {
        try {
          const result = await _post("/api/v1/auth/finalize", values);
          if (result.loggedIn) {
            const user = await _get("/api/v1/session/current");
            setAuth(user);
            setToken(result.token);
            router.push("/mon-espace/mon-organisme");
          }
        } catch (e) {
          console.error(e);
        }
        resolve("onSubmitHandler publish complete");
      });
    },
  });

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>

      <Flex w="full" flexDirection="column" h="full" mt={4}>
        <Heading textStyle="h2" color="grey.800" mt={5}>
          {title}
        </Heading>
        <Box mt={5}>
          {auth.isInPendingValidation &&
            auth.account_status === "FORCE_COMPLETE_PROFILE_STEP1" &&
            auth.roles.includes("of") && (
              <Box w="50%">
                <FormControl py={2} isRequired isInvalid={errors.type && touched.type}>
                  <FormLabel fontSize="1.3rem" fontWeight="bold" mb={5}>
                    Votre accès
                  </FormLabel>
                  <Text>
                    En tant qu’utilisateur, vous pouvez choisir votre droit d’accès :
                    <br /> (Vous pourrez toujours changer votre rôle en contactant le gestionnaire)
                  </Text>
                  <RadioGroup id="type" name="type" value={valuesAccess.type} mt={8}>
                    <VStack alignItems="baseline" fontSize="1.2rem" spacing={8}>
                      <Radio value={"organisme.readonly"} onChange={handleChange} size="lg" alignItems="flex-start">
                        <VStack justifyContent="flex-start">
                          <Text w="full">Lecture</Text>
                          <Text w="full" color="#666666" fontSize="0.9rem">
                            Une fois l’autorisation validée par le gestionnaire de votre organisme, ce rôle vous
                            autorise à consulter les données de votre organisme et leur évolution.
                          </Text>
                        </VStack>
                      </Radio>
                      <Radio value={"organisme.member"} onChange={handleChange} size="lg" alignItems="flex-start">
                        <VStack justifyContent="flex-start">
                          <Text w="full">Écriture</Text>
                          <Text w="full" color="#666666" fontSize="0.9rem">
                            Une fois l’autorisation validée par le gestionnaire de votre organisme, ce rôle vous
                            autorise à contribuer au partage des effectifs de votre organisme.
                          </Text>
                        </VStack>
                      </Radio>
                      <Radio value={"organisme.admin"} onChange={handleChange} size="lg" alignItems="flex-start">
                        <VStack justifyContent="flex-start">
                          <Text w="full">Gestion</Text>
                          <Text w="full" color="#666666" fontSize="0.9rem">
                            Ce rôle vous permet de valider (ou d’annuler) les demandes de création de compte de vos
                            collaborateurs. En tant que gestionnaire, vous êtes la seule personne à intervenir sur les
                            droits d’accès à l’espace de l’organisme. Vous pouvez aussi consulter et contribuer au
                            partage de vos effectifs.
                          </Text>
                        </VStack>
                      </Radio>
                    </VStack>
                  </RadioGroup>
                  {errors.type && touched.type && <FormErrorMessage>{errors.type}</FormErrorMessage>}
                </FormControl>
                <Button
                  size="md"
                  variant="primary"
                  onClick={handleDemandeAcces}
                  px={6}
                  isDisabled={isSubmitting}
                  mt={12}
                >
                  {isSubmitting && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" />}
                  Demander l&rsquo;accès
                </Button>
              </Box>
            )}

          {auth.isInPendingValidation &&
            auth.account_status === "FORCE_COMPLETE_PROFILE_STEP1" &&
            auth.roles.includes("reseau_of") && (
              <>
                <Heading as="h3" flexGrow="1" fontSize="1.2rem" mt={2} mb={5}>
                  Quel est votre réseau ?
                </Heading>
                <Input
                  {...{
                    name: "reseau",
                    fieldType: "select",
                    placeholder: "Sélectionner votre réseau",
                    options: Object.values(RESEAUX_CFAS).map(({ nomReseau }) => ({
                      label: `${nomReseau}`,
                      value: nomReseau,
                    })),
                  }}
                  value={valuesAccess.reseau}
                  onSubmit={(value) => {
                    setFieldValue("type", "organisme.statsonly");
                    setFieldValue("reseau", value);
                  }}
                  w="100%"
                />
                <Button
                  size="md"
                  variant="primary"
                  onClick={handleDemandeAcces}
                  px={6}
                  mt={8}
                  isDisabled={isSubmitting || !valuesAccess.reseau}
                >
                  {isSubmitting && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" />}
                  Demander l&rsquo;accès
                </Button>
              </>
            )}
          {auth.isInPendingValidation &&
            auth.account_status === "FORCE_COMPLETE_PROFILE_STEP1" &&
            auth.roles.includes("pilot") && (
              <>
                {auth.organisation === "DDETS" && (
                  <>
                    <Heading as="h3" flexGrow="1" fontSize="1.2rem" mt={2} mb={5}>
                      À quel(s) département(s) souhaitez-vous accéder?
                    </Heading>
                    <MultipleCheckBox
                      title=""
                      name="accessDepartementList"
                      choices={DEPARTEMENTS_SORTED.map(({ nom, code }) => ({ label: `${nom} (${code})`, value: code }))}
                      onChange={(selected) => {
                        setFieldValue("type", "organisme.statsonly");
                        setFieldValue("codes_departement", selected.join(","));
                      }}
                    />
                  </>
                )}
                {(auth.organisation === "DREETS" ||
                  auth.organisation === "DEETS" ||
                  auth.organisation === "DRAAF" ||
                  auth.organisation === "CONSEIL_REGIONAL") && (
                  <>
                    <Heading as="h3" flexGrow="1" fontSize="1.2rem" mt={2} mb={5}>
                      À quelle(s) région(s) souhaitez-vous accéder?
                    </Heading>
                    <MultipleCheckBox
                      title=""
                      name="accessRegionList"
                      choices={REGIONS_SORTED.map(({ nom, code }) => ({ label: `${nom} (${code})`, value: code }))}
                      onChange={(selected) => {
                        setFieldValue("type", "organisme.statsonly");
                        setFieldValue("codes_region", selected.join(","));
                      }}
                    />
                  </>
                )}
                {auth.organisation === "ACADEMIE" && (
                  <>
                    <Heading as="h3" flexGrow="1" fontSize="1.2rem" mt={2} mb={5}>
                      À quelle(s) académie(s) souhaitez-vous accéder?
                    </Heading>
                    <MultipleCheckBox
                      title=""
                      name="accessAcademieList"
                      choices={ACADEMIES_SORTED.map(({ nom, code }) => ({ label: `${nom} (${code})`, value: code }))}
                      onChange={(selected) => {
                        setFieldValue("type", "organisme.statsonly");
                        setFieldValue("codes_academie", selected.join(","));
                      }}
                    />
                  </>
                )}
                <Button
                  size="md"
                  variant="primary"
                  onClick={handleDemandeAcces}
                  px={6}
                  mt={8}
                  isDisabled={
                    isSubmitting ||
                    (!valuesAccess.codes_region && !valuesAccess.codes_departement && !valuesAccess.codes_academie)
                  }
                >
                  {isSubmitting && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" />}
                  Demander l&rsquo;accès
                </Button>
              </>
            )}

          {auth.isInPendingValidation &&
            !auth.hasAtLeastOneUserToValidate &&
            auth.account_status === "FORCE_COMPLETE_PROFILE_STEP2" && (
              <Ribbons variant="info" mt="0.5rem">
                <Box ml={3}>
                  <Text color="grey.800" fontSize="1.2rem" fontWeight="bold">
                    Votre demande est en cours d&rsquo;étude par nos services.
                  </Text>
                  <Text color="bluefrance" mt={4} fontSize="0.9rem">
                    Vous serez notifié par courriel dès que votre demande aura été validée.
                  </Text>
                  <Text color="grey.800" mt={4} textStyle="sm">
                    Pour des raisons de sécurité, un de nos administrateurs va examiner votre demande. <br />
                  </Text>
                </Box>
              </Ribbons>
            )}
          {auth.isInPendingValidation &&
            auth.hasAtLeastOneUserToValidate &&
            auth.account_status === "FORCE_COMPLETE_PROFILE_STEP2" && (
              <Ribbons variant="info" mt="0.5rem">
                <Box ml={3}>
                  <Text color="grey.800" fontSize="1.2rem" fontWeight="bold">
                    Votre demande d&rsquo;accès est en cours d&rsquo;étude par un gestionnaire de cet organisme.
                  </Text>
                  <Text color="bluefrance" mt={4} fontSize="0.9rem">
                    Vous serez notifié par courriel dès que votre demande aura été validée.
                  </Text>
                  <Text color="grey.800" mt={4}>
                    <Text textStyle="sm">
                      Pour des raisons de sécurité, un des gestionnaires de cet organisme va examiner votre demande.
                      <br />
                    </Text>
                  </Text>
                </Box>
              </Ribbons>
            )}
          {!auth.isInPendingValidation && (
            <VStack spacing="4w" alignItems="flex-start">
              <Text color="grey.800" mt={4} textStyle="sm">
                Votre demande d&rsquo;accès a été validée. <br />
              </Text>
              <Button size="md" variant="primary" onClick={handleSubmit} px={6}>
                Accéder à mon espace
              </Button>
            </VStack>
          )}
          {auth.isInPendingValidation && (
            <Flex flexGrow={1} alignItems="end" my={8}>
              <Text mt={8} fontSize="1rem">
                Votre réseau n’apparaît pas dans la liste ?{" "}
                <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" ml={3}>
                  Contacter l&apos;assistance
                </Link>
              </Text>
            </Flex>
          )}
        </Box>
      </Flex>
    </Page>
  );
};

export default Finalize;
