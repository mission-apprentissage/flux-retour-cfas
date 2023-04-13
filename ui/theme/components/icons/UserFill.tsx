import { Icon } from "@chakra-ui/react";
import React from "react";

export function UserFill(props) {
  return (
    <Icon viewBox="0 0 24 24" width="24" height="24" {...props}>
      <path fill="none" d="M0 0h24v24H0z" />
      <path d="M4 22a8 8 0 1 1 16 0H4zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6z" fill="#000091" />
    </Icon>
  );
}
