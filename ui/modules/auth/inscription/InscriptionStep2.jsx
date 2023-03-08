import React from "react";
import { useFormik } from "formik";
import { useRouter } from "next/router";
import * as Yup from "yup";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Text,
  RadioGroup,
  Radio,
  Heading,
} from "@chakra-ui/react";
import { _post } from "@/common/httpClient";
import Ribbons from "@/components/Ribbons/Ribbons";
import { SIRET_REGEX } from "@/common/domain/siret";
import useToaster from "@/hooks/useToaster";

const InscriptionStep2 = ({ onSucceeded, type, uai, organismesAppartenance, etablissement, ...props }) => {
  const { toastError } = useToaster();
  const router = useRouter();
  const uaiToDisplay = etablissement.uai || uai || undefined;

  const { values, handleChange, handleSubmit, errors, touched, setErrors, isValid, isValidating } = useFormik({
    initialValues: {
      email: "",
      nom: "",
      civility: "",
      prenom: "",
      type,
      organismes_appartenance: organismesAppartenance.toUpperCase(),
      siret: etablissement.siret,
      uai,
    },
    validationSchema: Yup.object().shape({
      type: Yup.string().required("Requis"),
      email: Yup.string().email("Format d'email invalide").required("Votre email est obligatoire"),
      siret: Yup.string()
        .matches(SIRET_REGEX, {
          message: "SIRET invalide",
          excludeEmptyString: true,
        })
        .required("Le siret est obligatoire"),
      uai: Yup.string(),
      organismes_appartenance: Yup.string().required("organismes_appartenance obligatoire"),
      nom: Yup.string().required("Votre nom est obligatoire"),
      civility: Yup.string().required("Votre civilité est obligatoire"),
      prenom: Yup.string().required("Votre prénom est obligatoire"),
    }),
    onSubmit: async (values) => {
      // eslint-disable-next-line no-undef, no-async-promise-executor
      try {
        const result = await _post("/api/v1/auth/register", values);
        if (result.succeeded) {
          onSucceeded();
        }
      } catch (e) {
        if (e.messages?.message === "email already in use") {
          setErrors({ email: "Ce courriel est déjà utilisé." });
        } else {
          console.error(e);
          toastError(e.messages?.message || "Une erreur est survenue. Merci de réessayer plus tard.");
        }
      }
    },
  });

  return (
    <Box {...props} flexDirection="column" p={12}>
      <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
        Créer votre compte
      </Heading>
      <form onSubmit={handleSubmit}>
        <Box>
          <Ribbons variant="success" mt="0.5rem">
            <Box ml={3} color="grey.800">
              <Text fontSize="20px" fontWeight="bold">
                {etablissement.enseigne || etablissement.entreprise_raison_sociale}
              </Text>
              {values.type === "of" && (
                <Text>
                  Uai : {uaiToDisplay} - SIRET : {etablissement.siret} (en activité)
                </Text>
              )}
              {values.type !== "of" && <Text>SIRET : {etablissement.siret} (en activité)</Text>}
            </Box>
          </Ribbons>

          <FormControl mt={4} py={2} isRequired isInvalid={errors.email && touched.email}>
            <FormLabel>Votre courriel</FormLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Exemple : jeandupont@mail.com"
              onChange={handleChange}
              value={values.email}
            />
            {errors.email && touched.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
          </FormControl>
          <FormControl py={2} mt={5} isRequired isInvalid={errors.civility && touched.civility}>
            <RadioGroup value={values.civility}>
              <HStack>
                <Radio
                  type="radio"
                  name="civility"
                  value={"Monsieur"}
                  checked={values.civility !== "Madame"}
                  onChange={handleChange}
                >
                  Monsieur
                </Radio>
                <Radio
                  type="radio"
                  name="civility"
                  value="Madame"
                  checked={values.civility === "Madame"}
                  onChange={handleChange}
                  ml="2.5rem !important"
                >
                  Madame
                </Radio>
              </HStack>
              {errors.civility && touched.civility && <FormErrorMessage>{errors.civility}</FormErrorMessage>}
            </RadioGroup>
          </FormControl>
          <HStack spacing={8}>
            <FormControl py={2} isRequired isInvalid={errors.prenom && touched.prenom}>
              <FormLabel>Votre prénom</FormLabel>
              <Input id="prenom" name="prenom" onChange={handleChange} placeholder="Ex : Jean" value={values.prenom} />
              {errors.prenom && touched.prenom && <FormErrorMessage>{errors.prenom}</FormErrorMessage>}
            </FormControl>
            <FormControl py={2} isRequired isInvalid={errors.nom && touched.nom}>
              <FormLabel>Votre nom</FormLabel>
              <Input id="nom" name="nom" onChange={handleChange} placeholder="Ex : Dupont" value={values.nom} />
              {errors.nom && touched.nom && <FormErrorMessage>{errors.nom}</FormErrorMessage>}
            </FormControl>
          </HStack>
        </Box>
        <HStack gap="24px" mt={5}>
          <Button
            onClick={() => router.push({ pathname: `/auth/inscription/${organismesAppartenance}`, query: { uai } })}
            color="bluefrance"
            variant="secondary"
          >
            Revenir
          </Button>

          <Button size="md" type="submit" variant="primary" px={6} isDisabled={!isValid || isValidating}>
            S&rsquo;inscrire
          </Button>
        </HStack>
      </form>
    </Box>
  );
};

export default InscriptionStep2;
