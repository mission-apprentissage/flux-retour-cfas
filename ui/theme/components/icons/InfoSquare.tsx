import { Icon } from "@chakra-ui/react";
import React from "react";

export function InfoSquare(props) {
  return (
    <Icon width="20" height="20" viewBox="0 0 20 20" {...props}>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M17.5 0.5H2.5C1.39543 0.5 0.5 1.39543 0.5 2.5V17.5C0.5 18.6046 1.39543 19.5 2.5 19.5H17.5C18.6046 19.5 19.5 18.6046 19.5 17.5V2.5C19.5 1.39543 18.6046 0.5 17.5 0.5ZM11 5H9V7H11V5ZM11 9H9V15H11V9Z"
        fill="#000091"
      />
    </Icon>
  );
}
