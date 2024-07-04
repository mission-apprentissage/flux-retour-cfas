import { Container, Heading, VStack } from "@chakra-ui/react";

import SimplePage from "@/components/Page/SimplePage";

function VoeuxAffelnetPage() {
  return (
    <SimplePage title="Mes vœux Affelnet">
      <Container maxW="xl" p="8">
        <VStack alignItems="start" mb={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            Vœux Affelnet 2024
          </Heading>
        </VStack>
      </Container>
    </SimplePage>
  );
}

export default VoeuxAffelnetPage;
