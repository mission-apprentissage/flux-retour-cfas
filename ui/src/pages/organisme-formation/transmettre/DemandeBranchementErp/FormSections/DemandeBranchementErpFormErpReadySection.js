import { Box, Button, HStack, Link, Stack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";

import { PRODUCT_NAME } from "../../../../../common/constants/product";

const DemandeBranchementErpFormErpReadySection = ({ helpFilePath }) => {
  return (
    <>
      <Stack marginTop="3w" marginBottom="3w" direction="row">
        <Box borderLeftWidth="5px" borderRadius="0" borderLeftColor="#6A6AF4">
          <Text fontSize="epsilon" marginLeft="4w" color="grey.800">
            <strong>Le {PRODUCT_NAME} est interfacé avec cet ERP.</strong> Vous pouvez l&apos;autoriser à transmettre
            vos données en 2 clics via une fonctionnalité disponible dans l&apos;interface de votre logiciel de gestion.
          </Text>
        </Box>
      </Stack>
      <Link target="_blank" href={helpFilePath}>
        <Button leftIcon={<Box as="i" className="ri-download-line" />} variant="primary">
          Télécharger le pas à pas
        </Button>
      </Link>
      <HStack marginTop="10w" spacing="1w">
        <Box as="i" className="ri-arrow-left-line"></Box>
        <NavLink to="/">Retourner à la page d&apos;accueil</NavLink>
      </HStack>
    </>
  );
};

DemandeBranchementErpFormErpReadySection.propTypes = {
  helpFilePath: PropTypes.string.isRequired,
};
export default DemandeBranchementErpFormErpReadySection;
