import { Box, Button, Flex, Heading, HStack, Link, Text } from "@chakra-ui/react";

import { Section } from "../../../../common/components";
import { CONTACT_ADDRESS, PRODUCT_NAME } from "../../../../common/constants/product";
import {
  Academies,
  CarifOref,
  ConseilsRegionaux,
  DreetsDraaf,
  ReseauxCfa,
  School,
} from "../../../../theme/components/icons";
import AmeliorerLesPratiquesCard from "./AmeliorerLesPratiquesCard";

const AmeliorerLesPratiques = () => (
  <Section paddingY="4w" color="grey.800" background="galt">
    <Heading as="h1" fontSize="alpha">
      A qui sert le tableau de bord ?
    </Heading>
    <Text fontSize="gamma" color="grey.800" marginTop="4w">
      Différents acteurs consultent le tableau de bord de l’apprentissage quotidiennement pour suivre l’évolution des
      effectifs
    </Text>
    <HStack marginTop="4w" spacing="4w">
      <AmeliorerLesPratiquesCard Logo={School} content={<>Administrations centrales</>} />
      <AmeliorerLesPratiquesCard Logo={ReseauxCfa} content={<>Réseaux de CFA</>} />
      <AmeliorerLesPratiquesCard Logo={ConseilsRegionaux} content={<>Conseils régionaux</>} />
      <AmeliorerLesPratiquesCard
        Logo={DreetsDraaf}
        content={
          <>
            DREETS <br />& DRAAF
          </>
        }
      />
      <AmeliorerLesPratiquesCard Logo={Academies} content={<>Académies</>} />
      <AmeliorerLesPratiquesCard Logo={CarifOref} content={<>Carif-Oref</>} />
    </HStack>
    <Box border="1px solid" borderColor="bluefrance" marginTop="10w" width="75%" mx="auto" display="block">
      <Flex padding="4w" alignItems="center" flexDirection="column">
        <Heading as="h2" fontWeight="400" fontSize="20px">
          Vous souhaitez nous aider à améliorer le {PRODUCT_NAME} ?
        </Heading>
        <Text marginTop="2w">
          Vos contributions nous permettent de faire évoluer le tableau de bord de l’apprentissage au plus près de vos
          besoins.
        </Text>
        <Link href={`mailto:${CONTACT_ADDRESS}`}>
          <Button marginTop="4w" variant="primary">
            Nous contacter
          </Button>
        </Link>
      </Flex>
    </Box>
    <Box marginBottom="2w" />
  </Section>
);

export default AmeliorerLesPratiques;
