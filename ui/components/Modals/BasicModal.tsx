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
  ModalFooter,
} from "@chakra-ui/react";
import React, { ReactNode, ReactElement } from "react";

import { Close, ArrowRightLine } from "@/theme/components/icons";

interface BasicModalProps extends Omit<ModalProps, "children" | "isOpen" | "onClose"> {
  triggerType?: "button" | "link";
  button?: ReactNode | string;
  children: ReactNode;
  title?: string;
  customWidth?: string;
  handleClose?: () => void;
  renderTrigger?: (onOpen: () => void) => ReactNode;
  renderFooter?: (onClose: () => void) => ReactNode;
}

export function BasicModal({
  triggerType = "button",
  button = "Open Modal",
  children,
  title,
  handleClose,
  renderTrigger,
  renderFooter,
  ...modalProps
}: BasicModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const customClose = () => {
    onClose();
    handleClose?.();
  };

  const defaultRenderTrigger = () => {
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
      {renderTrigger ? renderTrigger(onOpen) : defaultRenderTrigger()}

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
          {renderFooter ? <ModalFooter>{renderFooter(customClose)}</ModalFooter> : null}
        </ModalContent>
      </Modal>
    </>
  );
}
