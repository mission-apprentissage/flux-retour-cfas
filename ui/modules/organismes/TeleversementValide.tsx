import {
  Box,
  Button,
  Container,
  Text,
  Flex,
  Heading,
  UnorderedList,
  ListItem,
  HStack,
  Image,
  Link,
} from "@chakra-ui/react";

import { _post } from "@/common/httpClient";
import SimplePage from "@/components/Page/SimplePage";
import { ValidateIcon, Warning } from "@/theme/components/icons";

export default function TeleversementValide({ organismeId, isMine }: { organismeId: string; isMine: boolean }) {
  return (
    <SimplePage title="Import des effectifs">
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          Import des effectifs
        </Heading>
        <Box p="32px" mb="32px" border="1px solid #EEE">
          <Box></Box>
          <Box color="#18753C">
            <HStack mb="12px">
              <ValidateIcon boxSize={7} />
              <Box>
                <Text fontSize="24px" fontWeight="700">
                  Votre fichier a été accepté : consultez le rapport de transmission.
                </Text>
              </Box>
            </HStack>
            <HStack mb="12px">
              <Warning boxSize={5} color="#B34000" />
              <Box color="#B34000" fontSize="16px" fontWeight="400" lineHeight="24px">
                <Text>
                  <Text as="span" fontWeight="bold">
                    Attention :{" "}
                  </Text>
                  le contrôle a été réalisé sur le format des données de votre fichier, mais pas sur l’exactitude du
                  contenu.
                </Text>
                <Text>
                  Veuillez consulter le{" "}
                  <Link href="/transmissions" textDecoration={"underline"}>
                    rapport de transmission
                  </Link>{" "}
                  pour identifier et réparer les erreurs potentielles.
                </Text>
              </Box>
            </HStack>
          </Box>
          <Box>
            {" "}
            Vos effectifs sont en attente d&apos;affichage sur votre espace et seront disponibles dans quelques minutes,
            le temps que le traitement soit effectué.
          </Box>
          <Box>
            <Text as="span" fontWeight="bold">
              Information :{" "}
            </Text>
            Transmettez vos effectifs au tableau de bord une fois par mois, de préférence entre le 1 et le 5 du mois.
            Cela permet de garantir la fraîcheur des données. Pour chaque nouveau téléversement, vos données seront
            mises à jour ou complétées.
          </Box>
        </Box>
        <Flex justifyContent="flex-end" gap="24px">
          <Button variant="secondary" as="a" href="/transmissions">
            Voir le rapport de transmission
          </Button>
          <Button variant="primary" as="a" href={isMine ? "/effectifs" : `/organismes/${organismeId}/effectifs`}>
            Voir mes effectifs
          </Button>
        </Flex>
        <HStack justifyContent="space-between" alignItems="start" p={10} bg="#F5F5FE" my={8}>
          <Box>
            <Text color="#161616" fontSize="22px" fontWeight="700" mb="12px">
              Pourquoi consulter vos effectifs ?
            </Text>
            <Text fontSize="16px" fontWeight="400" mb="12px">
              Sur la page “Mes effectifs”, vous avez la possibilité de :{" "}
            </Text>
            <UnorderedList pl="3px">
              <ListItem>
                voir si tous vos effectifs en apprentissage ont bien été pris en compte et s’affichent
              </ListItem>
              <ListItem>comprendre d’éventuelles erreurs et de les corriger</ListItem>
              <ListItem>téléverser un nouveau fichier mis à jour</ListItem>
            </UnorderedList>
          </Box>
          <Box>
            <Image src="/images/televersement-manuel-success.svg" alt="" userSelect="none" />
          </Box>
        </HStack>
      </Container>
    </SimplePage>
  );
}
