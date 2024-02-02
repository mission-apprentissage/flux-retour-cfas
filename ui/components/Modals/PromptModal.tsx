import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Text,
  HStack,
} from "@chakra-ui/react";
import React from "react";

import { ArrowRightLine, Close } from "@/theme/components/icons";

const PromptModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "4xl",
  okText = "Oui",
  koText = "Non",
  onOk,
  onKo,
  canBeClosed = true,
  bgOverlay = "rgba(0, 0, 0, 0.48)",
}: {
  isOpen?: any;
  onClose?: any;
  title?: any;
  children?: any;
  size?: any;
  okText?: any;
  koText?: any;
  onOk?: any;
  onKo?: any;
  canBeClosed?: any;
  bgOverlay?: any;
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
          <HStack spacing={4}>
            <Button
              variant="secondary"
              onClick={() => {
                onKo();
                onClose();
              }}
              type="submit"
            >
              {koText}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onOk();
                onClose();
              }}
              type="submit"
            >
              {okText}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PromptModal;
