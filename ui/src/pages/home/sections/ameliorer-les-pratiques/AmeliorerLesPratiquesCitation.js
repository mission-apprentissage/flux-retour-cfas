import { Box, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

const AmeliorerLesPratiquesCitation = ({ Logo, citation, auteur }) => (
  <Box width="50%" borderLeft="1px solid" borderColor="#E5E5E5">
    <Box marginLeft="4w" fontWeight="bold">
      <Logo />
      <Text fontSize="gamma">{citation}</Text>
      <Text color="#3A3A3A" marginTop="2w">
        {auteur}
      </Text>
    </Box>
  </Box>
);

AmeliorerLesPratiquesCitation.propTypes = {
  Logo: PropTypes.string.isRequired,
  citation: PropTypes.string.isRequired,
  auteur: PropTypes.string.isRequired,
};

export default AmeliorerLesPratiquesCitation;
