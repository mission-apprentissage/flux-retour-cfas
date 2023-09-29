import { Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import NavLink from "next/link";

import { PRODUCT_NAME } from "@/common/constants/product";

const DemandeBranchementErpFormErpReadySection = ({ helpFilePath }: { helpFilePath: string }) => {
  return (
    <>
      <Stack marginTop="3w" marginBottom="3w" direction="row">
        <Box borderLeftWidth="5px" borderRadius="0" borderLeftColor="bluefrances.525">
          <Text fontSize="epsilon" marginLeft="4w" color="grey.800">
            <strong>Le {PRODUCT_NAME} est interfacé avec cet ERP.</strong> Vous pouvez l&apos;autoriser à transmettre
            vos données en 2 clics via une fonctionnalité disponible dans l&apos;interface de votre logiciel de gestion.
          </Text>
        </Box>
      </Stack>
      <a target="_blank" rel="noopener noreferrer" href={helpFilePath}>
        <Button rightIcon={<Box as="i" className="ri-external-link-line" />} variant="primary">
          Consulter le pas à pas
        </Button>
      </a>
      <HStack marginTop="10w" spacing="1w">
        <Box as="i" className="ri-arrow-left-line" />
        <NavLink href="/">Retourner à la page d&apos;accueil</NavLink>
      </HStack>
    </>
  );
};

export default DemandeBranchementErpFormErpReadySection;
