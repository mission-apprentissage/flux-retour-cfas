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
  useDisclosure,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";
import React from "react";
import * as Yup from "yup";
import { decodeJwt } from "jose";
import { useRouter } from "next/router";
import NavLink from "next/link";
import useAuth from "../../../hooks/useAuth";
import useToken from "../../../hooks/useToken";
import { _post } from "../../../common/httpClient";
import { AlertRounded, CheckLine, ShowPassword } from "../../../theme/components/icons";
import MotDePasseOublierModal from "./MotDePasseOublierModal";

const Login = (props) => {
  const [, setAuth] = useAuth();
  const [, setToken] = useToken();
  const router = useRouter();
  const forgotPassword = useDisclosure();
  const [step, setStep] = React.useState(0);

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
          router.push("/auth/redirection");
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
                            placeholder="************************"
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
                <MotDePasseOublierModal
                  step={step}
                  setStep={setStep}
                  isOpen={forgotPassword.isOpen}
                  onClose={forgotPassword.onClose}
                  color="grey.600"
                />
                <Box _hover={{ cursor: "pointer" }} color="#666666" onClick={forgotPassword.onOpen} marginLeft="2w">
                  Mot de passe oublié
                </Box>
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
      <HStack fontSize={14} mt="4w">
        <Text>Vous n’avez pas encore de compte ? </Text>
        <Link
          _hover={{ textDecoration: "none", borderBottom: "2px solid" }}
          borderBottom="1px solid"
          borderColor="bluefrance"
          color="bluefrance"
          as={NavLink}
          href="/auth/inscription"
        >
          Crée un compte
        </Link>
      </HStack>
    </Flex>
  );
};

export default Login;
