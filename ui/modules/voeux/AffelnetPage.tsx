import { Text, Container, HStack, Heading, VStack, List, ListItem } from "@chakra-ui/react";

import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";

function VoeuxAffelnetPage() {
  return (
    <SimplePage title="Mes vœux Affelnet">
      <Container maxW="xl" p="8">
        <VStack alignItems="start" mb={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            Vœux Affelnet 2024
          </Heading>
        </VStack>
        <HStack spacing={8}>
          <VStack alignItems="start" w="100%">
            <Text>
              Retrouvez ci-dessous les <strong>124 000</strong> vœux formulés en 2024 via la plateforme Affelnet (offre
              post-3ème).
            </Text>
            <Text as="i">
              Source :{" "}
              <Link
                variant="link"
                display="inline-flex"
                href="https://affectation3e.phm.education.gouv.fr/pna-public/"
                isExternal
              >
                Affelnet
              </Link>
            </Text>
          </VStack>
        </HStack>
        <Ribbons title="Vœux Affelnet" variant="info" mt={8}>
          <Text color="black">La mise à disposition de ces chiffres vous permet de :</Text>
          <List my={3} style={{ color: "black", listStyleType: "disc", paddingLeft: "1.5rem" }}>
            <ListItem>
              Quantifier, dans votre territoire, le taux d’insertion en apprentissage à partir du collège/lycée.
            </ListItem>
            <ListItem>
              Visualiser le nombre de jeunes n’ayant pas concrétisé leurs vœux en apprentissage (refusés dans tous les
              CFA pour lesquels ils ont candidaté).
            </ListItem>
            <ListItem>Pouvoir contacter ces jeunes.</ListItem>
          </List>
        </Ribbons>
      </Container>
    </SimplePage>
  );
}

export default VoeuxAffelnetPage;
