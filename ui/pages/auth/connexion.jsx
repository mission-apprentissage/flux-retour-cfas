import {
  Flex,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  InputGroup,
  Input,
  InputRightElement,
  Link,
  Text,
  Heading,
  Checkbox,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import React from "react";
import * as Yup from "yup";
import { decodeJwt } from "jose";
import { useRouter } from "next/router";
import NavLink from "next/link";
import Head from "next/head";
import { Page } from "../../components/Page/Page";

import useAuth from "../../hooks/useAuth";
import useToken from "../../hooks/useToken";
import { _post } from "../../common/httpClient";

import { AlertRounded, CheckLine, ShowPassword } from "../../theme/components/icons";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";

const Login = (props) => {
  const [, setAuth] = useAuth();
  const [, setToken] = useToken();
  const router = useRouter();

  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  const login = async (values, { setStatus }) => {
    try {
      const result = await _post("/api/v1/auth/login", values);
      if (result.loggedIn) {
        const user = decodeJwt(result.token);
        setAuth(user);
        setToken(result.token);
        if (!user.account_status === "NOT_CONFIRMED") {
          router.push(`/auth/en-attente-confirmation`);
        } else {
          router.push("/mon-espace/mon-organisme");
        }
      }
    } catch (e) {
      if (e.messages?.message === "Old connection method") {
        setStatus({ error: "Pour des raisons de sécurité, merci de vous créer un compte nominatif" });
      } else {
        setStatus({ error: `Votre identifiant ou votre mot de passe est incorrect` });
      }
    }
  };

  return (
    <Flex {...props}>
      <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
        Connectez-vous
      </Heading>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={Yup.object().shape({
          email: Yup.string().required("Requis"),
          // email: Yup.string().email().required("Requis"), // TODO TMP migration
          password: Yup.string().required("Requis"),
        })}
        onSubmit={login}
      >
        {({ status = {} }) => {
          return (
            <Form>
              <Box>
                <Field name="email">
                  {({ field, meta }) => (
                    <FormControl isRequired isInvalid={meta.error && meta.touched} mb={5}>
                      <FormLabel>Email (votre identifiant)</FormLabel>
                      <Input {...field} id={field.name} placeholder="prenom.nom@courriel.fr" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="password">
                  {({ field, meta }) => {
                    return (
                      <FormControl isRequired isInvalid={meta.error && meta.touched} mb={5}>
                        <FormLabel>Mot de passe</FormLabel>
                        <InputGroup size="md">
                          <Input
                            {...field}
                            id={field.name}
                            type={show ? "text" : "password"}
                            placeholder="Votre mot de passe..."
                          />
                          <InputRightElement width="2.5rem">
                            <ShowPassword boxSize={5} onClick={handleClick} cursor="pointer" />
                          </InputRightElement>
                        </InputGroup>
                        <FormErrorMessage>{meta.error}</FormErrorMessage>
                      </FormControl>
                    );
                  }}
                </Field>
              </Box>
              <Flex>
                <Checkbox icon={<CheckLine />} size="lg" borderRadius="20px" />
                <Text ml="1w">Se souvenir de moi</Text>
              </Flex>
              <HStack spacing="4w" mt={8}>
                <Button variant="primary" type="submit">
                  Connexion
                </Button>
                <Link href="/auth/mot-de-passe-oublie" as={NavLink} color="grey.600">
                  Mot de passe oublié
                </Link>
              </HStack>
              {status.error && (
                <Text color="error" mt={8}>
                  <AlertRounded mb="0.5" /> {status.error}
                </Text>
              )}
            </Form>
          );
        }}
      </Formik>
      <HStack ml="4w" mt="4w">
        <Box p="2" h="5vh" borderLeft="4px solid #6A6AF4"></Box>
        <Box>
          <Text> Vous n’avez pas encore de compte ?</Text>
          <Link
            borderBottom="1px solid"
            _hover={{ borderBottom: "1px solid" }}
            href="/auth/inscription"
            as={NavLink}
            color="bluefrance"
          >
            Créer un compte
          </Link>
        </Box>
      </HStack>
    </Flex>
  );
};

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function ConnexionPage() {
  const styleProps = {
    flexBasis: "50%",
    p: 12,
    justifyContent: "center",
  };

  return (
    <Page>
      <Head>
        <title>Connexion</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HStack spacing="4w" w="full" maxW="xl" mt={4}>
        <Login {...styleProps} flexDirection="column" border="1px solid" borderColor="openbluefrance" />
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
}
