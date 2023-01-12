import { Icon } from "@chakra-ui/react";
import React from "react";

export function NotificationFill(props) {
  return (
    <Icon viewBox="0 0 24 24" w="24px" h="24px" {...props}>
      <path fill="none" d="M0 0h24v24H0z" />
      <path d="M20 17h2v2H2v-2h2v-7a8 8 0 1 1 16 0v7zM9 21h6v2H9v-2z" fill="currentColor" />
    </Icon>
  );
}
