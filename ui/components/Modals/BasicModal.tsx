import {
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Link,
  Text,
  ModalProps,
  Image,
} from "@chakra-ui/react";
import React, { ReactNode, ReactElement } from "react";

import { Close, ArrowRightLine } from "@/theme/components/icons";

interface BasicModalProps extends Omit<ModalProps, "children" | "isOpen" | "onClose"> {
  triggerType: "button" | "link";
  button: ReactNode | string;
  children: ReactNode;
  title?: string;
  handleClose?: any;
}

export function BasicModal({ triggerType, button, children, title, handleClose, ...modalProps }: BasicModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const customClose = () => {
    onClose();
    handleClose?.();
  };

  const renderTrigger = () => {
    if (typeof button === "string") {
      if (triggerType === "link") {
        return (
          <Link onClick={onOpen} display="inline-flex" textDecoration="underline">
            <Image src="/images/magnifyingPlus.svg" alt={title} mr={1} />
            {button}
          </Link>
        );
      }
      return <Button onClick={onOpen}>{button}</Button>;
    }

    if (React.isValidElement(button)) {
      return React.cloneElement(button as ReactElement<any>, { onClick: onOpen });
    }
    return null;
  };

  return (
    <>
      {renderTrigger()}

      <Modal isOpen={isOpen} onClose={customClose} {...modalProps}>
        <ModalOverlay />
        <ModalContent p={6} borderRadius="0">
          <Button
            display={"flex"}
            alignSelf={"flex-end"}
            color="bluefrance"
            fontSize={"epsilon"}
            onClick={() => {
              customClose();
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
          <ModalHeader>
            <ArrowRightLine mt="-0.5rem" />
            <Text as="span" ml="1rem" textStyle={"h4"}>
              {title || "Modal Title"}
            </Text>
          </ModalHeader>
          <ModalBody pb={6}>{children}</ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
