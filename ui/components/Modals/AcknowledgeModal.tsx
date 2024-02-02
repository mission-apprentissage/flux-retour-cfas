import { Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, Text } from "@chakra-ui/react";
import React from "react";

import { ArrowRightLine, Close } from "@/theme/components/icons";

const AcknowledgeModal = ({
  isOpen,
  onClose = () => {
    // do nothing
  },
  title,
  children,
  size = "4xl",
  acknowledgeText = "J'ai compris",
  canBeClosed = true,
  onAcknowledgement,
  bgOverlay = "rgba(0, 0, 0, 0.48)",
}: {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
  size?: any;
  acknowledgeText?: string;
  canBeClosed?: boolean;
  onAcknowledgement?: () => void;
  bgOverlay?: string;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalOverlay bg={bgOverlay} />
      <ModalContent p={6} borderRadius="0">
        {canBeClosed && (
          <Button
            display={"flex"}
            alignSelf={"flex-end"}
            color="bluefrance"
            fontSize={"epsilon"}
            onClick={() => {
              onClose();
            }}
            variant="link"
            fontWeight={400}
            p={0}
            m={4}
          >
            <Text as={"span"}>
              Fermer <Close boxSize={4} />
            </Text>
          </Button>
        )}
        <ModalHeader>
          <ArrowRightLine mt="-0.5rem" />
          <Text as="span" ml="1rem" textStyle={"h4"}>
            {title}
          </Text>
        </ModalHeader>
        <ModalBody pb={6}>{children}</ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={() => {
              onAcknowledgement?.();
              onClose?.();
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
