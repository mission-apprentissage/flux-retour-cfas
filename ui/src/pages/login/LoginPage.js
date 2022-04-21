import { Heading, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import queryString from "query-string";
import React from "react";

import { BreadcrumbNav, Page, Section } from "../../common/components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import useAuth from "../../common/hooks/useAuth";
import { _post } from "../../common/httpClient";
import LoginBlock from "./LoginBlock";

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
    <Page>
      <Section withShadow background="galt" paddingY="3w">
        <BreadcrumbNav links={[NAVIGATION_PAGES.Accueil, NAVIGATION_PAGES.Login]} />
        <HStack justifyContent="space-between" spacing="8w" marginTop="5w" alignItems="flex-start">
          <div>
            <Heading as="h1" fontSize="alpha">
              Vous êtes une institution <br /> ou une organisation professionnelle
              <br /> (OPCO, branche, etc.)
            </Heading>
            <Text color="grey.800" fontWeight="700" fontSize="gamma" marginTop="2w">
              Connectez-vous au tableau de bord pour consulter
              <br /> l’intégralité des données sur votre territoire
            </Text>
          </div>
          <LoginBlock onSubmit={login} />
        </HStack>
      </Section>
    </Page>
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
