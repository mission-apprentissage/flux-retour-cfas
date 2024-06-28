import { Container, Text, Link } from "@chakra-ui/react";
import React from "react";

import SimplePage from "./SimplePage";

const CenteredUnauthorizedPage = () => {
  return (
    <SimplePage>
      <Container maxW="xl" p="8" textAlign="center">
        <Text mb={16}>Vous ne disposez pas des droits nécessaires pour visualiser cette page.</Text>
        <Link href="/" variant="blueBg">
          Retour à l&apos;accueil
        </Link>
      </Container>
    </SimplePage>
  );
};

export default CenteredUnauthorizedPage;
