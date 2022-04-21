import { Box, Button, HStack } from "@chakra-ui/react";
import PropTypes from "prop-types";

const AskUniqueURLBackToAskUaiSection = ({ setPreviousFormStep }) => {
  return (
    <HStack>
      <Box as="i" className="ri-arrow-left-line" marginRight="1v" />
      <Button type="button" marginRight="2w" onClick={setPreviousFormStep} color="bluefrance">
        revenir à l’étape précédente
      </Button>
    </HStack>
  );
};
AskUniqueURLBackToAskUaiSection.propTypes = {
  setPreviousFormStep: PropTypes.func.isRequired,
};
export default AskUniqueURLBackToAskUaiSection;
