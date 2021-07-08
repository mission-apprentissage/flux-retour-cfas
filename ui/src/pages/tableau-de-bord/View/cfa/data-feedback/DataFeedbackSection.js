import { Box, Button, Flex, useDisclosure } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../../common/components";
import DataFeedbackModal from "./DataFeedbackModal";

const DataFeedbackSection = ({ uai }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Section>
      <Flex justifyContent="flex-end">
        <Box as="i" className="ri-arrow-right-line" marginRight="1v" paddingTop="1px" />
        <Button variant="link" onClick={onOpen} verticalAlign="middle">
          Signaler une anomalie
        </Button>
      </Flex>
      <DataFeedbackModal isOpen={isOpen} onClose={onClose} uai={uai} />
    </Section>
  );
};

DataFeedbackSection.propTypes = {
  uai: PropTypes.string.isRequired,
};

export default DataFeedbackSection;
