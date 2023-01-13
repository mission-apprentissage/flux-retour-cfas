import { Box, Flex, HStack, Input, List, ListIcon, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import Head from "next/head";
import { useState } from "react";
import { Page } from "../../components";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import useAuth from "../../hooks/useAuth";
import useToken from "../../hooks/useToken";
import { useRouter } from "next/router";
import { useFormik } from "formik";
import * as Yup from "yup";
import YupPassword from "yup-password";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";
YupPassword(Yup); // extend yup

const CreationMotDePasse = () => {
  const [auth, setAuth] = useAuth();

  const [conditions, setConditions] = useState({
    min: "unknown",
    lowerCase: "unknown",
    upperCase: "unknown",
    special: "unknown",
    number: "unknown",
  });

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
  const minLength = 12;

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
        // const result = await _post("/api/v1/password/reset-password", {
        //   newPassword: newPassword.trim(),
        //   passwordToken,
        // });
        // if (result.loggedIn) {
        //   const user = decodeJwt(result.token);
        //   setAuth(user);
        //   setToken(result.token);
        //   router.push("/mon-espace/mon-organisme");
        // }
      } catch (e) {
        console.error(e);
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
  const title = "Création mot de passe";
  return (
    <Page>
      <Head>
        <title>Création mot de passe</title>
      </Head>
      <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title }]} />
      <HStack spacing="8w" mt={4} mb="10">
        <Flex p="10" w="60rem" flexDirection="column" border="1px solid" borderColor="openbluefrance">
          <form onSubmit={handleSubmit}>
            <Text fontWeight="bold" fontSize="28px">
              Veuillez créer votre mot de passe
            </Text>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              onChange={onChange}
              value={values.newPassword.trim()}
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
          </form>
        </Flex>
        <Box alignSelf="start">
          <Text fontWeight={700} fontSize={22}>
            Votre compte dédié
          </Text>
          <Text mt="2w" fontWeight={700}>
            Le service tableau de bord de l&apos;apprentissage est porté par la Mission interministérielle pour
            l’apprentissage.
          </Text>
          <Text mt="2w">Il permet de :</Text>
          <UnorderedList ml="4w" mt="2w">
            <ListItem>Faciliter le pilotage des politiques publiques</ListItem>
            <ListItem>
              Accompagner les jeunes en situation de décrochage (et donc d&apos;influencer leur.s parcours scolaires et
              professionnels)
            </ListItem>
            <ListItem>Simplifier les déclarations des organismes de formation auprès des pouvoirs publics</ListItem>
          </UnorderedList>
        </Box>
      </HStack>
    </Page>
  );
};

export default CreationMotDePasse;
