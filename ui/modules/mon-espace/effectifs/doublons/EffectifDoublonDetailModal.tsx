import { Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, Text } from "@chakra-ui/react";
import React from "react";

import { Close } from "@/theme/components/icons";

const EffectifDoublonDetailModal = ({
  isOpen,
  onClose = () => {},
  currentApprenantNomPrenom,
  currentEffectifId,
  bgOverlay = "rgba(0, 0, 0, 0.48)",
}: {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
  currentApprenantNomPrenom: string;
  currentEffectifId: string;
  canBeClosed?: boolean;
  bgOverlay?: string;
}) => {
  return (
    <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size={"5xl"}>
      <ModalOverlay bg={bgOverlay} />
      <ModalContent bg="white" color="primaryText" borderRadius="none">
        <Button
          display={"flex"}
          alignSelf={"flex-end"}
          color="bluefrance"
          fontSize={"epsilon"}
          onClick={() => {
            onClose?.();
          }}
          variant="unstyled"
          pt={10}
          pb={6}
          pr={10}
          fontWeight={400}
        >
          Fermer{" "}
          <Text as={"span"} ml={2}>
            <Close boxSize={4} />
          </Text>
        </Button>
        <ModalHeader>
          <Text>
            <b>{`${currentApprenantNomPrenom}`}</b>
          </Text>
          <Text>
            <i>{`${currentEffectifId}`}</i>
          </Text>
        </ModalHeader>
        <ModalBody pb={6}>{currentEffectifId}</ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={() => {
              onClose?.();
            }}
            type="submit"
          >
            Supprimer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EffectifDoublonDetailModal;
