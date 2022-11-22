import React from "react";
import { Flex, Box, Spinner } from "@chakra-ui/react";
import { ErrorIcon, ValidateIcon, Alert, InfoCircle } from "../../theme/components/icons/index";

const colorsMap = {
  success: { color: "flatsuccess", bg: "galt2" },
  error: { color: "flaterror", bg: "galt2" },
  warning: { color: "flatwarm", bg: "galt2" },
  info: { color: "plaininfo", bg: "galt2" },
  info_clear: { color: "bluefrance", bg: "white" },
  alert_clear: { color: "flaterror", bg: "white" },
  unstyled: { color: "grey", bg: "galt2" },
};

const Icon = ({ variant, ...rest }) => {
  switch (variant) {
    case "success":
      return <ValidateIcon {...rest} />;
    case "error":
      return <ErrorIcon {...rest} />;
    case "warning":
      return <Alert {...rest} />;
    case "info_clear":
      return <InfoCircle {...rest} />;
    case "alert_clear":
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
        borderColor={colorsMap[variant].color}
        borderLeftWidth={"4px"}
        borderStyle={"solid"}
        bg={colorsMap[variant].bg}
        py={3}
      >
        {oneLiner && (
          <Flex px={2}>
            <Icon variant={variant} mx="auto" boxSize="6" color={colorsMap[variant].color} mt="0.125rem" />
          </Flex>
        )}
        <Flex color={colorsMap[variant].color} alignItems="center" justifyContent="center" flexDirection="column">
          {children}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Ribbons;
