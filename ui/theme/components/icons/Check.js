import React from "react";
import { Icon } from "@chakra-ui/react";

export function Check({ isIndeterminate, isChecked, ...props }) {
  return (
    <Icon viewBox="0 0 20 20" w="5" h="5" {...props}>
      <rect width="20" height="20" rx="4" fill="#000091" />
      <path
        d="M8.88892 11.7613L13.9956 6.65405L14.7817 7.43961L8.88892 13.3324L5.35336 9.79683L6.13892 9.01127L8.88892 11.7613Z"
        fill="white"
      />
    </Icon>
  );
}
