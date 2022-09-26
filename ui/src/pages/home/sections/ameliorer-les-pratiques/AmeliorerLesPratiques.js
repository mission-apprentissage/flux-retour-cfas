import { Box, Button, Flex, Heading, HStack, Link, Text } from "@chakra-ui/react";

import { Section } from "../../../../common/components";
import { CONTACT_ADDRESS, PRODUCT_NAME } from "../../../../common/constants/product";
import {
  Academies,
  CarifOref,
  Citation,
  ConseilsRegionaux,
  DreetsDraaf,
  ReseauxCfa,
  School,
} from "../../../../theme/components/icons";
import AmeliorerLesPratiquesCard from "./AmeliorerLesPratiquesCard";
import AmeliorerLesPratiquesCitation from "./AmeliorerLesPratiquesCitation";

const AmeliorerLesPratiques = () => (
  <Section paddingY="4w" color="grey.800" background="galt">
    <Heading as="h1" fontSize="alpha">
      Améliorer les pratiques grâce aux données
    </Heading>
    <Text fontSize="gamma" color="grey.800" marginTop="4w">
      Différentes institutions consultent le Tableau de bord de l&apos;apprentissage quotidiennement pour suivre
      l&apos;évolution des effectifs.
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
    <HStack spacing="4w" marginTop="8w" color="#161616" borderColor="#E5E5E5">
      <AmeliorerLesPratiquesCitation
        Logo={Citation}
        citation={
          <>
            « Grâce à la mensualisation des données sur le Tableau de bord, j&apos;ai pu objectiver et vérifier la
            situation du CFA sur plusieurs mois. »
          </>
        }
        auteur={<>Conseil Régional de Normandie</>}
      />
      <AmeliorerLesPratiquesCitation
        Logo={Citation}
        citation={
          <>
            « Il faut absolument que l’outil se développe et soit pérenne. C’est notre seule source de données
            aujourd’hui. »
          </>
        }
        auteur={<>DREETS Centre Val-de-Loire</>}
      />
    </HStack>
    <Box border="1px solid" borderColor="bluefrance" marginTop="10w" width="75%" mx="auto" display="block">
      <Flex padding="4w" alignItems="center" flexDirection="column">
        <Heading as="h2" fontWeight="400" fontSize="20px">
          Vous souhaitez contribuer à l’évolution du {PRODUCT_NAME} ?
        </Heading>
        <Text marginTop="2w">
          Reccueillir vos habitudes nous permet de construire un outil au plus près de vos besoins.
        </Text>
        <Link href={`mailto:${CONTACT_ADDRESS}`}>
          <Button marginTop="4w" variant="primary">
            Nous contacter
          </Button>
        </Link>
      </Flex>
    </Box>
  </Section>
);

export default AmeliorerLesPratiques;
