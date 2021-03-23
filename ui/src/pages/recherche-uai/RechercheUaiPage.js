import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Skeleton,
  Stack,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import React from "react";

import { Page, PageContent, PageHeader, PageSectionTitle } from "../../common/components";
import StatCard from "../../common/components/StatCard";
import { validateUai } from "../../common/domain/uai";
import withUaiSearch from "./withUaiSearch";

const validateInput = async (value) => {
  if (!value) {
    return "UAI Obligatoire";
  } else if (!validateUai(value.toLowerCase())) {
    return "Mauvais format d'UAI";
  }
  return;
};

const FormLoading = () => {
  return (
    <Box paddingX="6w" paddingY="2w">
      <Divider />
      <Stack>
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
      </Stack>
    </Box>
  );
};

const RechercheUaiPage = ({ searchUaiInformation, loading, error, uaiInformation }) => {
  return (
    <Page>
      <PageHeader title="Recherche UAI" />
      <PageContent>
        <Stack spacing="4w">
          <Alert status="info">
            <AlertIcon />
            Saisir un numéro UAI pour consulter la liste des statutsCandidats pour un établissement
          </Alert>
          <Formik
            initialValues={{ uai: "" }}
            onSubmit={async ({ uai }) => {
              await searchUaiInformation(uai);
            }}
          >
            {() => (
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
                <Button leftIcon={<i className="ri-search-eye-line"></i>} mt={4} isLoading={loading} type="submit">
                  Rechercher les informations
                </Button>
              </Form>
            )}
          </Formik>

          {loading && <FormLoading />}

          {error && (
            <Alert status="error">
              <AlertIcon />
              Erreur, impossible de récupérer les données !
            </Alert>
          )}

          {uaiInformation && (
            <Box>
              <Divider marginBottom="3w" />
              <PageSectionTitle>{uaiInformation.cfaName || "CFA inconnu"}</PageSectionTitle>
              <HStack spacing="2w" mt="3w">
                <StatCard
                  label="Statuts dans les logs / envoyés"
                  stat={uaiInformation.nbUsersEventsData}
                  background="greenmedium.200"
                  color="grey.800"
                />
                <StatCard
                  label="Statuts prospects"
                  stat={uaiInformation.nbProspects}
                  background="greenmedium.300"
                  color="grey.800"
                />
                <StatCard
                  label="Statuts inscrits"
                  stat={uaiInformation.nbInscrits}
                  background="greenmedium.300"
                  color="grey.800"
                />
                <StatCard
                  label="Statuts apprentis"
                  stat={uaiInformation.nbApprentis}
                  background="greenmedium.300"
                  color="grey.800"
                />
                <StatCard
                  label="Statuts abandons"
                  stat={uaiInformation.nbAbandon}
                  background="greenmedium.300"
                  color="grey.800"
                />
                <StatCard
                  label="Statuts abandons de prospects"
                  stat={uaiInformation.nbAbandonProspects}
                  background="greenmedium.300"
                  color="grey.800"
                />
              </HStack>
            </Box>
          )}
        </Stack>
      </PageContent>
    </Page>
  );
};

RechercheUaiPage.propTypes = {
  loading: PropTypes.bool.isRequired,
  searchUaiInformation: PropTypes.func.isRequired,
  error: PropTypes.object,
  uaiInformation: PropTypes.shape({
    cfaName: PropTypes.string,
    nbUsersEventsData: PropTypes.number.isRequired,
    nbProspects: PropTypes.number.isInvalid,
    nbInscrits: PropTypes.number.isRequired,
    nbApprentis: PropTypes.number.isRequired,
    nbAbandon: PropTypes.number.isRequired,
    nbAbandonProspects: PropTypes.number.isRequired,
  }),
};

export default withUaiSearch(RechercheUaiPage);
