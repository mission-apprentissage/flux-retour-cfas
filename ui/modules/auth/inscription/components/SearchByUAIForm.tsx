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
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import * as Yup from "yup";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import { UAI_REGEX } from "@/common/domain/uai";
import { _post } from "@/common/httpClient";
import { sleep } from "@/common/utils/misc";
import Link from "@/components/Links/Link";
import { InscriptionOrganistionChildProps } from "@/modules/auth/inscription/common";

import OrganismeDetails from "./OrganismeDetails";

export default function SearchByUAIForm({ organisation, setOrganisation }: InscriptionOrganistionChildProps) {
  const [organismes, setOrganismes] = useState<any[] | null>(null);

  return (
    <Formik
      initialValues={{ uai: "" }}
      validateOnBlur={false}
      validationSchema={Yup.object().shape({
        uai: Yup.string().required("L'UAI est obligatoire").matches(UAI_REGEX, {
          message: "UAI invalide",
        }),
      })}
      onSubmit={async ({ uai }, actions) => {
        try {
          const organismes = await _post("/api/v1/organismes/search-by-uai", { uai });
          await sleep(500); // attente pour ne pas paraitre trop instantané...
          setOrganismes(organismes);
        } catch (err) {
          const errorMessage: string = err?.json?.data?.message || err.message;
          actions.setFieldError("uai", errorMessage);
        } finally {
          actions.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form>
          <Field name="uai">
            {({ field, meta }) => (
              <FormControl minH={120} mt={4} isRequired isInvalid={meta.error && meta.touched}>
                <FormLabel>UAI de votre organisme</FormLabel>
                <FormHelperText mb={2}>Une UAI au format valide est composée de 7 chiffres et 1 lettre</FormHelperText>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Exemple : 1234567A"
                  isDisabled={form.isSubmitting}
                  onChange={(e) => {
                    field.onChange(e);
                    // reset results and selection
                    setOrganisation(null);
                    setOrganismes([]);

                    // try to submit the form
                    setTimeout(() => {
                      form.submitForm();
                    });
                  }}
                />
                <FormErrorMessage>
                  {meta.error === "Aucun organisme trouvé" ? (
                    <div>
                      {/* la div supprime le flex parent */}
                      Ce code UAI n’a pas été trouvé dans le{" "}
                      <Link href="https://referentiel.apprentissage.onisep.fr/" textDecoration="underline" isExternal>
                        référentiel de l’apprentissage
                      </Link>
                      .
                      <br />
                      Si vous pensez que c’est une erreur, veuillez nous contacter à{" "}
                      <Link
                        href={`mailto:${CONTACT_ADDRESS}`}
                        target="_blank"
                        textDecoration="underline"
                        isExternal
                        whiteSpace="nowrap"
                      >
                        {CONTACT_ADDRESS}
                      </Link>
                      .
                    </div>
                  ) : (
                    meta.error
                  )}
                </FormErrorMessage>
              </FormControl>
            )}
          </Field>
          {form.isSubmitting && <Spinner display="block" mx="auto" />}
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
                    mt="2w"
                    size="md"
                    variant="primary"
                    px={6}
                    isDisabled={organismes[0].ferme || organisation}
                    onClick={() =>
                      setOrganisation({
                        type: "ORGANISME_FORMATION",
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
                            isDisabled={organisme.ferme}
                            onClick={() =>
                              setOrganisation({
                                type: "ORGANISME_FORMATION",
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
