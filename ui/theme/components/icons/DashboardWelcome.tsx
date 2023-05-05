import { Icon } from "@chakra-ui/react";
import React from "react";

export function DashboardWelcome(props) {
  return (
    <Icon viewBox="0 0 24 24" w="24px" h="24px" {...props}>
      <path
        fill="#000091"
        d="M18 15v5h-2v-5c0-4.451 2.644-8.285 6.447-10.016l.828 1.82A9.002 9.002 0 0 0 18 15ZM8 15v5H6v-5A9.002 9.002 0 0 0 .725 6.805l.828-1.821A11.002 11.002 0 0 1 8 15Zm4-5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      />
    </Icon>
  );
}
