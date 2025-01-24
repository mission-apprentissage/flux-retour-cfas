import { CloseIcon } from "@chakra-ui/icons";
import { Flex, Box, Spinner, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";

import { ErrorIcon, ValidateIcon, Alert, InfoCircle, Warning } from "@/theme/components/icons/index";

const stylesMap = {
  success: { color: "flatsuccess", bg: "white", borderColor: "flatsuccess", borderWidth: 1 },
  error: { color: "flaterror", bg: "white", borderColor: "flaterror", borderWidth: 1 },
  warning: { color: "warning2", bg: "white", borderColor: "warning2", borderWidth: 1 },
  info: { color: "plaininfo", bg: "white", borderColor: "plaininfo", borderWidth: 1 },
  info_clear: { color: "bluefrance", bg: "white", borderColor: undefined, borderWidth: undefined },
  loading: { color: "bluefrance", bg: "white", borderColor: "bluefrance", borderWidth: 1 },
  alert_clear: { color: "flaterror", bg: "white", borderColor: undefined, borderWidth: undefined },
  alert: { color: "flatwarm", bg: "white", borderColor: "flatwarm", borderWidth: 1 },
  unstyled: { color: "grey", bg: "galt2", borderColor: undefined, borderWidth: undefined },
};

const Icon = ({ variant, ...rest }) => {
  switch (variant) {
    case "success":
      return <ValidateIcon {...rest} />;
    case "error":
      return <ErrorIcon {...rest} />;
    case "warning":
      return <Warning {...rest} />;
    case "info_clear":
      return <InfoCircle {...rest} />;
    case "loading":
      return <Spinner {...rest} />;
    case "alert_clear":
    case "alert":
      return <Alert {...rest} />;
    case "info":
      return <InfoCircle {...rest} />;
    case "unstyled":
      return <Spinner {...rest} />;
    default:
      return <InfoCircle {...rest} />;
  }
};

const Ribbons = ({ variant = "info", oneLiner = true, children, px = 3, py = 3, showClose = false, ...rest }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Box width={2 / 3} {...rest}>
      <Flex
        borderColor={stylesMap[variant].borderColor}
        borderWidth={stylesMap[variant].borderWidth}
        borderLeftWidth={"4px"}
        borderStyle={"solid"}
        bg={stylesMap[variant].bg}
        position="relative"
      >
        {oneLiner && (
          <Box h="auto" py={3} px={2} bg={stylesMap[variant].color}>
            <Icon variant={variant} mx="auto" boxSize="6" color={stylesMap[variant].bg} mt="0.125rem" />
          </Box>
        )}
        <Flex
          flexGrow={1}
          color={stylesMap[variant].color}
          alignItems="flex-start"
          justifyContent="center"
          flexDirection="column"
          py={py || 3}
          pl={px || 3}
          pr={showClose ? 8 : px || 3}
        >
          {children}
        </Flex>
        {showClose && (
          <IconButton
            aria-label="Close ribbon"
            icon={<CloseIcon w={2} h={2} />}
            size="xs"
            position="absolute"
            top={4}
            right={1}
            transform="translateY(-50%)"
            onClick={() => setIsVisible(false)}
            variant="ghost"
            color="black"
          />
        )}
      </Flex>
    </Box>
  );
};

export default Ribbons;
