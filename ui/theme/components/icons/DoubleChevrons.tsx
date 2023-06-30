import { Icon } from "@chakra-ui/react";
import React from "react";

export function DoubleChevrons(props) {
  return (
    <Icon viewBox="0 0 24 24" width="24px" height="24px" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.95 12L6 7.05L7.414 5.636L13.778 12L7.414 18.364L6 16.95L10.95 12Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.95 12L12 7.05L13.414 5.636L19.778 12L13.414 18.364L12 16.95L16.95 12Z"
        fill="currentColor"
      />
    </Icon>
  );
}
