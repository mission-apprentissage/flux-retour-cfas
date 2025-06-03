import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { IOrganisation } from "shared";
import * as Yup from "yup";
import YupPassword from "yup-password";

import { _post } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import useToaster from "@/hooks/useToaster";
import { ShowPassword } from "@/theme/components/icons";

YupPassword(Yup); // extend yup

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const getPasswordLengthFromRole = (role?: IOrganisation["type"]) => {
  switch (role) {
    case "ADMINISTRATEUR":
      return 20;
    default:
      return 12;
  }
};

const ResetPasswordPage = () => {
  const { toastSuccess } = useToaster();
  const router = useRouter();
  const { passwordToken, role } = router.query;

  const [show, setShow] = React.useState(false);
  const onShowPassword = () => setShow(!show);

  // TODO on pourrait avoir le type d'organisation dans le token pour l'avoir
  // const minLength = auth?.organisation?.type === "ADMINISTRATEUR" ? 20 : 12;
  const minLength = getPasswordLengthFromRole(role as IOrganisation["type"]);

  const [conditions, setConditions] = useState({
    min: "unknown",
    lowerCase: "unknown",
    upperCase: "unknown",
    special: "unknown",
    number: "unknown",
  });
  const [status, setStatus] = useState<{ error: any | null }>({ error: null });

  const variant = {
    success: {
      color: "success",
      icon: CheckIcon,
    },
    error: {
      color: "error",
      icon: CloseIcon,
    },
    unknown: {
      color: "black",
      icon: null,
    },
  };

  const { values, handleSubmit, handleChange } = useFormik({
    initialValues: {
      newPassword: "",
    },
    validationSchema: Yup.object().shape({
      newPassword: Yup.string()
        .required("Veuillez saisir un mot de passe")
        .min(minLength, `Le mot de passe doit contenir au moins ${minLength} caractères`)
        .minLowercase(1, "Le mot de passe doit contenir au moins une lettre minuscule")
        .minUppercase(1, "Le mot de passe doit contenir au moins une lettre majuscule")
        .minNumbers(1, "Le mot de passe doit contenir au moins un nombre")
        .minSymbols(1, "Le mot de passe doit contenir au moins un caractère spécial"),
    }),
    onSubmit: async ({ newPassword }) => {
      try {
        await _post("/api/v1/password/reset-password", {
          passwordToken,
          password: newPassword.trim(),
        });
        toastSuccess("Votre mot de passe a bien été changé. Vous pouvez désormais vous connecter.");
        router.push("/auth/connexion");
      } catch (e) {
        console.error(e);
        setStatus({
          error: (
            <span>
              Le lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre adresse
              mail :
              <br />
              <a href="mailto:tableau-de-bord@apprentissage.beta.gouv.fr" target="_blank" rel="noopener noreferrer">
                tableau-de-bord@apprentissage.beta.gouv.fr
              </a>
            </span>
          ),
        });
      }
    },
  });

  const onChange = async (e) => {
    handleChange(e);
    const val = e.target.value.trim();
    const min = Yup.string().min(minLength, `Le mot de passe doit contenir au moins ${minLength} caractères`);
    const lowerCase = Yup.string().matches(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule");
    const upperCase = Yup.string().matches(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule");
    const number = Yup.string().matches(/[0-9]/, "Le mot de passe doit contenir au moins un nombre");
    const special = Yup.string().matches(/[^\w\d\s:]/, "Le mot de passe doit contenir au moins un caractère spécial");
    setConditions({
      min: (await min.isValid(val)) ? "success" : "error",
      lowerCase: (await lowerCase.isValid(val)) ? "success" : "error",
      upperCase: (await upperCase.isValid(val)) ? "success" : "error",
      number: (await number.isValid(val)) ? "success" : "error",
      special: (await special.isValid(val)) ? "success" : "error",
    });
  };

  return (
    <Flex height="100vh" justifyContent="flex-start" flexDirection="column" p={10}>
      <Box width={"auto"}>
        <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
          Veuillez saisir un nouveau mot de passe
        </Heading>
        <form onSubmit={handleSubmit}>
          <InputGroup size="md">
            <Input
              id="newPassword"
              name="newPassword"
              type={show ? "text" : "password"}
              placeholder="Votre mot de passe..."
              onChange={onChange}
              value={values.newPassword.trim()}
              mb={3}
            />
            <InputRightElement width="2.5rem">
              <ShowPassword boxSize={5} onClick={onShowPassword} cursor="pointer" />
            </InputRightElement>
          </InputGroup>
          <List mb={5}>
            <ListItem color={variant[conditions.min].color}>
              <ListIcon aria-hidden={true} as={variant[conditions.min].icon} color={variant[conditions.min].color} />
              Le mot de passe doit contenir <strong>au moins {minLength} caractères</strong>
            </ListItem>
            <ListItem color={variant[conditions.lowerCase].color}>
              <ListIcon
                aria-hidden={true}
                as={variant[conditions.lowerCase].icon}
                color={variant[conditions.lowerCase].color}
              />
              Le mot de passe doit contenir <strong>au moins une lettre minuscule</strong>
            </ListItem>
            <ListItem color={variant[conditions.upperCase].color}>
              <ListIcon
                aria-hidden={true}
                as={variant[conditions.upperCase].icon}
                color={variant[conditions.upperCase].color}
              />
              Le mot de passe doit contenir <strong>au moins une lettre majuscule</strong>
            </ListItem>
            <ListItem color={variant[conditions.special].color}>
              <ListIcon
                aria-hidden={true}
                as={variant[conditions.special].icon}
                color={variant[conditions.special].color}
              />
              Le mot de passe doit contenir <strong>au moins un caractère spécial</strong>
            </ListItem>
            <ListItem color={variant[conditions.number].color}>
              <ListIcon
                aria-hidden={true}
                as={variant[conditions.number].icon}
                color={variant[conditions.number].color}
              />
              Le mot de passe doit contenir <strong>au moins un chiffre</strong>
            </ListItem>
          </List>
          <Button variant="primary" type="submit" w="full">
            Réinitialiser le mot de passe
          </Button>
          {status.error && (
            <Text color="error" mt={2}>
              {status.error}
            </Text>
          )}
        </form>
      </Box>
    </Flex>
  );
};

export default ResetPasswordPage;
