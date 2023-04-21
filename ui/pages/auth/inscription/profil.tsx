import { CheckIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  List,
  ListIcon,
  ListItem,
  Radio,
  RadioGroup,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import YupPassword from "yup-password";

import { getOrganismeByUAIAndSIRET } from "@/common/api/tableauDeBord";
import { TETE_DE_RESEAUX_BY_ID } from "@/common/constants/networksConstants";
import { ACADEMIES_BY_ID, REGIONS_BY_ID, DEPARTEMENTS_BY_ID } from "@/common/constants/territoiresConstants";
import { _get, _post } from "@/common/httpClient";
import { Organisation } from "@/common/internal/Organisation";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { CGU_VERSION } from "@/components/legal/Cgu";
import Ribbons from "@/components/Ribbons/Ribbons";
import useToaster from "@/hooks/useToaster";
import InscriptionWrapper from "@/modules/auth/inscription/InscriptionWrapper";
import { Check, ShowPassword } from "@/theme/components/icons";

YupPassword(Yup); // extend yup

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function OrganisationRibbon({ organisation }: { organisation: Organisation }) {
  const { toastError } = useToaster();
  const isOrganismeFormation =
    organisation.type === "ORGANISME_FORMATION_FORMATEUR" ||
    organisation.type === "ORGANISME_FORMATION_RESPONSABLE" ||
    organisation.type === "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR";

  const [organisationFormationLabel, setOrganisationFormationLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (isOrganismeFormation) {
      (async () => {
        try {
          try {
            const organisme = await getOrganismeByUAIAndSIRET(organisation.uai, organisation.siret);
            setOrganisationFormationLabel(organisme.raison_sociale || organisme.nom || organisme.enseigne);
          } catch (err) {
            const errorMessage: string = err?.json?.data?.message || err.message;
            setOrganisationFormationLabel(errorMessage);
            toastError(errorMessage);
            setError(true);
          }
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setIsLoading(false);
    }
  }, [isOrganismeFormation]);

  return isLoading ? (
    <Spinner />
  ) : (
    <Ribbons variant={error ? "error" : "success"} mt="0.5rem">
      <Box ml={3} color="grey.800">
        {(() => {
          switch (organisation.type) {
            case "ORGANISME_FORMATION_FORMATEUR":
            case "ORGANISME_FORMATION_RESPONSABLE":
            case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
              return (
                <>
                  <Text fontSize="20px" fontWeight="bold">
                    {organisationFormationLabel}
                  </Text>
                  <Text>
                    UAI : {organisation.uai || "Inconnu"} - SIRET : {organisation.siret}
                  </Text>
                </>
              );
            }

            case "TETE_DE_RESEAU":
              return (
                <Text fontSize="20px" fontWeight="bold">
                  {TETE_DE_RESEAUX_BY_ID[organisation.reseau]?.nom}
                </Text>
              );

            case "DREETS":
            case "DRAAF":
              return (
                <>
                  <Text fontSize="20px" fontWeight="bold">
                    {organisation.type}
                  </Text>
                  <Text>Territoire : {REGIONS_BY_ID[organisation.code_region].nom}</Text>
                </>
              );
            case "CONSEIL_REGIONAL":
              return (
                <>
                  <Text fontSize="20px" fontWeight="bold">
                    Conseil régional
                  </Text>
                  <Text>Territoire : {REGIONS_BY_ID[organisation.code_region].nom}</Text>
                </>
              );
            case "DDETS":
              return (
                <>
                  <Text fontSize="20px" fontWeight="bold">
                    DDETS
                  </Text>
                  <Text>Territoire : {DEPARTEMENTS_BY_ID[organisation.code_departement].nom}</Text>
                </>
              );

            case "ACADEMIE":
              return (
                <>
                  <Text fontSize="20px" fontWeight="bold">
                    Académie
                  </Text>
                  <Text>Territoire : {ACADEMIES_BY_ID[organisation.code_academie].nom}</Text>
                </>
              );

            case "OPERATEUR_PUBLIC_NATIONAL":
              return (
                <Text fontSize="20px" fontWeight="bold">
                  {organisation.nom}
                </Text>
              );
            case "ADMINISTRATEUR":
              return (
                <Text fontSize="20px" fontWeight="bold">
                  Administrateur
                </Text>
              );
          }
        })()}
      </Box>
    </Ribbons>
  );
}

const PageFormulaireProfil = () => {
  const router = useRouter();
  const { toastError } = useToaster();
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [fixedEmail, setFixedEmail] = useState("");

  // try to use the invitation token if provided
  useEffect(() => {
    if (router.query.organisation) {
      setOrganisation(JSON.parse(router.query.organisation as string));
    }
    if (router.query.invitationToken) {
      (async () => {
        try {
          const invitation = await _get(`/api/v1/invitations/${router.query.invitationToken}`);
          setOrganisation(invitation.organisation);
          setFixedEmail(invitation.email);
          // TODO il faudra gérer le refus de l'invitation
        } catch (err) {
          toastError(err?.message);
        }
      })();
    }
  }, []);

  return (
    <InscriptionWrapper>
      {organisation && (
        <>
          <OrganisationRibbon organisation={organisation} />
          <ProfileForm organisation={organisation} fixedEmail={fixedEmail} />
        </>
      )}
    </InscriptionWrapper>
  );
};

export default PageFormulaireProfil;

function ProfileForm({ organisation, fixedEmail }: { organisation: Organisation; fixedEmail: string }) {
  const router = useRouter();
  const { toastSuccess, toastError } = useToaster();
  const passwordMinLength = organisation.type === "ADMINISTRATEUR" ? 20 : 12;
  const [showPasswordCharacters, setShowPasswordCharacters] = React.useState(false);

  const isOrganismeFormation =
    organisation.type === "ORGANISME_FORMATION_FORMATEUR" ||
    organisation.type === "ORGANISME_FORMATION_RESPONSABLE" ||
    organisation.type === "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR";
  return (
    <Formik
      initialValues={{
        email: fixedEmail,
        civility: "",
        nom: "",
        prenom: "",
        fonction: "",
        telephone: "",
        password: "",
        password_confirmation: "",
        has_accepted_cgu: "",
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email("Format d'email invalide").required("Votre email est obligatoire"),
        civility: Yup.string().required("Votre civilité est obligatoire"),
        nom: Yup.string().required("Votre nom est obligatoire"),
        prenom: Yup.string().required("Votre prénom est obligatoire"),
        fonction: Yup.string().required("Votre fonction est obligatoire"),
        telephone: Yup.string(),
        password: Yup.string()
          .required("Veuillez saisir un mot de passe")
          .min(passwordMinLength, `Le mot de passe doit contenir au moins ${passwordMinLength} caractères`)
          .minLowercase(1, "Le mot de passe doit contenir au moins une lettre minuscule")
          .minUppercase(1, "Le mot de passe doit contenir au moins une lettre majuscule")
          .minNumbers(1, "Le mot de passe doit contenir au moins un nombre")
          .minSymbols(1, "Le mot de passe doit contenir au moins un caractère spécial"),
        password_confirmation: Yup.string().test((value, context) => {
          return value === context.parent.password
            ? true
            : context.createError({
                message: "Les mots de passe doivent correspondre.",
              });
        }),
        consent_of: isOrganismeFormation ? Yup.boolean().required("Vous devez cocher cette case") : (null as any),
        has_accepted_cgu: Yup.boolean().required("Vous devez cocher cette case"),
      })}
      onSubmit={async (form, actions) => {
        try {
          const { account_status } = await _post("/api/v1/auth/register", {
            user: {
              email: form.email,
              civility: form.civility,
              nom: form.nom,
              prenom: form.prenom,
              fonction: form.fonction,
              telephone: form.telephone,
              password: form.password,
              has_accept_cgu_version: CGU_VERSION,
            },
            organisation,
          });

          if (account_status === "CONFIRMED") {
            toastSuccess("Votre compte a été créé. Vous pouvez désormais vous connecter.");
            await router.push("/auth/connexion");
          } else {
            // PENDING_EMAIL_VALIDATION
            await router.push("/auth/inscription/bravo");
          }
        } catch (err) {
          let errorMessage: string = err?.json?.data?.message || err.message;
          if (errorMessage === "Aucun organisme trouvé") {
            errorMessage = "Ce code UAI n'existe pas. Veuillez vérifier à nouveau";
          }
          actions.setFieldError("uai", errorMessage);
          toastError(err.messages?.message || "Une erreur est survenue. Merci de réessayer plus tard.");
        } finally {
          actions.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form>
          <Field name="email">
            {({ field, meta }) => (
              <FormControl
                minH={100}
                mt={6}
                isRequired
                isInvalid={meta.error && meta.touched}
                isDisabled={fixedEmail !== ""}
              >
                <FormLabel>Votre courriel</FormLabel>
                <Input {...field} id={field.name} placeholder="Ex : jeandupont@mail.com" />
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
          <Field name="civility">
            {({ field, meta }) => (
              <FormControl my={4} isRequired isInvalid={meta.error && meta.touched}>
                <RadioGroup {...field} id={field.name}>
                  <HStack>
                    <Field as={Radio} name="civility" value="Monsieur">
                      Monsieur
                    </Field>
                    <Field as={Radio} name="civility" value="Madame" ml="2.5rem !important">
                      Madame
                    </Field>
                  </HStack>
                </RadioGroup>
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
          <Field name="nom">
            {({ field, meta }) => (
              <FormControl minH={100} isRequired isInvalid={meta.error && meta.touched}>
                <FormLabel>Votre nom</FormLabel>
                <Input {...field} id={field.name} placeholder="Ex : Dupont" />
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
          <Field name="prenom">
            {({ field, meta }) => (
              <FormControl minH={100} isRequired isInvalid={meta.error && meta.touched}>
                <FormLabel>Votre prénom</FormLabel>
                <Input {...field} id={field.name} placeholder="Ex : Jean" />
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
          <Field name="fonction">
            {({ field, meta }) => (
              <FormControl minH={100} isRequired isInvalid={meta.error && meta.touched}>
                <FormLabel>Votre fonction au sein de l{"'"}établissement</FormLabel>
                <Input {...field} id={field.name} placeholder="Ex : Responsable administratif" />
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
          <Field name="telephone">
            {({ field, meta }) => (
              <FormControl minH={100} isInvalid={meta.error && meta.touched}>
                <FormLabel>Téléphone</FormLabel>
                <Input {...field} id={field.name} placeholder="Ex : 06 89 10 11 12" />
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
          <Field name="password">
            {({ field, meta }) => (
              <FormControl minH={100} isRequired isInvalid={meta.error && meta.touched}>
                <FormLabel>Mot de passe</FormLabel>
                <InputGroup size="md">
                  <Input
                    {...field}
                    id={field.name}
                    type={showPasswordCharacters ? "text" : "password"}
                    placeholder="Choisissez votre mot de passe"
                  />

                  <InputRightElement width="2.5rem">
                    <ShowPassword
                      boxSize={4}
                      onClick={() => setShowPasswordCharacters(!showPasswordCharacters)}
                      cursor="pointer"
                    />
                  </InputRightElement>
                </InputGroup>
                <PasswordConditions password={field.value} />
              </FormControl>
            )}
          </Field>
          <Field name="password_confirmation">
            {({ field, meta }) => (
              <FormControl minH={100} isRequired isInvalid={meta.error && meta.touched}>
                <FormLabel>Confirmation du mot de passe</FormLabel>
                <Input {...field} id={field.name} type="password" placeholder="Confirmez votre mot de passe" />
                <FormErrorMessage>{field.value && meta.error}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
          <Field name="has_accepted_cgu">
            {({ field, meta }) => (
              <FormControl mb={6} isRequired isInvalid={meta.error && meta.touched}>
                <Checkbox {...field} id={field.name} icon={<Check />}>
                  J{"'"}atteste avoir lu et accepté les{" "}
                  <a href="/cgu" target="_blank" rel="noreferrer">
                    conditions générales d{"'"}utilisation
                    <ExternalLinkIcon ml={2} />
                  </a>
                </Checkbox>
                <FormErrorMessage>{meta.error}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
          {isOrganismeFormation && (
            <Field name="consent_of">
              {({ field, meta }) => (
                <FormControl mb={6} isRequired isInvalid={meta.error && meta.touched}>
                  <Checkbox {...field} id={field.name} icon={<Check />}>
                    J{"'"}accepte d{"'"}être contacté par un opérateur public (DREETS, Académie, …). Mon email
                    apparaîtra dans le profil dans mon organisme.
                  </Checkbox>
                  <FormErrorMessage>{meta.error}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          )}
          <HStack gap="24px" mt={5}>
            <Button onClick={() => router.back()} color="bluefrance" variant="secondary">
              Revenir
            </Button>

            <Button
              size="md"
              type="submit"
              variant="primary"
              px={6}
              isLoading={form.isSubmitting}
              // isDisabled={form.touched && (!form.isValid || form.isSubmitting)}
            >
              S&rsquo;inscrire
            </Button>
          </HStack>
        </Form>
      )}
    </Formik>
  );
}

const passwordChecks = [
  {
    schema: Yup.string().min(12), // FIXME a-t-on vraiment besoin des 20c pour un admin ?...
    label: (
      <>
        Le mot de passe doit contenir <strong>au moins {12} caractères</strong>
      </>
    ),
  },
  {
    schema: Yup.string().matches(/[a-z]/),
    label: (
      <>
        Le mot de passe doit contenir <strong>au moins une lettre minuscule</strong>
      </>
    ),
  },
  {
    schema: Yup.string().matches(/[A-Z]/),
    label: (
      <>
        Le mot de passe doit contenir <strong>au moins une lettre majuscule</strong>
      </>
    ),
  },
  {
    schema: Yup.string().matches(/[^\w\d\s:]/),
    label: (
      <>
        Le mot de passe doit contenir <strong>au moins un caractère spécial</strong>
      </>
    ),
  },
  {
    schema: Yup.string().matches(/[0-9]/),
    label: (
      <>
        Le mot de passe doit contenir <strong>au moins un chiffre</strong>
      </>
    ),
  },
];

function PasswordConditions({ password }: { password: string }) {
  const conditions = passwordChecks.map((check) => ({
    ...check,
    valid: check.schema.isValidSync(password),
  }));

  return (
    <>
      <List mb={5} fontSize="zeta">
        {conditions.map((condition, i) => (
          <ListItem color={condition.valid ? "success" : "default"} my={3} key={i}>
            <ListIcon
              aria-hidden={true}
              as={CheckIcon}
              color="success"
              visibility={condition.valid ? "visible" : "hidden"}
            />
            {condition.label}
          </ListItem>
        ))}
      </List>
    </>
  );
}
