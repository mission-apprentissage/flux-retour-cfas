import { Box, Heading, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Footer, HeaderPartageSimplifie, Section } from "../../../common/components";
import ContactSectionPartageSimplifie from "../../../common/components/ContactSectionPartageSimplifie/ContactSectionPartageSimplifie.js";
import { NAVIGATION_PAGES_PARTAGE_SIMPLIFIE } from "../../../common/constants/navigationPagesPartageSimplifie.js";
import ModifierMotPasseForm from "./ModifierMotDePasseForm";
import useUpdatePassword, { REQUEST_STATE } from "./useUpdatePassword";

const ModifierMotDePassePage = () => {
  const [updatePassword, updatePasswordSubmitState] = useUpdatePassword();

  return (
    <>
      <HeaderPartageSimplifie />
      <Section background="galt" withShadow paddingY="8w">
        <Heading as="h1" marginBottom="4w">
          {NAVIGATION_PAGES_PARTAGE_SIMPLIFIE.ModifierMotDePasse.title}
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
              Votre nouveau mot de passe a bien été enregistré !
            </Text>
          ) : (
            <ModifierMotPasseForm onSubmit={updatePassword} />
          )}
        </Box>
      </Section>
      <ContactSectionPartageSimplifie />
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
