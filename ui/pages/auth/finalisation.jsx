import {
  Flex,
  Box,
  Button,
  Text,
  Heading,
  FormControl,
  FormLabel,
  VStack,
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
  const { auth, refreshSession } = useAuth();
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
            const user = await _get("/api/v1/session");
            // setAuth(user);
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
            await refreshSession();
            router.push("/");
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
            !auth.isOrganismeAdmin &&
            auth.account_status === "PENDING_ADMIN_VALIDATION" && (
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
            auth.isOrganismeAdmin &&
            auth.account_status === "PENDING_ADMIN_VALIDATION" && (
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
        </Box>
      </Flex>
    </Page>
  );
};

export default Finalize;
