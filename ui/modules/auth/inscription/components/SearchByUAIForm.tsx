import React, { useState } from "react";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Text,
} from "@chakra-ui/react";
import { searchOrganismeByUAI } from "@/common/api/tableauDeBord";
import { UAI_REGEX } from "@/common/domain/uai";
import OrganismeDetails from "./OrganismeDetails";

export default function SearchByUAIForm({ setOrganisation }) {
  const [organismes, setOrganismes] = useState<any[] | null>(null);

  return (
    <Formik
      initialValues={{ uai: "" }}
      validationSchema={Yup.object().shape({
        uai: Yup.string().required("L'UAI est obligatoire").matches(UAI_REGEX, {
          message: "UAI invalide",
        }),
      })}
      onSubmit={async ({ uai }, actions) => {
        try {
          const organismes = await searchOrganismeByUAI(uai);
          setOrganismes(organismes);
        } catch (err) {
          let errorMessage: string = err?.json?.data?.message || err.message;
          if (err?.json?.data?.message === "Aucun organisme trouvé") {
            errorMessage = "Ce code UAI n'existe pas. Veuillez vérifier à nouveau";
          }
          actions.setFieldError("uai", errorMessage);
        } finally {
          actions.setSubmitting(false);
        }
      }}
    >
      {() => (
        <Form>
          <Field name="uai">
            {({ field, meta }) => (
              <FormControl mt={4} py={2} isRequired isInvalid={meta.error && meta.touched}>
                <FormLabel>UAI de votre organisme</FormLabel>
                <FormHelperText mb={2}>Une UAI au format valide est composée de 7 chiffres et 1 lettre</FormHelperText>
                <Input {...field} id={field.name} placeholder="Exemple : 1234567A" />
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
          {organismes && (
            <>
              {organismes.length === 1 && (
                <>
                  <Box
                    alignItems="baseline"
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor="green.500"
                    rounded="md"
                    flexDirection="column"
                    p={4}
                    w="100%"
                  >
                    <Text mx="auto" pb={2} fontSize="1.1rem" fontWeight="bold">
                      Organisme de formation identifié :
                    </Text>
                    <OrganismeDetails organisme={organismes[0]} />
                  </Box>
                  <Button
                    type="submit"
                    mt="2w"
                    size="md"
                    variant="primary"
                    px={6}
                    onClick={() =>
                      setOrganisation({
                        organisation: "organisme_formation",
                        siret: organismes[0].siret,
                        uai: organismes[0].uai,
                      })
                    }
                  >
                    Ceci est mon organisme
                  </Button>
                </>
              )}

              {organismes.length >= 2 && (
                <>
                  <Box color="error" my={2}>
                    <Box as="i" className="ri-alert-fill" color="warning" marginRight="1v" />
                    Plusieurs SIRET sont identifiés pour cette UAI. Choisissez votre établissement.
                  </Box>

                  <Accordion allowToggle variant="withBorder" w="100%">
                    {organismes.map((organisme, index) => (
                      <AccordionItem key={index} as="div">
                        <AccordionButton color="bluefrance" w="full">
                          <Box flex="1" textAlign="left">
                            {organisme.raison_sociale || organisme.nom || organisme.enseigne}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel>
                          <OrganismeDetails organisme={organisme} />

                          <Button
                            mt="2w"
                            size="md"
                            variant="primary"
                            px={6}
                            onClick={() =>
                              setOrganisation({
                                organisation: "organisme_formation",
                                siret: organisme.siret,
                                uai: organisme.uai,
                              })
                            }
                          >
                            Ceci est mon organisme
                          </Button>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </>
              )}
            </>
          )}
        </Form>
      )}
    </Formik>
  );
}
