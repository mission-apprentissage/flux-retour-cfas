import { Icon } from "@chakra-ui/react";
import React from "react";

export function InfoLine(props) {
  return (
    <Icon viewBox="0 0 14 14" {...props}>
      <path
        fill="currentColor"
        d="M6.99967 13.6667C3.31767 13.6667 0.333008 10.682 0.333008 7.00004C0.333008 3.31804 3.31767 0.333374 6.99967 0.333374C10.6817 0.333374 13.6663 3.31804 13.6663 7.00004C13.6663 10.682 10.6817 13.6667 6.99967 13.6667ZM6.99967 12.3334C9.94519 12.3334 12.333 9.94556 12.333 7.00004C12.333 4.05452 9.94519 1.66671 6.99967 1.66671C4.05416 1.66671 1.66634 4.05452 1.66634 7.00004C1.66634 9.94556 4.05416 12.3334 6.99967 12.3334ZM6.33301 3.66671H7.66634V5.00004H6.33301V3.66671ZM6.33301 6.33337H7.66634V10.3334H6.33301V6.33337Z"
      />
    </Icon>
  );
}