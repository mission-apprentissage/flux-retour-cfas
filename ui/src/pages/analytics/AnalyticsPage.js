import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Skeleton,
  Stack,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import React, { useState } from "react";

import LoggedUserMenu from "../../common/components/LoggedUserMenu";
import PageTitle from "../../common/components/PageTitle";
import StatCard from "../../common/components/StatCard";
import { validateUai } from "../../common/domain/uai";
import { useFetch } from "../../common/hooks/useFetch";

const AnalyticsPage = () => {
  const [uai, setUai] = useState(null);
  const [analyticsData, loading, error] = useFetch(`/api/analytics/statutsCandidats/uai/${uai}`);

  const findAnalyticsForUai = async (values) => {
    setUai(values.uai);
  };

  // Validate format
  const validateInput = async (value) => {
    let error;
    if (!value) {
      error = "UAI Obligatoire";
    } else if (!validateUai(value.toLowerCase())) {
      error = "Mauvais format d'UAI";
    }
    return error;
  };

  return (
    <Box width="100%">
      <Box background="bluegrey.100" padding="4w">
        <Flex flexDirection="row-reverse">
          <LoggedUserMenu />
        </Flex>
        <PageTitle>Analytics</PageTitle>
      </Box>
      <Box mt={4} paddingX="6w" paddingY="2w">
        <Stack spacing={3} mb={5}>
          <Alert status="info">
            <AlertIcon />
            Saisir un numéro UAI pour consulter la liste des statutsCandidats pour un établissement
          </Alert>
        </Stack>
        <Formik initialValues={{ uai: "" }} onSubmit={findAnalyticsForUai}>
          {(props) => (
            <Form>
              <Field name="uai" validate={validateInput}>
                {({ field, form }) => (
                  <FormControl isInvalid={form.errors.uai && form.touched.uai}>
                    <FormLabel htmlFor="uai">UAI Etablissement</FormLabel>
                    <Input {...field} id="uai" placeholder="Ex: 0762232N" />
                    <FormErrorMessage>{form.errors.uai}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Button
                leftIcon={<i className="ri-search-eye-line"></i>}
                mt={4}
                isLoading={props.isSubmitting}
                type="submit"
              >
                Rechercher les informations
              </Button>
            </Form>
          )}
        </Formik>
      </Box>

      {loading ? (
        <Box paddingX="6w" paddingY="2w">
          <Divider />
          <Stack>
            <Skeleton height="20px" />
            <Skeleton height="20px" />
            <Skeleton height="20px" />
          </Stack>
        </Box>
      ) : error ? (
        <Box paddingX="6w" paddingY="2w">
          <Alert status="error">
            <AlertIcon />
            Erreur, impossible de récupérer les données !
          </Alert>
        </Box>
      ) : uai ? (
        <Box paddingX="6w" paddingY="2w">
          <Divider />
          <HStack spacing="2w" mt="3w">
            <StatCard
              label="Statuts dans les logs / envoyés"
              stat={analyticsData.nbUsersEventsData}
              background="greenmedium.200"
              color="grey.800"
            />
            <StatCard
              label="Statuts prospects"
              stat={analyticsData.nbProspects}
              background="greenmedium.300"
              color="grey.800"
            />
            <StatCard
              label="Statuts inscrits"
              stat={analyticsData.nbInscrits}
              background="greenmedium.300"
              color="grey.800"
            />
            <StatCard
              label="Statuts apprentis"
              stat={analyticsData.nbApprentis}
              background="greenmedium.300"
              color="grey.800"
            />
            <StatCard
              label="Statuts abandons"
              stat={analyticsData.nbAbandon}
              background="greenmedium.300"
              color="grey.800"
            />
          </HStack>
        </Box>
      ) : (
        <></>
      )}
    </Box>
  );
};

export default AnalyticsPage;
