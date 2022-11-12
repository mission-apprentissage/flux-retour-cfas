import React, { useState } from "react";
import { Box, Button, Flex, Heading, Input, Text, List, ListItem, ListIcon } from "@chakra-ui/react";
import { useFormik } from "formik";
import { useRouter } from "next/router";
import * as Yup from "yup";
import { decodeJwt } from "jose";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";

import useAuth from "../../hooks/useAuth";
import useToken from "../../hooks/useToken";
import { _post } from "../../common/httpClient";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const ResetPasswordPage = () => {
  const [auth, setAuth] = useAuth();
  const [, setToken] = useToken();
  const router = useRouter();
  const { passwordToken } = router.query;

  const minLength = auth.permissions.is_admin ? 20 : 12;

  const [conditions, setConditions] = useState({
    min: "unknown",
    lowerCase: "unknown",
    upperCase: "unknown",
    special: "unknown",
    number: "unknown",
  });
  const [status, setStatus] = useState({ error: null });

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
        .matches(
          `^(?=.*\\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\\w\\d\\s:])([^\\s]){${minLength},}$`,
          `Le mot de passe doit contenir au moins ${minLength} caractères, une lettre en minuscule, une lettre en majuscule, un chiffre et un caractère spécial (les espaces ne sont pas acceptés)`
        ),
    }),
    onSubmit: async (values) => {
      try {
        const result = await _post("/api/v1/password/reset-password", { ...values, passwordToken });
        if (result.loggedIn) {
          const user = decodeJwt(result.token);
          setAuth(user);
          setToken(result.token);
          router.push("/");
        }
      } catch (e) {
        console.error(e);
        setStatus({
          error: (
            <span>
              Le lien est expiré ou invalide, merci de prendre contact avec un administrateur en précisant votre adresse
              mail :
              <br />
              <a href="mailto:support-contrat@apprentissage.beta.gouv.fr">support-contrat@apprentissage.beta.gouv.fr</a>
            </span>
          ),
        });
      }
    },
  });

  const onChange = async (e) => {
    handleChange(e);
    const val = e.target.value;
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
    <Flex height="100vh" justifyContent="center" mt="10">
      <Box width={["auto", "40rem"]}>
        <Heading fontFamily="Marianne" fontWeight="700" marginBottom="2w">
          Une mise à jour de votre mot de passe est obligatoire
        </Heading>
        <form onSubmit={handleSubmit}>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="Votre nouveau mot de passe..."
            onChange={onChange}
            value={values.newPassword}
            mb={3}
          />
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
          <Button variant="primary" type="submit">
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
