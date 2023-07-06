import { Icon } from "@chakra-ui/react";
import React from "react";

export function Info(props) {
  return (
    <Icon viewBox="0 0 20 20" {...props}>
      <path
        d="M10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20ZM9 9V15H11V9H9ZM9 5V7H11V5H9Z"
        fill="currentColor"
      />
    </Icon>
  );
}
