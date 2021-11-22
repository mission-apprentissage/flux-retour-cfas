import { Heading } from "@chakra-ui/layout";
import PropTypes from "prop-types";

import { Highlight } from "../../../../common/components";

const InfosReseauSection = ({ reseau }) => {
  return (
    <Highlight>
      <Heading color="white" fontSize="gamma" marginTop="1w">
        Réseau {reseau}
      </Heading>
    </Highlight>
  );
};

InfosReseauSection.propTypes = {
  reseau: PropTypes.string.isRequired,
};

export default InfosReseauSection;
