import React from "react";
import { Flex, Box, Spinner } from "@chakra-ui/react";
import { ErrorIcon, ValidateIcon, Alert, InfoCircle, Warning } from "../../theme/components/icons/index";

const stylesMap = {
  success: { color: "flatsuccess", bg: "white", borderColor: "flatsuccess", borderWidth: 1 },
  error: { color: "flaterror", bg: "galt2" },
  warning: { color: "warning2", bg: "white", borderColor: "warning2", borderWidth: 1 },
  info: { color: "plaininfo", bg: "white", borderColor: "plaininfo", borderWidth: 1 },
  info_clear: { color: "bluefrance", bg: "white" },
  loading: { color: "bluefrance", bg: "white" },
  alert_clear: { color: "flaterror", bg: "white" },
  alert: { color: "flaterror", bg: "white", borderColor: "flaterror", borderWidth: 1 },
  unstyled: { color: "grey", bg: "galt2" },
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
      return <Alert {...rest} />;
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

const Ribbons = ({ variant = "info", oneLiner = true, children, ...rest }) => {
  return (
    <Box {...rest}>
      <Flex
        borderColor={stylesMap[variant].borderColor}
        borderWidth={stylesMap[variant].borderWidth}
        borderLeftWidth={"4px"}
        borderStyle={"solid"}
        bg={stylesMap[variant].bg}
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
          py={3}
        >
          {children}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Ribbons;
