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

import { SIRET_REGEX } from "@/common/domain/siret";
import { _post } from "@/common/httpClient";
import { sleep } from "@/common/utils/misc";
import Link from "@/components/Links/Link";
import { getOrganisationTypeFromNature, InscriptionOrganistionChildProps } from "@/modules/auth/inscription/common";

import OrganismeDetails from "./OrganismeDetails";

export default function SearchBySIRETForm({ organisation, setOrganisation }: InscriptionOrganistionChildProps) {
  const [organismes, setOrganismes] = useState<any[] | null>(null);

  return (
    <Formik
      initialValues={{ siret: "" }}
      validateOnBlur={false}
      validationSchema={Yup.object().shape({
        siret: Yup.string().required("Le SIRET est obligatoire").matches(SIRET_REGEX, {
          message: "SIRET invalide",
        }),
      })}
      onSubmit={async ({ siret }, actions) => {
        try {
          const organismes = await _post("/api/v1/organismes/search-by-siret", { siret });
          await sleep(500); // attente pour ne pas paraitre trop instantané...
          setOrganismes(organismes);
        } catch (err) {
          const errorMessage: string = err?.json?.data?.message || err.message;
          actions.setFieldError("siret", errorMessage);
        } finally {
          actions.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form>
          <Field name="siret">
            {({ field, meta }) => (
              <FormControl minH={120} mt={4} isRequired isInvalid={meta.error && meta.touched}>
                <FormLabel>SIRET de votre organisme</FormLabel>
                <FormHelperText mb={2}>Un SIRET au format valide est composé de 14 chiffres</FormHelperText>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Exemple : 98765432400019"
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
                      Ce SIRET n’a pas été identifié. Veuillez vérifier à nouveau ou consulter l’
                      <Link href={"https://annuaire-entreprises.data.gouv.fr/"} textDecoration={"underline"} isExternal>
                        annuaire des entreprises
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
                        type: getOrganisationTypeFromNature(organismes[0].nature),
                        siret: organismes[0].siret,
                        uai: organismes[0].uai || null, // peut être absent si non présent dans le référentiel
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
                    Plusieurs UAI sont identifiés pour ce SIRET. Choisissez votre établissement.
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
                                type: getOrganisationTypeFromNature(organisme.nature),
                                siret: organisme.siret,
                                uai: organisme.uai || null, // peut être absent si non présent dans le référentiel
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
