import { Box, Button, useDisclosure } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import DataFeedbackModal from "./DataFeedbackModal";

const DataFeedbackSection = ({ uai }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button variant="link" onClick={onOpen}>
        <Box as="i" className="ri-arrow-right-line" marginRight="1v" paddingTop="1px" />
        Signaler une anomalie
      </Button>
      <DataFeedbackModal isOpen={isOpen} onClose={onClose} uai={uai} />
    </>
  );
};

DataFeedbackSection.propTypes = {
  uai: PropTypes.string.isRequired,
};

export default DataFeedbackSection;
