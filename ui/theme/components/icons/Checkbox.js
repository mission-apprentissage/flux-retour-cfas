import { Icon } from "@chakra-ui/react";
import React from "react";

export function Checkbox(props) {
  return (
    <Icon viewBox="0 0 21 21" width="17px" height="17px" {...props}>
      <path
        d="M10.501 20C4.97798 20 0.500977 15.523 0.500977 10C0.500977 4.477 4.97798 0 10.501 0C16.024 0 20.501 4.477 20.501 10C20.501 15.523 16.024 20 10.501 20ZM9.50398 14L16.574 6.929L15.16 5.515L9.50398 11.172L6.67498 8.343L5.26098 9.757L9.50398 14Z"
        fill="currentColor"
      />
    </Icon>
  );
}
