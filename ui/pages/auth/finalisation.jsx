import {
  Flex,
  Box,
  Button,
  HStack,
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
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import React, { useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { decodeJwt } from "jose";
import uniq from "lodash.uniq";

import { Page } from "../../components/Page/Page";

import useToken from "../../hooks/useToken";
import useAuth from "../../hooks/useAuth";
import { _post } from "../../common/httpClient";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";
import Link from "../../components/Links/Link";
import Ribbons from "../../components/Ribbons/Ribbons";
import { CONTACT_ADDRESS } from "../../common/constants/product";
import { ACADEMIES, REGIONS, DEPARTEMENTS } from "../../common/constants/territoiresConstants";
import { Check } from "../../theme/components/icons";

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

  const title = "Finalisation de votre inscription";

  const {
    handleSubmit: handleDemandeAcces,
    handleChange,
    errors,
    touched,
    values: valuesAccess,
    setFieldValue,
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
      // eslint-disable-next-line no-undef, no-async-promise-executor
      return new Promise(async (resolve) => {
        try {
          const result = await _post("/api/v1/auth/demande-acces", values);
          if (result.loggedIn) {
            const user = decodeJwt(result.token);
            setAuth(user);
            setToken(result.token);
          }
        } catch (e) {
          console.error(e);
        }
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
            const user = decodeJwt(result.token);
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
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Flex w="full" flexDirection="column" h="full" mt={4}>
        <Heading textStyle="h2" color="grey.800" mt={5}>
          {title}
        </Heading>
        <Box mt={5}>
          {auth.isInPendingValidation &&
            auth.account_status === "FORCE_COMPLETE_PROFILE_STEP1" &&
            auth.roles.includes("of") && (
              <>
                <FormControl py={2} isRequired isInvalid={errors.type && touched.type}>
                  <FormLabel>Votre accès</FormLabel>
                  <RadioGroup id="type" name="type" value={valuesAccess.type} mt={8}>
                    <VStack alignItems="baseline" fontSize="1.2rem" spacing={8}>
                      <Radio value={"organisme.readonly"} onChange={handleChange} size="lg">
                        Lecture
                      </Radio>
                      <Radio value={"organisme.member"} onChange={handleChange} size="lg">
                        Écriture
                      </Radio>
                      <Radio value={"organisme.admin"} onChange={handleChange} size="lg">
                        Gestion
                      </Radio>
                    </VStack>
                  </RadioGroup>
                  {errors.type && touched.type && <FormErrorMessage>{errors.type}</FormErrorMessage>}
                </FormControl>
                <Button size="md" variant="primary" onClick={handleDemandeAcces} px={6}>
                  Demander l&rsquo;accès
                </Button>
              </>
            )}
          {auth.isInPendingValidation &&
            auth.account_status === "FORCE_COMPLETE_PROFILE_STEP1" &&
            auth.roles.includes("pilot") && (
              <>
                {auth.organisation === "DEETS" && (
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
                <Button size="md" variant="primary" onClick={handleDemandeAcces} px={6} mt={8}>
                  Demander l&rsquo;accès
                </Button>
              </>
            )}

          {auth.isInPendingValidation &&
            !auth.hasAtLeastOneUserToValidate &&
            auth.account_status === "FORCE_COMPLETE_PROFILE_STEP2" && (
              <Ribbons variant="loading" mt="0.5rem">
                <Box ml={3}>
                  <Text color="grey.800" fontSize="1.2rem" fontWeight="bold">
                    Votre demande est en cours d&rsquo;étude par nos services.
                  </Text>
                  <Text color="bleufrance" mt={4} fontSize="0.9rem">
                    Vous serez notifié dès que votre demander aura été validée.
                  </Text>
                  <Text color="grey.800" mt={4} textStyle="sm">
                    Vous êtes la premieres personne a demander une accès à cet organisme. <br />
                    Pour des raisons de sécurité, un de nos administrateurs va examiner votre demande. <br />
                  </Text>
                </Box>
              </Ribbons>
            )}
          {auth.isInPendingValidation &&
            auth.hasAtLeastOneUserToValidate &&
            auth.account_status === "FORCE_COMPLETE_PROFILE_STEP2" && (
              <Ribbons variant="loading" mt="0.5rem">
                <Box ml={3}>
                  <Text color="grey.800" fontSize="1.2rem" fontWeight="bold">
                    Votre demande d&rsquo;accès est en cours d&rsquo;étude par un gestionnaire de cet organisme.
                  </Text>
                  <Text color="bleufrance" mt={4} fontSize="0.9rem">
                    Vous serez notifié dès que votre demander aura été validée.
                  </Text>
                  <Text color="grey.800" mt={4}>
                    <Text textStyle="sm">
                      Vous êtes la premieres personne a demander une accès à cet organisme. <br />
                      Pour des raisons de sécurité, un des gestionnaire de cet organisme va examiner votre demande.
                      <br />
                    </Text>
                  </Text>
                </Box>
              </Ribbons>
            )}
          {!auth.isInPendingValidation && (
            <HStack spacing="4w">
              <Button size="md" variant="primary" onClick={handleSubmit} px={6}>
                Accéder à mon espace
              </Button>
            </HStack>
          )}
          <Flex flexGrow={1} alignItems="end" mt={8}>
            <Text mt={8} fontSize="1rem">
              Vous rencontrez des difficultés à passer cette étape ?{" "}
              <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" ml={3}>
                Contacter l&apos;assistance
              </Link>
            </Text>
          </Flex>
        </Box>
      </Flex>
    </Page>
  );
};

export default Finalize;
