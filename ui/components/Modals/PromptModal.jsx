import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import React from "react";

import { ArrowRightLine, Close } from "../../theme/components/icons";

const PromptModal = ({
  isOpen,
  onClose = () => {},
  title,
  children,
  size = "4xl",
  okText = "Oui",
  koText = "Non",
  onOk = () => {},
  onKo = () => {},
  canBeClosed = true,
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
