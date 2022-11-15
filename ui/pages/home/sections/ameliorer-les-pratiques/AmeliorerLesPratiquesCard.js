import { Box, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";

const AmeliorerLesPratiquesCard = ({ Logo, content }) => (
  <Box background="white" width="16%" padding="4w" border="1px solid" borderColor="#DDDDDD">
    <Logo width="80px" height="80px" marginX="auto" display="block" />
    <Text marginTop="2w" color="#161616" fontWeight="700" textAlign="center">
      {content}
    </Text>
  </Box>
);

AmeliorerLesPratiquesCard.propTypes = {
  Logo: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
};
export default AmeliorerLesPratiquesCard;
