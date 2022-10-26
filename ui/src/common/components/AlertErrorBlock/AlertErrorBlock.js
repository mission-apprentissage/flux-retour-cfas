import { Link, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

import { CONTACT_ADDRESS } from "../../constants/productPartageSimplifie.js";
import AlertBlock from "../AlertBlock/AlertBlock.js";

const AlertErrorBlock = ({ width = "70%" }) => (
  <AlertBlock width={width} marginTop="4w" variant="error">
    <Text>
      <strong>Erreur.</strong>
    </Text>
    <Text>Une erreur s&apos;est produite.</Text>
    <Text>
      Veuillez vous rapprocher du support du Tableau de bord en écrivant à{" "}
      <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance">
        {CONTACT_ADDRESS}
      </Link>
    </Text>
  </AlertBlock>
);

AlertErrorBlock.propTypes = {
  width: PropTypes.string,
};
export default AlertErrorBlock;
