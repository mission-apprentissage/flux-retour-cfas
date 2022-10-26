import { Box, Link } from "@chakra-ui/react";

import { NAVIGATION_PAGES } from "../../constants/navigationPages.js";

const RetourHomePageLink = () => (
  <Link href={NAVIGATION_PAGES.Accueil.path} color="bluefrance">
    <Box as="i" className="ri-arrow-left-line" marginRight="1w" verticalAlign="middle" />
    <Box as="span">Retour à l&apos;étape précédente</Box>
  </Link>
);

export default RetourHomePageLink;
