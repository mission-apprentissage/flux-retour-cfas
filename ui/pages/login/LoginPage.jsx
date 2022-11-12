import { Heading, HStack, Text } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, Page, Section } from "../../common/components";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import useLogin from "../../common/hooks/useLogin";
import LoginBlock from "./LoginBlock";

const LoginPage = () => {
  const [login] = useLogin();

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

export default LoginPage;
