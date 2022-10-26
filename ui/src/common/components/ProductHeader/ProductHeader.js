import { Box, Flex, Heading, Link, Text } from "@chakra-ui/react";

import { FranceLocalization } from "../../../theme/components/icons/FranceLocalization.js";
import { CONTACT_ADDRESS, PRODUCT_FULL_NAME, PRODUCT_NAME, TDB_URL } from "../../constants/productPartageSimplifie.js";
import Highlight from "../Highlight/Highlight.js";

const ProductHeader = () => {
  return (
    <>
      <Flex>
        <Box flex="1">
          <Heading as="h1" fontSize="40px" marginTop="3w">
            Bienvenue sur {PRODUCT_NAME}, <br />
            l’outil de partage de vos effectifs.
          </Heading>
        </Box>
        <Box>
          <FranceLocalization width="152px" height="152px" />
        </Box>
      </Flex>
      <Box>
        <Text fontSize="gamma" marginTop="4w">
          Votre organisme de formation ne peut pas encore transmettre automatiquement vos données via l’API du Tableau
          de bord de l’apprentissage ? <strong>{PRODUCT_FULL_NAME}</strong> est une plateforme développée pour vous
          permettre de partager vos données très rapidement. Laissez-vous guider...
        </Text>
      </Box>
      <Highlight marginTop="4w">
        {PRODUCT_NAME} est un nouveau service du{" "}
        <Link target="_blank" rel="noopener noreferrer" href={TDB_URL} textDecoration="underline" fontWeight="500">
          Tableau de bord
        </Link>{" "}
        en cours de <br /> développement. Pour faire évoluer ce service, aidez-nous à l’améliorer en <br /> nous
        contactant à{" "}
        <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance">
          {CONTACT_ADDRESS}
        </Link>
      </Highlight>
    </>
  );
};

export default ProductHeader;
