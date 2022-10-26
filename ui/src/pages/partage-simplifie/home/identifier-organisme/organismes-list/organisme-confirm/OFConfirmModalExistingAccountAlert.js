import { Link, Text } from "@chakra-ui/react";
import React from "react";

import AlertBlock from "../../../../../../common/components/AlertBlock/AlertBlock.js";
import { CONTACT_ADDRESS } from "../../../../../../common/constants/productPartageSimplifie.js";

const OFConfirmModalExistingAccountAlert = () => {
  return (
    <AlertBlock marginTop="4w" variant="error">
      <Text fontSize="gamma">
        <strong>Il semble que cet établissement soit déjà associé à un compte.</strong>
      </Text>
      <Text marginTop="1w" fontSize="delta">
        Votre compte ne peut pas encore être créé.
      </Text>
      <Text marginTop="4w" fontSize="delta">
        Veuillez vous rapprocher du support du Tableau de bord en écrivant à{" "}
        <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance">
          {CONTACT_ADDRESS}
        </Link>
      </Text>
    </AlertBlock>
  );
};

export default OFConfirmModalExistingAccountAlert;
