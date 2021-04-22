import { Box, Center, Flex, Heading, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import queryString from "query-string";
import React from "react";

import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";
import LoginForm from "./LoginForm";

const LoginPage = ({ history }) => {
  const [, setAuth] = useAuth();
  const pathToRedirectTo = queryString.parse(history.location.search)?.redirect || "/";

  const login = async (values, { setStatus }) => {
    try {
      const { access_token } = await _post("/api/login", values);
      setAuth(access_token);
      history.push(pathToRedirectTo);
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
    }
  };

  return (
    <Center background="bluefrance" height="100vh" flexDirection="column">
      <Flex fontSize="beta" fontWeight="700" color="white">
        <Box as="i" className="ri-shield-star-fill" mr="5" />
        <Text>Tableau de bord - Flux Cfas</Text>
      </Flex>
      <Box background="white" borderRadius="2%" width="28rem" mt="4">
        <Heading mt={4} fontFamily="Marianne" fontWeight="700" marginBottom="2w" textAlign="center">
          Connexion
        </Heading>
        <LoginForm onSubmit={login} />
      </Box>
    </Center>
  );
};

LoginPage.propTypes = {
  history: PropTypes.shape({
    location: PropTypes.shape({
      search: PropTypes.string,
    }).isRequired,
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default LoginPage;
