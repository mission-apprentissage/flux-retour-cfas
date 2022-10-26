import { Link, Text } from "@chakra-ui/react";

import AlertBlock from "../../../../../common/components/AlertBlock/AlertBlock.js";
import { CONTACT_ADDRESS, TDB_FAQ_URL } from "../../../../../common/constants/productPartageSimplifie.js";

const AlerteUaiNonConnu = () => (
  <AlertBlock width="70%" marginTop="4w" variant="error">
    <Text fontSize="gamma">
      <strong>Vous ne connaissez pas votre code UAI</strong>
    </Text>
    <Text marginTop="1w" fontSize="delta">
      Nous ne sommes pas en mesure de vous permettre d’utiliser Partage simplifié si vous ne connaissez pas votre UAI.{" "}
      <Link target="_blank" rel="noopener noreferrer" href={TDB_FAQ_URL} color="bluefrance">
        Veuillez consulter la FAQ du Tableau de bord.
      </Link>
    </Text>
    <Text marginTop="4w" fontSize="delta">
      Vous pouvez aussi nous contacter via{" "}
      <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance">
        {CONTACT_ADDRESS}
      </Link>
    </Text>
  </AlertBlock>
);

export default AlerteUaiNonConnu;
