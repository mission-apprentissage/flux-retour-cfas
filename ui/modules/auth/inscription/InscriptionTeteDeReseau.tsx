import { Button, FormControl, FormErrorMessage, FormLabel, HStack, Input, Select, Text } from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import { useRouter } from "next/router";
import React from "react";
import { ITeteDeReseauKey, TETE_DE_RESEAUX_SORTED } from "shared";
import * as Yup from "yup";

import { _post } from "@/common/httpClient";

import { InscriptionOrganistionChildProps } from "./common";

export const InscriptionTeteDeReseau = ({
  organisation,
  setOrganisation,
  setHideBackNextButtons,
}: InscriptionOrganistionChildProps) => {
  const router = useRouter();
  const TETE_DE_RESEAUX_SORTED_WITH_OTHER_OPTION = [...TETE_DE_RESEAUX_SORTED, { nom: "Autre Réseau", key: "AUTRE" }];

  const sendOtherReseauRegisterDemand = async (values, { setStatus }) => {
    try {
      await _post("/api/v1/auth/register-unknown-network", {
        email: values.email,
        unknownNetwork: values.nomReseau,
      });
      router.push("/auth/inscription/reseau-autre");
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  return (
    <>
      <FormControl isRequired>
        <FormLabel>Vous représentez le réseau :</FormLabel>
        <Select
          placeholder="Sélectionner votre réseau"
          onChange={(e) => {
            setOrganisation({
              type: "TETE_DE_RESEAU",
              reseau: e.target.value as ITeteDeReseauKey,
            });
            setHideBackNextButtons?.(e.target.value === "AUTRE");
          }}
        >
          {TETE_DE_RESEAUX_SORTED_WITH_OTHER_OPTION.map((reseau, index) => (
            <option value={reseau.key} key={index}>
              {reseau.nom}
            </option>
          ))}
        </Select>
      </FormControl>

      {organisation?.type === "TETE_DE_RESEAU" && (organisation?.reseau as string) === "AUTRE" && (
        <>
          <Formik
            initialValues={{
              nomReseau: "",
              email: "",
            }}
            validationSchema={Yup.object().shape({
              nomReseau: Yup.string().required("Veuillez saisir un nom de réseau"),
              email: Yup.string().email("Veuillez saisir un email valide").required("Veuillez saisir un identifiant"),
            })}
            onSubmit={sendOtherReseauRegisterDemand}
          >
            {({ status = {} }) => {
              return (
                <Form>
                  <Field name="nomReseau">
                    {({ field, meta }) => {
                      return (
                        <FormControl mt="2w" mb="2w" isRequired isInvalid={meta.error && meta.touched}>
                          <FormLabel>Indiquez le nom de votre réseau :</FormLabel>
                          <Input {...field} id={field.name} placeholder="Nom du réseau..." />{" "}
                          <FormErrorMessage>{meta.error}</FormErrorMessage>
                        </FormControl>
                      );
                    }}
                  </Field>
                  <Field name="email">
                    {({ field, meta }) => {
                      return (
                        <FormControl isRequired isInvalid={meta.error && meta.touched}>
                          <FormLabel>Votre courriel :</FormLabel>
                          <Input {...field} id={field.name} placeholder="prenom.nom@courriel.fr" />
                          <FormErrorMessage>{meta.error}</FormErrorMessage>
                        </FormControl>
                      );
                    }}
                  </Field>
                  {status.error && (
                    <Text color="error" my={2}>
                      {status.error}
                    </Text>
                  )}
                  <HStack gap="24px" mt={5}>
                    <Button onClick={() => router.push("/auth/inscription")} color="bluefrance" variant="secondary">
                      Revenir
                    </Button>
                    <Button size="md" variant="primary" type="submit" px={6}>
                      Suivant
                    </Button>
                  </HStack>
                </Form>
              );
            }}
          </Formik>
        </>
      )}
    </>
  );
};
