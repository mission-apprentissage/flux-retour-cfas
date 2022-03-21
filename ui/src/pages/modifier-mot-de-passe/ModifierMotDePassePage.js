import { Box, Heading, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Footer, Header, Section } from "../../common/components";
import ContactSection from "../../common/components/ContactSection/ContactSection";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import ModifierMotPasseForm from "./ModifierMotDePasseForm";
import useUpdatePassword, { REQUEST_STATE } from "./useUpdatePassword";

const ModifierMotDePassePage = () => {
  const [updatePassword, updatePasswordSubmitState] = useUpdatePassword();

  return (
    <>
      <Header />
      <Section background="galt" withShadow paddingY="8w">
        <Heading as="h1" marginBottom="4w">
          {NAVIGATION_PAGES.ModifierMotDePasse.title}
        </Heading>
        <Box padding="4w" background="white" borderColor="bluefrance" border="1px solid" maxWidth="480px">
          {updatePasswordSubmitState === REQUEST_STATE.success ? (
            <Text fontSize="beta" fontWeight="700" color="grey.800">
              <Box
                as="i"
                className="ri-checkbox-circle-fill"
                marginRight="1w"
                color="bluefrance"
                verticalAlign="middle"
              />
              Votre nouveau mot de passe a bien été enregistré
            </Text>
          ) : (
            <ModifierMotPasseForm onSubmit={updatePassword} />
          )}
        </Box>
      </Section>
      <ContactSection />
      <Footer />
    </>
  );
};

ModifierMotDePassePage.propTypes = {
  history: PropTypes.shape({
    location: PropTypes.shape({
      search: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default ModifierMotDePassePage;
