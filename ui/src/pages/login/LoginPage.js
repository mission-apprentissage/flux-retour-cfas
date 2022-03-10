import { Heading, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import queryString from "query-string";
import React from "react";

import { BreadcrumbNav, Footer, Header, Section } from "../../common/components";
import { navigationPages } from "../../common/constants/navigationPages";
import { productName } from "../../common/constants/productName";
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
    <>
      <Header />
      <Section background="galt" withShadow paddingY="3w">
        <BreadcrumbNav links={[navigationPages.Accueil, navigationPages.Login]} />
        <HStack justifyContent="space-between" spacing="8w" marginTop="5w" alignItems="flex-start">
          <div>
            <Heading as="h1">{navigationPages.Login.title}</Heading>
            <Text color="grey.800" fontWeight="700" fontSize="gamma" marginTop="2w">
              Vous êtes une institution ou une organisation professionnelle, connectez-vous au {productName} pour
              consulter les effectifs sur votre territoire.
            </Text>
          </div>
          <LoginBlock onSubmit={login} />
        </HStack>
      </Section>
      <Footer />
    </>
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
