import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from "@chakra-ui/react";
import React from "react";

import { ArrowRightLine, Close } from "../../theme/components/icons";

const AcknowledgeModal = ({
  isOpen,
  onClose = () => {},
  title,
  children,
  size = "4xl",
  acknowledgeText = "J'ai compris",
  canBeClosed = true,
  onAcknowledgement = () => {},
  bgOverlay = "rgba(0, 0, 0, 0.48)",
}) => {
  return (
    <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size={size}>
      <ModalOverlay background={bgOverlay} />
      <ModalContent background="white" color="primaryText" borderRadius="none">
        {canBeClosed && (
          <Button
            display={"flex"}
            alignSelf={"flex-end"}
            color="bluefrance"
            fontSize={"epsilon"}
            onClick={() => {
              onClose();
            }}
            variant="unstyled"
            paddingTop={10}
            paddingBottom={6}
            paddingRight={10}
            fontWeight={400}
          >
            Fermer{" "}
            <Text as={"span"} marginLeft={2}>
              <Close boxSize={4} />
            </Text>
          </Button>
        )}
        <ModalHeader>
          <ArrowRightLine mt="-0.5rem" />
          <Text as="span" marginLeft="1rem" textStyle={"h4"}>
            {title}
          </Text>
        </ModalHeader>
        <ModalBody paddingBottom={6}>{children}</ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={() => {
              onAcknowledgement();
              onClose();
            }}
            type="submit"
          >
            {acknowledgeText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AcknowledgeModal;
