import { Icon } from "@chakra-ui/react";
import React from "react";

export function CloseCircle(props) {
  return (
    <Icon width="18" height="18" viewBox="0 0 18 18" {...props}>
      <path
        fill="currentColor"
        d="M9 16.5a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-8.56L6.879 5.817 5.818 6.879 7.94 9l-2.122 2.121 1.061 1.061L9 10.06l2.121 2.122 1.061-1.061L10.06 9l2.122-2.121-1.061-1.061L9 7.94Z"
      />
    </Icon>
  );
}
